import { Colors } from "@/constants/theme";
import { usePosition } from "@/contexts/PositionContext";
import { useUser } from "@/contexts/UserContext";
import { createTranslator } from "@/i18n";
import {
  PhotonFeature,
  SearchEngineService,
} from "@/services/SearchEngineService";
import React from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";

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

export interface SavePlaceModalProps {
  visible: boolean;
  onClose: () => void;
  slot?: "home" | "work" | "other";
  editingIndex?: number | null;
  initialName?: string;
  initialAddress?: string;
  initialLat?: string;
  initialLng?: string;
}

export const SavePlaceModal: React.FC<SavePlaceModalProps> = ({
  visible,
  onClose,
  slot = "other",
  editingIndex = null,
  initialName = "",
  initialAddress = "",
  initialLat = "",
  initialLng = "",
}) => {
  const { t } = createTranslator("search");
  const { position } = usePosition();
  const { saved, setSavedPlace, addOtherPlace, removeOtherPlace } = useUser();
  const lastQueryRef = React.useRef<string | null>(null);

  const [modalPlaceName, setModalPlaceName] = React.useState(initialName);
  const [modalSelectedIcon, setModalSelectedIcon] = React.useState("heart");
  const [addrText, setAddrText] = React.useState(initialAddress);
  const [addrLat, setAddrLat] = React.useState(initialLat);
  const [addrLng, setAddrLng] = React.useState(initialLng);
  const [addrResults, setAddrResults] = React.useState<PhotonFeature[]>([]);

  React.useEffect(() => {
    if (visible) {
      setModalPlaceName(initialName);
      setAddrText(initialAddress);
      setAddrLat(initialLat);
      setAddrLng(initialLng);
      setAddrResults([]);
      lastQueryRef.current = null;
    }
  }, [visible, initialName, initialAddress, initialLat, initialLng]);

  React.useEffect(() => {
    const q = addrText.trim();
    if (!visible || !q || (addrLat && addrLng)) {
      setAddrResults([]);
      return;
    }
    if (lastQueryRef.current === q) return;

    const timer = setTimeout(async () => {
      try {
        const results = await SearchEngineService.photonSearch(q, {
          limit: 5,
          lat: position?.latitude,
          lon: position?.longitude,
        });
        lastQueryRef.current = q;
        setAddrResults(results);
      } catch {
        setAddrResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [addrText, visible, addrLat, addrLng, position]);

  const isEditing =
    visible &&
    ((slot === "home" && !!saved.home) ||
      (slot === "work" && !!saved.work) ||
      (slot === "other" && editingIndex !== null));

  const handleSave = () => {
    if (!addrText || !addrLat || !addrLng) return;
    const place = {
      address: addrText,
      lat: parseFloat(addrLat),
      lng: parseFloat(addrLng),
      name:
        slot === "other" ? modalPlaceName : slot === "home" ? "Home" : "Work",
      icon: slot === "other" ? modalSelectedIcon : slot,
    };

    if (slot === "home" || slot === "work") {
      setSavedPlace(slot, place);
    } else {
      if (editingIndex !== null) {
        removeOtherPlace(editingIndex);
      }
      addOtherPlace(place);
    }
    onClose();
  };

  const handleDelete = () => {
    if (slot === "home" || slot === "work") {
      setSavedPlace(slot, null);
    } else if (slot === "other" && editingIndex !== null) {
      removeOtherPlace(editingIndex);
    }
    onClose();
  };

  const modalTitle =
    slot === "home"
      ? t("modal_set_home")
      : slot === "work"
        ? t("modal_set_work")
        : t("modal_add_place");

  const canSave = !!(addrText && addrLat && addrLng);

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 80}
              style={styles.sheet}
            >
              <View style={styles.header}>
                <Text style={styles.title}>{modalTitle}</Text>
                {isEditing && (
                  <TouchableOpacity onPress={handleDelete}>
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

              <View style={styles.nameRow}>
                {slot === "other" && (
                  <View style={styles.iconCircle}>
                    {React.createElement(
                      PlaceIcons.find((i) => i.id === modalSelectedIcon)
                        ?.icon || StarIcon,
                      { color: Colors.dark.primary },
                    )}
                  </View>
                )}
                <TextInput
                  placeholder={t("modal_name_placeholder")}
                  placeholderTextColor="#90adcb"
                  style={styles.nameInput}
                  value={modalPlaceName}
                  onChangeText={setModalPlaceName}
                />
              </View>

              {slot === "other" && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.iconScroll}
                  contentContainerStyle={{ paddingHorizontal: 16 }}
                >
                  {PlaceIcons.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => setModalSelectedIcon(item.id)}
                      style={[
                        styles.iconOption,
                        modalSelectedIcon === item.id &&
                          styles.iconOptionActive,
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

              <View style={styles.addrBox}>
                <TextInput
                  placeholder={t("modal_addr_placeholder")}
                  placeholderTextColor="#90adcb"
                  style={styles.addrInput}
                  value={addrText}
                  onChangeText={(txt) => {
                    setAddrText(txt);
                    setAddrLat("");
                    setAddrLng("");
                  }}
                />
              </View>

              <ScrollView style={{ maxHeight: 200 }}>
                {addrResults.map((r, idx) => {
                  const label =
                    r.properties.name ||
                    [r.properties.housenumber, r.properties.street]
                      .filter(Boolean)
                      .join(" ") ||
                    r.properties.city ||
                    "";
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={styles.addrResult}
                      onPress={() => {
                        setAddrText(label);
                        setAddrLat(r.geometry.coordinates[1].toString());
                        setAddrLng(r.geometry.coordinates[0].toString());
                        setAddrResults([]);
                      }}
                    >
                      <Text style={{ color: "#fff", fontWeight: "600" }}>
                        {label}
                      </Text>
                      <Text style={{ color: "#90adcb", fontSize: 12 }}>
                        {r.properties.city}, {r.properties.country}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <TouchableOpacity
                style={[styles.saveBtn, !canSave && { opacity: 0.5 }]}
                onPress={handleSave}
                disabled={!canSave}
              >
                <Text style={styles.saveBtnText}>{t("modal_save")}</Text>
              </TouchableOpacity>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#101922",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: "50%",
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 24,
  },
  title: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    marginBottom: 16,
    backgroundColor: "#12202a",
    marginHorizontal: 16,
    borderRadius: 16,
    height: 72,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(13,127,242,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  nameInput: {
    flex: 1,
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  iconScroll: {
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
  iconOptionActive: {
    backgroundColor: Colors.dark.primary,
  },
  addrBox: {
    height: 56,
    borderRadius: 12,
    backgroundColor: "#12202a",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  addrInput: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
  },
  addrResult: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
    marginHorizontal: 16,
  },
  saveBtn: {
    backgroundColor: Colors.dark.primary,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    marginTop: 24,
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
});
