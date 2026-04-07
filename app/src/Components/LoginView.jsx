import { useState } from "react";
import { gasGet } from "../scripts/api";
import styles from "../css/LoginView.module.css";

export default function LoginView({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    setError(null);
    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);

    // Regular user — validated against the GAS Users sheet
    try {
      const data = await gasGet({
        action: "validateUser",
        userEmail: email.trim(),
        password,
      });

      if (data?.valid) {
        onLogin({ email: email.trim() });
      } else {
        setError(data?.message || "Invalid email or password.");
        setLoading(false);
      }
    } catch (e) {
      setError(
        "Could not connect. Check your internet connection and try again.",
      );
      setLoading(false);
    }
  };

  const onKey = (e) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.emblem}>
          <span className={styles.bismillah}>
            بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
          </span>
          <div className={styles.ornament}>
            <span className={styles.ornamentText}>Walaw Aya User Study</span>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardAccent} />
          <h1 className={styles.title}>Welcome</h1>
          <p className={styles.subtitle}>
            Sign in to access your recitation assignments
          </p>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Email address</label>
            <input
              className={styles.input}
              type="text"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={onKey}
              autoComplete="email"
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Password</label>
            <input
              className={styles.input}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={onKey}
              autoComplete="current-password"
            />
          </div>

          <button
            className={styles.btnLogin}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Signing in…" : "Sign in →"}
          </button>

          {error && <div className={styles.error}>{error}</div>}
        </div>
      </div>
    </div>
  );
}
