import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { getAuth } from "firebase/auth";
import { onValue, ref } from "firebase/database";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { db } from "../../config/firebase";
import { useTheme } from "../../context/ThemeContext";

export default function Leaderboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const { theme, isDarkMode } = useTheme();

  const auth = getAuth();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const usersRef = ref(db, "users");
    const unsubscribe = onValue(usersRef, (snapshot) => {
      if (!snapshot.exists()) {
        setLoading(false);
        return;
      }

      const data = snapshot.val();
      const list = Object.keys(data).map((key) => ({
        id: key,
        name: data[key].name || "Learner",
        xp: data[key].xp || 0,
        streak: data[key].streak || 0,
        photoURL: data[key].photoURL || null,
      }));

      list.sort((a, b) => b.xp - a.xp);
      setUsers(list);

      const user = auth.currentUser;
      if (user) {
        const index = list.findIndex((u) => u.id === user.uid);
        setMyRank(index + 1);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const renderRankBadge = (index: number) => {
    if (index === 0)
      return <Ionicons name="trophy" size={22} color="#fbbf24" />;
    if (index === 1) return <Ionicons name="medal" size={22} color="#94a3b8" />;
    if (index === 2) return <Ionicons name="medal" size={22} color="#b45309" />;
    return (
      <Text style={[styles.rankNumber, { color: theme.subText }]}>
        #{index + 1}
      </Text>
    );
  };

  const gradientColors = isDarkMode
    ? (["#0f172a", "#1e1b4b"] as const)
    : (["#e0e7ff", "#c7d2fe"] as const);

  return (
    <View
      style={{ flex: 1, backgroundColor: isDarkMode ? "#0f172a" : "#e0e7ff" }}
    >
      <LinearGradient colors={gradientColors} style={styles.container}>
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <View>
            <Text style={[styles.title, { color: theme.text }]}>
              Leaderboard
            </Text>
            <Text style={[styles.subtitle, { color: theme.subText }]}>
              Global Rankings • Real-time
            </Text>
          </View>
          <View
            style={[
              styles.headerIcon,
              {
                backgroundColor: isDarkMode
                  ? "rgba(99, 102, 241, 0.15)"
                  : "rgba(255, 255, 255, 0.6)",
              },
            ]}
          >
            <Ionicons name="stats-chart" size={22} color={theme.tint} />
          </View>
        </View>

        {myRank && !loading && (
          <View style={styles.topContainer}>
            <LinearGradient
              colors={["#4f46e5", "#6366f1"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.myRankChip}
            >
              <Text style={styles.myRankChipText}>Your Rank: #{myRank}</Text>
            </LinearGradient>
          </View>
        )}

        {loading ? (
          <ActivityIndicator
            size="large"
            color={theme.tint}
            style={{ marginTop: 50 }}
          />
        ) : (
          <FlatList
            data={users}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingBottom: 120,
            }}
            renderItem={({ item, index }) => {
              const isMe = item.id === auth.currentUser?.uid;
              const isTop3 = index < 3;

              return (
                <View
                  style={[
                    styles.card,
                    {
                      backgroundColor: theme.card,
                      borderColor: isMe ? theme.tint : "transparent",
                    },
                    isMe && { borderWidth: 2 },
                  ]}
                >
                  <View style={styles.rankContainer}>
                    {renderRankBadge(index)}
                  </View>

                  <View style={styles.avatarContainer}>
                    <View
                      style={[
                        styles.avatarFrame,
                        {
                          backgroundColor: isTop3
                            ? "#fbbf24"
                            : isDarkMode
                              ? "#334155"
                              : "#cbd5e1",
                          borderColor: isTop3 ? "#fbbf24" : "transparent",
                        },
                      ]}
                    >
                      {item.photoURL ? (
                        <Image
                          source={{ uri: item.photoURL }}
                          style={styles.avatarImage}
                        />
                      ) : (
                        <Text
                          style={[
                            styles.avatarText,
                            isTop3 && { color: "#78350f" },
                          ]}
                        >
                          {item.name.charAt(0).toUpperCase()}
                        </Text>
                      )}
                    </View>
                    {isMe && (
                      <View
                        style={[styles.onlineDot, { borderColor: theme.card }]}
                      />
                    )}
                  </View>

                  <View style={styles.infoContainer}>
                    <Text
                      style={[
                        styles.name,
                        { color: theme.text },
                        isMe && { fontWeight: "800" },
                      ]}
                      numberOfLines={1}
                    >
                      {item.name} {isMe ? "(You)" : ""}
                    </Text>
                    <View style={styles.streakRow}>
                      <Ionicons name="flame" size={14} color="#f97316" />
                      <Text
                        style={[styles.streakText, { color: theme.subText }]}
                      >
                        {item.streak} day streak
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.xpBadge,
                      {
                        backgroundColor: isTop3
                          ? "rgba(251, 191, 36, 0.15)"
                          : isDarkMode
                            ? "#1e293b"
                            : "#f1f5f9",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.xpText,
                        { color: isTop3 ? "#d97706" : theme.tint },
                      ]}
                    >
                      {item.xp} XP
                    </Text>
                  </View>
                </View>
              );
            }}
          />
        )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    marginBottom: 15,
  },
  title: { fontSize: 28, fontWeight: "900" },
  subtitle: { fontSize: 13, marginTop: 2 },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  topContainer: { alignItems: "center", marginBottom: 20 },
  myRankChip: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 25,
    elevation: 8,
    shadowColor: "#4f46e5",
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  myRankChipText: { color: "#fff", fontWeight: "800", fontSize: 13 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 22,
    marginBottom: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  rankContainer: { width: 40, alignItems: "center", justifyContent: "center" },
  rankNumber: { fontWeight: "800", fontSize: 15 },
  avatarContainer: { position: "relative", marginHorizontal: 12 },
  avatarFrame: {
    width: 50,
    height: 50,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
  },
  avatarImage: { width: "100%", height: "100%", borderRadius: 18 },
  avatarText: { color: "#fff", fontWeight: "bold", fontSize: 18 },
  onlineDot: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#22c55e",
    borderWidth: 2,
  },
  infoContainer: { flex: 1 },
  name: { fontSize: 16, fontWeight: "600" },
  streakRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  streakText: { fontSize: 12, marginLeft: 4, fontWeight: "500" },
  xpBadge: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14 },
  xpText: { fontWeight: "800", fontSize: 14 },
});
