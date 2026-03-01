import { CarIcon, CloseIcon, MoonStarsIcon, TrainIcon } from "@/assets/icons";
import SvgPathIcon from "@/assets/icons/SvgPathIcon";
import { useHapticSettings } from "@/contexts/HapticSettingsContext";
import { createTranslator } from "@/i18n";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useMapLayers } from "./MapLayersContext";

interface LayersPanelProps {
  onClose: () => void;
}

const MAP_TYPES = [
  {
    id: "standard" as const,
    label: "Standard",
    path: "m574-129-214-75-186 72q-10 4-19.5 2.5T137-136q-8 5-12.5 13.5T120-169v-561q0-13 7.5-23t20.5-15l186-63q6-2 12.5-3t13.5-1q7 0 13.5 1t12.5 3l214 75 186-72q10-4 19.5-2.5T823-824q8 5 12.5 13.5T840-791v561q0 13-7.5 23T812-192l-186 63q-6 2-12.5 3t-13.5 1q-7 0-13.5-1t-12.5-3Zm-14-89v-468l-160-56v468l160 56Zm80 0 120-40v-474l-120 46v468Zm-440-10 120-46v-468l-120 40v474Zm440-458v468-468Zm-320-56v468-468Z",
  },
  {
    id: "satellite" as const,
    label: "Satellite",
    path: "M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-7-.5-14.5T799-507q-5 29-27 48t-52 19h-80q-33 0-56.5-23.5T560-520v-40H400v-80q0-33 23.5-56.5T480-720h40q0-23 12.5-40.5T563-789q-20-5-40.5-8t-42.5-3q-134 0-227 93t-93 227h200q66 0 113 47t47 113v40H400v110q20 5 39.5 7.5T480-160Z",
  },
  {
    id: "terrain" as const,
    label: "Terrain",
    path: "M120-240q-25 0-36-22t4-42l160-213q6-8 14.5-12t17.5-4q9 0 17.5 4t14.5 12l148 197h300L560-586l-68 90q-12 16-28 16.5t-28-8.5q-12-9-16-24.5t8-31.5l100-133q6-8 14.5-12t17.5-4q9 0 17.5 4t14.5 12l280 373q15 20 4 42t-36 22H120Zm340-80h300-312 68.5H460Zm-260 0h160l-80-107-80 107Zm0 0h160-160Z",
  },
];

export default function LayersPanel({ onClose }: LayersPanelProps) {
  const layers = useMapLayers();
  const { t } = createTranslator("main");
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
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{t("layers.title")}</Text>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <CloseIcon />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{t("layers.mapType")}</Text>
        <View style={styles.mapTypesGrid}>
          {MAP_TYPES.map((mapType) => (
            <TouchableOpacity
              key={mapType.id}
              style={[
                styles.mapTypeButton,
                layers.mapType === mapType.id && styles.mapTypeButtonActive,
              ]}
              onPress={() => {
                triggerHaptic();
                layers.setMapType(mapType.id);
              }}
            >
              <View
                style={[
                  styles.mapTypeIcon,
                  layers.mapType === mapType.id && styles.mapTypeIconActive,
                ]}
              >
                <SvgPathIcon
                  d={mapType.path}
                  fill={layers.mapType === mapType.id ? "#000" : "#e3e3e3"}
                />
              </View>
              <Text
                style={[
                  styles.mapTypeLabel,
                  layers.mapType === mapType.id && styles.mapTypeLabelActive,
                ]}
              >
                {t(`layers.mapTypes.${mapType.id}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{t("layers.details")}</Text>

        {["standard", "terrain"].includes(layers.mapType) && (
          <View style={styles.detailRow}>
            <View style={styles.detailLeft}>
              <View style={styles.detailIcon}>
                <MoonStarsIcon />
              </View>
              <Text style={styles.detailLabel}>{t("layers.darkMap")}</Text>
            </View>
            <Switch
              value={layers.darkTheme}
              onValueChange={(v) => {
                triggerHaptic();
                layers.setDarkTheme(v);
              }}
              trackColor={{
                false: "rgba(255,255,255,0.1)",
                true: "rgba(255,255,255,0.25)",
              }}
              thumbColor={layers.darkTheme ? "#fff" : "#fff"}
              style={styles.toggle}
            />
          </View>
        )}
        <View style={styles.detailRow}>
          <View style={styles.detailLeft}>
            <View style={styles.detailIcon}>
              <CarIcon />
            </View>
            <Text style={styles.detailLabel}>{t("layers.traffic")}</Text>
          </View>
          <Switch
            value={layers.traffic}
            onValueChange={(v) => {
              triggerHaptic();
              layers.setTraffic(v);
            }}
            trackColor={{
              false: "rgba(255,255,255,0.1)",
              true: "rgba(255,255,255,0.25)",
            }}
            thumbColor={layers.traffic ? "#fff" : "#fff"}
            style={styles.toggle}
          />
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailLeft}>
            <View style={styles.detailIcon}>
              <TrainIcon />
            </View>
            <Text style={styles.detailLabel}>
              {t("layers.publicTransport")}
            </Text>
          </View>
          <Switch
            value={layers.publicTransport}
            onValueChange={(v) => {
              triggerHaptic();
              layers.setPublicTransport(v);
            }}
            trackColor={{
              false: "rgba(255,255,255,0.1)",
              true: "rgba(255,255,255,0.25)",
            }}
            thumbColor={layers.publicTransport ? "#fff" : "#fff"}
            style={styles.toggle}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    paddingTop: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  section: {
    marginBottom: 32,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255,255,255,0.4)",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginBottom: 16,
  },
  mapTypesGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  mapTypeButton: {
    flex: 1,
    alignItems: "center",
    gap: 12,
  },
  mapTypeButtonActive: {},
  mapTypeIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  mapTypeIconActive: {
    borderColor: "#fff",
    backgroundColor: "#fff",
  },
  iconSymbol: {
    fontSize: 28,
  },
  mapTypeLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
  },
  mapTypeLabelActive: {
    fontWeight: "700",
    color: "#fff",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  detailLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  detailIconSymbol: {
    fontSize: 20,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#fff",
  },
  toggle: {
    transform: [{ scaleX: 1 }, { scaleY: 1 }],
  },
  themeToggleRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  themeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  themeButtonActive: {
    backgroundColor: "#0d7ff2",
    borderColor: "#0d7ff2",
  },
  themeButtonText: {
    color: "rgba(255,255,255,0.7)",
    fontWeight: "600",
  },
  themeButtonTextActive: {
    color: "#fff",
  },
});
