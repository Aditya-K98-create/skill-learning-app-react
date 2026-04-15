import { Download, PlusCircle, Search, UserMinus } from "lucide-react";

export default function Users({
  users,
  searchTerm,
  setSearchTerm,
  setSelectedUser,
  handleDelete,
  styles,
  exportToCSV,
}: any) {
  const filteredUsers = users.filter((u: any) =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );
  interface User {
    id: string;
    name: string;
    email: string;
    xp: number;
    level: number;
    photoURL?: string;
  }

  interface UsersProps {
    users: User[];
    searchTerm: string;
    setSearchTerm: (value: string) => void;
    setSelectedUser: (user: User) => void;
    handleDelete: (user: User) => void;
    styles: any;
    exportToCSV: () => void;
  }
  return (
    <div style={styles.tableCard}>
      <div
        style={{
          ...styles.tableHeader,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2 style={styles.sectionTitle}>Learner Management</h2>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <div style={styles.searchBox}>
            <Search size={18} color="#94a3b8" />
            <input
              placeholder="Search name..."
              style={styles.searchInput}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button
            onClick={exportToCSV}
            style={{
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
            }}
          >
            <Download size={18} />
            Export CSV
          </button>
        </div>
      </div>

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={{ ...styles.th, width: "45%" }}>Learner</th>
            <th style={{ ...styles.th, width: "25%" }}>Rank/Status</th>
            <th style={{ ...styles.th, width: "30%", textAlign: "right" }}>
              Actions
            </th>
          </tr>
        </thead>

        <tbody>
          {filteredUsers.map((user: any) => (
            <tr key={user.id} style={styles.tr}>
              <td style={styles.td}>
                <div style={styles.userInfo}>
                  {user.photoURL && user.photoURL.startsWith("http") ? (
                    <img src={user.photoURL} alt="" style={styles.avatarImg} />
                  ) : (
                    <div style={styles.avatar}>{user.name[0]}</div>
                  )}
                  <div>
                    <div style={styles.userName}>{user.name}</div>
                    <div style={styles.userEmail}>{user.email}</div>
                  </div>
                </div>
              </td>

              <td style={styles.td}>
                <div style={styles.xpText}>{user.xp} XP</div>
                <div style={styles.levelText}>Level {user.level}</div>
              </td>

              <td style={{ ...styles.td, textAlign: "right" }}>
                <button
                  onClick={() => setSelectedUser(user)}
                  style={styles.iconBtn}
                  title="Add XP"
                >
                  <PlusCircle size={20} color="#3b82f6" />
                </button>

                <button
                  onClick={() => handleDelete(user)}
                  style={styles.iconBtn}
                  title="Delete"
                >
                  <UserMinus size={20} color="#ef4444" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
