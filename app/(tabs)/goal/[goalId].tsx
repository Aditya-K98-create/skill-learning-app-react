import { Ionicons } from "@expo/vector-icons";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useRef, useState } from "react";
import {
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

export default function GoalDetails() {
  const { goalId } = useLocalSearchParams();
  const { goals, addTask, toggleTask, deleteTask, updateTask } = useGoals();
  const { theme, isDarkMode } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  const [taskName, setTaskName] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");
  const [editingTask, setEditingTask] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const [xpVisible, setXpVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const goal = useMemo(
    () => goals.find((g: any) => g.id === goalId),
    [goals, goalId],
  );
  const tasks = goal?.tasks || [];

  const completedCount = tasks.filter((t: any) => t.completed).length;
  const totalCount = tasks.length;
  const progressPercent =
    totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  if (!goal) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text }}>Loading goal...</Text>
      </View>
    );
  }

  const filteredTasks = tasks.filter((t: any) => {
    if (filter === "completed") return t.completed;
    if (filter === "pending") return !t.completed;
    return true;
  });

  const handleAddTask = async () => {
    if (!taskName.trim()) return;
    await addTask(goal.id, taskName.trim());
    setTaskName("");
  };

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
    toggleTask(goal.id, taskId);
    if (!currentStatus) showXP();
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {/* CUSTOM HEADER */}
        <View style={[styles.header, { paddingTop: 10 }]}>
          <Pressable
            onPress={() => router.back()}
            style={[styles.backBtn, { backgroundColor: theme.card }]}
          >
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </Pressable>
          <Text
            style={[styles.headerTitle, { color: theme.text }]}
            numberOfLines={1}
          >
            {goal.title}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <FlatList
          data={filteredTasks}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            padding: 20,
            paddingBottom: tabBarHeight + insets.bottom + 20,
          }}
          ListHeaderComponent={
            <>
              <View
                style={[styles.progressCard, { backgroundColor: theme.card }]}
              >
                <Text style={[styles.smartMessage, { color: theme.tint }]}>
                  {progressPercent === 100
                    ? "Goal Smashed! 🏆"
                    : "Keep going, you're doing great! 💪"}
                </Text>

                <View style={styles.progressLabelRow}>
                  <Text style={[styles.progressText, { color: theme.subText }]}>
                    Mastery
                  </Text>
                  <Text style={[styles.progressText, { color: theme.subText }]}>
                    {progressPercent}%
                  </Text>
                </View>

                <View
                  style={[
                    styles.progressBarBg,
                    { backgroundColor: isDarkMode ? "#334155" : "#f1f5f9" },
                  ]}
                >
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${progressPercent}%`,
                        backgroundColor: theme.tint,
                      },
                    ]}
                  />
                </View>

                <View
                  style={[
                    styles.statsRow,
                    { borderTopColor: isDarkMode ? "#334155" : "#f1f5f9" },
                  ]}
                >
                  <View style={styles.statItem}>
                    <Text style={[styles.statNum, { color: theme.text }]}>
                      {totalCount}
                    </Text>
                    <Text style={styles.statLab}>Tasks</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statNum, { color: "#22c55e" }]}>
                      {completedCount}
                    </Text>
                    <Text style={styles.statLab}>Done</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statNum, { color: "#f59e0b" }]}>
                      {totalCount - completedCount}
                    </Text>
                    <Text style={styles.statLab}>Left</Text>
                  </View>
                </View>
              </View>

              <View
                style={[styles.inputWrapper, { backgroundColor: theme.card }]}
              >
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="Add a sub-task..."
                  placeholderTextColor={isDarkMode ? "#94a3b8" : "#64748b"}
                  value={taskName}
                  onChangeText={setTaskName}
                />
                <Pressable style={styles.addBtn} onPress={handleAddTask}>
                  <Ionicons name="add-circle" size={32} color={theme.tint} />
                </Pressable>
              </View>

              <View style={styles.filterRow}>
                {["all", "pending", "completed"].map((f) => (
                  <Pressable
                    key={f}
                    style={[
                      styles.filterTab,
                      { backgroundColor: theme.card },
                      filter === f && { backgroundColor: theme.tint },
                    ]}
                    onPress={() => setFilter(f as any)}
                  >
                    <Text
                      style={[
                        styles.filterTabText,
                        { color: theme.subText },
                        filter === f && { color: "#fff" },
                      ]}
                    >
                      {f.toUpperCase()}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons
                name="clipboard-outline"
                size={50}
                color={isDarkMode ? "#334155" : "#cbd5e1"}
              />
              <Text style={[styles.emptyText, { color: theme.subText }]}>
                No tasks found in this view
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View
              style={[
                styles.taskCard,
                { backgroundColor: theme.card },
                item.completed && styles.completedCard,
              ]}
            >
              <Pressable
                style={styles.taskMain}
                onPress={() => handleToggle(item.id, item.completed)}
              >
                <View
                  style={[
                    styles.checkbox,
                    { borderColor: isDarkMode ? "#475569" : "#cbd5e1" },
                    item.completed && styles.checkboxActive,
                  ]}
                >
                  {item.completed && (
                    <Ionicons name="checkmark" size={16} color="white" />
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
                  <Text style={[styles.taskXp, { color: theme.tint }]}>
                    🎯 +10 XP
                  </Text>
                </View>
              </Pressable>

              <View style={styles.taskActions}>
                <Pressable
                  onPress={() => openEdit(item)}
                  style={styles.iconPadding}
                >
                  <Ionicons
                    name="pencil"
                    size={18}
                    color={isDarkMode ? "#94a3b8" : "#64748b"}
                  />
                </Pressable>
                <Pressable
                  onPress={() => deleteTask(goal.id, item.id)}
                  style={styles.iconPadding}
                >
                  <Ionicons name="trash" size={18} color="#ef4444" />
                </Pressable>
              </View>
            </View>
          )}
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

        <Modal visible={modalVisible} transparent animationType="fade">
          <View style={styles.modalBg}>
            <View
              style={[styles.modalContent, { backgroundColor: theme.card }]}
            >
              <Text style={[styles.modalHeader, { color: theme.text }]}>
                Update Task
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
              />
              <View style={styles.modalButtons}>
                <Pressable
                  style={[
                    styles.cancelBtn,
                    { backgroundColor: isDarkMode ? "#334155" : "#f1f5f9" },
                  ]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={[styles.cancelText, { color: theme.subText }]}>
                    Cancel
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.updateBtn, { backgroundColor: theme.tint }]}
                  onPress={handleUpdate}
                >
                  <Text style={styles.updateText}>Save</Text>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    height: 60,
  },
  backBtn: {
    padding: 8,
    borderRadius: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
  },
  progressCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
  },
  smartMessage: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 15,
  },
  progressLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  progressText: {
    fontSize: 13,
    fontWeight: "bold",
  },
  progressBarBg: {
    height: 8,
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 20,
  },
  progressBarFill: {
    height: "100%",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderTopWidth: 1,
    paddingTop: 15,
  },
  statItem: { alignItems: "center" },
  statNum: { fontSize: 16, fontWeight: "bold" },
  statLab: { fontSize: 10, color: "#94a3b8", marginTop: 2 },

  inputWrapper: {
    flexDirection: "row",
    borderRadius: 18,
    padding: 6,
    alignItems: "center",
    marginBottom: 20,
  },
  input: {
    flex: 1,
    paddingHorizontal: 15,
    height: 45,
    fontSize: 15,
  },
  addBtn: {
    paddingRight: 5,
  },
  filterRow: {
    flexDirection: "row",
    marginBottom: 20,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  filterTabText: {
    fontSize: 11,
    fontWeight: "bold",
  },
  taskCard: {
    borderRadius: 18,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  completedCard: {
    opacity: 0.6,
  },
  taskMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 2,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxActive: {
    backgroundColor: "#22c55e",
    borderColor: "#22c55e",
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  strikeText: {
    textDecorationLine: "line-through",
  },
  taskXp: {
    fontSize: 11,
    fontWeight: "bold",
    marginTop: 2,
  },
  taskActions: {
    flexDirection: "row",
    gap: 5,
  },
  iconPadding: {
    padding: 5,
  },
  xpPopup: {
    position: "absolute",
    top: "45%",
    alignSelf: "center",
    backgroundColor: "#22c55e",
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 10,
    zIndex: 999,
  },
  xpPopupText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 40,
  },
  emptyText: {
    marginTop: 10,
  },
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    borderRadius: 24,
    padding: 25,
  },
  modalHeader: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  modalInput: {
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    marginBottom: 25,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    padding: 15,
    alignItems: "center",
    borderRadius: 12,
  },
  cancelText: {
    fontWeight: "bold",
  },
  updateBtn: {
    flex: 2,
    padding: 15,
    alignItems: "center",
    borderRadius: 12,
  },
  updateText: {
    fontWeight: "bold",
    color: "#fff",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
