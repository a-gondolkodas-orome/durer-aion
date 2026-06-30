import { RelayProblem } from "game";
import { parseProblemTOML } from "game";

export function requireEnv(name: string): string {
  const value = (import.meta.env as Record<string, string | undefined>)[`VITE_${name}`];
  if (!value) {
    throw new Error(`VITE_${name} environment variable is required`);
  }
  return value;
}

function getS3BaseUrl(): string {
  const bucket = requireEnv("PROBLEMS_S3_BUCKET_NAME");
  const region = import.meta.env.VITE_PROBLEMS_S3_REGION || 'eu-north-1';
  return `https://${bucket}.s3.${region}.amazonaws.com`;
}

async function S3DownloadText(filename: string): Promise<string> {
  const url = `${getS3BaseUrl()}/${filename}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download "${filename}" from S3: ${response.status} ${response.statusText}`);
  }
  return response.text();
}

async function getImageNames(): Promise<string[]> {
  const url = `${getS3BaseUrl()}/?list-type=2&prefix=images/`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to list images from S3: ${response.status} ${response.statusText}`);
  }
  const xml = await response.text();
  return [...xml.matchAll(/<Key>images\/([^<]+)<\/Key>/g)].map(m => m[1]);
}

export async function getProblems(category: 'C' | 'D' | 'E'): Promise<RelayProblem[]> {
  const cached = localStorage.getItem("problemsData");
  const bucket = requireEnv("PROBLEMS_S3_BUCKET_NAME");

  let problems: RelayProblem[];

  if (cached) {
    const { text, imgNames } = JSON.parse(cached);
    problems = parseProblemTOML(text, imgNames, bucket);
  } else {
    const [text, imgNames] = await Promise.all([
      S3DownloadText("problems.toml"),
      getImageNames(),
    ]);
    problems = parseProblemTOML(text, imgNames, bucket);
    localStorage.setItem("problemsData", JSON.stringify({ text, imgNames }));
  }

  return problems.filter(problem => problem.category === category);
}