export const PROJECTS_PUBLIC_SEGMENT = "projects";

export const projectPublicDir = (projectId: string): string => {
  return `${PROJECTS_PUBLIC_SEGMENT}/${projectId}`;
};

export const projectFileUrl = (projectId: string): string => {
  return `${projectPublicDir(projectId)}/project.json`;
};

export const assetUrl = (projectId: string, relativeSrc: string): string => {
  return `${projectPublicDir(projectId)}/${relativeSrc}`;
};
