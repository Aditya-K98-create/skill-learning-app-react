import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import { ResizeMode, Video } from "expo-av";
import { getAuth } from "firebase/auth";
import { get, ref, update } from "firebase/database";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { db } from "../../config/firebase";
import { useTheme } from "../../context/ThemeContext";

const { width } = Dimensions.get("window");

export default function Learning() {
  const videoRef = useRef<Video>(null);
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const { theme, isDarkMode } = useTheme();

  const scaleAnim = useRef(new Animated.Value(1)).current;

  const [videos, setVideos] = useState([
    {
      id: "1",
      title: "ReactJS Tutorial",
      url: "https://firebasestorage.googleapis.com/v0/b/skill-learning-app-1bd69.firebasestorage.app/o/react.mp4?alt=media&token=ddbd95ae-ee64-4ca7-a8fe-20b92559914a",
      completed: false,
      liked: false,
      progress: 0,
      duration: "20 min",
      level: "Beginner",
    },
    {
      id: "2",
      title: "Git & Github Tutorial",
      url: "https://firebasestorage.googleapis.com/v0/b/skill-learning-app-1bd69.firebasestorage.app/o/git.mp4?alt=media&token=5d4d666e-53fb-4ff8-8b10-843c6e445dd0",
      completed: false,
      liked: false,
      progress: 0,
      duration: "15 min",
      level: "Intermediate",
    },
    {
      id: "3",
      title: "ML Course",
      url: "https://firebasestorage.googleapis.com/v0/b/skill-learning-app-1bd69.firebasestorage.app/o/ml.mp4?alt=media&token=fe916b48-2ede-492e-a7f5-66e5e4a69e04",
      completed: false,
      liked: false,
      progress: 0,
      duration: "45 min",
      level: "Advanced",
    },
  ]);

  const [currentVideo, setCurrentVideo] = useState(videos[0]);

  // STOP VIDEO ON PAGE CHANGE
  useEffect(() => {
    if (!isFocused && videoRef.current) {
      videoRef.current.pauseAsync();
    }
  }, [isFocused]);

  const animateButton = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePlaybackStatus = (status: any) => {
    if (!status.isLoaded) return;
    const progress = (status.positionMillis / status.durationMillis) * 100;
    if (progress > currentVideo.progress) {
      setVideos((prev) =>
        prev.map((v) => (v.id === currentVideo.id ? { ...v, progress } : v)),
      );
    }
  };

  const toggleLike = (id: string) => {
    animateButton();
    setVideos((prev) =>
      prev.map((v) => (v.id === id ? { ...v, liked: !v.liked } : v)),
    );
    if (currentVideo.id === id) {
      setCurrentVideo((prev) => ({ ...prev, liked: !prev.liked }));
    }
  };

  const markCompleted = async (id: string) => {
    animateButton();
    let alreadyCompleted = false;

    const updatedVideos = videos.map((v) => {
      if (v.id === id) {
        if (v.completed) alreadyCompleted = true;
        return { ...v, completed: true, progress: 100 };
      }
      return v;
    });

    setVideos(updatedVideos);
    setCurrentVideo(updatedVideos.find((v) => v.id === id) || updatedVideos[0]);

    if (!alreadyCompleted) {
      const rewardXp = 50;
      const user = getAuth().currentUser;
      if (user) {
        const userRef = ref(db, `users/${user.uid}`);
        const snapshot = await get(userRef);
        const data = snapshot.val() || {};
        await update(userRef, { xp: (data.xp || 0) + rewardXp });
      }
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View style={[styles.playerContainer, { backgroundColor: theme.card }]}>
          <Video
            ref={videoRef}
            source={{ uri: currentVideo.url }}
            style={styles.video}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            onPlaybackStatusUpdate={handlePlaybackStatus}
          />
          <View style={styles.videoDetails}>
            <View style={styles.tagRow}>
              <View
                style={[
                  styles.levelTag,
                  { backgroundColor: isDarkMode ? "#312e81" : "#e0e7ff" },
                ]}
              >
                <Text style={[styles.levelText, { color: theme.tint }]}>
                  {currentVideo.level}
                </Text>
              </View>
              <Text style={[styles.durationText, { color: theme.subText }]}>
                <Ionicons name="time-outline" size={14} />{" "}
                {currentVideo.duration}
              </Text>
            </View>

            <Text style={[styles.currentTitle, { color: theme.text }]}>
              {currentVideo.title}
            </Text>

            {/* PROGRESS BAR */}
            <View style={styles.progressSection}>
              <View
                style={[
                  styles.progressBg,
                  { backgroundColor: isDarkMode ? "#334155" : "#f1f5f9" },
                ]}
              >
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${currentVideo.progress}%`,
                      backgroundColor: theme.tint,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.progressPercent, { color: theme.subText }]}>
                {currentVideo.completed
                  ? "Lesson Completed ✅"
                  : `${Math.round(currentVideo.progress)}% Watched`}
              </Text>
            </View>

            <View style={styles.actionRow}>
              <Animated.View
                style={{ flex: 3, transform: [{ scale: scaleAnim }] }}
              >
                <Pressable
                  style={[
                    styles.actionBtn,
                    currentVideo.completed
                      ? styles.completedBtn
                      : { backgroundColor: theme.tint },
                  ]}
                  onPress={() => markCompleted(currentVideo.id)}
                >
                  <Ionicons
                    name={
                      currentVideo.completed
                        ? "checkmark-circle"
                        : "checkmark-circle-outline"
                    }
                    size={20}
                    color="#fff"
                  />
                  <Text style={styles.btnText}>
                    {currentVideo.completed
                      ? "Lesson Completed"
                      : "Mark as Finished"}
                  </Text>
                </Pressable>
              </Animated.View>

              <Animated.View
                style={{
                  flex: 1,
                  marginLeft: 10,
                  transform: [{ scale: scaleAnim }],
                }}
              >
                <Pressable
                  style={[
                    styles.actionBtn,
                    currentVideo.liked ? styles.likedBtn : styles.likeBtn,
                  ]}
                  onPress={() => toggleLike(currentVideo.id)}
                >
                  <Ionicons
                    name={currentVideo.liked ? "heart" : "heart-outline"}
                    size={22}
                    color="#fff"
                  />
                </Pressable>
              </Animated.View>
            </View>
          </View>
        </View>

        <View style={styles.listSection}>
          <Text style={[styles.listHeader, { color: theme.text }]}>
            Course Journey
          </Text>
          {videos.map((video) => (
            <Pressable
              key={video.id}
              style={[
                styles.lessonCard,
                {
                  backgroundColor: theme.card,
                  borderColor: isDarkMode ? "#334155" : "transparent",
                },
                currentVideo.id === video.id && {
                  borderColor: theme.tint,
                  backgroundColor: isDarkMode ? "#1e293b" : "#f5f3ff",
                },
              ]}
              onPress={() => setCurrentVideo(video)}
            >
              <View style={styles.lessonInfo}>
                <View style={styles.iconContainer}>
                  {video.completed ? (
                    <Ionicons
                      name="checkmark-circle"
                      size={26}
                      color="#22c55e"
                    />
                  ) : (
                    <Ionicons name="play-circle" size={26} color={theme.tint} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.lessonTitle, { color: theme.text }]}>
                    {video.title}
                  </Text>
                  <Text style={[styles.lessonMeta, { color: theme.subText }]}>
                    {video.duration} • {video.level}
                  </Text>
                </View>
                {video.liked && (
                  <Ionicons
                    name="heart"
                    size={16}
                    color="#ef4444"
                    style={{ marginRight: 8 }}
                  />
                )}
                {video.progress > 0 && !video.completed && (
                  <View
                    style={[
                      styles.continueIndicator,
                      { backgroundColor: theme.tint },
                    ]}
                  >
                    <Text style={styles.continueText}>
                      {Math.round(video.progress)}%
                    </Text>
                  </View>
                )}
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  playerContainer: {
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 15,
    overflow: "hidden",
  },
  video: {
    width: width,
    height: width * 0.56,
    backgroundColor: "#000",
  },
  videoDetails: {
    padding: 20,
  },
  tagRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  levelTag: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 10,
  },
  levelText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  durationText: {
    fontSize: 12,
  },
  currentTitle: {
    fontSize: 22,
    fontWeight: "bold",
  },
  progressSection: {
    marginTop: 15,
  },
  progressBg: {
    height: 8,
    borderRadius: 10,
  },
  progressFill: {
    height: "100%",
    borderRadius: 10,
  },
  progressPercent: {
    fontSize: 12,
    marginTop: 8,
    fontWeight: "700",
  },
  actionRow: {
    flexDirection: "row",
    marginTop: 20,
    alignItems: "center",
  },
  actionBtn: {
    flexDirection: "row",
    height: 50,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
  },
  completedBtn: {
    backgroundColor: "#22c55e",
  },
  likeBtn: {
    backgroundColor: "#94a3b8",
  },
  likedBtn: {
    backgroundColor: "#ef4444",
  },
  btnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
    marginLeft: 8,
  },
  listSection: {
    padding: 20,
  },
  listHeader: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 18,
  },
  lessonCard: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
    borderWidth: 2,
    elevation: 2,
  },
  lessonInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  iconContainer: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  lessonTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  lessonMeta: {
    fontSize: 12,
    marginTop: 4,
  },
  continueIndicator: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  continueText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
  },
});
