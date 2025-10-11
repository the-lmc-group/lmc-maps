import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Animated,
  PanResponder,
} from "react-native";
import type { ImageSourcePropType } from "react-native";

let NP: any = null;
let hasNowPlaying = false;

const getNowPlaying = () => {
  if (NP !== null) return NP;
  try {
    NP = {};
    hasNowPlaying = false;
  } catch (e) {
    NP = {};
    hasNowPlaying = false;
  }
  return NP;
};

type ProviderStyle = { color: string; bg: string; logo?: ImageSourcePropType };

const PROVIDER_STYLES: Record<string, ProviderStyle> = {
  spotify: { color: "#1DB954", bg: "#0f2a24" },
  youtube: { color: "#FF0000", bg: "#2b0b0b" },
  deezer: { color: "#FF007E", bg: "#2b193c" },
  external: { color: "#007AFF", bg: "#222" },
  default: { color: "#007AFF", bg: "#ffffff" },
};

type Track = {
  id?: string;
  title: string;
  artist?: string;
  artwork?: string | ImageSourcePropType;
  duration?: number;
  provider?: string;
};

export default function MediaWidget({
  forceVisible = false,
}: {
  forceVisible?: boolean;
}) {
  const [loading, setLoading] = useState(true);
  const [track, setTrack] = useState<Track | null>(null);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [visible, setVisible] = useState(false);

  const progressX = useRef(new Animated.Value(0)).current;

  const fetchMetaFromTrackPlayer = async (trackId?: any) => {
    return null;
  };

  useEffect(() => {
    let stopped = false;
    try {
      const np = getNowPlaying();
      np.startObserving?.(
        (state: any) => {
          if (stopped) return;
          try {
            if (state && state.title) {
              setTrack({
                id: state.id || "external",
                title: state.title,
                artist: state.artist,
                artwork: state.artwork,
                provider: state.app || "external",
                duration: state.duration || 0,
              });
              setPlaying(Boolean(state.isPlaying));
              setDuration(state.duration || 0);
            }
          } catch (_) {}
        },
        "default"
      );
    } catch (e) {
    }

    let deSub: any = null;
    try {
      const { DeviceEventEmitter } = require('react-native');
      if (DeviceEventEmitter && DeviceEventEmitter.addListener) {
        deSub = DeviceEventEmitter.addListener('NOW_PLAYING', (payload: any) => {
          try {
            const data = typeof payload === 'string' ? JSON.parse(payload) : payload;
            if (data) {
              if (data.track && data.track.title) {
                setTrack({
                  id: data.track.id || 'external',
                  title: data.track.title,
                  artist: data.track.trackArtist || data.track.artist || '',
                  artwork: data.track.artwork || data.track.albumArt || undefined,
                  provider: 'external',
                  duration: data.track.duration || 0,
                });
                setPlaying(Boolean(data.isPlaying) || true);
                setDuration(data.track.duration || 0);
              } else if (data.title) {
                setTrack({
                  id: data.id || 'external',
                  title: data.title,
                  artist: data.artist,
                  artwork: data.artwork,
                  provider: data.app || 'external',
                  duration: data.duration || 0,
                });
                setPlaying(Boolean(data.isPlaying));
                setDuration(data.duration || 0);
              }
            }
          } catch (_) {}
        });
      }
    } catch (_) {}

    return () => {
      stopped = true;
      try {
        const np = getNowPlaying();
        np.stopObserving?.("default");
      } catch (_) {}
      try {
        if (deSub && typeof deSub.remove === 'function') deSub.remove();
      } catch (_) {}
    };
  }, []);

  useEffect(() => {
    if (duration > 0) {
      const frac = Math.max(0, Math.min(1, position / duration));
      Animated.timing(progressX, {
        toValue: frac,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  }, [position, duration]);

  useEffect(() => {
    const hasTrackTitle = !!(track && track.title?.trim().length > 0);
    const fallbackPlaying =
      (position && position > 0) || (duration && duration > 0);
    const newVisible = Boolean(hasTrackTitle && (playing || fallbackPlaying));
    setVisible(newVisible);
  }, [track, playing, position, duration]);

  const providerStyle = useMemo(() => {
    const p = (track?.provider || "default").toLowerCase();
    return PROVIDER_STYLES[p] || PROVIDER_STYLES.default;
  }, [track]);

  const togglePlay = async () => {
    try {
      const np = getNowPlaying();
      if (np && typeof np.toggle === "function") {
        await np.toggle();
      }
    } catch (_) {}
  };

  const skipNext = async () => {
    try {
      const np = getNowPlaying();
      if (np && typeof np.next === "function") {
        await np.next();
      }
    } catch (_) {}
  };

  const skipPrev = async () => {
    try {
      const np = getNowPlaying();
      if (np && typeof np.previous === "function") {
        await np.previous();
      }
    } catch (_) {}
  };

  const seekTo = async (sec: number) => {
    try {
      const np = getNowPlaying();
      if (np && typeof np.seekTo === "function") {
        await np.seekTo(sec);
      }
      setPosition(sec);
    } catch (_) {}
  };

  const barWidth = 160;
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gs) => {
        const x = Math.max(0, Math.min(barWidth, gs.dx));
        const frac = x / barWidth;
        const target = Math.round((duration || 0) * frac);
        progressX.setValue(frac);
        setPosition(target);
      },
      onPanResponderRelease: (_, gs) => {
        const x = Math.max(0, Math.min(barWidth, gs.dx));
        const frac = x / barWidth;
        const target = Math.round((duration || 0) * frac);
        seekTo(target);
      },
    })
  ).current;

  if (!visible && !forceVisible) return null;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor:
            providerStyle.bg === "#ffffff" ? "#fff" : providerStyle.bg,
        },
      ]}
    >
      <View style={styles.left}>
        {track?.artwork ? (
          typeof track.artwork === "string" ? (
            <Image source={{ uri: track.artwork }} style={styles.artwork} />
          ) : (
            <Image
              source={track.artwork as ImageSourcePropType}
              style={styles.artwork}
            />
          )
        ) : (
          <View
            style={[
              styles.artworkPlaceholder,
              {
                backgroundColor:
                  providerStyle.bg === "#ffffff" ? "#f0f0f0" : "#222",
              },
            ]}
          />
        )}
      </View>
      <View style={styles.center}>
        <Text
          style={[styles.title, { color: providerStyle.color }]}
          numberOfLines={1}
        >
          {track?.title ?? (forceVisible ? "Unknown (forced)" : "—")}
        </Text>
        <Text
          style={[styles.artist, { color: providerStyle.color }]}
          numberOfLines={1}
        >
          {track?.artist ?? ""}
        </Text>

        <View style={styles.progressRow}>
          <View style={styles.progressBackground} {...pan.panHandlers}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: progressX.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, barWidth],
                  }),
                },
              ]}
            />
          </View>
          <Text style={styles.timeText}>
            {Math.floor(position)}/{Math.floor(duration)}
          </Text>
        </View>
      </View>
      <View style={styles.right}>
        {loading ? (
          <ActivityIndicator />
        ) : (
          <View style={styles.controlsRow}>
            <TouchableOpacity onPress={skipPrev} style={styles.ctrlButton}>
              <Text style={styles.ctrlText}>⟸</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={togglePlay}
              style={[
                styles.playButton,
                { backgroundColor: providerStyle.color },
              ]}
            >
              <Text style={styles.playText}>{playing ? "▮▮" : "▶"}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={skipNext} style={styles.ctrlButton}>
              <Text style={styles.ctrlText}>⟹</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    minWidth: 320,
  },
  left: { marginRight: 12 },
  artwork: { width: 48, height: 48, borderRadius: 8 },
  artworkPlaceholder: { width: 48, height: 48, borderRadius: 8 },
  center: { flex: 1, justifyContent: "center" },
  title: { fontSize: 14, fontWeight: "700" },
  artist: { fontSize: 12, marginTop: 2 },
  right: { marginLeft: 12, alignItems: "center" },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  playText: { color: "#fff", fontWeight: "700" },
  controlsRow: { flexDirection: "row", alignItems: "center" },
  ctrlButton: { paddingHorizontal: 8, paddingVertical: 6 },
  ctrlText: { fontSize: 16, color: "#fff" },
  progressRow: { marginTop: 8, flexDirection: "row", alignItems: "center" },
  progressBackground: {
    width: 160,
    height: 6,
    backgroundColor: "#eee",
    borderRadius: 6,
    overflow: "hidden",
    marginRight: 8,
  },
  progressFill: { height: 6, backgroundColor: "#007AFF", borderRadius: 6 },
  timeText: { fontSize: 11, color: "#666" },
});
