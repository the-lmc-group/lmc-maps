import { Colors } from "@/constants/theme";
import { useUser } from "@/contexts/UserContext";
import { createTranslator } from "@/i18n";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  ImageBackground,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import Svg, { Path } from "react-native-svg";

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

const GasIcon = () => (
  <Svg width={24} height={24} viewBox="0 -960 960 960">
    <Path
      d="M160-160v-600q0-33 23.5-56.5T240-840h240q33 0 56.5 23.5T560-760v280h40q33 0 56.5 23.5T680-400v180q0 17 11.5 28.5T720-180q17 0 28.5-11.5T760-220v-288q-9 5-19 6.5t-21 1.5q-42 0-71-29t-29-71q0-32 17.5-57.5T684-694l-63-63q-9-9-9-21t9-21q8-8 20.5-8.5T663-800l127 124q15 15 22.5 35t7.5 41v380q0 42-29 71t-71 29q-42 0-71-29t-29-71v-200h-60v260q0 17-11.5 28.5T520-120H200q-17 0-28.5-11.5T160-160Zm80-400h240v-200H240v200Zm480 0q17 0 28.5-11.5T760-600q0-17-11.5-28.5T720-640q-17 0-28.5 11.5T680-600q0 17 11.5 28.5T720-560ZM240-200h240v-280H240v280Zm240 0H240h240Z"
      fill="#e3e3e3"
    />
  </Svg>
);

const ParkingIcon = () => (
  <Svg width={24} height={24} viewBox="0 -960 960 960">
    <Path
      d="M400-360v160q0 33-23.5 56.5T320-120q-33 0-56.5-23.5T240-200v-560q0-33 23.5-56.5T320-840h200q100 0 170 70t70 170q0 100-70 170t-170 70H400Zm0-160h128q33 0 56.5-23.5T608-600q0-33-23.5-56.5T528-680H400v160Z"
      fill="#e3e3e3"
    />
  </Svg>
);

const CoffeeIcon = () => (
  <Svg width={24} height={24} viewBox="0 -960 960 960">
    <Path
      d="M440-240q-117 0-198.5-81.5T160-520v-240q0-33 23.5-56.5T240-840h500q58 0 99 41t41 99q0 58-41 99t-99 41h-20v40q0 117-81.5 198.5T440-240ZM240-640h400v-120H240v120Zm200 320q83 0 141.5-58.5T640-520v-40H240v40q0 83 58.5 141.5T440-320Zm280-320h20q25 0 42.5-17.5T800-700q0-25-17.5-42.5T740-760h-20v120ZM200-120q-17 0-28.5-11.5T160-160q0-17 11.5-28.5T200-200h560q17 0 28.5 11.5T800-160q0 17-11.5 28.5T760-120H200Zm240-440Z"
      fill="#e3e3e3"
    />
  </Svg>
);

const EvIcon = () => (
  <Svg width={24} height={24} viewBox="0 -960 960 960">
    <Path
      d="M240-560h240v-200H240v200Zm0 360h240v-280H240v280Zm240 0H240h240Zm40 80H200q-17 0-28.5-11.5T160-160v-600q0-33 23.5-56.5T240-840h240q33 0 56.5 23.5T560-760v280h50q29 0 49.5 20.5T680-410v185q0 17 14 31t31 14q18 0 31.5-14t13.5-31v-375h-10q-17 0-28.5-11.5T720-640v-60q0-8 6-14t14-6v-40q0-8 6-14t14-6q8 0 14 6t6 14v40h40v-40q0-8 6-14t14-6q8 0 14 6t6 14v40q8 0 14 6t6 14v60q0 17-11.5 28.5T840-600h-10v375q0 42-30.5 73.5T725-120q-43 0-74-31.5T620-225v-185q0-5-2.5-7.5T610-420h-50v260q0 17-11.5 28.5T520-120Zm-180-80 100-160h-60v-120L280-320h60v120Z"
      fill="#e3e3e3"
    />
  </Svg>
);

const FoodIcon = () => (
  <Svg width={24} height={24} viewBox="0 -960 960 960">
    <Path
      d="M479-422 203-148q-11 11-27.5 11.5T147-148q-11-11-11-28t11-28l382-382q-18-42-5-95t57-95q53-53 118-62t106 32q41 41 32 106t-62 118q-42 44-95 57t-95-5l-50 50 276 276q11 11 11.5 27.5T811-148q-11 11-28 11t-28-11L479-422Zm-186-40L173-582q-42-42-53-106t25-114q11-15 29.5-17t31.5 12l215 217-128 128Z"
      fill="#e3e3e3"
    />
  </Svg>
);

const AmenityIcon = () => (
  <Svg width={24} height={24} viewBox="0 -960 960 960">
    <Path
      fill="#fff"
      d="M461-122.5q-9-4.5-15-14.5L265-439q-6-10-9-20t-3-21q0-11 3-21t9-20l181-302q6-10 15-14.5t19-4.5q10 0 19 4.5t15 14.5l181 302q6 10 9 20t3 21q0 11-3 21t-9 20L514-137q-6 10-15 14.5t-19 4.5q-10 0-19-4.5ZM480-236l147-244-147-244-147 244 147 244Zm0-244Z"
    />
  </Svg>
);

const AddressIcon = () => (
  <Svg width={24} height={24} viewBox="0 -960 960 960" fill="#e3e3e3">
    <Path d="M480-186q122-112 181-203.5T720-552q0-109-69.5-178.5T480-800q-101 0-170.5 69.5T240-552q0 71 59 162.5T480-186Zm-28 74q-14-5-25-15-65-60-115-117t-83.5-110.5q-33.5-53.5-51-103T160-552q0-150 96.5-239T480-880q127 0 223.5 89T800-552q0 45-17.5 94.5t-51 103Q698-301 648-244T533-127q-11 10-25 15t-28 5q-14 0-28-5Zm28-448Zm56.5 56.5Q560-527 560-560t-23.5-56.5Q513-640 480-640t-56.5 23.5Q400-593 400-560t23.5 56.5Q447-480 480-480t56.5-23.5Z" />
  </Svg>
);

const BusStopIcon = () => (
  <Svg width={24} height={24} viewBox="0 -960 960 960" fill="#e3e3e3">
    <Path d="M320-200v20q0 25-17.5 42.5T260-120q-25 0-42.5-17.5T200-180v-62q-18-20-29-44.5T160-340v-380q0-83 77-121.5T480-880q172 0 246 37t74 123v380q0 29-11 53.5T760-242v62q0 25-17.5 42.5T700-120q-25 0-42.5-17.5T640-180v-20H320Zm162-560h224-448 224Zm158 280H240h480-80Zm-400-80h480v-120H240v120Zm142.5 222.5Q400-355 400-380t-17.5-42.5Q365-440 340-440t-42.5 17.5Q280-405 280-380t17.5 42.5Q315-320 340-320t42.5-17.5Zm280 0Q680-355 680-380t-17.5-42.5Q645-440 620-440t-42.5 17.5Q560-405 560-380t17.5 42.5Q595-320 620-320t42.5-17.5ZM258-760h448q-15-17-64.5-28.5T482-800q-107 0-156.5 12.5T258-760Zm62 480h320q33 0 56.5-23.5T720-360v-120H240v120q0 33 23.5 56.5T320-280Z" />
  </Svg>
);

const TrainStationIcon = () => (
  <Svg width={24} height={24} viewBox="0 -960 960 960" fill="#e3e3e3">
    <Path d="M300-200q-59 0-99.5-40.5T160-340v-380q0-83 77-121.5T480-880q172 0 246 37t74 123v380q0 59-40.5 99.5T660-200l65 43q12 8 8 22.5T714-120H246q-15 0-19-14.5t8-22.5l65-43Zm-60-360h200v-120H240v120Zm420 80H240h480-60Zm-140-80h200v-120H520v120ZM382.5-337.5Q400-355 400-380t-17.5-42.5Q365-440 340-440t-42.5 17.5Q280-405 280-380t17.5 42.5Q315-320 340-320t42.5-17.5Zm280 0Q680-355 680-380t-17.5-42.5Q645-440 620-440t-42.5 17.5Q560-405 560-380t17.5 42.5Q595-320 620-320t42.5-17.5ZM300-280h360q26 0 43-17t17-43v-140H240v140q0 26 17 43t43 17Zm180-520q-86 0-142.5 10T258-760h448q-18-20-74.5-30T480-800Zm0 40h226-448 222Z" />
  </Svg>
);

const HeartIcon = ({ color = "#e3e3e3" }) => (
  <Svg width={24} height={24} viewBox="0 -960 960 960" fill={color}>
    <Path d="m480-120-58-53q-101-91-167-157T150-447q-39-51-54.5-97T80-639q0-104 70.5-174.5T325-884q55 0 105 25t88 71q38-46 88-71t105-25q104 0 174.5 70.5T956-639q0 49-15.5 95T886-447q-39 51-105 117T614-173l-58 53h-76Z" />
  </Svg>
);

const StarIcon = ({ color = "#e3e3e3" }) => (
  <Svg width={24} height={24} viewBox="0 -960 960 960" fill={color}>
    <Path d="m233-120 65-281L80-590l288-25 112-265 112 265 288 25-218 189 65 281-247-149-247 149Z" />
  </Svg>
);

const SchoolIcon = ({ color = "#e3e3e3" }) => (
  <Svg height={24} viewBox="0 -960 960 960" width={24} fill={color}>
    <Path d="M242-249q-20-11-31-29.5T200-320v-192l-96-53q-11-6-16-15t-5-20q0-11 5-20t16-15l338-184q9-5 18.5-7.5T480-829q10 0 19.5 2.5T518-819l381 208q10 5 15.5 14.5T920-576v256q0 17-11.5 28.5T880-280q-17 0-28.5-11.5T840-320v-236l-80 44v192q0 23-11 41.5T718-249L518-141q-9 5-18.5 7.5T480-131q-10 0-19.5-2.5T442-141L242-249Zm238-203 274-148-274-148-274 148 274 148Zm0 241 200-108v-151l-161 89q-9 5-19 7.5t-20 2.5q-10 0-20-2.5t-19-7.5l-161-89v151l200 108Zm0-241Zm0 121Zm0 0Z" />
  </Svg>
);

const HomeIconSelect = ({ color = "#e3e3e3" }) => (
  <Svg width={24} height={24} viewBox="0 -960 960 960" fill={color}>
    <Path d="M160-120v-480l320-240 320 240v480H560v-280H400v280H160Z" />
  </Svg>
);

const WorkIconSelect = ({ color = "#e3e3e3" }) => (
  <Svg width={24} height={24} viewBox="0 -960 960 960" fill={color}>
    <Path d="M160-120q-33 0-56.5-23.5T80-200v-440q0-33 23.5-56.5T160-720h160v-80q0-33 23.5-56.5T400-880h160q33 0 56.5 23.5T640-800v80h160q33 0 56.5 23.5T880-640v440q0 33-23.5 56.5T800-120H160Zm0-80h640v-440H160v440Zm240-520h160v-80H400v80ZM160-200v-440 440Z" />
  </Svg>
);

const PlaceIcons = [
  { id: "home", icon: HomeIconSelect },
  { id: "work", icon: WorkIconSelect },
  { id: "heart", icon: HeartIcon },
  { id: "star", icon: StarIcon },
  { id: "school", icon: SchoolIcon },
];

const EditIcon = () => (
  <Svg width={24} height={24} viewBox="0 -960 960 960" fill="#e3e3e3">
    <Path d="M200-200h57l391-391-57-57-391 391v57Zm-40 80q-17 0-28.5-11.5T120-160v-97q0-16 6-30.5t17-25.5l505-504q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L313-143q-11 11-25.5 17t-30.5 6h-97Zm600-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z" />
  </Svg>
);

const AddPlaceIcon = () => (
  <Svg width={24} height={24} viewBox="0 -960 960 960" fill="#e3e3e3">
    <Path d="M440-520v80q0 17 11.5 28.5T480-400q17 0 28.5-11.5T520-440v-80h80q17 0 28.5-11.5T640-560q0-17-11.5-28.5T600-600h-80v-80q0-17-11.5-28.5T480-720q-17 0-28.5 11.5T440-680v80h-80q-17 0-28.5 11.5T320-560q0 17 11.5 28.5T360-520h80Zm40 334q122-112 181-203.5T720-552q0-109-69.5-178.5T480-800q-101 0-170.5 69.5T240-552q0 71 59 162.5T480-186Zm-28 74q-14-5-25-15-65-60-115-117t-83.5-110.5q-33.5-53.5-51-103T160-552q0-150 96.5-239T480-880q127 0 223.5 89T800-552q0 45-17.5 94.5t-51 103Q698-301 648-244T533-127q-11 10-25 15t-28 5q-14 0-28-5Zm28-448Z" />
  </Svg>
);

const SearchResult: React.FC<{
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress?: () => void;
}> = ({ icon, title, subtitle, onPress }) => (
  <TouchableOpacity style={styles.listItem} onPress={onPress}>
    <View style={styles.itemIcon}>{icon}</View>
    <View style={styles.itemBody}>
      <Text style={styles.itemTitle}>{title}</Text>
      {subtitle ? <Text style={styles.itemSub}>{subtitle}</Text> : null}
    </View>
    <Svg width={24} height={24} viewBox="0 -960 960 960" fill="#e3e3e3">
      <Path d="M680-624 244-188q-11 11-28 11t-28-11q-11-11-11-28t11-28l436-436H400q-17 0-28.5-11.5T360-720q0-17 11.5-28.5T400-760h320q17 0 28.5 11.5T760-720v320q0 17-11.5 28.5T720-360q-17 0-28.5-11.5T680-400v-224Z" />
    </Svg>
  </TouchableOpacity>
);

export default function SearchScreen() {
  const { t } = createTranslator("search");
  const router = useRouter();
  const { searchParams } = useLocalSearchParams();
  const initialMode =
    searchParams === "explore"
      ? "explore"
      : searchParams === "saved"
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
  const { saved, setSavedPlace, addOtherPlace, removeOtherPlace } = useUser();

  const [modalVisible, setModalVisible] = React.useState(false);
  const [modalSlot, setModalSlot] = React.useState<"home" | "work" | "other">(
    "home",
  );
  const [modalPlaceName, setModalPlaceName] = React.useState("");
  const [modalSelectedIcon, setModalSelectedIcon] = React.useState("heart");
  const [addrText, setAddrText] = React.useState("");
  const [addrLat, setAddrLat] = React.useState("");
  const [addrLng, setAddrLng] = React.useState("");
  const [modalAddrResults, setModalAddrResults] = React.useState<
    PhotonFeature[]
  >([]);
  const [modalEditingIndex, setModalEditingIndex] = React.useState<
    number | null
  >(null);
  const isEditing =
    modalVisible &&
    ((modalSlot === "home" && !!saved.home) ||
      (modalSlot === "work" && !!saved.work) ||
      (modalSlot === "other" && modalEditingIndex !== null));

  const handleSavePlace = () => {
    if (!addrText || !addrLat || !addrLng) return;
    const place = {
      address: addrText,
      lat: parseFloat(addrLat),
      lng: parseFloat(addrLng),
      name:
        modalSlot === "other"
          ? modalPlaceName
          : modalSlot === "home"
            ? "Home"
            : "Work",
      icon: modalSlot === "other" ? modalSelectedIcon : modalSlot,
    };

    if (modalSlot === "home" || modalSlot === "work") {
      setSavedPlace(modalSlot, place);
    } else {
      if (modalEditingIndex !== null) {
        removeOtherPlace(modalEditingIndex);
        addOtherPlace(place);
      } else {
        addOtherPlace(place);
      }
    }
    setModalVisible(false);
    setModalEditingIndex(null);
  };

  const handleDeletePlace = () => {
    if (modalSlot === "home" || modalSlot === "work") {
      setSavedPlace(modalSlot, null);
    } else if (modalSlot === "other" && modalEditingIndex !== null) {
      removeOtherPlace(modalEditingIndex);
    }
    setModalVisible(false);
    setModalEditingIndex(null);
  };
  React.useEffect(() => {
    const q = addrText.trim();
    if (!modalVisible || !q || (addrLat && addrLng)) {
      setModalAddrResults([]);
      return;
    }

    const t = setTimeout(async () => {
      try {
        const results = await SearchEngineService.photonSearch(q, {
          limit: 5,
        });
        setModalAddrResults(results);
      } catch {
        setModalAddrResults([]);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [addrText, modalVisible, addrLat, addrLng]);

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
      return;
    }

    let mounted = true;
    const t = setTimeout(async () => {
      try {
        console.log("SearchScreen: performing search for:", q);
        const results = await SearchEngineService.photonSearch(q, {
          limit: 10,
        });
        console.log("SearchScreen: received results:", results.length);
        if (mounted) setAddressResults(results);
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
            <Svg width={24} height={24} viewBox="0 -960 960 960" fill="#e3e3e3">
              <Path d="m313-440 196 196q12 12 11.5 28T508-188q-12 11-28 11.5T452-188L188-452q-6-6-8.5-13t-2.5-15q0-8 2.5-15t8.5-13l264-264q11-11 27.5-11t28.5 11q12 12 12 28.5T508-715L313-520h447q17 0 28.5 11.5T800-480q0 17-11.5 28.5T760-440H313Z" />
            </Svg>
          </TouchableOpacity>
          <Text style={styles.title}>{t("title")}</Text>
          <TouchableOpacity
            style={styles.avatar}
            onPress={() => router.push("/(main)/profile")}
          >
            <Svg width={30} height={30} viewBox="0 -960 960 960">
              <Path
                d="M367-527q-47-47-47-113t47-113q47-47 113-47t113 47q47 47 47 113t-47 113q-47 47-113 47t-113-47ZM160-240v-32q0-34 17.5-62.5T224-378q62-31 126-46.5T480-440q66 0 130 15.5T736-378q29 15 46.5 43.5T800-272v32q0 33-23.5 56.5T720-160H240q-33 0-56.5-23.5T160-240Zm80 0h480v-32q0-11-5.5-20T700-306q-54-27-109-40.5T480-360q-56 0-111 13.5T260-306q-9 5-14.5 14t-5.5 20v32Zm296.5-343.5Q560-607 560-640t-23.5-56.5Q513-720 480-720t-56.5 23.5Q400-673 400-640t23.5 56.5Q447-560 480-560t56.5-23.5ZM480-640Zm0 400Z"
                fill={Colors.dark.primary}
              />
            </Svg>
          </TouchableOpacity>
        </View>

        <View style={styles.searchArea}>
          {mode !== "saved" && (
            <View style={styles.searchBox}>
              <Text style={styles.searchIcon}>
                <Svg
                  width={24}
                  height={24}
                  viewBox="0 -960 960 960"
                  fill="#90adcb"
                >
                  <Path d="M380-320q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l224 224q11 11 11 28t-11 28q-11 11-28 11t-28-11L532-372q-30 24-69 38t-83 14Zm0-80q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z" />
                </Svg>
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

                    const noStreet =
                      !r.properties?.housenumber && !r.properties?.street;
                    const title =
                      isStation && r.properties?.name
                        ? r.properties.name
                        : noStreet
                          ? r.properties?.city
                          : [r.properties?.housenumber, r.properties?.street]
                              .filter(Boolean)
                              .join(" ");
                    const subtitle = noStreet
                      ? r.properties?.country
                      : r.properties?.city + ", " + r.properties?.country;

                    const PlaceIcon = noStreet ? (
                      <Svg
                        width={24}
                        height={24}
                        viewBox="0 -960 960 960"
                        fill="#e3e3e3"
                      >
                        <Path d="M120-200v-400q0-33 23.5-56.5T200-680h160v-47q0-16 6-30.5t17-25.5l40-40q23-23 57-23t57 23l40 40q11 11 17 25.5t6 30.5v207h160q33 0 56.5 23.5T840-440v240q0 33-23.5 56.5T760-120H200q-33 0-56.5-23.5T120-200Zm80 0h80v-80h-80v80Zm0-160h80v-80h-80v80Zm0-160h80v-80h-80v80Zm240 320h80v-80h-80v80Zm0-160h80v-80h-80v80Zm0-160h80v-80h-80v80Zm0-160h80v-80h-80v80Zm240 480h80v-80h-80v80Zm0-160h80v-80h-80v80Z" />
                      </Svg>
                    ) : r.properties.osm_value === "bus_stop" ? (
                      <BusStopIcon />
                    ) : isStation ? (
                      <TrainStationIcon />
                    ) : (
                      <AddressIcon />
                    );

                    return (
                      <SearchResult
                        key={`${r.properties?.osm_type || "p"}_${r.properties?.osm_id || r.geometry?.coordinates.join("_")}`}
                        icon={PlaceIcon}
                        title={title || t("unknown_place")}
                        subtitle={subtitle}
                        onPress={() => setQuery(title || "")}
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
                  icon={
                    <Svg
                      width={24}
                      height={24}
                      viewBox="0 -960 960 960"
                      fill="#e3e3e3"
                    >
                      <Path d="M480-120q-126 0-223-76.5T131-392q-4-15 6-27.5t27-14.5q16-2 29 6t18 24q24 90 99 147t170 57q117 0 198.5-81.5T760-480q0-117-81.5-198.5T480-760q-69 0-129 32t-101 88h70q17 0 28.5 11.5T360-600q0 17-11.5 28.5T320-560H160q-17 0-28.5-11.5T120-600v-160q0-17 11.5-28.5T160-800q17 0 28.5 11.5T200-760v54q51-64 124.5-99T480-840q75 0 140.5 28.5t114 77q48.5 48.5 77 114T840-480q0 75-28.5 140.5t-77 114q-48.5 48.5-114 77T480-120Zm40-376 100 100q11 11 11 28t-11 28q-11 11-28 11t-28-11L452-452q-6-6-9-13.5t-3-15.5v-159q0-17 11.5-28.5T480-680q17 0 28.5 11.5T520-640v144Z" />
                    </Svg>
                  }
                  title="1 rue de bonjour"
                  subtitle="issou, France"
                />

                <SearchResult
                  icon={
                    <Svg
                      width={24}
                      height={24}
                      viewBox="0 -960 960 960"
                      fill="#e3e3e3"
                    >
                      <Path d="M160-120q-33 0-56.5-23.5T80-200v-440q0-33 23.5-56.5T160-720h160v-80q0-33 23.5-56.5T400-880h160q33 0 56.5 23.5T640-800v80h160q33 0 56.5 23.5T880-640v440q0 33-23.5 56.5T800-120H160Zm0-80h640v-440H160v440Zm240-520h160v-80H400v80ZM160-200v-440 440Z" />
                    </Svg>
                  }
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
                    setModalSlot("home");
                    setModalPlaceName("Home");
                    setAddrText(saved?.home?.address ?? "");
                    setAddrLat(saved?.home?.lat?.toString() ?? "");
                    setAddrLng(saved?.home?.lng?.toString() ?? "");
                    setModalEditingIndex(null);
                    setModalVisible(true);
                  }}
                >
                  <View style={styles.favCardHeader}>
                    <View style={{ flexDirection: "column", flex: 1 }}>
                      <View style={styles.favTitleRow}>
                        <View style={styles.favIconPlaceholder}>
                          <HomeIconSelect color={Colors.dark.primary} />
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
                        setModalPlaceName("Home");
                        setAddrText(saved?.home?.address ?? "");
                        setAddrLat(saved?.home?.lat?.toString() ?? "");
                        setAddrLng(saved?.home?.lng?.toString() ?? "");
                        setModalVisible(true);
                      }}
                    >
                      {saved.home ? <EditIcon /> : <AddPlaceIcon />}
                    </TouchableOpacity>
                  </View>
                  {saved.home &&
                  saved.home.lat &&
                  saved.home.lng &&
                  saved.home.address ? (
                    <MapSnapshot lat={saved.home.lat} lng={saved.home.lng} />
                  ) : (
                    <View style={styles.favMapPreview} />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.favCard}
                  onPress={() => {
                    setModalSlot("work");
                    setModalPlaceName("Work");
                    setAddrText(saved?.work?.address ?? "");
                    setAddrLat(saved?.work?.lat?.toString() ?? "");
                    setAddrLng(saved?.work?.lng?.toString() ?? "");
                    setModalEditingIndex(null);
                    setModalVisible(true);
                  }}
                >
                  <View style={styles.favCardHeader}>
                    <View style={{ flexDirection: "column", flex: 1 }}>
                      <View style={styles.favTitleRow}>
                        <View style={styles.favIconPlaceholder}>
                          <WorkIconSelect color={Colors.dark.primary} />
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
                        setModalPlaceName("Work");
                        setAddrText(saved?.work?.address ?? "");
                        setAddrLat(saved?.work?.lat?.toString() ?? "");
                        setAddrLng(saved?.work?.lng?.toString() ?? "");
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
                        setModalSlot("other");
                        setModalEditingIndex(idx);
                        setModalPlaceName(place.name || "");
                        setModalSelectedIcon(place.icon || "heart");
                        setAddrText(place.address);
                        setAddrLat(place.lat?.toString() || "");
                        setAddrLng(place.lng?.toString() || "");
                        setModalVisible(true);
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
                            setModalPlaceName(place.name || "");
                            setModalSelectedIcon(place.icon || "heart");
                            setAddrText(place.address);
                            setAddrLat(place.lat?.toString() || "");
                            setAddrLng(place.lng?.toString() || "");
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
                    setModalPlaceName("");
                    setModalSelectedIcon("heart");
                    setAddrText("");
                    setAddrLat("");
                    setAddrLng("");
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
            <Svg
              width={24}
              height={24}
              viewBox="0 -960 960 960"
              fill={mode === "explore" ? Colors.dark.primary : "#e3e3e3"}
            >
              <Path d="m335-310 202-58q20-6 34.5-20.5T592-423l58-202q3-11-5.5-19.5T625-650l-202 58q-20 6-34.5 20.5T368-537l-58 202q-3 11 5.5 19.5T335-310Zm145-110q-25 0-42.5-17.5T420-480q0-25 17.5-42.5T480-540q25 0 42.5 17.5T540-480q0 25-17.5 42.5T480-420Zm0 340q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q133 0 226.5-93.5T800-480q0-133-93.5-226.5T480-800q-133 0-226.5 93.5T160-480q0 133 93.5 226.5T480-160Zm0-320Z" />
            </Svg>
            <Text
              style={styles.navLabel}
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
            <Svg
              width={24}
              height={24}
              viewBox="0 -960 960 960"
              fill={mode === "search" ? Colors.dark.primary : "#e3e3e3"}
            >
              <Path d="M380-320q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l224 224q11 11 11 28t-11 28q-11 11-28 11t-28-11L532-372q-30 24-69 38t-83 14Zm0-80q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z" />
            </Svg>
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
            <Svg
              width={24}
              height={24}
              viewBox="0 -960 960 960"
              fill={mode === "saved" ? Colors.dark.primary : "#e3e3e3"}
            >
              <Path d="m480-240-168 72q-40 17-76-6.5T200-241v-519q0-33 23.5-56.5T280-840h400q33 0 56.5 23.5T760-760v519q0 43-36 66.5t-76 6.5l-168-72Zm0-88 200 86v-518H280v518l200-86Zm0-432H280h400-200Z" />
            </Svg>
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

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {modalSlot === "home"
                      ? t("modal_set_home")
                      : modalSlot === "work"
                        ? t("modal_set_work")
                        : t("modal_add_place")}
                  </Text>
                  {isEditing && (
                    <TouchableOpacity onPress={handleDeletePlace}>
                      <Svg
                        width={24}
                        height={24}
                        viewBox="0 -960 960 960"
                        fill="#f55"
                      >
                        <Path d="M280-120q-33 0-56.5-23.5T200-200v-520q-17 0-28.5-11.5T160-760q0-17 11.5-28.5T200-800h160q0-17 11.5-28.5T400-840h160q17 0 28.5 11.5T600-800h160q17 0 28.5 11.5T800-760q0 17-11.5 28.5T760-720v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM428.5-291.5Q440-303 440-320v-280q0-17-11.5-28.5T400-640q-17 0-28.5 11.5T360-600v280q0 17 11.5 28.5T400-280q17 0 28.5-11.5Zm160 0Q600-303 600-320v-280q0-17-11.5-28.5T560-640q-17 0-28.5 11.5T520-600v280q0 17 11.5 28.5T560-280q17 0 28.5-11.5ZM280-720v520-520Z" />
                      </Svg>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.iconNameContainer}>
                  <View style={styles.selectedIconCircle}>
                    {React.createElement(
                      PlaceIcons.find((i) => i.id === modalSelectedIcon)
                        ?.icon || StarIcon,
                      { color: Colors.dark.primary },
                    )}
                  </View>
                  <TextInput
                    placeholder={t("modal_name_placeholder")}
                    placeholderTextColor="#90adcb"
                    style={styles.modalInputName}
                    value={modalPlaceName}
                    onChangeText={setModalPlaceName}
                  />
                </View>

                {modalSlot === "other" && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.iconPickerScroll}
                    contentContainerStyle={{ paddingHorizontal: 16 }}
                  >
                    {PlaceIcons.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        onPress={() => setModalSelectedIcon(item.id)}
                        style={[
                          styles.iconOption,
                          modalSelectedIcon === item.id &&
                            styles.iconOptionSelected,
                        ]}
                      >
                        <item.icon
                          color={
                            modalSelectedIcon === item.id ? "#fff" : "#90adcb"
                          }
                        />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}

                <View style={styles.modalSearchBox}>
                  <TextInput
                    placeholder={t("modal_addr_placeholder")}
                    placeholderTextColor="#90adcb"
                    style={styles.modalInputAddr}
                    value={addrText}
                    onChangeText={(txt) => {
                      setAddrText(txt);
                      setAddrLat("");
                      setAddrLng("");
                    }}
                  />
                </View>

                <ScrollView style={{ maxHeight: 200 }}>
                  {modalAddrResults.map((r, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={styles.modalAddrResult}
                      onPress={() => {
                        const title =
                          r.properties.name ||
                          [r.properties.housenumber, r.properties.street]
                            .filter(Boolean)
                            .join(" ") ||
                          r.properties.city ||
                          "";
                        setAddrText(title);
                        setAddrLat(r.geometry.coordinates[1].toString());
                        setAddrLng(r.geometry.coordinates[0].toString());
                        setModalAddrResults([]);
                      }}
                    >
                      <Text style={{ color: "#fff", fontWeight: "600" }}>
                        {r.properties.name ||
                          [r.properties.housenumber, r.properties.street]
                            .filter(Boolean)
                            .join(" ") ||
                          r.properties.city}
                      </Text>
                      <Text style={{ color: "#90adcb", fontSize: 12 }}>
                        {r.properties.city}, {r.properties.country}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <TouchableOpacity
                  style={[
                    styles.modalSaveButton,
                    (!addrLat || !addrLng) && { opacity: 0.5 },
                  ]}
                  onPress={handleSavePlace}
                  disabled={!addrLat || !addrLng}
                >
                  <Text style={styles.modalSaveButtonText}>
                    {t("modal_save")}
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
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

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#101922",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: "50%",
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 24,
  },
  modalTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
  },
  iconNameContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    marginBottom: 16,
    backgroundColor: "#12202a",
    marginHorizontal: 16,
    borderRadius: 16,
    height: 72,
  },
  selectedIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(13,127,242,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  modalInputName: {
    flex: 1,
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  iconPickerScroll: {
    marginBottom: 24,
  },
  iconOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#12202a",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  iconOptionSelected: {
    backgroundColor: Colors.dark.primary,
  },
  modalDeleteButton: {
    marginLeft: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#422",
    borderRadius: 8,
  },
  modalSearchBox: {
    height: 56,
    borderRadius: 12,
    backgroundColor: "#12202a",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  modalInputAddr: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
  },
  modalAddrResult: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
    marginHorizontal: 16,
  },
  modalSaveButton: {
    backgroundColor: Colors.dark.primary,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    marginTop: 24,
  },
  modalSaveButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
});
