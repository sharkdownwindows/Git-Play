import { useEffect, useRef, useState } from "react";
import type { CommandKind } from "../core/types";
import { commandReferences, type CommandReference } from "./data";
import { MiniDiagram } from "./MiniDiagram";

export const COPY_FEEDBACK_MS = 1500;

interface ClipboardWriter {
  writeText(text: string): Promise<void>;
}

export async function copyReferenceSyntax(
  syntax: string,
  clipboard: ClipboardWriter | undefined,
): Promise<boolean> {
  if (!clipboard) return false;
  try {
    await clipboard.writeText(syntax);
    return true;
  } catch {
    return false;
  }
}

interface DetailProps {
  entry: CommandReference;
  copied: boolean;
  onCopy: () => void;
  headingId: string;
}

export function ReferenceDetail({ entry, copied, onCopy, headingId }: DetailProps) {
  return (
    <div className="reference-detail">
      <header className="reference-detail__header">
        <h1 id={headingId}>git {entry.key}</h1>
        <p>{entry.description}</p>
      </header>

      <div className="reference-syntax" aria-label={`Syntax for git ${entry.key}`}>
        <span className="reference-syntax__prompt" aria-hidden="true">$</span>
        <code>{entry.syntax}</code>
        <button type="button" onClick={onCopy} aria-label={`Copy ${entry.syntax}`}>
          {copied ? "✓ Copied" : "Copy"}
        </button>
      </div>

      <div className="reference-notes">
        <section className="reference-note reference-note--changes" aria-labelledby={`${headingId}-changes`}>
          <h2 id={`${headingId}-changes`}>What changes</h2>
          <p>{entry.effect}</p>
        </section>
        <section className="reference-note reference-note--gotcha" aria-labelledby={`${headingId}-gotcha`}>
          <h2 id={`${headingId}-gotcha`}><span aria-hidden="true">!</span>Gotcha</h2>
          <p>{entry.gotcha}</p>
        </section>
      </div>

      <MiniDiagram entry={entry} />
    </div>
  );
}

export function CommandRefPanel() {
  const [selectedKey, setSelectedKey] = useState<CommandKind>(commandReferences[0]!.key);
  const [copiedKey, setCopiedKey] = useState<CommandKind | null>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selected = commandReferences.find((entry) => entry.key === selectedKey) ?? commandReferences[0]!;

  useEffect(() => () => {
    if (copyTimer.current !== null) clearTimeout(copyTimer.current);
  }, []);

  function selectCommand(key: CommandKind): void {
    setSelectedKey(key);
    setCopiedKey(null);
    if (copyTimer.current !== null) clearTimeout(copyTimer.current);
  }

  async function copySyntax(entry: CommandReference): Promise<void> {
    if (copyTimer.current !== null) clearTimeout(copyTimer.current);
    const didCopy = await copyReferenceSyntax(
      entry.syntax,
      typeof navigator === "undefined" ? undefined : navigator.clipboard,
    );
    if (!didCopy) {
      setCopiedKey(null);
      return;
    }
    setCopiedKey(entry.key);
    copyTimer.current = setTimeout(() => {
      setCopiedKey(null);
      copyTimer.current = null;
    }, COPY_FEEDBACK_MS);
  }

  return (
    <section className="reference" aria-label="Command reference">
      <aside className="reference-rail">
        <div className="reference-rail__intro">
          <span>Command reference</span>
          <p>How each command changes commits, branches and HEAD.</p>
        </div>
        <nav aria-label="Commands">
          {commandReferences.map((entry) => (
            <button
              key={entry.key}
              type="button"
              aria-current={entry.key === selectedKey ? "true" : undefined}
              onClick={() => selectCommand(entry.key)}
            >
              <strong>git {entry.key}</strong>
              <span>{entry.description}</span>
            </button>
          ))}
        </nav>
      </aside>

      <div className="reference-desktop-detail" aria-labelledby={`reference-${selected.key}-title`}>
        <ReferenceDetail
          entry={selected}
          copied={copiedKey === selected.key}
          onCopy={() => { void copySyntax(selected); }}
          headingId={`reference-${selected.key}-title`}
        />
      </div>

      <span className="sr-only" role="status" aria-live="polite">
        {copiedKey === null ? "" : `${copiedKey} syntax copied`}
      </span>
    </section>
  );
}
