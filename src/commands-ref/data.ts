import type { CommandKind, Commit, RepoState } from "../core/types";

export interface CommandReference {
  key: CommandKind;
  syntax: string;
  description: string;
  effect: string;
  gotcha: string;
  before: RepoState;
  after: RepoState;
}

const c1: Commit = {
  id: "c1", message: "first", parents: [], timestamp: "2020-01-01T00:00:00.000Z",
};
const c2: Commit = {
  id: "c2", message: "next", parents: ["c1"], timestamp: "2020-01-01T00:00:02.000Z",
};
const c3: Commit = {
  id: "c3", message: "feature", parents: ["c1"], timestamp: "2020-01-03T00:00:00.000Z",
};
const c4: Commit = {
  id: "c4", message: "Merge branch 'feature'", parents: ["c2", "c3"],
  timestamp: "2020-01-01T00:00:04.000Z",
};

function sampleState(
  commits: RepoState["commits"],
  branches: RepoState["branches"],
  head: RepoState["head"],
): RepoState {
  return {
    commits,
    branches,
    head,
    snapshot: null,
    workingTree: null,
    index: null,
    conflicts: null,
  };
}

export const commandReferences: readonly CommandReference[] = [
  {
    key: "commit",
    syntax: 'git commit -m "next"',
    description: "Create a new commit on the current line of history.",
    effect: "The new commit points to the current commit, and the attached branch moves to it.",
    gotcha: "On a detached HEAD, a commit moves HEAD rather than a branch.",
    before: sampleState({ c1 }, { main: "c1" }, { detached: false, ref: "main", commit: null }),
    after: sampleState({ c1, c2 }, { main: "c2" }, { detached: false, ref: "main", commit: null }),
  },
  {
    key: "branch",
    syntax: "git branch feature",
    description: "Create a branch named feature at the current commit.",
    effect: "The new branch points to the current commit while HEAD stays on main.",
    gotcha: "Creating a branch does not switch to it.",
    before: sampleState({ c1 }, { main: "c1" }, { detached: false, ref: "main", commit: null }),
    after: sampleState({ c1 }, { main: "c1", feature: "c1" }, { detached: false, ref: "main", commit: null }),
  },
  {
    key: "switch",
    syntax: "git switch feature",
    description: "Switch the working position to an existing branch.",
    effect: "HEAD attaches to feature without changing commits or branch pointers.",
    gotcha: "Switching to a commit requires --detach.",
    before: sampleState(
      { c1, c2 }, { main: "c2", feature: "c1" },
      { detached: false, ref: "main", commit: null },
    ),
    after: sampleState(
      { c1, c2 }, { main: "c2", feature: "c1" },
      { detached: false, ref: "feature", commit: null },
    ),
  },
  {
    key: "checkout",
    syntax: "git checkout c1",
    description: "Check out a commit directly to inspect its history.",
    effect: "HEAD detaches at c1 while branch pointers stay in place.",
    gotcha: "New commits from detached HEAD do not advance main.",
    before: sampleState({ c1, c2 }, { main: "c2" }, { detached: false, ref: "main", commit: null }),
    after: sampleState({ c1, c2 }, { main: "c2" }, { detached: true, ref: null, commit: "c1" }),
  },
  {
    key: "merge",
    syntax: "git merge feature",
    description: "Merge the feature branch into the current branch.",
    effect: "A new commit records main as its first parent and feature as its second parent.",
    gotcha: "Parent order matters: the current commit is the first parent.",
    before: sampleState(
      { c1, c2, c3 }, { main: "c2", feature: "c3" },
      { detached: false, ref: "main", commit: null },
    ),
    after: sampleState(
      { c1, c2, c3, c4 }, { main: "c4", feature: "c3" },
      { detached: false, ref: "main", commit: null },
    ),
  },
];
