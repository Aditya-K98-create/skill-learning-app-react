import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
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
import { useGoals } from "../../components/context/GoalContext";
import { useTheme } from "../../context/ThemeContext";

export default function Goals() {
  const { goals, addGoal, deleteGoal, updateGoal } = useGoals();
  const { theme, isDarkMode } = useTheme(); // Use Theme Hook
  const [goalInput, setGoalInput] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleSave = async () => {
    if (!goalInput.trim()) {
      Alert.alert("⚠️", "Please enter a goal name");
      return;
    }

    try {
      if (editingId) {
        await updateGoal(editingId, goalInput.trim());
        setEditingId(null);
      } else {
        await addGoal(goalInput.trim());
      }
      setGoalInput("");
    } catch (err) {
      console.log("Save Error:", err);
      Alert.alert("Error", "Could not save goal");
    }
  };

  const confirmDelete = (id: string) => {
    Alert.alert(
      "Delete Goal",
      "This will remove the goal and all associated tasks. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteGoal(id);
            } catch (err) {
              Alert.alert("Error", "Delete failed");
            }
          },
        },
      ],
    );
  };

  const handleEdit = (item: any) => {
    setGoalInput(item.title);
    setEditingId(item.id);
  };

  const getGoalProgress = (tasks: any[]) => {
    if (!tasks || tasks.length === 0) return 0;
    const completed = tasks.filter((t) => t.completed).length;
    return Math.round((completed / tasks.length) * 100);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={[styles.container, { paddingTop: 10 }]}>
          <View style={styles.headerSection}>
            <Text style={[styles.title, { color: theme.text }]}>
              My Goals 🎯
            </Text>
            <Text style={[styles.subtitle, { color: theme.subText }]}>
              {goals.length} active learning tracks
            </Text>
          </View>

          <View
            style={[
              styles.inputWrapper,
              { backgroundColor: theme.card, shadowColor: theme.tint },
            ]}
          >
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="e.g. Master React Native"
              placeholderTextColor={isDarkMode ? "#94a3b8" : "#64748b"}
              value={goalInput}
              onChangeText={setGoalInput}
            />
            <Pressable
              style={[
                styles.addButton,
                { backgroundColor: editingId ? "#0ea5e9" : theme.tint },
              ]}
              onPress={handleSave}
            >
              <Ionicons
                name={editingId ? "checkmark" : "add"}
                size={24}
                color="white"
              />
            </Pressable>
          </View>

          <FlatList
            data={goals}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View
                  style={[
                    styles.emptyIconCircle,
                    { backgroundColor: isDarkMode ? "#1e293b" : "#eef2ff" },
                  ]}
                >
                  <Ionicons name="flag-outline" size={40} color={theme.tint} />
                </View>
                <Text style={[styles.emptyTitle, { color: theme.text }]}>
                  No goals yet
                </Text>
                <Text style={[styles.emptySub, { color: theme.subText }]}>
                  Start your first learning journey above!
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const progress = getGoalProgress(item.tasks || []);
              const taskCount = item.tasks?.length || 0;

              return (
                <View style={[styles.card, { backgroundColor: theme.card }]}>
                  <View style={styles.cardMain}>
                    <Pressable
                      style={{ flex: 1 }}
                      onPress={() => router.push(`/goal/${item.id}`)}
                    >
                      <View style={styles.goalInfo}>
                        <Text
                          style={[styles.goalTitle, { color: theme.text }]}
                          numberOfLines={1}
                        >
                          {item.title}
                        </Text>
                        <Text
                          style={[
                            styles.taskCountText,
                            { color: theme.subText },
                          ]}
                        >
                          {taskCount} {taskCount === 1 ? "task" : "tasks"}
                        </Text>
                      </View>

                      <View style={styles.goalProgressContainer}>
                        <View
                          style={[
                            styles.goalProgressBg,
                            {
                              backgroundColor: isDarkMode
                                ? "#334155"
                                : "#f1f5f9",
                            },
                          ]}
                        >
                          <View
                            style={[
                              styles.goalProgressFill,
                              {
                                width: `${progress}%`,
                                backgroundColor: theme.tint,
                              },
                            ]}
                          />
                        </View>
                        <Text
                          style={[
                            styles.progressPercentText,
                            { color: theme.subText },
                          ]}
                        >
                          {progress}%
                        </Text>
                      </View>
                    </Pressable>

                    <View
                      style={[
                        styles.actionGroup,
                        { borderLeftColor: isDarkMode ? "#334155" : "#f1f5f9" },
                      ]}
                    >
                      <Pressable
                        style={styles.actionIcon}
                        onPress={() => handleEdit(item)}
                      >
                        <Ionicons
                          name="pencil-outline"
                          size={20}
                          color={isDarkMode ? "#94a3b8" : "#64748b"}
                        />
                      </Pressable>
                      <Pressable
                        style={styles.actionIcon}
                        onPress={() => confirmDelete(item.id)}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={20}
                          color="#ef4444"
                        />
                      </Pressable>
                    </View>
                  </View>
                </View>
              );
            }}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  headerSection: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 15,
    marginTop: 4,
  },
  inputWrapper: {
    flexDirection: "row",
    padding: 8,
    borderRadius: 20,
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    marginBottom: 25,
    alignItems: "center",
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    height: 50,
    fontSize: 16,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    borderRadius: 20,
    marginBottom: 16,
    padding: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  cardMain: {
    flexDirection: "row",
    alignItems: "center",
  },
  goalInfo: {
    marginBottom: 12,
  },
  goalTitle: {
    fontSize: 17,
    fontWeight: "bold",
    marginBottom: 2,
  },
  taskCountText: {
    fontSize: 13,
    fontWeight: "500",
  },
  goalProgressContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  goalProgressBg: {
    flex: 1,
    height: 6,
    borderRadius: 10,
    marginRight: 10,
    overflow: "hidden",
  },
  goalProgressFill: {
    height: "100%",
    borderRadius: 10,
  },
  progressPercentText: {
    fontSize: 12,
    fontWeight: "bold",
    width: 35,
  },
  actionGroup: {
    flexDirection: "column",
    justifyContent: "center",
    paddingLeft: 15,
    borderLeftWidth: 1,
    marginLeft: 10,
  },
  actionIcon: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 80,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  emptySub: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
    maxWidth: "80%",
  },
});
