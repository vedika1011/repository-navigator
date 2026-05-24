// SidebarSection.jsx — Reusable collapsible section with animated expand/collapse and chevron rotation.

import { useState } from "react";

function SidebarSection({ title, badge, icon, defaultOpen = true, children }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div style={{ borderBottom: "1px solid var(--border)" }}>
      {/* Clickable header row */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          width: "100%",
          padding: "12px 16px",
          background: "none",
          border: "none",
          cursor: "pointer",
          transition: "background-color 150ms ease",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.backgroundColor = "var(--bg-elevated)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.backgroundColor = "transparent")
        }
      >
        {/* Optional icon */}
        {icon && (
          <span
            style={{
              fontSize: 12,
              lineHeight: 1,
              verticalAlign: "middle",
              flexShrink: 0,
              color: "var(--text-muted)",
            }}
          >
            {typeof icon === "string" && icon.length <= 2 ? icon : icon}
          </span>
        )}

        {/* Title */}
        <span
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 600,
            fontSize: 13,
            color: "var(--text-primary)",
            flex: 1,
            textAlign: "left",
          }}
        >
          {title}
          {badge !== undefined && badge !== null && (
            <span
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 11,
                color: "var(--text-muted)",
                marginLeft: 6,
              }}
            >
              ({badge})
            </span>
          )}
        </span>

        {/* Chevron */}
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--text-faint)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transition: "transform 300ms ease",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            flexShrink: 0,
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Collapsible content — uses max-height for CSS transition */}
      <div
        style={{
          maxHeight: isOpen ? "500px" : "0",
          overflow: "hidden",
          transition: "max-height 300ms ease",
        }}
      >
        <div style={{ padding: "0 16px 14px 16px" }}>{children}</div>
      </div>
    </div>
  );
}

export default SidebarSection;
