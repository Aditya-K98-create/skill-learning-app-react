import { Ionicons } from "@expo/vector-icons";
import * as Google from "expo-auth-session/providers/google";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithCredential,
} from "firebase/auth";
import { ref, set } from "firebase/database";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
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

WebBrowser.maybeCompleteAuthSession();

const getPasswordStrength = (
  pwd: string,
): { score: number; label: string; color: string } => {
  if (!pwd) return { score: 0, label: "", color: "#e2e8f0" };
  let score = 0;
  if (pwd.length >= 6) score++;
  if (pwd.length >= 10) score++;
  if (/[A-Z]/.test(pwd) || /[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  const map = [
    { label: "", color: "#e2e8f0" },
    { label: "Weak", color: "#ef4444" },
    { label: "Fair", color: "#f59e0b" },
    { label: "Good", color: "#3b82f6" },
    { label: "Strong", color: "#22c55e" },
  ];
  return { score, ...map[score] };
};

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
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");

  const passwordStrength = getPasswordStrength(password);

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: "YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com",
    webClientId:
      "330483905839-m4af7183rlihlkre96tjr4o20hikc1vk.apps.googleusercontent.com",
  });

  useEffect(() => {
    if (response?.type === "success") {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      handleGoogleLogin(credential);
    }
  }, [response]);

  const handleGoogleLogin = async (credential: any) => {
    try {
      setLoading(true);
      const result = await signInWithCredential(auth, credential);
      const user = result.user;
      await set(ref(db, `users/${user.uid}`), {
        name: user.displayName || "Learner",
        email: user.email,
        xp: 0,
        streak: 0,
        createdAt: Date.now(),
      });
      router.replace("/dashboard");
    } catch (error: any) {
      setEmailError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const validate = (): boolean => {
    let valid = true;
    setNameError("");
    setEmailError("");
    setPasswordError("");
    setConfirmError("");

    if (!name.trim()) {
      setNameError("Name is required");
      valid = false;
    }
    if (!email.trim()) {
      setEmailError("Email is required");
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError("Enter a valid email address");
      valid = false;
    }
    if (!password) {
      setPasswordError("Password is required");
      valid = false;
    } else if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      valid = false;
    }
    if (!confirmPassword) {
      setConfirmError("Please confirm your password");
      valid = false;
    } else if (password !== confirmPassword) {
      setConfirmError("Passwords do not match");
      valid = false;
    }
    return valid;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    try {
      setLoading(true);
      const { user } = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password.trim(),
      );
      await set(ref(db, `users/${user.uid}`), {
        name: name.trim(),
        email: email.trim(),
        xp: 0,
        streak: 0,
        createdAt: Date.now(),
      });
      router.replace("/dashboard");
    } catch (error: any) {
      if (error.code === "auth/email-already-in-use") {
        setEmailError("An account with this email already exists");
      } else {
        setEmailError(error.message);
      }
    } finally {
      setLoading(false);
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
              <Image
                source={require("../../assets/icon.png")}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            <Text style={styles.heroTitle}>Join & start learning</Text>
            <Text style={styles.heroSub}>Track goals · Earn XP · Level up</Text>
          </LinearGradient>

          <View style={[styles.card, { backgroundColor: theme.card }]}>
            <View
              style={[
                styles.inputWrapper,
                { backgroundColor: isDarkMode ? theme.background : "#f8fafc" },
                focusedField === "name" && styles.inputFocused,
                !!nameError && styles.inputError,
              ]}
            >
              <Ionicons
                name="person-outline"
                size={18}
                color={
                  nameError
                    ? "#ef4444"
                    : focusedField === "name"
                      ? theme.tint
                      : "#94a3b8"
                }
                style={styles.icon}
              />
              <TextInput
                placeholder="Full name"
                placeholderTextColor="#94a3b8"
                style={[styles.input, { color: theme.text }]}
                value={name}
                onChangeText={(t) => {
                  setName(t);
                  if (nameError) setNameError("");
                }}
                onFocus={() => setFocusedField("name")}
                onBlur={() => setFocusedField(null)}
                returnKeyType="next"
                onSubmitEditing={() => emailRef.current?.focus()}
              />
            </View>
            {!!nameError && (
              <Text style={styles.fieldError}>✗ {nameError}</Text>
            )}

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
                ref={emailRef}
                placeholder="Email address"
                placeholderTextColor="#94a3b8"
                style={[styles.input, { color: theme.text }]}
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
                  if (emailError) setEmailError("");
                }}
                onFocus={() => setFocusedField("email")}
                onBlur={() => setFocusedField(null)}
                keyboardType="email-address"
                autoCapitalize="none"
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
                placeholder="Create password"
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
                returnKeyType="next"
                onSubmitEditing={() => confirmPasswordRef.current?.focus()}
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={8}
              >
                <Ionicons
                  name={showPassword ? "eye-outline" : "eye-off-outline"}
                  size={18}
                  color="#94a3b8"
                />
              </Pressable>
            </View>

            {password.length > 0 && (
              <View style={styles.strengthContainer}>
                <View style={styles.strengthBars}>
                  {[1, 2, 3, 4].map((seg) => (
                    <View
                      key={seg}
                      style={[
                        styles.strengthSeg,
                        {
                          backgroundColor:
                            passwordStrength.score >= seg
                              ? passwordStrength.color
                              : isDarkMode
                                ? "#334155"
                                : "#e2e8f0",
                        },
                      ]}
                    />
                  ))}
                </View>
                {passwordStrength.label !== "" && (
                  <Text
                    style={[
                      styles.strengthLabel,
                      { color: passwordStrength.color },
                    ]}
                  >
                    {passwordStrength.label}
                  </Text>
                )}
              </View>
            )}
            {!!passwordError && (
              <Text style={styles.fieldError}>✗ {passwordError}</Text>
            )}

            <View
              style={[
                styles.inputWrapper,
                { backgroundColor: isDarkMode ? theme.background : "#f8fafc" },
                focusedField === "confirm" && styles.inputFocused,
                !!confirmError && styles.inputError,
                confirmPassword.length > 0 &&
                  password === confirmPassword && {
                    borderColor: "#22c55e",
                    borderWidth: 1.5,
                  },
              ]}
            >
              <Ionicons
                name="shield-checkmark-outline"
                size={18}
                color={
                  confirmError
                    ? "#ef4444"
                    : confirmPassword && password === confirmPassword
                      ? "#22c55e"
                      : focusedField === "confirm"
                        ? theme.tint
                        : "#94a3b8"
                }
                style={styles.icon}
              />
              <TextInput
                ref={confirmPasswordRef}
                placeholder="Confirm password"
                placeholderTextColor="#94a3b8"
                secureTextEntry={!showPassword}
                style={[styles.input, { color: theme.text }]}
                value={confirmPassword}
                onChangeText={(t) => {
                  setConfirmPassword(t);
                  if (confirmError) setConfirmError("");
                }}
                onFocus={() => setFocusedField("confirm")}
                onBlur={() => setFocusedField(null)}
                returnKeyType="done"
                onSubmitEditing={handleRegister}
              />
              {confirmPassword.length > 0 && password === confirmPassword && (
                <Ionicons name="checkmark-circle" size={18} color="#22c55e" />
              )}
            </View>
            {!!confirmError && (
              <Text style={styles.fieldError}>✗ {confirmError}</Text>
            )}

            <Pressable
              onPress={handleRegister}
              disabled={loading}
              style={({ pressed }) => [
                styles.button,
                { backgroundColor: theme.tint, opacity: loading ? 0.75 : 1 },
                { transform: [{ scale: pressed ? 0.97 : 1 }] },
              ]}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>Create account →</Text>
              )}
            </Pressable>

            <View style={styles.dividerRow}>
              <View style={styles.line} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.line} />
            </View>

            <Pressable
              onPress={() => promptAsync()}
              disabled={!request || loading}
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
            onPress={() => router.push("/login")}
            style={styles.switchRow}
          >
            <Text style={[styles.switchText, { color: theme.subText }]}>
              Already have an account?{" "}
              <Text style={[styles.switchLink, { color: theme.tint }]}>
                Sign in
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
    color: "rgba(255,255,255,0.75)",
    marginTop: 5,
    textAlign: "center",
    fontWeight: "500",
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
    ...Platform.select({
      web: { boxShadow: "0px 8px 20px rgba(108, 99, 255, 0.12)" },
    }),
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

  fieldError: {
    fontSize: 11,
    color: "#ef4444",
    marginBottom: 8,
    marginLeft: 4,
  },

  strengthContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
    marginTop: 2,
  },
  strengthBars: {
    flex: 1,
    flexDirection: "row",
    gap: 4,
  },
  strengthSeg: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 10,
    fontWeight: "700",
    minWidth: 40,
    textAlign: "right",
  },

  button: {
    height: 54,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
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
