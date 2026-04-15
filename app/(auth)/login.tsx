import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { get, ref } from "firebase/database";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Image as RNImage,
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

export default function Login() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme, isDarkMode } = useTheme();
  const passwordRef = useRef<TextInput>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const [userName, setUserName] = useState("");
  const [userStreak, setUserStreak] = useState<number | null>(null);
  const [userLevel, setUserLevel] = useState<number | null>(null);

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const snapshot = await get(ref(db, `users/${user.uid}`));
          if (snapshot.exists()) {
            const data = snapshot.val();
            setUserName(data.name || "");
            setUserStreak(data.streak ?? null);
            setUserLevel(
              data.xp != null ? Math.floor(data.xp / 100) + 1 : null,
            );
          }
          router.replace("/dashboard");
        } catch (e) {
          console.error("Auth state error:", e);
        }
      }
    });
    return unsubscribe;
  }, []);

  const validate = () => {
    let valid = true;
    setEmailError("");
    setPasswordError("");
    if (!email.trim()) {
      setEmailError("Email is required");
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError("Enter a valid email address");
      valid = false;
    }
    if (!password.trim()) {
      setPasswordError("Password is required");
      valid = false;
    }
    return valid;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email.trim(), password);
      router.replace("/dashboard");
    } catch (error: any) {
      if (
        error.code === "auth/invalid-credential" ||
        error.code === "auth/wrong-password" ||
        error.code === "auth/user-not-found"
      ) {
        setPasswordError("Invalid email or password");
      } else {
        setPasswordError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setEmailError("Enter your email above first");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      Alert.alert(
        "Reset email sent",
        `Check ${email} for a password reset link.`,
      );
    } catch (e: any) {
      setEmailError(e.message);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom", "left", "right"]}>
      <StatusBar barStyle="light-content" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <LinearGradient
            colors={["#6C63FF", "#4ECDC4"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.hero, { paddingTop: insets.top + 24 }]}
          >
            <View style={styles.logoContainer}>
              <RNImage
                source={require("../../assets/icon.png")}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            <Text style={styles.heroTitle}>
              {userName ? `Welcome back, ${userName} ` : "Welcome back "}
            </Text>
            <Text style={styles.heroSub}>Continue your learning journey</Text>

            {(userStreak !== null || userLevel !== null) && (
              <View style={styles.pillsRow}>
                {userStreak !== null && (
                  <View style={styles.pill}>
                    <Text style={styles.pillText}>
                      🔥 {userStreak} day streak
                    </Text>
                  </View>
                )}
                {userLevel !== null && (
                  <View style={styles.pill}>
                    <Text style={styles.pillText}>🏆 Level {userLevel}</Text>
                  </View>
                )}
              </View>
            )}
          </LinearGradient>

          <View style={[styles.card, { backgroundColor: theme.card }]}>
            <View
              style={[
                styles.inputWrapper,
                { backgroundColor: isDarkMode ? theme.background : "#f8fafc" },
                focusedField === "email" && styles.inputFocused,
                !!emailError && styles.inputError,
              ]}
            >
              <Ionicons
                name="mail-outline"
                size={18}
                color={
                  emailError
                    ? "#ef4444"
                    : focusedField === "email"
                      ? theme.tint
                      : "#94a3b8"
                }
                style={styles.icon}
              />
              <TextInput
                placeholder="Email address"
                placeholderTextColor="#94a3b8"
                style={[styles.input, { color: theme.text }]}
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
                  if (emailError) setEmailError("");
                }}
                autoCapitalize="none"
                keyboardType="email-address"
                onFocus={() => setFocusedField("email")}
                onBlur={() => setFocusedField(null)}
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
              />
            </View>
            {!!emailError && (
              <Text style={styles.fieldError}>✗ {emailError}</Text>
            )}

            <View
              style={[
                styles.inputWrapper,
                { backgroundColor: isDarkMode ? theme.background : "#f8fafc" },
                focusedField === "password" && styles.inputFocused,
                !!passwordError && styles.inputError,
              ]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={18}
                color={
                  passwordError
                    ? "#ef4444"
                    : focusedField === "password"
                      ? theme.tint
                      : "#94a3b8"
                }
                style={styles.icon}
              />
              <TextInput
                ref={passwordRef}
                placeholder="Password"
                placeholderTextColor="#94a3b8"
                secureTextEntry={!showPassword}
                style={[styles.input, { color: theme.text }]}
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  if (passwordError) setPasswordError("");
                }}
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField(null)}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
                hitSlop={8}
              >
                <Ionicons
                  name={showPassword ? "eye-outline" : "eye-off-outline"}
                  size={18}
                  color="#64748b"
                />
              </Pressable>
            </View>
            {!!passwordError && (
              <Text style={styles.fieldError}>✗ {passwordError}</Text>
            )}

            <Pressable
              onPress={handleForgotPassword}
              style={styles.forgotRow}
              hitSlop={8}
            >
              <Text style={[styles.forgotText, { color: theme.tint }]}>
                Forgot password?
              </Text>
            </Pressable>

            <Pressable
              onPress={handleLogin}
              disabled={loading}
              style={({ pressed }) => [
                styles.button,
                { backgroundColor: theme.tint },
                { opacity: loading ? 0.75 : 1 },
                { transform: [{ scale: pressed ? 0.97 : 1 }] },
              ]}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>Sign in →</Text>
              )}
            </Pressable>

            <View style={styles.dividerRow}>
              <View style={styles.line} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.line} />
            </View>

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

          <Pressable
            onPress={() => router.push("/register")}
            style={styles.switchRow}
          >
            <Text style={[styles.switchText, { color: theme.subText }]}>
              New here?{" "}
              <Text style={[styles.switchLink, { color: theme.tint }]}>
                Create free account
              </Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    alignItems: "center",
  },

  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.45)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
    overflow: "hidden",
  },

  logo: { width: 68, height: 68 },
  heroTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#fff",
    textAlign: "center",
    letterSpacing: -0.3,
  },
  heroSub: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    marginTop: 4,
    textAlign: "center",
    marginBottom: 12,
  },

  pillsRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  pill: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  pillText: {
    fontSize: 11,
    color: "#fff",
    fontWeight: "600",
  },

  card: {
    margin: 20,
    padding: 22,
    borderRadius: 28,
    elevation: 8,
    shadowColor: "#6C63FF",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
  },

  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    marginBottom: 4,
    borderWidth: 1.5,
    borderColor: "transparent",
    paddingHorizontal: 14,
    height: 54,
  },
  inputFocused: { borderColor: "#6C63FF" },
  inputError: { borderColor: "#ef4444" },
  icon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, fontWeight: "500" },
  eyeBtn: { padding: 6 },

  fieldError: {
    fontSize: 11,
    color: "#ef4444",
    marginBottom: 8,
    marginLeft: 4,
  },

  forgotRow: { alignSelf: "flex-end", marginBottom: 14, marginTop: 4 },
  forgotText: { fontSize: 12, fontWeight: "600" },

  button: {
    height: 54,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
  },
  buttonText: { color: "white", fontWeight: "800", fontSize: 16 },

  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  line: { flex: 1, height: 1, backgroundColor: "#e2e8f0" },
  dividerText: {
    marginHorizontal: 12,
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "700",
  },

  socialBtn: {
    flexDirection: "row",
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    gap: 10,
  },
  socialText: { fontWeight: "700", color: "#1e293b", fontSize: 14 },
  switchRow: { alignItems: "center", marginBottom: 32 },
  switchText: { fontSize: 14 },
  switchLink: { fontWeight: "700" },
});
