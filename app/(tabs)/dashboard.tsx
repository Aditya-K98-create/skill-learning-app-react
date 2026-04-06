import { Ionicons } from "@expo/vector-icons";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import * as Print from "expo-print";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import { getAuth } from "firebase/auth";
import { get, onValue, ref } from "firebase/database";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGoals } from "../../components/context/GoalContext";
import { db } from "../../config/firebase";
import { useTheme } from "../../context/ThemeContext";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function Dashboard() {
  const { theme, isDarkMode } = useTheme();
  const { goals } = useGoals();
  const router = useRouter();
  const tabBarHeight = useBottomTabBarHeight();

  const [rank, setRank] = useState<number | null>(null);
  const [userName, setUserName] = useState("User");
  const [totalXP, setTotalXP] = useState(0);
  const [selectedDay, setSelectedDay] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  const animatedWidth = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.98)).current;

  const allTasks = useMemo(
    () => goals.flatMap((g: any) => g.tasks || []),
    [goals],
  );
  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter((t: any) => t?.completed).length;

  const percentage = useMemo(
    () =>
      totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100),
    [totalTasks, completedTasks],
  );

  const currentLevel = Math.floor(totalXP / 100) + 1;
  const xpInCurrentLevel = totalXP % 100;
  const xpToNext = 100 - xpInCurrentLevel;

  const streak = useMemo(() => {
    const dates = allTasks
      .filter((t: any) => t.completed && t.completedAt)
      .map((t: any) => new Date(t.completedAt).toDateString());
    return [...new Set(dates)].length;
  }, [allTasks]);

  useEffect(() => {
    const user = getAuth().currentUser;
    if (!user) return;

    const userRef = ref(db, `users/${user.uid}`);
    const unsubscribe = onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setUserName(data.name || "User");
        setTotalXP(data.xp || 0);
      }
    });

    fetchRankAndLeaderboard();
    return () => unsubscribe();
  }, [goals, totalXP]);

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
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(animatedWidth, {
        toValue: percentage,
        duration: 1000,
        easing: Easing.out(Easing.exp),
        useNativeDriver: false,
      }),
    ]).start();
  }, [percentage]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning ☀️";
    if (hour < 18) return "Good Afternoon 🌤";
    return "Good Evening 🌙";
  };

  const heatmapData = useMemo(() => {
    const countByDate: Record<string, number> = {};
    allTasks.forEach((task: any) => {
      if (!task.completedAt) return;
      const date = new Date(task.completedAt).toISOString().split("T")[0];
      countByDate[date] = (countByDate[date] || 0) + 1;
    });

    const days = [];
    const today = new Date();
    for (let i = 41; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const count = countByDate[dateStr] || 0;
      let color = isDarkMode ? "#334155" : "#ebedf0";
      if (count >= 5) color = "#1e3a8a";
      else if (count >= 3) color = "#3b82f6";
      else if (count >= 2) color = "#60a5fa";
      else if (count >= 1) color = "#bfdbfe";
      days.push({ date: dateStr, count, color });
    }
    return days;
  }, [allTasks, isDarkMode]);

  // --- ATTRACTIVE BLUE PDF ENGINE ---
  const generatePDFReport = async () => {
    try {
      const dateString = new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      const goalsHtml = goals
        .map((g: any) => {
          const total = g.tasks?.length || 0;
          const done = g.tasks?.filter((t: any) => t.completed).length || 0;
          const prog = total === 0 ? 0 : Math.round((done / total) * 100);
          return `
          <div style="margin-bottom: 15px; padding: 12px; border: 1px solid #e2e8f0; border-radius: 10px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="font-weight: bold; color: #1e293b;">${g.title}</span>
              <span style="color: #3b82f6; font-weight: bold;">${prog}%</span>
            </div>
            <div style="background: #f1f5f9; height: 8px; border-radius: 4px; overflow: hidden;">
              <div style="background: #3b82f6; width: ${prog}%; height: 100%;"></div>
            </div>
          </div>`;
        })
        .join("");

      const html = `
      <html>
      <head>
        <style>
          body { font-family: 'Helvetica', sans-serif; padding: 0; margin: 0; background: #fff; }
          .container { border: 12px solid #1e3a8a; margin: 20px; padding: 40px; min-height: 90vh; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; margin-bottom: 30px; }
          .title { color: #1e3a8a; font-size: 32px; text-align: center; font-weight: bold; margin-bottom: 40px; }
          .stats-grid { display: flex; justify-content: space-between; margin-bottom: 40px; }
          .stat-card { background: #f0f7ff; padding: 20px; border-radius: 12px; width: 30%; text-align: center; border: 1px solid #bfdbfe; }
          .label { color: #3b82f6; font-size: 12px; text-transform: uppercase; font-weight: bold; }
          .val { font-size: 24px; font-weight: bold; color: #1e3a8a; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <span style="color: #3b82f6; font-weight: bold;">SKILL LEARNING APP</span>
            <span style="color: #64748b;">User: ${userName}</span>
          </div>
          <h1 class="title">Learning Progress Report</h1>
          <div class="stats-grid">
            <div class="stat-card"><div class="label">Level</div><div class="val">${currentLevel}</div></div>
            <div class="stat-card"><div class="label">Total XP</div><div class="val">${totalXP}</div></div>
            <div class="stat-card"><div class="label">Streak</div><div class="val">${streak} Days</div></div>
          </div>
          <h2 style="color: #1e3a8a; border-left: 5px solid #3b82f6; padding-left: 10px;">Your Learning Tracks</h2>
          ${goalsHtml}
          <div style="margin-top: 50px; text-align: center; color: #94a3b8; font-size: 12px;">
            Generated on ${dateString} • Keep Up the Great Work!
          </div>
        </div>
      </body>
      </html>`;

      const result = await Print.printToFileAsync({ html });
      if (result.uri) await Sharing.shareAsync(result.uri);
    } catch (e) {
      alert("Error generating report");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

      <Animated.View
        style={{
          flex: 1,
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 10,
            paddingBottom: tabBarHeight + 20,
          }}
        >
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
              <Text style={styles.profileInitial}>
                {userName.charAt(0).toUpperCase()}
              </Text>
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
                  🏆 {totalXP}
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

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.heatmapScrollContent}
            >
              <View style={styles.heatmapWrapper}>
                <View style={styles.heatmapContainer}>
                  {useMemo(() => {
                    const countByDate: Record<string, number> = {};
                    allTasks.forEach((task: any) => {
                      if (!task.completedAt) return;
                      const date = new Date(task.completedAt)
                        .toISOString()
                        .split("T")[0];
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
                      if (count >= 5) color = "#1e3a8a";
                      else if (count >= 3) color = "#3b82f6";
                      else if (count >= 2) color = "#60a5fa";
                      else if (count >= 1) color = "#bfdbfe";

                      days.push({ date: dateStr, count, color });
                    }

                    return days.map((item, index) => (
                      <Pressable
                        key={index}
                        onPress={() => setSelectedDay(item)}
                        style={({ pressed }) => [
                          { opacity: pressed ? 0.6 : 1 },
                        ]}
                      >
                        <View
                          style={[
                            styles.heatmapBox,
                            {
                              backgroundColor: item.color,
                              borderWidth:
                                item.date ===
                                new Date().toISOString().split("T")[0]
                                  ? 2
                                  : 0,
                              borderColor: theme.tint,
                            },
                          ]}
                        />
                      </Pressable>
                    ));
                  }, [allTasks, isDarkMode])}
                </View>
              </View>
            </ScrollView>

            <View style={styles.legend}>
              <Text style={styles.legendText}>Less</Text>
              <View
                style={[
                  styles.legendBox,
                  { backgroundColor: isDarkMode ? "#334155" : "#ebedf0" },
                ]}
              />
              <View
                style={[styles.legendBox, { backgroundColor: "#bfdbfe" }]}
              />
              <View
                style={[styles.legendBox, { backgroundColor: "#3b82f6" }]}
              />
              <View
                style={[styles.legendBox, { backgroundColor: "#1e3a8a" }]}
              />
              <Text style={styles.legendText}>More</Text>
            </View>

            {selectedDay && (
              <View
                style={[
                  styles.dateDetailCard,
                  {
                    backgroundColor: isDarkMode ? "#1e293b" : "#f5f3ff",
                    borderLeftColor: theme.tint,
                  },
                ]}
              >
                <Text style={[styles.dateDetailText, { color: theme.text }]}>
                  {new Date(selectedDay.date).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </Text>
                <Text style={[styles.dateDetailSubText, { color: theme.tint }]}>
                  {selectedDay.count} tasks completed 🚀
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
  },
  greetingText: { fontSize: 15, fontWeight: "500" },
  userNameText: { fontSize: 28, fontWeight: "800" },
  profileBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
  },
  profileInitial: { color: "#fff", fontSize: 22, fontWeight: "bold" },
  levelIndicator: {
    position: "absolute",
    bottom: -4,
    right: -4,
    backgroundColor: "#fbbf24",
    borderRadius: 12,
    paddingHorizontal: 7,
    borderWidth: 2,
  },
  levelIndicatorText: { fontSize: 11, fontWeight: "bold", color: "#000" },
  quickActionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  actionBtn: { alignItems: "center", width: "30%" },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    elevation: 4,
  },
  actionLabel: { fontSize: 13, fontWeight: "700" },
  card: { padding: 24, borderRadius: 28, marginTop: 20, elevation: 6 },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 22,
  },
  cardTitle: { fontSize: 20, fontWeight: "800" },
  levelChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  levelChipText: { fontSize: 12, fontWeight: "bold" },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 25,
  },
  statItem: { alignItems: "center", flex: 1 },
  statValue: { fontSize: 20, fontWeight: "800" },
  statLabel: { fontSize: 12, marginTop: 4 },
  progressSection: { marginTop: 5 },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  progressText: { fontSize: 14, fontWeight: "700" },
  progressBg: { height: 12, borderRadius: 12, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 12 },
  xpMiniText: { fontSize: 12, marginTop: 10, textAlign: "center" },
  heatmapScrollContent: {
    paddingVertical: 10,
  },
  heatmapWrapper: {
    paddingRight: 20,
  },
  heatmapContainer: {
    flexDirection: "row",
    flexWrap: "wrap",

    width: 380,
  },
  heatmapBox: {
    width: 28,
    height: 28,
    margin: 4,
    borderRadius: 7,
  },
  legend: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    alignSelf: "flex-end",
  },
  legendText: { fontSize: 11, color: "#94a3b8", marginHorizontal: 5 },
  legendBox: { width: 12, height: 12, borderRadius: 3, marginHorizontal: 2 },
  dateDetailCard: {
    marginTop: 20,
    padding: 18,
    borderRadius: 18,
    borderLeftWidth: 5,
  },
  dateDetailText: { fontWeight: "800", fontSize: 15 },
  dateDetailSubText: { fontSize: 14, marginTop: 4 },
  smallLink: { fontSize: 12, color: "#94a3b8", fontWeight: "600" },
  quoteContainer: {
    marginTop: 30,
    alignItems: "center",
    paddingHorizontal: 40,
    paddingBottom: 20,
  },
  quoteText: {
    textAlign: "center",
    fontSize: 13,
    fontStyle: "italic",
    marginTop: 5,
  },
});
