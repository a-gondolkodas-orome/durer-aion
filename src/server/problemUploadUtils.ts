import { parse } from 'smol-toml';
import { extname } from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { readFileSync } from 'fs';

export interface RelayProblem {
  category: string;
  index: number;
  problemText: string;
  answer: number | string;
  points: number;
  attachment?: string;
}

function validateProblem(problem: any, index: number, category: string, imgNames: string[]): asserts problem is RelayProblem {
  const errPrefix = `Problem at index ${index} in category ${category} `;
  if (typeof problem !== 'object' || problem === null) {
    throw new Error(errPrefix + `is not an object.`);
  }
  const problemKeys = Object.keys(problem);
  if (!problemKeys.includes('problemText') || typeof problem.problemText !== 'string') {
    throw new Error(errPrefix + `is missing 'problemText' or it is not a string.`);
  }
  if (!problemKeys.includes('answer') || (typeof problem['answer'] !== 'string' && typeof problem['answer'] !== 'number')) {
    throw new Error(errPrefix + `is missing 'answer' or it is not a string or number.`);
  }
  if (!problemKeys.includes('points') || typeof problem['points'] !== 'number') {
    throw new Error(errPrefix + `is missing 'points' or it is not a number.`);
  }
  if (problemKeys.includes('attachment') && typeof problem['attachment'] !== 'string') {
    throw new Error(errPrefix + `field 'attachment' is not a string.`);
  }
  if (problemKeys.includes('attachment') && !imgNames.includes(problem['attachment'])) {
    throw new Error(errPrefix + `has a missing 'attachment': ${problem['attachment']}. Expected one of: ${imgNames.join(', ')}.`);
  }
  problemKeys.forEach(key => {
    if (!['problemText', 'answer', 'points', 'attachment', 'category', 'index'].includes(key)) {
      throw new Error(errPrefix + `has an unexpected key: ${key}. Expected keys are: problemText, answer, points, attachment.`);
    }
  });
}

export function parseProblemTOML(tomlString: string, imgNames: string[]): RelayProblem[] {
  const parsedData = parse(tomlString);
  const categories = Object.keys(parsedData);
  if (categories.length === 0) {
    throw new Error("Empty TOML.");
  }
  let parsedProblems: RelayProblem[] = [];

  categories.forEach(category => {
    validateProblemCategory(category);

    const problems = parsedData[category];
    if (!Array.isArray(problems)) {
      throw new Error(`Category ${category} should contain an array of problems (e.g. [[C]]).`);
    }

    problems.forEach((problem, index) => {
      problem = {
        ...problem as object,
        category: category,
        index: index,
      }
      validateProblem(problem, index, category, imgNames); // asserts problem is RelayProblem
      parsedProblems.push(problem);
    });
  });
  return parsedProblems;
}

function getS3Url(fileName: string): string {
  const bucketName = process.env.PROBLEMS_S3_BUCKET_NAME!;
  return `https://${bucketName}.s3.amazonaws.com/${fileName}`;
}

export async function uploadToS3(filePath: string, fileName: string, contentType: string): Promise<string> {
  const s3Client = new S3Client({
    region: process.env.PROBLEMS_S3_REGION || 'eu-north-1',
    credentials: {
      accessKeyId: process.env.PROBLEMS_S3_KEY_ID!,
      secretAccessKey: process.env.PROBLEMS_S3_SECRET_KEY!,
    },
  });

  const bucketName = process.env.PROBLEMS_S3_BUCKET_NAME!;
  const fileContent = readFileSync(filePath);

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: fileName,
    Body: fileContent,
    ContentType: contentType,
  });

  await s3Client.send(command);

  return getS3Url(fileName);
}

// Helper function to extract and validate uploaded files
export function extractUploadedFiles(files: any): { tomlFile: any; imageFiles: any[] } {
  // Handle both single file and multiple files cases
  let fileList: any[] = [];
  if (files.file) {
    fileList = Array.isArray(files.file) ? files.file : [files.file];
  } else {
    // Handle case where files are uploaded with different field names
    fileList = Object.values(files).flat();
  }

  if (fileList.length === 0) {
    throw new Error('No files uploaded!');
  }

  // Separate TOML and image files
  let tomlFile: any = null;
  const imageFiles: any[] = [];
  const allowedImageExtensions = ['.png', '.jpg', '.jpeg', '.gif'];

  for (const file of fileList) {
    const ext = extname(file.name || '').toLowerCase();
    
    if (ext === '.toml') {
      if (tomlFile) {
        throw new Error('Multiple TOML files are not allowed. Please upload only one TOML file.');
      }
      tomlFile = file;
    } else if (allowedImageExtensions.includes(ext)) {
      imageFiles.push(file);
    } else {
      throw new Error(`Invalid file format: ${file.name}. Only TOML files and image files (.png, .jpg, .jpeg, .gif) are allowed.`);
    }
  }

  if (!tomlFile) {
    throw new Error('TOML file is required.');
  }

  return { tomlFile, imageFiles };
}

export async function uploadImagesS3(imageFiles: any[]): Promise<{ name: string; s3Url: string }[]> {
  const uploadedImages: { name: string; s3Url: string }[] = [];
  
  for (const imageFile of imageFiles) {
    const contentType = `image/${extname(imageFile.name).slice(1)}`;
    const s3Url = await uploadToS3(imageFile.path, 'images/' + imageFile.name, contentType);
    uploadedImages.push({ name: imageFile.name, s3Url });
  }

  return uploadedImages;
}

export function validateProblemCategory(category: string): void {
  const validCategories = ['C', 'D', 'E'];
  if (!validCategories.includes(category)) {
    throw new Error(`Invalid category: ${category}. Valid categories are: ${validCategories.join(', ')}`);
  }
}

export function formatProblemsWithAttachments(problems: any[]): any[] {
  return problems.map(problem => ({
    category: problem.category,
    index: problem.index,
    problemText: problem.problemText,
    answer: problem.answer,
    points: problem.points,
    attachment: problem.attachment ? {
      filename: problem.attachment,
      url: getS3Url(`images/${problem.attachment}`)
    } : null
  }));
}

