import { extname } from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { readFileSync } from 'fs';
import { S3ClientConfig } from '@aws-sdk/client-s3';
import { getS3Url } from 'game';

interface UploadedFile {
  originalFilename?: string | null;
  name?: string | null;
  filename?: string | null;
  filepath?: string;
  path?: string;
}

function getUploadedFileName(file: UploadedFile): string {
  const name = file?.originalFilename ?? file?.name ?? file?.filename;
  return typeof name === 'string' ? name : '';
}

function getUploadedFilePath(file: UploadedFile): string {
  const filePath = file?.filepath ?? file?.path;
  if (typeof filePath !== 'string' || filePath.length === 0) {
    throw new Error('Uploaded file is missing a filepath.');
  }
  return filePath;
}

function imageContentTypeFromFileName(fileName: string): string {
  const ext = extname(fileName).toLowerCase();
  switch (ext) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.gif':
      return 'image/gif';
    default:
      return 'application/octet-stream';
  }
}

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} environment variable is required`);
  }
  return value;
}

function getS3Config(): S3ClientConfig {
  return {
    region: process.env.PROBLEMS_S3_REGION || 'eu-north-1',
    credentials: {
      accessKeyId: requireEnv('PROBLEMS_S3_KEY_ID'),
      secretAccessKey: requireEnv('PROBLEMS_S3_SECRET_KEY'),
    },
  };
}

export async function uploadToS3(filePath: string, fileName: string, contentType: string): Promise<string> {
  const s3Client = new S3Client(getS3Config());

  const fileContent = readFileSync(filePath);
  const command = new PutObjectCommand({
    Bucket: requireEnv('PROBLEMS_S3_BUCKET_NAME'),
    Key: fileName,
    Body: fileContent,
    ContentType: contentType,
  });

  await s3Client.send(command);
  return getS3Url(fileName, requireEnv('PROBLEMS_S3_BUCKET_NAME'));
}

// Helper function to extract and validate uploaded files
export function extractUploadedFiles(files: Record<string, UploadedFile | UploadedFile[]>): { tomlFile: UploadedFile; imageFiles: UploadedFile[] } {
  // Handle both single file and multiple files cases
  let fileList: UploadedFile[] = [];
  if (files.file) {
    fileList = Array.isArray(files.file) ? files.file : [files.file];
  } else {
    // Handle case where files are uploaded with different field names
    fileList = (Object.values(files).flat() as UploadedFile[]);
  }

  if (fileList.length === 0) {
    throw new Error('No files uploaded!');
  }

  // Separate TOML and image files
  let tomlFile: UploadedFile | null = null;
  const imageFiles: UploadedFile[] = [];
  const allowedImageExtensions = ['.png', '.jpg', '.jpeg', '.gif'];

  for (const file of fileList) {
    const name = getUploadedFileName(file);
    if (!name) {
      throw new Error('Invalid uploaded file: missing filename (expected originalFilename).');
    }

    // Ensure we can later read it; fail early with a clear error.
    getUploadedFilePath(file);

    const ext = extname(name).toLowerCase();
    
    if (ext === '.toml') {
      if (tomlFile) {
        throw new Error('Multiple TOML files are not allowed. Please upload only one TOML file.');
      }
      tomlFile = file;
    } else if (allowedImageExtensions.includes(ext)) {
      imageFiles.push(file);
    } else {
      throw new Error(`Invalid file format: ${name}. Only TOML files and image files (.png, .jpg, .jpeg, .gif) are allowed.`);
    }
  }

  if (!tomlFile) {
    throw new Error('TOML file is required.');
  }

  return { tomlFile, imageFiles };
}

export async function uploadImagesS3(imageFiles: UploadedFile[]): Promise<{ name: string; s3Url: string }[]> {
  const uploadedImages: { name: string; s3Url: string }[] = [];
  
  for (const imageFile of imageFiles) {
    const name = getUploadedFileName(imageFile);
    const filePath = getUploadedFilePath(imageFile);
    const contentType = imageContentTypeFromFileName(name);
    const s3Url = await uploadToS3(filePath, 'images/' + name, contentType);
    uploadedImages.push({ name, s3Url });
  }

  return uploadedImages;
}

export function getUploadedFileInfo(file: UploadedFile): { name: string; filePath: string } {
  const name = getUploadedFileName(file);
  if (!name) {
    throw new Error('Invalid uploaded file: missing filename (expected originalFilename).');
  }
  const filePath = getUploadedFilePath(file);
  return { name, filePath };
}

