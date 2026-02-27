import { SavePlaceModal } from "@/app/(main)/_components/SavePlaceModal";
import { Colors } from "@/constants/theme";
import { createTranslator } from "@/i18n";
import FreePlaceDetailsService from "@/services/PlaceDetailService";
import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ImageBackground,
  Linking,
  Platform,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type PlaceDetails = {
  id?: string;
  title?: string;
  description?: string;
  phone?: string | null;
  website?: string | null;
  opening_hours?: string | null;
  photos?: { url: string }[];
};

export default function PlaceDetailScreen() {
  const { osm_id, osm_type, osm_value, address, name, lat, lng } =
    useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = createTranslator("place");
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState<PlaceDetails | null>(null);
  const [saveModalVisible, setSaveModalVisible] = useState(false);

  const WEB_BASE =
    process.env.EXPO_PUBLIC_WEB_BASE_URL ?? "https://maps.lmcgroup.xyz";

  const handleShare = async () => {
    const params = new URLSearchParams();
    if (osm_id) params.set("osm_id", osm_id as string);
    if (osm_type) params.set("osm_type", osm_type as string);
    if (osm_value) params.set("osm_value", osm_value as string);
    if (name) params.set("name", placeTitle);
    if (address) params.set("address", placeAddress);
    const webUrl = `${WEB_BASE}/place?${params.toString()}`;
    try {
      await Share.share(
        Platform.OS === "ios"
          ? { url: webUrl, message: placeTitle }
          : { message: `${placeTitle}\n${webUrl}` },
      );
    } catch {}
  };

  useEffect(() => {
    async function loadDetails() {
      if (!osm_id || !osm_type) {
        setLoading(false);
        return;
      }
      try {
        const data = await FreePlaceDetailsService.fetchById(
          osm_type as "N" | "W" | "R",
          parseInt(osm_id as string),
        );
        setDetails(data);
      } catch (error) {
        console.error("Failed to fetch place details:", error);
      } finally {
        setLoading(false);
      }
    }
    loadDetails();
  }, [osm_id, osm_type]);

  const placeTitle = (details?.title || name || t("unknownPlace")) as string;
  const placeAddress = (address || details?.id || "") as string;

  const getCategorization = () => {
    const val = (osm_value as string) || "";
    if (["restaurant", "fast_food", "food_court"].includes(val))
      return t("categories.restaurant");
    if (["cafe", "bar", "pub"].includes(val)) return t("categories.cafe");
    if (val === "fuel") return t("categories.gasStation");
    if (val === "parking") return t("categories.parking");
    if (["hospital", "clinic", "pharmacy", "doctors"].includes(val))
      return t("categories.health");
    if (
      ["retail", "supermarket", "bakery", "convenience", "mall"].includes(val)
    )
      return t("categories.commerce");
    if (["bus_stop", "bus_station", "train_station", "tram_stop"].includes(val))
      return t("categories.publicTransport");
    return (
      val.charAt(0).toUpperCase() + val.slice(1).replace("_", " ") ||
      t("categories.location")
    );
  };

  const categoryLabel = getCategorization();

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Colors.dark.primary} />
      </View>
    );
  }

  const headerImage = details?.photos?.[0]?.url || null;

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
          {t("title")}
        </Text>
        <TouchableOpacity style={styles.iconButton} onPress={handleShare}>
          <MaterialIcons name="share" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {headerImage && (
          <View style={styles.imageContainer}>
            <ImageBackground
              source={{ uri: headerImage }}
              style={styles.heroImage}
              imageStyle={{ borderRadius: 16 }}
            />
          </View>
        )}

        <View style={styles.content}>
          <Text style={styles.title}>{placeTitle}</Text>
          <Text style={styles.subtitle}>{categoryLabel}</Text>

          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={styles.directionsButton}
              onPress={() =>
                router.push({
                  pathname: "/(main)/routePlanning",
                  params: {
                    name: placeTitle,
                    address: placeAddress,
                    lat: lat as string,
                    lng: lng as string,
                  },
                })
              }
            >
              <MaterialIcons
                name="directions"
                size={24}
                color="#fff"
                style={styles.buttonIcon}
              />
              <Text style={styles.directionsText}>{t("directions")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setSaveModalVisible(true)}
            >
              <MaterialIcons name="bookmark-border" size={24} color="#fff" />
            </TouchableOpacity>
            {details?.phone && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => Linking.openURL(`tel:${details.phone}`)}
              >
                <MaterialIcons name="call" size={24} color="#fff" />
              </TouchableOpacity>
            )}
            {details?.website && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => Linking.openURL(details.website!)}
              >
                <MaterialIcons name="web" size={24} color="#fff" />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.detailsList}>
            <View style={styles.detailItem}>
              <View style={styles.detailIconContainer}>
                <MaterialIcons
                  name="location-on"
                  size={20}
                  color={Colors.dark.primary}
                />
              </View>
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>{t("address")}</Text>
                <Text style={styles.detailValue}>{placeAddress}</Text>
              </View>
            </View>

            {details?.opening_hours && (
              <View style={styles.detailItem}>
                <View style={styles.detailIconContainer}>
                  <MaterialIcons
                    name="schedule"
                    size={20}
                    color={Colors.dark.primary}
                  />
                </View>
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>{t("hours")}</Text>
                  <View style={styles.hoursStatusRow}>
                    <Text style={styles.detailValue}>
                      {t("currentSchedule")}
                    </Text>
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusText}>{t("openNow")}</Text>
                    </View>
                  </View>
                  <Text style={styles.subDetailValue}>
                    {details.opening_hours}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <SavePlaceModal
        visible={saveModalVisible}
        onClose={() => setSaveModalVisible(false)}
        slot="other"
        initialName={placeTitle}
        initialAddress={placeAddress}
        initialLat={(lat as string) || ""}
        initialLng={(lng as string) || ""}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#101922",
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
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
  scrollContent: {
    paddingBottom: 100,
  },
  imageContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  heroImage: {
    width: "100%",
    height: 256,
    borderRadius: 16,
    overflow: "hidden",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  title: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  subtitle: {
    color: "#90adcb",
    fontSize: 16,
    marginTop: 4,
  },
  buttonGroup: {
    flexDirection: "row",
    marginTop: 24,
    gap: 12,
  },
  directionsButton: {
    flex: 1,
    height: 56,
    backgroundColor: Colors.dark.primary,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  directionsText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  buttonIcon: {
    marginRight: 4,
  },
  actionButton: {
    width: 56,
    height: 56,
    backgroundColor: "#223649",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  detailsList: {
    marginTop: 32,
    gap: 24,
  },
  detailItem: {
    flexDirection: "row",
    gap: 16,
  },
  detailIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "rgba(13,127,242,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    color: "#90adcb",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  detailValue: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
    marginTop: 2,
  },
  hoursStatusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginRight: 8,
  },
  statusBadge: {
    backgroundColor: "rgba(13,127,242,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: Colors.dark.primary,
    fontSize: 10,
    fontWeight: "800",
  },
  subDetailValue: {
    color: "#90adcb",
    fontSize: 14,
    marginTop: 2,
  },
  reviewCard: {
    marginTop: 8,
    padding: 24,
    borderRadius: 24,
    backgroundColor: "#12202a",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  navButton: {
    backgroundColor: "#fff",
    height: 56,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  navButtonText: {
    color: "#101922",
    fontSize: 18,
    fontWeight: "800",
  },
  errorText: {
    color: "#fff",
    fontSize: 18,
    marginBottom: 16,
  },
  backLink: {
    color: Colors.dark.primary,
    fontSize: 16,
    fontWeight: "700",
  },
});
