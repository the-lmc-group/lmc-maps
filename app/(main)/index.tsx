import { CoffeeIcon, FoodIcon, GasIcon, ParkingIcon } from "@/assets/icons";
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
                  <GasIcon />
                </View>

                <Text style={styles.itemLabel}>{t("items.gas")}</Text>
              </View>

              <View style={styles.item}>
                <View style={styles.itemBox}>
                  <FoodIcon />
                </View>

                <Text style={styles.itemLabel}>{t("items.food")}</Text>
              </View>

              <View style={styles.item}>
                <View style={styles.itemBox}>
                  <CoffeeIcon />
                </View>

                <Text style={styles.itemLabel}>{t("items.coffee")}</Text>
              </View>

              <View style={styles.item}>
                <View style={styles.itemBox}>
                  <ParkingIcon />
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
