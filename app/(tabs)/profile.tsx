import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import { get, ref } from "firebase/database";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { auth, db } from "../../config/firebase";

// ✅ SAFE AREA IMPORT
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

export default function Profile() {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const insets = useSafeAreaInsets(); // 🔥 SAFE AREA

  const fetchData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const snapshot = await get(ref(db, `users/${user.uid}`));

      if (snapshot.exists()) {
        setUserData(snapshot.val());
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    router.replace("/(auth)/login");
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  const name = userData?.name || "User";
  const xp = userData?.xp || 0;
  const streak = userData?.streak || 0;
  const level = Math.floor(xp / 100) + 1;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <LinearGradient
        colors={["#0f172a", "#1e3a8a"]}
        style={{
          flex: 1,
          paddingTop: insets.top + 5, // 🔥 MAIN FIX
        }}
      >
        <StatusBar barStyle="light-content" />

        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.header}>Profile</Text>

          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{name[0]}</Text>
          </View>

          <Text style={styles.name}>{name}</Text>
          <Text style={styles.email}>{auth.currentUser?.email}</Text>

          <View style={styles.stats}>
            <View style={styles.box}>
              <Text>{xp}</Text>
              <Text>XP</Text>
            </View>

            <View style={styles.box}>
              <Text>{streak}</Text>
              <Text>Streak</Text>
            </View>

            <View style={styles.box}>
              <Text>{level}</Text>
              <Text>Level</Text>
            </View>
          </View>

          <Pressable style={styles.logout} onPress={handleLogout}>
            <Text style={{ color: "#fff" }}>Logout</Text>
          </Pressable>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

// 🎨 STYLES (UNCHANGED)
const styles = StyleSheet.create({
  container: { alignItems: "center", padding: 20 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: { color: "#fff", fontSize: 24, marginBottom: 20 },

  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#f59e0b",
    justifyContent: "center",
    alignItems: "center",
  },

  avatarText: { fontSize: 40, color: "#fff" },

  name: { color: "#fff", fontSize: 20, marginTop: 10 },
  email: { color: "#aaa" },

  stats: { flexDirection: "row", marginTop: 20 },

  box: {
    backgroundColor: "#fff",
    margin: 10,
    padding: 15,
    borderRadius: 10,
  },

  logout: {
    marginTop: 30,
    backgroundColor: "red",
    padding: 15,
    borderRadius: 10,
  },
});
