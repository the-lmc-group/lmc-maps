import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, TouchableOpacity, ScrollView, ActivityIndicator, Linking, Clipboard, Image } from 'react-native';
import * as Location from 'expo-location';
import { MaterialIcons } from '@expo/vector-icons';
import { NominatimService } from '@/services/NominatimService';
import PlusCodeService from '@/services/PlusCodeService';
import { OverpassPOI, OverpassService } from '@/services/OverpassService';

interface MyPositionDrawerProps {
  visible: boolean;
  location: Location.LocationObjectCoords | null;
  onClose: () => void;
  onSelectPOI?: (poi: OverpassPOI) => void;
  onShowRoute?: (poi: OverpassPOI, transportMode: string) => void;
  onSaveParking?: (parking: { coordinate: { latitude: number; longitude: number }; name?: string }) => void;
  onReportProblem?: () => void;
}

const { height: screenHeight } = Dimensions.get('window');
const DRAWER_HEIGHT = Math.min(460, screenHeight * 0.55);

export default function MyPositionDrawer({ visible, location, onClose, onSelectPOI, onShowRoute, onSaveParking, onReportProblem }: MyPositionDrawerProps) {
  const translateY = useRef(new Animated.Value(screenHeight)).current;
  const [address, setAddress] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [poiLoading, setPoiLoading] = useState(false);
  const [pois, setPois] = useState<OverpassPOI[]>([]);
  const [thumbnails, setThumbnails] = useState<Record<string, string | null>>({});
  const [plusCode, setPlusCode] = useState<string>('');
  const [fullPlusCode, setFullPlusCode] = useState<string>('');
  const [copied, setCopied] = useState<string | null>(null);
  const [selectedPOIId, setSelectedPOIId] = useState<string | null>(null);
  const [snapshotLocation, setSnapshotLocation] = useState<Location.LocationObjectCoords | null>(null);
  const ctaVisible = useRef(new Animated.Value(0)).current;
  const ctaScale = useRef(new Animated.Value(1)).current;

  const displayLat = snapshotLocation?.latitude ?? location?.latitude;
  const displayLon = snapshotLocation?.longitude ?? location?.longitude;
  const displayAccuracy = snapshotLocation?.accuracy != null ? Math.round(snapshotLocation.accuracy) : (location?.accuracy != null ? Math.round(location.accuracy) : null);

  const fetchData = async (latParam?: number, lonParam?: number) => {
    const la = typeof latParam === 'number' ? latParam : displayLat;
    const lo = typeof lonParam === 'number' ? lonParam : displayLon;
    if (typeof la !== 'number' || typeof lo !== 'number') return;
    setLoading(true);
    try {
      const rev = await NominatimService.reverse(la, lo, { zoom: 18, addressDetails: true });
      if (rev?.address) {
        setAddress(NominatimService.formatAddress(rev.address));
      } else {
        setAddress('');
      }
    } catch {
      setAddress('');
    } finally {
      setLoading(false);
    }
  };

  const fetchPOIs = async (latParam?: number, lonParam?: number) => {
    const la = typeof latParam === 'number' ? latParam : displayLat;
    const lo = typeof lonParam === 'number' ? lonParam : displayLon;
    if (typeof la !== 'number' || typeof lo !== 'number') return;
    setPoiLoading(true);
    try {
      const results = await OverpassService.searchPOI(la, lo, 600, '*');
      const list = results.slice(0, 15);
      setPois(list);
      try {
        const limited = list.slice(0, 12).filter(p => (p.tags?.name || '').trim().length > 0);
        const entries = await Promise.all(
          limited.map(async (p) => {
            const name = (p.tags?.name || '').replace(/,.*$/, '').trim();
            if (!name) return [p.id, null] as const;
            try {
              const resp = await fetch(`https://en.wikipedia.org/api/rest_v1/page/media-list/${encodeURIComponent(name)}`);
              if (resp.ok) {
                const data = await resp.json();
                const item = Array.isArray(data.items) ? data.items.find((it: any) => it.type === 'image') : null;
                if (item && item.title) {
                  const url = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(item.title)}?width=300`;
                  return [p.id, url] as const;
                }
              }
            } catch {}
            return [p.id, null] as const;
          })
        );
        const map: Record<string, string | null> = {};
        entries.forEach(([id, url]) => {
          map[id] = url;
        });
        setThumbnails((prev) => ({ ...prev, ...map }));
      } catch {}
    } catch {
      setPois([]);
    } finally {
      setPoiLoading(false);
    }
  };

  const computePlusCodeFor = async (latParam?: number, lonParam?: number) => {
    const la = typeof latParam === 'number' ? latParam : displayLat;
    const lo = typeof lonParam === 'number' ? lonParam : displayLon;
    if (typeof la !== 'number' || typeof lo !== 'number') return { display: '', full: '' };
    try {
      const full = PlusCodeService.encode(la, lo, 10);
      const rev = await NominatimService.reverse(la, lo, { zoom: 14, addressDetails: true });
      const locality = rev?.address?.city || rev?.address?.town || rev?.address?.village || rev?.address?.suburb || '';
      const display = PlusCodeService.formatDisplay(la, lo, {
        reference: { latitude: la, longitude: lo },
        locality: locality || undefined,
        codeLength: 10,
      });
      return { display, full };
    } catch {
      const fallback = PlusCodeService.encode(la, lo, 10);
      return { display: fallback, full: fallback };
    }
  };

  const handleCopy = async (label: string, value: string) => {
    Clipboard.setString(value);
    setCopied(label);
    setTimeout(() => setCopied(null), 1500);
  };

  useEffect(() => {
    if (visible) {
      const snap = location || null;
      setSnapshotLocation(snap);
      Animated.spring(translateY, { toValue: screenHeight - DRAWER_HEIGHT, useNativeDriver: true, bounciness: 0 }).start();
      if (snap && typeof snap.latitude === 'number' && typeof snap.longitude === 'number') {
        fetchData(snap.latitude, snap.longitude);
        fetchPOIs(snap.latitude, snap.longitude);
        computePlusCodeFor(snap.latitude, snap.longitude).then((res) => {
          setPlusCode(res.display);
          setFullPlusCode(res.full);
        });
      } else {
        fetchData();
        fetchPOIs();
        computePlusCodeFor().then((res) => {
          setPlusCode(res.display);
          setFullPlusCode(res.full);
        });
      }
    } else {
      Animated.spring(translateY, { toValue: screenHeight, useNativeDriver: true, bounciness: 0 }).start();
      setSelectedPOIId(null);
      ctaVisible.setValue(0);
      ctaScale.setValue(1);
      setSnapshotLocation(null);
    }
  }, [visible]);

  useEffect(() => {
    if (selectedPOIId) {
      ctaScale.setValue(0.9);
      Animated.parallel([
        Animated.timing(ctaVisible, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.sequence([
          Animated.spring(ctaScale, { toValue: 1.1, useNativeDriver: true, bounciness: 12 }),
          Animated.spring(ctaScale, { toValue: 1, useNativeDriver: true, bounciness: 6 }),
        ]),
      ]).start();
    } else {
      Animated.timing(ctaVisible, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
        ctaScale.setValue(1);
      });
    }
  }, [selectedPOIId]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
      <View style={styles.handle} />
      <View style={styles.headerRow}>
        <Text style={styles.title}>Ma position</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <MaterialIcons name="close" size={22} color="#111" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.actionsRowTop}>
          <TouchableOpacity
            style={[styles.actionBtnOutline]}
            onPress={() => {
              if (typeof displayLat === 'number' && typeof displayLon === 'number' && onSaveParking) {
                onSaveParking({ coordinate: { latitude: displayLat, longitude: displayLon }, name: 'Place de stationnement' });
              }
            }}
          >
            <MaterialIcons name="local-parking" size={18} color="#007AFF" />
            <Text style={styles.actionOutlineText}>Enregistrer la place de stationnement</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtnOutline]}
            onPress={() => { if (onReportProblem) onReportProblem(); }}
          >
            <MaterialIcons name="report-problem" size={18} color="#FF3B30" />
            <Text style={[styles.actionOutlineText, { color: '#FF3B30' }]}>Signaler un problème</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Adresse</Text>
          {loading ? (
            <ActivityIndicator />
          ) : (
            <View style={styles.rowBetween}>
              <Text style={styles.valueText} numberOfLines={2}>{address || 'Adresse indisponible'}</Text>
              {address ? (
                <TouchableOpacity onPress={() => handleCopy('adresse', address)}>
                  <MaterialIcons name="content-copy" size={20} color="#007AFF" />
                </TouchableOpacity>
              ) : null}
            </View>
          )}
        </View>

        <View style={styles.row}>
          <View style={styles.colHalf}>
            <Text style={styles.sectionTitle}>Précision</Text>
            <Text style={styles.valueText}>{displayAccuracy != null ? `${displayAccuracy} m` : 'N/A'}</Text>
          </View>
          <View style={styles.colHalf}>
            <Text style={styles.sectionTitle}>Plus Code</Text>
            <View style={styles.rowBetween}>
              <Text style={styles.valueText}>{fullPlusCode || plusCode || 'Indisponible'}</Text>
              {(fullPlusCode || plusCode) ? (
                <TouchableOpacity onPress={() => handleCopy('pluscode', fullPlusCode || plusCode)}>
                  <MaterialIcons name="content-copy" size={20} color="#007AFF" />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Coordonnées</Text>
          {typeof displayLat === 'number' && typeof displayLon === 'number' ? (
            <View style={styles.rowBetween}>
              <Text style={styles.valueText}>{displayLat.toFixed(5)}, {displayLon.toFixed(5)}</Text>
              <TouchableOpacity onPress={() => handleCopy('coords', `${displayLat},${displayLon}`)}>
                <MaterialIcons name="content-copy" size={20} color="#007AFF" />
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.valueText}>Indisponible</Text>
          )}
        </View>

        {copied && (
          <Text style={styles.copiedText}>✅ {copied} copié !</Text>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>À proximité</Text>
          {poiLoading ? (
            <ActivityIndicator />
          ) : pois.length === 0 ? (
            <Text style={styles.valueText}>Aucun lieu trouvé</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardsRow}>
              {pois.map((poi) => {
                const title = OverpassService.formatPOIName(poi);
                const subtitle = OverpassService.formatPOIAddress(poi);
                const img = thumbnails[poi.id];
                return (
                  <TouchableOpacity
                    key={poi.id}
                    style={[styles.card, selectedPOIId === poi.id && styles.cardSelected]}
                    activeOpacity={0.9}
                    onPress={() => {
                      if (selectedPOIId === poi.id) {
                        setSelectedPOIId(null);
                      } else {
                        setSelectedPOIId(poi.id);
                        if (onSelectPOI) onSelectPOI(poi);
                      }
                    }}
                  >
                    {img ? (
                      <Image source={{ uri: img }} style={styles.cardImage} resizeMode="cover" />
                    ) : (
                      <View style={styles.cardImagePlaceholder}>
                        <MaterialIcons name="place" size={28} color="#007AFF" />
                      </View>
                    )}
                    <View style={styles.cardBody}>
                      <Text numberOfLines={1} style={styles.cardTitle}>{title}</Text>
                      <Text numberOfLines={1} style={styles.cardSubtitle}>{subtitle || (typeof poi.distance === 'number' ? `${Math.round(poi.distance)} m` : '')}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>
      </ScrollView>
      {selectedPOIId && (
        <Animated.View
          pointerEvents="box-none"
          style={[
            styles.ctaContainer,
            {
              opacity: ctaVisible,
              transform: [
                { translateY: ctaVisible.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) },
                { scale: ctaScale },
              ],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.routeButton}
            activeOpacity={0.9}
            onPress={() => {
              const poi = pois.find(p => p.id === selectedPOIId);
              if (poi && onShowRoute) onShowRoute(poi, 'driving');
            }}
          >
            <MaterialIcons name="directions" size={20} color="#fff" />
            <Text style={styles.routeButtonText}>Naviguer à ce point</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: DRAWER_HEIGHT,
    backgroundColor: '#fff',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    zIndex: 1000,
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#CCC',
    alignSelf: 'center',
    marginTop: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
  },
  closeBtn: {
    padding: 8,
  },
  content: {
    padding: 16,
    paddingBottom: 28,
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  valueText: {
    fontSize: 14,
    color: '#111',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  colHalf: {
    flex: 1,
  },
  poiList: {
    gap: 8,
  },
  cardsRow: {
    paddingVertical: 6,
    gap: 10,
    paddingRight: 10,
  },
  card: {
    width: 180,
    marginRight: 10,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
  },
  cardSelected: {
    borderColor: '#007AFF',
    borderWidth: 2,
  },
  cardImage: {
    width: '100%',
    height: 96,
    backgroundColor: '#F3F4F6',
  },
  cardImagePlaceholder: {
    width: '100%',
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  cardBody: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  poiItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  poiName: {
    fontSize: 14,
    color: '#111',
    fontWeight: '500',
  },
  poiSub: {
    fontSize: 12,
    color: '#666',
  },
  distance: {
    fontSize: 12,
    color: '#333',
    marginLeft: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  actionsRowTop: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  actionBtnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  actionText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
  actionOutlineText: {
    color: '#007AFF',
    fontSize: 13,
    fontWeight: '600',
  },
  copiedText: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 10,
  },
  ctaContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 32,
    alignItems: 'center',
    zIndex: 2000,
  },
  routeButton: {
    alignSelf: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  routeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
