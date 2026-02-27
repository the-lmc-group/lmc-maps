import { createTranslator } from "@/i18n";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function ProfileScreen() {
  const router = useRouter();
  const { t } = createTranslator("profile");
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("title")}</Text>
      <TouchableOpacity onPress={() => router.push("/")} style={styles.button}>
        <Text style={styles.buttonText}>{t("go_home")}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#101922",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  title: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#0d7ff2",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
