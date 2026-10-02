import type { CommandKind, Head } from "../core/types";

/** Commit graph used by level data. IDs are local labels, not identities. */
export interface RepoShape {
  parents: Record<string, string[]>;
  branches: Record<string, string>;
  head: Head;
}

export interface Level {
  id: string;
  order: number;
  title: string;
  goal: string;
  initial: RepoShape;
  target: RepoShape | null;
  allowed: CommandKind[];
}
