import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Switch,
} from "react-native";

interface SignalOverlayProps {
  visible: boolean;
  onClose: () => void;
  userLocation?: { latitude: number; longitude: number } | null;
  appVersion?: string;
  onSelectLocationOnMap?: (
    callback: (location: { latitude: number; longitude: number }) => void,
    onCancel?: () => void
  ) => void;
}

const ISSUE_TYPES = [
  "Bug d'affichage",
  "Crash/Blocage",
  "Erreur de navigation",
  "Données manquantes/incorrectes",
  "Suggestion d'amélioration",
];

export default function SignalOverlay({
  visible,
  onClose,
  userLocation,
  appVersion,
  onSelectLocationOnMap,
}: SignalOverlayProps) {
  const [issueType, setIssueType] = useState<string>("Bug d'affichage");
  const [details, setDetails] = useState("");
  const [sending, setSending] = useState(false);
  const [shareLocation, setShareLocation] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [isSelectingLocation, setIsSelectingLocation] = useState(false);
  const webhook =
    process.env.EXPO_PUBLIC_DISCORD_WEBHOOK_URL ||
    process.env.DISCORD_WEBHOOK_URL;

  const canSend = !!webhook && !sending && details.trim().length > 3;

  const getLocationText = () => {
    if (!shareLocation) {
      if (selectedLocation) {
        return `${selectedLocation.latitude.toFixed(
          5
        )}, ${selectedLocation.longitude.toFixed(5)}`;
      }
      return "Indisponible";
    }
    if (selectedLocation)
      return `${selectedLocation.latitude.toFixed(
        5
      )}, ${selectedLocation.longitude.toFixed(5)}`;
    if (userLocation)
      return `${userLocation.latitude.toFixed(
        5
      )}, ${userLocation.longitude.toFixed(5)}`;
    return "Indisponible";
  };

  const handleSelectLocation = () => {
    if (!onSelectLocationOnMap) return;
    setIsSelectingLocation(true);
    onSelectLocationOnMap(
      (location) => {
        setSelectedLocation(location);
        setIsSelectingLocation(false);
      },
      () => {
        setIsSelectingLocation(false);
      }
    );
  };

  const send = async () => {
    if (!webhook) return;
    setSending(true);
    try {
      const locationText = getLocationText();
      const content = `Nouveau signalement\nType: ${issueType}\nDétails: ${details}\nLocation: ${locationText}\nVersion: ${
        appVersion || ""
      }`;
      await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      onClose();
      setDetails("");
      setSelectedLocation(null);
      setShareLocation(true);
      setIsSelectingLocation(false);
    } catch {
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    setIsSelectingLocation(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Signaler un problème</Text>
          <View style={styles.chipsRow}>
            {ISSUE_TYPES.map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.chip, issueType === t && styles.chipActive]}
                onPress={() => setIssueType(t)}
              >
                <Text
                  style={[
                    styles.chipText,
                    issueType === t && styles.chipTextActive,
                  ]}
                >
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            value={details}
            onChangeText={setDetails}
            placeholder="Décrivez le problème..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
            style={styles.input}
          />

          <View style={styles.locationSection}>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Partager ma position</Text>
              <Switch
                value={shareLocation}
                onValueChange={(value) => {
                  setShareLocation(value);
                  if (!value) setSelectedLocation(null);
                }}
                trackColor={{ false: "#E5E7EB", true: "#007AFF" }}
                thumbColor="#fff"
              />
            </View>

            {shareLocation && (
              <View style={styles.locationOptions}>
                <Text style={styles.locationText}>
                  Position: {getLocationText()}
                </Text>
                {!shareLocation && onSelectLocationOnMap && (
                  <TouchableOpacity
                    style={styles.selectLocationBtn}
                    onPress={handleSelectLocation}
                    disabled={isSelectingLocation}
                  >
                    <Text style={styles.selectLocationText}>
                      {isSelectingLocation
                        ? "Sélection..."
                        : selectedLocation
                        ? "Changer la position"
                        : "Choisir sur la carte"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {!shareLocation && onSelectLocationOnMap && (
              <View style={styles.locationOptions}>
                <Text style={styles.locationText}>
                  Position: {getLocationText()}
                </Text>
                <TouchableOpacity
                  style={styles.selectLocationBtn}
                  onPress={handleSelectLocation}
                  disabled={isSelectingLocation}
                >
                  <Text style={styles.selectLocationText}>
                    {isSelectingLocation
                      ? "Sélection..."
                      : selectedLocation
                      ? "Changer la position"
                      : "Choisir sur la carte"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          {!webhook && (
            <Text style={styles.warning}>
              Webhook manquant. Ajoutez la variable
              EXPO_PUBLIC_DISCORD_WEBHOOK_URL dans .env
            </Text>
          )}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.btn, styles.btnSecondary]}
              onPress={handleClose}
              disabled={sending}
            >
              <Text style={[styles.btnText, styles.btnSecondaryText]}>
                Annuler
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.btn,
                styles.btnPrimary,
                !canSend && { opacity: 0.6 },
              ]}
              onPress={send}
              disabled={!canSend}
            >
              {sending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnPrimaryText}>Envoyer</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
  },
  title: { fontSize: 18, fontWeight: "600", marginBottom: 12, color: "#111" },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  chipActive: { backgroundColor: "#007AFF", borderColor: "#007AFF" },
  chipText: { color: "#111", fontSize: 12 },
  chipTextActive: { color: "#fff" },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    minHeight: 90,
    padding: 10,
    textAlignVertical: "top",
    color: "#111",
    marginBottom: 12,
  },
  locationSection: { marginBottom: 12 },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  switchLabel: { fontSize: 16, color: "#111", fontWeight: "500" },
  locationOptions: { backgroundColor: "#F8F9FA", borderRadius: 8, padding: 12 },
  locationText: { fontSize: 14, color: "#555", marginBottom: 8 },
  selectLocationBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#007AFF",
    borderRadius: 6,
  },
  selectLocationText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  warning: { marginTop: 8, color: "#FF3B30", fontSize: 12 },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 14,
  },
  btn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8 },
  btnSecondary: { backgroundColor: "#F3F4F6" },
  btnSecondaryText: { color: "#111" },
  btnPrimary: { backgroundColor: "#007AFF" },
  btnText: { fontWeight: "600" },
  btnPrimaryText: { color: "#fff", fontWeight: "600" },
});
