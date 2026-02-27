import MapProvider from "@/components/map";
import { usePosition } from "@/contexts/PositionContext";
import { createTranslator } from "@/i18n";
import { snapPointsPercent } from "@/utils/snapPoints";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import React from "react";
import {
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import MapOverlay from "./_components/MapOverlay";

export default function MainScreen() {
  const { t } = createTranslator("main");
  const { height: screenHeight } = useWindowDimensions();
  const sheetRef = React.useRef<BottomSheet>(null);
  const snapPoints = React.useMemo(
    () => snapPointsPercent([180], screenHeight),
    [screenHeight],
  );
  const [blockMap, setBlockMap] = React.useState(false);
  const pos = usePosition();

  return (
    <MapProvider style={{ flex: 1 }}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <MapOverlay blockMap={blockMap} />
        <BottomSheet
          ref={sheetRef}
          snapPoints={snapPoints}
          index={0}
          enablePanDownToClose={false}
          backgroundStyle={{ backgroundColor: "rgba(16,25,34,0.96)" }}
          handleIndicatorStyle={{
            backgroundColor: "rgba(255,255,255,0.3)",
          }}
          onChange={(index) => {
            setBlockMap(index > 0);
          }}
        >
          <BottomSheetView style={styles.sheetContent}>
            <Text style={styles.sheetTitle}>
              {pos?.position?.city
                ? t("sheet.exploreCity", { city: pos.position.city })
                : t("sheet.exploreArea")}
            </Text>
            <View style={styles.itemsContainer}>
              <View style={styles.item}>
                <View style={styles.itemBox}>
                  <Svg width={24} height={24} viewBox="0 -960 960 960">
                    <Path
                      d="M160-160v-600q0-33 23.5-56.5T240-840h240q33 0 56.5 23.5T560-760v280h40q33 0 56.5 23.5T680-400v180q0 17 11.5 28.5T720-180q17 0 28.5-11.5T760-220v-288q-9 5-19 6.5t-21 1.5q-42 0-71-29t-29-71q0-32 17.5-57.5T684-694l-63-63q-9-9-9-21t9-21q8-8 20.5-8.5T663-800l127 124q15 15 22.5 35t7.5 41v380q0 42-29 71t-71 29q-42 0-71-29t-29-71v-200h-60v260q0 17-11.5 28.5T520-120H200q-17 0-28.5-11.5T160-160Zm80-400h240v-200H240v200Zm480 0q17 0 28.5-11.5T760-600q0-17-11.5-28.5T720-640q-17 0-28.5 11.5T680-600q0 17 11.5 28.5T720-560ZM240-200h240v-280H240v280Zm240 0H240h240Z"
                      fill="#e3e3e3"
                    />
                  </Svg>
                </View>

                <Text style={styles.itemLabel}>{t("items.gas")}</Text>
              </View>

              <View style={styles.item}>
                <View style={styles.itemBox}>
                  <Svg width={24} height={24} viewBox="0 -960 960 960">
                    <Path
                      d="M479-422 203-148q-11 11-27.5 11.5T147-148q-11-11-11-28t11-28l382-382q-18-42-5-95t57-95q53-53 118-62t106 32q41 41 32 106t-62 118q-42 44-95 57t-95-5l-50 50 276 276q11 11 11.5 27.5T811-148q-11 11-28 11t-28-11L479-422Zm-186-40L173-582q-42-42-53-106t25-114q11-15 29.5-17t31.5 12l215 217-128 128Z"
                      fill="#e3e3e3"
                    />
                  </Svg>
                </View>

                <Text style={styles.itemLabel}>{t("items.food")}</Text>
              </View>

              <View style={styles.item}>
                <View style={styles.itemBox}>
                  <Svg width={24} height={24} viewBox="0 -960 960 960">
                    <Path
                      d="M440-240q-117 0-198.5-81.5T160-520v-240q0-33 23.5-56.5T240-840h500q58 0 99 41t41 99q0 58-41 99t-99 41h-20v40q0 117-81.5 198.5T440-240ZM240-640h400v-120H240v120Zm200 320q83 0 141.5-58.5T640-520v-40H240v40q0 83 58.5 141.5T440-320Zm280-320h20q25 0 42.5-17.5T800-700q0-25-17.5-42.5T740-760h-20v120ZM200-120q-17 0-28.5-11.5T160-160q0-17 11.5-28.5T200-200h560q17 0 28.5 11.5T800-160q0 17-11.5 28.5T760-120H200Zm240-440Z"
                      fill="#e3e3e3"
                    />
                  </Svg>
                </View>

                <Text style={styles.itemLabel}>{t("items.coffee")}</Text>
              </View>

              <View style={styles.item}>
                <View style={styles.itemBox}>
                  <Svg width={24} height={24} viewBox="0 -960 960 960">
                    <Path
                      d="M400-360v160q0 33-23.5 56.5T320-120q-33 0-56.5-23.5T240-200v-560q0-33 23.5-56.5T320-840h200q100 0 170 70t70 170q0 100-70 170t-170 70H400Zm0-160h128q33 0 56.5-23.5T608-600q0-33-23.5-56.5T528-680H400v160Z"
                      fill="#e3e3e3"
                    />
                  </Svg>
                </View>

                <Text style={styles.itemLabel}>{t("items.parking")}</Text>
              </View>
            </View>
          </BottomSheetView>
        </BottomSheet>
      </View>
    </MapProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "transparent" },
  sheetContent: {
    padding: 16,
    alignItems: "flex-start",
  },
  sheetTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 20,
  },
  itemsContainer: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
  },
  item: { alignItems: "center", width: "22%" },
  itemBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  itemLabel: { color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 6 },
});
