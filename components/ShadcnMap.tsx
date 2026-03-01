import { addressSvg } from "@/assets/icons/svgStrings";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";

type Props = {
  initialZoom?: number;
  onMapMessage?: (msg: any) => void;
};

const ShadcnMap = React.forwardRef<any, Props>(
  ({ initialZoom = 2, onMapMessage }, ref) => {
    const addressSvgString = addressSvg("#0d7ff2");

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
      var markers = [];
      var routePolyline = null;

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
            map.invalidateSize();
            setTimeout(function(){ map.fitBounds(m.bounds, { animate: false, padding: m.padding || [24, 24] }); }, 120);
          }
          if (m.type === 'setUserMarker') {
            const lat = m.lat; const lng = m.lng;
            const iconType = m.icon || null;
            
            if (userMarker) {
              map.removeLayer(userMarker);
              userMarker = null;
            }
            if (iconType === 'address') {
              const svg = ${JSON.stringify(addressSvgString)};
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
          
          if (m.type === 'clearMarkers') {
            markers.forEach(function(mk){ map.removeLayer(mk); });
            markers = [];
          }
          if (m.type === 'addMarker') {
            var mIcon = L.divIcon({ className: '', html: m.html, iconSize: m.iconSize || [28,36], iconAnchor: m.iconAnchor || [14,36] });
            var mk = L.marker([m.lat, m.lng], { icon: mIcon }).addTo(map);
            markers.push(mk);
          }
          if (m.type === 'clearPolyline') {
            if (routePolyline) { map.removeLayer(routePolyline); routePolyline = null; }
          }
          if (m.type === 'setPolyline') {
            if (routePolyline) { map.removeLayer(routePolyline); routePolyline = null; }
            if (m.latlngs && m.latlngs.length > 1) {
              var polylineOpts = { color: m.color || '#0d7ff2', weight: m.weight || 2.5, opacity: m.opacity || 0.85 };
              if (m.dashArray) polylineOpts.dashArray = m.dashArray;
              routePolyline = L.polyline(m.latlngs, polylineOpts).addTo(map);
            }
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
