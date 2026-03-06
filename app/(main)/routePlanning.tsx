import {
  AddressIcon,
  BusStopIcon,
  CityIcon,
  CommercialIcon,
  FoodIcon,
  GasIcon,
  HealthIcon,
  ParkingIcon,
  TrainStationIcon,
} from "@/assets/icons";
import MapSnapshot, { WaypointPin } from "@/components/MapSnapshot";
import { Colors } from "@/constants/theme";
import { usePosition } from "@/contexts/PositionContext";
import { createTranslator } from "@/i18n";
import {
  telemetryCrash,
  telemetryFeatureUsed,
  telemetryNavigationStart,
  telemetryNavigationStop,
} from "@/services/TelemetryService";
import { showCommingSoonToast } from "@/utils/commingSoonToast";
import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  Keyboard,
  KeyboardEvent,
  LayoutAnimation,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Coordinate } from "../../services/RouteService";
import { useRouteService } from "../../services/RouteService";
import {
  PhotonFeature,
  SearchEngineService,
} from "../../services/SearchEngineService";

const { t } = createTranslator("routePlanning");

function getPhotonIcon(r: PhotonFeature): React.ReactNode {
  const v = r.properties?.osm_value ?? "";
  const noStreet = !r.properties?.housenumber && !r.properties?.street;

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
    ].includes(v) || /\bquai\b/i.test(r.properties?.street ?? "");

  if (v === "bus_stop") return <BusStopIcon />;
  if (isStation) return <TrainStationIcon />;
  if (
    ["restaurant", "fast_food", "cafe", "bar", "pub", "food_court"].includes(v)
  )
    return <FoodIcon />;
  if (
    [
      "retail",
      "supermarket",
      "bakery",
      "convenience",
      "pharmacy",
      "clothes",
    ].includes(v)
  )
    return <CommercialIcon />;
  if (["hospital", "clinic", "pharmacy", "doctors"].includes(v))
    return <HealthIcon />;
  if (v === "parking") return <ParkingIcon />;
  if (v === "fuel") return <GasIcon />;
  if (noStreet) return <CityIcon />;
  return <AddressIcon />;
}

type TransportMode = "car" | "walk" | "bike" | "transit";

const MODES: { id: TransportMode; icon: string }[] = [
  { id: "car", icon: "directions-car" },
  { id: "walk", icon: "directions-walk" },
  { id: "bike", icon: "directions-bike" },
  { id: "transit", icon: "directions-bus" },
];

type PlaceResult = { name: string; address: string; lat: number; lng: number };
type StopRole = "departure" | "waypoint" | "destination";
type StopItem = {
  id: string;
  result: PlaceResult | null;
  role: StopRole;
  isCurrentPosition: boolean;
};

const ITEM_HEIGHT = 68;
const ITEM_GAP = 10;
const STEP = ITEM_HEIGHT + ITEM_GAP;

interface StopRowProps {
  stop: StopItem;
  index: number;
  totalCount: number;
  dragIndex: SharedValue<number>;
  dragAbsY: SharedValue<number>;
  isEditing: boolean;
  editQuery: string;
  autocompleteResults: PhotonFeature[];
  rowLabel: string;
  canRemove: boolean;
  canUseCurrentPosition: boolean;
  onDragStart: () => void;
  onDragFinish: () => void;
  onEditActivate: () => void;
  onSelectCurrentPosition: () => void;
  onQueryChange: (q: string) => void;
  onSelectResult: (r: PhotonFeature) => void;
  onRemove: () => void;
  onDragEnd: (from: number, to: number) => void;
}

function StopRow({
  stop,
  index,
  totalCount,
  dragIndex,
  dragAbsY,
  isEditing,
  editQuery,
  autocompleteResults,
  rowLabel,
  canRemove,
  canUseCurrentPosition,
  onDragStart,
  onDragFinish,
  onEditActivate,
  onSelectCurrentPosition,
  onQueryChange,
  onSelectResult,
  onRemove,
  onDragEnd,
}: StopRowProps) {
  const role = stop.role;

  const panGesture = Gesture.Pan()
    .activateAfterLongPress(150)
    .onBegin(() => {
      dragIndex.value = index;
      dragAbsY.value = index * STEP;
      runOnJS(onDragStart)();
    })
    .onUpdate((e) => {
      dragAbsY.value = index * STEP + e.translationY;
    })
    .onEnd(() => {
      const to = Math.max(
        0,
        Math.min(totalCount - 1, Math.round(dragAbsY.value / STEP)),
      );
      runOnJS(onDragEnd)(dragIndex.value, to);
      dragIndex.value = -1;
      dragAbsY.value = 0;
    })
    .onFinalize(() => {
      dragIndex.value = -1;
      dragAbsY.value = 0;
      runOnJS(onDragFinish)();
    });

  const inputRef = React.useRef<import("react-native").TextInput>(null);
  React.useEffect(() => {
    if (isEditing) {
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [isEditing]);

  const animStyle = useAnimatedStyle(() => {
    const dragging = dragIndex.value;
    if (dragging === index) {
      return {
        transform: [{ translateY: dragAbsY.value - index * STEP }],
        zIndex: 100,
        shadowOpacity: 0.5,
        shadowRadius: 14,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        elevation: 12,
      };
    }
    if (dragging === -1) {
      return {
        transform: [{ translateY: 0 }],
        zIndex: 1,
        shadowOpacity: 0,
        elevation: 0,
      };
    }
    const targetPos = Math.round(dragAbsY.value / STEP);
    let offset = 0;
    if (dragging < index && targetPos >= index) offset = -STEP;
    else if (dragging > index && targetPos <= index) offset = STEP;
    return {
      transform: [{ translateY: offset }],
      zIndex: 1,
      shadowOpacity: 0,
      elevation: 0,
    };
  });

  const iconBoxExtra = stop.isCurrentPosition
    ? { backgroundColor: "rgba(13,127,242,0.12)" }
    : role === "destination"
      ? { backgroundColor: Colors.dark.primary }
      : {};
  const iconName = stop.isCurrentPosition
    ? "my-location"
    : role === "destination"
      ? "flag"
      : "location-on";
  const iconColor = stop.isCurrentPosition
    ? Colors.dark.primary
    : role === "destination"
      ? "#fff"
      : "#90adcb";
  const labelColor = role === "destination" ? Colors.dark.primary : undefined;

  const placeholder =
    role === "departure"
      ? t("currentPosition")
      : role === "destination"
        ? t("destination")
        : t("choosePlace");

  return (
    <View
      style={[
        styles.stopRowWrapper,
        isEditing &&
          (canUseCurrentPosition || autocompleteResults.length > 0) && {
            zIndex: 200,
          },
      ]}
    >
      <Animated.View style={[styles.plannerRow, animStyle]}>
        <View style={[styles.plannerIconBox, iconBoxExtra]}>
          <MaterialIcons name={iconName as any} size={20} color={iconColor} />
        </View>
        <View style={styles.plannerInfo}>
          <Text
            style={[
              styles.plannerRowLabel,
              labelColor ? { color: labelColor } : {},
            ]}
          >
            {rowLabel}
          </Text>
          {isEditing ? (
            <TextInput
              ref={inputRef}
              value={editQuery}
              onChangeText={onQueryChange}
              style={styles.stopInput}
              placeholder={t("searchPlacePlaceholder")}
              placeholderTextColor="#90adcb"
              returnKeyType="search"
            />
          ) : (
            <TouchableOpacity onPress={onEditActivate} hitSlop={4}>
              <Text
                style={[
                  styles.plannerRowTitle,
                  !stop.result &&
                    !stop.isCurrentPosition &&
                    styles.plannerRowTitlePlaceholder,
                ]}
              >
                {stop.isCurrentPosition
                  ? t("currentPosition")
                  : (stop.result?.name ?? placeholder)}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.stopActions}>
          <GestureDetector gesture={panGesture}>
            <View style={styles.dragHandle}>
              <MaterialIcons
                name="drag-handle"
                size={22}
                color={isEditing ? "rgba(255,255,255,0.2)" : "#90adcb"}
              />
            </View>
          </GestureDetector>
          {canRemove ? (
            <TouchableOpacity onPress={onRemove} hitSlop={8}>
              <MaterialIcons name="close" size={20} color="#90adcb" />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 20 }} />
          )}
        </View>
      </Animated.View>

      {isEditing &&
        (canUseCurrentPosition || autocompleteResults.length > 0) && (
          <View style={styles.autocompleteDropdown}>
            {canUseCurrentPosition && (
              <TouchableOpacity
                style={[
                  styles.autocompleteItem,
                  autocompleteResults.length > 0 &&
                    styles.autocompleteItemBorder,
                ]}
                onPress={onSelectCurrentPosition}
              >
                <View
                  style={[
                    styles.autocompleteIconBox,
                    { backgroundColor: "rgba(13,127,242,0.15)" },
                  ]}
                >
                  <MaterialIcons
                    name="my-location"
                    size={18}
                    color={Colors.dark.primary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.autocompleteTitle}>
                    {t("myPositionTitle")}
                  </Text>
                  <Text style={styles.autocompleteSub}>
                    {t("useMyLocation")}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            {autocompleteResults.slice(0, 5).map((r, ri) => {
              const rName =
                r.properties?.name ||
                [r.properties?.housenumber, r.properties?.street]
                  .filter(Boolean)
                  .join(" ") ||
                r.properties?.city ||
                t("place");
              const rSub = [r.properties?.city, r.properties?.country]
                .filter(Boolean)
                .join(", ");
              return (
                <TouchableOpacity
                  key={`${r.properties?.osm_id ?? ri}`}
                  style={[
                    styles.autocompleteItem,
                    ri < autocompleteResults.length - 1 &&
                      styles.autocompleteItemBorder,
                  ]}
                  onPress={() => onSelectResult(r)}
                >
                  <View style={styles.autocompleteIconBox}>
                    {getPhotonIcon(r)}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.autocompleteTitle} numberOfLines={1}>
                      {rName}
                    </Text>
                    {rSub ? (
                      <Text style={styles.autocompleteSub} numberOfLines={1}>
                        {rSub}
                      </Text>
                    ) : null}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
    </View>
  );
}

export default function RoutePlanningScreen() {
  const { name, address, lat, lng } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const destLat = lat ? parseFloat(lat as string) : null;
  const destLng = lng ? parseFloat(lng as string) : null;
  const destName = (name as string) || "";
  const destAddress =
    (address as string) || (lat && lng ? `${lat}, ${lng}` : "");

  const [selected, setSelected] = React.useState<TransportMode>("car");
  const [showPlanner, setShowPlanner] = React.useState(false);
  const [mapExpanded, setMapExpanded] = React.useState(false);
  const { position } = usePosition();

  const expandAnim = useSharedValue(0);

  const toggleMapExpand = () => {
    const next = mapExpanded ? 0 : 1;
    expandAnim.value = withTiming(next, {
      duration: 320,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });
    LayoutAnimation.configureNext({
      duration: 300,
      create: { type: "easeInEaseOut", property: "opacity" },
      update: { type: "easeInEaseOut" },
      delete: { type: "easeInEaseOut", property: "opacity" },
    });
    setMapExpanded((v) => !v);
  };

  const editBtnAnimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(expandAnim.value, [0, 0.35], [1, 0]),
    maxHeight: interpolate(expandAnim.value, [0, 0.55], [80, 0]),
    overflow: "hidden",
  }));

  const routeService = useRouteService();

  const routeServiceRef = React.useRef(routeService);
  React.useEffect(() => {
    routeServiceRef.current = routeService;
  }, [routeService]);

  const [routeResults, setRouteResults] = React.useState<
    Partial<
      Record<
        TransportMode,
        { duration: number; distance: number; coords: Coordinate[] }
      >
    >
  >({});
  const [routeErrors, setRouteErrors] = React.useState<
    Partial<Record<TransportMode, string>>
  >({});

  const [routeAlternatives, setRouteAlternatives] = React.useState<
    Partial<
      Record<
        TransportMode,
        { duration: number; distance: number; coords: Coordinate[] }[]
      >
    >
  >({});

  const [selectedAlternativeIndex, setSelectedAlternativeIndex] =
    React.useState<Partial<Record<TransportMode, number>>>({
      car: 0,
      walk: 0,
      bike: 0,
    });

  const [modesCalculating, setModesCalculating] = React.useState({
    car: false,
    walk: false,
    bike: false,
  });

  const modeToService = (m: TransportMode): string =>
    m === "car" ? "driving" : m === "walk" ? "walking" : "bicycling";

  const getFastestMode = (): TransportMode | null => {
    const modes: TransportMode[] = ["car", "walk", "bike"];
    const durations = modes
      .filter((mode) => routeResults[mode])
      .map((mode) => ({
        mode,
        duration: routeResults[mode]!.duration,
      }));

    if (durations.length === 0) return null;
    return durations.reduce((fastest, current) =>
      current.duration < fastest.duration ? current : fastest,
    ).mode;
  };

  const handleSelectAlternative = (mode: TransportMode, index: number) => {
    const alternatives = routeAlternatives[mode];
    if (!alternatives || index < 0 || index >= alternatives.length) return;

    setSelectedAlternativeIndex((prev) => ({
      ...prev,
      [mode]: index,
    }));

    setRouteResults((prev) => ({
      ...prev,
      [mode]: {
        duration: alternatives[index].duration,
        distance: alternatives[index].distance,
        coords: alternatives[index].coords,
      },
    }));
  };

  const formatDuration = (min: number): string => {
    if (min < 60) return `${min} min`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m ? `${h}h${m.toString().padStart(2, "0")}` : `${h}h`;
  };

  const formatDistance = (meters: number): string => {
    if (meters < 1000) return `${meters} m`;
    return `${(meters / 1000).toFixed(1)} km`;
  };

  const [waypoints, setWaypoints] = React.useState<StopItem[]>(() => [
    {
      id: "departure",
      result: null,
      role: "departure",
      isCurrentPosition: true,
    },
    {
      id: "destination",
      result:
        destLat && destLng
          ? {
              name: destName || destAddress || t("destination"),
              address: destAddress,
              lat: destLat,
              lng: destLng,
            }
          : null,
      role: "destination",
      isCurrentPosition: false,
    },
  ]);

  const [activeEditIndex, setActiveEditIndex] = React.useState<number | null>(
    null,
  );
  const [editQuery, setEditQuery] = React.useState("");
  const [autocompleteResults, setAutocompleteResults] = React.useState<
    PhotonFeature[]
  >([]);
  const [keyboardVisible, setKeyboardVisible] = React.useState(false);

  React.useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", (_e: KeyboardEvent) =>
      setKeyboardVisible(true),
    );
    const hide = Keyboard.addListener("keyboardDidHide", () =>
      setKeyboardVisible(false),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const activeEditIndexRef = React.useRef(activeEditIndex);
  const editQueryRef = React.useRef(editQuery);
  React.useEffect(() => {
    activeEditIndexRef.current = activeEditIndex;
  }, [activeEditIndex]);
  React.useEffect(() => {
    editQueryRef.current = editQuery;
  }, [editQuery]);

  React.useEffect(() => {
    if (
      !keyboardVisible &&
      activeEditIndexRef.current !== null &&
      editQueryRef.current.trim() === ""
    ) {
      setActiveEditIndex(null);
      setAutocompleteResults([]);
    }
  }, [keyboardVisible]);

  const [scrollEnabled, setScrollEnabled] = React.useState(true);
  const dragIndex = useSharedValue(-1);
  const dragAbsY = useSharedValue(0);

  React.useEffect(() => {
    const q = editQuery.trim();
    if (!q) {
      setAutocompleteResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const results = await SearchEngineService.photonSearch(q, { limit: 5 });
        setAutocompleteResults(results);
      } catch {
        setAutocompleteResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [editQuery]);

  const addStop = () => {
    const lastIdx = waypoints.length - 1;
    const dest = waypoints[lastIdx];

    if (!dest.result && !dest.isCurrentPosition) {
      setActiveEditIndex(lastIdx);
      setEditQuery("");
      setAutocompleteResults([]);
      return;
    }
    const insertIdx = waypoints.length - 1;
    const newStop: StopItem = {
      id: String(Date.now()),
      result: null,
      role: "waypoint",
      isCurrentPosition: false,
    };
    setWaypoints((prev) => {
      const next = [...prev];
      next.splice(insertIdx, 0, newStop);
      return next;
    });
    setActiveEditIndex(insertIdx);
    setEditQuery("");
    setAutocompleteResults([]);
  };

  const removeStop = (i: number) => {
    if (i === 0 || i === waypoints.length - 1) return;
    setWaypoints((prev) => prev.filter((_, idx) => idx !== i));
    if (activeEditIndex === i) {
      setActiveEditIndex(null);
      setEditQuery("");
      setAutocompleteResults([]);
    } else if (activeEditIndex !== null && activeEditIndex > i) {
      setActiveEditIndex(activeEditIndex - 1);
    }
  };

  const reorderStops = (from: number, to: number) => {
    setScrollEnabled(true);
    if (from === to) return;

    setWaypoints((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);

      let reordered = next.map((w, i) => ({
        ...w,
        role:
          i === 0
            ? "departure"
            : i === next.length - 1
              ? "destination"
              : "waypoint",
      })) as StopItem[];

      const last = reordered[reordered.length - 1];
      if (!last.result && !last.isCurrentPosition && reordered.length > 2) {
        reordered = reordered.slice(0, -1);
        reordered[reordered.length - 1] = {
          ...reordered[reordered.length - 1],
          role: "destination",
        };
      }
      return reordered;
    });

    setActiveEditIndex(null);
    setEditQuery("");
    setAutocompleteResults([]);
  };

  const handleSelectResult = (wpIndex: number, r: PhotonFeature) => {
    const result: PlaceResult = {
      name:
        r.properties?.name ||
        [r.properties?.housenumber, r.properties?.street]
          .filter(Boolean)
          .join(" ") ||
        r.properties?.city ||
        t("place"),
      address: [
        r.properties?.housenumber,
        r.properties?.street,
        r.properties?.city,
        r.properties?.country,
      ]
        .filter(Boolean)
        .join(", "),
      lat: r.geometry.coordinates[1],
      lng: r.geometry.coordinates[0],
    };
    setWaypoints((prev) =>
      prev.map((s, i) =>
        i === wpIndex ? { ...s, result, isCurrentPosition: false } : s,
      ),
    );
    setActiveEditIndex(null);
    setEditQuery("");
    setAutocompleteResults([]);
    Keyboard.dismiss();
  };

  const handleEditActivate = (i: number) => {
    setActiveEditIndex(i);
    setEditQuery(waypoints[i]?.result?.name ?? "");
    setAutocompleteResults([]);
  };

  const handleSelectCurrentPosition = (i: number) => {
    setWaypoints((prev) =>
      prev.map((s, idx) =>
        idx === i ? { ...s, result: null, isCurrentPosition: true } : s,
      ),
    );
    setActiveEditIndex(null);
    setEditQuery("");
    setAutocompleteResults([]);
    Keyboard.dismiss();
  };

  const departure = waypoints[0]?.result ?? null;
  const destinationStop = waypoints[waypoints.length - 1];
  const destinationResult = destinationStop?.result ?? null;
  const destinationCoords =
    destinationResult &&
    Number.isFinite(destinationResult.lat) &&
    Number.isFinite(destinationResult.lng)
      ? { lat: destinationResult.lat, lng: destinationResult.lng }
      : null;
  const destinationLabel =
    destinationResult?.name ?? destAddress ?? t("destination");
  const navigationModeForIntent = selected === "transit" ? "car" : selected;

  const handleStartNavigation = async () => {
    if (!destinationCoords) return;

    const coords: Coordinate[] = summaryWaypoints
      .map((w) => {
        if (w.isCurrentPosition && gpsSnapshot) {
          return { latitude: gpsSnapshot.lat, longitude: gpsSnapshot.lng };
        }
        if (w.result) {
          return { latitude: w.result.lat, longitude: w.result.lng };
        }
        return null;
      })
      .filter((c): c is Coordinate => c !== null);

    try {
      telemetryFeatureUsed("navigation_started", {
        mode: navigationModeForIntent,
        waypoint_count: coords.length,
        has_alternative_routes: Object.values(routeAlternatives).some(
          (arr) => arr && arr.length > 1,
        ),
      });

      if (coords.length > 2) {
        await routeService.getMultiStepRoute(coords, navigationModeForIntent);
      } else {
        const selectedRoute = routeResults[navigationModeForIntent];
        if (selectedRoute) {
          routeService.updateRouteData({
            routes: [
              {
                geometry: {
                  coordinates: selectedRoute.coords.map((c) => [
                    c.longitude,
                    c.latitude,
                  ]),
                },
                duration: selectedRoute.duration * 60,
                distance: selectedRoute.distance,
              },
            ],
          });
        }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      telemetryCrash(errorMsg, "", {
        mode: navigationModeForIntent,
        waypoint_count: coords.length,
      });
    }

    router.push({
      pathname: "/navigate/standard",
      params: {
        lat: String(destinationCoords.lat),
        lng: String(destinationCoords.lng),
        mode: navigationModeForIntent,
        name: destinationLabel,
        multi: coords.length > 2 ? "1" : undefined,
      },
    });
  };

  const validCount = waypoints.filter(
    (w) => w.result !== null || w.isCurrentPosition,
  ).length;
  const canSave = validCount >= 2;

  const summaryWaypoints = React.useMemo(
    () => [
      waypoints[0],
      ...waypoints
        .slice(1, -1)
        .filter((w) => w.result !== null || w.isCurrentPosition),
      waypoints[waypoints.length - 1],
    ],
    [waypoints],
  );

  const round4 = (n: number) => Math.round(n * 1e4) / 1e4;

  const [gpsSnapshot, setGpsSnapshot] = React.useState<{
    lat: number;
    lng: number;
  } | null>(
    position
      ? { lat: round4(position.latitude), lng: round4(position.longitude) }
      : null,
  );

  React.useEffect(() => {
    if (position && !gpsSnapshot) {
      setGpsSnapshot({
        lat: round4(position.latitude),
        lng: round4(position.longitude),
      });
    }
  }, [position, gpsSnapshot]);

  const prevSummaryRef = React.useRef(summaryWaypoints);
  React.useEffect(() => {
    if (summaryWaypoints !== prevSummaryRef.current) {
      prevSummaryRef.current = summaryWaypoints;
      if (position) {
        setGpsSnapshot({
          lat: round4(position.latitude),
          lng: round4(position.longitude),
        });
      }
    }
  }, [summaryWaypoints, position]);

  const posLat = gpsSnapshot?.lat ?? null;
  const posLng = gpsSnapshot?.lng ?? null;
  const resolvedCoords = React.useMemo<Coordinate[]>(
    () =>
      summaryWaypoints
        .map((w): Coordinate | null => {
          if (w.isCurrentPosition && posLat !== null && posLng !== null)
            return { latitude: posLat, longitude: posLng };
          if (w.result)
            return { latitude: w.result.lat, longitude: w.result.lng };
          return null;
        })
        .filter((c): c is Coordinate => c !== null),
    [summaryWaypoints, posLat, posLng],
  );

  const lastFetchKey = React.useRef("");

  const prevCoordsKey = React.useRef("");
  React.useEffect(() => {
    const key = JSON.stringify(resolvedCoords);
    if (key !== prevCoordsKey.current) {
      prevCoordsKey.current = key;
      lastFetchKey.current = "";
      setRouteResults({});
    }
  }, [resolvedCoords]);

  React.useEffect(() => {
    if (resolvedCoords.length < 2) return;
    const key = JSON.stringify(resolvedCoords);
    if (key === lastFetchKey.current) return;
    lastFetchKey.current = key;

    setRouteResults({});
    setRouteErrors({});

    const modes: ("car" | "walk" | "bike")[] = ["car", "walk", "bike"];
    setModesCalculating({ car: true, walk: true, bike: true });

    telemetryNavigationStart("route_calculation", {
      waypoint_count: resolvedCoords.length,
    });

    let completed = 0;
    let successCount = 0;
    const distances: number[] = [];
    const durations: number[] = [];

    modes.forEach((mode, index) => {
      const delay = index * 300;
      setTimeout(async () => {
        try {
          const alternatives = await routeService.getRoutes(
            resolvedCoords,
            modeToService(mode as TransportMode),
            { alternatives: 3 },
          );

          if (alternatives && alternatives.length > 0) {
            successCount++;
            distances.push(alternatives[0].distance);
            durations.push(alternatives[0].duration);

            setRouteAlternatives((prev) => ({
              ...prev,
              [mode as TransportMode]: alternatives,
            }));

            setSelectedAlternativeIndex((prev) => ({
              ...prev,
              [mode]: 0,
            }));

            setRouteResults((prev) => ({
              ...prev,
              [mode as TransportMode]: {
                duration: alternatives[0].duration,
                distance: alternatives[0].distance,
                coords: alternatives[0].coords,
              },
            }));
          } else {
            telemetryFeatureUsed("route_calculation_no_alternatives", {
              mode,
            });
            setRouteErrors((prev) => ({
              ...prev,
              [mode as TransportMode]: t("errorNoRoute"),
            }));
          }
        } catch (error) {
          const errorMsg =
            error instanceof Error ? error.message : String(error);
          telemetryCrash(errorMsg, "", {
            mode,
            waypoint_count: resolvedCoords.length,
          });
          setRouteErrors((prev) => ({
            ...prev,
            [mode as TransportMode]: errorMsg,
          }));
        } finally {
          completed++;
          if (completed === modes.length) {
            telemetryNavigationStop({
              success: successCount > 0,
              modes_tried: modes.length,
              success_count: successCount,
              max_distance_m: distances.length ? Math.max(...distances) : 0,
              max_duration_min: durations.length ? Math.max(...durations) : 0,
            });
          }
        }

        setModesCalculating((prev) => ({
          ...prev,
          [mode]: false,
        }));
      }, delay);
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedCoords]);

  const prevSelectedRouteKey = React.useRef("");
  React.useEffect(() => {
    if (selected === "transit") return;
    const selectedRoute = routeResults[selected];
    if (!selectedRoute) return;

    const key = JSON.stringify({
      d: selectedRoute.duration,
      dist: selectedRoute.distance,
      c: selectedRoute.coords?.length ?? 0,
    });
    if (key === prevSelectedRouteKey.current) return;
    prevSelectedRouteKey.current = key;

    routeServiceRef.current.updateRouteData({
      routes: [
        {
          geometry: {
            coordinates: selectedRoute.coords.map((c) => [
              c.longitude,
              c.latitude,
            ]),
          },
          duration: selectedRoute.duration * 60,
          distance: selectedRoute.distance,
        },
      ],
    });
  }, [selected, routeResults]);
  const mapPins = React.useMemo<WaypointPin[]>(() => {
    let stepIdx = 1;
    return summaryWaypoints
      .map((w) => {
        const coords = w.isCurrentPosition
          ? position
            ? { lat: position.latitude, lng: position.longitude }
            : null
          : w.result
            ? { lat: w.result.lat, lng: w.result.lng }
            : null;
        if (!coords) return null;
        const type: WaypointPin["type"] =
          w.role === "departure"
            ? "departure"
            : w.role === "destination"
              ? "destination"
              : "waypoint";
        const pin: WaypointPin = { ...coords, type };
        if (type === "waypoint") pin.stepNumber = stepIdx++;
        return pin;
      })
      .filter(Boolean) as WaypointPin[];
  }, [summaryWaypoints, position]);

  return (
    <View style={styles.container}>
      <StatusBar
        hidden
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 8,
            borderBottomColor: "rgba(255,255,255,0.08)",
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.iconButton}
        >
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("optionsTitle")}</Text>
        <View style={styles.iconButton} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={!mapExpanded}
      >
        {mapExpanded ? (
          <View style={styles.summaryCardExpanded}>
            <View style={styles.expandedHeader}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.summaryLabel}>{t("summaryLabel")}</Text>
                {selected !== "transit" && (
                  <View style={styles.summaryRouteInfo}>
                    {modesCalculating[selected] ? (
                      <Text style={styles.summaryRouteLoading}>
                        {t("calculating")}
                      </Text>
                    ) : routeResults[selected] ? (
                      <>
                        <Text style={styles.summaryRouteDuration}>
                          {formatDuration(routeResults[selected]!.duration)}
                        </Text>
                        <Text style={styles.summaryRouteSep}>·</Text>
                        <Text style={styles.summaryRouteDist}>
                          {formatDistance(routeResults[selected]!.distance)}
                        </Text>
                      </>
                    ) : null}
                  </View>
                )}
              </View>
              <TouchableOpacity
                onPress={toggleMapExpand}
                hitSlop={12}
                style={styles.expandedCloseBtn}
              >
                <MaterialIcons
                  name="fullscreen-exit"
                  size={20}
                  color="#90adcb"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.expandedMapBorder}>
              <MapSnapshot
                pins={mapPins}
                routeCoords={
                  routeService.routeCoords.length >= 2
                    ? routeService.routeCoords
                    : undefined
                }
                interactive
                style={styles.expandedMapSnapshot}
              />
            </View>
          </View>
        ) : (
          <>
            <View style={styles.summaryCard}>
              <View style={styles.summaryLeft}>
                <Text style={styles.summaryLabel}>{t("summaryLabel")}</Text>
                {destName ? (
                  <Text style={styles.summaryTitle} numberOfLines={2}>
                    {destName}
                  </Text>
                ) : null}

                {summaryWaypoints.map((wp, wi) => {
                  const isFirst = wi === 0;
                  const isLast = wi === summaryWaypoints.length - 1;
                  const label = wp.isCurrentPosition
                    ? t("currentPosition")
                    : isFirst
                      ? (wp.result?.name ?? t("currentPosition"))
                      : (wp.result?.name ?? t("destination"));
                  return (
                    <View key={wp.id} style={styles.summaryRow}>
                      <View style={styles.summaryDotCol}>
                        <View
                          style={[
                            styles.summaryDot,
                            isFirst && { backgroundColor: Colors.dark.primary },
                            isLast && {
                              backgroundColor: "#e3e3e3",
                              borderRadius: 2,
                            },
                          ]}
                        />
                        {!isLast && <View style={styles.summaryLine} />}
                      </View>
                      <Text
                        style={[
                          styles.summaryRowText,
                          isFirst && { color: "#fff" },
                        ]}
                        numberOfLines={1}
                      >
                        {label}
                      </Text>
                    </View>
                  );
                })}

                {selected !== "transit" && (
                  <View style={styles.summaryRouteInfo}>
                    {modesCalculating[selected] ? (
                      <Text style={styles.summaryRouteLoading}>
                        {t("calculating")}
                      </Text>
                    ) : routeResults[selected] ? (
                      <>
                        <Text style={styles.summaryRouteDuration}>
                          {formatDuration(routeResults[selected]!.duration)}
                        </Text>
                        <Text style={styles.summaryRouteSep}>·</Text>
                        <Text style={styles.summaryRouteDist}>
                          {formatDistance(routeResults[selected]!.distance)}
                        </Text>
                      </>
                    ) : null}
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={styles.summaryMap}
                onPress={toggleMapExpand}
                activeOpacity={0.85}
              >
                <View style={styles.mapBorder}>
                  <MapSnapshot
                    pins={mapPins}
                    routeCoords={
                      routeService.routeCoords.length >= 2
                        ? routeService.routeCoords
                        : undefined
                    }
                  />
                </View>
              </TouchableOpacity>
            </View>

            <Animated.View style={editBtnAnimStyle}>
              <TouchableOpacity
                style={styles.editStopsButton}
                onPress={() => setShowPlanner(true)}
                activeOpacity={0.75}
              >
                <MaterialIcons name="edit-road" size={18} color="#90adcb" />
                <Text style={styles.editStopsText}>{t("editStops")}</Text>
                <MaterialIcons name="chevron-right" size={18} color="#90adcb" />
              </TouchableOpacity>
            </Animated.View>
          </>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t("modesTitle")}</Text>
        </View>

        <View style={styles.modesList}>
          {MODES.map((mode) => {
            const isSelected = selected === mode.id;
            const altsCount = routeAlternatives[mode.id]?.length ?? 0;
            const hasMultipleAlts = mode.id !== "transit" && altsCount > 1;

            if (isSelected && hasMultipleAlts) {
              const alternatives = routeAlternatives[mode.id] ?? [];
              return (
                <View key={mode.id} style={styles.expandedModeCard}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <View style={styles.modeLeft}>
                      <View style={styles.expandedModeIconBox}>
                        <MaterialIcons
                          name={mode.icon as any}
                          size={28}
                          color="#fff"
                        />
                      </View>
                      <View style={styles.modeInfo}>
                        <View style={styles.modeLabelRow}>
                          <Text style={styles.modeName}>
                            {t(`modes.${mode.id}.label`)}
                          </Text>
                          {getFastestMode() === mode.id ? (
                            <View style={styles.badge}>
                              <Text style={styles.badgeText}>
                                {t("fastest")}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                        <Text
                          style={[
                            styles.modeSub,
                            { color: Colors.dark.primary },
                          ]}
                        >
                          {t(`modes.${mode.id}.subtitle`)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View
                    style={{
                      height: 1,
                      backgroundColor: "rgba(255,255,255,0.1)",
                      marginVertical: 12,
                    }}
                  />

                  {alternatives.length > 1 ? (
                    <View style={styles.alternativesDetailSection}>
                      {alternatives.map((alt, idx) => {
                        const isSelectedAlt =
                          selectedAlternativeIndex[mode.id] === idx;
                        return (
                          <TouchableOpacity
                            key={idx}
                            style={[
                              styles.alternativeDetailRow,
                              isSelectedAlt &&
                                styles.alternativeDetailRowSelected,
                            ]}
                            onPress={() =>
                              handleSelectAlternative(mode.id, idx)
                            }
                            activeOpacity={0.8}
                          >
                            <View style={styles.alternativeDetailLeft}>
                              <View
                                style={[
                                  styles.radioOuter,
                                  isSelectedAlt && styles.radioOuterSelected,
                                ]}
                              >
                                {isSelectedAlt && (
                                  <View style={styles.radioInner} />
                                )}
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text
                                  style={[
                                    styles.alternativeDetailTitle,
                                    isSelectedAlt &&
                                      styles.alternativeDetailTitleSelected,
                                  ]}
                                >
                                  {t("route", { n: idx + 1 })}
                                </Text>
                                <Text
                                  style={[
                                    styles.alternativeDetailSub,
                                    isSelectedAlt &&
                                      styles.alternativeDetailSubSelected,
                                  ]}
                                >
                                  {formatDistance(alt.distance)}
                                </Text>
                              </View>
                            </View>
                            <Text
                              style={[
                                styles.alternativeDetailTime,
                                isSelectedAlt &&
                                  styles.alternativeDetailTimeSelected,
                              ]}
                            >
                              {formatDuration(alt.duration)}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ) : null}
                </View>
              );
            }

            return (
              <TouchableOpacity
                key={mode.id}
                style={[styles.modeCard, isSelected && styles.modeCardSelected]}
                onPress={() => {
                  if (mode.id !== "transit") setSelected(mode.id);
                  else showCommingSoonToast();
                }}
                activeOpacity={0.85}
              >
                <View style={styles.modeLeft}>
                  <View
                    style={[
                      styles.modeIconBox,
                      isSelected && styles.modeIconBoxSelected,
                    ]}
                  >
                    <MaterialIcons
                      name={mode.icon as any}
                      size={28}
                      color={isSelected ? "#fff" : "#90adcb"}
                    />
                  </View>
                  <View style={styles.modeInfo}>
                    <View style={styles.modeLabelRow}>
                      <Text style={styles.modeName}>
                        {t(`modes.${mode.id}.label`)}
                      </Text>
                      {isSelected && getFastestMode() === mode.id ? (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>{t("fastest")}</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text
                      style={[
                        styles.modeSub,
                        mode.id === "transit" &&
                          isSelected && { color: Colors.dark.primary },
                      ]}
                      numberOfLines={1}
                    >
                      {t(`modes.${mode.id}.subtitle`)}
                    </Text>
                  </View>
                </View>
                <View style={styles.modeRight}>
                  <Text style={styles.modeTime}>
                    {mode.id === "transit"
                      ? "—"
                      : modesCalculating[mode.id]
                        ? "…"
                        : routeErrors[mode.id]
                          ? `status: ${routeErrors[mode.id]}`
                          : routeResults[mode.id]
                            ? formatDuration(routeResults[mode.id]!.duration)
                            : "—"}
                  </Text>
                  <Text style={styles.modeDist}>
                    {mode.id !== "transit" && routeResults[mode.id]
                      ? formatDistance(routeResults[mode.id]!.distance)
                      : ""}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        {departure ? (
          <>
            <View style={styles.startButtonPreview}>
              <MaterialIcons name="info-outline" size={18} color="#90adcb" />
              <Text style={styles.startButtonPreviewText}>
                {t("customDepartureInfo")}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.startButton, { backgroundColor: "#1a2f42" }]}
              onPress={handleStartNavigation}
              activeOpacity={0.8}
            >
              <MaterialIcons name="near-me" size={22} color="#90adcb" />
              <Text style={[styles.startButtonText, { color: "#90adcb" }]}>
                {t("startNavigation")}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStartNavigation}
            activeOpacity={0.9}
          >
            <Text style={styles.startButtonText}>{t("startNavigation")}</Text>
            <MaterialIcons name="near-me" size={22} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      <Modal
        visible={showPlanner}
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setShowPlanner(false)}
      >
        <GestureHandlerRootView style={{ flex: 1 }}>
          <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
            <StatusBar
              hidden
              translucent
              backgroundColor="transparent"
              barStyle="light-content"
            />

            <View
              style={[
                styles.header,
                { borderBottomColor: "rgba(255,255,255,0.08)" },
              ]}
            >
              <TouchableOpacity
                onPress={() => setShowPlanner(false)}
                style={styles.iconButton}
              >
                <MaterialIcons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>{t("planner")}</Text>
              <View style={styles.iconButton}></View>
            </View>

            <ScrollView
              contentContainerStyle={styles.plannerScroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              scrollEnabled={scrollEnabled}
            >
              {waypoints.map((wp, i) => {
                const isFirst = i === 0;
                const isLast = i === waypoints.length - 1;
                const intermediateIndex = waypoints
                  .slice(1, -1)
                  .findIndex((w) => w.id === wp.id);
                const rowLabel = isFirst
                  ? t("departure")
                  : isLast
                    ? t("destinationLabel")
                    : t("step", { n: intermediateIndex + 1 });
                return (
                  <StopRow
                    key={wp.id}
                    stop={wp}
                    index={i}
                    totalCount={waypoints.length}
                    dragIndex={dragIndex}
                    dragAbsY={dragAbsY}
                    isEditing={activeEditIndex === i}
                    editQuery={activeEditIndex === i ? editQuery : ""}
                    autocompleteResults={
                      activeEditIndex === i ? autocompleteResults : []
                    }
                    rowLabel={rowLabel}
                    canRemove={i > 0 && i < waypoints.length - 1}
                    canUseCurrentPosition={!wp.isCurrentPosition}
                    onDragStart={() => setScrollEnabled(false)}
                    onDragFinish={() => setScrollEnabled(true)}
                    onEditActivate={() => handleEditActivate(i)}
                    onSelectCurrentPosition={() =>
                      handleSelectCurrentPosition(i)
                    }
                    onQueryChange={setEditQuery}
                    onSelectResult={(r) => handleSelectResult(i, r)}
                    onRemove={() => removeStop(i)}
                    onDragEnd={reorderStops}
                  />
                );
              })}

              <TouchableOpacity
                style={styles.addStopButton}
                onPress={addStop}
                activeOpacity={0.7}
              >
                <MaterialIcons
                  name="add-circle-outline"
                  size={22}
                  color="#90adcb"
                />
                <Text style={styles.addStopText}>{t("addStop")}</Text>
              </TouchableOpacity>
            </ScrollView>

            {!keyboardVisible && (
              <View
                style={[
                  styles.plannerFooter,
                  { paddingBottom: insets.bottom + 12 },
                ]}
              >
                <View style={styles.plannerMiniMap}>
                  <View style={styles.mapBorder}>
                    <MapSnapshot pins={mapPins} />
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.calcButton, !canSave && { opacity: 0.4 }]}
                  onPress={() => {
                    if (!canSave) return;
                    setWaypoints((prev) => [
                      prev[0],
                      ...prev
                        .slice(1, -1)
                        .filter(
                          (w) => w.result !== null || w.isCurrentPosition,
                        ),
                      prev[prev.length - 1],
                    ]);
                    setActiveEditIndex(null);
                    setEditQuery("");
                    setAutocompleteResults([]);
                    setShowPlanner(false);
                  }}
                  activeOpacity={0.9}
                >
                  <MaterialIcons name="check" size={22} color="#fff" />
                  <Text style={styles.calcButtonText}>
                    {canSave ? t("save") : t("saveNotEnough")}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </GestureHandlerRootView>
      </Modal>
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
    borderBottomWidth: 1,
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
  scrollContent: { padding: 16, gap: 0 },
  summaryCard: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "#12202a",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    marginBottom: 20,
  },
  summaryCardExpanded: {
    flexDirection: "column",
    gap: 0,
    backgroundColor: "#12202a",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    marginBottom: 20,
  },
  expandedHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    gap: 8,
  },
  expandedCloseBtn: {
    padding: 4,
  },
  expandedMapBorder: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
    marginBottom: 0,
  },
  expandedMapSnapshot: {
    height: 278,
  },
  summaryLeft: { flex: 1.5, gap: 6 },
  summaryLabel: {
    color: "#90adcb",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 1,
  },
  summaryTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
    lineHeight: 22,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    minHeight: 20,
  },
  summaryDotCol: {
    width: 12,
    alignItems: "center",
    paddingTop: 3,
  },
  summaryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4a6a84",
  },
  summaryLine: {
    width: 2,
    flex: 1,
    minHeight: 10,
    backgroundColor: "rgba(144,173,203,0.2)",
    marginTop: 2,
    marginBottom: -4,
  },
  summaryRowText: { color: "#90adcb", fontSize: 13, flex: 1, paddingBottom: 6 },
  summaryRouteInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  summaryRouteDuration: { color: "#fff", fontSize: 15, fontWeight: "700" },
  summaryRouteSep: { color: "#90adcb", fontSize: 13 },
  summaryRouteDist: { color: "#90adcb", fontSize: 13 },
  summaryRouteLoading: { color: "#90adcb", fontSize: 13, fontStyle: "italic" },
  summaryRouteError: { color: "#ff6666", fontSize: 13 },
  summaryMap: {
    flex: 1,
    minHeight: 90,
  },
  mapBorder: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
  },
  summaryMapPlaceholder: { flex: 1, backgroundColor: "#1a2b3a" },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: { color: "#fff", fontSize: 17, fontWeight: "700" },
  settingsLink: { color: Colors.dark.primary, fontSize: 14, fontWeight: "600" },
  modesList: { gap: 10 },
  modeCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#12202a",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    minHeight: 80,
  },
  modeCardSelected: {
    borderWidth: 2,
    borderColor: Colors.dark.primary,
    shadowColor: Colors.dark.primary,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  expandedModeCard: {
    flexDirection: "column",
    backgroundColor: "#12202a",
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: Colors.dark.primary,
    marginBottom: 12,
    shadowColor: Colors.dark.primary,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  expandedModeIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.dark.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  modeLeft: { flexDirection: "row", alignItems: "center", gap: 14, flex: 1 },
  modeIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#1e3040",
    alignItems: "center",
    justifyContent: "center",
  },
  modeIconBoxSelected: { backgroundColor: Colors.dark.primary },
  modeInfo: { flex: 1 },
  modeLabelRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  modeName: { color: "#fff", fontSize: 15, fontWeight: "700" },
  badge: {
    backgroundColor: "rgba(13,127,242,0.2)",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    color: Colors.dark.primary,
    fontSize: 9,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  modeSub: { color: "#90adcb", fontSize: 13, marginTop: 2 },
  modeRight: { alignItems: "flex-end", gap: 2 },
  modeTime: { color: "#fff", fontSize: 15, fontWeight: "700" },
  modeDist: { color: "#90adcb", fontSize: 12 },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: "transparent",
  },
  startButton: {
    backgroundColor: Colors.dark.primary,
    borderRadius: 16,
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowColor: Colors.dark.primary,
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  startButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "800",
  },
  startButtonPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  startButtonPreviewText: {
    color: "#90adcb",
    fontSize: 12,
    flex: 1,
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
  editStopsButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.04)",
    marginBottom: 20,
  },
  editStopsText: {
    color: "#90adcb",
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#101922",
  },
  plannerScroll: {
    padding: 16,
    gap: 10,
    paddingBottom: 20,
  },
  plannerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#12202a",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },
  plannerRowDest: {
    borderColor: "rgba(13,127,242,0.3)",
  },
  plannerIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#1e3040",
    alignItems: "center",
    justifyContent: "center",
  },
  plannerInfo: { flex: 1 },
  plannerRowLabel: {
    color: "#90adcb",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  plannerRowTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  addStopButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "rgba(255,255,255,0.12)",
    paddingVertical: 18,
    marginTop: 4,
  },
  addStopText: {
    color: "#90adcb",
    fontSize: 15,
    fontWeight: "700",
  },
  plannerRowTitlePlaceholder: { color: "#90adcb" },
  stopInput: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "500",
    paddingVertical: 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.primary,
    marginTop: 2,
  },
  stopActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dragHandle: {
    padding: 4,
  },
  autocompleteDropdown: {
    position: "absolute",
    top: ITEM_HEIGHT + 2,
    left: 0,
    right: 0,
    backgroundColor: "#0e1f2e",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
    zIndex: 200,
    elevation: 16,
  },
  stopRowWrapper: {
    position: "relative",
    overflow: "visible",
  },
  autocompleteItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  autocompleteIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#223649",
    alignItems: "center",
    justifyContent: "center",
  },
  autocompleteItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  autocompleteTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  autocompleteSub: {
    color: "#90adcb",
    fontSize: 12,
    marginTop: 1,
  },
  plannerFooter: {
    backgroundColor: "#12202a",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    padding: 16,
    gap: 12,
  },
  plannerMiniMap: {
    position: "relative",
  },
  plannerMiniMapOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 10,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  plannerMiniMapText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "500",
  },
  plannerSummaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  plannerSummaryLabel: { color: "#90adcb", fontSize: 12, fontWeight: "500" },
  plannerSummaryValue: { color: "#fff", fontSize: 22, fontWeight: "800" },
  plannerSummaryUnit: { color: "#90adcb", fontSize: 13, fontWeight: "400" },
  calcButton: {
    backgroundColor: Colors.dark.primary,
    borderRadius: 16,
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowColor: Colors.dark.primary,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  calcButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "800",
  },
  alternativesSection: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  alternativesTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  alternativesScroll: {
    gap: 10,
    paddingBottom: 8,
  },
  alternativeCard: {
    backgroundColor: "#12202a",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minWidth: 130,
  },
  alternativeCardSelected: {
    borderColor: Colors.dark.primary,
    backgroundColor: "rgba(13,127,242,0.1)",
  },
  alternativeIndex: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  alternativeIndexText: {
    color: "#90adcb",
    fontSize: 14,
    fontWeight: "700",
  },
  alternativeIndexTextSelected: {
    color: Colors.dark.primary,
    backgroundColor: "rgba(13,127,242,0.2)",
  },
  alternativeInfo: {
    flex: 1,
    gap: 2,
  },
  alternativeDuration: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  alternativeDurationSelected: {
    color: Colors.dark.primary,
  },
  alternativeDistance: {
    color: "#90adcb",
    fontSize: 12,
  },
  alternativeDistanceSelected: {
    color: Colors.dark.primary,
  },
  alternativesDetailSection: {
    gap: 10,
    marginBottom: 20,
  },
  alternativeDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  alternativeDetailRowSelected: {
    backgroundColor: "rgba(13,127,242,0.12)",
    borderColor: Colors.dark.primary,
    borderWidth: 2,
  },
  alternativeDetailLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#6b7280",
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterSelected: {
    borderColor: Colors.dark.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.dark.primary,
  },
  alternativeDetailTitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    fontWeight: "700",
  },
  alternativeDetailTitleSelected: {
    color: "#fff",
  },
  alternativeDetailSub: {
    color: "#6b7280",
    fontSize: 12,
    marginTop: 2,
  },
  alternativeDetailSubSelected: {
    color: Colors.dark.primary,
  },
  alternativeDetailTime: {
    color: "#6b7280",
    fontSize: 15,
    fontWeight: "800",
  },
  alternativeDetailTimeSelected: {
    color: "#fff",
  },
});
