import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { getAuth } from "firebase/auth";
import { onValue, ref } from "firebase/database";
import { useEffect, useState } from "react";
import { FlatList, StatusBar, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { db } from "../../config/firebase";
import { useTheme } from "../../context/ThemeContext";

export default function Leaderboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [myRank, setMyRank] = useState<number | null>(null);
  const { theme, isDarkMode } = useTheme(); // Use Theme Hook

  const auth = getAuth();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const usersRef = ref(db, "users");
    const unsubscribe = onValue(usersRef, (snapshot) => {
      if (!snapshot.exists()) return;

      const data = snapshot.val();
      const list = Object.keys(data).map((key) => ({
        id: key,
        name: data[key].name || "Learner",
        xp: data[key].xp || 0,
        streak: data[key].streak || 0,
        avatar: data[key].avatar || null,
      }));

      list.sort((a, b) => b.xp - a.xp);
      setUsers(list);

      const user = auth.currentUser;
      if (user) {
        const index = list.findIndex((u) => u.id === user.uid);
        setMyRank(index + 1);
      }
    });

    return () => unsubscribe();
  }, []);

  const renderRankBadge = (index: number) => {
    if (index === 0)
      return <Ionicons name="trophy" size={20} color="#fbbf24" />;
    if (index === 1) return <Ionicons name="medal" size={20} color="#94a3b8" />;
    if (index === 2) return <Ionicons name="medal" size={20} color="#b45309" />;
    return (
      <Text style={[styles.rankNumber, { color: theme.subText }]}>
        #{index + 1}
      </Text>
    );
  };

  const gradientColors = isDarkMode
    ? ["#0f172a", "#1e1b4b"]
    : ["#e0e7ff", "#c7d2fe"];

  return (
    <View
      style={{ flex: 1, backgroundColor: isDarkMode ? "#0f172a" : "#e0e7ff" }}
    >
      <LinearGradient colors={gradientColors} style={styles.container}>
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <View>
            <Text style={[styles.title, { color: theme.text }]}>
              Leaderboard
            </Text>
            <Text style={[styles.subtitle, { color: theme.subText }]}>
              Weekly Rankings • Resets in 3d
            </Text>
          </View>
          <View
            style={[
              styles.headerIcon,
              {
                backgroundColor: isDarkMode
                  ? "rgba(99, 102, 241, 0.1)"
                  : "rgba(255, 255, 255, 0.5)",
              },
            ]}
          >
            <Ionicons name="stats-chart" size={24} color={theme.tint} />
          </View>
        </View>

        <View style={styles.topContainer}>
          {myRank && (
            <View style={[styles.myRankChip, { backgroundColor: theme.tint }]}>
              <Text style={styles.myRankChipText}>Your Rank: #{myRank}</Text>
            </View>
          )}
        </View>

        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
          renderItem={({ item, index }) => {
            const isMe = item.id === auth.currentUser?.uid;
            const isTop3 = index < 3;

            return (
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: theme.card,
                    borderColor: isDarkMode
                      ? "rgba(255, 255, 255, 0.05)"
                      : "rgba(99, 102, 241, 0.1)",
                  },
                  isMe && { borderColor: theme.tint, borderWidth: 2 },
                  isTop3 && isDarkMode && styles.top3CardDark,
                ]}
              >
                <View style={styles.rankContainer}>
                  {renderRankBadge(index)}
                </View>

                <View style={styles.avatarContainer}>
                  <View
                    style={[
                      styles.avatarPlaceholder,
                      {
                        backgroundColor: isMe
                          ? theme.tint
                          : isDarkMode
                            ? "#334155"
                            : "#cbd5e1",
                      },
                    ]}
                  >
                    <Text style={styles.avatarText}>
                      {item.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  {isMe && (
                    <View
                      style={[
                        styles.onlineDot,
                        { borderColor: isDarkMode ? "#1e1b4b" : "#fff" },
                      ]}
                    />
                  )}
                </View>

                <View style={styles.infoContainer}>
                  <Text
                    style={[
                      styles.name,
                      { color: theme.text },
                      isMe && styles.myName,
                    ]}
                  >
                    {item.name} {isMe ? "(You)" : ""}
                  </Text>
                  <View style={styles.streakRow}>
                    <Ionicons name="flame" size={12} color="#f97316" />
                    <Text style={[styles.streakText, { color: theme.subText }]}>
                      {item.streak} day streak
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.xpBadge,
                    { backgroundColor: isDarkMode ? "#1e293b" : "#f1f5f9" },
                    isTop3 && styles.top3XpBadge,
                  ]}
                >
                  <Text
                    style={[
                      styles.xpText,
                      { color: theme.tint },
                      isTop3 && styles.top3XpText,
                    ]}
                  >
                    {item.xp} XP
                  </Text>
                </View>
              </View>
            );
          }}
        />
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 13,
  },
  headerIcon: {
    width: 45,
    height: 45,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  topContainer: {
    alignItems: "center",
    marginBottom: 15,
  },
  myRankChip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    elevation: 4,
  },
  myRankChipText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 20,
    marginBottom: 10,
    borderWidth: 1,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  top3CardDark: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  rankContainer: {
    width: 35,
    alignItems: "center",
    justifyContent: "center",
  },
  rankNumber: {
    fontWeight: "bold",
    fontSize: 14,
  },
  avatarContainer: {
    position: "relative",
    marginHorizontal: 12,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  onlineDot: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#22c55e",
    borderWidth: 2,
  },
  infoContainer: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: "600",
  },
  myName: {
    fontWeight: "bold",
  },
  streakRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  streakText: {
    fontSize: 11,
    marginLeft: 4,
  },
  xpBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  top3XpBadge: {
    backgroundColor: "#fbbf24",
  },
  xpText: {
    fontWeight: "bold",
    fontSize: 13,
  },
  top3XpText: {
    color: "#78350f",
  },
});
