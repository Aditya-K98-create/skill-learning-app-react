import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { ref, set } from "firebase/database";
import { useRef, useState } from "react";
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
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { auth, db } from "../../config/firebase";
import { useTheme } from "../../context/ThemeContext";

export default function Register() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme, isDarkMode } = useTheme();

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState(""); // 🟢 Added Confirm Password State
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleRegister = async () => {
    if (
      !name.trim() ||
      !email.trim() ||
      !password.trim() ||
      !confirmPassword.trim()
    ) {
      alert("Please fill all fields ✍️");
      return;
    }
    // 🟢 Validation: Check if passwords match
    if (password !== confirmPassword) {
      alert("Passwords do not match! ❌");
      return;
    }
    if (password.length < 6) {
      alert("Password should be at least 6 characters");
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

      router.replace("/dashboard");
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const bgColors = isDarkMode
    ? (["#0f172a", "#1e3a8a"] as const)
    : (["#e0e7ff", "#c7d2fe"] as const);

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: isDarkMode ? "#0f172a" : "#e0e7ff" }}
    >
      <LinearGradient colors={bgColors} style={{ flex: 1 }}>
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            contentContainerStyle={[
              styles.container,
              { paddingTop: insets.top + 20 },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.headerSection}>
              <Text
                style={[
                  styles.title,
                  { color: isDarkMode ? "#fff" : "#1e293b" },
                ]}
              >
                Start Learning 🚀
              </Text>
              <Text
                style={[
                  styles.subtitle,
                  { color: isDarkMode ? "#cbd5f5" : "#64748b" },
                ]}
              >
                Create your account to track progress
              </Text>
            </View>

            <View style={[styles.card, { backgroundColor: theme.card }]}>
              {/* NAME */}
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: isDarkMode ? theme.background : "#f8fafc",
                  },
                  focusedField === "name" && {
                    borderColor: theme.tint,
                    borderWidth: 2,
                  },
                ]}
              >
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={focusedField === "name" ? theme.tint : "#94a3b8"}
                  style={styles.icon}
                />
                <TextInput
                  placeholder="Full Name"
                  placeholderTextColor="#94a3b8"
                  style={[
                    styles.input,
                    { color: theme.text },
                    Platform.OS === "web" && ({ outlineStyle: "none" } as any),
                  ]}
                  value={name}
                  onChangeText={setName}
                  onFocus={() => setFocusedField("name")}
                  onBlur={() => setFocusedField(null)}
                  returnKeyType="next"
                  onSubmitEditing={() => emailRef.current?.focus()}
                />
              </View>

              {/* EMAIL */}
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: isDarkMode ? theme.background : "#f8fafc",
                  },
                  focusedField === "email" && {
                    borderColor: theme.tint,
                    borderWidth: 2,
                  },
                ]}
              >
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={focusedField === "email" ? theme.tint : "#94a3b8"}
                  style={styles.icon}
                />
                <TextInput
                  ref={emailRef}
                  placeholder="Email Address"
                  placeholderTextColor="#94a3b8"
                  style={[
                    styles.input,
                    { color: theme.text },
                    Platform.OS === "web" && ({ outlineStyle: "none" } as any),
                  ]}
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                />
              </View>

              {/* PASSWORD */}
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: isDarkMode ? theme.background : "#f8fafc",
                  },
                  focusedField === "password" && {
                    borderColor: theme.tint,
                    borderWidth: 2,
                  },
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={focusedField === "password" ? theme.tint : "#94a3b8"}
                  style={styles.icon}
                />
                <TextInput
                  ref={passwordRef}
                  placeholder="Create Password"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry={!showPassword}
                  style={[
                    styles.input,
                    { color: theme.text },
                    Platform.OS === "web" && ({ outlineStyle: "none" } as any),
                  ]}
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  returnKeyType="next"
                  onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                />
              </View>

              {/* 🟢 CONFIRM PASSWORD COLUMN */}
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: isDarkMode ? theme.background : "#f8fafc",
                  },
                  focusedField === "confirm" && {
                    borderColor: theme.tint,
                    borderWidth: 2,
                  },
                ]}
              >
                <Ionicons
                  name="shield-checkmark-outline"
                  size={20}
                  color={focusedField === "confirm" ? theme.tint : "#94a3b8"}
                  style={styles.icon}
                />
                <TextInput
                  ref={confirmPasswordRef}
                  placeholder="Confirm Password"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry={!showPassword}
                  style={[
                    styles.input,
                    { color: theme.text },
                    Platform.OS === "web" && ({ outlineStyle: "none" } as any),
                  ]}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  onFocus={() => setFocusedField("confirm")}
                  onBlur={() => setFocusedField(null)}
                  returnKeyType="done"
                  onSubmitEditing={handleRegister}
                />
              </View>

              <Pressable
                onPress={handleRegister}
                disabled={loading}
                style={({ pressed }) => [
                  styles.button,
                  { backgroundColor: theme.tint, opacity: loading ? 0.7 : 1 },
                  { transform: [{ scale: pressed ? 0.98 : 1 }] },
                ]}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.buttonText}>Start Learning 🚀</Text>
                )}
              </Pressable>
            </View>

            <Pressable onPress={() => router.push("/login")}>
              <Text
                style={[
                  styles.link,
                  { color: isDarkMode ? "#fff" : theme.tint },
                ]}
              >
                Already a learner?{" "}
                <Text style={{ fontWeight: "bold" }}>Login</Text>
              </Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, justifyContent: "center", flexGrow: 1 },
  headerSection: { marginBottom: 25, alignItems: "center" },
  title: { fontSize: 32, fontWeight: "800" },
  subtitle: { marginTop: 8, fontSize: 16, fontWeight: "500" },
  card: {
    padding: 24,
    borderRadius: 30,
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "transparent",
    paddingHorizontal: 15,
    height: 60,
  },
  icon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, fontWeight: "500" },
  button: {
    height: 60,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: { color: "white", fontWeight: "bold", fontSize: 18 },
  link: { textAlign: "center", marginTop: 30, fontSize: 15 },
});
