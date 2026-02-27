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
import Svg, { Path } from "react-native-svg";
import { HapticSettingsProvider } from "../contexts/HapticSettingsContext";
import { PermissionsProvider } from "../contexts/PermissionsContext";
import { UserProvider, useUser } from "../contexts/UserContext";

import { useColorScheme } from "@/hooks/use-color-scheme";

export const unstable_settings = {};

function SplashScreenOverlay() {
  return (
    <View style={styles.splashContainer}>
      <View style={styles.logoContainer}>
        <Svg width={60} height={60} viewBox="0 -960 960 960">
          <Path
            d="M480-240 222-130q-13 5-24.5 2.5T178-138q-8-8-10.5-20t2.5-25l273-615q5-12 15.5-18t21.5-6q11 0 21.5 6t15.5 18l273 615q5 13 2.5 25T782-138q-8 8-19.5 10.5T738-130L480-240Z"
            fill="#0d7ff2"
          />
        </Svg>
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
