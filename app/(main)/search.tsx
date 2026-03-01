import { SavePlaceModal } from "@/app/(main)/_components/SavePlaceModal";
import { Colors } from "@/constants/theme";
import { usePosition } from "@/contexts/PositionContext";
import { useUser } from "@/contexts/UserContext";
import { createTranslator } from "@/i18n";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  ImageBackground,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  AddPlaceIcon,
  AddressIcon,
  AmenityIcon,
  ArrowRightIcon,
  AvatarIcon,
  BatimentIcon,
  BusStopIcon,
  CoffeeIcon,
  CommercialIcon,
  EditIcon,
  EvIcon,
  FoodIcon,
  GasIcon,
  HealthIcon,
  HistoryIcon,
  HomeIcon,
  ParkingIcon,
  SchoolIcon,
  SearchIcon,
  StarIcon,
  TrainStationIcon,
  WorkIcon,
} from "@/assets/icons";

import BackIcon from "@/assets/icons/BackIcon";
import BookmarkIcon from "@/assets/icons/BookmarkIcon";
import CompassIcon from "@/assets/icons/CompassIcon";
import MapSnapshot from "@/components/MapSnapshot";
import OverPassAmenityList from "../../assets/config/poiList";
import activityImg from "../../assets/images/search/explore/activity.png";
import cultureImg from "../../assets/images/search/explore/culture.png";
import foodImg from "../../assets/images/search/explore/food.png";
import natureImg from "../../assets/images/search/explore/nature.png";
import nightlifeImg from "../../assets/images/search/explore/nightlife.png";
import shoppingImg from "../../assets/images/search/explore/shopping.png";
import socialImg from "../../assets/images/search/explore/social.png";
import topDiningImg from "../../assets/images/search/explore/topDining.png";
import {
  PhotonFeature,
  SearchEngineService,
} from "../../services/SearchEngineService";

const PlaceIcons = [
  { id: "home", icon: HomeIcon },
  { id: "work", icon: WorkIcon },
  { id: "heart", icon: HealthIcon },
  { id: "star", icon: StarIcon },
  { id: "school", icon: SchoolIcon },
];
const SearchResult: React.FC<{
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  onArrowPress?: () => void;
}> = ({ icon, title, subtitle, onPress, onArrowPress }) => (
  <TouchableOpacity style={styles.listItem} onPress={onPress}>
    <View style={styles.itemIcon}>{icon}</View>
    <View style={styles.itemBody}>
      <Text style={styles.itemTitle}>{title}</Text>
      {subtitle ? <Text style={styles.itemSub}>{subtitle}</Text> : null}
    </View>
    {onArrowPress ? (
      <TouchableOpacity onPress={onArrowPress} hitSlop={8}>
        <ArrowRightIcon />
      </TouchableOpacity>
    ) : null}
  </TouchableOpacity>
);

export default function SearchScreen() {
  const { t } = createTranslator("search");
  const router = useRouter();
  const { mode: modeParam } = useLocalSearchParams();
  const initialMode =
    modeParam === "explore"
      ? "explore"
      : modeParam === "saved"
        ? "saved"
        : "search";
  const [mode, setMode] = React.useState<"search" | "explore" | "saved">(
    initialMode,
  );
  const [query, setQuery] = React.useState("");
  const compact = query.length >= 1;
  const initialMount = React.useRef(true);
  React.useEffect(() => {
    initialMount.current = false;
  }, []);
  const { saved } = useUser();
  const { position } = usePosition();
  const lastAddressQueryRef = React.useRef<string | null>(null);

  const [modalVisible, setModalVisible] = React.useState(false);
  const [modalSlot, setModalSlot] = React.useState<"home" | "work" | "other">(
    "home",
  );
  const [modalEditingIndex, setModalEditingIndex] = React.useState<
    number | null
  >(null);
  const [modalInitialData, setModalInitialData] = React.useState<{
    name: string;
    address: string;
    lat: string;
    lng: string;
  }>({ name: "", address: "", lat: "", lng: "" });

  const filteredAmenities = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return OverPassAmenityList.filter(
      (a) =>
        a.label.toLowerCase().includes(q) || a.value.toLowerCase().includes(q),
    );
  }, [query]);

  const [addressResults, setAddressResults] = React.useState<PhotonFeature[]>(
    [],
  );

  React.useEffect(() => {
    const q = query.trim();
    if (!q) {
      setAddressResults([]);
      lastAddressQueryRef.current = null;
      return;
    }

    let mounted = true;
    if (lastAddressQueryRef.current === q) return;

    const t = setTimeout(async () => {
      try {
        const results = await SearchEngineService.photonSearch(q, {
          limit: 10,
          lat: position?.latitude,
          lon: position?.longitude,
        });

        if (mounted) {
          lastAddressQueryRef.current = q;
          setAddressResults(results);
        }
      } catch {
        if (mounted) setAddressResults([]);
      }
    }, 300);

    return () => {
      mounted = false;
      clearTimeout(t);
    };
  }, [query]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <BackIcon />
          </TouchableOpacity>
          <Text style={styles.title}>{t("title")}</Text>
          <TouchableOpacity
            style={styles.avatar}
            onPress={() => router.push("/(main)/profile")}
          >
            <AvatarIcon />
          </TouchableOpacity>
        </View>

        <View style={styles.searchArea}>
          {mode !== "saved" && (
            <View style={styles.searchBox}>
              <Text style={styles.searchIcon}>
                <SearchIcon />
              </Text>
              <TextInput
                autoFocus={initialMount.current}
                placeholder={t("placeholder")}
                placeholderTextColor="#90adcb"
                style={styles.input}
                value={query}
                onChangeText={setQuery}
              />
            </View>
          )}
          {mode === "search" && compact && (
            <View style={styles.resultsList}>
              <ScrollView keyboardShouldPersistTaps="handled">
                {filteredAmenities.length > 0 &&
                  filteredAmenities
                    .slice(0, 10)
                    .map((a) => (
                      <SearchResult
                        key={a.value}
                        icon={<AmenityIcon />}
                        title={a.label}
                        subtitle={t(`type_${a.type.toLowerCase()}`)}
                        onPress={() => setQuery(a.label)}
                      />
                    ))}

                {addressResults.length > 0 &&
                  addressResults.slice(0, 10).map((r) => {
                    const isStationQuay = /\bquai\b/i.test(
                      r.properties?.street || "",
                    );
                    const isStation =
                      [
                        "bus_stop",
                        "bus_station",
                        "train_station",
                        "train_station_entrance",
                        "station",
                        "halt",
                        "tram_stop",
                        "subway_entrance",
                      ].includes(r.properties?.osm_value || "") ||
                      isStationQuay;
                    const isFoodPlace = [
                      "restaurant",
                      "fast_food",
                      "cafe",
                      "bar",
                      "pub",
                      "food_court",
                    ].includes(r.properties?.osm_value || "");
                    const isCommercial = [
                      "retail",
                      "supermarket",
                      "bakery",
                      "convenience",
                      "pharmacy",
                      "clothes",
                    ].includes(r.properties?.osm_value || "");
                    const isParking = r.properties?.osm_value === "parking";
                    const isFuel = r.properties?.osm_value === "fuel";
                    const isHealth = [
                      "hospital",
                      "clinic",
                      "pharmacy",
                      "doctors",
                    ].includes(r.properties?.osm_value || "");

                    const noStreet =
                      !r.properties?.housenumber && !r.properties?.street;
                    const streetInfo = [
                      r.properties?.housenumber,
                      r.properties?.street,
                    ]
                      .filter(Boolean)
                      .join(" ");

                    const title =
                      (isStation ||
                        isFoodPlace ||
                        isCommercial ||
                        isParking ||
                        isFuel ||
                        isHealth) &&
                      r.properties?.name
                        ? r.properties.name
                        : noStreet
                          ? r.properties?.city
                          : streetInfo;

                    const subtitle = noStreet
                      ? r.properties?.country
                      : [streetInfo, r.properties?.city]
                          .filter(Boolean)
                          .join(", ");

                    const PlaceIcon = noStreet ? (
                      <BatimentIcon />
                    ) : r.properties.osm_value === "bus_stop" ? (
                      <BusStopIcon />
                    ) : isStation ? (
                      <TrainStationIcon />
                    ) : isFoodPlace ? (
                      <FoodIcon />
                    ) : isCommercial ? (
                      <CommercialIcon />
                    ) : isHealth ? (
                      <HealthIcon />
                    ) : isParking ? (
                      <ParkingIcon />
                    ) : isFuel ? (
                      <GasIcon />
                    ) : (
                      <AddressIcon />
                    );

                    return (
                      <SearchResult
                        key={`${r.properties?.osm_type || "p"}_${r.properties?.osm_id || r.geometry?.coordinates.join("_")}`}
                        icon={PlaceIcon}
                        title={title || t("unknown_place")}
                        subtitle={subtitle}
                        onPress={() => {
                          router.push({
                            pathname: "/(main)/place",
                            params: {
                              osm_id: r.properties?.osm_id,
                              osm_type: r.properties?.osm_type,
                              osm_value: r.properties?.osm_value,
                              address: subtitle,
                              name: title,
                              lat: r.geometry?.coordinates[1]?.toString(),
                              lng: r.geometry?.coordinates[0]?.toString(),
                            },
                          });
                        }}
                        onArrowPress={() => {
                          router.push({
                            pathname: "/(main)/routePlanning",
                            params: {
                              name: title,
                              address: subtitle,
                              lat: r.geometry?.coordinates[1]?.toString(),
                              lng: r.geometry?.coordinates[0]?.toString(),
                            },
                          });
                        }}
                      />
                    );
                  })}

                {addressResults.length === 0 &&
                  filteredAmenities.length === 0 && (
                    <View style={{ padding: 12 }}>
                      <Text style={{ color: "#90adcb" }}>No results</Text>
                    </View>
                  )}
              </ScrollView>
            </View>
          )}
          {mode === "search" && !compact && (
            <>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.chips}
              >
                {[
                  { icon: <GasIcon />, label: t("chip_gas") },
                  { icon: <ParkingIcon />, label: t("chip_parking") },
                  { icon: <CoffeeIcon />, label: t("chip_coffee") },
                  { icon: <EvIcon />, label: t("chip_ev") },
                  { icon: <FoodIcon />, label: t("chip_food") },
                ].map((c) => (
                  <TouchableOpacity key={c.label} style={styles.chip}>
                    <View style={styles.chipIcon}>{c.icon}</View>
                    <Text style={styles.chipLabel}>{c.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>
                    {t("recent_searches")}
                  </Text>
                  <TouchableOpacity>
                    <Text style={styles.clear}>{t("clear_all")}</Text>
                  </TouchableOpacity>
                </View>

                <SearchResult
                  icon={<HistoryIcon />}
                  title="1 rue de bonjour"
                  subtitle="issou, France"
                />

                <SearchResult
                  icon={<WorkIcon />}
                  title="La maison de cobra"
                  subtitle="Qq part, France"
                />
              </View>

              <View style={styles.exploreSection}>
                <Text style={styles.sectionTitle}>{t("explore_nearby")}</Text>
                <View style={styles.grid}>
                  <TouchableOpacity style={styles.card}>
                    <ImageBackground
                      source={topDiningImg}
                      style={styles.cardImage}
                      imageStyle={{ borderRadius: 16 }}
                    >
                      <View style={styles.cardOverlay} />
                    </ImageBackground>
                    <Text style={styles.cardText}>{t("card_top_dining")}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.card}>
                    <ImageBackground
                      source={nightlifeImg}
                      style={styles.cardImage}
                      imageStyle={{ borderRadius: 16 }}
                    >
                      <View style={styles.cardOverlay} />
                    </ImageBackground>
                    <Text style={styles.cardText}>{t("card_nightlife")}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.card}>
                    <ImageBackground
                      source={natureImg}
                      style={styles.cardImage}
                      imageStyle={{ borderRadius: 16 }}
                    >
                      <View style={styles.cardOverlay} />
                    </ImageBackground>
                    <Text style={styles.cardText}>{t("card_nature")}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.card}>
                    <ImageBackground
                      source={shoppingImg}
                      style={styles.cardImage}
                      imageStyle={{ borderRadius: 16 }}
                    >
                      <View style={styles.cardOverlay} />
                    </ImageBackground>
                    <Text style={styles.cardText}>{t("card_shopping")}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}
          {mode === "explore" && !compact && (
            <View style={styles.exploreSection}>
              <Text style={styles.sectionTitle}>{t("explore_nearby")}</Text>
              <View style={styles.grid}>
                <TouchableOpacity style={styles.card}>
                  <ImageBackground
                    source={topDiningImg}
                    style={styles.cardImage}
                    imageStyle={{ borderRadius: 16 }}
                  >
                    <View style={styles.cardOverlay} />
                  </ImageBackground>
                  <Text style={styles.cardText}>{t("card_top_dining")}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.card}>
                  <ImageBackground
                    source={nightlifeImg}
                    style={styles.cardImage}
                    imageStyle={{ borderRadius: 16 }}
                  >
                    <View style={styles.cardOverlay} />
                  </ImageBackground>
                  <Text style={styles.cardText}>{t("card_nightlife")}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.card}>
                  <ImageBackground
                    source={natureImg}
                    style={styles.cardImage}
                    imageStyle={{ borderRadius: 16 }}
                  >
                    <View style={styles.cardOverlay} />
                  </ImageBackground>
                  <Text style={styles.cardText}>{t("card_nature")}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.card}>
                  <ImageBackground
                    source={shoppingImg}
                    style={styles.cardImage}
                    imageStyle={{ borderRadius: 16 }}
                  >
                    <View style={styles.cardOverlay} />
                  </ImageBackground>
                  <Text style={styles.cardText}>{t("card_shopping")}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.card}>
                  <ImageBackground
                    source={cultureImg}
                    style={styles.cardImage}
                    imageStyle={{ borderRadius: 16 }}
                  >
                    <View style={styles.cardOverlay} />
                  </ImageBackground>
                  <Text style={styles.cardText}>{t("card_culture")}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.card}>
                  <ImageBackground
                    source={activityImg}
                    style={styles.cardImage}
                    imageStyle={{ borderRadius: 16 }}
                  >
                    <View style={styles.cardOverlay} />
                  </ImageBackground>
                  <Text style={styles.cardText}>{t("card_activities")}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.card}>
                  <ImageBackground
                    source={foodImg}
                    style={styles.cardImage}
                    imageStyle={{ borderRadius: 16 }}
                  >
                    <View style={styles.cardOverlay} />
                  </ImageBackground>
                  <Text style={styles.cardText}>{t("card_food")}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.card}>
                  <ImageBackground
                    source={socialImg}
                    style={styles.cardImage}
                    imageStyle={{ borderRadius: 16 }}
                  >
                    <View style={styles.cardOverlay} />
                  </ImageBackground>
                  <Text style={styles.cardText}>{t("card_social")}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          {mode === "saved" && !compact && (
            <View style={styles.favMain}>
              <View style={{ paddingVertical: 8, paddingBottom: 12 }}>
                <Text style={styles.favHeadline}>{t("saved_header")}</Text>
                <Text style={styles.favDesc}>{t("saved_desc")}</Text>
              </View>

              <View style={styles.favCardsContainer}>
                <TouchableOpacity
                  style={styles.favCard}
                  onPress={() => {
                    if (saved.home) {
                      router.push({
                        pathname: "/(main)/place",
                        params: {
                          name: "Home",
                          address: saved.home.address,
                          lat: saved.home.lat?.toString(),
                          lng: saved.home.lng?.toString(),
                        },
                      });
                    } else {
                      setModalSlot("home");
                      setModalEditingIndex(null);
                      setModalInitialData({
                        name: "Home",
                        address: "",
                        lat: "",
                        lng: "",
                      });
                      setModalVisible(true);
                    }
                  }}
                >
                  <View style={styles.favCardHeader}>
                    <View style={{ flexDirection: "column", flex: 1 }}>
                      <View style={styles.favTitleRow}>
                        <View style={styles.favIconPlaceholder}>
                          <HomeIcon color={Colors.dark.primary} />
                        </View>
                        <Text
                          style={[styles.favCardTitle, { flexShrink: 1 }]}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {t("card_home")}
                        </Text>
                      </View>
                      <Text
                        style={styles.favCardSub}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {saved.home?.address || t("enter_home")}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.favAddButton}
                      onPress={() => {
                        setModalSlot("home");
                        setModalEditingIndex(null);
                        setModalInitialData({
                          name: "Home",
                          address: saved?.home?.address ?? "",
                          lat: saved?.home?.lat?.toString() ?? "",
                          lng: saved?.home?.lng?.toString() ?? "",
                        });
                        setModalVisible(true);
                      }}
                    >
                      {saved.home ? <EditIcon /> : <AddPlaceIcon />}
                    </TouchableOpacity>
                  </View>
                  {saved.home &&
                    saved.home.lat &&
                    saved.home.lng &&
                    saved.home.address && (
                      <MapSnapshot lat={saved.home.lat} lng={saved.home.lng} />
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.favCard}
                  onPress={() => {
                    if (saved.work) {
                      router.push({
                        pathname: "/(main)/place",
                        params: {
                          name: "Work",
                          address: saved.work.address,
                          lat: saved.work.lat?.toString(),
                          lng: saved.work.lng?.toString(),
                        },
                      });
                    } else {
                      setModalSlot("work");
                      setModalEditingIndex(null);
                      setModalInitialData({
                        name: "Work",
                        address: "",
                        lat: "",
                        lng: "",
                      });
                      setModalVisible(true);
                    }
                  }}
                >
                  <View style={styles.favCardHeader}>
                    <View style={{ flexDirection: "column", flex: 1 }}>
                      <View style={styles.favTitleRow}>
                        <View style={styles.favIconPlaceholder}>
                          <WorkIcon color={Colors.dark.primary} />
                        </View>
                        <Text
                          style={[styles.favCardTitle, { flexShrink: 1 }]}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {t("card_work")}
                        </Text>
                      </View>
                      <Text
                        style={styles.favCardSub}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {saved.work?.address || t("enter_work")}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.favAddButton}
                      onPress={() => {
                        setModalSlot("work");
                        setModalEditingIndex(null);
                        setModalInitialData({
                          name: "Work",
                          address: saved?.work?.address ?? "",
                          lat: saved?.work?.lat?.toString() ?? "",
                          lng: saved?.work?.lng?.toString() ?? "",
                        });
                        setModalVisible(true);
                      }}
                    >
                      {saved.work ? <EditIcon /> : <AddPlaceIcon />}
                    </TouchableOpacity>
                  </View>
                  {saved.work &&
                    saved.work.lat &&
                    saved.work.lng &&
                    saved.work.address && (
                      <MapSnapshot lat={saved.work.lat} lng={saved.work.lng} />
                    )}
                </TouchableOpacity>

                {saved.other.map((place, idx) => {
                  const IconComp =
                    PlaceIcons.find((i) => i.id === place.icon)?.icon ||
                    StarIcon;
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={styles.favCard}
                      onPress={() => {
                        router.push({
                          pathname: "/(main)/place",
                          params: {
                            name: place.name || "",
                            address: place.address,
                            lat: place.lat?.toString() || "",
                            lng: place.lng?.toString() || "",
                          },
                        });
                      }}
                    >
                      <View style={styles.favCardHeader}>
                        <View style={{ flexDirection: "column", flex: 1 }}>
                          <View style={styles.favTitleRow}>
                            <View style={styles.favIconPlaceholder}>
                              <IconComp color={Colors.dark.primary} />
                            </View>
                            <Text
                              style={[styles.favCardTitle, { flexShrink: 1 }]}
                              numberOfLines={1}
                              ellipsizeMode="tail"
                            >
                              {place.name || "Other Place"}
                            </Text>
                          </View>
                          <Text
                            style={styles.favCardSub}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                          >
                            {place.address}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.favAddButton}
                          onPress={() => {
                            setModalSlot("other");
                            setModalEditingIndex(idx);
                            setModalInitialData({
                              name: place.name || "",
                              address: place.address,
                              lat: place.lat?.toString() || "",
                              lng: place.lng?.toString() || "",
                            });
                            setModalVisible(true);
                          }}
                        >
                          <EditIcon />
                        </TouchableOpacity>
                      </View>
                      {place.lat && place.lng && place.address ? (
                        <MapSnapshot lat={place.lat} lng={place.lng} />
                      ) : (
                        <View style={styles.favMapPreview} />
                      )}
                    </TouchableOpacity>
                  );
                })}

                <TouchableOpacity
                  style={styles.favAddPlaceButton}
                  onPress={() => {
                    setModalSlot("other");
                    setModalEditingIndex(null);
                    setModalInitialData({
                      name: "",
                      address: "",
                      lat: "",
                      lng: "",
                    });
                    setModalVisible(true);
                  }}
                >
                  <Text style={styles.favAddPlaceText}>
                    {t("modal_add_place")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {!compact && (
        <View style={styles.bottomNav}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => setMode("explore")}
          >
            <CompassIcon active={mode === "explore"} />
            <Text
              style={[
                styles.navLabel,
                mode === "explore" ? styles.navActive : {},
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {t("mode_explore")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => setMode("search")}
          >
            <SearchIcon active={mode === "search"} />
            <Text
              style={[
                styles.navLabel,
                mode === "search" ? styles.navActive : {},
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {t("mode_search")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => setMode("saved")}
          >
            <BookmarkIcon active={mode === "saved"} />
            <Text
              style={[
                styles.navLabel,
                mode === "saved" ? styles.navActive : {},
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {t("mode_saved")}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <SavePlaceModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setModalEditingIndex(null);
        }}
        slot={modalSlot}
        editingIndex={modalEditingIndex}
        initialName={modalInitialData.name}
        initialAddress={modalInitialData.address}
        initialLat={modalInitialData.lat}
        initialLng={modalInitialData.lng}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#101922" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 44,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  backText: { color: "#fff", fontSize: 20 },
  title: {
    flex: 1,
    color: "#fff",
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
  },
  spacer: { width: 40 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(13,127,242,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  searchArea: { paddingHorizontal: 12 },
  searchBox: {
    height: 56,
    borderRadius: 12,
    backgroundColor: "#12202a",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: { color: "#90adcb", marginRight: 8 },
  input: { flex: 1, color: "#fff", fontSize: 16 },
  chips: { marginBottom: 12 },
  chip: {
    backgroundColor: "#223649",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  chipIcon: {
    marginRight: 8,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  chipLabel: { color: "#fff", fontWeight: "600" },
  section: { marginTop: 8 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  sectionTitle: { color: "#fff", fontSize: 16, fontWeight: "700" },
  clear: { color: "#0d7ff2" },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 12,
  },
  itemIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#223649",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  itemBody: { flex: 1 },
  itemTitle: { color: "#fff", fontWeight: "700" },
  itemSub: { color: "#90adcb", fontSize: 12 },
  itemAction: { color: "#9fb7d3", marginLeft: 8 },
  exploreSection: { marginTop: 16, paddingHorizontal: 12 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: "48%",
    aspectRatio: 16 / 9,
    borderRadius: 16,
    backgroundColor: "#334155",
    marginBottom: 12,
    justifyContent: "flex-end",
    padding: 8,
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 16,
  },
  cardImage: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
  },
  cardText: { color: "#fff", fontWeight: "700", zIndex: 1 },
  resultsList: { marginTop: 8, paddingHorizontal: 12 },
  favMain: { paddingHorizontal: 12, paddingBottom: 12 },
  favHeadline: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "800",
    marginBottom: 8,
  },
  favDesc: { color: "#9fb7d3", fontSize: 16, maxWidth: 280 },
  favCardsContainer: { marginTop: 12, flexDirection: "column" },
  favCard: {
    borderRadius: 12,
    backgroundColor: "#0f1720",
    borderColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    padding: 12,
    overflow: "hidden",
    marginBottom: 12,
  },
  favCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  favTitleRow: { flexDirection: "row", alignItems: "center" },
  favIconPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(13,127,242,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  favCardTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
    marginLeft: 8,
  },
  favCardSub: { color: "#90adcb", fontSize: 14 },
  favAddButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.dark.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  favMapPreview: {
    width: "100%",
    height: 120,
    borderRadius: 12,
    marginTop: 8,
    backgroundColor: "#12202a",
  },
  favAddPlaceButton: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  favAddPlaceText: { color: "#9fb7d3", fontWeight: "600" },
  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "rgba(16,25,34,0.9)",
    paddingVertical: 8,
  },
  navButton: { alignItems: "center" },
  navActive: { color: Colors.dark.primary },
  navIcon: { color: "#fff", fontSize: 20 },
  navLabel: {
    color: "#fff",
    fontSize: 10,
    marginTop: 2,
    textTransform: "uppercase",
    flexShrink: 0,
  },
  scrollContent: { paddingBottom: 64 },
});
