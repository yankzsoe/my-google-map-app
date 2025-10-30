// composables/useGoogleMap.ts
import { ref, onBeforeUnmount, nextTick } from "vue";

export function useGoogleMap(apiKey: string, mapId?: string) {
  const mapRef = ref<HTMLDivElement | null>(null);
  const map = ref<google.maps.Map | null>(null);
  // classic Marker type
  const markers = ref<google.maps.Marker[]>([]);
  const currentLocation = ref<google.maps.LatLngLiteral | null>(null);

  const defaultCenter = { lat: -6.2088, lng: 106.8456 };
  const defaultZoom = 12;

  async function loadGoogleMaps() {
    if ((window as any).google?.maps) return;
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load Google Maps API"));
      document.head.appendChild(script);
    });
  }

  async function initMap(center?: google.maps.LatLngLiteral, zoom?: number) {
    if (!apiKey) throw new Error("API key required");
    await loadGoogleMaps();
    // ensure DOM mounted
    await nextTick();
    if (!mapRef.value) throw new Error("mapRef not set");
    map.value = new google.maps.Map(mapRef.value, {
      center: center ?? defaultCenter,
      zoom: zoom ?? defaultZoom,
      mapId: mapId ?? undefined,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
    });

    map.value.addListener("click", (e: google.maps.MapMouseEvent) => {
      if (e.latLng) addMarkerAtLocation(e.latLng.toJSON());
    });

    // set current location if available
    getCurrentLocation();
  }

  // Accept LatLngLiteral for simplicity
  function addMarkerAtLocation(pos: google.maps.LatLngLiteral) {
    console.log("Menambahkan marker di:", pos);
    if (!map.value) {
      console.warn("Map not initialized yet; cannot add marker");
      return;
    }
    const marker = new google.maps.Marker({
      position: pos,
      map: map.value,
      title: `Lat: ${pos.lat.toFixed(6)}, Lng: ${pos.lng.toFixed(6)}`,
    });

    const info = new google.maps.InfoWindow({
      content: `
        <div style="font-size:14px">
          <strong>Lat:</strong> ${pos.lat.toFixed(6)}<br/>
          <strong>Lng:</strong> ${pos.lng.toFixed(6)}
        </div>
      `,
    });

    marker.addListener("click", () => info.open({ map: map.value, anchor: marker }));
    markers.value.push(marker);
    console.log("Total markers:", markers.value.length);
  }

  function addMarkerAtCenter() {
    if (!map.value) return;
    const center = map.value.getCenter();
    if (!center) return;
    addMarkerAtLocation(center.toJSON());
  }

  function clearMarkers() {
    markers.value.forEach((m) => m.setMap(null));
    markers.value = [];
  }

  function centerMap() {
    if (!map.value) return;
    map.value.setCenter(defaultCenter);
    map.value.setZoom(defaultZoom);
  }

  function getCurrentLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        currentLocation.value = loc;
        map.value?.setCenter(loc);
        addMarkerAtLocation(loc);
      },
      (err) => console.warn("⚠️ Cannot get location:", err.message)
    );
  }

  onBeforeUnmount(clearMarkers);

  return {
    mapRef,
    map,
    markers,
    currentLocation,
    initMap,
    addMarkerAtCenter,
    clearMarkers,
    centerMap,
  };
}
