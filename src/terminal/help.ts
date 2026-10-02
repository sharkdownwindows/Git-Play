export const HELP_LINES = [
  "GitPlay supports a focused subset of Git:",
  '  git commit [-m "<message>"]',
  "  git branch [<name>]",
  "  git switch <branch>",
  "  git switch -c <branch>",
  "  git switch --detach <commit>",
  "  git checkout <branch-or-commit>",
  "  git checkout -b <branch>",
  "  git merge <branch>",
  "Open the Reference tab for examples and visual explanations.",
] as const;

/** Return terminal help for the two supported built-in forms. */
export function helpForInput(input: string): readonly string[] | null {
  const normalized = input.trim().split(/\s+/).join(" ");
  return normalized === "git --help" || normalized === "git help"
    ? HELP_LINES
    : null;
}
