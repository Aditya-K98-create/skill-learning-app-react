import { Ionicons } from "@expo/vector-icons";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import * as Print from "expo-print";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import { getAuth } from "firebase/auth";
import { get, ref } from "firebase/database";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useGoals } from "../../components/context/GoalContext";
import { db } from "../../config/firebase";
import { useTheme } from "../../context/ThemeContext";

export default function Dashboard() {
  const { theme, isDarkMode } = useTheme();
  const { goals } = useGoals();
  const router = useRouter();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();

  const [rank, setRank] = useState<number | null>(null);
  const [userName, setUserName] = useState("User");
  const [selectedDay, setSelectedDay] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  const allTasks = useMemo(
    () => goals.flatMap((g: any) => g.tasks || []),
    [goals],
  );

  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter((t: any) => t?.completed).length;
  const percentage =
    totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  const xp = completedTasks * 10;
  const currentLevel = Math.floor(xp / 100) + 1;
  const xpInCurrentLevel = xp % 100;
  const xpToNext = 100 - xpInCurrentLevel;

  const animatedWidth = useRef(new Animated.Value(0)).current;

  const fetchUserName = async () => {
    const user = getAuth().currentUser;
    if (!user) return;
    const snapshot = await get(ref(db, `users/${user.uid}`));
    if (snapshot.exists()) setUserName(snapshot.val().name || "User");
  };

  const fetchRankAndLeaderboard = async () => {
    const snapshot = await get(ref(db, "users"));
    if (!snapshot.exists()) return;
    const data = snapshot.val();
    const usersArray = Object.keys(data).map((key) => ({
      id: key,
      name: data[key].name || "Learner",
      xp: data[key].xp || 0,
    }));
    usersArray.sort((a, b) => b.xp - a.xp);
    setLeaderboard(usersArray.slice(0, 5));
    const user = getAuth().currentUser;
    if (user) {
      const index = usersArray.findIndex((u) => u.id === user.uid);
      setRank(index + 1);
    }
  };

  useEffect(() => {
    fetchRankAndLeaderboard();
    fetchUserName();
  }, [goals]);

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: percentage,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [percentage]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning ☀️";
    if (hour < 18) return "Good Afternoon 🌤";
    return "Good Evening 🌙";
  };

  const streak = useMemo(() => {
    const dates = allTasks
      .filter((t: any) => t.completed && t.completedAt)
      .map((t: any) => new Date(t.completedAt).toDateString());
    return [...new Set(dates)].length;
  }, [allTasks]);

  const heatmapData = useMemo(() => {
    const countByDate: Record<string, number> = {};
    allTasks.forEach((task: any) => {
      if (!task.completedAt) return;
      const date = new Date(task.completedAt).toISOString().split("T")[0];
      countByDate[date] = (countByDate[date] || 0) + 1;
    });

    const days = [];
    const today = new Date();
    for (let i = 59; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const count = countByDate[dateStr] || 0;
      let color = isDarkMode ? "#334155" : "#ebedf0";
      if (count >= 5) color = "#166534";
      else if (count >= 3) color = "#16a34a";
      else if (count >= 2) color = "#4ade80";
      else if (count >= 1) color = "#bbf7d0";
      days.push({ date: dateStr, count, color });
    }
    return days;
  }, [allTasks, isDarkMode]);

  const generatePDFReport = async () => {
    try {
      const dateNow = new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      const goalsRows = goals
        .map((g: any) => {
          const total = g.tasks?.length || 0;
          const done = g.tasks?.filter((t: any) => t.completed).length || 0;
          const prog = total === 0 ? 0 : Math.round((done / total) * 100);
          return `<tr><td>${g.title}</td><td>${total} Tasks</td><td style="color: ${prog === 100 ? "#22c55e" : "#4f46e5"}; font-weight: bold;">${prog}%</td></tr>`;
        })
        .join("");

      const leaderboardRows = (leaderboard || [])
        .map(
          (u, i) => `
        <tr ${u.name === userName ? 'style="background-color: #f5f3ff;"' : ""}>
          <td>#${i + 1}</td>
          <td>${u.name || "Learner"}</td>
          <td>${u.xp || 0} XP</td>
        </tr>`,
        )
        .join("");

      const html = `<html><head><style>body { font-family: sans-serif; padding: 20px; color: #1e293b; } .section { margin-top: 20px; border-bottom: 1px solid #eee; padding-bottom: 10px; } table { width: 100%; border-collapse: collapse; } th, td { padding: 10px; border: 1px solid #eee; text-align: left; }</style></head><body><h1>Learning Report: ${userName}</h1><div class="section"><h3>Summary</h3><p>Level: ${currentLevel}</p><p>XP: ${xp}</p><p>Streak: ${streak} Days</p></div><table><thead><tr><th>Goal</th><th>Tasks</th><th>Progress</th></tr></thead><tbody>${goalsRows}</tbody></table></body></html>`;
      const result = await Print.printToFileAsync({ html });
      if (result && result.uri) await Sharing.shareAsync(result.uri);
    } catch (error) {
      alert("Error generating report");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: 20,
          paddingTop: insets.top + 10,
          paddingBottom: tabBarHeight + insets.bottom + 20,
        }}
      >
        <View style={styles.container}>
          {/* HEADER SECTION */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.greetingText, { color: theme.subText }]}>
                {getGreeting()}
              </Text>
              <Text style={[styles.userNameText, { color: theme.text }]}>
                {userName}
              </Text>
            </View>
            <Pressable
              onPress={() => router.push("/profile")}
              style={[styles.profileBadge, { backgroundColor: theme.tint }]}
            >
              <Text style={styles.profileInitial}>{userName.charAt(0)}</Text>
              <View
                style={[
                  styles.levelIndicator,
                  { borderColor: theme.background },
                ]}
              >
                <Text style={styles.levelIndicatorText}>{currentLevel}</Text>
              </View>
            </Pressable>
          </View>

          <View style={styles.quickActionsContainer}>
            <Pressable
              style={styles.actionBtn}
              onPress={() => router.push("/goals")}
            >
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: isDarkMode ? "#1e293b" : "#e0e7ff" },
                ]}
              >
                <Ionicons name="add" size={24} color={theme.tint} />
              </View>
              <Text style={[styles.actionLabel, { color: theme.subText }]}>
                Add Goal
              </Text>
            </Pressable>
            <Pressable
              style={styles.actionBtn}
              onPress={() => router.push("/learning")}
            >
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: isDarkMode ? "#2d2305" : "#fef3c7" },
                ]}
              >
                <Ionicons name="play" size={22} color="#d97706" />
              </View>
              <Text style={[styles.actionLabel, { color: theme.subText }]}>
                Learning
              </Text>
            </Pressable>
            <Pressable style={styles.actionBtn} onPress={generatePDFReport}>
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: isDarkMode ? "#062d16" : "#dcfce7" },
                ]}
              >
                <Ionicons name="document-text" size={22} color="#16a34a" />
              </View>
              <Text style={[styles.actionLabel, { color: theme.subText }]}>
                Report
              </Text>
            </Pressable>
          </View>

          <View style={[styles.card, { backgroundColor: theme.card }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>
                Overall Progress
              </Text>
              <View
                style={[
                  styles.levelChip,
                  {
                    backgroundColor: isDarkMode ? theme.background : "#f1f5f9",
                  },
                ]}
              >
                <Text style={[styles.levelChipText, { color: theme.tint }]}>
                  Level {currentLevel}
                </Text>
              </View>
            </View>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.text }]}>
                  🔥 {streak}
                </Text>
                <Text style={[styles.statLabel, { color: theme.subText }]}>
                  Streak
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.text }]}>
                  🏆 {xp}
                </Text>
                <Text style={[styles.statLabel, { color: theme.subText }]}>
                  Total XP
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.text }]}>
                  # {rank || "--"}
                </Text>
                <Text style={[styles.statLabel, { color: theme.subText }]}>
                  Rank
                </Text>
              </View>
            </View>
            <View style={styles.progressSection}>
              <View style={styles.progressLabels}>
                <Text style={[styles.progressText, { color: theme.subText }]}>
                  Mastery
                </Text>
                <Text style={[styles.progressText, { color: theme.subText }]}>
                  {percentage}%
                </Text>
              </View>
              <View
                style={[
                  styles.progressBg,
                  {
                    backgroundColor: isDarkMode ? theme.background : "#f1f5f9",
                  },
                ]}
              >
                <Animated.View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: theme.tint,
                      width: animatedWidth.interpolate({
                        inputRange: [0, 100],
                        outputRange: ["0%", "100%"],
                      }),
                    },
                  ]}
                />
              </View>
              <Text style={[styles.xpMiniText, { color: theme.subText }]}>
                {xpToNext} XP until Level {currentLevel + 1}
              </Text>
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: theme.card }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>
                Activity Insights
              </Text>
              <Text style={styles.smallLink}>Last 60 days</Text>
            </View>
            <View style={styles.heatmapWrapper}>
              <View style={styles.heatmapContainer}>
                {heatmapData.map((item, index) => (
                  <Pressable key={index} onPress={() => setSelectedDay(item)}>
                    <View
                      style={[
                        styles.heatmapBox,
                        {
                          backgroundColor: item.color,
                          borderWidth:
                            item.date === new Date().toISOString().split("T")[0]
                              ? 1.5
                              : 0,
                          borderColor: theme.tint,
                        },
                      ]}
                    />
                  </Pressable>
                ))}
              </View>
              <View style={styles.legend}>
                <Text style={styles.legendText}>Less</Text>
                <View
                  style={[
                    styles.legendBox,
                    { backgroundColor: isDarkMode ? "#1e293b" : "#ebedf0" },
                  ]}
                />
                <View
                  style={[styles.legendBox, { backgroundColor: "#bbf7d0" }]}
                />
                <View
                  style={[styles.legendBox, { backgroundColor: "#4ade80" }]}
                />
                <View
                  style={[styles.legendBox, { backgroundColor: "#166534" }]}
                />
                <Text style={styles.legendText}>More</Text>
              </View>
            </View>

            {selectedDay && (
              <View
                style={[
                  styles.dateDetailCard,
                  {
                    backgroundColor: isDarkMode ? theme.background : "#f5f3ff",
                    borderLeftColor: theme.tint,
                  },
                ]}
              >
                <Text style={[styles.dateDetailText, { color: theme.text }]}>
                  {new Date(selectedDay.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </Text>
                <Text style={[styles.dateDetailSubText, { color: theme.tint }]}>
                  {selectedDay.count} tasks smashed! 🚀
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
  },
  greetingText: { fontSize: 14, fontWeight: "500" },
  userNameText: { fontSize: 24, fontWeight: "bold" },
  profileBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
  },
  profileInitial: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  levelIndicator: {
    position: "absolute",
    bottom: -5,
    right: -5,
    backgroundColor: "#fbbf24",
    borderRadius: 10,
    paddingHorizontal: 6,
    borderWidth: 2,
  },
  levelIndicatorText: { fontSize: 10, fontWeight: "bold", color: "#000" },
  quickActionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  actionBtn: { alignItems: "center", width: "30%" },
  iconCircle: {
    width: 55,
    height: 55,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    elevation: 2,
  },
  actionLabel: { fontSize: 12, fontWeight: "600" },
  card: { padding: 20, borderRadius: 24, marginTop: 20, elevation: 4 },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  cardTitle: { fontSize: 18, fontWeight: "bold" },
  levelChip: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  levelChipText: { fontSize: 12, fontWeight: "bold" },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  statItem: { alignItems: "center" },
  statValue: { fontSize: 18, fontWeight: "bold" },
  statLabel: { fontSize: 12, marginTop: 2 },
  progressSection: { marginTop: 10 },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  progressText: { fontSize: 14, fontWeight: "600" },
  progressBg: { height: 12, borderRadius: 10, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 10 },
  xpMiniText: { fontSize: 11, marginTop: 8, textAlign: "center" },
  heatmapWrapper: { alignItems: "center" },
  heatmapContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    width: "100%",
  },
  heatmapBox: { width: 22, height: 22, margin: 3, borderRadius: 5 },
  legend: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
    alignSelf: "flex-end",
  },
  legendText: { fontSize: 10, color: "#94a3b8", marginHorizontal: 4 },
  legendBox: { width: 10, height: 10, borderRadius: 2, marginHorizontal: 2 },
  dateDetailCard: {
    marginTop: 15,
    padding: 15,
    borderRadius: 16,
    borderLeftWidth: 4,
  },
  dateDetailText: { fontWeight: "bold", fontSize: 14 },
  dateDetailSubText: { fontSize: 13, marginTop: 2 },
  smallLink: { fontSize: 12, color: "#94a3b8" },
});
