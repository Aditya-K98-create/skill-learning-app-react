import { Ionicons } from "@expo/vector-icons";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useGoals } from "../../../components/context/GoalContext";
import { useTheme } from "../../../context/ThemeContext";

type FilterType = "all" | "pending" | "completed";

export default function GoalDetails() {
  const { goalId } = useLocalSearchParams();
  const { goals, addTask, toggleTask, deleteTask, updateTask } = useGoals();
  const { theme, isDarkMode } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  const [taskName, setTaskName] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");

  const [editingTask, setEditingTask] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const [renameVisible, setRenameVisible] = useState(false);
  const [renameTitle, setRenameTitle] = useState("");

  const [xpVisible, setXpVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const goal = useMemo(
    () => goals.find((g: any) => g.id === goalId),
    [goals, goalId],
  );
  const tasks = goal?.tasks || [];

  const completedCount = tasks.filter((t: any) => t.completed).length;
  const totalCount = tasks.length;
  const pendingCount = totalCount - completedCount;
  const progressPercent =
    totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  if (!goal) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text }}>Loading goal...</Text>
      </View>
    );
  }

  const TABS: { key: FilterType; label: string }[] = [
    { key: "all", label: `All (${totalCount})` },
    { key: "pending", label: `Pending (${pendingCount})` },
    { key: "completed", label: `Done (${completedCount})` },
  ];

  const filteredTasks = useMemo(() => {
    const filtered = tasks.filter((t: any) => {
      if (filter === "completed") return t.completed;
      if (filter === "pending") return !t.completed;
      return true;
    });

    return [...filtered].sort(
      (a, b) => Number(a.completed) - Number(b.completed),
    );
  }, [tasks, filter]);

  const showXP = () => {
    setXpVisible(true);
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(800),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => setXpVisible(false));
  };

  const handleToggle = (taskId: string, currentStatus: boolean) => {
    toggleTask(goal.id, taskId, !currentStatus);
    if (!currentStatus) showXP(); // only celebrate when completing
  };

  const handleAddTask = async () => {
    if (!taskName.trim()) return;
    await addTask(goal.id, taskName.trim());
    setTaskName("");
  };

  const openEdit = (item: any) => {
    setEditingTask(item);
    setNewTitle(item.title);
    setModalVisible(true);
  };

  const handleUpdate = async () => {
    if (!newTitle.trim()) return;
    await updateTask(goal.id, editingTask.id, newTitle.trim());
    setModalVisible(false);
  };

  const openRename = () => {
    setRenameTitle(goal.title);
    setRenameVisible(true);
  };

  const handleRename = async () => {
    if (!renameTitle.trim()) return;

    setRenameVisible(false);
  };

  const confirmDeleteTask = (taskId: string) => {
    Alert.alert("Delete Task?", "This will permanently remove this task.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteTask(goal.id, taskId),
      },
    ]);
  };

  const taskAccentColor = (completed: boolean) =>
    completed ? "#22c55e" : theme.tint;

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.background }}
      edges={["bottom", "left", "right"]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <LinearGradient
          colors={["#6C63FF", "#4ECDC4"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.heroGradient, { paddingTop: insets.top + 10 }]}
        >
          <View style={styles.navRow}>
            <Pressable onPress={() => router.back()} style={styles.ghostBtn}>
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </Pressable>

            <Text style={styles.heroTitle} numberOfLines={1}>
              {goal.title}
            </Text>

            <View style={styles.headerActions}>
              <Pressable style={styles.ghostBtn} onPress={openRename}>
                <Ionicons name="pencil" size={16} color="#fff" />
              </Pressable>
            </View>
          </View>

          <Text style={styles.heroPct}>{progressPercent}%</Text>
          <Text style={styles.heroPctSub}>
            {progressPercent === 100
              ? "Goal achieved 🏆"
              : `Mastery · ${pendingCount} task${pendingCount === 1 ? "" : "s"} remaining`}
          </Text>

          <View style={styles.heroBarTrack}>
            <View
              style={[styles.heroBarFill, { width: `${progressPercent}%` }]}
            />
          </View>

          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatNum}>{totalCount}</Text>
              <Text style={styles.heroStatLbl}>Tasks</Text>
            </View>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatNum}>{completedCount}</Text>
              <Text style={styles.heroStatLbl}>Done</Text>
            </View>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatNum}>{pendingCount}</Text>
              <Text style={styles.heroStatLbl}>Left</Text>
            </View>
          </View>
        </LinearGradient>

        <FlatList
          data={filteredTasks}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: tabBarHeight + insets.bottom + 20,
          }}
          ListHeaderComponent={
            <>
              <View
                style={[styles.inputWrapper, { backgroundColor: theme.card }]}
              >
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="Add a new task..."
                  placeholderTextColor={isDarkMode ? "#94a3b8" : "#64748b"}
                  value={taskName}
                  onChangeText={setTaskName}
                  onSubmitEditing={handleAddTask}
                  returnKeyType="done"
                />
                <Pressable
                  style={[styles.addBtn, { backgroundColor: theme.tint }]}
                  onPress={handleAddTask}
                >
                  <Ionicons name="add" size={22} color="#fff" />
                </Pressable>
              </View>

              <View style={styles.filterRow}>
                {TABS.map((tab) => {
                  const isActive = filter === tab.key;
                  return (
                    <Pressable
                      key={tab.key}
                      style={[
                        styles.filterTab,
                        {
                          backgroundColor: isActive
                            ? theme.tint
                            : isDarkMode
                              ? "#1e293b"
                              : theme.card,
                        },
                      ]}
                      onPress={() => setFilter(tab.key)}
                    >
                      <Text
                        style={[
                          styles.filterTabText,
                          { color: isActive ? "#fff" : theme.subText },
                        ]}
                      >
                        {tab.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons
                name="clipboard-outline"
                size={48}
                color={isDarkMode ? "#334155" : "#cbd5e1"}
              />
              <Text style={[styles.emptyText, { color: theme.subText }]}>
                {filter === "all"
                  ? "No tasks yet — add one above!"
                  : `No ${filter} tasks`}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const accent = taskAccentColor(item.completed);

            if (editingTask?.id === item.id && modalVisible === false) {
            }

            return (
              <View
                style={[
                  styles.taskCard,
                  { backgroundColor: theme.card },
                  item.completed && styles.completedCard,
                ]}
              >
                <View
                  style={[styles.taskAccent, { backgroundColor: accent }]}
                />

                <Pressable
                  style={styles.taskMain}
                  onPress={() => handleToggle(item.id, item.completed)}
                >
                  <View
                    style={[
                      styles.checkbox,
                      { borderColor: isDarkMode ? "#475569" : "#cbd5e1" },
                      item.completed && {
                        backgroundColor: "#22c55e",
                        borderColor: "#22c55e",
                      },
                    ]}
                  >
                    {item.completed && (
                      <Ionicons name="checkmark" size={14} color="white" />
                    )}
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.taskTitle,
                        { color: theme.text },
                        item.completed && styles.strikeText,
                      ]}
                    >
                      {item.title}
                    </Text>

                    <Text
                      style={[
                        styles.taskXp,
                        {
                          color: item.completed ? "#22c55e" : theme.tint,
                        },
                      ]}
                    >
                      {item.completed ? "+10 XP earned" : "+10 XP on complete"}
                    </Text>
                  </View>
                </Pressable>

                <View style={styles.taskActions}>
                  {!item.completed && (
                    <Pressable
                      onPress={() => openEdit(item)}
                      style={[
                        styles.actionBtn,
                        {
                          backgroundColor: isDarkMode ? "#1e293b" : "#f0effe",
                        },
                      ]}
                    >
                      <Ionicons name="pencil" size={14} color={theme.tint} />
                    </Pressable>
                  )}
                  <Pressable
                    onPress={() => confirmDeleteTask(item.id)}
                    style={[styles.actionBtn, { backgroundColor: "#fef2f2" }]}
                  >
                    <Ionicons name="trash" size={14} color="#ef4444" />
                  </Pressable>
                </View>
              </View>
            );
          }}
        />

        {xpVisible && (
          <Animated.View
            style={[
              styles.xpPopup,
              { opacity: fadeAnim, transform: [{ scale: fadeAnim }] },
            ]}
          >
            <Text style={styles.xpPopupText}>+10 XP 🎉</Text>
          </Animated.View>
        )}

        <Modal visible={modalVisible} transparent animationType="slide">
          <View style={styles.modalBg}>
            <View
              style={[styles.modalContent, { backgroundColor: theme.card }]}
            >
              <View style={styles.modalHandle} />
              <Text style={[styles.modalHeader, { color: theme.text }]}>
                Edit task
              </Text>
              <TextInput
                style={[
                  styles.modalInput,
                  {
                    backgroundColor: isDarkMode ? theme.background : "#f1f5f9",
                    color: theme.text,
                  },
                ]}
                value={newTitle}
                onChangeText={setNewTitle}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleUpdate}
              />
              <View style={styles.modalButtons}>
                <Pressable
                  style={[
                    styles.modalCancelBtn,
                    {
                      backgroundColor: isDarkMode ? "#334155" : "#f1f5f9",
                    },
                  ]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text
                    style={[styles.modalCancelText, { color: theme.subText }]}
                  >
                    Cancel
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.modalSaveBtn, { backgroundColor: theme.tint }]}
                  onPress={handleUpdate}
                >
                  <Text style={styles.modalSaveText}>Save</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        <Modal visible={renameVisible} transparent animationType="slide">
          <View style={styles.modalBg}>
            <View
              style={[styles.modalContent, { backgroundColor: theme.card }]}
            >
              <View style={styles.modalHandle} />
              <Text style={[styles.modalHeader, { color: theme.text }]}>
                Rename goal
              </Text>
              <TextInput
                style={[
                  styles.modalInput,
                  {
                    backgroundColor: isDarkMode ? theme.background : "#f1f5f9",
                    color: theme.text,
                  },
                ]}
                value={renameTitle}
                onChangeText={setRenameTitle}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleRename}
              />
              <View style={styles.modalButtons}>
                <Pressable
                  style={[
                    styles.modalCancelBtn,
                    {
                      backgroundColor: isDarkMode ? "#334155" : "#f1f5f9",
                    },
                  ]}
                  onPress={() => setRenameVisible(false)}
                >
                  <Text
                    style={[styles.modalCancelText, { color: theme.subText }]}
                  >
                    Cancel
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.modalSaveBtn, { backgroundColor: theme.tint }]}
                  onPress={handleRename}
                >
                  <Text style={styles.modalSaveText}>Rename</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  heroGradient: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  ghostBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  heroTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
    marginHorizontal: 8,
  },
  headerActions: {
    flexDirection: "row",
    gap: 6,
  },
  heroPct: {
    fontSize: 48,
    fontWeight: "900",
    color: "#fff",
    textAlign: "center",
    lineHeight: 52,
    letterSpacing: -1,
  },
  heroPctSub: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    marginTop: 4,
    marginBottom: 14,
    fontWeight: "500",
  },
  heroBarTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.25)",
    overflow: "hidden",
    marginBottom: 16,
  },
  heroBarFill: {
    height: "100%",
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  heroStats: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  heroStat: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 12,
    paddingVertical: 8,
    marginHorizontal: 4,
  },
  heroStatNum: {
    fontSize: 18,
    fontWeight: "800",
    color: "#fff",
  },
  heroStatLbl: {
    fontSize: 9,
    color: "rgba(255,255,255,0.65)",
    marginTop: 2,
    fontWeight: "500",
  },

  inputWrapper: {
    flexDirection: "row",
    borderRadius: 16,
    padding: 6,
    alignItems: "center",
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    height: 44,
    fontSize: 14,
    fontWeight: "500",
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  filterRow: {
    flexDirection: "row",
    marginBottom: 16,
    gap: 6,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 10,
    alignItems: "center",
  },
  filterTabText: {
    fontSize: 10,
    fontWeight: "700",
  },

  taskCard: {
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  completedCard: {
    opacity: 0.55,
  },

  taskAccent: {
    width: 4,
    alignSelf: "stretch",
  },
  taskMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 2,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  strikeText: {
    textDecorationLine: "line-through",
  },

  taskXp: {
    fontSize: 10,
    fontWeight: "600",
    marginTop: 3,
  },
  taskActions: {
    flexDirection: "row",
    gap: 6,
    paddingRight: 12,
  },
  actionBtn: {
    width: 30,
    height: 30,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
  },

  xpPopup: {
    position: "absolute",
    top: "45%",
    alignSelf: "center",
    backgroundColor: "#22c55e",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    elevation: 10,
    zIndex: 999,
  },
  xpPopupText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },

  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },

  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 36,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#e2e8f0",
    alignSelf: "center",
    marginBottom: 18,
  },
  modalHeader: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 16,
  },
  modalInput: {
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    padding: 14,
    alignItems: "center",
    borderRadius: 12,
  },
  modalCancelText: {
    fontWeight: "700",
    fontSize: 14,
  },
  modalSaveBtn: {
    flex: 2,
    padding: 14,
    alignItems: "center",
    borderRadius: 12,
  },
  modalSaveText: {
    fontWeight: "700",
    color: "#fff",
    fontSize: 14,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
