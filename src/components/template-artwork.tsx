// Code-native catalog artwork, intentionally a neutral scaffold, not the final royal design.
export function TemplateArtwork({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`template-artwork${compact ? " compact" : ""}`}
      aria-hidden="true"
    >
      <div className="paper-shadow" />
      <div className="paper-card">
        <div className="paper-border">
          <span className="paper-flower">✧</span>
          <span className="paper-kicker">TOGETHER WITH THEIR FAMILIES</span>
          <span className="paper-name">
            Aarav<span>&</span>Meera
          </span>
          <span className="paper-line" />
          <span className="paper-kicker">
            INVITE YOU TO CELEBRATE THEIR WEDDING
          </span>
          <span className="paper-date">21 · 02 · 2027</span>
          <span className="paper-kicker">JAIPUR, INDIA</span>
          <span className="paper-flower bottom">✧</span>
        </div>
      </div>
      <span className="art-leaf leaf-one">❧</span>
      <span className="art-leaf leaf-two">❧</span>
    </div>
  );
}
