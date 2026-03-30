import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Animated,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useGoals } from "../../../components/context/GoalContext";

export default function GoalDetails() {
  const { goalId } = useLocalSearchParams();
  const { goals, addTask, toggleTask, deleteTask, updateTask } = useGoals();

  const [task, setTask] = useState("");
  const [editingTask, setEditingTask] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  // 🎉 XP POPUP STATE
  const [xpVisible, setXpVisible] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];

  const goal = goals.find((g) => g.id === goalId);

  if (!goal) {
    return (
      <View style={styles.center}>
        <Text>Loading goal...</Text>
      </View>
    );
  }

  const tasks = Array.isArray(goal.tasks) ? goal.tasks : [];

  // ➕ ADD TASK
  const handleAddTask = async () => {
    if (!task.trim()) return;

    await addTask(goal.id, task);
    setTask("");
  };

  // ❌ DELETE TASK
  const handleDelete = (taskId: string) => {
    Alert.alert("Delete Task", "Are you sure?", [
      { text: "Cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteTask(goal.id, taskId);
        },
      },
    ]);
  };

  // ✏️ EDIT
  const openEdit = (item: any) => {
    setEditingTask(item);
    setNewTitle(item.title);
    setModalVisible(true);
  };

  // ✅ UPDATE TASK
  const handleUpdate = async () => {
    if (!newTitle.trim()) return;

    await updateTask(goal.id, editingTask.id, newTitle);
    setModalVisible(false);
  };

  // 🎉 SHOW XP ANIMATION (NO LOGIC CHANGE)
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

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <Text style={styles.title}>📘 {goal.title}</Text>
      <Text style={styles.subtitle}>Complete tasks and earn XP 🚀</Text>

      {/* INPUT */}
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          placeholder="Add new task..."
          value={task}
          onChangeText={setTask}
        />

        <Pressable style={styles.addBtn} onPress={handleAddTask}>
          <Text style={styles.addText}>ADD</Text>
        </Pressable>
      </View>

      {/* TASK LIST */}
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<Text style={styles.empty}>🚀 No tasks yet</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            {/* ✅ COMPLETE BUTTON */}
            <Pressable
              style={[styles.checkBox, item.completed && styles.checkedBox]}
              onPress={() => {
                toggleTask(goal.id, item.id); // 🔥 ORIGINAL LOGIC
                if (!item.completed) showXP(); // 🎉 ONLY UI ADD
              }}
            >
              {item.completed && <Text style={styles.tick}>✓</Text>}
            </Pressable>

            {/* TASK TEXT */}
            <Text
              style={[styles.taskText, item.completed && styles.completedText]}
            >
              {item.title}
            </Text>

            {/* EDIT */}
            <Pressable onPress={() => openEdit(item)}>
              <Text style={styles.edit}>✏️</Text>
            </Pressable>

            {/* DELETE */}
            <Pressable onPress={() => handleDelete(item.id)}>
              <Text style={styles.delete}>🗑</Text>
            </Pressable>
          </View>
        )}
      />

      {/* 🎉 XP POPUP */}
      {xpVisible && (
        <Animated.View
          style={[
            styles.xpPopup,
            {
              opacity: fadeAnim,
              transform: [
                {
                  scale: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.xpText}>+10 XP 🎉</Text>
        </Animated.View>
      )}

      {/* MODAL */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Edit Task</Text>

            <TextInput
              style={styles.input}
              value={newTitle}
              onChangeText={setNewTitle}
            />

            <Pressable style={styles.addBtn} onPress={handleUpdate}>
              <Text style={styles.addText}>UPDATE</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// 🎨 STYLES
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#eef2ff",
  },

  title: {
    fontSize: 26,
    fontWeight: "bold",
  },

  subtitle: {
    marginBottom: 20,
    color: "#64748b",
  },

  inputWrapper: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 6,
    borderRadius: 14,
    marginBottom: 20,
  },

  input: {
    flex: 1,
    padding: 12,
  },

  addBtn: {
    backgroundColor: "#6366f1",
    paddingHorizontal: 20,
    justifyContent: "center",
    borderRadius: 10,
  },

  addText: {
    color: "white",
    fontWeight: "bold",
  },

  card: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },

  checkBox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: "#ccc",
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  checkedBox: {
    backgroundColor: "#22c55e",
    borderColor: "#22c55e",
  },

  tick: {
    color: "white",
    fontWeight: "bold",
  },

  taskText: {
    flex: 1,
  },

  completedText: {
    textDecorationLine: "line-through",
    color: "#9ca3af",
  },

  edit: {
    marginHorizontal: 8,
  },

  delete: {
    color: "#ef4444",
  },

  empty: {
    textAlign: "center",
    marginTop: 40,
  },

  // 🎉 XP POPUP STYLE
  xpPopup: {
    position: "absolute",
    top: "40%",
    alignSelf: "center",
    backgroundColor: "#22c55e",
    padding: 20,
    borderRadius: 20,
    elevation: 10,
  },

  xpText: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },

  modalBg: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },

  modal: {
    backgroundColor: "white",
    margin: 20,
    padding: 20,
    borderRadius: 16,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
