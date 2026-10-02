import type { RepoState } from "../core/types";
import { GraphView } from "./GraphView";

interface Props {
  state: RepoState;
  width?: number;
  height?: number;
  changed?: ReadonlySet<string>;
  changedEdges?: ReadonlySet<string>;
  parentLabels?: boolean;
}

/** Shares GraphView's layout, nodes, edges and ref labels. */
export function MiniGraph({ state, width, height, changed, changedEdges, parentLabels = false }: Props) {
  return (
    <GraphView
      state={state}
      width={width}
      height={height}
      presentation="practice"
      scale={1.2}
      changed={changed}
      changedEdges={changedEdges}
      parentLabels={parentLabels}
    />
  );
}
