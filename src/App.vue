<template>
  <GoogleMap :apiKey="apiKey" :mapId="mapId" />
</template>

<script setup lang="ts">
import GoogleMap from "./components/GoogleMap.vue";

const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const mapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID;
</script>
