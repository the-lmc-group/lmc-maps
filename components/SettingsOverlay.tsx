import React, { useState, useEffect, useRef } from "react";
import { Modal, SafeAreaView, View, Text, TouchableOpacity, StyleSheet, Switch, ScrollView, Image, Animated } from "react-native";
import { useLabs } from "../contexts/LabsContext";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { widgetConfigEmitter } from './navigationwidjets/WidgetManager';
import ReactNativePickerModule from 'react-native';

interface Props {
  visible: boolean;
  onClose: () => void;
  onImportGpx?: () => void;
}

export default function SettingsOverlay({ visible, onClose, onImportGpx }: Props) {
  const [showVersionInfo, setShowVersionInfo] = useState(false);
  const { labsMode, setLabsMode, labsUnlocked, unlockLabs, showDebugInfo, setShowDebugInfo } = useLabs();

  const [labsVerboseLogging, setLabsVerboseLogging] = useState(false);
  const [labsExperimentalRouting, setLabsExperimentalRouting] = useState(false);
  const [labsShowDebugOverlays, setLabsShowDebugOverlays] = useState(false);
  const WIDGETS_STORAGE_KEY = 'navigation_widgets_config_v1';
  const [widgetsMasterEnabled, setWidgetsMasterEnabled] = useState(true);
  const [widgetConfigs, setWidgetConfigs] = useState<Array<{ id: string; title: string; enabled: boolean }>>([]);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(WIDGETS_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          setWidgetConfigs(parsed);
        } else {
          const defaults = [
            { id: 'media', title: 'Media', enabled: true },
            { id: 'weather', title: 'Weather', enabled: true },
            { id: 'speed_advisory', title: 'Traffic', enabled: true },
          ];
          setWidgetConfigs(defaults);
          await AsyncStorage.setItem(WIDGETS_STORAGE_KEY, JSON.stringify(defaults));
        }
      } catch (e) {}
    })();
    (async () => {
      try {
        const m = await AsyncStorage.getItem('navigation_widgets_master_v1');
        if (m !== null) setWidgetsMasterEnabled(m === '1');
      } catch (e) {}
    })();
  }, []);

  const persistWidgetConfig = async (cfgs: any) => {
    setWidgetConfigs(cfgs);
    try {
      await AsyncStorage.setItem(WIDGETS_STORAGE_KEY, JSON.stringify(cfgs));
      widgetConfigEmitter.emit({ configs: cfgs });
    } catch (e) {}
  };
  const [pageStack, setPageStack] = useState<Array<{ key: string; title: string; props?: any }>>([{ key: 'root', title: 'Paramètres' }]);
  const pushPage = (page: { key: string; title: string; props?: any }) => setPageStack((s) => [...s, page]);
  const popPage = () => setPageStack((s) => (s.length > 1 ? s.slice(0, -1) : s));
  const currentPage = pageStack[pageStack.length - 1];

  const tapCountRef = useRef(0);
  const lastTapRef = useRef<number | null>(null);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    return () => {
      anim.setValue(0);
    };
  }, [currentPage.key]);
  const appName = "LMC Maps DEV";
  const packageName = "com.lotus64.lmcmaps";
  let appVersion = "Unknown version";
  try {
    const appJson = require('../app.json');
    appVersion = appJson?.expo?.version ?? appVersion;
  } catch (_) {}
  const favicon = require("../assets/favicon.png");
  
  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          {pageStack.length > 1 ? (
            <TouchableOpacity onPress={() => popPage()} style={styles.closeButton}>
              <Icon name="arrow-back" size={26} color="#333" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={26} color="#333" />
            </TouchableOpacity>
          )}
          <Text style={styles.title}>{pageStack.length > 1 ? currentPage.title : 'Settings'}</Text>
        </View>

        <ScrollView style={styles.content}>
          {}

          {}
          {currentPage.key === 'root' && (
            <View style={styles.centerBlock}>

              <TouchableOpacity style={styles.importRow} onPress={() => pushPage({ key: 'gpx', title: 'Importer un GPX', props: { onImportGpx } })}>
                <View style={styles.importText}>
                  <Text style={styles.importTitle}>Importer un GPX</Text>
                  <Text style={styles.importSubtitle}>Charger un fichier GPX pour afficher et suivre un parcours sur la carte.</Text>
                </View>
                <Text style={styles.versionChevron}>›</Text>
              </TouchableOpacity>

              <View style={{ height: 12 }} />

              <TouchableOpacity style={styles.importRow} onPress={() => pushPage({ key: 'display', title: 'Apparence' })}>
                <View style={styles.importText}>
                  <Text style={styles.importTitle}>Apparence</Text>
                  <Text style={styles.importSubtitle}>Options d'affichage et widjets.</Text>
                </View>
                <Text style={styles.versionChevron}>›</Text>
              </TouchableOpacity>

              {}
              {labsUnlocked ? (
                <TouchableOpacity style={styles.importRow} onPress={() => pushPage({ key: 'labs', title: 'Labs' })}>
                  <View style={styles.importText}>
                    <Text style={styles.importTitle}>Labs</Text>
                    <Text style={styles.importSubtitle}>Paramètres expérimentaux et outils de debug.</Text>
                  </View>
                  <Text style={styles.versionChevron}>›</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.importRow}
                  onPress={() => {
                    const now = Date.now();
                    if (lastTapRef.current && now - lastTapRef.current! > 1500) {
                      tapCountRef.current = 0;
                    }
                    lastTapRef.current = now;
                    tapCountRef.current += 1;
                    if (tapCountRef.current >= 7) {
                      unlockLabs().then(() => pushPage({ key: 'labs', title: 'Labs' }));
                      tapCountRef.current = 0;
                    }
                  }}
                >
                  <View style={styles.importText}>
                    <Text style={styles.importTitle}>Labs (verrouillé)</Text>
                    <Text style={styles.importSubtitle}>Cacher — tapez la favicon 7 fois pour débloquer.</Text>
                  </View>
                  <Text style={styles.versionChevron}>›</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {}
          {currentPage.key === 'display' && (
            <View>
              <TouchableOpacity style={styles.sectionDivider} />
              <TouchableOpacity style={styles.importRow} onPress={() => pushPage({ key: 'theme', title: 'Thème' })}>
                <View style={styles.importText}>
                  <Text style={styles.importTitle}>Thème</Text>
                  <Text style={styles.importSubtitle}>Choisir le thème de l'application.</Text>
                </View>
                <Text style={styles.versionChevron}>›</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.importRow, { marginTop: 10 }]} onPress={() => pushPage({ key: 'appearance', title: 'Apparence' })}>
                <View style={styles.importText}>
                  <Text style={styles.importTitle}>Widjets</Text>
                  <Text style={styles.importSubtitle}>Afficher et choisir quels widjets sont actifs.</Text>
                </View>
                <Text style={styles.versionChevron}>›</Text>
              </TouchableOpacity>
            </View>
          )}

          {}
          {currentPage.key === 'appearance' && (
            <View style={{ paddingTop: 12 }}>
              <View style={styles.optionRowSmall}>
                <View style={styles.optionTextWrap}>
                  <Text style={styles.optionTitle}>Afficher les widjets</Text>
                  <Text style={styles.optionSubtitle}>Affiche les widjets sur l'écran de navigation.</Text>
                </View>
                <Switch value={widgetsMasterEnabled} onValueChange={async (v) => { setWidgetsMasterEnabled(v); try { await AsyncStorage.setItem('navigation_widgets_master_v1', v ? '1' : '0'); widgetConfigEmitter.emit({ masterEnabled: v }); } catch (e) {} }} />
              </View>

              <View style={{ height: 12 }} />
              <Text style={styles.sectionTitle}>Liste des widjets</Text>
              {widgetConfigs.map((w) => (
                <View key={w.id} style={styles.optionRowSmall}>
                  <View style={styles.optionTextWrap}>
                    <Text style={styles.optionTitle}>{w.title}</Text>
                    <Text style={styles.optionSubtitle}>Activer la récupération de données pour ce widjet.</Text>
                  </View>
                  <Switch value={w.enabled && widgetsMasterEnabled} onValueChange={(v) => {
                    const next = widgetConfigs.map(cfg => cfg.id === w.id ? { ...cfg, enabled: v } : cfg);
                    persistWidgetConfig(next);
                  }} />
                </View>
              ))}
            </View>
          )}

          {}
          {currentPage.key === 'gpx' && (
            <View style={{ paddingTop: 12 }}>
              <TouchableOpacity
                style={styles.importRow}
                onPress={() => {
                  if (onImportGpx) onImportGpx();
                  onClose();
                }}
              >
                <View style={styles.importText}>
                  <Text style={styles.importTitle}>Importer un fichier GPX</Text>
                  <Text style={styles.importSubtitle}>Choisir un fichier GPX depuis le stockage.</Text>
                </View>
                <Text style={styles.versionChevron}>›</Text>
              </TouchableOpacity>
            </View>
          )}

          {}
          {currentPage.key === 'theme' && (
            <View style={{ paddingTop: 12 }}>
              <View style={styles.optionRowSmall}>
                <View style={styles.optionTextWrap}>
                  <Text style={styles.optionTitle}>Mode sombre</Text>
                  <Text style={styles.optionSubtitle}>Forcer le thème sombre.</Text>
                </View>
                <Switch value={false} onValueChange={() => {}} />
              </View>
            </View>
          )}

          {}
          {currentPage.key === 'labs' && (
            <View style={{ paddingTop: 12 }}>
              <View style={styles.optionRowSmall}>
                <View style={styles.optionTextWrap}>
                  <Text style={styles.optionTitle}>Afficher les infos de debug</Text>
                  <Text style={styles.optionSubtitle}>Affiche durées et logs de fetch dans le RouteDrawer.</Text>
                </View>
                <Switch value={showDebugInfo} onValueChange={(v) => setShowDebugInfo(v)} />
              </View>
            </View>
          )}
        </ScrollView>
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.versionRow}
          onPress={() => setShowVersionInfo((s) => !s)}
        >
          <Text style={styles.versionText}>Version de l'application</Text>
          <Text style={styles.versionChevron}>{showVersionInfo ? '▲' : '▼'}</Text>
        </TouchableOpacity>

        {showVersionInfo && !labsMode && (
          <View style={styles.versionBox}>
            <TouchableOpacity
              onPress={() => setLabsMode(true)}
            >
              <Image source={favicon} style={styles.favicon} />
            </TouchableOpacity>
            <View style={styles.versionDetails}>
              <Text style={styles.appName}>{appName}</Text>
              <Text style={styles.detailText}>Package: {packageName}</Text>
              <Text style={styles.detailText}>Version: {appVersion}</Text>
            </View>
          </View>
        )}

  {}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: '#eee' },
  closeButton: { marginRight: 12 },
  title: { fontSize: 18, fontWeight: '700', color: '#222' },
  content: { padding: 16 },
  optionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  optionTextWrap: { flex: 1, paddingRight: 12 },
  optionTitle: { fontSize: 16, fontWeight: '600', color: '#222' },
  optionSubtitle: { fontSize: 12, color: '#666', marginTop: 4 },
  sectionDivider: { height: 1, backgroundColor: '#f2f2f2', marginVertical: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#333', marginBottom: 12 },
  optionRowSmall: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  optionSmallText: { fontSize: 14, color: '#333' },
  ghostButton: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: '#e5e5ea' },
  ghostText: { color: '#333' },
  centerBlock: { paddingVertical: 40, alignItems: 'center' },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 12,
    minWidth: 260,
    maxWidth: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryIcon: { marginRight: 12 },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  importRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: 840, paddingHorizontal: 8 },
  importText: { flex: 1, paddingRight: 12 },
  importTitle: { fontSize: 18, fontWeight: '700', color: '#222' },
  importSubtitle: { fontSize: 13, color: '#666', marginTop: 6 },
  smallButton: { backgroundColor: '#007AFF', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, minWidth: 100, alignItems: 'center', justifyContent: 'center', elevation: 4 },
  smallButtonText: { color: '#fff', fontWeight: '700' },
  versionRow: { padding: 14, borderTopWidth: 1, borderColor: '#f2f2f2', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  versionText: { color: '#666', fontSize: 14, fontWeight: '600' },
  versionChevron: { color: '#666', fontSize: 12 },
  versionBox: { padding: 12, borderTopWidth: 1, borderColor: '#f2f2f2', flexDirection: 'row', alignItems: 'center' },
  favicon: { width: 48, height: 48, borderRadius: 8, marginRight: 12 },
  versionDetails: { flex: 1 },
  appName: { fontSize: 16, fontWeight: '700', color: '#222' },
  detailText: { fontSize: 13, color: '#666', marginTop: 4 },
  labsContainer: { borderTopWidth: 1, borderColor: '#f2f2f2', padding: 12 },
  labsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  labsBackButton: { marginRight: 12, padding: 6 },
  labsBackText: { color: '#007AFF', fontWeight: '600' },
  labsTitle: { fontSize: 16, fontWeight: '700', color: '#222' },
  labsContent: { paddingTop: 12 },
  labsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: 840, paddingHorizontal: 8 },
  pageHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderColor: '#f4f4f6' },
  pageTitle: { fontSize: 16, fontWeight: '700', color: '#222', marginLeft: 6 },
  backButtonText: { color: '#007AFF', fontWeight: '600' },
  chevronRight: { fontSize: 18, color: '#c7c7cc' },
});

