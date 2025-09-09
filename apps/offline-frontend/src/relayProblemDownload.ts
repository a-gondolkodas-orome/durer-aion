import { RelayProblem } from "game";
import { S3Client, S3ClientConfig, GetObjectCommand, ListObjectsV2Command, NoSuchKey, S3ServiceException } from "@aws-sdk/client-s3";
import { parseProblemTOML } from "strategy";

export function requireEnv(name: string): string {
  const value = process.env[`REACT_APP_${name}`];
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
  }
}

const s3 = new S3Client(getS3Config());
const S3BucketName = requireEnv("PROBLEMS_S3_BUCKET_NAME");

async function S3DownloadText(filename: string): Promise<string> {
  try {
    const response = await s3.send(
      new GetObjectCommand({
        Bucket: S3BucketName,
        Key: filename,
      })
    );

    if (!response.Body) {
      throw new Error(`S3 object "${filename}" has no Body`);
    }

    return response.Body.transformToString();
  } catch (caught) {
    if (caught instanceof NoSuchKey) {
      console.error(
        `Error: S3 object "${filename}" not found in bucket ${requireEnv("PROBLEMS_S3_BUCKET_NAME")}.`
      );
    } else if (caught instanceof S3ServiceException) {
      console.error(
        `Error from S3 while getting object "${filename}". ${caught.name}: ${caught.message}`
      );
    } else {
      console.error("Unexpected error while downloading from S3:", caught);
    }
    throw caught;
  }
}

async function getImageNames(bucket: string): Promise<string[]> {
  // Ensure folder ends with a slash
  const prefix = "images/";

  const command = new ListObjectsV2Command({
    Bucket: bucket,
    Prefix: prefix,
  });

  try {
    const response = await s3.send(command);

    const files = (response.Contents || []).map(obj => obj.Key!);

    return files;
  } catch (err) {
    console.error("Error listing objects", err);
    throw err;
  }
}

export async function getProblems(category: 'C' | 'D' | 'E'): Promise<RelayProblem[]> {
  const cached = localStorage.getItem("problemsData");

  let problems: RelayProblem[];

  if (cached) {
    const { text, imgNames } = JSON.parse(cached);
    problems = parseProblemTOML(text, imgNames, S3BucketName);
  } else {
    const text = await S3DownloadText("problems.toml");
    const imgNames = await getImageNames(S3BucketName);

    
    problems = parseProblemTOML(text, imgNames, S3BucketName);

    localStorage.setItem("problemsData", JSON.stringify({ text, imgNames }));
  }

  return problems.filter(problem => problem.category === category);
}