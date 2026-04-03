import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
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
import { auth } from "../../config/firebase";
import { useTheme } from "../../context/ThemeContext";

export default function Login() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme, isDarkMode } = useTheme();

  // Refs for auto-focusing the next field
  const passwordRef = useRef<TextInput>(null);

  // States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      alert("Please enter both email and password");
      return;
    }

    if (!email.includes("@")) {
      alert("Please enter a valid email address");
      return;
    }

    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email.trim(), password);
      router.replace("/dashboard");
    } catch (error: any) {
      if (error.code === "auth/invalid-credential") {
        alert("Invalid email or password ❌");
      } else {
        alert(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Background colors based on theme (Typed as const for TypeScript)
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
            {/* HEADER */}
            <View style={styles.headerSection}>
              <Text
                style={[
                  styles.title,
                  { color: isDarkMode ? "#fff" : "#1e293b" },
                ]}
              >
                Continue Learning 🚀
              </Text>
              <Text
                style={[
                  styles.subtitle,
                  { color: isDarkMode ? "#cbd5f5" : "#64748b" },
                ]}
              >
                Welcome back, Aditya 👋
              </Text>
            </View>

            {/* LOGIN CARD */}
            <View style={[styles.card, { backgroundColor: theme.card }]}>
              {/* EMAIL INPUT */}
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
                  placeholder="Email"
                  placeholderTextColor="#94a3b8"
                  style={[
                    styles.input,
                    { color: theme.text },
                    Platform.OS === "web" && ({ outlineStyle: "none" } as any),
                  ]}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                />
              </View>

              {/* PASSWORD INPUT */}
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
                  placeholder="Password"
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
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                <Pressable
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color="#64748b"
                  />
                </Pressable>
              </View>

              {/* LOGIN BUTTON */}
              <Pressable
                onPress={handleLogin}
                disabled={loading || !email || !password}
                style={({ pressed }) => [
                  styles.button,
                  {
                    backgroundColor: theme.tint,
                    opacity: loading || !email || !password ? 0.6 : 1,
                  },
                  { transform: [{ scale: pressed ? 0.96 : 1 }] },
                ]}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.buttonText}>Continue Learning</Text>
                )}
              </Pressable>

              <View style={styles.dividerRow}>
                <View style={styles.line} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.line} />
              </View>

              {/* SOCIAL LOGIN */}
              <Pressable
                style={({ pressed }) => [
                  styles.socialBtn,
                  { transform: [{ scale: pressed ? 0.98 : 1 }] },
                ]}
              >
                <Ionicons name="logo-google" size={20} color="#ea4335" />
                <Text style={styles.socialText}>Continue with Google</Text>
              </Pressable>
            </View>

            {/* REGISTER LINK */}
            <Pressable onPress={() => router.push("/register")}>
              <Text
                style={[
                  styles.link,
                  { color: isDarkMode ? "#fff" : theme.tint },
                ]}
              >
                Don{"'"}t have an account?{" "}
                <Text style={{ fontWeight: "bold" }}>Sign Up</Text>
              </Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    justifyContent: "center",
    flexGrow: 1,
  },
  headerSection: {
    marginBottom: 30,
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    marginTop: 8,
    fontSize: 16,
    fontWeight: "500",
  },
  card: {
    padding: 24,
    borderRadius: 30,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
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
  icon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
  },
  eyeIcon: {
    padding: 10,
  },
  button: {
    height: 60,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    elevation: 5,
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 18,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 25,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#e2e8f0",
  },
  dividerText: {
    marginHorizontal: 15,
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "800",
  },
  socialBtn: {
    flexDirection: "row",
    height: 55,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    gap: 12,
  },
  socialText: {
    fontWeight: "700",
    color: "#1e293b",
    fontSize: 15,
  },
  link: {
    textAlign: "center",
    marginTop: 30,
    fontSize: 15,
  },
});
