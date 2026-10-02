import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("progress store", () => {
  it("lưu vào localStorage rồi đọc lại sau khi tạo store mới", async () => {
    const data = new Map<string, string>();
    const storage = {
      getItem: vi.fn((key: string) => data.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => { data.set(key, value); }),
    };
    const fetchSpy = vi.fn(() => { throw new Error("unexpected network call"); });
    vi.stubGlobal("localStorage", storage);
    vi.stubGlobal("fetch", fetchSpy);

    const record = { levelId: "01", completedAt: "2026-09-01T00:00:00Z", commandCount: 4 };
    const { progressStore: first } = await import("./store");
    await first.load();
    first.complete(record);
    expect(storage.setItem).toHaveBeenCalledOnce();

    vi.resetModules();
    const { progressStore: reloaded } = await import("./store");
    await reloaded.load();
    expect(reloaded.getAll()).toEqual({ "01": record });
    expect(reloaded.isComplete("01")).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it.each(["not JSON", "[]", "null", '{"01":{"levelId":"02","completedAt":"bad","commandCount":-1}}'])
    ("falls back safely for corrupt storage: %s", async (raw) => {
      vi.stubGlobal("localStorage", { getItem: () => raw, setItem: vi.fn() });
      const { progressStore } = await import("./store");
      await progressStore.load();
      expect(progressStore.getAll()).toEqual({});
      expect(progressStore.isComplete("toString")).toBe(false);
    });
});
