import { LinearGradient } from "expo-linear-gradient";
import { getAuth } from "firebase/auth";
import { get, ref } from "firebase/database";
import { useEffect, useState } from "react";
import { FlatList, StatusBar, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { db } from "../../config/firebase";

export default function Leaderboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [myRank, setMyRank] = useState<number | null>(null);

  const auth = getAuth();
  const insets = useSafeAreaInsets(); // 🔥 SAFE AREA

  const fetchLeaderboard = async () => {
    try {
      const snapshot = await get(ref(db, "users"));

      if (!snapshot.exists()) return;

      const data = snapshot.val();

      const list = Object.keys(data).map((key) => ({
        id: key,
        name: data[key].name || "User",
        xp: data[key].xp || 0,
        streak: data[key].streak || 0,
      }));

      list.sort((a, b) => b.xp - a.xp);

      setUsers(list);

      const user = auth.currentUser;
      if (!user) return;

      const index = list.findIndex((u) => u.id === user.uid);
      setMyRank(index + 1);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const getRankStyle = (index: number) => {
    if (index === 0) return styles.gold;
    if (index === 1) return styles.silver;
    if (index === 2) return styles.bronze;
    return styles.normal;
  };

  return (
    <LinearGradient
      colors={["#0f172a", "#1e3a8a"]}
      style={[
        styles.container,
        {
          paddingTop: insets.top + 10, // 🔥 FIX TOP
          paddingHorizontal: 16, // 🔥 FIX SIDE
        },
      ]}
    >
      <StatusBar barStyle="light-content" />

      <Text style={styles.title}>🏆 Leaderboard</Text>
      <Text style={styles.subtitle}>Top learners this week 🚀</Text>

      {myRank !== null && (
        <View style={styles.myRankCard}>
          <Text style={styles.myRankText}>Your Rank: #{myRank}</Text>
        </View>
      )}

      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item, index }) => (
          <View style={[styles.card, getRankStyle(index)]}>
            <Text style={styles.rank}>#{index + 1}</Text>

            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.sub}>🔥 Streak: {item.streak}</Text>
            </View>

            <View style={styles.xpBox}>
              <Text style={styles.xpText}>{item.xp} XP</Text>
            </View>
          </View>
        )}
      />
    </LinearGradient>
  );
}

// 🎨 STYLES
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
  },

  subtitle: {
    color: "#cbd5f5",
    marginBottom: 20,
  },

  myRankCard: {
    backgroundColor: "rgba(255,255,255,0.15)",
    padding: 12,
    borderRadius: 12,
    marginBottom: 15,
  },

  myRankText: {
    color: "#fff",
    fontWeight: "bold",
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },

  rank: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    width: 50,
  },

  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },

  sub: {
    fontSize: 12,
    color: "#cbd5f5",
  },

  xpBox: {
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },

  xpText: {
    fontWeight: "bold",
  },

  gold: { backgroundColor: "#f59e0b" },
  silver: { backgroundColor: "#9ca3af" },
  bronze: { backgroundColor: "#b45309" },
  normal: { backgroundColor: "rgba(255,255,255,0.2)" },
});
