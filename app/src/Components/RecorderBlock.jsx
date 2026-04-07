import { useState } from "react";
import { useRecorder } from "../scripts/useRecorder";
import { gasPost } from "../scripts/api";
import { processTajweedTags, highlightDiff } from "../scripts/tajweed";
import styles from "../css/RecorderBlock.module.css";

export default function RecorderBlock({
  rowIndex,
  type, // "correct" | "incorrect"
  label,
  correctText,
  incorrectText,
  audioUrl,
  verseId,
  category,
  subcategory,
  userEmail,
  onSaved,
}) {
  const { isRecording, elapsed, start, stop } = useRecorder();
  const [saved, setSaved] = useState(!!audioUrl);
  const [uploadPct, setUploadPct] = useState(null);
  const [status, setStatus] = useState(null);

  // Correct block shows the correct text with missing chars highlighted
  // Incorrect block shows the incorrect text as-is with tajweed colours
  const displayHtml =
    type === "correct"
      ? highlightDiff(correctText, incorrectText)
      : processTajweedTags(incorrectText);

  const handleStart = async () => {
    setStatus(null);
    const res = await start();
    if (!res.ok) {
      setStatus({ kind: "error", msg: res.error || "Microphone error." });
    }
  };

  const handleStop = async () => {
    const wav = stop();
    if (!wav) return;

    setStatus({ kind: "info", msg: "Uploading…" });
    setUploadPct(30);

    const sanitize = (s) =>
      s.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, "_").replace(/_+/g, "_");
    const fileName = `${sanitize(category)}__${sanitize(subcategory)}__${sanitize(String(verseId))}__${type}.wav`;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result.split(",")[1];
      setUploadPct(65);
      try {
        await gasPost({
          fileData: base64,
          mimeType: "audio/wav",
          fileName,
          username: userEmail,
          rowIndex,
          type,
        });
        setUploadPct(100);
        setTimeout(() => setUploadPct(null), 700);
        setSaved(true);
        setStatus({ kind: "success", msg: "Saved ✓" });
        onSaved?.(`${rowIndex}_${type}`);
      } catch (err) {
        setUploadPct(null);
        setStatus({ kind: "error", msg: "Upload failed: " + err.message });
      }
    };
    reader.readAsDataURL(wav);
  };

  return (
    <div className={`${styles.block} ${styles[type]}`}>
      <div className={`${styles.label} ${styles[type + "Label"]}`}>{label}</div>

      <div
        className={styles.quranText}
        dangerouslySetInnerHTML={{ __html: displayHtml }}
      />

      {audioUrl && !saved && (
        <a
          className={styles.prevLink}
          href={audioUrl}
          target="_blank"
          rel="noreferrer"
        >
          ▶ Previously recorded
        </a>
      )}

      {saved && <div className={styles.savedTag}>✓ Complete</div>}

      {status && (
        <div className={`${styles.statusMsg} ${styles[status.kind]}`}>
          {status.msg}
        </div>
      )}

      <div className={styles.controls}>
        {!isRecording ? (
          <button
            className={`${styles.btn} ${styles.btnStart}`}
            onClick={handleStart}
          >
            ● Rec
          </button>
        ) : (
          <button
            className={`${styles.btn} ${styles.btnStop}`}
            onClick={handleStop}
          >
            ■ Stop
          </button>
        )}

        {isRecording && (
          <span className={styles.recIndicator}>
            <span className={styles.recDot} />
            <span className={styles.recTimer}>{elapsed}</span>
          </span>
        )}
      </div>

      {uploadPct !== null && (
        <div className={styles.progressWrap}>
          <div
            className={styles.progressBar}
            style={{ width: `${uploadPct}%` }}
          />
        </div>
      )}
    </div>
  );
}
