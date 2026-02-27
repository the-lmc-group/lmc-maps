import { PositionProvider } from "@/contexts/PositionContext";
import { Slot } from "expo-router";
import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PermissionsProvider } from "../../contexts/PermissionsContext";

export default function Layout() {
  return (
    <PermissionsProvider>
      <PositionProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <Slot />
        </GestureHandlerRootView>
      </PositionProvider>
    </PermissionsProvider>
  );
}
