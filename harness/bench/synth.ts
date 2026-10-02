import { emptyState, type RepoState } from "../../src/core/types";

/** Build a reproducible Git DAG for layout benchmarks. */
export function generateSyntheticDag(n: number, seed: number): RepoState {
  if (!Number.isSafeInteger(n) || n < 0) {
    throw new RangeError("n must be a non-negative safe integer");
  }
  if (!Number.isSafeInteger(seed)) {
    throw new RangeError("seed must be a safe integer");
  }

  const state = emptyState();
  let randomState = seed >>> 0;
  const nextRandom = (): number => {
    randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0;
    return randomState;
  };

  for (let i = 0; i < n; i++) {
    const id = `c${i}`;
    let parents: string[];
    if (i === 0) {
      parents = [];
    } else if (i % 4 === 2) {
      // Fork from a recent ancestor of the main line.
      const offset = i === 2 ? 2 : 2 + (nextRandom() >>> 31);
      parents = [`c${i - offset}`];
    } else if (i % 4 === 3) {
      // Rejoin the main line with first-parent order preserved.
      parents = [`c${i - 2}`, `c${i - 1}`];
    } else {
      parents = [`c${i - 1}`];
    }

    state.commits[id] = {
      id,
      message: `commit ${i}`,
      parents,
      timestamp: "2020-01-01T00:00:00.000Z",
    };
  }

  if (n > 0) state.branches.main = `c${n - 1}`;
  return state;
}
