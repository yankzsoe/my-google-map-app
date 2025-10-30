<template>
  <div class="map-container">
    <div id="map" class="map"></div>

    <div class="controls">
      <button @click="addRandomMarker">Tambah Marker Random</button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import * as L from 'leaflet'

const map = ref<L.Map | null>(null)
const markers = ref<L.Marker[]>([])

onMounted(() => {
  const leafletMap = L.map('map').setView([-6.2, 106.816666], 12) // Jakarta

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(leafletMap)

  map.value = leafletMap

  leafletMap.on('click', (e: L.LeafletMouseEvent) => {
    addMarker(e.latlng.lat, e.latlng.lng)
  })
})

function addMarker(lat: number, lng: number) {
  const leafletMap = map.value
  if (!leafletMap) return

  // Casting explicit ke L.Map untuk hindari error TS2345
  const marker = L.marker([lat, lng])
  marker.addTo(leafletMap as L.Map)
  markers.value.push(marker)
}

function addRandomMarker() {
  const lat = -6.2 + (Math.random() - 0.5) * 0.1
  const lng = 106.816666 + (Math.random() - 0.5) * 0.1
  addMarker(lat, lng)
}
</script>

<style scoped>
.map-container {
  position: relative;
}

.map {
  width: 100%;
  height: 80vh;
  border-radius: 12px;
}

.controls {
  margin-top: 10px;
  display: flex;
  justify-content: center;
}

button {
  background-color: #2c7be5;
  color: white;
  border: none;
  padding: 8px 14px;
  border-radius: 8px;
  cursor: pointer;
}

button:hover {
  background-color: #1a5fd3;
}
</style>
