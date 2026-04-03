import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth } from "../services/firebase";

export default function Dashboard() {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState<string>("");

  // 🔐 Check logged-in user
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserEmail(user.email || "Admin");
      } else {
        navigate("/"); // redirect to login if not logged in
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // 🚪 Logout
  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <div style={styles.header}>
        <h1 style={styles.title}>Admin Dashboard 🚀</h1>
        <button style={styles.logoutBtn} onClick={handleLogout}>
          Logout
        </button>
      </div>

      {/* WELCOME TEXT */}
      <p style={styles.subtitle}>Welcome {userEmail}</p>

      {/* CONTENT BOXES */}
      <div style={styles.cards}>
        <div style={styles.card}>
          <h3>Total Users</h3>
          <p>Coming Soon</p>
        </div>

        <div style={styles.card}>
          <h3>Total Courses</h3>
          <p>Coming Soon</p>
        </div>

        <div style={styles.card}>
          <h3>Uploads</h3>
          <p>Coming Soon</p>
        </div>
      </div>
    </div>
  );
}

// 🎨 STYLES
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(to right, #0f172a, #1e3a8a)",
    color: "#fff",
    padding: "30px",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  title: {
    fontSize: "32px",
    fontWeight: "bold",
  },

  logoutBtn: {
    padding: "10px 15px",
    background: "#ef4444",
    border: "none",
    borderRadius: "8px",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "bold",
  },

  subtitle: {
    marginTop: "10px",
    color: "#cbd5f5",
  },

  cards: {
    display: "flex",
    gap: "20px",
    marginTop: "30px",
    flexWrap: "wrap",
  },

  card: {
    background: "#ffffff",
    color: "#1e293b",
    padding: "20px",
    borderRadius: "12px",
    width: "250px",
    boxShadow: "0 10px 20px rgba(0,0,0,0.2)",
  },
};