import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function AdminDashboard() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin Dashboard</Text>

      <Pressable
        style={styles.button}
        onPress={() => router.push("/upload-course")}
      >
        <Text style={styles.buttonText}>Upload Course</Text>
      </Pressable>

      <Pressable
        style={styles.button}
        onPress={() => router.push("/upload-video")}
      >
        <Text style={styles.buttonText}>Upload Video</Text>
      </Pressable>

      <Pressable style={styles.button} onPress={() => router.push("/users")}>
        <Text style={styles.buttonText}>View Users</Text>
      </Pressable>

      <Pressable style={styles.button} onPress={() => router.push("/progress")}>
        <Text style={styles.buttonText}>Track Progress</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 30,
    backgroundColor: "#f5f7ff",
  },

  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 30,
  },

  button: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },

  buttonText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
});
