import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MediaWidget from './widgets/MediaWidget';
import { WidgetConfig } from './types';

const STORAGE_KEY = 'navigation_widgets_config_v1';
const MASTER_KEY = 'navigation_widgets_master_v1';
const FORCE_MEDIA_KEY = 'navigation_widgets_force_media_v1';

const defaultWidgets: WidgetConfig[] = [
  { id: 'media', title: 'Media', enabled: true },
  { id: 'weather', title: 'Weather', enabled: true },
  { id: 'speed_advisory', title: 'Traffic', enabled: true },
];

type EmitterPayload = { masterEnabled?: boolean; configs?: WidgetConfig[] };

export const widgetConfigEmitter = {
  _listeners: new Set<((p: EmitterPayload) => void)>(),
  subscribe(fn: (p: EmitterPayload) => void) {
    this._listeners.add(fn);
    return () => this._listeners.delete(fn);
  },
  emit(p: EmitterPayload) {
    try {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {}
    } catch (_) {}
    this._listeners.forEach((fn) => {
      try {
        fn(p);
      } catch (_) {}
    });
  },
};

export default function WidgetManager() {
  const [configs, setConfigs] = useState<WidgetConfig[]>(defaultWidgets);
  const [masterEnabled, setMasterEnabled] = useState<boolean>(true);
  const [showDebug, setShowDebug] = useState<boolean>(typeof __DEV__ !== 'undefined' ? __DEV__ : false);
  const [playerDebug, setPlayerDebug] = useState<any>(null);
  const [forceMedia, setForceMedia] = useState<boolean>(false);
  const debugInterval = useRef<any>(null);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setConfigs(JSON.parse(raw));
      } catch (e) {}
      try {
        const m = await AsyncStorage.getItem(MASTER_KEY);
        if (m !== null) setMasterEnabled(m === '1');
      } catch (e) {}
      try {
        const f = await AsyncStorage.getItem(FORCE_MEDIA_KEY);
        if (f !== null) setForceMedia(f === '1');
      } catch (e) {}
    })();

    const unsub = widgetConfigEmitter.subscribe((p: EmitterPayload) => {
      if (p.configs) setConfigs(p.configs);
      if (typeof p.masterEnabled === 'boolean') setMasterEnabled(p.masterEnabled);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (showDebug) {
      debugInterval.current = setInterval(() => {
        setPlayerDebug({ info: 'player polling disabled' });
      }, 800);
    }
    return () => { if (debugInterval.current) clearInterval(debugInterval.current); };
  }, [showDebug]);

  useEffect(() => {
    startWidgetManagerConsoleLogger(() => ({ masterEnabled, configs, playerDebug }), showDebug);
    return () => startWidgetManagerConsoleLogger(() => ({ masterEnabled, configs, playerDebug }), false);
  }, [showDebug, masterEnabled, configs, playerDebug]);

  useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
      } catch (e) {}
    })();
  }, [configs]);

  useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem(FORCE_MEDIA_KEY, forceMedia ? '1' : '0');
      } catch (e) {}
    })();
  }, [forceMedia]);

  useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem(MASTER_KEY, masterEnabled ? '1' : '0');
      } catch (e) {}
    })();
  }, [masterEnabled]);

  if (!masterEnabled) return null;

  const enabled = configs.filter((c) => c.enabled);
  if (enabled.length === 0) return null;

  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', top: 12, right: 12 }}>
      <TouchableOpacity activeOpacity={0.9} onLongPress={() => setShowDebug((s) => !s)}>
        {enabled.find((c) => c.id === 'media') ? <MediaWidget forceVisible={forceMedia} /> : null}
      </TouchableOpacity>

      {showDebug ? (
        <View style={{ marginTop: 8 }}>
          <TouchableOpacity onPress={() => setForceMedia((s) => !s)} style={{ padding: 8 }}>
            <Text style={{ color: '#333' }}>Dev: force media visible: {String(forceMedia)}</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {showDebug ? null : null}
    </View>
  );
}

let __widgetManagerLogger: any = null;
function startWidgetManagerConsoleLogger(getState: () => { masterEnabled: boolean; configs: WidgetConfig[]; playerDebug: any; }, enabled: boolean) {
  try {
    if (typeof __DEV__ === 'undefined' || !__DEV__) return;
  } catch (_) { return; }
  if (!enabled) {
    if (__widgetManagerLogger) { clearInterval(__widgetManagerLogger); __widgetManagerLogger = null; }
    return;
  }
  if (__widgetManagerLogger) return;
  __widgetManagerLogger = setInterval(() => {
    try {
      const s = getState();
      {}
    } catch (e) {  }
  }, 800);
}

const styles = StyleSheet.create({
  debugBox: { position: 'absolute', top: 84, right: 0, width: 340, backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 10, padding: 12, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, elevation: 6 },
  debugTitle: { fontWeight: '700', marginBottom: 8 },
  debugLabel: { fontSize: 12, color: '#333', marginTop: 6 },
  debugCode: { fontFamily: 'monospace', fontSize: 11, color: '#111', backgroundColor: '#f6f6f8', padding: 8, borderRadius: 6, marginTop: 6 },
});
