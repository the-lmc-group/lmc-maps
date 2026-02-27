import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";

type Props = {
  initialZoom?: number;
  onMapMessage?: (msg: any) => void;
};

const ShadcnMap = React.forwardRef<any, Props>(
  ({ initialZoom = 2, onMapMessage }, ref) => {
    const html: string = `<!doctype html>
  <html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <style>
      html,body,#map{ height:100%; margin:0; padding:0; background:#000; }
      .leaflet-container, .leaflet-pane, .leaflet-tile { background: #000 !important; }
      .leaflet-control-attribution { display: none !important; }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
      const map = L.map('map', { 
        zoomControl: false, 
        worldCopyJump: true, 
        maxBoundsViscosity: 1, 
        attributionControl: false 
      }).setView([0,0], ${initialZoom});

      var baseLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', {
        maxZoom: 19,
        minZoom: ${initialZoom},
        detectRetina: true,
        tileSize: 512,
        zoomOffset: -1,
      }).addTo(map);

      const south = -85;
      const north = 85;
      map.setMaxBounds([[south, -360], [north, 360]]);
      
      window.addEventListener('resize', function(){ map.invalidateSize(); });
      setTimeout(()=>map.invalidateSize(), 200);

      map.whenReady(function(){
        try { window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'mapReady' })); } catch(e) {}
        try { window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'zoomChanged', zoom: map.getZoom() })); } catch(e) {}
      });

      function sendMove(e){
        window.ReactNativeWebView.postMessage(JSON.stringify({type:'mapMoved', cause: e.type }));
      }

      map.on('dragstart', sendMove);       
      map.on('zoomend', function(){ try { window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'zoomChanged', zoom: map.getZoom() })); } catch(e) {} });
      var userMarker = null;

      function handleMessage(msg) {
        try {
          const m = JSON.parse(msg);
          
          if (m.type === 'zoomTo') {
            if (m.animate === false) {
              map.setView([m.lat || 0, m.lng || 0], m.zoom);
            } else {
              map.flyTo([m.lat || 0, m.lng || 0], m.zoom, { duration: m.duration || 0.6 });
            }
          }
          setTimeout(()=>map.invalidateSize(),100);
          if (m.type === 'setZoom') { map.setZoom(m.zoom, { animate: m.animate !== false }); }
          if (m.type === 'zoomBy') { map.setZoom(map.getZoom() + (m.delta || 0), { animate: m.animate !== false }); }
          if (m.type === 'panTo') {
            map.panTo([m.lat, m.lng], { animate: m.animate !== false, duration: m.duration || 0.6 });
          }
          if (m.type === 'fitBounds') {
            map.fitBounds(m.bounds, { animate: m.animate !== false, duration: m.duration || 0.6 });
          }
          if (m.type === 'setUserMarker') {
            const lat = m.lat; const lng = m.lng;
            const iconType = m.icon || null;
            
            if (userMarker) {
              map.removeLayer(userMarker);
              userMarker = null;
            }
            if (iconType === 'address') {
              const svg = '<svg width="24" height="24" viewBox="0 -960 960 960" fill="#0d7ff2"><path d="M480-186q122-112 181-203.5T720-552q0-109-69.5-178.5T480-800q-101 0-170.5 69.5T240-552q0 71 59 162.5T480-186Zm-28 74q-14-5-25-15-65-60-115-117t-83.5-110.5q-33.5-53.5-51-103T160-552q0-150 96.5-239T480-880q127 0 223.5 89T800-552q0 45-17.5 94.5t-51 103Q698-301 648-244T533-127q-11 10-25 15t-28 5q-14 0-28-5Zm28-448Zm56.5 56.5Q560-527 560-560t-23.5-56.5Q513-640 480-640t-56.5 23.5Q400-593 400-560t23.5 56.5Q447-480 480-480t56.5-23.5Z" /></svg>';
              const myIcon = L.divIcon({
                className: '',
                html: svg,
                iconSize: [24,24],
                iconAnchor: [12,24]
              });
              userMarker = L.marker([lat, lng], { icon: myIcon }).addTo(map);
            } else {
              userMarker = L.circleMarker([lat, lng], { radius: 8, color: '#fff', fillColor: '#0d7ff2', fillOpacity: 1, weight: 2 }).addTo(map);
            }
            userMarker.bringToFront();

            if (m.center) {
              const point = map.project([lat, lng]);
              point.y += (m.offsetY || 0);
              const target = map.unproject(point);
              map.setView(target, m.zoom || map.getZoom(), { animate: m.animate !== false });
            }
          }
          if (m.type === 'clearUserMarker') {
            if (userMarker) { map.removeLayer(userMarker); userMarker = null; }
          }
          
          if (m.type === 'setBaseLayer') {
            var layer = m.layer || 'standard';
            var theme = m.theme || 'dark';
            
            if (baseLayer) { map.removeLayer(baseLayer); }
            setTimeout(()=>map.invalidateSize(),100);
            if (layer === 'standard') {
              var url = 'https://{s}.basemaps.cartocdn.com/' + theme + '_all/{z}/{x}/{y}.png';
              baseLayer = L.tileLayer(url, { maxZoom: 19, minZoom: ${initialZoom}, detectRetina: true, tileSize: 512, zoomOffset: -1 }).addTo(map);
            } 
            else if (layer === 'satellite') {
              var url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
              baseLayer = L.tileLayer(url, { maxZoom: 19, minZoom: ${initialZoom}, detectRetina: true, tileSize: 512, zoomOffset: -1 }).addTo(map);
            } 
            else if (layer === 'terrain') {
              var url = 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
              baseLayer = L.tileLayer(url, { 
                maxZoom: 17,  
                minZoom: ${initialZoom}, 
                detectRetina: true 
              }).addTo(map);

              if (theme === 'dark') {
                baseLayer.on('add', function(e) {
                  e.target.getContainer().style.filter = 'invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%)';
                });
                
                if(baseLayer.getContainer()) baseLayer.getContainer().style.filter = 'invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%)';
              }
            }
          }
        } catch{ }
      }
      window.addEventListener('message', function(e){ handleMessage(e.data); });
      document.addEventListener('message', function(e){ handleMessage(e.data); });
    </script>
  </body>
  </html>`;

    return (
      <View style={styles.container}>
        <WebView
          originWhitelist={["*"]}
          source={{ html }}
          style={styles.webview}
          javaScriptEnabled
          domStorageEnabled
          ref={ref}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          scalesPageToFit={Platform.OS === "android"}
          onMessage={(e) => {
            try {
              const msg = JSON.parse(e.nativeEvent.data);
              if (onMapMessage) onMapMessage(msg);
            } catch {}
          }}
        />
      </View>
    );
  },
);

ShadcnMap.displayName = "ShadcnMap";

export default ShadcnMap;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  webview: {
    flex: 1,
    backgroundColor: "#000",
  },
});
