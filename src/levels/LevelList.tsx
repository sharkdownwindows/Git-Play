import type { ProgressSet } from "../progress/types";
import type { Level } from "./schema";

interface Props {
  levels: readonly Level[];
  progress: ProgressSet;
  selectedId: string;
  onSelect: (levelId: string) => void;
}

function completedCount(levels: readonly Level[], progress: ProgressSet): number {
  return levels.filter((level) => Object.hasOwn(progress, level.id)).length;
}

function Progress({ complete, total }: { complete: number; total: number }) {
  const value = total === 0 ? 0 : (complete / total) * 100;
  return (
    <div
      className="levels-progress"
      role="progressbar"
      aria-label="Level progress"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={complete}
    >
      <span style={{ width: `${value}%` }} />
    </div>
  );
}

export function LevelList({ levels, progress, selectedId, onSelect }: Props) {
  const ordered = [...levels].sort((a, b) => a.order - b.order);
  const complete = completedCount(ordered, progress);

  return (
    <>
      <aside className="levels-rail">
        <div className="levels-rail__progress">
          <div className="levels-rail__progress-copy">
            <span className="levels-eyebrow levels-eyebrow--primary">LEVELS</span>
            <span>{complete} of {ordered.length} complete</span>
          </div>
          <Progress complete={complete} total={ordered.length} />
        </div>

        <nav aria-label="Levels">
          <ol className="levels-list">
            {ordered.map((level) => {
              const selected = selectedId === level.id;
              const completed = Object.hasOwn(progress, level.id);
              const status = completed ? "completed" : selected ? "current" : "not started";
              const number = level.order.toString().padStart(2, "0");
              return (
                <li key={level.id}>
                  <button
                    type="button"
                    aria-current={selected ? "step" : undefined}
                    aria-label={`Level ${number}, ${level.title}, ${status}`}
                    onClick={() => onSelect(level.id)}
                    className={selected ? "is-selected" : undefined}
                  >
                    <span className={`levels-list__status${completed ? " is-complete" : selected ? " is-current" : ""}`} aria-hidden="true">
                      {completed ? "✓" : ""}
                    </span>
                    <span className="levels-list__number">{number}</span>
                    <span className="levels-list__title">{level.title}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>
      </aside>

      <div className="levels-picker">
        <label htmlFor="level-picker" className="levels-eyebrow levels-eyebrow--primary">
          LEVEL · {complete} OF {ordered.length} COMPLETE
        </label>
        <select id="level-picker" value={selectedId} onChange={(event) => onSelect(event.target.value)}>
          {ordered.map((level) => (
            <option key={level.id} value={level.id}>
              {level.order.toString().padStart(2, "0")} · {level.title}{Object.hasOwn(progress, level.id) ? "  ✓" : ""}
            </option>
          ))}
        </select>
        <Progress complete={complete} total={ordered.length} />
      </div>
    </>
  );
}
