import { Award, Target, TrendingUp, Zap } from "lucide-react";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";

export default function Analytics({
  levelDistribution,
  stats,
  users,
  styles,
}: any) {
  const COLORS = ["#4f46e5", "#8b5cf6", "#a855f7", "#d946ef", "#ec4899"];
  const sortedLevelDistribution = [...levelDistribution].sort(
    (a: any, b: any) =>
      parseInt(a.name.replace("Lvl ", "")) -
      parseInt(b.name.replace("Lvl ", "")),
  );

  const topLearners = useMemo(() => {
    return [...users].sort((a, b) => b.xp - a.xp).slice(0, 3);
  }, [users]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.5fr 1fr",
          gap: "24px",
        }}
      >
        <div style={styles.chartSection}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "20px",
            }}
          >
            <Target size={20} color="#4f46e5" />
            <h3 style={{ margin: 0, fontSize: "18px" }}>
              Learner Level Distribution
            </h3>
          </div>
          <div style={{ height: 300, width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sortedLevelDistribution}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                />
                <Tooltip
                  cursor={{ fill: "#f8fafc" }}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                  }}
                />
                <Bar
                  dataKey="count"
                  fill="#4f46e5"
                  radius={[6, 6, 0, 0]}
                  barSize={45}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={styles.tableCard}>
          <h3 style={{ ...styles.sectionTitle, fontSize: "18px" }}>
            Level Distribution (%)
          </h3>
          <div style={{ height: 300, width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={levelDistribution}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                >
                  {sortedLevelDistribution.map((entry: any, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "24px",
        }}
      >
        <div style={styles.tableCard}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "15px",
            }}
          >
            <Zap size={18} color="#eab308" />
            <h4 style={{ margin: 0 }}>System Health</h4>
          </div>
          <div style={styles.analyticRow}>
            <span>Active Users:</span>
            <span style={{ color: "#10b981", fontWeight: "bold" }}>
              {users.length}
            </span>
          </div>
          <div style={styles.analyticRow}>
            <span>Avg XP / User:</span>
            <b>
              {users.length > 0 ? (stats.totalXP / users.length).toFixed(0) : 0}
            </b>
          </div>
          <div style={styles.analyticRow}>
            <span>Platform Overview:</span>
            <span style={{ color: "#10b981" }}>Operational</span>
          </div>
        </div>

        <div style={styles.tableCard}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "15px",
            }}
          >
            <Award size={18} color="#8b5cf6" />
            <h4 style={{ margin: 0 }}>Hall of Fame</h4>
          </div>
          {topLearners.map((user, index) => (
            <div key={user.id} style={styles.analyticRow}>
              <span>
                #{index + 1} {user.name}
              </span>
              <b style={{ color: "#8b5cf6" }}>{user.xp} XP</b>
            </div>
          ))}
        </div>

        <div style={styles.tableCard}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "15px",
            }}
          >
            <TrendingUp size={18} color="#3b82f6" />
            <h4 style={{ margin: 0 }}>Platform Overview</h4>
          </div>
          <div style={styles.analyticRow}>
            <span>Total XP Issued:</span>
            <b>{stats.totalXP.toLocaleString()}</b>
          </div>
          <div style={styles.analyticRow}>
            <span>New Users (MTD):</span>
            <b style={{ color: "#3b82f6" }}>+12%</b>
          </div>
          <div style={styles.analyticRow}>
            <span>Global Rank:</span>
            <b>Top 5%</b>
          </div>
        </div>
      </div>
    </div>
  );
}
