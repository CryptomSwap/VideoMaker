import fs from "node:fs";
import path from "node:path";
import type {GenerationJobRecord, GenerationStatus} from "./types";

export const jobsRoot = (workspaceRoot: string): string => {
  return path.join(workspaceRoot, "var", "generation-jobs");
};

const jobPath = (workspaceRoot: string, localJobId: string): string => {
  return path.join(jobsRoot(workspaceRoot), `${localJobId}.json`);
};

export const ensureJobsDir = (workspaceRoot: string): void => {
  fs.mkdirSync(jobsRoot(workspaceRoot), {recursive: true});
};

export const readJob = (
  workspaceRoot: string,
  localJobId: string,
): GenerationJobRecord => {
  const filePath = jobPath(workspaceRoot, localJobId);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Generation job not found: ${localJobId}`);
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as GenerationJobRecord;
};

export const writeJob = (
  workspaceRoot: string,
  job: GenerationJobRecord,
): void => {
  ensureJobsDir(workspaceRoot);
  fs.writeFileSync(jobPath(workspaceRoot, job.localJobId), `${JSON.stringify(job, null, 2)}\n`);
};

export const listJobs = (workspaceRoot: string): GenerationJobRecord[] => {
  const dir = jobsRoot(workspaceRoot);
  if (!fs.existsSync(dir)) {
    return [];
  }
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith(".json"))
    .map((name) => {
      return JSON.parse(
        fs.readFileSync(path.join(dir, name), "utf8"),
      ) as GenerationJobRecord;
    });
};

export const findJobsByFingerprint = (
  workspaceRoot: string,
  fingerprint: string,
): GenerationJobRecord[] => {
  return listJobs(workspaceRoot).filter((job) => job.fingerprint === fingerprint);
};

export const touchJob = (
  workspaceRoot: string,
  localJobId: string,
  patch: Partial<GenerationJobRecord>,
): GenerationJobRecord => {
  const job = readJob(workspaceRoot, localJobId);
  const next: GenerationJobRecord = {
    ...job,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  writeJob(workspaceRoot, next);
  return next;
};

export const isBlockingStatus = (status: GenerationStatus): boolean => {
  return (
    status === "submitting" ||
    status === "queued" ||
    status === "running" ||
    status === "submission-unknown" ||
    status === "poll-timed-out" ||
    status === "succeeded"
  );
};
