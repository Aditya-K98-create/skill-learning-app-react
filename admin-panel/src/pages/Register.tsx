import { createUserWithEmailAndPassword } from "firebase/auth";
import { ref, set } from "firebase/database";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth, db } from "../services/firebase";

export default function Register() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email || !password || !name) {
      setErrorMsg("Please fill in all fields");
      return;
    }

    try {
      setLoading(true);

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password,
      );
      const user = userCredential.user;

      await set(ref(db, `admins/${user.uid}`), {
        name: name.trim(),
        email: email.trim(),
        role: "admin",
        createdAt: Date.now(),
      });

      alert("Admin Account Created! 🚀");
      navigate("/dashboard");
    } catch (error: any) {
      console.error(error);
      if (error.code === "auth/email-already-in-use") {
        setErrorMsg("This email is already registered.");
      } else if (error.code === "auth/weak-password") {
        setErrorMsg("Password should be at least 6 characters.");
      } else {
        setErrorMsg("Failed to create account. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logoContainer}>
          <div style={styles.logoIcon}>📝</div>
        </div>

        <h2 style={styles.title}>Create Admin</h2>
        <p style={styles.subtitle}>Setup your management credentials</p>

        {errorMsg && <div style={styles.errorBox}>{errorMsg}</div>}

        <form onSubmit={handleRegister}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Full Name</label>
            <input
              type="text"
              placeholder="Aditya K"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={styles.input}
              disabled={loading}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Admin Email</label>
            <input
              type="email"
              placeholder="admin@skillapp.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              disabled={loading}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            style={{
              ...styles.button,
              backgroundColor: loading ? "#94a3b8" : "#4f46e5",
              cursor: loading ? "not-allowed" : "pointer",
            }}
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Register Admin"}
          </button>
        </form>

        <p style={styles.footerText}>
          Already have an account?{" "}
          <Link
            to="/"
            style={{
              color: "#4f46e5",
              textDecoration: "none",
              fontWeight: "bold",
            }}
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    fontFamily: "'Inter', sans-serif",
  },
  card: {
    background: "#ffffff",
    padding: "40px",
    borderRadius: "24px",
    width: "100%",
    maxWidth: "400px",
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
    textAlign: "center",
    border: "1px solid #e2e8f0",
  },
  logoContainer: {
    marginBottom: "20px",
    display: "flex",
    justifyContent: "center",
  },
  logoIcon: {
    fontSize: "40px",
    background: "#f1f5f9",
    width: "80px",
    height: "80px",
    lineHeight: "80px",
    borderRadius: "20px",
  },
  title: {
    fontSize: "24px",
    fontWeight: "800",
    color: "#1e293b",
    margin: "0 0 8px 0",
  },
  subtitle: {
    marginBottom: "30px",
    color: "#64748b",
    fontSize: "14px",
    fontWeight: "500",
  },
  errorBox: {
    background: "#fef2f2",
    color: "#dc2626",
    padding: "12px",
    borderRadius: "12px",
    fontSize: "13px",
    marginBottom: "20px",
    border: "1px solid #fee2e2",
    fontWeight: "600",
  },
  inputGroup: { textAlign: "left", marginBottom: "15px" },
  label: {
    display: "block",
    fontSize: "12px",
    fontWeight: "700",
    color: "#475569",
    marginBottom: "8px",
    textTransform: "uppercase",
  },
  input: {
    width: "100%",
    padding: "12px 16px",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    outline: "none",
    fontSize: "15px",
    boxSizing: "border-box",
  },
  button: {
    width: "100%",
    padding: "14px",
    borderRadius: "12px",
    border: "none",
    color: "#fff",
    fontWeight: "700",
    fontSize: "16px",
    marginTop: "10px",
  },
  footerText: { marginTop: "25px", fontSize: "14px", color: "#94a3b8" },
};
