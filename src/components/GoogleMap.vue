<template>
  <div class="map-container">
    <div class="map-controls">
      <button @click="centerMap" class="control-btn">Reset View</button>
      <button @click="addMarkerAtCenter" class="control-btn">Add Marker</button>
      <button @click="clearMarkers" class="control-btn">Clear Markers</button>
      <button @click="mode = 'setStart'" class="control-btn">Set Start (klik peta)</button>
      <button @click="mode = 'setEnd'" class="control-btn">Set End (klik peta)</button>
      <button @click="onDrawRoute" :disabled="!start || !end" class="control-btn">Draw Route</button>
      <button @click="onClearRoute">Clear Route</button>
      <button @click="onClearAll">Clear All</button>
    </div>

    <transition name="slide-fade">
      <div v-if="showCard && routeInfo" class="route-card" role="region" aria-live="polite">
        <div class="route-card-header">
          <strong>Estimasi Perjalanan</strong>
          <div class="route-card-actions">
            <button class="icon-btn" @click="onStartNavigation" title="Mulai Navigasi">▶</button>
            <button class="icon-btn" @click="toggleCard" aria-label="Tutup">✕</button>
          </div>
        </div>

        <div class="route-card-body">
          <div class="route-row">
            <span class="label">Dari</span>
            <span class="value">{{ start ? formatLatLng(start) : "-" }}</span>
          </div>
          <div class="route-row">
            <span class="label">Ke</span>
            <span class="value">{{ end ? formatLatLng(end) : "-" }}</span>
          </div>
          <hr />
          <div class="route-stats">
            <div>
              <div class="stat-label">Jarak</div>
              <div class="stat-value">{{ routeInfo.distance }}</div>
            </div>
            <div>
              <div class="stat-label">Perkiraan Waktu</div>
              <div class="stat-value">{{ routeInfo.duration }}</div>
            </div>
          </div>
        </div>

        <div class="route-card-footer">
          <button class="control-btn small" @click="onClearRoute">Hapus Rute</button>
          <button class="control-btn small outline" @click="toggleCard">Tutup</button>
        </div>
      </div>
    </transition>

    <div ref="mapRef" class="google-map"></div>

    <div class="map-info">
      <p v-if="currentLocation">
        Current Location:
        {{ currentLocation.lat.toFixed(6) }}, {{ currentLocation.lng.toFixed(6) }}
      </p>
      <p>Markers: {{ markers.length }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useGoogleMap } from "../composables/useGoogleMap";

const mode = ref<'idle' | 'setStart' | 'setEnd'>('idle');
const start = ref<google.maps.LatLngLiteral | null>(null);
const end = ref<google.maps.LatLngLiteral | null>(null);
const startMarker = ref<google.maps.Marker | null>(null);
const endMarker = ref<google.maps.Marker | null>(null);
const routeInfo = ref<{ distance: string; duration: string } | null>(null);
const showCard = ref(true);

interface Props {
  apiKey: string;
  mapId: string;
  center?: google.maps.LatLngLiteral;
  zoom?: number;
}

const props = withDefaults(defineProps<Props>(), {
  center: () => ({ lat: -6.2088, lng: 106.8456 }),
  zoom: 12,
});

const {
  mapRef,
  map,
  markers,
  currentLocation,
  initMap,
  addMarkerAtCenter,
  clearMarkers,
  centerMap,
  calculateRoute,
  clearRoute,
  currentRoute,
} = useGoogleMap(props.apiKey, props.mapId);

async function onDrawRoute() {
  if (!start.value || !end.value) return;
  try {
    const result = await calculateRoute(start.value, end.value, google.maps.TravelMode.DRIVING);
    if (result && result.routes && result.routes.length > 0) {
      const legs = result.routes[0].legs;
      if (legs && legs.length > 0) {
        const leg = legs.reduce((acc, l) => {
          // jika ada multiple legs (waypoints), jumlahkan
          acc.distanceValue = (acc.distanceValue || 0) + (l.distance?.value || 0);
          acc.durationValue = (acc.durationValue || 0) + (l.duration?.value || 0);
          return acc;
        }, { distanceValue: 0, durationValue: 0 });
        // convert to human readable
        routeInfo.value = {
          distance: formatMeters(leg.distanceValue),
          duration: formatSeconds(leg.durationValue),
        };
      }
    }
  } catch (err) {
    console.error("Gagal menghitung rute:", err);
    routeInfo.value = null;
  }
}

function setStart(pos: google.maps.LatLngLiteral) {
  start.value = pos;
  // hapus marker lama
  startMarker.value?.setMap(null);
  // buat marker A
  startMarker.value = new google.maps.Marker({
    position: pos,
    map: map.value ?? undefined,
    label: { text: "A", color: "white" },
    title: "Start",
  });
}

function setEnd(pos: google.maps.LatLngLiteral) {
  end.value = pos;
  endMarker.value?.setMap(null);
  endMarker.value = new google.maps.Marker({
    position: pos,
    map: map.value ?? undefined,
    label: { text: "B", color: "white" },
    title: "End",
  });
}

function onClearRoute() {
  clearRoute();
  routeInfo.value = null;
}

function onClearAll() {
  console.log("Clearing all data");
  onClearRoute();
  startMarker.value?.setMap(null);
  endMarker.value?.setMap(null);

  startMarker.value = null;
  endMarker.value = null;

  start.value = null;
  end.value = null;

  mode.value = 'idle';
  routeInfo.value = null;
}

let mapClickListener: google.maps.MapsEventListener | null = null;
onMounted(async () => {
  console.log("Menginisialisasi peta dengan API Key:", props.apiKey);
  await initMap(props.center, props.zoom)
  try {
    if (map.value) {
      mapClickListener = map.value.addListener("click", (e: google.maps.MapMouseEvent) => {
        console.log("Map clicked at:", e.latLng?.toJSON());
        console.log("Current mode:", mode.value);
        if (!e.latLng) return;
        const pos = e.latLng.toJSON();
        if (mode.value === 'setStart') {
          console.log("Setting start to:", pos);
          setStart(pos);
          mode.value = 'idle';
        } else if (mode.value === 'setEnd') {
          console.log("Setting end to:", pos);
          setEnd(pos);
          mode.value = 'idle';
        }
      });
    }
  } catch (error) {
    console.error("Error setting up map click listener:", error);
  }
});

function toggleCard() {
  showCard.value = !showCard.value;
}

function onStartNavigation() {
  if (!start.value || !end.value) return;
  const origin = `${start.value.lat},${start.value.lng}`;
  const dest = `${end.value.lat},${end.value.lng}`;
  const url = `https://www.google.com/maps/dir/?${props.apiKey}=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(dest)}&travelmode=driving`;
  window.open(url, "_blank");
}

function formatMeters(meters: number) {
  if (meters >= 1000) return (meters / 1000).toFixed(2) + " km";
  return meters + " m";
}

function formatSeconds(seconds: number) {
  if (seconds >= 3600) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h} h ${m} m`;
  }
  if (seconds >= 60) {
    return `${Math.round(seconds / 60)} min`;
  }
  return `${seconds} sec`;
}

function formatLatLng(pos: google.maps.LatLngLiteral) {
  return `${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}`;
}
</script>

<style scoped>
.map-container {
  position: relative;
  width: 100%;
  height: 100vh;
}

.google-map {
  width: 100%;
  height: 100%;
}

.map-controls {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 1000;
  background: white;
  padding: 10px;
  border-radius: 5px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.control-btn {
  margin: 0 5px;
  padding: 8px 12px;
  background: #4285f4;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.control-btn:hover {
  background: #3367d6;
}

.map-info {
  position: absolute;
  bottom: 10px;
  left: 10px;
  z-index: 1000;
  background: white;
  padding: 10px;
  border-radius: 5px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.map-info p {
  margin: 5px 0;
  font-size: 14px;
}

.map-container {
  position: relative;
  width: 100%;
  height: 100vh;
}

.google-map {
  width: 100%;
  height: 100%;
}

/* Controls (left) */
.map-controls {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 1000;
  background: white;
  padding: 8px;
  border-radius: 6px;
  display: flex;
  gap: 6px;
}

/* Card (right top) */
.route-card {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 1100;
  width: 300px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
  padding: 12px;
  font-size: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.route-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.route-card-actions {
  display: flex;
  gap: 6px;
}

.icon-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 14px;
  padding: 4px;
}

/* body */
.route-card-body {
  display: block;
}

.route-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
}

.label {
  color: #666;
  font-size: 12px;
}

.value {
  font-weight: 600;
}

.route-stats {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 6px;
}

.stat-label {
  font-size: 12px;
  color: #666;
}

.stat-value {
  font-weight: 700;
  font-size: 16px;
}

/* footer */
.route-card-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 6px;
}

/* small control button style */
.control-btn.small {
  padding: 6px 8px;
  font-size: 13px;
}

.control-btn.small.outline {
  background: transparent;
  border: 1px solid #ccc;
  color: #333;
}

/* transition */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all .25s cubic-bezier(.2, .8, .2, 1);
}

.slide-fade-enter-from {
  opacity: 0;
  transform: translateY(-6px) translateX(10px) scale(0.98);
}

.slide-fade-enter-to {
  opacity: 1;
  transform: translateY(0) translateX(0) scale(1);
}

.slide-fade-leave-from {
  opacity: 1;
}

.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px) translateX(10px) scale(0.98);
}

/* Responsive: di layar kecil, kecilkan card */
@media (max-width: 640px) {
  .route-card {
    width: 90%;
    right: 5%;
    top: 10px;
    padding: 10px;
  }
}
</style>
