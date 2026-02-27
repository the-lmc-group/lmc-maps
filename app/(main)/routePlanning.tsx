import { Colors } from "@/constants/theme";
import { createTranslator } from "@/i18n";
import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function RoutePlanningScreen() {
  const { name, address, lat, lng } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = createTranslator("place");

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.iconButton}
        >
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {t("directions")}
        </Text>
        <View style={styles.iconButton} />
      </View>

      <View style={styles.body}>
        <View style={styles.destCard}>
          <MaterialIcons
            name="location-on"
            size={20}
            color={Colors.dark.primary}
          />
          <View style={{ flex: 1 }}>
            {name ? (
              <Text style={styles.destName}>{name as string}</Text>
            ) : null}
            {address ? (
              <Text style={styles.destAddress}>{address as string}</Text>
            ) : null}
            {!name && !address && lat && lng ? (
              <Text style={styles.destAddress}>{`${lat}, ${lng}`}</Text>
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#101922" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    flex: 1,
    textAlign: "center",
  },
  body: {
    flex: 1,
    padding: 16,
  },
  destCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: "#1a2b3a",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },
  destName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  destAddress: {
    color: "#90adcb",
    fontSize: 14,
    marginTop: 2,
  },
});
