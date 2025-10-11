import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
  ReactNode,
} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Platform,
  StatusBar,
  Dimensions,
} from "react-native";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { useDrawer, DrawerStrategy } from "./DrawerContext";
import { useThemedStyles } from "./ThemeContext";
import { Theme } from "./theme";
import { GestureHandlerRootView } from "react-native-gesture-handler";

interface DrawerProps {
  id: string;
  visible: boolean;
  title: string;
  subtitle?: string;
  children: ReactNode;
  icon?: ReactNode;
  onClose: () => void;
  onRefresh?: () => void | Promise<void>;
  height?: number;
  headerActions?: ReactNode;
  strategy?: DrawerStrategy;
  showCloseButton?: boolean;
  backgroundColor?: string;
  initialSnapIndex?: number | "auto";
  onBottomSheetReady?: (ref: React.RefObject<BottomSheet>) => void;
  canRefresh?: boolean;
  onHeightChange?: (height: number) => void;
  customStyles?: {
    container?: object;
    handle?: object;
    navbar?: object;
    navbarTitle?: object;
    header?: object;
    headerTitle?: object;
    headerSubtitle?: object;
    scrollView?: object;
    scrollContent?: object;
  };
}

const { height: screenHeight } = Dimensions.get("window");
const NAVBAR_HEIGHT = 60;
const STATUS_BAR_HEIGHT =
  Platform.OS === "android" ? StatusBar.currentHeight || 0 : 44;

export default function Drawer({
  id,
  visible,
  title,
  icon,
  subtitle,
  children,
  onClose,
  onRefresh,
  height = screenHeight * 0.75,
  headerActions,
  strategy = "hide",
  showCloseButton = true,
  backgroundColor,
  initialSnapIndex = 1,
  onBottomSheetReady,
  canRefresh = false,
  onHeightChange,
  customStyles,
}: DrawerProps) {
  const styles = useThemedStyles(createStyles);
  const actualBackgroundColor =
    backgroundColor ?? styles.sheetBackground.backgroundColor;
  const { openDrawer, closeDrawer, isDrawerOpen, getDrawerState } = useDrawer();

  const drawerState = getDrawerState(id);
  const isActive = isDrawerOpen(id);
  const shouldRender = visible || drawerState?.visible;

  const [refreshing, setRefreshing] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [contentHeight, setContentHeight] = useState<number>(0);
  const HEADER_HEIGHT = 80;

  const snapPoints = useMemo(() => {
    if (initialSnapIndex === "auto" && contentHeight > 0) {
      const autoHeight = contentHeight + HEADER_HEIGHT + 40;
      return [80, Math.min(autoHeight, screenHeight * 0.9), "100%"];
    }
    return [80, screenHeight * 0.4, "100%"];
  }, [initialSnapIndex, contentHeight, screenHeight]);

  const getInitialIndex = useCallback(() => {
    if (initialSnapIndex === "auto") {
      return contentHeight > 0 ? 1 : 1;
    }
    if (typeof initialSnapIndex === 'number') {
      return Math.max(0, Math.min(initialSnapIndex, snapPoints.length - 1));
    }
    return 1;
  }, [initialSnapIndex, snapPoints.length, contentHeight]);

  const [currentSnapIndex, setCurrentSnapIndex] = useState<number>(
    typeof initialSnapIndex === 'number' ? Math.max(0, Math.min(initialSnapIndex, 2)) : 1
  );
  const [isPullingToRefresh, setIsPullingToRefresh] = useState(false);
  const pullStartY = useRef<number | null>(null);
  const scrollViewRef = useRef<any>(null);

  const bottomSheetRef = useRef<BottomSheet>(null);

  useEffect(() => {
    if (onBottomSheetReady && bottomSheetRef.current) {
      onBottomSheetReady(bottomSheetRef);
    }
  }, [onBottomSheetReady]);

  useEffect(() => {
    if (visible && !isActive) {
      openDrawer(id, strategy);
      if (initialSnapIndex === "auto" && contentHeight > 0) {
        setTimeout(() => {
          bottomSheetRef.current?.snapToIndex(1);
        }, 150);
      } else if (initialSnapIndex === "auto") {
      } else {
        requestAnimationFrame(() => {
          const targetIndex = getInitialIndex();
          bottomSheetRef.current?.snapToIndex(targetIndex);
        });
      }
    } else if (!visible && isActive) {
      bottomSheetRef.current?.close();
      closeDrawer(id);
    }
  }, [visible, isActive, id, strategy, openDrawer, closeDrawer, getInitialIndex, initialSnapIndex, snapPoints, contentHeight]);

  const handleClose = useCallback(() => {
    closeDrawer(id);
    bottomSheetRef.current?.close();
    setTimeout(onClose, 250);
  }, [closeDrawer, id, onClose]);

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setRefreshing(true);
    try {
      await Promise.resolve(onRefresh());
    } finally {
      setRefreshing(false);
    }
  };

  const handleSheetChange = useCallback(
    (index: number) => {
      setCurrentSnapIndex(index);
      setIsExpanded(index === 2);
      if (index < 0) handleClose();
      
      if (onHeightChange && index >= 0 && index < snapPoints.length) {
        const snapValue = snapPoints[index];
        const height = typeof snapValue === 'string' 
          ? screenHeight 
          : snapValue;
        onHeightChange(height);
      }
    },
    [handleClose, onHeightChange, snapPoints]
  );

  const effectiveExpanded = isExpanded && !isScrolling;
  const showNavbar = scrollY > 50 && !effectiveExpanded;

  if (!shouldRender) return null;

  return (
    <>
      <GestureHandlerRootView
        style={[
          styles.wrapper,
          effectiveExpanded ? { backgroundColor: actualBackgroundColor } : undefined,
        ]}
      >
        <BottomSheet
          ref={bottomSheetRef}
          snapPoints={snapPoints}
          onChange={handleSheetChange}
          enablePanDownToClose={true}
          enableOverDrag={true}
          handleIndicatorStyle={[
            styles.handle,
            customStyles?.handle,
            { backgroundColor: "#999" },
          ]}
          backgroundStyle={[
            styles.sheetBackground,
            customStyles?.container,
            { backgroundColor: actualBackgroundColor },
            isExpanded
              ? { borderTopLeftRadius: 0, borderTopRightRadius: 0 }
              : undefined,
          ]}
        >
            <View
              style={{
                flex: 1,
                paddingTop: effectiveExpanded ? STATUS_BAR_HEIGHT : 0,
                borderTopLeftRadius: effectiveExpanded ? 0 : 24,
                borderTopRightRadius: effectiveExpanded ? 0 : 24,
                overflow: "hidden",
              }}
            >
            {showNavbar ? (
              <View
                style={[
                  styles.navbar,
                  customStyles?.navbar,
                  { backgroundColor: actualBackgroundColor },
                ]}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  {icon ? <View style={styles.iconWrapper}>{icon}</View> : null}
                  <Text style={[styles.navbarTitle, customStyles?.navbarTitle]}>
                    {title}
                  </Text>
                </View>
                <View style={styles.navbarActions}>
                  {headerActions}
                  {showCloseButton && (
                    <TouchableOpacity onPress={handleClose}>
                      <Icon name="close" size={24} color="#666" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ) : (
              <View style={[styles.header, customStyles?.header]}>
                <View style={styles.headerContent}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    {icon ? <View style={styles.iconWrapper}>{icon}</View> : null}
                    <Text style={[styles.headerTitle, customStyles?.headerTitle]}>
                      {title}
                    </Text>
                  </View>
                  {subtitle && (
                    <Text
                      style={[
                        styles.headerSubtitle,
                        customStyles?.headerSubtitle,
                      ]}
                    >
                      {subtitle}
                    </Text>
                  )}
                </View>
                <View style={styles.headerActions}>
                  {headerActions}
                  {showCloseButton && (
                    <TouchableOpacity onPress={handleClose}>
                      <Icon name="close" size={24} color="#666" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            <BottomSheetScrollView
              ref={scrollViewRef}
              style={[styles.scrollView, customStyles?.scrollView]}
              contentContainerStyle={[
                styles.scrollContent,
                customStyles?.scrollContent,
                { 
                  minHeight: initialSnapIndex === "auto" ? undefined : screenHeight + STATUS_BAR_HEIGHT + 200,
                  paddingBottom: 100,
                },
              ]}
              showsVerticalScrollIndicator={true}
              onScroll={(e) => {
                const offsetY = e.nativeEvent.contentOffset.y;
                setScrollY(offsetY);
              }}
              onScrollBeginDrag={(e) => {
                setIsScrolling(true);
                const currentOffset = e.nativeEvent.contentOffset.y;
                if (canRefresh && currentSnapIndex >= 1 && currentOffset <= 0) {
                  pullStartY.current = 0;
                }
              }}
              onScrollEndDrag={(e) => {
                setIsScrolling(false);
                const offsetY = e.nativeEvent.contentOffset.y;
                
                if (canRefresh && pullStartY.current !== null && offsetY < -80) {
                  setIsPullingToRefresh(true);
                  pullStartY.current = null;
                  handleRefresh();
                } else {
                  pullStartY.current = null;
                }
              }}
              onMomentumScrollEnd={() => setIsScrolling(false)}
              refreshControl={
                onRefresh && !canRefresh ? (
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    tintColor="#007AFF"
                  />
                ) : undefined
              }
              onContentSizeChange={(width, height) => {
                if (height !== contentHeight) {
                  setContentHeight(height);
                  
                  if (initialSnapIndex === "auto" && isActive) {
                    setTimeout(() => {
                      bottomSheetRef.current?.snapToIndex(1);
                    }, 100);
                  }
                }
              }}
            >
              {children}
            </BottomSheetScrollView>
          </View>
        </BottomSheet>
      </GestureHandlerRootView>
    </>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    wrapper: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: "flex-end",
      zIndex: 1000,
    },
    sheetBackground: {
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      backgroundColor: theme.drawer.backgroundColor,
      ...theme.shadows.lg,
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: 4,
      alignSelf: "center",
      marginVertical: theme.spacing.sm,
    },
    navbar: {
      height: NAVBAR_HEIGHT,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border.light,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: theme.spacing.xl,
    },
      iconWrapper: { marginRight: theme.spacing.sm },
    navbarTitle: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.text.primary,
    },
    navbarActions: { flexDirection: "row", alignItems: "center" },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: theme.spacing.xl,
      paddingVertical: theme.spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border.light,
    },
    headerContent: { flex: 1 },
    headerTitle: {
      fontSize: theme.typography.fontSize.xl,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.text.primary,
    },
    headerSubtitle: {
      fontSize: theme.typography.fontSize.sm,
      color: "#007AFF",
      marginTop: theme.spacing.xs,
    },
    headerActions: { flexDirection: "row", alignItems: "center", gap: 16 },
    scrollView: { flex: 1 },
    scrollContent: {
      paddingHorizontal: theme.spacing.xl,
      // paddingVertical: theme.spacing.xl,
    },
  });
