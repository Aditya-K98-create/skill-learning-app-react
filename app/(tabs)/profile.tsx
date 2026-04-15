import { Ionicons } from "@expo/vector-icons";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import { get, ref, update } from "firebase/database";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { auth, db } from "../../config/firebase";
import { useTheme } from "../../context/ThemeContext";

import {
  cancelAllNotifications,
  registerForPushNotificationsAsync,
} from "../../utils/notifications";

interface Achievement {
  id: string;
  icon: string;
  label: string;
  earned: boolean;
}

export default function Profile() {
  const { isDarkMode, theme, toggleTheme } = useTheme();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isPushEnabled, setIsPushEnabled] = useState(true);
  const [rank, setRank] = useState<number | null>(null);

  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [newNameInput, setNewNameInput] = useState("");

  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);

  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  const fetchData = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const snapshot = await get(ref(db, `users/${user.uid}`));
    if (snapshot.exists()) {
      const data = snapshot.val();
      setUserData(data);
      setNewNameInput(data.name || "");
      setIsPushEnabled(data.pushNotifications ?? true);
    }

    const allUsersSnap = await get(ref(db, "users"));
    if (allUsersSnap.exists()) {
      const allUsers = Object.entries(allUsersSnap.val() as Record<string, any>)
        .map(([id, u]) => ({ id, xp: u.xp || 0 }))
        .sort((a, b) => b.xp - a.xp);
      const idx = allUsers.findIndex((u) => u.id === user.uid);
      setRank(idx + 1);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();

    const getPushToken = async () => {
      if (Platform.OS === "web") return;

      const { status } = await Notifications.getPermissionsAsync();
      if (status === "granted") {
        try {
          const token = (await Notifications.getExpoPushTokenAsync()).data;
          console.log("Push Token:", token);
        } catch (e) {
          console.log("Notification Token Error:", e);
        }
      }
    };

    getPushToken();
  }, []);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Denied",
        "We need gallery access to change your photo.",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled) uploadImage(result.assets[0].uri);
  };

  const uploadImage = async (uri: string) => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      setUploading(true);
      await update(ref(db, `users/${user.uid}`), { photoURL: uri });
      setUserData((prev: any) => ({ ...prev, photoURL: uri }));
      Alert.alert("Success", "Profile photo updated!");
    } catch {
      Alert.alert("Error", "Failed to upload image.");
    } finally {
      setUploading(false);
    }
  };

  const handleUpdatePreference = async (key: string, value: any) => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      await update(ref(db, `users/${user.uid}`), { [key]: value });

      if (key === "pushNotifications") {
        if (value === true) {
          await registerForPushNotificationsAsync();
          Alert.alert(
            "Notifications Enabled",
            "You will now receive daily learning reminders! 🔔",
          );
        } else {
          await cancelAllNotifications();
          Alert.alert(
            "Notifications Disabled",
            "Daily reminders have been cancelled.",
          );
        }
      }
    } catch (err) {
      console.error("Update Error:", err);
    }
  };
  const saveName = async () => {
    if (!newNameInput.trim()) {
      Alert.alert("Error", "Name cannot be empty");
      return;
    }
    const user = auth.currentUser;
    if (!user) return;
    try {
      await update(ref(db, `users/${user.uid}`), {
        name: newNameInput.trim(),
      });
      setUserData((prev: any) => ({ ...prev, name: newNameInput.trim() }));
      setIsEditModalVisible(false);
      Alert.alert("Success", "Name updated!");
    } catch {
      Alert.alert("Error", "Failed to update name.");
    }
  };

  const handleLogout = async () => {
    Alert.alert("Confirm Logout", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await signOut(auth);
          router.replace("/login");
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.loader, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.tint} />
      </View>
    );
  }

  const name = userData?.name || "User";
  const xp: number = userData?.xp || 0;
  const streak: number = userData?.streak || 0;
  const level = Math.floor(xp / 100) + 1;
  const xpInLevel = xp % 100;
  const xpToNext = 100 - xpInLevel;
  const levelProgress = xpInLevel; // 0–100

  const achievements: Achievement[] = [
    {
      id: "streak7",
      icon: "flame",
      label: "7 Day Streak",
      earned: streak >= 7,
    },
    {
      id: "top10",
      icon: "trophy",
      label: "Top 10",
      earned: (rank ?? 999) <= 10,
    },
    {
      id: "fastlearner",
      icon: "school",
      label: "Fast Learner",
      earned: level >= 5,
    },
    {
      id: "xp500",
      icon: "star",
      label: "500 XP Club",
      earned: xp >= 500,
    },
    {
      id: "xp2k",
      icon: "diamond",
      label: "2K XP Elite",
      earned: xp >= 2000,
    },
  ];

  const achievementIconColor = (a: Achievement) => {
    if (!a.earned) return isDarkMode ? "#475569" : "#cbd5e1";
    const map: Record<string, string> = {
      streak7: "#f97316",
      top10: "#fbbf24",
      fastlearner: theme.tint,
      xp500: "#a855f7",
      xp2k: "#06b6d4",
    };
    return map[a.id] ?? theme.tint;
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.background }}
      edges={["bottom", "left", "right"]}
    >
      <StatusBar barStyle="light-content" />

      <Modal
        visible={isEditModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View style={styles.sheetBg}>
          <View style={[styles.sheetContent, { backgroundColor: theme.card }]}>
            <View style={styles.sheetHandle} />
            <Text style={[styles.sheetTitle, { color: theme.text }]}>
              Edit name
            </Text>
            <TextInput
              style={[
                styles.sheetInput,
                {
                  color: theme.text,
                  backgroundColor: isDarkMode ? theme.background : "#f1f5f9",
                },
              ]}
              value={newNameInput}
              onChangeText={setNewNameInput}
              placeholder="Enter your name"
              placeholderTextColor="#94a3b8"
              autoFocus={Platform.OS !== "web"}
              returnKeyType="done"
              onSubmitEditing={saveName}
            />
            <View style={styles.sheetBtns}>
              <Pressable
                style={[
                  styles.sheetCancelBtn,
                  {
                    backgroundColor: isDarkMode ? "#334155" : "#f1f5f9",
                  },
                ]}
                onPress={() => setIsEditModalVisible(false)}
              >
                <Text
                  style={[styles.sheetCancelText, { color: theme.subText }]}
                >
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                style={[styles.sheetSaveBtn, { backgroundColor: theme.tint }]}
                onPress={saveName}
              >
                <Text style={styles.sheetSaveText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isPasswordModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsPasswordModalVisible(false)}
      >
        <View style={styles.sheetBg}>
          <View style={[styles.sheetContent, { backgroundColor: theme.card }]}>
            <View style={styles.sheetHandle} />
            <Text style={[styles.sheetTitle, { color: theme.text }]}>
              Change password
            </Text>
            <Text style={[styles.sheetSub, { color: theme.subText }]}>
              A password reset link will be sent to{"\n"}
              {auth.currentUser?.email}
            </Text>
            <View style={styles.sheetBtns}>
              <Pressable
                style={[
                  styles.sheetCancelBtn,
                  {
                    backgroundColor: isDarkMode ? "#334155" : "#f1f5f9",
                  },
                ]}
                onPress={() => setIsPasswordModalVisible(false)}
              >
                <Text
                  style={[styles.sheetCancelText, { color: theme.subText }]}
                >
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                style={[styles.sheetSaveBtn, { backgroundColor: theme.tint }]}
                onPress={() => {
                  setIsPasswordModalVisible(false);
                  Alert.alert(
                    "Reset email sent",
                    "Check your inbox to reset your password.",
                  );
                }}
              >
                <Text style={styles.sheetSaveText}>Send reset email</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: tabBarHeight + insets.bottom + 24,
        }}
      >
        <LinearGradient
          colors={["#6C63FF", "#4ECDC4"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroGradient}
        >
          <Pressable onPress={pickImage} style={styles.avatarWrapper}>
            <View
              style={[styles.avatar, { borderColor: "rgba(255,255,255,0.6)" }]}
            >
              {userData?.photoURL ? (
                <Image
                  source={{ uri: userData.photoURL }}
                  style={styles.avatarImage}
                />
              ) : (
                <Text style={styles.avatarText}>
                  {name ? name[0].toUpperCase() : "U"}
                </Text>
              )}
              {uploading && (
                <View style={styles.uploadOverlay}>
                  <ActivityIndicator color="#fff" />
                </View>
              )}

              <View style={styles.avatarEditBar}>
                <Ionicons
                  name="camera"
                  size={11}
                  color="rgba(255,255,255,0.9)"
                />
                <Text style={styles.avatarEditText}>Edit</Text>
              </View>
            </View>

            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>Lv {level}</Text>
            </View>
          </Pressable>

          <Text style={styles.heroName}>{name}</Text>
          <Text style={styles.heroEmail}>{auth.currentUser?.email}</Text>

          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatNum}>{xp.toLocaleString()}</Text>
              <Text style={styles.heroStatLbl}>Total XP</Text>
            </View>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatNum}>🔥 {streak}</Text>
              <Text style={styles.heroStatLbl}>Streak</Text>
            </View>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatNum}>#{rank ?? "--"}</Text>
              <Text style={styles.heroStatLbl}>Rank</Text>
            </View>
          </View>
        </LinearGradient>

        <View
          style={[
            styles.xpBarStrip,
            { backgroundColor: isDarkMode ? "#1e1b4b" : "#6C63FF" },
          ]}
        >
          <View>
            <Text style={styles.xpBarLabel}>
              Level {level} · {xpToNext} XP to Level {level + 1}
            </Text>
            <View style={styles.xpBarTrack}>
              <View
                style={[styles.xpBarFill, { width: `${levelProgress}%` }]}
              />
            </View>
          </View>
          <Text style={styles.xpBarPct}>{levelProgress}%</Text>
        </View>

        <View style={{ paddingHorizontal: 20 }}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Achievements
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 10, paddingBottom: 4 }}
          >
            {achievements.map((a) => (
              <View
                key={a.id}
                style={[
                  styles.achievementBadge,
                  {
                    backgroundColor: a.earned
                      ? isDarkMode
                        ? "#1e1b4b"
                        : "#ede9fe"
                      : isDarkMode
                        ? "#1e293b"
                        : "#f8fafc",
                    borderColor: a.earned
                      ? theme.tint + "50"
                      : isDarkMode
                        ? "#334155"
                        : "#e2e8f0",
                    opacity: a.earned ? 1 : 0.45,
                  },
                ]}
              >
                <Ionicons
                  name={a.icon as any}
                  size={22}
                  color={achievementIconColor(a)}
                />
                <Text
                  style={[
                    styles.badgeText,
                    {
                      color: a.earned
                        ? isDarkMode
                          ? "#a78bfa"
                          : "#5b21b6"
                        : theme.subText,
                    },
                  ]}
                >
                  {a.label}
                </Text>
                {a.earned && <View style={styles.earnedDot} />}
              </View>
            ))}
          </ScrollView>

          <View style={[styles.card, { backgroundColor: theme.card }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>
              Preferences
            </Text>
            <View style={styles.prefRow}>
              <View style={styles.prefLeft}>
                <Ionicons
                  name="notifications-outline"
                  size={18}
                  color={theme.tint}
                />
                <View>
                  <Text style={[styles.prefLabel, { color: theme.text }]}>
                    Dark Mode
                  </Text>
                </View>
              </View>
              <Switch
                value={isDarkMode}
                onValueChange={toggleTheme}
                trackColor={{ false: "#cbd5e1", true: theme.tint }}
                thumbColor="#fff"
              />
            </View>
            <View
              style={[
                styles.prefDivider,
                { backgroundColor: isDarkMode ? "#1e293b" : "#f1f5f9" },
              ]}
            />
            <View style={styles.prefRow}>
              <View style={styles.prefLeft}>
                <Ionicons
                  name="notifications-outline"
                  size={18}
                  color={theme.tint}
                />

                <View>
                  <Text style={[styles.prefLabel, { color: theme.text }]}>
                    Push notifications
                  </Text>

                  <Text
                    style={{
                      fontSize: 10,
                      color: theme.subText,
                      marginTop: 2,
                    }}
                  >
                    Reminders & Achievement alerts
                  </Text>
                </View>
              </View>

              <Switch
                value={isPushEnabled}
                onValueChange={(val) => {
                  setIsPushEnabled(val);
                  handleUpdatePreference("pushNotifications", val);
                }}
                trackColor={{ false: "#cbd5e1", true: theme.tint }}
                thumbColor="#fff"
              />
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: theme.card }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>
              Account
            </Text>
            <Pressable
              style={styles.actionRow}
              onPress={() => setIsEditModalVisible(true)}
            >
              <View
                style={[
                  styles.actionIconCircle,
                  { backgroundColor: isDarkMode ? "#1e1b4b" : "#ede9fe" },
                ]}
              >
                <Ionicons name="person-outline" size={16} color={theme.tint} />
              </View>
              <Text style={[styles.actionText, { color: theme.text }]}>
                Edit profile name
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
            </Pressable>

            <View
              style={[
                styles.actionDivider,
                { backgroundColor: isDarkMode ? "#1e293b" : "#f1f5f9" },
              ]}
            />

            <Pressable
              style={styles.actionRow}
              onPress={() => setIsPasswordModalVisible(true)}
            >
              <View
                style={[
                  styles.actionIconCircle,
                  { backgroundColor: isDarkMode ? "#1e293b" : "#f0fdf4" },
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={16}
                  color="#22c55e"
                />
              </View>
              <Text style={[styles.actionText, { color: theme.text }]}>
                Change password
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
            </Pressable>

            <View
              style={[
                styles.actionDivider,
                { backgroundColor: isDarkMode ? "#1e293b" : "#f1f5f9" },
              ]}
            />

            <Pressable style={styles.actionRow} onPress={handleLogout}>
              <View
                style={[
                  styles.actionIconCircle,
                  { backgroundColor: "#fef2f2" },
                ]}
              >
                <Ionicons name="log-out-outline" size={16} color="#ef4444" />
              </View>
              <Text style={[styles.actionText, { color: "#ef4444" }]}>
                Sign out
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },

  heroGradient: {
    paddingTop: 36,
    paddingBottom: 24,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: 14,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderWidth: 2.5,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    elevation: 4,
  },
  avatarImage: { width: "100%", height: "100%" },
  avatarText: { color: "#fff", fontSize: 40, fontWeight: "800" },
  uploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },

  avatarEditBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 26,
    backgroundColor: "rgba(0,0,0,0.38)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  avatarEditText: {
    fontSize: 10,
    color: "rgba(255,255,255,0.85)",
    fontWeight: "600",
  },
  levelBadge: {
    position: "absolute",
    bottom: -8,
    left: -8,
    backgroundColor: "#fbbf24",
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#6C63FF",
  },
  levelBadgeText: { fontSize: 11, fontWeight: "800", color: "#000" },
  heroName: {
    fontSize: 22,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.3,
  },
  heroEmail: {
    fontSize: 12,
    color: "rgba(255,255,255,0.65)",
    marginTop: 3,
    marginBottom: 16,
  },
  heroStats: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },
  heroStat: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 14,
    paddingVertical: 10,
  },
  heroStatNum: { fontSize: 16, fontWeight: "800", color: "#fff" },
  heroStatLbl: {
    fontSize: 9,
    color: "rgba(255,255,255,0.65)",
    marginTop: 2,
    fontWeight: "500",
  },

  xpBarStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  xpBarLabel: {
    fontSize: 10,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "500",
    marginBottom: 5,
  },
  xpBarTrack: {
    width: 180,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.25)",
    overflow: "hidden",
  },
  xpBarFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  xpBarPct: {
    fontSize: 14,
    fontWeight: "800",
    color: "#fff",
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginTop: 20,
    marginBottom: 12,
  },

  achievementBadge: {
    padding: 14,
    borderRadius: 18,
    alignItems: "center",
    width: 100,
    borderWidth: 0.5,
    position: "relative",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "600",
    marginTop: 7,
    textAlign: "center",
  },
  earnedDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#22c55e",
  },

  card: {
    padding: 18,
    borderRadius: 22,
    marginTop: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 14,
  },

  prefRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  prefLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  prefLabel: { fontSize: 14, fontWeight: "500" },
  prefDivider: { height: 1, marginVertical: 10 },

  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 12,
  },
  actionIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  actionText: { flex: 1, fontSize: 14, fontWeight: "600" },
  actionDivider: { height: 1, marginVertical: 2 },

  sheetBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  sheetContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 36,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#e2e8f0",
    alignSelf: "center",
    marginBottom: 18,
  },
  sheetTitle: { fontSize: 18, fontWeight: "800", marginBottom: 14 },
  sheetSub: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 20,
  },
  sheetInput: {
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 20,
  },
  sheetBtns: { flexDirection: "row", gap: 10 },
  sheetCancelBtn: {
    flex: 1,
    padding: 14,
    alignItems: "center",
    borderRadius: 12,
  },
  sheetCancelText: { fontWeight: "700", fontSize: 14 },
  sheetSaveBtn: {
    flex: 2,
    padding: 14,
    alignItems: "center",
    borderRadius: 12,
  },
  sheetSaveText: { fontWeight: "700", color: "#fff", fontSize: 14 },
});
