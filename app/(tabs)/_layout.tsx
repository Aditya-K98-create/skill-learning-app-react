import { FontAwesome5, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { theme, isDarkMode } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.tint,
        tabBarInactiveTintColor: isDarkMode ? "#94a3b8" : "#64748b",

        tabBarStyle: {
          position: "absolute",
          backgroundColor: theme.card,

          bottom: insets.bottom > 0 ? insets.bottom : 15,
          marginHorizontal: 15,
          borderRadius: 20,

          height: 65,
          paddingTop: 8,
          paddingBottom: 8,
          borderTopWidth: 0,

          elevation: 10,
          shadowColor: isDarkMode ? "#000" : "#475569",
          shadowOpacity: 0.15,
          shadowOffset: { width: 0, height: -4 },
          shadowRadius: 10,

          ...Platform.select({
            web: {
              boxShadow: isDarkMode
                ? "0px -4px 20px rgba(0,0,0,0.5)"
                : "0px -4px 20px rgba(0,0,0,0.1)",
            } as any,
          }),

          borderTopColor: isDarkMode ? "rgba(255,255,255,0.05)" : "transparent",
        },

        tabBarLabelStyle: {
          fontSize: 11,
          marginBottom: 4,
          fontWeight: "700",
        },

        tabBarItemStyle: {
          justifyContent: "center",
          alignItems: "center",
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="goals"
        options={{
          title: "Goals",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="flag" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="learning"
        options={{
          title: "Learn",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="leaderboard"
        options={{
          title: "Rank",
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="trophy" size={size - 4} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Me",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="goal/[goalId]"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
