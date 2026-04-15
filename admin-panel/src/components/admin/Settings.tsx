import {
  Bell,
  Mail,
  Moon,
  Save,
  Settings as SettingsIcon,
  ShieldCheck,
  Smartphone,
  Sun,
} from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

interface SettingsProps {
  styles: any;
  isDark: boolean;
  toggleTheme: (v: boolean) => void;
}

export default function Settings({
  styles,
  isDark,
  toggleTheme,
}: SettingsProps) {
  const [loading, setLoading] = useState(false);
  const [maintenance, setMaintenance] = useState(false);

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("System preferences saved successfully!");
    }, 800);
  };

  const textColor = isDark ? "#f1f5f9" : "#1e293b";
  const subTextColor = isDark ? "#94a3b8" : "#64748b";
  const cardBg = isDark ? "#1e293b" : "#fff";
  const borderColor = isDark ? "#334155" : "#e2e8f0";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        maxWidth: "800px",
      }}
    >
      <div
        style={{
          ...styles.tableCard,
          backgroundColor: cardBg,
          borderColor: borderColor,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "25px",
          }}
        >
          <SettingsIcon size={20} color="#4f46e5" />
          <h3 style={{ margin: 0, color: textColor }}>General Settings</h3>
        </div>

        <div
          style={{
            ...styles.settingItem,
            borderColor: isDark ? "#334155" : "#f1f5f9",
          }}
        >
          <div style={styles.settingInfo}>
            <b style={{ color: textColor }}>Interface Theme</b>
            <p style={{ ...styles.settingSub, color: subTextColor }}>
              Switch between light and dark visual styles.
            </p>
          </div>
          <div
            style={{
              display: "flex",
              backgroundColor: isDark ? "#0f172a" : "#f1f5f9",
              padding: "4px",
              borderRadius: "12px",
              border: isDark ? "1px solid #334155" : "1px solid transparent",
            }}
          >
            <button
              onClick={() => toggleTheme(false)}
              style={{
                ...styles.themeToggleBtn,
                backgroundColor: !isDark
                  ? isDark
                    ? "#334155"
                    : "#fff"
                  : "transparent",
                color: !isDark ? "#4f46e5" : "#64748b",
                boxShadow: !isDark ? "0 2px 4px rgba(0,0,0,0.1)" : "none",
                border: "none",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                cursor: "pointer",
                padding: "8px 16px",
                borderRadius: "8px",
                fontWeight: "600",
              }}
            >
              <Sun size={16} /> Light
            </button>
            <button
              onClick={() => toggleTheme(true)}
              style={{
                ...styles.themeToggleBtn,
                backgroundColor: isDark ? "#4f46e5" : "transparent",
                color: isDark ? "#fff" : "#64748b",
                boxShadow: isDark ? "0 2px 4px rgba(0,0,0,0.2)" : "none",
                border: "none",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                cursor: "pointer",
                padding: "8px 16px",
                borderRadius: "8px",
                fontWeight: "600",
              }}
            >
              <Moon size={16} /> Dark
            </button>
          </div>
        </div>

        <div
          style={{
            ...styles.settingItem,
            borderBottom: "none",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={styles.settingInfo}>
            <b style={{ color: textColor }}>Maintenance Mode</b>
            <p style={{ ...styles.settingSub, color: subTextColor }}>
              Disable the mobile app for all users during updates.
            </p>
          </div>
          <label
            style={{
              position: "relative",
              display: "inline-block",
              width: "44px",
              height: "22px",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={maintenance}
              onChange={() => setMaintenance(!maintenance)}
              style={{ display: "none" }}
            />
            <span
              style={{
                display: "block",
                width: "44px",
                height: "22px",
                borderRadius: "34px",
                backgroundColor: maintenance
                  ? "#4f46e5"
                  : isDark
                    ? "#475569"
                    : "#e2e8f0",
                position: "relative",
                transition: "0.3s",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  height: "18px",
                  width: "18px",
                  left: maintenance ? "22px" : "2px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  top: "2px",
                  backgroundColor: "#ffffff",
                  borderRadius: "50%",
                  transition: "0.3s ease",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                }}
              ></div>
            </span>
          </label>
        </div>
      </div>

      <div
        style={{
          ...styles.tableCard,
          backgroundColor: cardBg,
          borderColor: borderColor,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "25px",
          }}
        >
          <Bell size={20} color="#f59e0b" />
          <h3 style={{ margin: 0, color: textColor }}>Communications</h3>
        </div>

        <div
          style={{
            ...styles.settingItem,
            borderColor: isDark ? "#334155" : "#f1f5f9",
          }}
        >
          <div style={styles.settingInfo}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: textColor,
              }}
            >
              <Mail size={16} /> <b>Email Reports</b>
            </div>
            <p style={{ ...styles.settingSub, color: subTextColor }}>
              Receive weekly XP reports of all learners via email.
            </p>
          </div>
          <input
            type="checkbox"
            defaultChecked
            style={{ width: "18px", height: "18px", accentColor: "#4f46e5" }}
          />
        </div>

        <div style={{ ...styles.settingItem, borderBottom: "none" }}>
          <div style={styles.settingInfo}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: textColor,
              }}
            >
              <Smartphone size={16} /> <b>Global Push Notifications</b>
            </div>
            <p style={{ ...styles.settingSub, color: subTextColor }}>
              Allow admin to send broadcast messages to all devices.
            </p>
          </div>
          <input
            type="checkbox"
            defaultChecked
            style={{ width: "18px", height: "18px", accentColor: "#4f46e5" }}
          />
        </div>
      </div>

      <div
        style={{
          ...styles.tableCard,
          backgroundColor: cardBg,
          borderColor: borderColor,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "25px",
          }}
        >
          <ShieldCheck size={20} color="#10b981" />
          <h3 style={{ margin: 0, color: textColor }}>Security & Access</h3>
        </div>

        <div style={{ ...styles.settingItem, borderBottom: "none" }}>
          <div style={styles.settingInfo}>
            <b style={{ color: textColor }}>Admin Session Timeout</b>
            <p style={{ ...styles.settingSub, color: subTextColor }}>
              Automatically logout after inactivity.
            </p>
          </div>
          <select
            style={{
              ...styles.selectInput,
              backgroundColor: isDark ? "#0f172a" : "#f8fafc",
              color: textColor,
              borderColor: borderColor,
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option>30 Minutes</option>
            <option>1 Hour</option>
            <option>24 Hours</option>
          </select>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginTop: "10px",
        }}
      >
        <button
          onClick={handleSave}
          style={{
            padding: "12px 30px",
            fontSize: "15px",
            backgroundColor: "#4f46e5",
            color: "#fff",
            border: "none",
            borderRadius: "12px",
            cursor: loading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontWeight: "600",
            opacity: loading ? 0.7 : 1,
            transition: "0.2s",
          }}
          disabled={loading}
        >
          {loading ? (
            "Saving..."
          ) : (
            <>
              <Save size={18} /> Save Preferences
            </>
          )}
        </button>
      </div>
    </div>
  );
}
