import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useGoals } from "../../components/context/GoalContext";

// ✅ SAFE AREA IMPORT
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

export default function Goals() {
  const { goals, addGoal, deleteGoal, updateGoal } = useGoals();

  const [goal, setGoal] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const router = useRouter();

  // ✅ SAFE AREA HOOK
  const insets = useSafeAreaInsets();

  // ✅ ADD / UPDATE
  const handleSave = async () => {
    if (!goal.trim()) {
      Alert.alert("⚠️", "Please enter a goal");
      return;
    }

    try {
      if (editingId) {
        await updateGoal(editingId, goal.trim());
        setEditingId(null);
      } else {
        await addGoal(goal.trim());
      }

      setGoal("");
    } catch (err) {
      console.log("Save Error:", err);
      Alert.alert("Error", "Something went wrong");
    }
  };

  // ❌ DELETE
  const confirmDelete = (id: string) => {
    Alert.alert(
      "🗑 Delete Goal",
      "Are you sure you want to delete this goal?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              if (!id) {
                Alert.alert("Error", "Invalid Goal ID");
                return;
              }

              await deleteGoal(id);
              Alert.alert("✅ Deleted", "Goal removed successfully");
            } catch (err) {
              console.log("Delete Error:", err);
              Alert.alert("Error", "Delete failed");
            }
          },
        },
      ],
    );
  };

  // ✏️ EDIT
  const handleEdit = (item: any) => {
    setGoal(item.title);
    setEditingId(item.id);
  };

  return (
    // ✅ SAFE AREA WRAPPER
    <SafeAreaView style={{ flex: 1 }}>
      <View
        style={[
          styles.container,
          {
            paddingTop: insets.top + 5, // 🔥 FIX FOR NOTCH
          },
        ]}
      >
        {/* HEADER */}
        <Text style={styles.title}>🎯 My Learning Goals</Text>
        <Text style={styles.subtitle}>
          Build discipline. Track progress. Win daily 🚀
        </Text>

        {/* INPUT CARD */}
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Enter your goal..."
            value={goal}
            onChangeText={setGoal}
          />

          <Pressable style={styles.addButton} onPress={handleSave}>
            <Text style={styles.addButtonText}>
              {editingId ? "UPDATE" : "ADD"}
            </Text>
          </Pressable>
        </View>

        {/* LIST */}
        <FlatList
          data={goals}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<Text style={styles.empty}>🚀 No goals yet</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              {/* TITLE */}
              <Pressable
                style={{ flex: 1 }}
                onPress={() => router.push(`/goal/${item.id}`)}
              >
                <Text style={styles.goalTitle}>
                  {item.title || "Untitled Goal"}
                </Text>
              </Pressable>

              {/* EDIT */}
              <Pressable
                style={styles.iconBtn}
                onPress={() => handleEdit(item)}
              >
                <Text style={styles.edit}>✏️</Text>
              </Pressable>

              {/* DELETE */}
              <Pressable
                style={styles.deleteBtn}
                onPress={() => confirmDelete(item.id)}
              >
                <Text style={styles.delete}>🗑</Text>
              </Pressable>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

// 🎨 STYLES (UNCHANGED)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#eef2ff",
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#0f172a",
  },

  subtitle: {
    color: "#64748b",
    marginBottom: 20,
  },

  inputWrapper: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 6,
    borderRadius: 14,
    elevation: 4,
    marginBottom: 20,
  },

  input: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
  },

  addButton: {
    backgroundColor: "#6366f1",
    paddingHorizontal: 20,
    justifyContent: "center",
    borderRadius: 10,
  },

  addButtonText: {
    color: "white",
    fontWeight: "bold",
  },

  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    elevation: 4,
  },

  goalTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
  },

  iconBtn: {
    padding: 6,
  },

  deleteBtn: {
    backgroundColor: "#fee2e2",
    padding: 6,
    borderRadius: 8,
  },

  edit: {
    fontSize: 18,
    marginHorizontal: 8,
  },

  delete: {
    fontSize: 18,
    color: "#dc2626",
  },

  empty: {
    textAlign: "center",
    marginTop: 60,
    color: "#64748b",
    fontSize: 16,
  },
});
