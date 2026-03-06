import {
    HeartIcon,
    HomeIcon,
    SchoolIcon,
    StarIcon,
    TrashIcon,
    WorkIcon,
} from "@/assets/icons";
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

const PlaceIcons = [
  { id: "work", icon: WorkIcon },
  { id: "home", icon: HomeIcon },
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
        slot === "other"
          ? modalPlaceName
          : slot === "home"
            ? t("card_home")
            : t("card_work"),
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
                    <TrashIcon />
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.nameRow}>
                {slot === "other" && (
                  <View style={styles.iconCircle}>
                    {(() => {
                      const IconComponent =
                        PlaceIcons.find((i) => i.id === modalSelectedIcon)
                          ?.icon || StarIcon;
                      return React.createElement(
                        IconComponent as React.ComponentType<any>,
                        { color: Colors.dark.primary },
                      );
                    })()}
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
