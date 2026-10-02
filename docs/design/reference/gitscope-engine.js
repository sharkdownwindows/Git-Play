// GitScope prototype engine: mini Git model (commit/branch/switch/checkout/merge), layout, level check, data.
(function () {
  const KNOWN = ["commit", "branch", "switch", "checkout", "merge"];
  const clone = (r) => JSON.parse(JSON.stringify(r));
  const empty = () => ({ commits: {}, branches: {}, head: { detached: false, ref: "main", commit: null }, seq: 1 });
  function fromShape(shape) {
    const r = empty();
    Object.entries(shape.parents).forEach(([id, p], i) => { r.commits[id] = { id, parents: [...p], msg: "seed " + i }; });
    r.branches = { ...shape.branches }; r.head = { ...shape.head };
    r.seq = Object.keys(r.commits).length + 1;
    return r;
  }
  const headCommit = (r) => (r.head.detached ? r.head.commit : r.branches[r.head.ref] ?? null);
  function isAnc(r, a, b) { // a ancestor-or-equal of b
    const seen = new Set(), st = [b];
    while (st.length) { const x = st.pop(); if (x === a) return true; if (seen.has(x)) continue; seen.add(x); (r.commits[x]?.parents || []).forEach((p) => st.push(p)); }
    return false;
  }
  const resolve = (r, n) => (n in r.branches ? r.branches[n] : r.commits[n] ? n : null);
  function nextId(r) { let n = r.seq; while (r.commits["c" + n]) n++; r.seq = n + 1; return "c" + n; }
  const validName = (n) => /^[A-Za-z0-9._\/-]+$/.test(n) && !n.startsWith("-");
  function lev(a, b) { const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]); for (let j = 1; j <= b.length; j++) d[0][j] = j; for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[a.length][b.length]; }
  function tokenize(line) { const out = []; const re = /"([^"]*)"|'([^']*)'|(\S+)/g; let m; while ((m = re.exec(line))) out.push(m[1] ?? m[2] ?? m[3]); return out; }

  function run(repo, line, allowed) {
    const t = tokenize(line.trim());
    const fail = (lines, sub) => ({ repo, out: lines, err: true, changed: false, sub });
    if (!t.length) return fail([]);
    if (t[0] !== "git") return fail([`${t[0]}: command not found. Commands start with "git", e.g. git commit -m "first"`]);
    if (t.length < 2) return fail(["usage: git <command> [<args>]  ·  commands: " + KNOWN.join(", ")]);
    const sub = t[1], a = t.slice(2);
    if (!KNOWN.includes(sub)) {
      const near = KNOWN.filter((k) => lev(k, sub) <= 2);
      return fail([`git: '${sub}' is not a git command.`, ...(near.length ? [`The most similar command is '${near[0]}'.`] : [])], sub);
    }
    if (allowed && !allowed.includes(sub)) return fail([`${sub} is not available in this level.`, `Allowed here: ${allowed.join(", ")}`], sub);
    const r = clone(repo);
    const ok = (out, newId) => ({ repo: r, out, err: false, changed: true, sub, newId });
    const same = (out) => ({ repo, out, err: false, changed: false, sub });
    const hc = headCommit(r);
    const attach = (n) => { r.head = { detached: false, ref: n, commit: null }; };
    const detach = (id) => { r.head = { detached: true, ref: null, commit: id }; };
    const createBranch = (n, start) => {
      if (!validName(n)) return `fatal: '${n}' is not a valid branch name`;
      if (n in r.branches) return `fatal: a branch named '${n}' already exists`;
      const at = start ? resolve(r, start) : hc;
      if (start && !at) return `fatal: not a valid object name: '${start}'`;
      if (!at) return `fatal: not a valid object name: '${r.head.ref}'`;
      r.branches[n] = at; return null;
    };
    if (sub === "commit") {
      let msg = null;
      for (let i = 0; i < a.length; i++) {
        if (a[i] === "-m") { msg = a[i + 1] ?? null; i++; }
        else if (a[i] === "--allow-empty") continue;
        else return fail([`error: pathspec '${a[i]}' did not match any file(s) known to git`], sub);
      }
      if (msg === null || msg === "") return fail(['error: a commit message is required — git commit -m "message"'], sub);
      const id = nextId(r);
      r.commits[id] = { id, parents: hc ? [hc] : [], msg };
      if (r.head.detached) { r.head.commit = id; return ok([`[detached HEAD ${id}] ${msg}`], id); }
      r.branches[r.head.ref] = id;
      return ok([hc ? `[${r.head.ref} ${id}] ${msg}` : `[${r.head.ref} (root-commit) ${id}] ${msg}`], id);
    }
    if (sub === "branch") {
      if (!a.length) {
        const names = Object.keys(r.branches).sort();
        const lines = names.map((n) => (!r.head.detached && r.head.ref === n ? "* " : "  ") + n);
        if (r.head.detached) lines.unshift(`* (HEAD detached at ${r.head.commit})`);
        return same(lines);
      }
      if (a.length > 2 || a[0].startsWith("-")) return fail([`error: unsupported option '${a[0]}'`], sub);
      const e = createBranch(a[0], a[1]); if (e) return fail([e], sub);
      return ok([]);
    }
    if (sub === "switch" || sub === "checkout") {
      const createFlag = sub === "switch" ? "-c" : "-b";
      if (a[0] === createFlag) {
        if (!a[1]) return fail([`error: switch '${createFlag[1]}' requires a value`], sub);
        if (!hc && !a[2]) { if (a[1] in r.branches) return fail([`fatal: a branch named '${a[1]}' already exists`], sub); attach(a[1]); return ok([`Switched to a new branch '${a[1]}'`]); }
        const e = createBranch(a[1], a[2]); if (e) return fail([e], sub);
        attach(a[1]); return ok([`Switched to a new branch '${a[1]}'`]);
      }
      if (sub === "switch" && a[0] === "--detach") {
        const id = a[1] ? resolve(r, a[1]) : hc;
        if (!id) return fail([`fatal: invalid reference: ${a[1]}`], sub);
        detach(id); return ok([`HEAD is now at ${id} ${r.commits[id].msg}`]);
      }
      const n = a[0];
      if (!n) return fail([sub === "switch" ? "fatal: missing branch or commit argument" : "error: you must specify a branch or commit"], sub);
      if (n in r.branches) {
        if (!r.head.detached && r.head.ref === n) return same([`Already on '${n}'`]);
        attach(n); return ok([`Switched to branch '${n}'`]);
      }
      if (r.commits[n]) {
        if (sub === "switch") return fail([`fatal: a branch is expected, got commit '${n}'`, "hint: to inspect a commit, use git switch --detach " + n], sub);
        if (r.head.detached && r.head.commit === n) return same([`HEAD is now at ${n} ${r.commits[n].msg}`]);
        detach(n);
        return ok([`Note: switching to '${n}'.`, "You are in 'detached HEAD' state.", `HEAD is now at ${n} ${r.commits[n].msg}`]);
      }
      return fail([sub === "switch" ? `fatal: invalid reference: ${n}` : `error: pathspec '${n}' did not match any file(s) known to git`], sub);
    }
    if (sub === "merge") {
      const n = a[0];
      if (!n) return fail(["fatal: no commit specified"], sub);
      if (a.length > 1) return fail([`error: unsupported option '${a[1]}'`], sub);
      const tgt = resolve(r, n);
      if (!tgt) return fail([`merge: ${n} - not something we can merge`], sub);
      const move = (id) => { if (r.head.detached) r.head.commit = id; else r.branches[r.head.ref] = id; };
      if (!hc) { move(tgt); return ok(["Fast-forward"]); }
      if (isAnc(r, tgt, hc)) return same(["Already up to date."]);
      if (isAnc(r, hc, tgt)) { move(tgt); return ok([`Updating ${hc}..${tgt}`, "Fast-forward"]); }
      const id = nextId(r);
      r.commits[id] = { id, parents: [hc, tgt], msg: n in r.branches ? `Merge branch '${n}'` : `Merge commit '${n}'` };
      move(id);
      return ok(["Merge made by the 'ort' strategy."], id);
    }
  }

  // ---- layout (port of src/viz/layout.ts; x scaled ×2 at render per spec) ----
  function layout(r) {
    const ids = Object.keys(r.commits);
    if (!ids.length) return { nodes: [], edges: [], maxLane: 0, maxDepth: 0 };
    const memo = new Map();
    const depth = (id) => { if (memo.has(id)) return memo.get(id); const c = r.commits[id]; let m = -1; (c.parents || []).forEach((p) => { if (r.commits[p]) m = Math.max(m, depth(p)); }); const d = m + 1; memo.set(id, d); return d; };
    ids.forEach(depth);
    const sorted = [...ids].sort((a, b) => memo.get(a) - memo.get(b) || a.localeCompare(b));
    const lane = new Map(), occ = new Map(); let maxLane = 0, maxDepth = 0;
    for (const id of sorted) {
      const d = memo.get(id); maxDepth = Math.max(maxDepth, d);
      const set = occ.get(d) || new Set(); occ.set(d, set);
      let ch = -1; const fp = r.commits[id].parents[0];
      if (fp !== undefined && lane.has(fp) && !set.has(lane.get(fp))) ch = lane.get(fp);
      if (ch === -1) { ch = 0; while (set.has(ch)) ch++; }
      lane.set(id, ch); set.add(ch); maxLane = Math.max(maxLane, ch);
    }
    const nodes = ids.map((id) => ({ id, lane: lane.get(id), depth: memo.get(id), x: lane.get(id) * 160 + 40, y: memo.get(id) * 80 + 40 }));
    const edges = []; ids.forEach((id) => r.commits[id].parents.forEach((p, i) => { if (r.commits[p]) edges.push({ from: id, to: p, i }); }));
    return { nodes, edges, maxLane, maxDepth };
  }

  // ---- structural level check ----
  function sigs(r) { const m = new Map(); const s = (id) => { if (m.has(id)) return m.get(id); const v = "(" + r.commits[id].parents.map(s).join(",") + ")"; m.set(id, v); return v; }; Object.keys(r.commits).forEach(s); return m; }
  function check(r, target) {
    const a = sigs(r), b = sigs(target);
    const la = [...a.values()].sort().join("|"), lb = [...b.values()].sort().join("|");
    if (la !== lb) return false;
    const ka = Object.keys(r.branches).sort(), kb = Object.keys(target.branches).sort();
    if (ka.join() !== kb.join()) return false;
    if (ka.some((k) => a.get(r.branches[k]) !== b.get(target.branches[k]))) return false;
    if (r.head.detached !== target.head.detached) return false;
    return r.head.detached ? a.get(r.head.commit) === b.get(target.head.commit) : r.head.ref === target.head.ref;
  }

  const L = (id, order, title, goal, allowed, initial, target) => ({ id, order, title, goal, allowed, initial, target });
  const H = (ref) => ({ detached: false, ref, commit: null });
  const levels = [
    L("01-first-commit", 1, "First commit", "Create the first commit on main.", ["commit"], { parents: {}, branches: {}, head: H("main") }, { parents: { root: [] }, branches: { main: "root" }, head: H("main") }),
    L("02-branching", 2, "Create a branch", "Create feature at the current commit and leave HEAD on main.", ["branch", "switch"], { parents: { root: [] }, branches: { main: "root" }, head: H("main") }, { parents: { root: [] }, branches: { main: "root", feature: "root" }, head: H("main") }),
    L("03-switch-vs-checkout", 3, "Switch or checkout", "Attach HEAD to feature without moving either branch.", ["switch", "checkout"], { parents: { root: [] }, branches: { main: "root", feature: "root" }, head: H("main") }, { parents: { root: [] }, branches: { main: "root", feature: "root" }, head: H("feature") }),
    L("04-detached-head", 4, "Detached HEAD", "Detach HEAD at the first commit while main stays at the second commit.", ["checkout", "switch"], { parents: { first: [], second: ["first"] }, branches: { main: "second" }, head: H("main") }, { parents: { first: [], second: ["first"] }, branches: { main: "second" }, head: { detached: true, ref: null, commit: "first" } }),
    L("05-recover-detached", 5, "Recover from detached HEAD", "Attach HEAD to main again without moving main or changing the commits.", ["switch", "checkout"], { parents: { first: [], second: ["first"] }, branches: { main: "second" }, head: { detached: true, ref: null, commit: "first" } }, { parents: { first: [], second: ["first"] }, branches: { main: "second" }, head: H("main") }),
    L("06-fast-forward", 6, "Fast-forward merge", "Move main to the feature tip without creating a merge commit.", ["merge"], { parents: { root: [], featureTip: ["root"] }, branches: { main: "root", feature: "featureTip" }, head: H("main") }, { parents: { root: [], featureTip: ["root"] }, branches: { main: "featureTip", feature: "featureTip" }, head: H("main") }),
    L("07-merge-commit", 7, "Merge two branches", "Merge feature into main and create a commit with main and feature as its two parents.", ["merge"], { parents: { root: [], mainTip: ["root"], featureTip: ["root"] }, branches: { main: "mainTip", feature: "featureTip" }, head: H("main") }, { parents: { root: [], mainTip: ["root"], featureTip: ["root"], merge: ["mainTip", "featureTip"] }, branches: { main: "merge", feature: "featureTip" }, head: H("main") }),
    L("08-ff-vs-no-ff", 8, "When fast-forward is impossible", "Commit on main first, then merge feature. Divergent tips require a two-parent merge commit; no --no-ff flag is needed.", ["commit", "merge"], { parents: { root: [], featureTip: ["root"] }, branches: { main: "root", feature: "featureTip" }, head: H("main") }, { parents: { root: [], featureTip: ["root"], mainTip: ["root"], merge: ["mainTip", "featureTip"] }, branches: { main: "merge", feature: "featureTip" }, head: H("main") }),
  ];

  const mk = (parents, branches, head) => { const r = fromShape({ parents, branches, head }); Object.values(r.commits).forEach((c, i) => (c.msg = ["first", "next", "feature"][i] || c.msg)); return r; };
  const reference = [
    { key: "commit", syntax: 'git commit -m "next"', description: "Create a new commit on the current line of history.", effect: "The new commit points to the current commit, and the attached branch moves to it.", gotcha: "On a detached HEAD, a commit moves HEAD rather than a branch.", before: mk({ c1: [] }, { main: "c1" }, H("main")) },
    { key: "branch", syntax: "git branch feature", description: "Create a branch named feature at the current commit.", effect: "The new branch points to the current commit while HEAD stays on main.", gotcha: "Creating a branch does not switch to it.", before: mk({ c1: [] }, { main: "c1" }, H("main")) },
    { key: "switch", syntax: "git switch feature", description: "Switch the working position to an existing branch.", effect: "HEAD attaches to feature without changing commits or branch pointers.", gotcha: "Switching to a commit requires --detach.", before: mk({ c1: [], c2: ["c1"] }, { main: "c2", feature: "c1" }, H("main")) },
    { key: "checkout", syntax: "git checkout c1", description: "Check out a commit directly to inspect its history.", effect: "HEAD detaches at c1 while branch pointers stay in place.", gotcha: "New commits from detached HEAD do not advance main.", before: mk({ c1: [], c2: ["c1"] }, { main: "c2" }, H("main")) },
    { key: "merge", syntax: "git merge feature", description: "Merge the feature branch into the current branch.", effect: "A new commit records main as its first parent and feature as its second parent.", gotcha: "Parent order matters: the current commit is the first parent.", before: mk({ c1: [], c2: ["c1"], c3: ["c1"] }, { main: "c2", feature: "c3" }, H("main")) },
  ];
  reference.forEach((e) => (e.after = run(e.before, e.syntax).repo));

  window.GS = { KNOWN, empty, fromShape, headCommit, run, layout, check, sigs, levels, reference };
})();
