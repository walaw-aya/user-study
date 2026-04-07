import { useState } from "react";
import RecorderBlock from "./RecorderBlock";
import { gasPost } from "../scripts/api";
import styles from "../css/VerseCard.module.css";

export default function VerseCard({ verse, idx, userEmail, onComplete }) {
  const [isComplete, setIsComplete] = useState(verse.status === "Complete");
  const [completedAt, setCompletedAt] = useState(verse.completedAt);
  const [marking, setMarking] = useState(false);
  const [savedBoth, setSavedBoth] = useState({
    correct: !!verse.correctAudioUrl,
    incorrect: !!verse.incorrectAudioUrl,
  });

  const markDone = async () => {
    if (isComplete || marking) return;
    setMarking(true);
    try {
      // markRowComplete is sent as a POST action
      await gasPost({ action: "markRowComplete", rowIndex: verse.rowIndex });
      const ts = new Date().toISOString();
      setIsComplete(true);
      setCompletedAt(ts);
      onComplete?.();
    } catch {
      // silent — user can retry manually
    }
    setMarking(false);
  };

  const handleSaved = (key) => {
    const type = key.endsWith("_correct") ? "correct" : "incorrect";
    setSavedBoth((prev) => {
      const next = { ...prev, [type]: true };
      if (next.correct && next.incorrect && !isComplete) {
        // Both recordings done — auto-mark complete
        markDone();
      }
      return next;
    });
  };

  return (
    <div
      className={`${styles.card} ${isComplete ? styles.complete : ""}`}
      style={{ animationDelay: `${idx * 0.06}s` }}
    >
      {/* ── Header ── */}
      <div className={`${styles.header} ${isComplete ? styles.complete : ""}`}>
        <div className={styles.meta}>
          <span className={styles.category}>{verse.category}</span>
          <span className={styles.subcategory}>{verse.subcategory}</span>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.indexBadge}>{idx + 1}</span>
          <button
            className={`${styles.btnDone} ${isComplete ? styles.marked : ""}`}
            // onClick={markDone}
            disabled={isComplete || marking}
          >
            {marking ? "…" : isComplete ? "✓ Done" : "Not Done"}
          </button>
        </div>
      </div>

      {isComplete && completedAt && (
        <div className={styles.completedAt}>
          Completed {new Date(completedAt).toLocaleString()}
        </div>
      )}

      {/* ── Correct Recitation ── */}
      <RecorderBlock
        rowIndex={verse.rowIndex}
        type="correct"
        label="Correct Recitation"
        correctText={verse.correct}
        incorrectText={verse.incorrect}
        audioUrl={verse.correctAudioUrl}
        verseId={verse.verse_id || verse.rowIndex}
        category={verse.category}
        subcategory={verse.subcategory}
        userEmail={userEmail}
        onSaved={handleSaved}
      />

      {/* ── Incorrect Recitation ── */}
      <RecorderBlock
        rowIndex={verse.rowIndex}
        type="incorrect"
        label="Incorrect Recitation"
        correctText={verse.correct}
        incorrectText={verse.incorrect}
        audioUrl={verse.incorrectAudioUrl}
        verseId={verse.verse_id || verse.rowIndex}
        category={verse.category}
        subcategory={verse.subcategory}
        userEmail={userEmail}
        onSaved={handleSaved}
      />
    </div>
  );
}
