import { merge } from "./merge";
import type { LevelRecord, ProgressSet } from "./types";

const STORAGE_KEY = "gitscope.progress.v1";
const DEV_STORAGE_KEY = "gitscope.progress.dev.v1";
const DEV_SESSION_KEY = "gitscope.dev-session.v1";

type Listener = (progress: ProgressSet) => void;

/**
 * localStorage là nguồn sự thật duy nhất cho tiến độ level.
 */
class ProgressStore {
  private progress: ProgressSet = {};
  private listeners = new Set<Listener>();

  /** Đọc localStorage. Hỏng hoặc không có → tập rỗng, không bao giờ throw. */
  async load(): Promise<void> {
    if (import.meta.env.DEV) {
      prepareDevSession();
      this.progress = readStorage(DEV_STORAGE_KEY);
    } else {
      this.progress = readStorage(STORAGE_KEY);
    }
    this.emit();
  }

  getAll(): ProgressSet {
    return this.progress;
  }

  isComplete(levelId: string): boolean {
    return Object.hasOwn(this.progress, levelId);
  }

  /** Ghi nhận hoàn thành level. Giữ lần giải tốt hơn nếu đã có. */
  complete(record: LevelRecord): void {
    this.progress = merge(this.progress, { [record.levelId]: record });
    writeStorage(this.progress, import.meta.env.DEV ? DEV_STORAGE_KEY : STORAGE_KEY);
    this.emit();
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(): void {
    for (const listener of this.listeners) {
      try {
        listener(this.progress);
      } catch {
        // Observer hỏng không được làm sập store.
      }
    }
  }
}

function prepareDevSession(): void {
  try {
    const storage = globalThis.localStorage;
    if (!storage || storage.getItem(DEV_SESSION_KEY) === __DEV_SESSION_ID__) return;
    storage.removeItem(DEV_STORAGE_KEY);
    storage.setItem(DEV_SESSION_KEY, __DEV_SESSION_ID__);
  } catch {
    // Storage may be unavailable in private browsing; progress remains in memory.
  }
}

function readStorage(storageKey: string): ProgressSet {
  try {
    const raw = globalThis.localStorage?.getItem(storageKey);
    if (!raw) return {};
    const value: unknown = JSON.parse(raw);
    if (typeof value !== "object" || value === null || Array.isArray(value)) return {};
    for (const [levelId, record] of Object.entries(value)) {
      if (typeof record !== "object" || record === null || Array.isArray(record)) return {};
      const item = record as Record<string, unknown>;
      if (!levelId.trim() || Object.keys(item).sort().join(",") !== "commandCount,completedAt,levelId" ||
          item.levelId !== levelId || typeof item.completedAt !== "string" ||
          !Number.isFinite(Date.parse(item.completedAt)) ||
          !/T.*(?:Z|[+-]\d{2}:\d{2})$/.test(item.completedAt) ||
          !Number.isInteger(item.commandCount) || (item.commandCount as number) <= 0) return {};
    }
    return value as ProgressSet;
  } catch {
    return {};
  }
}

function writeStorage(progress: ProgressSet, storageKey: string): void {
  try {
    globalThis.localStorage?.setItem(storageKey, JSON.stringify(progress));
  } catch {
    // Quota đầy hoặc chế độ riêng tư — mất tiến độ còn hơn sập app.
  }
}

export const progressStore = new ProgressStore();
export type { ProgressStore };
