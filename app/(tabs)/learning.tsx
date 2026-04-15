import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import { ResizeMode, Video, VideoFullscreenUpdate } from "expo-av";
import * as ScreenOrientation from "expo-screen-orientation";
import { getAuth } from "firebase/auth";
import { get, ref, update } from "firebase/database";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "../../config/firebase";
import { useTheme } from "../../context/ThemeContext";

const { width, height } = Dimensions.get("window");

interface VideoItem {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  completed: boolean;
  liked: boolean;
  progress: number;
  currentTime: number;
  duration: string;
  category: string;
  catColor: string;
}

export default function Learning() {
  const videoRef = useRef<Video>(null);
  const isFocused = useIsFocused();
  const { theme, isDarkMode } = useTheme();

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const xpAnim = useRef(new Animated.Value(0)).current;
  const [videoLoading, setVideoLoading] = useState(true);
  const [showXP, setShowXP] = useState(false);

  const [videos, setVideos] = useState<VideoItem[]>([
    {
      id: "1",
      title: "ReactJS Tutorial",
      url: "https://firebasestorage.googleapis.com/v0/b/skill-learning-app-1bd69.firebasestorage.app/o/react.mp4?alt=media&token=ddbd95ae-ee64-4ca7-a8fe-20b92559914a",
      thumbnail:
        "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800",
      completed: false,
      liked: false,
      progress: 0,
      currentTime: 0,
      duration: "2h 25m 43sec",
      category: "Frontend",
      catColor: "#3b82f6",
    },
    {
      id: "2",
      title: "Git & Github Tutorial",
      url: "https://firebasestorage.googleapis.com/v0/b/skill-learning-app-1bd69.firebasestorage.app/o/git.mp4?alt=media&token=5d4d666e-53fb-4ff8-8b10-843c6e445dd0",
      thumbnail:
        "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=800",
      completed: false,
      liked: false,
      progress: 0,
      currentTime: 0,
      duration: "1h 14m 16sec",
      category: "Tools",
      catColor: "#10b981",
    },
    {
      id: "3",
      title: "ML Course",
      url: "https://firebasestorage.googleapis.com/v0/b/skill-learning-app-1bd69.firebasestorage.app/o/ml.mp4?alt=media&token=fe916b48-2ede-492e-a7f5-66e5e4a69e04",
      thumbnail:
        "https://images.unsplash.com/photo-1527477321055-430197a5f3ad?w=800",
      completed: false,
      liked: false,
      progress: 0,
      currentTime: 0,
      duration: "1h 30m 48sec",
      category: "AI/ML",
      catColor: "#a855f7",
    },
  ]);

  const [currentVideo, setCurrentVideo] = useState<VideoItem>(videos[0]);

  const switchVideo = (video: VideoItem) => {
    if (video.id === currentVideo.id) return;

    setVideoLoading(true);

    setCurrentVideo({
      ...video,
      progress: video.completed ? 100 : 0,
      currentTime: video.completed ? 0 : video.currentTime,
    });
  };

  const onFullscreenUpdate = async ({ fullscreenUpdate }: any) => {
    try {
      if (fullscreenUpdate === VideoFullscreenUpdate.PLAYER_WILL_PRESENT) {
        await ScreenOrientation.lockAsync(
          ScreenOrientation.OrientationLock.LANDSCAPE_LEFT,
        );
      } else if (
        fullscreenUpdate === VideoFullscreenUpdate.PLAYER_WILL_DISMISS
      ) {
        await ScreenOrientation.lockAsync(
          ScreenOrientation.OrientationLock.PORTRAIT_UP,
        );
      }
    } catch (e) {
      console.log("Orientation Error:", e);
    }
  };

  useEffect(() => {
    if (!isFocused && videoRef.current) {
      videoRef.current.pauseAsync();
    }
    return () => {
      ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT_UP,
      );
    };
  }, [isFocused]);

  const handlePlaybackStatus = (status: any) => {
    if (!status.isLoaded) return;
    if (status.isPlaying) setVideoLoading(false);

    if (status.durationMillis > 0 && status.positionMillis > 0) {
      const calculatedProgress =
        (status.positionMillis / status.durationMillis) * 100;

      setVideos((prev) =>
        prev.map((v) =>
          v.id === currentVideo.id
            ? {
                ...v,
                progress: calculatedProgress >= 99 ? 100 : calculatedProgress,
                currentTime: status.positionMillis,
              }
            : v,
        ),
      );

      setCurrentVideo((prev) => ({
        ...prev,
        progress: calculatedProgress >= 99 ? 100 : calculatedProgress,
        currentTime: status.positionMillis,
      }));
    }
  };

  const triggerXPMessage = () => {
    setShowXP(true);
    xpAnim.setValue(0);
    Animated.sequence([
      Animated.timing(xpAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.delay(1200),
      Animated.timing(xpAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => setShowXP(false));
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
    const found = updatedVideos.find((v) => v.id === id);
    if (found) setCurrentVideo(found);

    if (!alreadyCompleted) {
      triggerXPMessage();
      const user = getAuth().currentUser;
      if (user) {
        const userRef = ref(db, `users/${user.uid}`);
        const snapshot = await get(userRef);
        const data = snapshot.val() || {};
        await update(userRef, { xp: (data.xp || 0) + 20 });
      }
    }
  };

  const handleNextLesson = () => {
    const currentIndex = videos.findIndex((v) => v.id === currentVideo.id);
    if (currentIndex < videos.length - 1) {
      switchVideo(videos[currentIndex + 1]);
    }
  };

  const animateButton = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
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

  const toggleLike = (id: string) => {
    animateButton();
    setVideos((prev) =>
      prev.map((v) => (v.id === id ? { ...v, liked: !v.liked } : v)),
    );
    if (currentVideo.id === id)
      setCurrentVideo((prev) => ({ ...prev, liked: !prev.liked }));
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

      {showXP && (
        <Animated.View
          style={[
            styles.xpPopup,
            {
              opacity: xpAnim,
              transform: [
                {
                  translateY: xpAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, -20],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.xpPopupText}>+20 XP 🎉</Text>
        </Animated.View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View style={[styles.playerContainer, { backgroundColor: theme.card }]}>
          <View style={styles.videoWrapper}>
            <Video
              ref={videoRef}
              source={{ uri: currentVideo.url }}
              style={styles.video}
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
              onPlaybackStatusUpdate={handlePlaybackStatus}
              onFullscreenUpdate={onFullscreenUpdate}
              onLoadStart={() => setVideoLoading(true)}
              onLoad={() => setVideoLoading(false)}
              posterSource={{ uri: currentVideo.thumbnail }}
              usePoster={true}
              posterStyle={styles.video}
            />
            {videoLoading && (
              <View style={styles.loaderOverlay}>
                <ActivityIndicator size="large" color={theme.tint} />
              </View>
            )}
          </View>

          <View style={styles.videoDetails}>
            <View style={styles.metaRow}>
              <View
                style={[
                  styles.catTag,
                  { backgroundColor: currentVideo.catColor + "20" },
                ]}
              >
                <Text
                  style={[styles.catText, { color: currentVideo.catColor }]}
                >
                  {currentVideo.category}
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
              <View style={styles.progressLabelRow}>
                <Text
                  style={[styles.progressPercent, { color: theme.subText }]}
                >
                  {Math.round(currentVideo.progress)}% Watched
                </Text>
                {currentVideo.completed && (
                  <Text style={styles.xpBadge}>Completed 🎉</Text>
                )}
              </View>
            </View>

            <View style={styles.actionRow}>
              <Animated.View
                style={{ flex: 1, transform: [{ scale: scaleAnim }] }}
              >
                <Pressable
                  style={[
                    styles.mainActionBtn,
                    currentVideo.completed
                      ? styles.completedBtn
                      : { backgroundColor: theme.tint },
                  ]}
                  onPress={
                    currentVideo.progress > 0 && !currentVideo.completed
                      ? () =>
                          videoRef.current?.playFromPositionAsync(
                            currentVideo.currentTime,
                          )
                      : () => markCompleted(currentVideo.id)
                  }
                >
                  <Ionicons
                    name={
                      currentVideo.completed
                        ? "checkmark-done"
                        : currentVideo.progress > 0
                          ? "play"
                          : "checkmark"
                    }
                    size={20}
                    color="#fff"
                  />
                  <Text style={styles.btnText}>
                    {currentVideo.completed
                      ? "Finished"
                      : currentVideo.progress > 0
                        ? "Continue Watching"
                        : "Mark Finished"}
                  </Text>
                </Pressable>
              </Animated.View>

              <Animated.View
                style={{
                  flex: 0.2,
                  marginLeft: 10,
                  transform: [{ scale: scaleAnim }],
                }}
              >
                <Pressable
                  style={[
                    styles.likeBtn,
                    {
                      backgroundColor: currentVideo.liked
                        ? "#ef4444"
                        : "#94a3b8",
                    },
                  ]}
                  onPress={() => toggleLike(currentVideo.id)}
                >
                  <Ionicons
                    name={currentVideo.liked ? "heart" : "heart-outline"}
                    size={24}
                    color="#fff"
                  />
                </Pressable>
              </Animated.View>
            </View>

            {currentVideo.completed &&
              videos.findIndex((v) => v.id === currentVideo.id) <
                videos.length - 1 && (
                <Pressable style={styles.nextBtn} onPress={handleNextLesson}>
                  <Text style={styles.nextBtnText}>➡️ Next Lesson</Text>
                </Pressable>
              )}
          </View>
        </View>

        <View style={styles.listSection}>
          <View style={styles.listHeaderRow}>
            <Text style={[styles.listHeader, { color: theme.text }]}>
              Course Journey
            </Text>
            <Text style={{ color: theme.subText, fontSize: 12 }}>
              3 Lessons
            </Text>
          </View>

          {videos.map((video, index) => (
            <Pressable
              key={video.id}
              style={[
                styles.lessonCard,
                {
                  backgroundColor: theme.card,
                  borderColor:
                    currentVideo.id === video.id ? theme.tint : "transparent",
                  borderWidth: 1,
                },
              ]}
              onPress={() => switchVideo(video)}
            >
              <View style={styles.lessonInfo}>
                <View style={styles.indexCircle}>
                  <Text style={{ color: theme.subText, fontWeight: "bold" }}>
                    {index + 1}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.lessonTitle, { color: theme.text }]}
                    numberOfLines={1}
                  >
                    {video.title}
                  </Text>
                  <Text style={[styles.lessonMeta, { color: theme.subText }]}>
                    {video.duration} • {video.category}
                  </Text>
                </View>
                {video.completed ? (
                  <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
                ) : (
                  video.progress > 0 && (
                    <View
                      style={[
                        styles.miniProgress,
                        { backgroundColor: theme.tint + "30" },
                      ]}
                    >
                      <Text
                        style={{
                          color: theme.tint,
                          fontSize: 10,
                          fontWeight: "bold",
                        }}
                      >
                        {Math.round(video.progress)}%
                      </Text>
                    </View>
                  )
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
  xpPopup: {
    position: "absolute",
    top: height / 2.5,
    alignSelf: "center",
    backgroundColor: "#22c55e",
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 30,
    elevation: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    zIndex: 9999,
  },
  xpPopupText: { color: "#ffffff", fontWeight: "bold", fontSize: 18 },
  playerContainer: {
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 20,
    overflow: "hidden",
  },
  videoWrapper: {
    width: width,
    height: width * 0.56,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  video: { width: "100%", height: "100%" },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  videoDetails: { padding: 16 },
  metaRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  catTag: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 10,
  },
  catText: { fontSize: 11, fontWeight: "800", textTransform: "uppercase" },
  durationText: { fontSize: 12 },
  currentTitle: { fontSize: 20, fontWeight: "800", marginBottom: 4 },
  progressSection: { marginTop: 10 },
  progressBg: { height: 6, borderRadius: 10 },
  progressFill: { height: "100%", borderRadius: 10 },
  progressLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  progressPercent: { fontSize: 11, fontWeight: "700" },
  xpBadge: { color: "#22c55e", fontWeight: "bold", fontSize: 12 },
  actionRow: { flexDirection: "row", marginTop: 16, alignItems: "center" },
  mainActionBtn: {
    flex: 1,
    flexDirection: "row",
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
  },
  completedBtn: { backgroundColor: "#22c55e" },
  likeBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
  },
  btnText: { color: "#fff", fontWeight: "800", fontSize: 14, marginLeft: 8 },
  nextBtn: {
    marginTop: 12,
    backgroundColor: "#f1f5f9",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  nextBtnText: { color: "#1e293b", fontWeight: "bold" },
  listSection: { padding: 20 },
  listHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  listHeader: { fontSize: 18, fontWeight: "800" },
  lessonCard: { borderRadius: 16, padding: 14, marginBottom: 10 },
  lessonInfo: { flexDirection: "row", alignItems: "center", gap: 12 },
  indexCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  lessonTitle: { fontSize: 15, fontWeight: "700" },
  lessonMeta: { fontSize: 11, marginTop: 2 },
  miniProgress: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
});
