import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) return;

  const { status } = await Notifications.requestPermissionsAsync();

  if (status !== "granted") return;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
    });
  }
}

export async function scheduleSmartNotification(message: string) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Skill Coach 🤖",
      body: message,
    },
    trigger: {
      seconds: 5,
    },
  });
}
