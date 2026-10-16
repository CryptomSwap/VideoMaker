import {staticFile} from "remotion";
import {assetUrl, projectFileUrl} from "./paths";
import {parseProject, type Project} from "./schema";
import {validateProject, type ValidationReport} from "./validate";

export const fetchProject = async (projectId: string): Promise<Project> => {
  const response = await fetch(staticFile(projectFileUrl(projectId)));
  if (!response.ok) {
    throw new Error(
      `Could not load project "${projectId}" (${response.status}). Expected ${projectFileUrl(projectId)} in public/.`,
    );
  }

  return parseProject(await response.json());
};

export const fetchAndValidateProject = async (
  projectId: string,
): Promise<{project: Project; report: ValidationReport}> => {
  const project = await fetchProject(projectId);
  const report = await validateProject(project, async (relativeSrc) => {
    const response = await fetch(staticFile(assetUrl(projectId, relativeSrc)));
    return response.ok;
  });
  return {project, report};
};

export const projectAssetSrc = (projectId: string, relativeSrc: string): string => {
  return staticFile(assetUrl(projectId, relativeSrc));
};
