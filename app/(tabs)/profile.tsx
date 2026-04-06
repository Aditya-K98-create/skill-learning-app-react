import { Ionicons } from "@expo/vector-icons";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import { get, ref, update } from "firebase/database";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

export default function Profile() {
  const { isDarkMode, theme, toggleTheme } = useTheme();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isPushEnabled, setIsPushEnabled] = useState(true);

  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [newNameInput, setNewNameInput] = useState("");

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
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdatePreference = async (key: string, value: any) => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      await update(ref(db, `users/${user.uid}`), { [key]: value });
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
      // 1. Update Firebase
      await update(ref(db, `users/${user.uid}`), { name: newNameInput.trim() });

      // 2. Update local state
      setUserData((prev: any) => ({ ...prev, name: newNameInput.trim() }));

      // 3. Close Modal
      setIsEditModalVisible(false);
      Alert.alert("Success", "Name updated successfully!");
    } catch (err) {
      Alert.alert("Error", "Failed to update name");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.replace("/login");
  };

  if (loading) {
    return (
      <View style={[styles.loader, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.tint} />
      </View>
    );
  }

  const name = userData?.name || "User";
  const xp = userData?.xp || 0;
  const streak = userData?.streak || 0;
  const level = Math.floor(xp / 100) + 1;
  const progress = (xp % 100) / 100;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

      <Modal
        visible={isEditModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Edit Profile Name
            </Text>
            <TextInput
              style={[
                styles.modalInput,
                { color: theme.text, borderColor: theme.border },
              ]}
              value={newNameInput}
              onChangeText={setNewNameInput}
              placeholder="Enter new name"
              placeholderTextColor="#94a3b8"
              autoFocus={Platform.OS !== "web"}
            />
            <View style={styles.modalButtons}>
              <Pressable
                style={styles.modalBtnCancel}
                onPress={() => setIsEditModalVisible(false)}
              >
                <Text style={{ color: "#ef4444", fontWeight: "bold" }}>
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtnSave, { backgroundColor: theme.tint }]}
                onPress={saveName}
              >
                <Text style={{ color: "#fff", fontWeight: "bold" }}>
                  Save Changes
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            padding: 20,
            paddingTop: 10, // Fixed upper space
            paddingBottom: tabBarHeight + insets.bottom + 40,
          }}
        >
          <View style={styles.header}>
            <View style={styles.avatarContainer}>
              <View style={[styles.avatar, { backgroundColor: theme.tint }]}>
                <Text style={styles.avatarText}>
                  {name ? name[0].toUpperCase() : "U"}
                </Text>
              </View>
              <View
                style={[styles.levelBadge, { borderColor: theme.background }]}
              >
                <Text style={styles.levelBadgeText}>Lv {level}</Text>
              </View>
            </View>

            <Text style={[styles.nameText, { color: theme.text }]}>{name}</Text>
            <Text style={[styles.emailText, { color: theme.subText }]}>
              {auth.currentUser?.email}
            </Text>

            <View
              style={[styles.statsContainer, { backgroundColor: theme.card }]}
            >
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: theme.text }]}>
                  {xp}
                </Text>
                <Text style={[styles.statLabel, { color: theme.subText }]}>
                  Total XP
                </Text>
              </View>
              <View
                style={[styles.divider, { backgroundColor: theme.border }]}
              />
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: theme.text }]}>
                  🔥 {streak}
                </Text>
                <Text style={[styles.statLabel, { color: theme.subText }]}>
                  Streak
                </Text>
              </View>
              <View
                style={[styles.divider, { backgroundColor: theme.border }]}
              />
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: theme.text }]}>
                  #{Math.max(1, 10 - Math.floor(level / 2))}
                </Text>
                <Text style={[styles.statLabel, { color: theme.subText }]}>
                  Rank
                </Text>
              </View>
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: theme.card }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>
                Level Progress
              </Text>
              <Text style={[styles.xpLeftText, { color: theme.tint }]}>
                {100 - (xp % 100)} XP to Lv {level + 1}
              </Text>
            </View>
            <View
              style={[styles.progressBar, { backgroundColor: theme.border }]}
            >
              <View
                style={[
                  styles.progressFill,
                  { width: `${progress * 100}%`, backgroundColor: theme.tint },
                ]}
              />
            </View>
            <Text
              style={[styles.progressPercentText, { color: theme.subText }]}
            >
              {Math.round(progress * 100)}% Journey Completed
            </Text>
          </View>

          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Achievements 🏅
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.achievementScroll}
          >
            <View
              style={[styles.achievementBadge, { backgroundColor: theme.card }]}
            >
              <Ionicons name="flame" size={24} color="#f97316" />
              <Text style={[styles.badgeText, { color: theme.subText }]}>
                7 Day Streak
              </Text>
            </View>
            <View
              style={[styles.achievementBadge, { backgroundColor: theme.card }]}
            >
              <Ionicons name="trophy" size={24} color="#fbbf24" />
              <Text style={[styles.badgeText, { color: theme.subText }]}>
                Top 10
              </Text>
            </View>
            <View
              style={[styles.achievementBadge, { backgroundColor: theme.card }]}
            >
              <Ionicons name="school" size={24} color={theme.tint} />
              <Text style={[styles.badgeText, { color: theme.subText }]}>
                Fast Learner
              </Text>
            </View>
          </ScrollView>

          <View style={[styles.card, { backgroundColor: theme.card }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>
              Preferences
            </Text>
            <View style={styles.settingsRow}>
              <View style={styles.settingsLabelGroup}>
                <Ionicons name="moon-outline" size={20} color={theme.tint} />
                <Text style={[styles.settingsLabel, { color: theme.text }]}>
                  Dark Mode
                </Text>
              </View>
              <Switch
                value={isDarkMode}
                onValueChange={toggleTheme}
                trackColor={{ false: "#cbd5e1", true: theme.tint }}
              />
            </View>
            <View style={[styles.settingsRow, { marginTop: 15 }]}>
              <View style={styles.settingsLabelGroup}>
                <Ionicons
                  name="notifications-outline"
                  size={20}
                  color={theme.tint}
                />
                <Text style={[styles.settingsLabel, { color: theme.text }]}>
                  Push Notifications
                </Text>
              </View>
              <Switch
                value={isPushEnabled}
                onValueChange={(val) => {
                  setIsPushEnabled(val);
                  handleUpdatePreference("pushNotifications", val);
                }}
                trackColor={{ false: "#cbd5e1", true: theme.tint }}
              />
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: theme.card }]}>
            <Pressable
              style={styles.actionRow}
              onPress={() => setIsEditModalVisible(true)}
            >
              <Ionicons name="person-outline" size={20} color={theme.tint} />
              <Text style={[styles.actionText, { color: theme.text }]}>
                Edit Profile
              </Text>
              <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
            </Pressable>
            <View
              style={[
                styles.horizontalDivider,
                { backgroundColor: theme.border },
              ]}
            />
            <Pressable style={styles.actionRow} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color="#ef4444" />
              <Text style={[styles.actionText, { color: "#ef4444" }]}>
                Logout
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: { alignItems: "center", marginBottom: 10 },
  avatarContainer: { position: "relative", marginBottom: 15 },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },
  avatarText: { color: "#fff", fontSize: 40, fontWeight: "bold" },
  levelBadge: {
    position: "absolute",
    bottom: -5,
    right: -5,
    backgroundColor: "#fbbf24",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 3,
  },
  levelBadgeText: { fontSize: 12, fontWeight: "bold", color: "#000" },

  nameText: { fontSize: 24, fontWeight: "bold" },
  emailText: { fontSize: 14, marginTop: 4 },

  statsContainer: {
    flexDirection: "row",
    borderRadius: 20,
    padding: 20,
    marginTop: 25,
    width: "100%",
    justifyContent: "space-around",
    alignItems: "center",
    elevation: 2,
  },
  statItem: { alignItems: "center" },
  statNumber: { fontSize: 18, fontWeight: "bold" },
  statLabel: { fontSize: 12, marginTop: 4 },
  divider: { width: 1, height: 30 },

  card: {
    padding: 20,
    borderRadius: 24,
    marginBottom: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  cardTitle: { fontSize: 16, fontWeight: "bold" },
  xpLeftText: { fontSize: 12, fontWeight: "600" },
  progressBar: {
    height: 10,
    borderRadius: 5,
    overflow: "hidden",
  },
  progressFill: { height: "100%" },
  progressPercentText: {
    marginTop: 10,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "500",
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    marginLeft: 5,
  },
  achievementScroll: { marginBottom: 25 },
  achievementBadge: {
    padding: 15,
    borderRadius: 20,
    alignItems: "center",
    marginRight: 12,
    width: 110,
    elevation: 2,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "600",
    marginTop: 8,
    textAlign: "center",
  },

  settingsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  settingsLabelGroup: { flexDirection: "row", alignItems: "center", gap: 10 },
  settingsLabel: { fontWeight: "500" },

  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  actionText: { flex: 1, marginLeft: 15, fontWeight: "600" },
  horizontalDivider: {
    height: 1,
    marginVertical: 5,
  },
  // --- MODAL STYLES ---
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    padding: 25,
    borderRadius: 25,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    marginBottom: 25,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 15,
  },
  modalBtnCancel: {
    padding: 12,
  },
  modalBtnSave: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
});
