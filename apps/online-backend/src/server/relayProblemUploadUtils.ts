import { extname } from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { readFileSync } from 'fs';
import { S3ClientConfig } from '@aws-sdk/client-s3';
import { getS3Url } from 'strategy';

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

