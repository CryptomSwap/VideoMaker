import type {Placement, Project} from "../../pipeline/schema";

export type Box = {
  left: number;
  top: number;
  width: number;
  height: number;
  textAlign: "left" | "center" | "right";
};

export const resolvePlacement = (
  project: Project,
  placement: Placement,
): Box => {
  const width = placement.width * project.width;
  const height = placement.height * project.height;
  let left = placement.x * project.width;
  let top = placement.y * project.height;
  const {safeArea} = project;

  const centerX =
    placement.anchor === "top-center" ||
    placement.anchor === "center" ||
    placement.anchor === "bottom-center";
  const bottom =
    placement.anchor === "bottom-center" || placement.anchor === "bottom-left";
  const middleY = placement.anchor === "center";

  if (centerX) {
    left -= width / 2;
  }
  if (bottom) {
    top -= height;
  } else if (middleY) {
    top -= height / 2;
  }

  if (placement.safeInset) {
    const maxLeft = Math.max(safeArea.left, project.width - safeArea.right - width);
    const maxTop = Math.max(safeArea.top, project.height - safeArea.bottom - height);
    left = Math.min(Math.max(left, safeArea.left), maxLeft);
    top = Math.min(Math.max(top, safeArea.top), maxTop);
  }

  return {
    left,
    top,
    width,
    height,
    textAlign: centerX ? "center" : "left",
  };
};
