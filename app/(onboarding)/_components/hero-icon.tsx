import HeroPattern from "@/assets/icons/HeroPattern";
import { Colors } from "@/constants/theme";
import { useThemeColor } from "@/hooks/use-theme-color";
import { MaterialIcons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";

export default function HeroIcon() {
  const primary = useThemeColor({ dark: Colors.dark.primary }, "text");
  const bg = "rgba(255,255,255,0.05)";
  const border = "rgba(255,255,255,0.1)";

  return (
    <View style={styles.wrapper}>
      <View style={styles.pattern}>
        <HeroPattern />
      </View>
      <View
        style={[styles.container, { backgroundColor: bg, borderColor: border }]}
      >
        <MaterialIcons name="explore" size={120} color={primary} />
        <View style={[styles.underline, { backgroundColor: primary }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: 280,
    aspectRatio: 1,
    marginBottom: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    overflow: "hidden",
  },
  container: {
    width: "100%",
    height: "100%",
    borderRadius: 24,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  pattern: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.2,
    backgroundColor: "transparent",
    borderRadius: 24,
    overflow: "hidden",
  },
  underline: {
    width: 64,
    height: 4,
    borderRadius: 2,
    marginTop: 16,
  },
});
