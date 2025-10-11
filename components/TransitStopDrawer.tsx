import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Vibration,
  Modal,
  Clipboard,
  ScrollView,
  Animated,
} from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { FavoritesService } from "../services/FavoritesService";
import PrimTransportService from "../services/IleDeFranceMobilite";
import PlusCodeService from "@/services/PlusCodeService";
import Collapsable from "./ui/Collapsable";
import Drawer from "./ui/Drawer";
import { Portal } from '@gorhom/portal';
import { SCREEN_HEIGHT } from "@gorhom/bottom-sheet";

interface Coordinate {
  latitude: number;
  longitude: number;
}

interface TransitStop {
  id: string;
  name: string;
  lines: Array<{
    name: string;
    color?: string;
    textColor?: string;
    routeData?: any;
    mode?: string;
    operator?: string;
  }>;
  nextDepartures: Array<{
    lineRef: string;
    destination: string;
    minutesUntil: number | null;
    expectedTime: Date | null;
    platform?: string | null;
    delay?: number;
    realtime?: boolean;
    lineColor?: string;
    lineTextColor?: string;
  }>;
}

interface TransitStopDrawerProps {
  visible: boolean;
  coordinate: Coordinate | null;
  onClose: () => void;
  onStartRoute: (coordinate: Coordinate) => void;
  hasActiveRoute?: boolean;
  onShowLocationPoint?: (show: boolean) => void;
  onClearTemporaryMarker?: () => void;
  initialError?: string | null;
}

export default function TransitStopDrawer({
  visible,
  coordinate,
  onClose,
  onStartRoute,
  hasActiveRoute = false,
  onShowLocationPoint,
  onClearTemporaryMarker,
  initialError = null,
}: TransitStopDrawerProps) {
  const [transitStop, setTransitStop] = useState<TransitStop | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawStops, setRawStops] = useState<any | null>(null);
  const [rawDepartures, setRawDepartures] = useState<any | null>(null);
  const [showRouteAlert, setShowRouteAlert] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [stopDetails, setStopDetails] = useState<any | null>(null);
  const [selectedLine, setSelectedLine] = useState<any | null>(null);
  const [showLineModal, setShowLineModal] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const modalAnim = useRef(new Animated.Value(0)).current;

  const lastRequestTime = useRef<number>(0);
  const prevCoordRef = useRef<Coordinate | null>(null);

  const distanceMeters = (a: Coordinate, b: Coordinate) => {
    const toRad = (v: number) => (v * Math.PI) / 180;
    const R = 6371000;
    const dLat = toRad(b.latitude - a.latitude);
    const dLon = toRad(b.longitude - a.longitude);
    const lat1 = toRad(a.latitude);
    const lat2 = toRad(b.latitude);
    const sinDLat = Math.sin(dLat / 2);
    const sinDLon = Math.sin(dLon / 2);
    const aa =
      sinDLat * sinDLat + sinDLon * sinDLon * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
    return R * c;
  };

  const fetchTransitStopInfo = async (coord: Coordinate) => {
    setLoading(true);
    setError(null);
    setTransitStop(null);

    try {
      const stops = await PrimTransportService.fetchStopsNear(
        coord.latitude,
        coord.longitude,
        200,
        6
      );
      setRawStops(stops);
      if (stops === null) {
        setError(
          "Erreur lors de la récupération des informations de transport"
        );
        setTransitStop(null);
        return;
      }

      if (!Array.isArray(stops) || stops.length === 0) {
        setError("Aucun arrêt de transport trouvé à proximité");
        setTransitStop(null);
        return;
      }

      const primaryStop = stops[0];
      const stopId = primaryStop.stop_id || String(primaryStop.id || "");

      if (!stopId) {
        setError("Impossible de récupérer l'ID de l'arrêt");
        setTransitStop(null);
        return;
      }

      const stopInfo = await PrimTransportService.fetchStopById(stopId, true);
      setStopDetails(stopInfo);
      setRawDepartures(stopInfo?.departures);

      if (!stopInfo) {
        setError("Erreur lors de la récupération des détails de l'arrêt");
        setTransitStop(null);
        return;
      }

      const stopName = stopInfo.stop_name || "Arrêt de transport";

      let nextDeps: Array<{
        lineRef: string;
        destination: string;
        minutesUntil: number | null;
        expectedTime: Date | null;
        platform?: string | null;
        realtime?: boolean;
        lineColor?: string;
        lineTextColor?: string;
      }> = [];

      if (stopInfo.departures && Array.isArray(stopInfo.departures)) {
        const now = new Date();
        nextDeps = stopInfo.departures
          .map((dep: any) => {
            const departureTime = dep.departure_datetime || dep.arrival_datetime;
            let expectedTime: Date | null = null;
            let minutesUntil: number | null = null;

            if (departureTime) {
              try {
                const match = departureTime.match(/^(.+)T(\d{2}:\d{2}:\d{2})$/);
                if (match) {
                  const dateStr = match[1];
                  const timeStr = match[2];
                  const baseDate = new Date(dateStr);
                  const [hours, minutes, seconds] = timeStr.split(':').map(Number);
                  baseDate.setHours(hours, minutes, seconds, 0);
                  expectedTime = baseDate;
                } else {
                  expectedTime = new Date(departureTime);
                }
                
                if (!isNaN(expectedTime.getTime())) {
                  minutesUntil = Math.round((expectedTime.getTime() - now.getTime()) / 60000);
                }
              } catch (e) {
                console.warn('Failed to parse departure time:', departureTime);
              }
            }

            return {
              lineRef: dep?.line_info?.short_name || dep?.line_info?.route_id || "",
              destination: dep?.trip_headsign || "",
              minutesUntil,
              expectedTime,
              platform: dep?.platform || null,
              realtime: dep?.realtime || false,
              lineColor: dep?.line_info?.color,
              lineTextColor: dep?.line_info?.text_color,
            };
          })
          .filter((dep: any) => dep.lineRef && dep.destination)
          .sort((a: any, b: any) => (a.minutesUntil || 0) - (b.minutesUntil || 0))
          .slice(0, 50);
      }

      let finalLines: Array<{
        name: string;
        color?: string;
        textColor?: string;
        routeData?: any;
        mode?: string;
        operator?: string;
      }> = [];

      const linesMap = new Map<
        string,
        { 
          name: string; 
          color?: string; 
          textColor?: string; 
          routeData?: any;
          mode?: string;
          operator?: string;
        }
      >();

      if (stopInfo?.lines && Array.isArray(stopInfo.lines)) {
        stopInfo.lines.forEach((line: any) => {
          const lineName = line?.line_name ?? line?.short_name ?? line?.route_id ?? "";
          if (lineName) {
            linesMap.set(lineName, {
              name: lineName,
              color: line?.color,
              textColor: line?.text_color,
              mode: line?.mode,
              operator: line?.operator_name,
              routeData: line,
            });
          }
        });
      }

      if (stopInfo?.routes && Array.isArray(stopInfo.routes)) {
        stopInfo.routes.forEach((route: any) => {
          const routeName =
            route?.short_name ?? route?.long_name ?? route?.route_id ?? "";
          if (routeName && !linesMap.has(routeName)) {
            linesMap.set(routeName, {
              name: routeName,
              color: route?.color,
              textColor: route?.text_color,
              mode: route?.mode,
              operator: route?.operator_name,
              routeData: route,
            });
          }
        });
      }

      nextDeps.forEach((dep) => {
        if (!linesMap.has(dep.lineRef) && dep.lineRef) {
          linesMap.set(dep.lineRef, {
            name: dep.lineRef,
            color: dep.lineColor,
            textColor: dep.lineTextColor,
          });
        }
      });

      finalLines = Array.from(linesMap.values());

      setTransitStop({
        id: stopId || String(Date.now()),
        name: stopName,
        lines: finalLines,
        nextDepartures: nextDeps,
      });
    } catch (err) {
      setError("Erreur lors de la récupération des informations de transport");
    } finally {
      setLoading(false);
    }
  };

  const refreshTransitInfo = async () => {
    if (!coordinate) return;
    setRefreshing(true);
    await fetchTransitStopInfo(coordinate);
    setRefreshing(false);
  };

  useEffect(() => {
    const MIN_FETCH_INTERVAL = 5000;
    const MIN_DISTANCE_METERS = 25;

    if (visible && coordinate) {
      const now = Date.now();
      const prev = prevCoordRef.current;
      const dist = prev ? distanceMeters(prev, coordinate) : Infinity;

      if (
        now - lastRequestTime.current > MIN_FETCH_INTERVAL ||
        dist > MIN_DISTANCE_METERS
      ) {
        lastRequestTime.current = now;
        prevCoordRef.current = {
          latitude: coordinate.latitude,
          longitude: coordinate.longitude,
        };
        fetchTransitStopInfo(coordinate);
        }
    }
  }, [visible]);

  useEffect(() => {
    if (visible && coordinate && transitStop) {
      const checkFavorite = async () => {
        const id = `transit_${transitStop.id}`;
        const isFav = await FavoritesService.isFavorite(id);
        setIsFavorite(isFav);
      };
      checkFavorite();
    }
  }, [visible, transitStop]);

  useEffect(() => {
    if (showLineModal) {
      setModalVisible(true);
      Animated.timing(modalAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(modalAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setModalVisible(false);
      });
    }
  }, [showLineModal, modalAnim]);

  useEffect(() => {
    if (!visible || !transitStop) return;

    const hasImminentDeparture = transitStop.nextDepartures.some((dep) => {
      if (!dep.expectedTime) return false;
      const minutes = Math.round(
        (dep.expectedTime.getTime() - Date.now()) / 60000
      );
      return minutes === 0;
    });

    const updateInterval = hasImminentDeparture ? 1000 : 10000;

    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, updateInterval);

    return () => clearInterval(interval);
  }, [visible, transitStop]);

  const handleStartRoutePress = () => {
    Vibration.vibrate(50);
    if (!coordinate) return;

    if (hasActiveRoute) {
      setShowRouteAlert(true);
    } else {
      onStartRoute(coordinate);
    }
  };

  const handleConfirmNewRoute = () => {
    Vibration.vibrate(100);
    if (coordinate) {
      setShowRouteAlert(false);
      onStartRoute(coordinate);
    }
  };

  const handleCancelNewRoute = () => {
    Vibration.vibrate(50);
    setShowRouteAlert(false);
  };

  const handleCloseWithVibration = () => {
    Vibration.vibrate(50);

    if (onShowLocationPoint) {
      onShowLocationPoint(false);
    }

    try {
      if ((typeof (onClearTemporaryMarker as any)) === "function") {
        (onClearTemporaryMarker as any)();
      }
    } catch (e) {}

    onClose();
  };

  const formatCoordinatesDD = (lat: number, lon: number): string => {
    return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
  };

  const formatCoordinatesDMS = (lat: number, lon: number): string => {
    const formatDMS = (coord: number, isLat: boolean) => {
      const abs = Math.abs(coord);
      const degrees = Math.floor(abs);
      const minutes = Math.floor((abs - degrees) * 60);
      const seconds = ((abs - degrees) * 60 - minutes) * 60;
      const direction = isLat
        ? coord >= 0
          ? "N"
          : "S"
        : coord >= 0
        ? "E"
        : "W";
      return `${degrees}°${minutes}'${seconds.toFixed(3)}"${direction}`;
    };
    return `${formatDMS(lat, true)} ${formatDMS(lon, false)}`;
  };

  const formatCoordinatesDMM = (lat: number, lon: number): string => {
    const formatDMM = (coord: number, isLat: boolean) => {
      const abs = Math.abs(coord);
      const degrees = Math.floor(abs);
      const minutes = (abs - degrees) * 60;
      const direction = isLat
        ? coord >= 0
          ? "N"
          : "S"
        : coord >= 0
        ? "E"
        : "W";
      return `${degrees}°${minutes.toFixed(4)}'${direction}`;
    };
    return `${formatDMM(lat, true)} ${formatDMM(lon, false)}`;
  };

  const handleCopyCoordinates = async (format: "DD" | "DMS" | "DMM") => {
    if (!coordinate) return;

    let text = "";
    switch (format) {
      case "DD":
        text = formatCoordinatesDD(coordinate.latitude, coordinate.longitude);
        break;
      case "DMS":
        text = formatCoordinatesDMS(coordinate.latitude, coordinate.longitude);
        break;
      case "DMM":
        text = formatCoordinatesDMM(coordinate.latitude, coordinate.longitude);
        break;
    }

    await Clipboard.setString(text);
    setShowCopyModal(false);
    Vibration.vibrate(50);
  };

  const handleCopyPlusCode = async () => {
    if (!coordinate) return;
    const plusCode = PlusCodeService.encode(
      coordinate.latitude,
      coordinate.longitude,
      10
    );
    await Clipboard.setString(plusCode);
    setShowCopyModal(false);
    Vibration.vibrate(50);
  };

  if (!visible) return null;

  const drawerTitle = transitStop?.name || "Arrêt de transport";

  const headerActions = (
    <TouchableOpacity
      style={styles.favoriteButton}
      onPress={async () => {
        if (!transitStop || !coordinate) return;
        Vibration.vibrate(50);
        const favItem = {
          id: `transit_${transitStop.id}`,
          title: transitStop.name,
          subtitle: `Arrêt • ${transitStop.lines
            .map((l) => l.name)
            .join(", ")}`,
          latitude: coordinate.latitude,
          longitude: coordinate.longitude,
          type: "transit" as const,
        };
        const newState = await FavoritesService.toggleFavorite(favItem);
        setIsFavorite(newState);
      }}
    >
      <Icon
        name={isFavorite ? "star" : "star-border"}
        size={22}
        color="#FFB300"
      />
    </TouchableOpacity>
  );
  return (
    <>
      <Drawer
        id="transit-stop-drawer"
        visible={visible}
        height={SCREEN_HEIGHT * 0.6}
        title={drawerTitle}
        icon={
          (() => {
            try {
              const line = transitStop?.lines && transitStop.lines.length > 0 ? transitStop.lines[0] : null;
              const mode = line?.mode ? String(line.mode).toLowerCase() : "";
              const name = line?.name ? String(line.name).toLowerCase() : "";
              if (mode.includes("bus") || name.includes("bus")) return <Icon name="directions-bus" size={20} color="#333" />;
              if (mode.includes("tram") || name.includes("tram")) return <Icon name="tram" size={20} color="#333" />;
              if (mode.includes("metro") || name.includes("metro") || mode.includes("subway")) return <Icon name="subway" size={20} color="#333" />;
              if (mode.includes("rail") || name.includes("train") || name.includes("rail")) return <Icon name="train" size={20} color="#333" />;
            } catch (e) {}
            return <Icon name="directions-transit" size={20} color="#333" />;
          })()
        }
        subtitle="Île-de-France Mobilités"
        onClose={handleCloseWithVibration}
        onRefresh={refreshTransitInfo}
        headerActions={headerActions}
      >
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>
              Chargement des informations...
            </Text>
          </View>
        )}

        {(error || initialError) && (
          <View style={styles.errorContainer}>
            <Icon name="error-outline" size={48} color="#FF3B30" />
            <Text style={styles.errorText}>{error || initialError}</Text>
            {rawStops ? (
              <View style={{ marginTop: 8 }}>
                <Text
                  style={{ color: "#333", fontSize: 12, fontWeight: "600" }}
                >
                  Raw stops response:
                </Text>
                <ScrollView
                  style={{
                    maxHeight: 120,
                    backgroundColor: "#f7f7f7",
                    padding: 8,
                    marginTop: 6,
                  }}
                >
                  <Text style={{ fontSize: 11 }}>
                    {JSON.stringify(rawStops, null, 2)}
                  </Text>
                </ScrollView>
              </View>
            ) : null}
            {rawDepartures ? (
              <View style={{ marginTop: 8 }}>
                <Text
                  style={{ color: "#333", fontSize: 12, fontWeight: "600" }}
                >
                  Raw departures response:
                </Text>
                <ScrollView
                  style={{
                    maxHeight: 140,
                    backgroundColor: "#f7f7f7",
                    padding: 8,
                    marginTop: 6,
                  }}
                >
                  <Text style={{ fontSize: 11 }}>
                    {JSON.stringify(rawDepartures, null, 2)}
                  </Text>
                </ScrollView>
              </View>
            ) : null}
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                if (coordinate) fetchTransitStopInfo(coordinate);
              }}
            >
              <Text style={styles.retryText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        )}

        {transitStop && !loading && (
          <View style={styles.infoContainer}>
            <View style={styles.linesContainer}>
              <Text style={styles.linesTitle}>Lignes:</Text>
              <View style={styles.linesGrid}>
                {transitStop.lines.map((line, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => {
                      Vibration.vibrate(50);
                      setSelectedLine(line);
                      setShowLineModal(true);
                    }}
                  >
                    <View
                      style={[
                        styles.lineChip,
                        line.color && { backgroundColor: `#${line.color}` },
                      ]}
                    >
                      <Text
                        style={[
                          styles.lineText,
                          line.textColor && { color: `#${line.textColor}` },
                        ]}
                      >
                        {line.name}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.departuresContainer}>
              <Text style={styles.departuresTitle}>Prochains départs:</Text>
              {transitStop.nextDepartures.length > 0 ? (
                <>
                  {(() => {
                    const futureDepartures: any[] = [];
                    const passedDepartures: any[] = [];

                    transitStop.nextDepartures.forEach((departure, index) => {
                      const calculatedMinutes = departure.expectedTime
                        ? Math.round(
                            (departure.expectedTime.getTime() - currentTime) /
                              60000
                          )
                        : departure.minutesUntil;

                      const calculatedSeconds = departure.expectedTime
                        ? Math.round(
                            (departure.expectedTime.getTime() - currentTime) /
                              1000
                          )
                        : null;

                      let displayText = "-";
                      let isPassed = false;

                      const formatTime = (totalMinutes: number) => {
                        const hours = Math.floor(totalMinutes / 60);
                        const minutes = totalMinutes % 60;
                        if (hours > 0) {
                          return minutes > 0
                            ? `${hours}h${minutes}min`
                            : `${hours}h`;
                        }
                        return `${minutes} min`;
                      };

                      const getDayLabel = (minutesFromNow: number) => {
                        const daysFromNow = Math.floor(minutesFromNow / (60 * 24));
                        if (daysFromNow === 1) {
                          const dayNames = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
                          const tomorrow = new Date(currentTime + 24 * 60 * 60 * 1000);
                          const dayName = dayNames[tomorrow.getDay()];
                          return `Demain (${dayName})`;
                        } else if (daysFromNow === 2) {
                          const dayNames = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
                          const afterTomorrow = new Date(currentTime + 2 * 24 * 60 * 60 * 1000);
                          const dayName = dayNames[afterTomorrow.getDay()];
                          return `Après-demain (${dayName})`;
                        } else if (daysFromNow > 2) {
                          return `Dans ${daysFromNow} jours`;
                        }
                        return null;
                      };

                      if (calculatedMinutes !== null) {
                        if (calculatedMinutes < 0) {
                          isPassed = true;
                          const minutesAgo = Math.abs(calculatedMinutes);
                          displayText =
                            minutesAgo === 0
                              ? "Passé à l'instant"
                              : minutesAgo === 1
                              ? "Passé il y a 1 min"
                              : `Passé il y a ${formatTime(minutesAgo)}`;
                        } else if (calculatedMinutes === 0) {
                          if (
                            calculatedSeconds !== null &&
                            calculatedSeconds > 0 &&
                            calculatedSeconds < 60
                          ) {
                            displayText = `Imminent (${calculatedSeconds}s)`;
                          } else {
                            displayText = "Maintenant";
                          }
                        } else if (calculatedMinutes === 1) {
                          displayText = "1 min";
                        } else if (calculatedMinutes >= 60 * 24) {
                          const dayLabel = getDayLabel(calculatedMinutes);
                          if (dayLabel) {
                            displayText = dayLabel;
                          } else {
                            displayText = formatTime(calculatedMinutes);
                          }
                        } else {
                          displayText = formatTime(calculatedMinutes);
                        }
                      }

                      const borderColor = departure.realtime
                        ? "#007AFF"
                        : "#CCCCCC";
                      const realtimeLabel = departure.realtime
                        ? ""
                        : " (horaire prévu)";

                      const departureElement = (
                        <View
                          key={index}
                          style={[
                            styles.departureItem,
                            { borderLeftColor: borderColor },
                          ]}
                        >
                          <View style={styles.departureHeader}>
                            <View
                              style={[
                                styles.departureLineChip,
                                departure.lineColor && {
                                  backgroundColor: `#${departure.lineColor}`,
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.departureLineText,
                                  departure.lineTextColor && {
                                    color: `#${departure.lineTextColor}`,
                                  },
                                ]}
                              >
                                {departure.lineRef}
                              </Text>
                            </View>
                            <Text
                              style={styles.departureDestination}
                              numberOfLines={1}
                            >
                              {departure.destination}
                            </Text>
                          </View>
                          <View style={styles.departureTime}>
                            <Icon
                              name="schedule"
                              size={16}
                              color={isPassed ? "#999" : "#666"}
                            />
                            <Text
                              style={[
                                styles.departureMinutes,
                                isPassed && styles.departureMinutesPassed,
                              ]}
                            >
                              {displayText}
                              {realtimeLabel}
                            </Text>
                            {departure.platform && (
                              <Text style={styles.departurePlatform}>
                                Quai {departure.platform}
                              </Text>
                            )}
                          </View>
                        </View>
                      );

                      if (isPassed) {
                        passedDepartures.push(departureElement);
                      } else {
                        futureDepartures.push(departureElement);
                      }
                    });

                    return (
                      <>
                        {passedDepartures.length > 0 && (
                          <View style={{ marginBottom: 12 }}>
                            <Collapsable
                              title="Départs passés"
                              icon="history"
                              badge={passedDepartures.length}
                              defaultExpanded={false}
                            >
                              <View style={styles.departuresList}>
                                {passedDepartures}
                              </View>
                            </Collapsable>
                          </View>
                        )}

                        {futureDepartures.length > 0 && (
                          <View style={styles.departuresList}>
                            {futureDepartures}
                          </View>
                        )}

                        {futureDepartures.length === 0 &&
                          passedDepartures.length === 0 && (
                            <Text style={styles.noDeparturesText}>
                              Aucun départ
                            </Text>
                          )}
                      </>
                    );
                  })()}
                </>
              ) : (
                <Text style={styles.noDeparturesText}>Aucun départ prévu</Text>
              )}
            </View>

            {coordinate && (
              <View style={styles.coordinatesContainer}>
                <View style={styles.coordinatesHeader}>
                  <Text style={styles.coordinatesTitle}>Coordonnées:</Text>
                  <TouchableOpacity
                    style={styles.copyButton}
                    onPress={() => setShowCopyModal(true)}
                  >
                    <Icon name="content-copy" size={16} color="#007AFF" />
                    <Text style={styles.copyButtonText}>Copier</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.coordinates}>
                  {coordinate.latitude.toFixed(6)},{" "}
                  {coordinate.longitude.toFixed(6)}
                </Text>
              </View>
            )}

            <View style={styles.actionButtons}>
              {!error && !initialError && (
                <TouchableOpacity
                  style={[styles.routeButton, { flex: 1 }]}
                  onPress={handleStartRoutePress}
                >
                  <Icon name="directions" size={24} color="white" />
                  <Text style={styles.routeButtonText}>
                    Itinéraire vers cet arrêt
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </Drawer>

      {showRouteAlert && (
        <Modal
          visible={showRouteAlert}
          transparent={true}
          animationType="fade"
          onRequestClose={handleCancelNewRoute}
        >
          <View style={styles.alertOverlay}>
            <View style={styles.alertContainer}>
              <View style={styles.alertHeader}>
                <Icon name="warning" size={28} color="#FF9500" />
                <Text style={styles.alertTitle}>Nouvelle route ?</Text>
              </View>
              <Text style={styles.alertMessage}>
                Vous avez déjà une route active. Voulez-vous la remplacer par un
                itinéraire vers cet arrêt ?
              </Text>
              <View style={styles.alertButtons}>
                <TouchableOpacity
                  style={[styles.alertButton, styles.cancelButton]}
                  onPress={handleCancelNewRoute}
                >
                  <Text style={styles.cancelButtonText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.alertButton, styles.confirmButton]}
                  onPress={handleConfirmNewRoute}
                >
                  <Text style={styles.confirmButtonText}>Nouvelle route</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {showCopyModal && (
        <Modal
          visible={showCopyModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowCopyModal(false)}
        >
          <View style={styles.alertOverlay}>
            <View style={styles.copyModalContainer}>
              <View style={styles.copyModalHeader}>
                <TouchableOpacity
                  onPress={() => setShowCopyModal(false)}
                  style={styles.backButton}
                >
                  <Icon name="arrow-back" size={22} color="#007AFF" />
                </TouchableOpacity>
                <Icon name="content-copy" size={24} color="#007AFF" />
                <Text style={styles.copyModalTitle}>
                  Copier les coordonnées
                </Text>
              </View>
              <Text style={styles.copyModalSubtitle}>
                Choisissez le format de coordonnées à copier :
              </Text>

              <TouchableOpacity
                style={styles.copyFormatButton}
                onPress={() => handleCopyCoordinates("DD")}
              >
                <View style={styles.copyFormatContent}>
                  <Text style={styles.copyFormatTitle}>
                    DD (Degrés décimaux)
                  </Text>
                  <Text style={styles.copyFormatExample}>
                    {coordinate
                      ? formatCoordinatesDD(
                          coordinate.latitude,
                          coordinate.longitude
                        )
                      : "45.123456, -74.123456"}
                  </Text>
                </View>
                <Icon name="chevron-right" size={20} color="#666" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.copyFormatButton}
                onPress={() => handleCopyCoordinates("DMS")}
              >
                <View style={styles.copyFormatContent}>
                  <Text style={styles.copyFormatTitle}>
                    DMS (Degrés, Minutes, Secondes)
                  </Text>
                  <Text style={styles.copyFormatExample}>
                    {coordinate
                      ? formatCoordinatesDMS(
                          coordinate.latitude,
                          coordinate.longitude
                        )
                      : "45°7'22.032\"N 74°7'22.032\"W"}
                  </Text>
                </View>
                <Icon name="chevron-right" size={20} color="#666" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.copyFormatButton}
                onPress={() => handleCopyCoordinates("DMM")}
              >
                <View style={styles.copyFormatContent}>
                  <Text style={styles.copyFormatTitle}>
                    DMM (Degrés, Minutes décimales)
                  </Text>
                  <Text style={styles.copyFormatExample}>
                    {coordinate
                      ? formatCoordinatesDMM(
                          coordinate.latitude,
                          coordinate.longitude
                        )
                      : "45°7.3672'N 74°7.3672'W"}
                  </Text>
                </View>
                <Icon name="chevron-right" size={20} color="#666" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.copyFormatButton}
                onPress={handleCopyPlusCode}
              >
                <View style={styles.copyFormatContent}>
                  <Text style={styles.copyFormatTitle}>
                    Plus Code (complet)
                  </Text>
                  <Text style={styles.copyFormatExample}>
                    {coordinate
                      ? PlusCodeService.encode(
                          coordinate.latitude,
                          coordinate.longitude,
                          10
                        )
                      : "8FVC9G8F+6X"}
                  </Text>
                </View>
                <Icon name="chevron-right" size={20} color="#666" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.copyModalCancelButton}
                onPress={() => setShowCopyModal(false)}
              >
                <Text style={styles.copyModalCancelText}>Annuler</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {modalVisible && selectedLine && (
        <Portal>
          <View style={styles.alertOverlay} pointerEvents="box-none">
            <Animated.View
              style={[
                styles.lineModalContainer,
                {
                  opacity: modalAnim,
                  transform: [
                    {
                      translateY: modalAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [30, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={styles.lineModalHeader}>
                <TouchableOpacity
                  onPress={() => setShowLineModal(false)}
                  style={styles.backButton}
                >
                  <Icon name="close" size={22} color="#666" />
                </TouchableOpacity>
                <View
                  style={[
                    styles.lineModalChip,
                    selectedLine.color && {
                      backgroundColor: `#${selectedLine.color}`,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.lineModalChipText,
                      selectedLine.textColor && {
                        color: `#${selectedLine.textColor}`,
                      },
                    ]}
                  >
                    {selectedLine.name}
                  </Text>
                </View>
              </View>

              <ScrollView style={styles.lineModalContent}>
                {(selectedLine.routeData || selectedLine.mode || selectedLine.operator) && (
                  <>
                    {selectedLine.routeData?.long_name && (
                      <View style={styles.lineModalSection}>
                        <Text style={styles.lineModalLabel}>Nom complet:</Text>
                        <Text style={styles.lineModalValue}>
                          {selectedLine.routeData.long_name}
                        </Text>
                      </View>
                    )}

                    {(selectedLine.mode || selectedLine.routeData?.mode) && (
                      <View style={styles.lineModalSection}>
                        <Text style={styles.lineModalLabel}>Type:</Text>
                        <Text style={styles.lineModalValue}>
                          {selectedLine.mode || selectedLine.routeData.mode}
                        </Text>
                      </View>
                    )}

                    {(selectedLine.operator || selectedLine.routeData?.operator_name) && (
                      <View style={styles.lineModalSection}>
                        <Text style={styles.lineModalLabel}>Opérateur:</Text>
                        <Text style={styles.lineModalValue}>
                          {selectedLine.operator || selectedLine.routeData.operator_name}
                        </Text>
                      </View>
                    )}

                    {selectedLine.routeData?.agency_id && (
                      <View style={styles.lineModalSection}>
                        <Text style={styles.lineModalLabel}>Agence:</Text>
                        <Text style={styles.lineModalValue}>
                          {selectedLine.routeData.agency_id}
                        </Text>
                      </View>
                    )}

                    {selectedLine.routeData?.route_id && (
                      <View style={styles.lineModalSection}>
                        <Text style={styles.lineModalLabel}>
                          ID de la ligne:
                        </Text>
                        <Text style={styles.lineModalValue}>
                          {selectedLine.routeData.route_id}
                        </Text>
                      </View>
                    )}
                  </>
                )}

                {!selectedLine.routeData && !selectedLine.mode && !selectedLine.operator && (
                  <Text style={styles.lineModalNoData}>
                    Aucune information détaillée disponible
                  </Text>
                )}
              </ScrollView>

              <TouchableOpacity
                style={styles.lineModalButton}
                onPress={() => {
                  Vibration.vibrate(50);
                  setShowLineModal(false);
                }}
              >
                <Icon name="info-outline" size={20} color="white" />
                <Text style={styles.lineModalButtonText}>
                  Voir les détails de la ligne
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.lineModalCloseButton}
                onPress={() => setShowLineModal(false)}
              >
                <Text style={styles.lineModalCloseText}>Fermer</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Portal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
    marginTop: 16,
  },
  errorContainer: {
    alignItems: "center",
    paddingVertical: 60,
  },
  errorText: {
    fontSize: 16,
    color: "#FF3B30",
    textAlign: "center",
    marginTop: 16,
    marginHorizontal: 20,
  },
  retryButton: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#007AFF",
    borderRadius: 8,
  },
  retryText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  infoContainer: {
    paddingVertical: 20,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333",
    flex: 1,
  },
  refreshButton: {
    padding: 8,
  },
  transitType: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "500",
    marginBottom: 20,
  },
  linesContainer: {
    marginBottom: 24,
  },
  linesTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  linesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  lineChip: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  lineText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  departuresContainer: {
    marginBottom: 24,
  },
  departuresTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  departuresList: {
    gap: 12,
  },
  departureItem: {
    backgroundColor: "#F8F9FA",
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
  },
  departureHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  departureLineChip: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 12,
    minWidth: 40,
    alignItems: "center",
  },
  departureLineText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  departureDestination: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    flex: 1,
  },
  departureTime: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  departureMinutes: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  departureMinutesPassed: {
    color: "#999",
    fontStyle: "italic",
  },
  departurePlatform: {
    fontSize: 12,
    color: "#999",
    marginLeft: 12,
  },
  noDeparturesText: {
    fontSize: 16,
    color: "#999",
    fontStyle: "italic",
    textAlign: "center",
    padding: 20,
  },
  coordinatesContainer: {
    backgroundColor: "#F8F9FA",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  coordinatesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  coordinatesTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
  },
  copyButtonText: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "500",
    marginLeft: 4,
  },
  coordinates: {
    fontSize: 16,
    color: "#007AFF",
    fontFamily: "monospace",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  routeButton: {
    backgroundColor: "#007AFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
  },
  routeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  favoriteButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  alertOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  alertContainer: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 32,
    maxWidth: 320,
    width: "100%",
  },
  alertHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginLeft: 12,
  },
  alertMessage: {
    fontSize: 16,
    color: "#666",
    lineHeight: 24,
    marginBottom: 24,
    textAlign: "center",
  },
  alertButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  alertButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#F2F2F7",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "500",
  },
  confirmButton: {
    backgroundColor: "#007AFF",
  },
  confirmButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  copyModalContainer: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    maxWidth: 400,
    width: "100%",
    maxHeight: "80%",
  },
  copyModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  backButton: {
    marginRight: 12,
  },
  copyModalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginLeft: 12,
  },
  copyModalSubtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
  },
  copyFormatButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    marginBottom: 12,
  },
  copyFormatContent: {
    flex: 1,
  },
  copyFormatTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  copyFormatExample: {
    fontSize: 14,
    color: "#666",
    fontFamily: "monospace",
  },
  copyModalCancelButton: {
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  copyModalCancelText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  lineModalContainer: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    maxWidth: 400,
    width: "100%",
    maxHeight: "80%",
  },
  lineModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  lineModalChip: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 12,
  },
  lineModalChipText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  lineModalContent: {
    maxHeight: 400,
  },
  lineModalSection: {
    marginBottom: 16,
  },
  lineModalLabel: {
    fontSize: 14,
    color: "#999",
    marginBottom: 4,
    fontWeight: "500",
  },
  lineModalValue: {
    fontSize: 16,
    color: "#333",
    fontWeight: "400",
  },
  lineModalNoData: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
    padding: 40,
    fontStyle: "italic",
  },
  lineModalButton: {
    backgroundColor: "#007AFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  lineModalButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  lineModalCloseButton: {
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  lineModalCloseText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
});
