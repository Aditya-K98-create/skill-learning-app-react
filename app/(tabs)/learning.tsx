import { Video } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { getAuth } from "firebase/auth";
import { get, ref, update } from "firebase/database";
import { db } from "../../config/firebase";

// ✅ SAFE AREA IMPORT
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

export default function Learning() {
  const videoRef = useRef<any>(null);

  const insets = useSafeAreaInsets(); // 🔥 SAFE AREA

  const [videos, setVideos] = useState([
    {
      id: "1",
      title: "ReactJS Tutorial",
      source: require("../../assets/Videos/react.mp4"),
      completed: false,
      liked: false,
      progress: 0,
    },
    {
      id: "2",
      title: "Git & Github Tutorial",
      source: require("../../assets/Videos/git.mp4"),
      completed: false,
      liked: false,
      progress: 0,
    },
    {
      id: "3",
      title: "ML Course",
      source: require("../../assets/Videos/ml.mp4"),
      completed: false,
      liked: false,
      progress: 0,
    },
  ]);

  const [currentVideo, setCurrentVideo] = useState(videos[0]);

  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(1);

  // 🎥 TRACK PROGRESS
  const handlePlaybackStatus = (status: any) => {
    if (!status.isLoaded) return;

    const progress = (status.positionMillis / status.durationMillis) * 100;

    setVideos((prev) =>
      prev.map((v) => (v.id === currentVideo.id ? { ...v, progress } : v)),
    );
  };

  // ▶ RESUME
  useEffect(() => {
    if (videoRef.current && currentVideo.progress > 0) {
      videoRef.current.setPositionAsync((currentVideo.progress / 100) * 60000);
    }
  }, [currentVideo]);

  // ❤️ LIKE
  const toggleLike = (id: string) => {
    setVideos((prev) =>
      prev.map((v) => (v.id === id ? { ...v, liked: !v.liked } : v)),
    );
  };

  // ✅ COMPLETE + XP
  const markCompleted = async (id: string) => {
    let alreadyCompleted = false;

    setVideos((prev) =>
      prev.map((v) => {
        if (v.id === id) {
          if (v.completed) alreadyCompleted = true;
          return { ...v, completed: true };
        }
        return v;
      }),
    );

    if (!alreadyCompleted) {
      setXp((prev) => prev + 50);
      setStreak((prev) => prev + 1);

      const user = getAuth().currentUser;
      if (user) {
        const userRef = ref(db, `users/${user.uid}`);
        const snapshot = await get(userRef);
        const data = snapshot.val() || {};

        await update(userRef, {
          xp: (data.xp || 0) + 50,
        });
      }
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <LinearGradient
        colors={["#0f172a", "#1e3a8a"]}
        style={{
          flex: 1,
          paddingTop: insets.top, // 🔥 FIX NOTCH
        }}
      >
        <StatusBar barStyle="light-content" />

        <ScrollView style={styles.container}>
          <Text style={styles.title}>🎓 Learning Hub</Text>

          {/* VIDEO */}
          <View style={styles.videoCard}>
            <Video
              ref={videoRef}
              source={currentVideo.source}
              style={styles.video}
              useNativeControls
              resizeMode="contain"
              onPlaybackStatusUpdate={handlePlaybackStatus}
            />

            {/* PROGRESS */}
            <View style={styles.progressBg}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${currentVideo.progress || 0}%` },
                ]}
              />
            </View>

            <Text style={styles.progressText}>
              {Math.round(currentVideo.progress || 0)}% watched
            </Text>

            {/* BUTTONS */}
            <View style={styles.actions}>
              <Pressable
                style={styles.completeBtn}
                onPress={() => markCompleted(currentVideo.id)}
              >
                <Text style={styles.btnText}>✅ Complete</Text>
              </Pressable>

              <Pressable
                style={styles.likeBtn}
                onPress={() => toggleLike(currentVideo.id)}
              >
                <Text style={styles.btnText}>
                  {currentVideo.liked ? "❤️ Liked" : "🤍 Like"}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* LIST */}
          {videos.map((video) => (
            <Pressable
              key={video.id}
              style={styles.lessonCard}
              onPress={() => setCurrentVideo(video)}
            >
              <View>
                <Text style={styles.lessonTitle}>
                  {video.completed ? "🟢" : "▶"} {video.title}
                </Text>
                <Text style={styles.lessonSub}>
                  {Math.round(video.progress || 0)}% watched
                </Text>
              </View>

              {video.liked && <Text style={{ fontSize: 18 }}>❤️</Text>}
            </Pressable>
          ))}
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

// 🎨 STYLES (UNCHANGED)
const styles = StyleSheet.create({
  container: { padding: 16 },

  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 20,
  },

  videoCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    marginBottom: 20,
  },

  video: {
    width: "100%",
    height: 200,
    borderRadius: 12,
  },

  progressBg: {
    height: 6,
    backgroundColor: "#ddd",
    borderRadius: 10,
    marginTop: 10,
  },

  progressFill: {
    height: "100%",
    backgroundColor: "#22c55e",
    borderRadius: 10,
  },

  progressText: {
    textAlign: "center",
    marginTop: 5,
    color: "#555",
  },

  actions: {
    flexDirection: "row",
    marginTop: 10,
  },

  completeBtn: {
    backgroundColor: "#22c55e",
    padding: 10,
    borderRadius: 10,
    flex: 1,
    marginRight: 5,
    alignItems: "center",
  },

  likeBtn: {
    backgroundColor: "#f43f5e",
    padding: 10,
    borderRadius: 10,
    flex: 1,
    marginLeft: 5,
    alignItems: "center",
  },

  btnText: {
    color: "#fff",
    fontWeight: "bold",
  },

  lessonCard: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  lessonTitle: {
    fontWeight: "600",
  },

  lessonSub: {
    fontSize: 12,
    color: "gray",
  },
});
