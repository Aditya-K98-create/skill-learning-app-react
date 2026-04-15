import { Ionicons } from "@expo/vector-icons";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { LinearGradient } from "expo-linear-gradient";
import * as Print from "expo-print";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import { getAuth } from "firebase/auth";
import { get, onValue, ref } from "firebase/database";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Image,
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

type HeatmapRange = "30d" | "1y" | "3y";

const RANGE_DAYS: Record<HeatmapRange, number> = {
  "30d": 30,
  "1y": 365,
  "3y": 1095,
};

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const CELL = 26;
const CELL_MARGIN = 3;
const CELL_STEP = CELL + CELL_MARGIN * 2;
export default function Dashboard() {
  const { theme, isDarkMode } = useTheme();
  const { goals } = useGoals();
  const router = useRouter();
  const tabBarHeight = useBottomTabBarHeight();

  const [rank, setRank] = useState<number | null>(null);
  const [userName, setUserName] = useState("User");
  const [totalXP, setTotalXP] = useState(0);
  const [selectedDay, setSelectedDay] = useState<any>(null);
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [heatmapRange, setHeatmapRange] = useState<HeatmapRange>("30d");

  const heatmapScrollRef = useRef<ScrollView>(null);

  const animatedWidth = useRef(new Animated.Value(0)).current;
  const xpBarWidth = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.98)).current;

  const pulseAnim = useRef(new Animated.Value(1)).current;

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
  const xpLevelPct = xpInCurrentLevel;

  const streak = useMemo(() => {
    const dates = allTasks
      .filter((t: any) => t.completed && t.completedAt)
      .map((t: any) => new Date(t.completedAt).toDateString());
    return [...new Set(dates)].length;
  }, [allTasks]);

  const activeCourses = useMemo(() => {
    return goals
      .map((g: any) => {
        const total = g.tasks?.length || 0;
        const done = g.tasks?.filter((t: any) => t.completed).length || 0;
        const progress = total === 0 ? 0 : Math.round((done / total) * 100);
        const lastTask = g.tasks
          ?.filter((t: any) => !t.completed)
          .find(Boolean);
        return {
          id: g.id,
          title: g.title,
          currentLesson: lastTask?.title || "All done!",
          progress,
          total,
          done,
          emoji: g.emoji || "📘",
        };
      })
      .filter((c: any) => c.progress > 0 && c.progress < 100)
      .slice(0, 3);
  }, [goals]);

  useEffect(() => {
    const user = getAuth().currentUser;
    if (!user) return;
    const userRef = ref(db, `users/${user.uid}`);
    const unsubscribe = onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setUserName(data.name || "User");
        setTotalXP(data.xp || 0);
        setPhotoURL(data.photoURL || null);
      }
    });
    fetchRankAndLeaderboard();
    return () => unsubscribe();
  }, [goals, totalXP]);

  const fetchRankAndLeaderboard = async () => {
    try {
      const snapshot = await get(ref(db, "users"));
      if (!snapshot.exists()) return;
      const data = snapshot.val();
      const usersArray = Object.keys(data).map((key) => ({
        id: key,
        name: data[key].name || "Learner",
        xp: data[key].xp || 0,
      }));
      usersArray.sort((a, b) => b.xp - a.xp);
      const user = getAuth().currentUser;
      if (user) {
        const index = usersArray.findIndex((u) => u.id === user.uid);
        setRank(index + 1);
      }
    } catch (error) {
      console.error("Dashboard: leaderboard error:", error);
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
      Animated.timing(xpBarWidth, {
        toValue: xpLevelPct,
        duration: 1200,
        easing: Easing.out(Easing.exp),
        useNativeDriver: false,
      }),
    ]).start();
  }, [percentage, xpLevelPct]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.5,
          duration: 900,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const { heatmapData, monthLabels } = useMemo(() => {
    const tasksByDate: Record<string, any[]> = {};
    allTasks.forEach((task: any) => {
      if (!task.completedAt || !task.completed) return;
      const date = new Date(task.completedAt).toISOString().split("T")[0];
      if (!tasksByDate[date]) tasksByDate[date] = [];
      tasksByDate[date].push(task);
    });

    const days: any[] = [];
    const months: { label: string; colIndex: number }[] = [];
    const today = new Date();
    const totalDays = RANGE_DAYS[heatmapRange];
    let colIndex = 0;

    for (let i = totalDays; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];

      if (d.getDate() === 1) {
        months.push({
          label: d.toLocaleDateString("en-US", { month: "short" }),
          colIndex,
        });
      }

      const dayTasks = tasksByDate[dateStr] || [];
      const count = dayTasks.length;
      let color = isDarkMode ? "#334155" : "#ebedf0";
      if (count >= 5) color = "#1e3a8a";
      else if (count >= 3) color = "#3b82f6";
      else if (count >= 2) color = "#60a5fa";
      else if (count >= 1) color = "#bfdbfe";

      days.push({ date: dateStr, count, color, tasks: dayTasks });
      colIndex++;
    }

    return { heatmapData: days, monthLabels: months };
  }, [allTasks, isDarkMode, heatmapRange]);

  useEffect(() => {
    if (heatmapData.length === 0) return;
    const timer = setTimeout(() => {
      heatmapScrollRef.current?.scrollToEnd({ animated: true });
    }, 400);
    return () => clearTimeout(timer);
  }, [heatmapData]);

  const todayStr = new Date().toISOString().split("T")[0];

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
          <div style="margin-bottom:15px;padding:12px;border:1px solid #e2e8f0;border-radius:10px;">
            <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
              <span style="font-weight:bold;color:#1e293b;">${g.title}</span>
              <span style="color:#3b82f6;font-weight:bold;">${prog}%</span>
            </div>
            <div style="background:#f1f5f9;height:8px;border-radius:4px;overflow:hidden;">
              <div style="background:#3b82f6;width:${prog}%;height:100%;"></div>
            </div>
          </div>`;
        })
        .join("");
      const html = `
      <html><head><style>
        body{font-family:'Helvetica',sans-serif;padding:0;margin:0;background:#fff;}
        .container{border:12px solid #1e3a8a;margin:20px;padding:40px;min-height:90vh;}
        .header{display:flex;justify-content:space-between;border-bottom:2px solid #3b82f6;padding-bottom:10px;margin-bottom:30px;}
        .title{color:#1e3a8a;font-size:32px;text-align:center;font-weight:bold;margin-bottom:40px;}
        .stats-grid{display:flex;justify-content:space-between;margin-bottom:40px;}
        .stat-card{background:#f0f7ff;padding:20px;border-radius:12px;width:30%;text-align:center;border:1px solid #bfdbfe;}
        .label{color:#3b82f6;font-size:12px;text-transform:uppercase;font-weight:bold;}
        .val{font-size:24px;font-weight:bold;color:#1e3a8a;}
      </style></head>
      <body><div class="container">
        <div class="header">
          <span style="color:#3b82f6;font-weight:bold;">SKILL LEARNING APP</span>
          <span style="color:#64748b;">User: ${userName}</span>
        </div>
        <h1 class="title">Learning Progress Report</h1>
        <div class="stats-grid">
          <div class="stat-card"><div class="label">Level</div><div class="val">${currentLevel}</div></div>
          <div class="stat-card"><div class="label">Total XP</div><div class="val">${totalXP}</div></div>
          <div class="stat-card"><div class="label">Streak</div><div class="val">${streak} Days</div></div>
        </div>
        <h2 style="color:#1e3a8a;border-left:5px solid #3b82f6;padding-left:10px;">Your Learning Tracks</h2>
        ${goalsHtml}
        <div style="margin-top:50px;text-align:center;color:#94a3b8;font-size:12px;">
          Generated on ${dateString} • Keep Up the Great Work!
        </div>
      </div></body></html>`;
      const result = await Print.printToFileAsync({ html });
      if (result.uri) await Sharing.shareAsync(result.uri);
    } catch (e) {
      console.error("PDF Error:", e);
      alert("Error generating report");
    }
  };

  const renderHeader = () => (
    <LinearGradient
      colors={["#6C63FF", "#4ECDC4"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.headerGradient}
    >
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.greetingText}>
            {getGreeting()}, {userName}
          </Text>
          <View style={styles.levelPill}>
            <Text style={styles.levelPillText}>
              Level {currentLevel} · {xpToNext} XP to next
            </Text>
          </View>
        </View>
        <Pressable
          onPress={() => router.push("/profile")}
          style={styles.profileArea}
        >
          <View style={styles.bellWrapper}>
            <Ionicons name="notifications-outline" size={22} color="#fff" />
            <View style={styles.notifDot} />
          </View>
          <View style={styles.avatarCircle}>
            {photoURL ? (
              <Image
                source={{ uri: photoURL }}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            ) : (
              <Text style={styles.avatarInitial}>
                {userName.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
        </Pressable>
      </View>
      <View style={styles.xpBarTrack}>
        <Animated.View
          style={[
            styles.xpBarFill,
            {
              width: xpBarWidth.interpolate({
                inputRange: [0, 100],
                outputRange: ["0%", "100%"],
              }),
            },
          ]}
        />
      </View>
      <View style={styles.xpBarLabels}>
        <Text style={styles.xpBarLabelText}>Mastery {xpLevelPct}%</Text>
        <Text style={styles.xpBarLabelText}>Level {currentLevel + 1}</Text>
      </View>
    </LinearGradient>
  );

  const renderHeatmap = () => {
    const gridWidth = Math.ceil(RANGE_DAYS[heatmapRange] / 7) * CELL_STEP;

    return (
      <View style={[styles.card, { backgroundColor: theme.card }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>
            Activity insights
          </Text>
          <View style={styles.rangeToggle}>
            {(["30d", "1y", "3y"] as HeatmapRange[]).map((r) => (
              <Pressable
                key={r}
                onPress={() => {
                  setHeatmapRange(r);
                  setSelectedDay(null);
                }}
                style={[
                  styles.rangeBtn,
                  heatmapRange === r && { backgroundColor: theme.tint },
                ]}
              >
                <Text
                  style={[
                    styles.rangeBtnText,
                    { color: heatmapRange === r ? "#fff" : theme.subText },
                  ]}
                >
                  {r}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.heatmapOuter}>
          <ScrollView
            ref={heatmapScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: CELL_STEP * 0.5 }}
          >
            <View>
              <View style={[styles.monthLabelRow, { width: gridWidth }]}>
                {monthLabels.map((m, i) => (
                  <Text
                    key={i}
                    style={[
                      styles.monthLabel,
                      { left: m.colIndex * CELL_STEP, color: theme.subText },
                    ]}
                  >
                    {m.label}
                  </Text>
                ))}
              </View>

              <View style={[styles.heatmapContainer, { width: gridWidth }]}>
                {heatmapData.map((item, index) => {
                  const isToday = item.date === todayStr;
                  const isSelected = selectedDay?.date === item.date;
                  return (
                    <Pressable
                      key={index}
                      onPress={() => setSelectedDay(isSelected ? null : item)}
                      style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
                    >
                      {isToday && (
                        <Animated.View
                          pointerEvents="none"
                          style={[
                            styles.todayPulseRing,
                            {
                              borderColor: "#FFD93D",
                              transform: [{ scale: pulseAnim }],
                            },
                          ]}
                        />
                      )}
                      <View
                        style={[
                          styles.heatmapBox,
                          { backgroundColor: item.color },
                          isToday && styles.todayCell,
                          isSelected && {
                            borderWidth: 1.5,
                            borderColor: theme.tint,
                          },
                        ]}
                      />
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          <LinearGradient
            colors={["transparent", theme.card]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.fadeMask}
            pointerEvents="none"
          />

          <View style={styles.scrollHintRow} pointerEvents="none">
            <Text style={[styles.scrollHintText, { color: theme.subText }]}>
              scroll for more
            </Text>
            <Ionicons name="chevron-forward" size={10} color={theme.subText} />
          </View>
        </View>

        <View style={styles.legend}>
          <Text style={styles.legendText}>Less</Text>
          {[
            isDarkMode ? "#334155" : "#ebedf0",
            "#bfdbfe",
            "#3b82f6",
            "#1e3a8a",
          ].map((c, i) => (
            <View key={i} style={[styles.legendBox, { backgroundColor: c }]} />
          ))}
          <Text style={styles.legendText}>More</Text>
        </View>

        {selectedDay ? (
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
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </Text>
            <Text
              style={[
                styles.dateDetailSubText,
                {
                  color: selectedDay.count === 0 ? theme.subText : theme.tint,
                  marginBottom: 8,
                },
              ]}
            >
              {selectedDay.count === 0
                ? "No tasks completed"
                : `${selectedDay.count} ${selectedDay.count === 1 ? "task" : "tasks"} completed 🚀`}
            </Text>

            {selectedDay.count === 0 ? (
              <View style={styles.emptyDayState}>
                <Text style={styles.emptyDayEmoji}>🌱</Text>
                <Text style={[styles.emptyDayText, { color: theme.subText }]}>
                  No activity here yet. Every streak starts with a single task!
                </Text>
              </View>
            ) : (
              <View style={styles.completedTasksList}>
                {selectedDay.tasks.map((task: any, idx: number) => (
                  <View key={idx} style={styles.taskDetailRow}>
                    <Ionicons
                      name="checkmark-circle"
                      size={14}
                      color="#22c55e"
                    />
                    <Text
                      style={[styles.taskDetailTitle, { color: theme.text }]}
                    >
                      {task.title}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ) : (
          <Text style={[styles.heatmapHint, { color: theme.subText }]}>
            Tap any cell to see details
          </Text>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.background }}
      edges={["top"]}
    >
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
          contentContainerStyle={{ paddingBottom: tabBarHeight + 20 }}
        >
          {renderHeader()}

          <View style={{ paddingHorizontal: 20 }}>
            <View style={styles.quickActionsContainer}>
              {[
                {
                  label: "Add Goal",
                  icon: "add",
                  path: "/goals",
                  bg: isDarkMode ? "#1e293b" : "#e0e7ff",
                  color: theme.tint,
                },
                {
                  label: "Continue",
                  icon: "play",
                  path: "/learning",
                  bg: isDarkMode ? "#2d2305" : "#fef3c7",
                  color: "#d97706",
                },
                {
                  label: "Report",
                  icon: "bar-chart",
                  onPress: generatePDFReport,
                  bg: isDarkMode ? "#062d16" : "#dcfce7",
                  color: "#16a34a",
                },
              ].map((action, i) => (
                <Pressable
                  key={i}
                  style={styles.actionBtn}
                  onPress={
                    action.onPress
                      ? action.onPress
                      : () => router.push(action.path as any)
                  }
                >
                  <View
                    style={[styles.iconCircle, { backgroundColor: action.bg }]}
                  >
                    <Ionicons
                      name={action.icon as any}
                      size={24}
                      color={action.color}
                    />
                  </View>
                  <Text style={[styles.actionLabel, { color: theme.subText }]}>
                    {action.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.statsRow}>
              {[
                {
                  label: "Streak",
                  val: streak,
                  emoji: "🔥",
                  bg: isDarkMode ? "#2d2305" : "#fffbeb",
                  border: isDarkMode ? "#78350f" : "#fde68a",
                },
                {
                  label: "Total XP",
                  val: totalXP.toLocaleString(),
                  emoji: "🏆",
                  bg: isDarkMode ? "#1e293b" : "#f8f7ff",
                  border: isDarkMode ? "#334155" : "#e0e7ff",
                },
                {
                  label: "Rank",
                  val: `#${rank ?? "--"}`,
                  emoji: "🥈",
                  bg: isDarkMode ? "#1e1b4b" : "#eef2ff",
                  border: isDarkMode ? "#3730a3" : "#c7d2fe",
                },
              ].map((stat, i) => (
                <View
                  key={i}
                  style={[
                    styles.statCard,
                    { backgroundColor: stat.bg, borderColor: stat.border },
                  ]}
                >
                  <Text style={styles.statEmoji}>{stat.emoji}</Text>
                  <Text style={[styles.statValue, { color: theme.text }]}>
                    {stat.val}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.subText }]}>
                    {stat.label}
                  </Text>
                </View>
              ))}
            </View>

            {activeCourses.length > 0 && (
              <View style={[styles.card, { backgroundColor: theme.card }]}>
                <View style={styles.cardHeader}>
                  <Text style={[styles.cardTitle, { color: theme.text }]}>
                    Continue learning
                  </Text>
                  <Pressable onPress={() => router.push("/learning")}>
                    <Text style={[styles.seeAllLink, { color: theme.tint }]}>
                      See all →
                    </Text>
                  </Pressable>
                </View>
                {activeCourses.map((course: any, idx: number) => (
                  <Pressable
                    key={course.id}
                    onPress={() =>
                      router.push({
                        pathname: "/learning",
                        params: { id: course.id },
                      })
                    }
                    style={[
                      styles.courseRow,
                      idx < activeCourses.length - 1 && {
                        borderBottomWidth: 0.5,
                        borderBottomColor: isDarkMode ? "#1e293b" : "#f0effe",
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.courseEmoji,
                        { backgroundColor: isDarkMode ? "#1e1b4b" : "#ede9fe" },
                      ]}
                    >
                      <Text style={{ fontSize: 18 }}>{course.emoji}</Text>
                    </View>
                    <View style={styles.courseInfo}>
                      <Text
                        style={[styles.courseName, { color: theme.text }]}
                        numberOfLines={1}
                      >
                        {course.title}
                      </Text>
                      <Text
                        style={[styles.courseSub, { color: theme.subText }]}
                        numberOfLines={1}
                      >
                        {course.currentLesson}
                      </Text>
                      <View
                        style={[
                          styles.miniBarTrack,
                          {
                            backgroundColor: isDarkMode ? "#1e293b" : "#eeedfe",
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.miniBarFill,
                            {
                              width: `${course.progress}%`,
                              backgroundColor: theme.tint,
                            },
                          ]}
                        />
                      </View>
                    </View>
                    <Text style={[styles.coursePct, { color: theme.tint }]}>
                      {course.progress}%
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            <View style={[styles.card, { backgroundColor: theme.card }]}>
              <View style={styles.cardHeader}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>
                  Overall progress
                </Text>
              </View>
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
                {completedTasks} of {totalTasks} tasks complete
              </Text>
            </View>

            {renderHeatmap()}
          </View>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerGradient: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  greetingText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.3,
  },
  levelPill: {
    marginTop: 6,
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  levelPillText: { fontSize: 11, fontWeight: "600", color: "#fff" },
  profileArea: { flexDirection: "row", alignItems: "center", gap: 10 },
  bellWrapper: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
  },
  notifDot: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFD93D",
    borderWidth: 1.5,
    borderColor: "#6C63FF",
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarImage: { width: "100%", height: "100%" },
  avatarInitial: { color: "#fff", fontSize: 18, fontWeight: "700" },
  xpBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.25)",
    overflow: "hidden",
  },
  xpBarFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  xpBarLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
  },
  xpBarLabelText: {
    fontSize: 10,
    color: "rgba(255,255,255,0.65)",
    fontWeight: "500",
  },
  quickActionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  actionBtn: { alignItems: "center", width: "30%" },
  iconCircle: {
    width: 58,
    height: 58,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    elevation: 2,
  },
  actionLabel: { fontSize: 12, fontWeight: "600" },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 0.5,
  },
  statEmoji: { fontSize: 18, marginBottom: 2 },
  statValue: { fontSize: 17, fontWeight: "800", marginTop: 2 },
  statLabel: { fontSize: 11, marginTop: 3 },
  card: {
    padding: 20,
    borderRadius: 24,
    marginBottom: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: { fontSize: 17, fontWeight: "800" },
  seeAllLink: { fontSize: 12, fontWeight: "600" },
  courseRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
  },
  courseEmoji: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  courseInfo: { flex: 1, minWidth: 0 },
  courseName: { fontSize: 13, fontWeight: "700", marginBottom: 1 },
  courseSub: { fontSize: 11, marginBottom: 5 },
  miniBarTrack: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
    maxWidth: 140,
  },
  miniBarFill: { height: "100%", borderRadius: 2 },
  coursePct: { fontSize: 12, fontWeight: "700", flexShrink: 0 },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  progressText: { fontSize: 13, fontWeight: "600" },
  progressBg: { height: 10, borderRadius: 10, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 10 },
  xpMiniText: { fontSize: 12, marginTop: 8, textAlign: "center" },

  rangeToggle: { flexDirection: "row", gap: 4 },
  rangeBtn: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  rangeBtnText: { fontSize: 11, fontWeight: "600" },

  heatmapOuter: {
    position: "relative",
    overflow: "hidden",

    maxWidth: SCREEN_WIDTH - 40 - 16,
  },

  monthLabelRow: {
    position: "relative",
    height: 16,
    marginBottom: 4,
  },
  monthLabel: {
    position: "absolute",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.3,
    top: 0,
  },

  heatmapContainer: { flexDirection: "row", flexWrap: "wrap" },

  heatmapBox: {
    width: CELL,
    height: CELL,
    margin: CELL_MARGIN,
    borderRadius: 6,
  },

  todayCell: { borderWidth: 2.5, borderColor: "#FFD93D" },

  todayPulseRing: {
    position: "absolute",
    top: CELL_MARGIN - 4,
    left: CELL_MARGIN - 4,
    width: CELL + 8,
    height: CELL + 8,
    borderRadius: 10,
    borderWidth: 2,
    opacity: 0.45,
    zIndex: -1,
  },

  fadeMask: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 52,
  },

  scrollHintRow: {
    position: "absolute",
    bottom: 2,
    right: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  scrollHintText: { fontSize: 9, fontWeight: "500", fontStyle: "italic" },

  legend: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    alignSelf: "flex-end",
  },
  legendText: { fontSize: 11, color: "#94a3b8", marginHorizontal: 4 },
  legendBox: { width: 11, height: 11, borderRadius: 3, marginHorizontal: 2 },

  dateDetailCard: {
    marginTop: 14,
    padding: 16,
    borderRadius: 16,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
  },
  dateDetailText: { fontWeight: "900", fontSize: 14, marginBottom: 2 },
  dateDetailSubText: { fontSize: 13, fontWeight: "700" },

  emptyDayState: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  emptyDayEmoji: { fontSize: 22 },
  emptyDayText: { flex: 1, fontSize: 12, lineHeight: 17, fontStyle: "italic" },

  completedTasksList: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  taskDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  taskDetailTitle: { fontSize: 12, fontWeight: "600", flex: 1 },
  heatmapHint: {
    fontSize: 11,
    textAlign: "center",
    marginTop: 10,
    fontStyle: "italic",
  },
});
