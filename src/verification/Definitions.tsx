export function Definitions() {
  return (
    <section className="verification-definitions" aria-label="Verification definitions">
      <article>
        <h2>Differential test</h2>
        <p>Each case runs the same command sequence in GitScope and in real git inside a temp folder, then compares the results.</p>
      </article>
      <article>
        <h2><span className="verification-dot verification-dot--hard" aria-hidden="true" />Hard divergence</h2>
        <p>Commits, branches or HEAD end up different. This fails the case.</p>
      </article>
      <article>
        <h2><span className="verification-dot verification-dot--soft" aria-hidden="true" />Soft warning</h2>
        <p>Only printed text differs, for example a simulator ID instead of a real hash. State still matches.</p>
      </article>
    </section>
  );
}
