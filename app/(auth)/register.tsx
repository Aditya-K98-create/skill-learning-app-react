import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { ref, set } from "firebase/database";
import { auth, db } from "../../config/firebase";

// ✅ SAFE AREA
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

// ✅ ICON
import { Ionicons } from "@expo/vector-icons";

export default function Register() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      alert("Please fill all fields");
      return;
    }

    try {
      setLoading(true);

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password.trim(),
      );

      const user = userCredential.user;

      await set(ref(db, `users/${user.uid}`), {
        name: name.trim(),
        email: email.trim(),
        xp: 0,
        streak: 0,
        createdAt: Date.now(),
      });

      alert("Account created successfully 🎉");
      router.replace("/login");
    } catch (error: any) {
      console.log("Register Error:", error);

      if (error.code === "auth/email-already-in-use") {
        alert("Email already registered");
      } else if (error.code === "auth/invalid-email") {
        alert("Invalid email format");
      } else if (error.code === "auth/weak-password") {
        alert("Password must be at least 6 characters");
      } else {
        alert("Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <LinearGradient
        colors={["#0f172a", "#1e3a8a"]}
        style={{
          flex: 1,
          paddingTop: insets.top + 5,
        }}
      >
        <StatusBar barStyle="light-content" />

        {/* 🔥 MAIN FIX */}
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "android" ? "height" : "padding"}
        >
          <ScrollView
            contentContainerStyle={styles.container}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* HEADER */}
            <Text style={styles.title}>🚀 Create Account</Text>
            <Text style={styles.subtitle}>Start your journey to success</Text>

            {/* CARD */}
            <View style={styles.card}>
              {/* NAME */}
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                placeholder="Enter your full name"
                placeholderTextColor="#94a3b8"
                style={styles.input}
                value={name}
                onChangeText={setName}
              />

              {/* EMAIL */}
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                placeholder="Enter your email"
                placeholderTextColor="#94a3b8"
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />

              {/* PASSWORD */}
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordWrapper}>
                <TextInput
                  placeholder="Create password"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry={!showPassword}
                  style={styles.passwordInput}
                  value={password}
                  onChangeText={setPassword}
                />

                <Pressable onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? "lock-open" : "lock-closed"}
                    size={20}
                    color="#64748b"
                    style={{ paddingHorizontal: 12 }}
                  />
                </Pressable>
              </View>

              {/* BUTTON */}
              <Pressable style={styles.button} onPress={handleRegister}>
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.buttonText}>Create Account</Text>
                )}
              </Pressable>
            </View>

            {/* LOGIN LINK */}
            <Pressable onPress={() => router.push("/login")}>
              <Text style={styles.link}>Already have an account? Login</Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

// 🎨 STYLES (UNCHANGED)
const styles = StyleSheet.create({
  container: {
    padding: 20,
    justifyContent: "center",
    flexGrow: 1,
  },

  title: {
    fontSize: 30,
    fontWeight: "bold",
    textAlign: "center",
    color: "#fff",
  },

  subtitle: {
    textAlign: "center",
    marginBottom: 25,
    color: "#cbd5f5",
  },

  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 18,
    elevation: 6,
  },

  label: {
    fontSize: 14,
    color: "#475569",
    marginBottom: 5,
  },

  input: {
    backgroundColor: "#f8fafc",
    padding: 14,
    borderRadius: 12,
    marginBottom: 15,
  },

  passwordWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    marginBottom: 15,
  },

  passwordInput: {
    flex: 1,
    padding: 14,
  },

  button: {
    backgroundColor: "#4f46e5",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },

  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },

  link: {
    textAlign: "center",
    marginTop: 20,
    color: "#fff",
  },
});
