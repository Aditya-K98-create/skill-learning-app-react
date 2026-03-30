import { push, ref } from "firebase/database";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { db } from "../../config/firebase";

export default function UploadCourse() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreateCourse = async () => {
    if (!title || !description) {
      alert("Please fill all fields");
      return;
    }

    try {
      setLoading(true);

      const newCourse = {
        title: title,
        description: description,
        createdAt: new Date().toISOString(),
      };

      // Upload to Firebase Realtime Database
      await push(ref(db, "courses"), newCourse);

      alert("Course Created Successfully");

      setTitle("");
      setDescription("");
    } catch (error) {
      console.log(error);
      alert("Error creating course");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Course</Text>

      <TextInput
        placeholder="Course Title"
        style={styles.input}
        value={title}
        onChangeText={setTitle}
      />

      <TextInput
        placeholder="Course Description"
        style={styles.input}
        value={description}
        onChangeText={setDescription}
        multiline
      />

      <Pressable style={styles.button} onPress={handleCreateCourse}>
        <Text style={styles.buttonText}>
          {loading ? "Uploading..." : "Create Course"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 25,
    backgroundColor: "#f5f7ff",
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
    backgroundColor: "white",
  },

  button: {
    backgroundColor: "#34c759",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },

  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});
