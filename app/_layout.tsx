import { AppLogoIcon } from "@/assets/icons";
import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
} from "@react-navigation/native";
import { Slot, usePathname, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import "react-native-reanimated";
import { HapticSettingsProvider } from "../contexts/HapticSettingsContext";
import { PermissionsProvider } from "../contexts/PermissionsContext";
import { UserProvider, useUser } from "../contexts/UserContext";

import { useColorScheme } from "@/hooks/use-color-scheme";

export const unstable_settings = {};

function SplashScreenOverlay() {
  return (
    <View style={styles.splashContainer}>
      <View style={styles.logoContainer}>
        <AppLogoIcon width={60} height={60} />
      </View>
    </View>
  );
}

function InnerLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const pathname = usePathname();
  const { hasFinishedOnboarding, isLoading } = useUser();
  const [showSplash, setShowSplash] = useState(true);
  const [navigationDone, setNavigationDone] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    const alwaysShowOnboarding =
      process.env.EXPO_PUBLIC_SHOW_ONBOARDING_ALWAYS === "true";

    if (alwaysShowOnboarding) {
      if (!pathname.startsWith("/(onboarding)")) {
        router.replace("/(onboarding)/step1");
        setNavigationDone(true);
      }
      return;
    }

    if (hasFinishedOnboarding) {
      if (pathname.startsWith("/(onboarding)")) {
        router.replace("/(main)");
        setNavigationDone(true);
      }

      setNavigationDone(true);
      return;
    }

    const isOnboardingStep = [
      "/step1",
      "/step2",
      "/step3",
      "/step4",
      "/step5",
    ].some((step) => pathname.includes(step));

    if (!isOnboardingStep) {
      router.replace("/(onboarding)/step1");
      setNavigationDone(true);
    } else {
      setNavigationDone(true);
    }
  }, [hasFinishedOnboarding, pathname, router, isLoading]);

  useEffect(() => {
    if (!isLoading && navigationDone) {
      setTimeout(() => setShowSplash(false), 300);
    }
  }, [isLoading, navigationDone]);

  return (
    <>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Slot />
        <StatusBar style="auto" />
      </ThemeProvider>
      {showSplash && <SplashScreenOverlay />}
    </>
  );
}

export default function RootLayout() {
  return (
    <PermissionsProvider>
      <HapticSettingsProvider>
        <UserProvider>
          <InnerLayout />
        </UserProvider>
      </HapticSettingsProvider>
    </PermissionsProvider>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
});
