import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "../components/context/AuthContext";
import { GoalProvider } from "../components/context/GoalContext";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <GoalProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </GoalProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
