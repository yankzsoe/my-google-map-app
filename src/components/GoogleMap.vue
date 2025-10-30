<template>
  <div class="map-container">
    <div class="map-controls">
      <button @click="centerMap" class="control-btn">Reset View</button>
      <button @click="addMarkerAtCenter" class="control-btn">Add Marker</button>
      <button @click="clearMarkers" class="control-btn">Clear Markers</button>
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
import { onMounted } from "vue";
import { useGoogleMap } from "../composables/useGoogleMap";

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
  markers,
  currentLocation,
  initMap,
  addMarkerAtCenter,
  clearMarkers,
  centerMap,
} = useGoogleMap(props.apiKey, props.mapId);

onMounted(() => {
  console.log("Menginisialisasi peta dengan API Key:", props.apiKey);
  initMap(props.center, props.zoom)
});
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
