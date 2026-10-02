import { useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import type { Command } from "../core/types";
import {
  editInput,
  initialTerminalSession,
  nextCommand,
  previousCommand,
  submitInput,
  type CommandResult,
} from "./session";

interface Props {
  onCommand: (command: Command) => CommandResult | boolean | void;
  output?: readonly string[];
  locked?: boolean;
  disabled?: boolean;
  variant?: "legacy" | "practice";
  examples?: readonly string[];
  placeholder?: string;
  hint?: string;
  showHistoryHint?: boolean;
  emptyDescription?: string;
}

const PRACTICE_EXAMPLES = [
  'git commit -m "first"',
  "git branch feature",
  "git switch -c feature",
] as const;

export function isNearLogBottom(log: Pick<HTMLDivElement, "scrollHeight" | "scrollTop" | "clientHeight">): boolean {
  return log.scrollHeight - log.scrollTop - log.clientHeight <= 40;
}

export function Terminal({
  onCommand,
  output = [],
  locked = false,
  disabled = false,
  variant = "legacy",
  examples = PRACTICE_EXAMPLES,
  placeholder = 'git commit -m "first"',
  hint = "Available: commit · branch · switch · checkout · merge",
  showHistoryHint = variant === "practice",
  emptyDescription = "Type a Git command below and press Enter. The graph on the right updates after every command. Try one:",
}: Props) {
  const [session, setSession] = useState(initialTerminalSession);
  const sessionRef = useRef(session);
  const inputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const followNewest = useRef(true);

  function updateSession(next: typeof session): void {
    sessionRef.current = next;
    setSession(next);
  }

  function submit(): void {
    if (disabled || locked) return;
    updateSession(submitInput(sessionRef.current, onCommand));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (event.key === "Enter") {
      event.preventDefault();
      submit();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      updateSession(previousCommand(sessionRef.current));
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      updateSession(nextCommand(sessionRef.current));
    }
  }

  function fillExample(example: string): void {
    updateSession(editInput(sessionRef.current, example.replace(/ <…>$/, "")));
    inputRef.current?.focus();
  }

  useLayoutEffect(() => {
    const log = logRef.current;
    if (log && followNewest.current) log.scrollTop = log.scrollHeight;
  }, [session.entries.length]);

  if (variant === "legacy") {
    return (
      <section aria-label="Git terminal" className="terminal rounded-lg border border-term-line bg-term p-4 font-mono text-sm text-term-fg">
        <div role="log" aria-label="Command history" className="space-y-1 whitespace-pre-wrap">
          {session.entries.map((entry, index) => (
            <div key={index}>
              <div>$ {entry.command}</div>
              {entry.output.map((line, lineIndex) => <div key={lineIndex}>{line}</div>)}
            </div>
          ))}
        </div>
        <div role="log" aria-label="Command output" className="whitespace-pre-wrap">
          {output.map((line, index) => <div key={index}>{line}</div>)}
        </div>
        <label className="mt-3 flex gap-2">
          <span aria-hidden="true">$</span>
          <input
            id="terminal-input"
            ref={inputRef}
            type="text"
            disabled={disabled}
            aria-label="Git command"
            autoComplete="off"
            spellCheck={false}
            value={session.input}
            onChange={(event) => updateSession(editInput(sessionRef.current, event.target.value))}
            onKeyDown={handleKeyDown}
            className="min-w-0 flex-1 rounded-sm border border-transparent bg-transparent outline-none"
          />
        </label>
      </section>
    );
  }

  return (
    <section aria-label="Git terminal" className="terminal terminal--practice">
      <header className="terminal__header">
        <span className="terminal__eyebrow">TERMINAL</span>
        {showHistoryHint && (
          <span className="terminal__history-hint" aria-label="Use up and down arrow keys for command history">
            <kbd>↑</kbd><kbd>↓</kbd><span>history</span>
          </span>
        )}
      </header>

      <div
        ref={logRef}
        role="log"
        aria-live="polite"
        aria-label="Command history"
        className="terminal__log"
        onScroll={(event) => {
          const log = event.currentTarget;
          followNewest.current = isNearLogBottom(log);
        }}
      >
        {session.entries.length === 0 ? (
          <div className="terminal__empty">
            <p>{emptyDescription}</p>
            <div className="terminal__examples">
              {examples.map((example) => (
                <button key={example} type="button" onClick={() => fillExample(example)}>{example}</button>
              ))}
            </div>
          </div>
        ) : session.entries.map((entry, index) => (
          <div className={`terminal__entry${index === session.entries.length - 1 ? " terminal__entry--latest" : ""}`} key={`${entry.command}-${index}`}>
            <div className="terminal__command"><span aria-hidden="true">$</span> {entry.command}</div>
            {entry.output.map((line, lineIndex) => (
              <div className={`terminal__output${entry.isError ? " terminal__output--error" : ""}`} key={`${line}-${lineIndex}`}>
                {entry.isError && lineIndex === 0 && <span aria-hidden="true">✕</span>}
                <span>{line}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="terminal__dock">
        <div className="terminal__input-wrap">
          <span className="terminal__prompt" aria-hidden="true">$</span>
          <input
            id="terminal-input"
            ref={inputRef}
            type="text"
            aria-label="Git command"
            autoComplete="off"
            spellCheck={false}
            value={session.input}
            onChange={(event) => updateSession(editInput(sessionRef.current, event.target.value))}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={`${locked ? "is-locked" : ""}${session.lastSubmissionErrored ? " is-error" : ""}`}
          />
          <button
            type="button"
            className="terminal__run"
            onClick={() => {
              submit();
              inputRef.current?.focus();
            }}
            aria-disabled={disabled || locked}
          >
            Run ↵
          </button>
        </div>
        <p className="terminal__hint" role={locked ? "status" : undefined}>{locked ? "Updating graph…" : hint}</p>
      </div>
    </section>
  );
}
