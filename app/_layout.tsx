import { Stack } from "expo-router";
import { LogBox } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "../components/context/AuthContext";
import { GoalProvider } from "../components/context/GoalContext";
import { ThemeProvider } from "../context/ThemeContext";

LogBox.ignoreLogs(["[expo-av]"]);
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <GoalProvider>
            <Stack
              screenOptions={{
                headerShown: false,
                animation: "fade",
              }}
            >
              <Stack.Screen name="index" />

              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            </Stack>
          </GoalProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
