import { onAuthStateChanged, signOut } from "firebase/auth";
import { onValue, ref, remove, update } from "firebase/database";
import {
  BarChart3,
  LayoutDashboard,
  LogOut,
  Settings as SettingsIcon,
  Users as UsersIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { auth, db } from "../services/firebase";

import Analytics from "../components/Analytics";
import Settings from "../components/admin/Settings";
import Users from "../components/admin/Users";
interface UserData {
  id: string;
  name: string;
  email: string;
  xp: number;
  level: number;
  photoURL?: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");

  const [isDark, setIsDark] = useState(
    () => localStorage.getItem("admin-dark") === "true",
  );

  const toggleTheme = (val: boolean) => {
    setIsDark(val);
    localStorage.setItem("admin-dark", val.toString());
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) navigate("/");
    });

    const usersRef = ref(db, "users");
    const unsubscribeData = onValue(usersRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const usersList: UserData[] = Object.keys(data).map((key) => ({
          id: key,
          name: data[key].name || "Learner",
          email: data[key].email || "No Email",
          xp: data[key].xp || 0,
          level: Math.floor((data[key].xp || 0) / 100) + 1,
          photoURL: data[key].photoURL,
        }));
        setUsers(usersList);
      }
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeData();
    };
  }, [navigate]);

  const stats = useMemo(() => {
    const totalXP = users.reduce((acc, curr) => acc + (curr.xp || 0), 0);
    return {
      totalUsers: users.length,
      totalXP,
      avgLevel:
        users.length > 0 ? (totalXP / users.length / 100 + 1).toFixed(1) : "0",
    };
  }, [users]);

  const levelDistribution = useMemo(() => {
    const levels: Record<string, number> = {};
    users.forEach((u) => {
      const lvl = `Lvl ${u.level}`;
      levels[lvl] = (levels[lvl] || 0) + 1;
    });
    return Object.keys(levels).map((key) => ({
      name: key,
      count: levels[key],
    }));
  }, [users]);

  const chartData = [
    { name: "Mon", xp: 400 },
    { name: "Tue", xp: 700 },
    { name: "Wed", xp: 1200 },
    { name: "Thu", xp: 900 },
    { name: "Fri", xp: 1500 },
    { name: "Sat", xp: 2100 },
    { name: "Sun", xp: 4050 },
  ];

  const handleUpdateXP = async (amount: number) => {
    if (!selectedUser) return;
    try {
      await update(ref(db, `users/${selectedUser.id}`), {
        xp: selectedUser.xp + amount,
      });
      toast.success(`Added ${amount} XP to ${selectedUser.name}!`);
      setSelectedUser(null);
    } catch (err) {
      toast.error("Update failed");
    }
  };

  const handleDelete = (user: UserData) => {
    if (window.confirm(`Delete ${user.name}? This cannot be undone.`)) {
      remove(ref(db, `users/${user.id}`));
      toast.success("User deleted");
    }
  };

  const exportToCSV = () => {
    const headers = ["Name,Email,XP,Level\n"];
    const rows = users.map((u) => `${u.name},${u.email},${u.xp},${u.level}\n`);
    const blob = new Blob([...headers, ...rows], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "learners_report.csv";
    a.click();
    toast.success("Report Exported!");
  };

  if (loading)
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          background: isDark ? "#0f172a" : "#fff",
          color: isDark ? "#fff" : "#000",
        }}
      >
        Loading...
      </div>
    );

  return (
    <div
      style={{
        ...styles.appWrapper,
        backgroundColor: isDark ? "#0f172a" : "#f8fafc",
      }}
    >
      <Toaster position="top-right" />

      {/* SIDEBAR NAVIGATION */}
      <aside
        style={{
          ...styles.sidebar,
          backgroundColor: isDark ? "#1e293b" : "#fff",
          borderRight: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
        }}
      >
        <div style={styles.sidebarLogo}>
          <div style={styles.logoIcon}>S</div>
          <h2
            style={{
              ...styles.logoText,
              color: isDark ? "#f1f5f9" : "#1e293b",
            }}
          >
            SkillAdmin
          </h2>
        </div>

        <nav style={styles.navMenu}>
          {[
            {
              id: "dashboard",
              icon: <LayoutDashboard size={20} />,
              label: "Dashboard",
            },
            { id: "users", icon: <UsersIcon size={20} />, label: "Users" },
            {
              id: "analytics",
              icon: <BarChart3 size={20} />,
              label: "Analytics",
            },
            {
              id: "settings",
              icon: <SettingsIcon size={20} />,
              label: "Settings",
            },
          ].map((item) => (
            <div
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                ...styles.navItem,
                backgroundColor:
                  activeTab === item.id
                    ? isDark
                      ? "#334155"
                      : "#f1f5f9"
                    : "transparent",
                color: activeTab === item.id ? "#4f46e5" : "#64748b",
              }}
            >
              {item.icon} {item.label}
            </div>
          ))}
        </nav>

        <button onClick={() => signOut(auth)} style={styles.logoutBtnSidebar}>
          <LogOut size={18} /> Logout
        </button>
      </aside>

      <main
        style={{ ...styles.mainContent, color: isDark ? "#f1f5f9" : "#1e293b" }}
      >
        {activeTab === "dashboard" && (
          <>
            <header style={styles.header}>
              <div>
                <h1
                  style={{
                    ...styles.welcomeText,
                    color: isDark ? "#f1f5f9" : "#1e293b",
                  }}
                >
                  Hello, Admin
                </h1>
                <p
                  style={{
                    ...styles.subHeaderText,
                    color: isDark ? "#94a3b8" : "#64748b",
                  }}
                >
                  Here's what's happening today.
                </p>
              </div>
            </header>

            <div style={styles.statsGrid}>
              <StatCard
                isDark={isDark}
                title="Learners"
                value={stats.totalUsers}
                icon={<UsersIcon />}
                growth="+2 today"
                color="#3b82f6"
              />
              <StatCard
                isDark={isDark}
                title="System XP"
                value={stats.totalXP}
                growth="+450 today"
                color="#10b981"
              />
              <StatCard
                isDark={isDark}
                title="Avg Level"
                value={stats.avgLevel}
                growth="+0.2 up"
                color="#8b5cf6"
              />
            </div>

            <div
              style={{
                ...styles.chartSection,
                backgroundColor: isDark ? "#1e293b" : "#fff",
                borderColor: isDark ? "#334155" : "#e2e8f0",
              }}
            >
              <h3
                style={{
                  ...styles.sectionTitle,
                  color: isDark ? "#f1f5f9" : "#1e293b",
                }}
              >
                XP Activity Overview
              </h3>
              <div style={{ height: 300, width: "100%" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorXP" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="#4f46e5"
                          stopOpacity={0.2}
                        />
                        <stop
                          offset="95%"
                          stopColor="#4f46e5"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke={isDark ? "#334155" : "#f1f5f9"}
                    />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#94a3b8" }}
                      dy={10}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? "#1e293b" : "#fff",
                        borderRadius: "12px",
                        border: "none",
                        color: isDark ? "#fff" : "#000",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="xp"
                      stroke="#4f46e5"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorXP)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {activeTab === "users" && (
          <Users
            users={users}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            setSelectedUser={setSelectedUser}
            handleDelete={handleDelete}
            styles={styles}
            isDark={isDark}
            exportToCSV={exportToCSV}
          />
        )}

        {activeTab === "analytics" && (
          <Analytics
            levelDistribution={levelDistribution}
            stats={stats}
            users={users}
            styles={styles}
            isDark={isDark}
          />
        )}

        {activeTab === "settings" && (
          <Settings styles={styles} isDark={isDark} toggleTheme={toggleTheme} />
        )}
      </main>

      {/* MODAL */}
      {selectedUser && (
        <div style={styles.modalOverlay}>
          <div
            style={{
              ...styles.modal,
              backgroundColor: isDark ? "#1e293b" : "#fff",
            }}
          >
            <h3
              style={{
                marginBottom: "10px",
                color: isDark ? "#f1f5f9" : "#1e293b",
              }}
            >
              Modify XP
            </h3>
            <p
              style={{
                color: isDark ? "#94a3b8" : "#64748b",
                marginBottom: "20px",
              }}
            >
              Editing: <b>{selectedUser.name}</b>
            </p>
            <div style={styles.modalActions}>
              <button
                onClick={() => handleUpdateXP(50)}
                style={styles.modalBtn}
              >
                +50 XP
              </button>
              <button
                onClick={() => handleUpdateXP(100)}
                style={styles.modalBtn}
              >
                +100 XP
              </button>
              <button
                onClick={() => setSelectedUser(null)}
                style={{
                  ...styles.cancelBtn,
                  backgroundColor: isDark ? "#334155" : "#f1f5f9",
                  color: isDark ? "#f1f5f9" : "#64748b",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon, growth, color, isDark }: any) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: isDark ? "#1e293b" : "#fff",
        padding: "24px",
        borderRadius: "24px",
        border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      }}
    >
      <div>
        <div
          style={{
            color: isDark ? "#94a3b8" : "#64748b",
            fontSize: "14px",
            fontWeight: "500",
            marginBottom: "8px",
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: "32px",
            fontWeight: "800",
            color: isDark ? "#f1f5f9" : "#1e293b",
          }}
        >
          {value}
        </div>
        <div
          style={{
            color: "#10b981",
            fontSize: "13px",
            fontWeight: "700",
            marginTop: "6px",
          }}
        >
          {growth}
        </div>
      </div>
      <div
        style={{
          backgroundColor: `${color}15`,
          padding: "14px",
          borderRadius: "18px",
          color,
        }}
      >
        {icon}
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  appWrapper: {
    display: "flex",
    minHeight: "100vh",
    fontFamily: "'Inter', sans-serif",
  },
  sidebar: {
    width: "260px",
    padding: "32px 24px",
    display: "flex",
    flexDirection: "column",
    position: "fixed",
    height: "100vh",
    zIndex: 100,
  },
  sidebarLogo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "48px",
  },
  logoIcon: {
    width: "35px",
    height: "35px",
    backgroundColor: "#4f46e5",
    borderRadius: "10px",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    fontSize: "20px",
  },
  logoText: { fontSize: "20px", fontWeight: "bold" },
  navMenu: { flex: 1 },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 16px",
    borderRadius: "12px",
    fontWeight: "500",
    cursor: "pointer",
    marginBottom: "8px",
    transition: "0.2s",
  },
  logoutBtnSidebar: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: "#ef4444",
    border: "none",
    background: "none",
    fontWeight: "600",
    cursor: "pointer",
    padding: "12px 16px",
  },
  mainContent: {
    flex: 1,
    padding: "70px",
    marginLeft: "260px",
    width: "100%",
    maxWidth: "100%",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "40px",
  },
  welcomeText: { fontSize: "28px", fontWeight: "800" },
  subHeaderText: { marginTop: "4px" },
  exportBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: "#4f46e5",
    color: "#fff",
    padding: "10px 20px",
    borderRadius: "12px",
    border: "none",
    fontWeight: "600",
    cursor: "pointer",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "24px",
    marginBottom: "40px",
  },
  chartSection: {
    padding: "32px",
    borderRadius: "24px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
    border: "1px solid #e2e8f0",
    marginBottom: "32px",
  },
  tableCard: {
    borderRadius: "24px",
    padding: "32px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  },
  tableHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
  },
  sectionTitle: { fontSize: "20px", fontWeight: "bold" },
  searchBox: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    backgroundColor: "#f1f5f9",
    padding: "10px 16px",
    borderRadius: "12px",
    width: "280px",
  },
  searchInput: {
    border: "none",
    background: "none",
    outline: "none",
    width: "100%",
    fontSize: "14px",
  },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    textAlign: "left",
    padding: "16px",
    color: "#94a3b8",
    fontSize: "12px",
    textTransform: "uppercase",
    borderBottom: "1px solid #f1f5f9",
    fontWeight: "700",
  },
  td: { padding: "20px 16px", borderBottom: "1px solid #f8fafc" },
  userInfo: { display: "flex", alignItems: "center", gap: "14px" },
  avatar: {
    width: "42px",
    height: "42px",
    backgroundColor: "#e2e8f0",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    color: "#475569",
  },
  avatarImg: {
    width: "42px",
    height: "42px",
    borderRadius: "12px",
    objectFit: "cover",
  },
  userName: { fontWeight: "700", fontSize: "15px" },
  userEmail: { fontSize: "13px", color: "#94a3b8" },
  xpText: { fontWeight: "700" },
  levelText: { fontSize: "12px", color: "#64748b" },
  iconBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "8px",
    marginLeft: "4px",
    borderRadius: "8px",
    transition: "0.2s",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(15, 23, 42, 0.4)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    padding: "40px",
    borderRadius: "28px",
    width: "400px",
    textAlign: "center",
    boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
  },
  modalActions: {
    display: "flex",
    gap: "12px",
    marginTop: "24px",
    justifyContent: "center",
  },
  modalBtn: {
    padding: "12px 24px",
    backgroundColor: "#4f46e5",
    color: "#fff",
    border: "none",
    borderRadius: "14px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  cancelBtn: {
    padding: "12px 24px",
    borderRadius: "14px",
    border: "none",
    cursor: "pointer",
    fontWeight: "600",
  },
  statLine: {
    display: "flex",
    justifyContent: "space-between",
    padding: "15px 0",
    borderBottom: "1px solid #f1f5f9",
  },
  themeToggleBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 16px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "600",
  },
  switch: {
    position: "relative",
    display: "inline-block",
    width: "44px",
    height: "22px",
  },
  slider: {
    position: "absolute",
    cursor: "pointer",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    transition: ".4s",
    borderRadius: "34px",
  },
};
