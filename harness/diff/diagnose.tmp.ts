import { generateRandomSequences } from "./generate";
import { runEngine, commandText } from "./adapter";
import { runDifferential } from "./run";
import { runReal } from "./runReal";

const cases = generateRandomSequences(5000, 42);
const duplicates: { index: number; commands: string[]; messages: string[] }[] = [];
for (const [index, testCase] of cases.entries()) {
  const commits = Object.values(runEngine(testCase.commands).state.commits);
  const messages = commits.map((commit) => commit.message);
  if (new Set(messages).size !== messages.length) {
    duplicates.push({ index, commands: testCase.commands.map(commandText), messages });
  }
}
console.log(JSON.stringify({ total: cases.length, duplicateCases: duplicates.length,
  first: duplicates.slice(0, 5) }, null, 2));
const first = cases[duplicates[0]!.index]!;
const result = runDifferential(0, runEngine, runReal, [first]);
console.log(JSON.stringify({ firstFailure: result.summary, hard: result.divergences.filter((item) => item.severity === "hard") }, null, 2));
const minimal = [
  { kind: "commit" as const, message: "root" },
  { kind: "branch" as const, name: "feature" },
  { kind: "commit" as const, message: "main" },
  { kind: "switch" as const, target: "feature", detach: false, create: false },
  { kind: "commit" as const, message: "feature" },
  { kind: "merge" as const, branch: "main" },
  { kind: "checkout" as const, target: "c1", create: false },
  { kind: "commit" as const, message: "detached" },
  { kind: "merge" as const, branch: "main" },
];
const minimalResult = runDifferential(0, runEngine, runReal,
  [{ fixture: "minimal", setupLength: 0, suffix: minimal, commands: minimal }]);
console.log(JSON.stringify({ minimal: minimal.map(commandText), summary: minimalResult.summary,
  hard: minimalResult.divergences.filter((item) => item.severity === "hard") }, null, 2));
