import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

export default function UploadCourse() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleCreateCourse = () => {
    if (!title || !description) {
      alert("Please fill all fields");
      return;
    }

    const course = {
      title,
      description,
    };

    console.log("New Course:", course);

    alert("Course Created Successfully");

    setTitle("");
    setDescription("");
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
      />

      <Pressable style={styles.button} onPress={handleCreateCourse}>
        <Text style={styles.buttonText}>Create Course</Text>
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
  },
});
