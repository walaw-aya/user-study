import { useState, useEffect } from "react";
import { gasGet } from "../scripts/api";
import VerseCard from "./VerseCard";
import TajweedLegend from "./TajweedLegend";
import styles from "../css/UserView.module.css";

export default function UserView({ userEmail }) {
  const [verses, setVerses] = useState(null);
  const [error, setError] = useState(null);
  const [doneCount, setDoneCount] = useState(0);

  useEffect(() => {
    setVerses(null);
    setError(null);
    gasGet({ action: "getAssignments", userEmail })
      .then((data) => {
        setVerses(data);
        setDoneCount(data.filter((v) => v.status === "Complete").length);
      })
      .catch((e) => setError(e.message));
  }, [userEmail]);

  const handleComplete = () => setDoneCount((c) => c + 1);

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  if (!verses) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}>✦</div>
        <div>Loading assignments…</div>
      </div>
    );
  }

  if (!verses.length) {
    return <div className={styles.empty}>No verses assigned yet.</div>;
  }

  const total = verses.length;
  const pct = Math.round((doneCount / total) * 100);

  return (
    <>
      {/* ── Page header ── */}
      <div className={styles.pageHeader}>
        <div className={styles.bismillah}>
          بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
        </div>
        <div className={styles.headerRow}>
          <div>
            <div className={styles.pageTitle}>Your Recitation Assignments</div>
            <div className={styles.pageMeta}>
              {doneCount} of {total} complete · {pct}%
            </div>
          </div>
          <div className={styles.miniProgress}>
            <div
              className={styles.miniProgressFill}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── Verse list ── */}
      <div className={styles.list}>
        {verses.map((v, i) => (
          <VerseCard
            key={v.rowIndex}
            verse={v}
            idx={i}
            userEmail={userEmail}
            onComplete={handleComplete}
          />
        ))}
      </div>

      <TajweedLegend />
    </>
  );
}
