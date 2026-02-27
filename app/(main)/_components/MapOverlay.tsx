import { useHapticSettings } from "@/contexts/HapticSettingsContext";
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
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from "react-native-svg";

interface MapOverlayProps {
  blockMap: boolean;
}

export default function MapOverlay({ blockMap }: MapOverlayProps) {
  const { t } = createTranslator("main");
  const { vibration } = useHapticSettings();
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
      if (id === "recent") {
        router.push("/(main)/search?mode=search");
      } else if (id === "more") {
        router.push("/(main)/search?mode=saved");
      }
    },
    [triggerHaptic, router],
  );

  const handleAvatarPress = React.useCallback(() => {
    triggerHaptic();
    router.push("/(main)/profile");
  }, [triggerHaptic, router]);

  return (
    <>
      <View
        style={styles.overlay}
        pointerEvents="box-none"
        onStartShouldSetResponderCapture={() => blockMap}
        onMoveShouldSetResponderCapture={() => blockMap}
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
          <View style={styles.headerRow} pointerEvents="box-none">
            <View style={styles.titleRow} pointerEvents="none">
              <View style={styles.logo}>
                <Svg width={20} height={20} viewBox="0 -960 960 960">
                  <Path
                    d="M480-240 222-130q-13 5-24.5 2.5T178-138q-8-8-10.5-20t2.5-25l273-615q5-12 15.5-18t21.5-6q11 0 21.5 6t15.5 18l273 615q5 13 2.5 25T782-138q-8 8-19.5 10.5T738-130L480-240Z"
                    fill="#fff"
                  />
                </Svg>
              </View>
              <Text style={styles.title}>LMC Maps</Text>
            </View>
            <TouchableOpacity style={styles.avatar} onPress={handleAvatarPress}>
              <Svg width={30} height={30} viewBox="0 -960 960 960">
                <Path
                  d="M367-527q-47-47-47-113t47-113q47-47 113-47t113 47q47 47 47 113t-47 113q-47 47-113 47t-113-47ZM160-240v-32q0-34 17.5-62.5T224-378q62-31 126-46.5T480-440q66 0 130 15.5T736-378q29 15 46.5 43.5T800-272v32q0 33-23.5 56.5T720-160H240q-33 0-56.5-23.5T160-240Zm80 0h480v-32q0-11-5.5-20T700-306q-54-27-109-40.5T480-360q-56 0-111 13.5T260-306q-9 5-14.5 14t-5.5 20v32Zm296.5-343.5Q560-607 560-640t-23.5-56.5Q513-720 480-720t-56.5 23.5Q400-673 400-640t23.5 56.5Q447-560 480-560t56.5-23.5ZM480-640Zm0 400Z"
                  fill="#fff"
                />
              </Svg>
            </TouchableOpacity>
          </View>

          <View style={styles.searchRow} pointerEvents="box-none">
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
            <TouchableOpacity
              style={styles.chip}
              onPress={() => handleChipPress("home")}
            >
              <Svg width={20} height={20} viewBox="0 -960 960 960">
                <Path
                  d="M240-200h120v-200q0-17 11.5-28.5T400-440h160q17 0 28.5 11.5T600-400v200h120v-360L480-740 240-560v360Zm-80 0v-360q0-19 8.5-36t23.5-28l240-180q21-16 48-16t48 16l240 180q15-11 23.5 28t8.5 36v360q0 33-23.5 56.5T720-120H560q-17 0-28.5-11.5T520-160v-200h-80v200q0 17-11.5 28.5T400-120H240q-33 0-56.5-23.5T160-200Zm320-270Z"
                  fill="#fff"
                />
              </Svg>

              <Text
                style={styles.chipText}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {t("chips.home")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.chip}
              onPress={() => handleChipPress("work")}
            >
              <Svg width={20} height={20} viewBox="0 -960 960 960">
                <Path
                  d="M160-120q-33 0-56.5-23.5T80-200v-440q0-33 23.5-56.5T160-720h160v-80q0-33 23.5-56.5T400-880h160q33 0 56.5 23.5T640-800v80h160q33 0 56.5 23.5T880-640v440q0 33-23.5 56.5T800-120H160Zm0-80h640v-440H160v440Zm240-520h160v-80H400v80ZM160-200v-440 440Z"
                  fill="#fff"
                />
              </Svg>

              <Text
                style={styles.chipText}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {t("chips.work")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.chip}
              onPress={() => handleChipPress("recent")}
            >
              <Svg
                width={20}
                height={20}
                viewBox="0 -960 960 960"
                pointerEvents="none"
              >
                <Path
                  d="m520-473 90 90q11 11 11 27.5T610-327q-12 12-28.5 12T553-327L452-428q-6-6-9-13.5t-3-15.5v-143q0-17 11.5-28.5T480-640q17 0 28.5 11.5T520-600v127Zm-68.5-258.5Q440-743 440-760v-40h80v40q0 17-11.5 28.5T480-720q-17 0-28.5-11.5Zm280 223Q743-520 760-520h40v80h-40q-17 0-28.5-11.5T720-480q0-17 11.5-28.5Zm-223 280Q520-217 520-200v40h-80v-40q0-17 11.5-28.5T480-240q17 0 28.5 11.5Zm-280-223Q217-440 200-440h-40v-80h40q17 0 28.5 11.5T240-480q0 17-11.5 28.5ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm320-400q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93q134 0 227-93t93-227Zm-320 0Z"
                  fill="#fff"
                />
              </Svg>

              <Text
                style={styles.chipText}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {t("chips.recent")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.chip}
              onPress={() => handleChipPress("more")}
            >
              <Svg
                width={20}
                height={20}
                viewBox="0 -960 960 960"
                pointerEvents="none"
              >
                <Path
                  d="M480-160q-33 0-56.5-23.5T400-240q0-33 23.5-56.5T480-320q33 0 56.5 23.5T560-240q0 33-23.5 56.5T480-160Zm0-240q-33 0-56.5-23.5T400-480q0-33 23.5-56.5T480-560q33 0 56.5 23.5T560-480q0 33-23.5 56.5T480-400Zm0-240q-33 0-56.5-23.5T400-720q0-33 23.5-56.5T480-800q33 0 56.5 23.5T560-720q0 33-23.5 56.5T480-640Z"
                  fill="#fff"
                />
              </Svg>

              <Text
                style={styles.chipText}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {t("chips.more")}
              </Text>
            </TouchableOpacity>
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
    paddingTop: 48,
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
  chips: { flexDirection: "row", marginBottom: 8 },
  chipsContent: { paddingRight: 20, alignItems: "center" },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.3)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginRight: 12,
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
    borderRadius: 8,
    alignItems: "center",
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
