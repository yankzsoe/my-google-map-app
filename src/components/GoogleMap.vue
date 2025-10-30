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
</style>
