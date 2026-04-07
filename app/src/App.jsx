import { useState } from "react";
import LoginView from "./Components/LoginView";
import { gasPost } from "./scripts/api";
import UserView from "./Components/UserView";
import styles from "./css/App.module.css";

export default function App() {
  const [session, setSession] = useState(null); // null | { email }
  const [canSignOut, setCanSignOut] = useState(true);
  const handleLogout = async () => {
    setCanSignOut(false);
    try {
      const res = await gasPost({ action: "lockUser", email: session.email });
      console.log(res);
      setSession(null);
    } catch {
      // pass
    }
    setCanSignOut(true);
  };

  if (!session) {
    return <LoginView onLogin={setSession} />;
  }

  return (
    <div className={styles.app}>
      {/* ── App header ── */}
      <header className={styles.header}>
        <div className={styles.brand}>
          {/* <span className={styles.logo}>ولو آية</span> */}
          <img
            className={styles.logo}
            src={`${import.meta.env.BASE_URL}walaw-aya-logo-white.svg`}
          />
          <div className={styles.divider} />
          <span className={styles.appName}>User Study</span>
        </div>

        <div className={styles.headerRight}>
          <span className={styles.userEmail}>{session.email}</span>
          <button
            className={styles.btnLogout}
            onClick={handleLogout}
            disabled={!canSignOut}
          >
            Sign out
          </button>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className={styles.main}>
        <UserView userEmail={session.email} />
      </main>
    </div>
  );
}
