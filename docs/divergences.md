# Differential divergence log

## Run metadata

Commit SHA: e54086e98a9eb7ded02c0a2ded61655f94e66a0d
Git version: git version 2.43.0
Seed: 42
Exhaustive depth: 3
Cases: 6160
Hard failures: 0
Output warnings: 19806
Alphabet size: 15
Fixtures: empty (setup 0), fork (setup 5)

Setup commands do not count toward exhaustive depth. Output warnings are a soft gate.

## Hard divergences

No hard divergences observed; no harness-detected hard divergence has a verified fixing commit.

## Soft output differences

### branch (3979 warnings)

Representative command sequence:
```text
git commit --allow-empty -m C2
git branch -- feature
git branch
```

Expected (Git):
```text
feature
* main
```

Actual (GitScope):
```text
  feature
* main
```

Grouped by the command producing the output difference; other wording may differ within this group.

### checkout (6125 warnings)

Representative command sequence:
```text
git commit --allow-empty -m C2
git checkout c1
```

Expected (Git):
```text
Note: switching to '9a9d5a8a3c036626161f264c56e069580ae32b1d'.

You are in 'detached HEAD' state. You can look around, make experimental
changes and commit them, and you can discard any commits you make in this
state without impacting any branches by switching back to a branch.

If you want to create a new branch to retain commits you create, you may
do so (now or later) by using -c with the switch command. Example:

  git switch -c <new-branch-name>

Or undo this operation with:

  git switch -

Turn off this advice by setting config variable advice.detachedHead to false

HEAD is now at 9a9d5a8 C2
```

Actual (GitScope):
```text
Note: switching to 'c1'.
You are in 'detached HEAD' state.
```

Grouped by the command producing the output difference; other wording may differ within this group.

### commit (6125 warnings)

Representative command sequence:
```text
git commit --allow-empty -m C2
```

Expected (Git):
```text
[main (root-commit) 9a9d5a8] C2
```

Actual (GitScope):
```text
[main (root-commit) c1] C2
```

Grouped by the command producing the output difference; other wording may differ within this group.

### merge (1973 warnings)

Representative command sequence:
```text
git commit --allow-empty -m C0
git branch -- feature
git switch -- feature
git commit --allow-empty -m C1
git checkout main
git merge -m "Merge branch 'feature'" -- feature
```

Expected (Git):
```text
Updating b2832ce..826797c
Fast-forward (no commit created; -m option ignored)
```

Actual (GitScope):
```text
Updating c1..c2
Fast-forward
```

Grouped by the command producing the output difference; other wording may differ within this group.

### switch (1175 warnings)

Representative command sequence:
```text
git commit --allow-empty -m C0
git branch -- feature
git switch -- feature
git commit --allow-empty -m C1
git checkout main
git checkout c1
git switch -- feature
```

Expected (Git):
```text
Previous HEAD position was b2832ce C0
Switched to branch 'feature'
```

Actual (GitScope):
```text
Switched to branch 'feature'
```

Grouped by the command producing the output difference; other wording may differ within this group.
