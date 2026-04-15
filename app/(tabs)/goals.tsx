import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  LayoutAnimation,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  UIManager,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useGoals } from "../../components/context/GoalContext";
import { useTheme } from "../../context/ThemeContext";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get("window");

// ── Filter tab type ──────────────────────────────────────────────────────────
type FilterTab = "All" | "In Progress" | "Done" | "New";
const FILTER_TABS: FilterTab[] = ["All", "In Progress", "Done", "New"];

export default function Goals() {
  const { goals, addGoal, deleteGoal, updateGoal } = useGoals();
  const { theme, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [goalInput, setGoalInput] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  // IMPROVEMENT 2: filter tab state
  const [activeFilter, setActiveFilter] = useState<FilterTab>("All");

  // ── Helpers ────────────────────────────────────────────────────────────────
  const getGoalProgress = (tasks: any[]) => {
    if (!tasks || tasks.length === 0) return 0;
    const completed = tasks.filter((t) => t.completed).length;
    return Math.round((completed / tasks.length) * 100);
  };

  const formatDate = (timestamp: number) => {
    if (!timestamp) return "Date unknown";
    return new Date(timestamp).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusLabel = (progress: number) => {
    if (progress === 0) return { label: "Not Started", color: "#64748b" };
    if (progress === 100) return { label: "Completed", color: "#22c55e" };
    return { label: "In Progress", color: theme.tint };
  };

  // IMPROVEMENT 3: accent bar colour per status
  const getAccentColor = (progress: number) => {
    if (progress === 100) return "#22c55e";
    if (progress > 0) return theme.tint;
    return isDarkMode ? "#334155" : "#cbd5e1";
  };

  // IMPROVEMENT 7: status sort order (in-progress first, then new, then done)
  const statusOrder = (g: any) => {
    const p = getGoalProgress(g.tasks || []);
    if (p > 0 && p < 100) return 0;
    if (p === 0) return 1;
    return 2;
  };

  // ── IMPROVEMENT 1: summary stats ──────────────────────────────────────────
  const summaryStats = useMemo(() => {
    const total = goals.length;
    const inProgress = goals.filter((g: any) => {
      const p = getGoalProgress(g.tasks || []);
      return p > 0 && p < 100;
    }).length;
    const done = goals.filter(
      (g: any) => getGoalProgress(g.tasks || []) === 100,
    ).length;
    return { total, inProgress, done };
  }, [goals]);

  // ── Processed + filtered + sorted goals ───────────────────────────────────
  const processedGoals = useMemo(() => {
    let result = [...goals];

    // Search filter
    if (searchQuery.trim()) {
      result = result.filter((g: any) =>
        g.title.toLowerCase().includes(searchQuery.toLowerCase().trim()),
      );
    }

    // IMPROVEMENT 2: tab filter
    if (activeFilter !== "All") {
      result = result.filter((g: any) => {
        const p = getGoalProgress(g.tasks || []);
        if (activeFilter === "In Progress") return p > 0 && p < 100;
        if (activeFilter === "Done") return p === 100;
        if (activeFilter === "New") return p === 0;
        return true;
      });
    }

    // IMPROVEMENT 7: sort — in-progress first, then new, then done; tie-break by date
    return result.sort(
      (a: any, b: any) =>
        statusOrder(a) - statusOrder(b) ||
        (b.createdAt || 0) - (a.createdAt || 0),
    );
  }, [goals, searchQuery, activeFilter]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!goalInput.trim()) {
      Alert.alert("Input Required", "Please enter a valid goal name.");
      return;
    }
    try {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      if (editingId) {
        await updateGoal(editingId, goalInput.trim());
        setEditingId(null);
      } else {
        await addGoal(goalInput.trim());
      }
      setGoalInput("");
    } catch (err) {
      console.error("Save Error:", err);
      Alert.alert("Operation Failed", "Could not save your changes.");
    }
  };

  const confirmDelete = (id: string) => {
    Alert.alert(
      "Delete Learning Track?",
      "This will permanently remove this goal and all associated progress.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
              await deleteGoal(id);
            } catch {
              Alert.alert("Error", "Deletion failed. Please try again.");
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

  // ── Render goal card ────────────────────────────────────────────────────────
  const renderGoalItem = ({ item }: { item: any }) => {
    const progress = getGoalProgress(item.tasks || []);
    const taskCount = item.tasks?.length || 0;
    const status = getStatusLabel(progress);
    const accentColor = getAccentColor(progress);

    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.card,
            // IMPROVEMENT 3: accent left border via shadow/border trick
          },
        ]}
      >
        {/* IMPROVEMENT 3: coloured left accent bar */}
        <View style={[styles.cardAccent, { backgroundColor: accentColor }]} />

        <Pressable
          style={styles.cardBody}
          onPress={() => router.push(`/goal/${item.id}`)}
        >
          {/* IMPROVEMENT 8: title on its own row, date below — no maxWidth clash */}
          <Text
            style={[styles.goalTitle, { color: theme.text }]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text style={[styles.dateText, { color: theme.subText }]}>
            {formatDate(item.createdAt)}
          </Text>

          <View style={styles.badgeRow}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: status.color + "18" },
              ]}
            >
              <Text style={[styles.statusText, { color: status.color }]}>
                {status.label}
              </Text>
            </View>
            {/* IMPROVEMENT 4: fix plural + hint for empty goals */}
            <Text style={[styles.taskCountText, { color: theme.subText }]}>
              {taskCount} {taskCount === 1 ? "task" : "tasks"}
              {taskCount === 0 ? " · tap to add" : ""}
            </Text>
          </View>

          <View style={styles.progressRow}>
            <View
              style={[
                styles.progressBg,
                {
                  backgroundColor: isDarkMode ? "#334155" : "#f1f5f9",
                },
              ]}
            >
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${progress}%`,
                    backgroundColor: accentColor,
                  },
                ]}
              />
            </View>
            <Text
              style={[
                styles.progressPct,
                {
                  color: progress === 0 ? theme.subText : accentColor,
                },
              ]}
            >
              {progress}%
            </Text>
          </View>
        </Pressable>

        {/* Action buttons */}
        <View
          style={[
            styles.actionGroup,
            {
              borderLeftColor: isDarkMode ? "#334155" : "#f1f5f9",
            },
          ]}
        >
          <Pressable
            style={[
              styles.actionIcon,
              {
                backgroundColor: isDarkMode ? "#1e293b" : "#f0effe",
              },
            ]}
            onPress={() => handleEdit(item)}
          >
            <Ionicons name="pencil-sharp" size={15} color={theme.tint} />
          </Pressable>
          <Pressable
            style={[styles.actionIcon, { backgroundColor: "#fef2f2" }]}
            onPress={() => confirmDelete(item.id)}
          >
            <Ionicons name="trash-bin-outline" size={15} color="#ef4444" />
          </Pressable>
        </View>
      </View>
    );
  };

  // ── Empty state ─────────────────────────────────────────────────────────────
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View
        style={[
          styles.emptyIconCircle,
          { backgroundColor: isDarkMode ? "#1e293b" : "#eef2ff" },
        ]}
      >
        <Ionicons name="rocket-outline" size={48} color={theme.tint} />
      </View>
      <Text style={[styles.emptyTitle, { color: theme.text }]}>
        {activeFilter !== "All"
          ? `No "${activeFilter}" goals`
          : "No Learning Tracks Yet"}
      </Text>
      <Text style={[styles.emptySub, { color: theme.subText }]}>
        {searchQuery
          ? `No results for "${searchQuery}"`
          : activeFilter !== "All"
            ? `Switch to "All" to see every goal.`
            : "Add your first learning goal above to get started!"}
      </Text>
      {(searchQuery || activeFilter !== "All") && (
        <Pressable
          onPress={() => {
            setSearchQuery("");
            setActiveFilter("All");
          }}
        >
          <Text style={[styles.clearLink, { color: theme.tint }]}>
            Clear filters
          </Text>
        </Pressable>
      )}
    </View>
  );

  // ── Main render ─────────────────────────────────────────────────────────────
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.background }}
      edges={["bottom", "left", "right"]}
    >
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={[styles.root, { paddingTop: insets.top }]}>
          {/* ── Page heading ───────────────────────────────────────────────── */}
          <View style={styles.titleRow}>
            <View>
              <Text style={[styles.title, { color: theme.text }]}>
                My Goals 🎯
              </Text>
              <Text style={[styles.subtitle, { color: theme.subText }]}>
                {goals.length} active learning{" "}
                {goals.length === 1 ? "track" : "tracks"}
              </Text>
            </View>
            <Ionicons name="analytics" size={30} color={theme.tint} />
          </View>

          {/* ── IMPROVEMENT 1: summary strip ──────────────────────────────── */}
          <View style={styles.summaryRow}>
            <View
              style={[
                styles.summaryCard,
                { backgroundColor: isDarkMode ? "#1e293b" : "#f8f7ff" },
              ]}
            >
              <Text style={[styles.summaryVal, { color: theme.text }]}>
                {summaryStats.total}
              </Text>
              <Text style={[styles.summaryLbl, { color: theme.subText }]}>
                Total
              </Text>
            </View>
            <View
              style={[
                styles.summaryCard,
                { backgroundColor: isDarkMode ? "#1e1b4b" : "#ede9fe" },
              ]}
            >
              <Text style={[styles.summaryVal, { color: theme.tint }]}>
                {summaryStats.inProgress}
              </Text>
              <Text style={[styles.summaryLbl, { color: theme.subText }]}>
                In Progress
              </Text>
            </View>
            <View
              style={[
                styles.summaryCard,
                { backgroundColor: isDarkMode ? "#052e16" : "#dcfce7" },
              ]}
            >
              <Text style={[styles.summaryVal, { color: "#22c55e" }]}>
                {summaryStats.done}
              </Text>
              <Text style={[styles.summaryLbl, { color: theme.subText }]}>
                Completed
              </Text>
            </View>
          </View>

          {/* ── Search bar ─────────────────────────────────────────────────── */}
          <View
            style={[
              styles.searchContainer,
              { backgroundColor: isDarkMode ? "#1e293b" : "#f1f5f9" },
            ]}
          >
            <Ionicons name="search-outline" size={18} color="#94a3b8" />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Search your skills..."
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && Platform.OS === "android" && (
              <Pressable onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={16} color="#94a3b8" />
              </Pressable>
            )}
          </View>

          {/* ── IMPROVEMENT 2: filter tabs ─────────────────────────────────── */}
          <View style={styles.filterRow}>
            {FILTER_TABS.map((tab) => {
              const isActive = activeFilter === tab;
              return (
                <Pressable
                  key={tab}
                  onPress={() => setActiveFilter(tab)}
                  style={[
                    styles.filterBtn,
                    {
                      backgroundColor: isActive
                        ? theme.tint
                        : isDarkMode
                          ? "#1e293b"
                          : "#f1f5f9",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.filterBtnText,
                      { color: isActive ? "#fff" : theme.subText },
                    ]}
                  >
                    {tab}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* ── Add / Edit input ───────────────────────────────────────────── */}
          <View
            style={[
              styles.inputWrapper,
              { backgroundColor: theme.card, shadowColor: theme.tint },
            ]}
          >
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder={
                editingId ? "Update your goal..." : "e.g. Master React Native"
              }
              placeholderTextColor={isDarkMode ? "#94a3b8" : "#64748b"}
              value={goalInput}
              onChangeText={setGoalInput}
              onSubmitEditing={handleSave}
              returnKeyType="done"
            />
            {editingId && (
              <Pressable
                style={styles.cancelBtn}
                onPress={() => {
                  setEditingId(null);
                  setGoalInput("");
                }}
              >
                <Ionicons name="close" size={18} color={theme.subText} />
              </Pressable>
            )}
            <Pressable
              style={[
                styles.addButton,
                { backgroundColor: editingId ? "#0ea5e9" : theme.tint },
              ]}
              onPress={handleSave}
            >
              <Ionicons
                name={editingId ? "checkmark" : "add"}
                size={22}
                color="white"
              />
            </Pressable>
          </View>

          {/* ── Goals list ─────────────────────────────────────────────────── */}
          <FlatList
            data={processedGoals}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={renderEmptyState}
            renderItem={renderGoalItem}
            showsVerticalScrollIndicator={false}
            // IMPROVEMENT 6: fix excessive bottom padding (was 350)
            contentContainerStyle={{
              paddingBottom: insets.bottom + 80,
              paddingTop: 4,
            }}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: 20,
  },

  // ── Header ──────────────────────────────────────────────────────────────────
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: "500",
    marginTop: 2,
  },

  // ── IMPROVEMENT 1: summary strip ────────────────────────────────────────────
  summaryRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  summaryCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 14,
  },
  summaryVal: {
    fontSize: 18,
    fontWeight: "800",
  },
  summaryLbl: {
    fontSize: 10,
    fontWeight: "500",
    marginTop: 2,
  },

  // ── Search ───────────────────────────────────────────────────────────────────
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    height: 46,
    borderRadius: 14,
    marginBottom: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },

  // ── IMPROVEMENT 2: filter tabs ───────────────────────────────────────────────
  filterRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 12,
  },
  filterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  filterBtnText: {
    fontSize: 11,
    fontWeight: "600",
  },

  // ── Input ────────────────────────────────────────────────────────────────────
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    padding: 7,
    borderRadius: 20,
    elevation: 6,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    marginBottom: 14,
  },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    height: 46,
    fontSize: 15,
    fontWeight: "600",
  },
  cancelBtn: {
    padding: 8,
    marginRight: 4,
  },
  addButton: {
    width: 46,
    height: 46,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },

  // ── Goal card ────────────────────────────────────────────────────────────────
  card: {
    flexDirection: "row",
    borderRadius: 20,
    marginBottom: 12,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
  },
  // IMPROVEMENT 3: left accent bar
  cardAccent: {
    width: 4,
  },
  cardBody: {
    flex: 1,
    padding: 16,
  },
  // IMPROVEMENT 8: title on its own full-width row
  goalTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 2,
  },
  dateText: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  // IMPROVEMENT 4: task count with hint
  taskCountText: {
    fontSize: 11,
    fontWeight: "500",
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  progressBg: {
    flex: 1,
    height: 7,
    borderRadius: 10,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 10,
  },
  progressPct: {
    fontSize: 12,
    fontWeight: "800",
    width: 36,
    textAlign: "right",
  },
  actionGroup: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    borderLeftWidth: 1,
  },
  actionIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  // ── Empty state ──────────────────────────────────────────────────────────────
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 60,
    paddingHorizontal: 36,
  },
  emptyIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
  },
  emptySub: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
    lineHeight: 21,
  },
  clearLink: {
    marginTop: 14,
    fontWeight: "700",
    fontSize: 14,
    textDecorationLine: "underline",
  },
});
