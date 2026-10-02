import { MiniGraph } from "../viz/MiniGraph";
import type { CommandReference } from "./data";
import { referenceAfter } from "./referenceAfter";
import { refChanges } from "./refChanges";

export function MiniDiagram({ entry }: { entry: CommandReference }) {
  const after = referenceAfter(entry);
  if (after === null) return <p className="reference-diagram__error">Example unavailable.</p>;
  const changes = refChanges(entry.before, after);

  return (
    <div className="reference-diagram" aria-label={`${entry.key} before and after`}>
      <figure>
        <figcaption>Before</figcaption>
        <div className="reference-diagram__canvas">
          <MiniGraph state={entry.before} />
        </div>
      </figure>

      <figure>
        <figcaption>
          <span>After</span>
          <span className="reference-diagram__changes">
            {changes.labels.map((label) => <span key={label}>{label}</span>)}
          </span>
        </figcaption>
        <div className="reference-diagram__canvas">
          <MiniGraph
            state={after}
            changed={changes.changedNodes}
            changedEdges={changes.changedEdges}
            parentLabels={entry.key === "merge"}
          />
        </div>
      </figure>
    </div>
  );
}
