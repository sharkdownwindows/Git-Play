// ─────────────────────────────────────────────────────────────────────────────
// CONTRACT 1 — ĐÓNG BĂNG NGÀY 1
// Đổi file này cần cả nhóm đồng ý. Mọi module khác phụ thuộc vào nó.
// ─────────────────────────────────────────────────────────────────────────────

export type CommitId = string;
export type RefName = string;

export interface Commit {
  id: CommitId;
  message: string;
  /** Rỗng = root commit. 2 phần tử = merge commit. Thứ tự có nghĩa: [first, second]. */
  parents: CommitId[];
  /** ISO 8601. Engine nhận từ ngoài để test tất định được. */
  timestamp: string;
}

/**
 * HEAD có đúng hai hình thái, không bao giờ cả hai cùng lúc:
 *   attached → detached = false, ref = tên branch, commit = null
 *   detached → detached = true,  ref = null,       commit = id
 * Repo chưa có commit nào: detached = false, ref = "main", commit = null.
 */
export interface Head {
  detached: boolean;
  ref: RefName | null;
  commit: CommitId | null;
}

// ─── Bốn seam cho staging area ───────────────────────────────────────────────
// v1 KHÔNG có staging area. Bốn seam dưới đây vẫn phải có mặt và luôn null,
// để thêm `git add` sau này không phải đổi Contract 1.

/** Seam 1 — nội dung cây tại một commit. */
export interface Snapshot {
  files: Record<string, string>;
}

/** Seam 2 — thư mục làm việc. */
export interface WorkingTree {
  files: Record<string, string>;
}

/** Seam 3 — staging index. */
export interface IndexState {
  staged: Record<string, string>;
}

/** Seam 4 — ranh giới hàm phát hiện conflict. */
export interface Conflict {
  path: string;
  ours: CommitId;
  theirs: CommitId;
}

/**
 * Seam 4 — chữ ký cố định của bước phát hiện conflict trong merge.
 * v1 luôn trả null (= không bao giờ conflict vì chưa có nội dung file).
 * Ba-way merge thật chỉ cần thay implementation, không đụng tới kiểu.
 */
export type DetectConflicts = (
  state: RepoState,
  ours: CommitId,
  theirs: CommitId,
  base: CommitId | null,
) => Conflict[] | null;

// ─── State ───────────────────────────────────────────────────────────────────

export interface RepoState {
  commits: Record<CommitId, Commit>;
  branches: Record<RefName, CommitId>;
  head: Head;

  // Bốn seam — luôn null ở v1.
  snapshot: Snapshot | null;
  workingTree: WorkingTree | null;
  index: IndexState | null;
  conflicts: Conflict[] | null;
}

// ─── Command ─────────────────────────────────────────────────────────────────

export type Command =
  | { kind: "commit"; message?: string }
  | { kind: "branch"; name?: string }
  | { kind: "switch"; target: string; detach: boolean; create: boolean }
  | { kind: "checkout"; target: string; create: boolean }
  | { kind: "merge"; branch: string };

export type CommandKind = Command["kind"];

/**
 * Kết quả parse thất bại — lỗi hình thức (cú pháp), phát hiện TRƯỚC khi có state.
 * Dùng chung `ErrorClass` với engine vì với người dùng đây cùng là một lớp
 * thông báo lỗi; khác biệt là Result còn có `state`, ParseError thì không —
 * chưa build được Command thì chưa có state nào để trả lại.
 */
export interface ParseError {
  ok: false;
  output: string[];
  errorClass: ErrorClass;
}

// ─── Lỗi ─────────────────────────────────────────────────────────────────────

/**
 * Lớp lỗi — dùng cho HARD GATE của differential test.
 * Harness so `errorClass` (hard), còn `output` chỉ so ở mức soft check.
 * Vì vậy sửa câu chữ thông báo không làm đỏ CI, nhưng sai lớp lỗi thì có.
 */
export type ErrorClass =
  | "NotGitCommand"
  | "UnknownSubcommand"
  | "MissingArgument"
  | "InvalidRefName"
  | "BranchAlreadyExists"
  | "PathspecNotFound"
  | "NothingToCommit"
  | "NoCommitsYet"
  | "AlreadyOnBranch"
  | "CannotMergeIntoSelf"
  | "AlreadyUpToDate"
  | "MergeConflict"
  | "BranchNotFullyMerged"
  | "UnknownCommand";

// ─── Result ──────────────────────────────────────────────────────────────────

/**
 * Engine KHÔNG BAO GIỜ throw.
 * Lỗi trả về qua ok:false + output + errorClass, vì harness so thông báo lỗi
 * như dữ liệu chứ không phải như exception.
 */
export interface Result {
  /** State cũ, nguyên vẹn, nếu lỗi. */
  state: RepoState;
  /** Tiếng Anh, khớp nguyên văn Git thật. */
  output: string[];
  ok: boolean;
  errorClass?: ErrorClass;
}

// ─── Factory ─────────────────────────────────────────────────────────────────

/** Repo vừa `git init`: chưa có commit, HEAD trỏ tới branch main chưa tồn tại. */
export function emptyState(): RepoState {
  return {
    commits: {},
    branches: {},
    head: { detached: false, ref: "main", commit: null },
    snapshot: null,
    workingTree: null,
    index: null,
    conflicts: null,
  };
}
