import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  ScrollView,
  Linking,
  Modal,
  Clipboard,
  Vibration,
} from "react-native";
import { Share, TextInput } from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import PlaceDetailsService from "../services/PlaceDetailsService";
import { FavoritesService } from "../services/FavoritesService";
import IleDeFranceRealtimeService from "../services/IleDeFranceMobilite";
import PlusCodeService from "@/services/PlusCodeService";
import TransitStopDrawer from "./TransitStopDrawer";
import Drawer from "./ui/Drawer";
import AProximiteDrawer from "./AProximiteDrawer";

const { height: screenHeight } = Dimensions.get("window");
const DRAWER_HEIGHT = screenHeight * 0.5;

interface Props {
  visible: boolean;
  onClose: () => void;
  onBackToSearch: () => void;
  onNavigate: () => void;
  result: any | null;
  onConfirmOpenRoute?: (result: any) => void;
  onRestoreFollow?: () => void;
  onClearTemporaryMarker?: () => void;
  onStartRoute?: (coordinate: { latitude: number; longitude: number }) => void;
  hasActiveRoute?: boolean;
  onShowLocationPoint?: (show: boolean) => void;
  onOpenTransit?: (result: any) => void;
  onBlockLocationInfo?: (v: boolean) => void;
}

export default function SearchResultDrawer({
  visible,
  onClose,
  onBackToSearch,
  onNavigate,
  result,
  onConfirmOpenRoute,
  onRestoreFollow,
  onClearTemporaryMarker,
  onStartRoute,
  hasActiveRoute = false,
  onShowLocationPoint,
  onOpenTransit,
  onBlockLocationInfo,
}: Props) {
  const handleCloseWithClear = () => {
    try {
      if (onClearTemporaryMarker) onClearTemporaryMarker();
    } catch (e) {}
    try {
      onClose();
    } catch (e) {}
  };
  const [, setDummy] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [details, setDetails] = useState<any | null>(null);
  const [departures, setDepartures] = useState<any[] | null>(null);
  const [departuresError, setDeparturesError] = useState<string | null>(null);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [showTransitDrawer, setShowTransitDrawer] = useState(false);
  const [showNearby, setShowNearby] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [transitDrawerInitialError, setTransitDrawerInitialError] = useState<
    string | null
  >(null);
  const [showAddressCopyModal, setShowAddressCopyModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState<string | null>(null);
  const [reportDetails, setReportDetails] = useState<string>("");

  useEffect(() => {
    setDummy((d) => d);
  }, [visible]);

  useEffect(() => {
    let mounted = true;
    setDetails(null);
    setDepartures(null);
    setDeparturesError(null);

    if (!result || !visible) {
      return;
    }

    (async () => {
      try {
        const isStation =
          (result.amenityType &&
            /station|stop|gare|arrêt|train_station|bus_station|subway_station|tram_station/i.test(
              result.amenityType
            )) ||
          result.type === "train_station" ||
          result.type === "bus_station" ||
          result.type === "subway_station" ||
          result.type === "tram_station" ||
          (result.tags &&
            (result.tags.railway === "station" ||
              result.tags.highway === "bus_stop" ||
              result.tags.public_transport));

        let deps: any[] | null = null;
        if (isStation && result.latitude && result.longitude) {
          let depErrorMsg: string | null = null;
          try {
            deps = await IleDeFranceRealtimeService.fetchDeparturesByCoords(
              result.latitude,
              result.longitude,
              100
            );
          } catch (err: any) {
            deps = null;
            depErrorMsg =
              err?.message || "Erreur lors de la récupération des horaires";
          }
          if (deps === null && !depErrorMsg) {
            depErrorMsg = "Impossible de récupérer les horaires";
          }
          if (mounted) {
            setTransitDrawerInitialError(depErrorMsg);
            try {
              if (onOpenTransit) onOpenTransit(result);
              else handleCloseWithClear();
            } catch (e) {}
            setShowTransitDrawer(true);
            return;
          }
        }

        if (result.latitude && result.longitude) {
          const d = await PlaceDetailsService.fetchByLatLon(
            result.latitude,
            result.longitude,
            50
          );
          if (mounted && d) {
            setDetails(d);
          }
        }
      } catch (e) {
        
      }
    })();

    return () => {
      mounted = false;
    };
  }, [result, visible, refreshKey]);

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
  };

  const toggleFavorite = async () => {
    if (!result) return;
    try {
      const favItem = {
        id: `place_${result.osm_id || result.place_id || result.lat}_${
          result.lon
        }`,
        title: title,
        subtitle: subtitle || "",
        latitude: result.latitude,
        longitude: result.longitude,
        type: "place",
      } as any;
      const newState = await FavoritesService.toggleFavorite(favItem);
      setIsFavorite(newState);
    } catch (e) {}
  };

  if (!result) return null;

  const firstDisplayNamePart =
    typeof result.display_name === "string" && result.display_name.includes(",")
      ? result.display_name.split(",")[0].trim()
      : result.display_name;
  const title =
    details?.title ||
    result.tags?.name ||
    (result as any).name ||
    firstDisplayNamePart ||
    result.title ||
    "Lieu";
  const subtitle =
    details?.description || result.subtitle || result.tags?.amenity || "";
  const address =
    result.display_name || result.tags?.address || result.subtitle || "";

  const linesList: string[] = (() => {
    if (departures && departures.length > 0) {
      return Array.from(
        new Set(
          departures
            .map((d: any) =>
              String(
                d.lineRef ||
                  d.name ||
                  d.raw?.MonitoredVehicleJourney?.PublishedLineName ||
                  ""
              ).trim()
            )
            .filter(Boolean)
        )
      );
    }
    const tagCandidates =
      result.tags?.routes ||
      result.tags?.route ||
      result.tags?.lines ||
      result.tags?.ref ||
      details?.routes;
    if (!tagCandidates) return [];
    if (Array.isArray(tagCandidates)) return tagCandidates.map(String);
    return String(tagCandidates)
      .split(/[,;|\\/]/)
      .map((s: string) => s.trim())
      .filter(Boolean);
  })();

  const handleOpenTransitDrawer = () => {
    setTransitDrawerInitialError(departuresError);
    try {
      if (onClearTemporaryMarker) onClearTemporaryMarker();
    } catch (e) {}
    try {
      if (onOpenTransit) onOpenTransit(result);
      else onClose();
    } catch (e) {}
    if (onBlockLocationInfo) onBlockLocationInfo(true);
    setShowTransitDrawer(true);
  };

  const phone = details?.phone || result.tags?.phone || null;
  const website = details?.website || result.tags?.website || null;
  const opening = details?.opening_hours || result.tags?.opening_hours || null;
  const photos = details?.photos || result.photos || null;

  const coords =
    result.latitude != null && result.longitude != null
      ? `${result.latitude.toFixed(6)}, ${result.longitude.toFixed(6)}`
      : "";
  const usefulTags = {
    operator: result.tags?.operator || details?.operator,
    brand: result.tags?.brand || details?.brand,
    capacity: result.tags?.capacity || details?.capacity,
    routes: result.tags?.routes || details?.routes,
  };

  const formatCoordinatesDD = (lat: number, lon: number): string => {
    return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
  };

  const formatCoordinatesDMS = (lat: number, lon: number): string => {
    const formatDMS = (coord: number, isLatitude: boolean): string => {
      const abs = Math.abs(coord);
      const degrees = Math.floor(abs);
      const minutes = Math.floor((abs - degrees) * 60);
      const seconds = ((abs - degrees - minutes / 60) * 3600).toFixed(3);
      const direction = isLatitude
        ? coord >= 0
          ? "N"
          : "S"
        : coord >= 0
        ? "E"
        : "W";
      return `${degrees}°${minutes}'${seconds}"${direction}`;
    };
    return `${formatDMS(lat, true)} ${formatDMS(lon, false)}`;
  };

  const formatCoordinatesDMM = (lat: number, lon: number): string => {
    const formatDMM = (coord: number, isLatitude: boolean): string => {
      const abs = Math.abs(coord);
      const degrees = Math.floor(abs);
      const minutes = ((abs - degrees) * 60).toFixed(4);
      const direction = isLatitude
        ? coord >= 0
          ? "N"
          : "S"
        : coord >= 0
        ? "E"
        : "W";
      return `${degrees}°${minutes}'${direction}`;
    };
    return `${formatDMM(lat, true)} ${formatDMM(lon, false)}`;
  };

  const transitDrawerCoordinate =
    result && result.latitude != null && result.longitude != null
      ? { latitude: result.latitude, longitude: result.longitude }
      : null;

  const handleCopyCoordinates = (format: "DD" | "DMS" | "DMM") => {
    if (result.latitude == null || result.longitude == null) return;
    let formatted = "";
    switch (format) {
      case "DD":
        formatted = formatCoordinatesDD(result.latitude, result.longitude);
        break;
      case "DMS":
        formatted = formatCoordinatesDMS(result.latitude, result.longitude);
        break;
      case "DMM":
        formatted = formatCoordinatesDMM(result.latitude, result.longitude);
        break;
    }
    try {
      Clipboard.setString(formatted);
      Vibration.vibrate(50);
    } catch (e) {}
    setShowCopyModal(false);
  };

  const handleCopyAddress = async (mode: "short" | "full") => {
    const text =
      mode === "short" ? firstDisplayNamePart || title : address || title;
    try {
      Clipboard.setString(text);
      Vibration.vibrate(50);
    } catch (e) {}
    setShowAddressCopyModal(false);
  };

  const reportReasons = [
    "Lieu manquant",
    "Ajouter/modifier une ligne ou un itinéraire",
    "Informations incorrectes ou manquantes",
    "Emplacement du repère incorrect",
  ];
  const submitReport = () => {
    Vibration.vibrate(50);
    setShowReportModal(false);
    setReportReason(null);
    setReportDetails("");
  };

  const handleShare = async () => {
    try {
      const message = `${title}\n${address}\n${coords}`;
      await Share.share({ message });
    } catch (e) {}
  };

  const handleCopyPlusCode = () => {
    if (result.latitude == null || result.longitude == null) return;
    try {
      const code = PlusCodeService.encode(
        result.latitude,
        result.longitude,
        10
      );
      Clipboard.setString(code);
      Vibration.vibrate(50);
    } catch (e) {}
    setShowCopyModal(false);
  };

  return (
    <>
      <Drawer
        id="search-result-drawer"
        visible={visible}
        title={title}
        onClose={handleCloseWithClear}
        onRefresh={handleRefresh}
        height={DRAWER_HEIGHT}
        showCloseButton={false}
        headerActions={
          <>
            <TouchableOpacity
              onPress={handleCloseWithClear}
              style={styles.iconButton}
            >
              <Icon name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleRefresh}
              onLongPress={handleCloseWithClear}
              style={styles.iconButton}
            >
              <Icon name="refresh" size={24} color="#333" />
            </TouchableOpacity>
          </>
        }
      >
        <ScrollView style={styles.content}>
          {address ? (
            <View style={{ marginBottom: 8 }}>
              <Text style={{ color: "#666", fontSize: 12 }}>Adresse</Text>
              <Text style={{ color: "#333", fontSize: 14 }}>{address}</Text>
            </View>
          ) : null}

          {coords ? (
            <View style={{ marginBottom: 8 }}>
              <Text style={{ color: "#666", fontSize: 12 }}>Coordonnées</Text>
              <TouchableOpacity onPress={() => setShowCopyModal(true)}>
                <Text style={{ color: "#333", fontSize: 14 }}>{coords}</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {Object.keys(usefulTags).some((k) => !!(usefulTags as any)[k]) && (
            <View style={{ marginBottom: 8 }}>
              <Text style={{ color: "#666", fontSize: 12, marginBottom: 4 }}>
                Détails
              </Text>
              {Object.entries(usefulTags).map(([k, v]) =>
                v ? (
                  <View
                    key={k}
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      paddingVertical: 4,
                    }}
                  >
                    <Text style={{ color: "#666", fontSize: 13 }}>{k}</Text>
                    <Text style={{ color: "#333", fontSize: 13 }}>
                      {String(v)}
                    </Text>
                  </View>
                ) : null
              )}
            </View>
          )}
          {website && (
            <TouchableOpacity onPress={() => Linking.openURL(website)}>
              <Text style={styles.link}>{website}</Text>
            </TouchableOpacity>
          )}
          {phone && (
            <TouchableOpacity onPress={() => Linking.openURL(`tel:${phone}`)}>
              <Text style={styles.phone}>{phone}</Text>
            </TouchableOpacity>
          )}
          {opening && (
            <View style={styles.openingRow}>
              <Icon name="access-time" size={18} color="#666" />
              <Text style={styles.openingText}>{opening}</Text>
            </View>
          )}

          {departures && departures.length > 0 && (
            <View style={{ marginBottom: 8 }}>
              <Text style={{ color: "#666", fontSize: 12, marginBottom: 4 }}>
                Prochains départs
              </Text>
              {departures.map((d: any, i: number) => (
                <View
                  key={i}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    paddingVertical: 6,
                  }}
                >
                  <Text style={{ fontWeight: "600" }}>{d.line}</Text>
                  <Text style={{ color: "#666" }}>{d.destination}</Text>
                  <Text style={{ color: "#333" }}>
                    {d.minutes != null
                      ? d.minutes <= 0
                        ? "Maintenant"
                        : `${d.minutes} min`
                      : "—"}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {photos && photos.length > 0
            ? photos.map((p: any, i: number) => (
                <Image key={i} source={{ uri: p.url }} style={styles.image} />
              ))
            : null}

          <View style={styles.actionsRowHorizontal}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                try {
                  if (onClearTemporaryMarker) onClearTemporaryMarker();
                } catch (e) {}
                if (onNavigate) onNavigate();
              }}
            >
              <Icon name="directions" size={20} color="#fff" />
              <Text style={styles.actionText}>Naviguer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                try {
                  if (onClearTemporaryMarker) onClearTemporaryMarker();
                } catch (e) {}
                setShowNearby(true);
                try {
                  if (onBlockLocationInfo) onBlockLocationInfo(true);
                } catch (e) {}
              }}
            >
              <Icon name="near-me" size={20} color="#fff" />
              <Text style={styles.actionText}>À proximité</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={async () => {
                try {
                  const message = `${title}\n${address}\n${coords}`;
                  await Share.share({ message });
                } catch (e) {}
              }}
            >
              <Icon name="share" size={20} color="#fff" />
              <Text style={styles.actionText}>Partager</Text>
            </TouchableOpacity>
          </View>
          <Modal
            visible={showCopyModal}
            transparent
            animationType="fade"
            onRequestClose={() => setShowCopyModal(false)}
          >
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "rgba(0,0,0,0.4)",
              }}
            >
              <View
                style={{
                  width: "80%",
                  backgroundColor: "#fff",
                  borderRadius: 8,
                  padding: 12,
                }}
              >
                <Text style={{ fontWeight: "600", marginBottom: 8 }}>
                  Copier les coordonnées
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    handleCopyCoordinates("DD");
                  }}
                  style={{ paddingVertical: 10 }}
                >
                  <Text>Degrés décimaux (DD)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    handleCopyCoordinates("DMS");
                  }}
                  style={{ paddingVertical: 10 }}
                >
                  <Text>Degrés Minutes Secondes (DMS)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    handleCopyCoordinates("DMM");
                  }}
                  style={{ paddingVertical: 10 }}
                >
                  <Text>Degrés Minutes décimales (DMM)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    handleCopyPlusCode();
                  }}
                  style={{ paddingVertical: 10 }}
                >
                  <Text>Copier le Plus Code</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowCopyModal(false)}
                  style={{ paddingVertical: 10, marginTop: 6 }}
                >
                  <Text style={{ color: "#007AFF", textAlign: "right" }}>
                    Annuler
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
          <Modal
            visible={showAddressCopyModal}
            transparent
            animationType="fade"
            onRequestClose={() => setShowAddressCopyModal(false)}
          >
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "rgba(0,0,0,0.4)",
              }}
            >
              <View
                style={{
                  width: "80%",
                  backgroundColor: "#fff",
                  borderRadius: 8,
                  padding: 12,
                }}
              >
                <Text style={{ fontWeight: "600", marginBottom: 8 }}>
                  Copier l'adresse
                </Text>
                <TouchableOpacity
                  onPress={() => handleCopyAddress("short")}
                  style={{ paddingVertical: 10 }}
                >
                  <Text>Version courte</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleCopyAddress("full")}
                  style={{ paddingVertical: 10 }}
                >
                  <Text>Version complète</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowAddressCopyModal(false)}
                  style={{ paddingVertical: 10, marginTop: 6 }}
                >
                  <Text style={{ color: "#007AFF", textAlign: "right" }}>
                    Annuler
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          <Modal
            visible={showReportModal}
            transparent
            animationType="slide"
            onRequestClose={() => setShowReportModal(false)}
          >
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "rgba(0,0,0,0.4)",
              }}
            >
              <View
                style={{
                  width: "90%",
                  backgroundColor: "#fff",
                  borderRadius: 8,
                  padding: 12,
                }}
              >
                <Text
                  style={{ fontWeight: "700", fontSize: 16, marginBottom: 8 }}
                >
                  Signaler un problème
                </Text>
                {reportReasons.map((r) => (
                  <TouchableOpacity
                    key={r}
                    onPress={() => setReportReason(r)}
                    style={{
                      paddingVertical: 8,
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                  >
                    <View
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 9,
                        borderWidth: 1,
                        borderColor: reportReason === r ? "#007AFF" : "#CCC",
                        marginRight: 8,
                        backgroundColor:
                          reportReason === r ? "#007AFF" : "#FFF",
                      }}
                    />
                    <Text>{r}</Text>
                  </TouchableOpacity>
                ))}
                <TextInput
                  value={reportDetails}
                  onChangeText={setReportDetails}
                  placeholder="Détails (optionnel)"
                  style={{
                    borderWidth: 1,
                    borderColor: "#EEE",
                    padding: 8,
                    borderRadius: 6,
                    marginTop: 8,
                    minHeight: 80,
                  }}
                  multiline
                />
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "flex-end",
                    marginTop: 12,
                  }}
                >
                  <TouchableOpacity
                    onPress={() => setShowReportModal(false)}
                    style={{ marginRight: 12 }}
                  >
                    <Text style={{ color: "#666" }}>Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={submitReport}>
                    <Text style={{ color: "#007AFF", fontWeight: "600" }}>
                      Envoyer
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </ScrollView>
      </Drawer>
      <AProximiteDrawer
        visible={showNearby}
        coordinate={transitDrawerCoordinate}
        radius={500}
        amenityType={"*"}
        onClose={() => {
          setShowNearby(false);
          try {
            if (onBlockLocationInfo) onBlockLocationInfo(false);
          } catch (e) {}
        }}
        onStartRoute={onStartRoute}
        onShowLocationPoint={onShowLocationPoint}
      />
      <TransitStopDrawer
        visible={showTransitDrawer}
        coordinate={transitDrawerCoordinate}
        onClearTemporaryMarker={onClearTemporaryMarker}
        onClose={() => {
          try {
            if (onClearTemporaryMarker) onClearTemporaryMarker();
          } catch (e) {}
          setShowTransitDrawer(false);
          setTransitDrawerInitialError(null);
          if (onBlockLocationInfo) onBlockLocationInfo(false);
        }}
        onStartRoute={onStartRoute || (() => {})}
        hasActiveRoute={hasActiveRoute}
        onShowLocationPoint={onShowLocationPoint}
        initialError={transitDrawerInitialError}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    height: DRAWER_HEIGHT,
    backgroundColor: "#fff",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    elevation: 8,
    zIndex: 50,
  },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
  },
  iconButton: { padding: 6 },
  title: { fontSize: 16, fontWeight: "600", flex: 1, textAlign: "center" },
  content: { padding: 12 },
  link: { color: "#007AFF", marginBottom: 8 },
  phone: { color: "#007AFF", marginBottom: 8 },
  openingRow: { flexDirection: "row", alignItems: "center", marginVertical: 8 },
  openingText: { marginLeft: 8, color: "#444" },
  image: { width: "100%", height: 160, borderRadius: 8, marginBottom: 8 },
  actionsRow: { flexDirection: "row", justifyContent: "center", marginTop: 12 },
  navigateButton: {
    flexDirection: "row",
    backgroundColor: "#007AFF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  navigateText: { color: "#fff", marginLeft: 8 },
  actionsRowHorizontal: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: "#007AFF",
    marginHorizontal: 6,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  actionText: { color: "#fff", marginLeft: 8 },
});
