import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { LinearGradient } from "expo-linear-gradient";
import * as Notifications from "expo-notifications";
import * as Print from "expo-print";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import { getAuth } from "firebase/auth";
import { get, ref } from "firebase/database";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { BarChart } from "react-native-chart-kit";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useGoals } from "../../components/context/GoalContext";
import { db } from "../../config/firebase";

const screenWidth = Dimensions.get("window").width;

export default function Dashboard() {
  const { goals } = useGoals();
  const router = useRouter();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets(); // 🔥 IMPORTANT

  const [rank, setRank] = useState<number | null>(null);
  const [userName, setUserName] = useState("User");

  const allTasks = useMemo(
    () => goals.flatMap((g: any) => g.tasks || []),
    [goals],
  );

  const totalGoals = goals.length;
  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter((t: any) => t?.completed).length;

  const percentage =
    totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  const xp = completedTasks * 10;
  const level = Math.floor(xp / 100) + 1;
  const xpToNext = 100 - (xp % 100);

  const animatedValue = useRef(new Animated.Value(0)).current;

  // 🔥 USER NAME
  const fetchUserName = async () => {
    try {
      const user = getAuth().currentUser;
      if (!user) return;

      const snapshot = await get(ref(db, `users/${user.uid}`));

      if (snapshot.exists()) {
        const data = snapshot.val();
        setUserName(data.name || "User");
      }
    } catch (error) {
      console.log(error);
    }
  };

  // 🏆 RANK
  const fetchRank = async () => {
    try {
      const snapshot = await get(ref(db, "users"));
      if (!snapshot.exists()) return;

      const data = snapshot.val();

      const usersArray = Object.keys(data).map((key) => ({
        id: key,
        xp: data[key].xp || 0,
      }));

      usersArray.sort((a, b) => b.xp - a.xp);

      const user = getAuth().currentUser;
      if (!user) return;

      const index = usersArray.findIndex((u) => u.id === user.uid);
      setRank(index + 1);
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    fetchRank();
    fetchUserName();
  }, [goals]);

  // 👋 GREETING
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning ☀️Have a great day!";
    if (hour < 18) return "Good Afternoon 🌤";
    return "Good Evening 🌙";
  };

  // 🔥 STREAK
  const streak = useMemo(() => {
    const dates = allTasks
      .filter((t: any) => t.completed && t.completedAt)
      .map((t: any) => new Date(t.completedAt).toDateString());

    return [...new Set(dates)].length;
  }, [allTasks]);

  // 📊 WEEKLY
  const weeklyStats = useMemo(() => {
    const labels: string[] = [];
    const data: number[] = [];

    for (let i = 6; i >= 0; i--) {
      const day = new Date();
      day.setDate(day.getDate() - i);

      labels.push(day.toLocaleDateString("en-US", { weekday: "short" }));

      const count = allTasks.filter((task: any) => {
        if (!task.completedAt) return false;
        return new Date(task.completedAt).toDateString() === day.toDateString();
      }).length;

      data.push(count);
    }

    return { labels, datasets: [{ data }] };
  }, [allTasks]);

  // 📅 CALENDAR
  const markedDates = useMemo(() => {
    const marked: any = {};

    allTasks.forEach((task: any) => {
      if (task.completedAt) {
        const date = new Date(task.completedAt).toISOString().split("T")[0];
        marked[date] = {
          selected: true,
          selectedColor: "#22c55e",
        };
      }
    });

    return marked;
  }, [allTasks]);

  // 🎯 ANIMATION
  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: percentage,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [percentage]);

  // 🔔 NOTIFICATION
  useEffect(() => {
    const sendReminder = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") return;

      const pending = allTasks.filter((t: any) => !t.completed);

      if (pending.length > 0) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "🔔 Pending Tasks",
            body: `${pending.length} tasks remaining`,
          },
          trigger: { seconds: 5 },
        });
      }
    };

    sendReminder();
  }, [allTasks]);

  // 📄 PDF
  const generatePDFReport = async () => {
    if (Platform.OS === "web") {
      Alert.alert("PDF works only on mobile");
      return;
    }

    const html = `
      <h1>Report</h1>
      <p>Goals: ${totalGoals}</p>
      <p>Tasks: ${totalTasks}</p>
      <p>Completed: ${completedTasks}</p>
      <p>XP: ${xp}</p>
    `;

    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri);
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <LinearGradient colors={["#0f172a", "#1e3a8a"]} style={{ flex: 1 }}>
        <StatusBar barStyle="light-content" />

        {/* 🔥 FINAL FIX */}
        <ScrollView
          contentContainerStyle={{
            padding: 20,
            paddingBottom: tabBarHeight + insets.bottom + 140,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* HEADER */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Hello {userName},</Text>
              <Text style={styles.subGreeting}>{getGreeting()}</Text>
            </View>

            <View style={{ flexDirection: "row" }}>
              <Pressable
                style={styles.iconBtn}
                onPress={() => router.push("/leaderboard")}
              >
                <Text style={styles.icon}>🏆</Text>
              </Pressable>

              <Pressable
                style={styles.profile}
                onPress={() => router.push("/profile")}
              >
                <Text style={{ color: "#fff", fontWeight: "bold" }}>
                  {userName.charAt(0).toUpperCase()}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* STATS */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Your Progress</Text>

            <View style={styles.row}>
              <Text>Goals</Text>
              <Text>{totalGoals}</Text>
            </View>
            <View style={styles.row}>
              <Text>Tasks</Text>
              <Text>{totalTasks}</Text>
            </View>
            <View style={styles.row}>
              <Text>Completed</Text>
              <Text>{completedTasks}</Text>
            </View>
            <View style={styles.row}>
              <Text>🔥 Streak</Text>
              <Text>{streak}</Text>
            </View>
            <View style={styles.row}>
              <Text>🏆 XP</Text>
              <Text>{xp}</Text>
            </View>
            <View style={styles.row}>
              <Text>🏅 Rank</Text>
              <Text>{rank ? `#${rank}` : "-"}</Text>
            </View>

            <View style={styles.progressBg}>
              <Animated.View
                style={[styles.progressFill, { width: `${percentage}%` }]}
              />
            </View>

            <Text style={styles.smallText}>{xpToNext} XP to next level</Text>
          </View>

          {/* CHART */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Weekly Productivity</Text>
            <BarChart
              data={weeklyStats}
              width={screenWidth - 60}
              height={220}
              chartConfig={{
                backgroundGradientFrom: "#fff",
                backgroundGradientTo: "#fff",
                decimalPlaces: 0,
                color: () => "#4f46e5",
                labelColor: () => "#333",
              }}
            />
          </View>

          {/* CALENDAR */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Activity Calendar</Text>
            <Calendar markedDates={markedDates} />
          </View>

          {/* BUTTON */}
          <Pressable style={styles.reportBtn} onPress={generatePDFReport}>
            <Text style={styles.reportText}>Generate Report</Text>
          </Pressable>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

// 🎨 STYLES
const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  greeting: { color: "#cbd5f5", fontSize: 14 },

  subGreeting: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },

  iconBtn: { marginRight: 10 },

  icon: { fontSize: 20 },

  profile: {
    width: 35,
    height: 35,
    borderRadius: 20,
    backgroundColor: "#f59e0b",
    justifyContent: "center",
    alignItems: "center",
  },

  card: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 18,
    marginTop: 20,
    elevation: 5,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 4,
  },

  progressBg: {
    height: 10,
    backgroundColor: "#e5e7eb",
    borderRadius: 10,
    marginTop: 10,
  },

  progressFill: {
    height: "100%",
    backgroundColor: "#4f46e5",
    borderRadius: 10,
  },

  smallText: {
    marginTop: 5,
    fontSize: 12,
    color: "gray",
  },

  reportBtn: {
    backgroundColor: "#f59e0b",
    padding: 15,
    borderRadius: 15,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 30, // 🔥 FIX
  },

  reportText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
