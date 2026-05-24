// FeaturePills.jsx — Three pill badges that become clickable navigation links after analysis completes.

const features = [
  { label: "Module Graph", dotColor: "var(--accent)", target: "section-graph" },
  { label: "AI Summaries", dotColor: "#bc8cff", target: "section-graph" },
  { label: "Onboarding Path", dotColor: "#3fb950", target: "section-summary" },
];

function FeaturePills({ active, onPillClick }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {features.map((feature) => (
        <div
          key={feature.label}
          role={active ? "button" : undefined}
          tabIndex={active ? 0 : undefined}
          className="flex items-center gap-2 px-4 py-2 rounded-full font-mono text-xs transition-all duration-200"
          style={{
            backgroundColor: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            color: "var(--text-muted)",
            cursor: active ? "pointer" : "default",
          }}
          onClick={() => {
            if (active && onPillClick) onPillClick(feature.target);
          }}
          onKeyDown={(e) => {
            if (active && (e.key === "Enter" || e.key === " ") && onPillClick) {
              e.preventDefault();
              onPillClick(feature.target);
            }
          }}
          onMouseEnter={(e) => {
            if (active) {
              e.currentTarget.style.borderColor = "var(--accent)";
              e.currentTarget.style.backgroundColor = "rgba(88,166,255,0.08)";
              e.currentTarget.style.color = "var(--text-primary)";
            } else {
              e.currentTarget.style.borderColor = "var(--accent)";
              e.currentTarget.style.color = "var(--text-primary)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border)";
            e.currentTarget.style.backgroundColor = "var(--bg-elevated)";
            e.currentTarget.style.color = "var(--text-muted)";
          }}
        >
          {/* Colored dot indicator */}
          <span
            className={`inline-block w-2 h-2 rounded-full ${active ? "" : "animate-pulse-dot"}`}
            style={{
              backgroundColor: feature.dotColor,
              boxShadow: active ? `0 0 6px ${feature.dotColor}` : "none",
              transition: "box-shadow 350ms ease",
            }}
          />
          <span>{feature.label}</span>
          {active && (
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ opacity: 0.5, marginLeft: 2 }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          )}
        </div>
      ))}
    </div>
  );
}

export default FeaturePills;
