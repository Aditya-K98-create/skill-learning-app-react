import { getAuth, onAuthStateChanged } from "firebase/auth";
import { get, onValue, push, ref, remove, update } from "firebase/database";
import { createContext, useContext, useEffect, useState } from "react";
import { db } from "../../config/firebase";

export const GoalContext = createContext<any>(null);

export const GoalProvider = ({ children }: any) => {
  const [goals, setGoals] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  const auth = getAuth();

  // ✅ AUTH LISTENER
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
        setGoals([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // 🔥 FETCH GOALS
  useEffect(() => {
    if (!userId) return;

    const goalsRef = ref(db, `goals/${userId}`);

    const unsubscribe = onValue(goalsRef, (snapshot) => {
      const data = snapshot.val();

      if (data) {
        const goalsArray = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setGoals(goalsArray);
      } else {
        setGoals([]);
      }
    });

    return () => unsubscribe();
  }, [userId]);

  // ================= GOAL =================

  const addGoal = async (title: string) => {
    if (!userId) return;

    const goalsRef = ref(db, `goals/${userId}`);

    await push(goalsRef, {
      title,
      tasks: [],
      createdAt: Date.now(),
    });
  };

  const deleteGoal = async (id: string) => {
    try {
      const user = auth.currentUser;

      if (!user) {
        console.log("❌ No user found");
        return;
      }

      const goalRef = ref(db, `goals/${user.uid}/${id}`);

      await remove(goalRef);

      console.log("✅ Goal deleted:", id);
    } catch (error) {
      console.log("❌ Delete Error:", error);
    }
  };

  const updateGoal = async (id: string, newTitle: string) => {
    if (!userId) return;

    const goalRef = ref(db, `goals/${userId}/${id}`);
    await update(goalRef, { title: newTitle });
  };

  // ================= TASK =================

  const addTask = async (goalId: string, taskTitle: string) => {
    if (!userId) return;

    const goal = goals.find((g) => g.id === goalId);
    const tasks = goal?.tasks || [];

    const updatedTasks = [
      ...tasks,
      {
        id: Date.now().toString(),
        title: taskTitle,
        completed: false,
        completedAt: null,
      },
    ];

    const goalRef = ref(db, `goals/${userId}/${goalId}`);
    await update(goalRef, { tasks: updatedTasks });
  };

  // ✏️ UPDATE TASK
  const updateTask = async (
    goalId: string,
    taskId: string,
    newTitle: string,
  ) => {
    if (!userId) return;

    const goal = goals.find((g) => g.id === goalId);
    const tasks = goal?.tasks || [];

    const updatedTasks = tasks.map((t: any) =>
      t.id === taskId ? { ...t, title: newTitle } : t,
    );

    const goalRef = ref(db, `goals/${userId}/${goalId}`);
    await update(goalRef, { tasks: updatedTasks });
  };

  // ❌ DELETE TASK
  const deleteTask = async (goalId: string, taskId: string) => {
    if (!userId) return;

    const goal = goals.find((g) => g.id === goalId);
    const tasks = goal?.tasks || [];

    const updatedTasks = tasks.filter((t: any) => t.id !== taskId);

    const goalRef = ref(db, `goals/${userId}/${goalId}`);
    await update(goalRef, { tasks: updatedTasks });
  };

  // ✅ TOGGLE TASK + XP + STREAK
  const toggleTask = async (goalId: string, taskId: string) => {
    if (!userId) return;

    const goal = goals.find((g) => g.id === goalId);
    const tasks = goal?.tasks || [];

    let xpToAdd = 0;

    const updatedTasks = tasks.map((task: any) => {
      if (task.id === taskId) {
        const newCompleted = !task.completed;

        if (newCompleted && !task.completed) {
          xpToAdd = 10;
        }

        return {
          ...task,
          completed: newCompleted,
          completedAt: newCompleted ? Date.now() : null,
        };
      }
      return task;
    });

    const goalRef = ref(db, `goals/${userId}/${goalId}`);
    await update(goalRef, { tasks: updatedTasks });

    // 🔥 XP + STREAK
    if (xpToAdd > 0) {
      const userRef = ref(db, `users/${userId}`);

      const snapshot = await get(userRef);
      const userData = snapshot.val() || {};

      const currentXP = userData.xp || 0;

      const today = new Date().toDateString();
      let newStreak = userData.streak || 0;

      if (userData.lastCompletedDate !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        if (userData.lastCompletedDate === yesterday.toDateString()) {
          newStreak += 1;
        } else {
          newStreak = 1;
        }
      }

      await update(userRef, {
        xp: currentXP + xpToAdd,
        streak: newStreak,
        lastCompletedDate: today,
      });
    }
  };

  return (
    <GoalContext.Provider
      value={{
        goals,
        addGoal,
        deleteGoal,
        updateGoal,
        addTask,
        updateTask,
        deleteTask,
        toggleTask,
      }}
    >
      {children}
    </GoalContext.Provider>
  );
};

export const useGoals = () => useContext(GoalContext);
