import type { CommandKind } from "../../core/types";
import type { Level } from "../schema";
import first from "./01-first-commit.json";
import branching from "./02-branching.json";
import switchVsCheckout from "./03-switch-vs-checkout.json";
import detachedHead from "./04-detached-head.json";
import recoverDetached from "./05-recover-detached.json";
import fastForward from "./06-fast-forward.json";
import mergeCommit from "./07-merge-commit.json";
import ffVsNoFf from "./08-ff-vs-no-ff.json";

export const levels: readonly Level[] = [first, branching, switchVsCheckout, detachedHead,
  recoverDetached, fastForward, mergeCommit, ffVsNoFf].map(
  (level) => ({ ...level, allowed: level.allowed as CommandKind[] }),
);
