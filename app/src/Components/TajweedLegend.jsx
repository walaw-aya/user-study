import { useState } from "react";
import { TAJWEED_TAGS } from "../scripts/tajweed";
import styles from "../css/TajweedLegend.module.css";

export default function TajweedLegend() {
  const [collapsed, setCollapsed] = useState(true);

  return (
    <div className={styles.float}>
      <div className={styles.header} onClick={() => setCollapsed(!collapsed)}>
        <span>أحكام التجويد</span>
        <span className={styles.toggle}>{collapsed ? "▼" : "▲"}</span>
      </div>
      {!collapsed && (
        <div className={styles.items}>
          {TAJWEED_TAGS.map(({ tag, color }) => (
            <div key={tag} className={styles.item}>
              <span className={styles.dot} style={{ background: color }} />
              <span
                style={{
                  color,
                  fontWeight: 600,
                  fontFamily: "'Scheherazade New', serif",
                  fontSize: "0.9rem",
                }}
              >
                {tag.replace("⟪", "").replace("⟫", "")}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
