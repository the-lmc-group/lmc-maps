import { CenterUserIcon, LayersIcon } from "@/assets/icons";
import { useHapticSettings } from "@/contexts/HapticSettingsContext";
import { usePosition } from "@/contexts/PositionContext";
import { snapPointsPercent } from "@/utils/snapPoints";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import React from "react";
import {
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from "react-native";
import LayersPanel from "./LayersPanel";
import { useMap } from "./MapContext";
import { useMapLayers } from "./MapLayersContext";

export default function Controls() {
  const m = useMap();
  const layers = useMapLayers();
  const { height: screenHeight } = useWindowDimensions();
  usePosition();
  const { followUser, centerAndFollow } = m;

  const isLightMap =
    (layers.mapType === "standard" || layers.mapType === "terrain") &&
    !layers.darkTheme;
  const iconColor = isLightMap ? "#000" : "#fff";
  const containerBg = isLightMap
    ? "rgba(0,0,0,0.12)"
    : "rgba(255,255,255,0.05)";
  const containerBorder = isLightMap
    ? "rgba(0,0,0,0.18)"
    : "rgba(255,255,255,0.2)";

  const snapPoints = React.useMemo(
    () => snapPointsPercent([240, 500], screenHeight),
    [screenHeight],
  );

  const centerOnUser = () => {
    if (followUser) {
      m.toggleFollow?.();
    } else {
      centerAndFollow?.();
    }
  };

  const { vibration } = useHapticSettings();
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

  return (
    <>
      <View style={styles.buttonContainer} pointerEvents="box-none">
        <View style={styles.container}>
          <BlurView
            intensity={50}
            style={[
              styles.zoomGroup,
              { backgroundColor: containerBg, borderColor: containerBorder },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.zoomButton,
                {
                  borderBottomColor: isLightMap
                    ? "rgba(0,0,0,0.12)"
                    : "rgba(255,255,255,0.1)",
                },
              ]}
              onPress={() => {
                triggerHaptic();
                m.zoomIn();
              }}
            >
              <Text style={[styles.icon, { color: iconColor }]}>+</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.zoomButton,
                {
                  borderBottomColor: isLightMap
                    ? "rgba(0,0,0,0.12)"
                    : "rgba(255,255,255,0.1)",
                },
              ]}
              onPress={() => {
                triggerHaptic();
                m.zoomOut();
              }}
            >
              <Text style={[styles.icon, { color: iconColor }]}>−</Text>
            </TouchableOpacity>
          </BlurView>

          <BlurView
            intensity={50}
            style={[
              styles.largeButtonWrapper,
              { backgroundColor: containerBg, borderColor: containerBorder },
            ]}
          >
            <TouchableOpacity
              style={styles.largeButton}
              onPress={() => {
                triggerHaptic();
                centerOnUser();
              }}
            >
              <CenterUserIcon active={followUser} />
            </TouchableOpacity>
          </BlurView>

          <BlurView
            intensity={50}
            style={[
              styles.largeButtonWrapper,
              { backgroundColor: containerBg, borderColor: containerBorder },
            ]}
          >
            <TouchableOpacity
              style={styles.largeButton}
              onPress={() => {
                triggerHaptic();
                layers.openLayers();
              }}
            >
              <LayersIcon />
            </TouchableOpacity>
          </BlurView>
        </View>
      </View>

      {layers.layersOpen && (
        <View style={styles.sheetWrapper}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={layers.closeLayers}
            accessibilityLabel="Dismiss layers panel"
          />
          <BottomSheet
            snapPoints={snapPoints}
            index={0}
            enablePanDownToClose={true}
            backgroundStyle={{ backgroundColor: "rgba(16,25,34,1)" }}
            handleIndicatorStyle={{
              backgroundColor: "rgba(255,255,255,0.3)",
            }}
            onClose={layers.closeLayers}
          >
            <BottomSheetView
              style={{ flex: 1, paddingHorizontal: 20, paddingBottom: 20 }}
            >
              <LayersPanel onClose={layers.closeLayers} />
            </BottomSheetView>
          </BottomSheet>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    gap: 12,
    alignItems: "center",
  },
  zoomGroup: {
    flexDirection: "column",
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
      },
      android: {
        elevation: 0,
      },
    }),
  },
  zoomButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  largeButtonWrapper: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
      },
      android: {
        elevation: 0,
      },
    }),
  },
  largeButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: { color: "#fff", fontSize: 24, lineHeight: 24 },
  primary: { color: "#0d7ff2" },
  buttonContainer: {
    position: "absolute",
    right: 12,
    top: "40%",
    zIndex: 80,
  },
  sheetWrapper: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
});
