import {
    AppLogoIcon,
    AvatarIcon,
    HistoryIcon,
    HomeIcon,
    MoreIcon,
    WorkIcon,
} from "@/assets/icons";
import { useHapticSettings } from "@/contexts/HapticSettingsContext";
import { useUser } from "@/contexts/UserContext";
import { createTranslator } from "@/i18n";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

interface MapOverlayProps {
  blockMap: boolean;
}

export default function MapOverlay({ blockMap }: MapOverlayProps) {
  const { t } = createTranslator("main");
  const { vibration } = useHapticSettings();
  const { saved } = useUser();
  const router = useRouter();

  const impactStyle = React.useMemo(() => {
    const force = vibration.force ?? 1;
    if (force <= 0.6) return Haptics.ImpactFeedbackStyle.Light;
    if (force <= 1.4) return Haptics.ImpactFeedbackStyle.Medium;
    return Haptics.ImpactFeedbackStyle.Heavy;
  }, [vibration.force]);

  const triggerHaptic = React.useCallback(() => {
    Haptics.impactAsync(impactStyle).catch(() => {
      try {
        Haptics.selectionAsync();
      } catch {}
    });
  }, [impactStyle]);

  const handleChipPress = React.useCallback(
    (id?: string) => {
      triggerHaptic();
      if (id === "home" && saved.home) {
        router.push({
          pathname: "/(main)/place",
          params: {
            name: saved.home.name ?? t("chips.home"),
            address: saved.home.address,
            lat: String(saved.home.lat),
            lng: String(saved.home.lng),
          },
        });
      } else if (id === "work" && saved.work) {
        router.push({
          pathname: "/(main)/place",
          params: {
            name: saved.work.name ?? t("chips.work"),
            address: saved.work.address,
            lat: String(saved.work.lat),
            lng: String(saved.work.lng),
          },
        });
      } else if (id === "recent") {
        router.push("/(main)/search?mode=search");
      } else if (id === "more") {
        router.push("/(main)/search?mode=saved");
      }
    },
    [triggerHaptic, router, saved],
  );

  const handleAvatarPress = React.useCallback(() => {
    triggerHaptic();
    router.push("/(main)/profile");
  }, [triggerHaptic, router]);

  const chips = React.useMemo(() => {
    const list: {
      id: string;
      label: string;
      icon: React.ReactNode;
      onPress: () => void;
    }[] = [];

    if (saved.home) {
      list.push({
        id: "home",
        label: t("chips.home"),
        icon: <HomeIcon width={20} height={20} />,
        onPress: () => handleChipPress("home"),
      });
    }
    if (saved.work) {
      list.push({
        id: "work",
        label: t("chips.work"),
        icon: <WorkIcon width={20} height={20} />,
        onPress: () => handleChipPress("work"),
      });
    }

    list.push({
      id: "recent",
      label: t("chips.recent"),
      icon: <HistoryIcon />,
      onPress: () => handleChipPress("recent"),
    });

    list.push({
      id: "more",
      label: t("chips.more"),
      icon: <MoreIcon />,
      onPress: () => handleChipPress("more"),
    });

    return list;
  }, [saved, t, handleChipPress]);

  return (
    <>
      <View
        style={styles.overlay}
        pointerEvents={blockMap ? "auto" : "box-none"}
      >
        <Svg height={320} style={styles.topGradient} pointerEvents="none">
          <Defs>
            <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#074fa8" stopOpacity="0.96" />
              <Stop offset="1" stopColor="#074fa8" stopOpacity="0" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#grad)" />
        </Svg>

        <View style={styles.topArea} pointerEvents="auto">
          <View style={styles.headerRow} pointerEvents="auto">
            <View style={styles.titleRow} pointerEvents="auto">
              <View style={styles.logo}>
                <AppLogoIcon width={20} height={20} fill="#fff" />
              </View>
              <Text style={styles.title}>LMC Maps</Text>
            </View>
            <TouchableOpacity style={styles.avatar} onPress={handleAvatarPress}>
              <AvatarIcon />
            </TouchableOpacity>
          </View>

          <View style={styles.searchRow} pointerEvents="auto">
            <TouchableOpacity
              style={[styles.search, styles.searchButton]}
              activeOpacity={1}
              onPress={() => {
                triggerHaptic();
                router.push("/(main)/search");
              }}
              accessibilityRole="button"
            >
              <Text
                style={{ color: "rgba(255,255,255,1)" }}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {t("searchPlaceholder")}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.chips}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsContent}
            pointerEvents="auto"
            nestedScrollEnabled={true}
            directionalLockEnabled={true}
          >
            {chips.map((c, i) => (
              <TouchableOpacity
                key={c.id}
                style={[
                  styles.chip,
                  i !== chips.length - 1 && styles.chipSpacing,
                ]}
                onPress={c.onPress}
              >
                {c.icon}

                <Text
                  style={styles.chipText}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {c.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, zIndex: 50 },
  topGradient: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 55 },
  topArea: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 10,
    paddingHorizontal: 12,
    zIndex: 60,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 12,
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#0d7ff2",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { color: "#fff", fontSize: 18, fontWeight: "700" },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.20)",
    alignItems: "center",
    justifyContent: "center",
  },
  searchRow: { marginBottom: 12, width: "100%" },
  search: {
    height: 48,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 12,
    color: "#fff",
    paddingHorizontal: 12,
  },
  searchButton: {
    justifyContent: "center",
  },
  chips: { flexDirection: "row", marginBottom: 8, gap: 12 },
  chipsContent: { paddingRight: 20, alignItems: "center" },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.3)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 8,
  },
  chipText: { color: "#fff", fontSize: 14 },
  rightControls: { position: "absolute", right: 12, top: "40%", zIndex: 80 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    maxHeight: "80%",
    width: "100%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
    marginBottom: 16,
  },
  debugInfo: {
    marginBottom: 16,
    maxHeight: 200,
  },
  debugLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    marginTop: 12,
    marginBottom: 4,
  },
  debugValue: {
    fontSize: 14,
    color: "#333",
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 8,
    fontFamily: "monospace",
  },
  buttonRow: {
    flexDirection: "column",
    gap: 8,
    marginBottom: 12,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  chipSpacing: {
    marginRight: 12,
  },
  primaryButton: {
    backgroundColor: "#0d7ff2",
  },
  dangerButton: {
    backgroundColor: "#ff6b6b",
  },
  secondaryButton: {
    backgroundColor: "#999",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  closeButton: {
    paddingVertical: 12,
    backgroundColor: "#e0e0e0",
    borderRadius: 8,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#333",
    fontWeight: "600",
    fontSize: 14,
  },
});
