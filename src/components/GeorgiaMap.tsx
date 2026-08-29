import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { University } from '../types';

interface GeorgiaMapProps {
  institutions: University[];
  onSelectInstitution: (code: string) => void;
  selectedCode?: string;
  height?: string;
}

export const GeorgiaMap: React.FC<GeorgiaMapProps> = ({
  institutions,
  onSelectInstitution,
  selectedCode,
  height = '420px'
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  // Center of Georgia
  const GEORGIA_CENTER: [number, number] = [42.0, 43.8];
  const DEFAULT_ZOOM = 8;

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize Leaflet Map once
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: GEORGIA_CENTER,
        zoom: DEFAULT_ZOOM,
        zoomControl: true,
        scrollWheelZoom: false
      });

      // Add modern OpenStreetMap tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current.clear();

    const bounds = L.latLngBounds([]);

    // Add markers for each institution
    institutions.forEach(inst => {
      if (!inst.lat || !inst.lng) return;

      bounds.extend([inst.lat, inst.lng]);

      const isSelected = selectedCode === inst.code;
      const logoHtml = inst.logo_url 
        ? `<div class="relative w-9 h-9 rounded-full bg-white border-2 ${isSelected ? 'border-[#C79B3A] ring-4 ring-[#C79B3A]/30 scale-110' : 'border-[#0D1B2A]'} shadow-lg overflow-hidden flex items-center justify-center p-0.5 transition-all">
            <img src="${inst.logo_url}" alt="${inst.name}" class="w-full h-full object-contain rounded-full" />
           </div>`
        : `<div class="w-8 h-8 rounded-full bg-[#0D1B2A] text-white border-2 border-[#C79B3A] flex items-center justify-center text-xs font-bold shadow-lg">
            🎓
           </div>`;

      const customIcon = L.divIcon({
        html: logoHtml,
        className: 'custom-university-marker',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -18]
      });

      const marker = L.marker([inst.lat, inst.lng], { icon: customIcon }).addTo(map);

      const cleanCode = inst.code.replace('#', '');
      const profilePath = inst.type === 'კოლეჯი' ? `/colleges/${cleanCode}` : `/universities/${cleanCode}`;

      const popupHtml = `
        <div class="p-2.5 max-w-[220px] text-center font-sans space-y-2">
          ${inst.logo_url ? `<img src="${inst.logo_url}" alt="${inst.name}" class="w-12 h-12 object-contain mx-auto rounded-lg mb-1" />` : ''}
          <h4 class="font-bold text-xs text-[#0D1B2A] leading-tight">${inst.name}</h4>
          <p class="text-[11px] text-[#666666] flex items-center justify-center gap-1">
            📍 ${inst.city || 'საქართველო'} • ${inst.status}
          </p>
          <div class="pt-1">
            <button
              id="map-btn-${cleanCode}"
              class="w-full px-3 py-1.5 bg-[#0D1B2A] hover:bg-[#C79B3A] text-white text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
            >
              პროფილის ნახვა →
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('popupopen', () => {
        const btn = document.getElementById(`map-btn-${cleanCode}`);
        if (btn) {
          btn.onclick = () => {
            onSelectInstitution(inst.code);
          };
        }
      });

      markersRef.current.set(inst.code, marker);
    });

    // Adjust bounds if filtered items exist
    if (institutions.length > 0 && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
    } else {
      map.setView(GEORGIA_CENTER, DEFAULT_ZOOM);
    }

  }, [institutions, selectedCode, onSelectInstitution]);

  // Center on selected code if provided
  useEffect(() => {
    if (selectedCode && mapInstanceRef.current) {
      const selectedInst = institutions.find(i => i.code === selectedCode);
      if (selectedInst && selectedInst.lat && selectedInst.lng) {
        mapInstanceRef.current.flyTo([selectedInst.lat, selectedInst.lng], 12, { duration: 1.2 });
        const marker = markersRef.current.get(selectedCode);
        if (marker) marker.openPopup();
      }
    }
  }, [selectedCode, institutions]);

  return (
    <div className="relative rounded-3xl border-2 border-[#E6DDCB] shadow-md overflow-hidden bg-[#FAF8F3]">
      {/* Map Container */}
      <div ref={mapContainerRef} style={{ height, width: '100%' }} className="z-10" />

      {/* Floating Header Overlay */}
      <div className="absolute top-3 left-3 z-20 bg-white/90 backdrop-blur-md border border-[#E6DDCB] px-3.5 py-1.5 rounded-xl shadow-sm flex items-center gap-2 text-xs font-bold text-[#0D1B2A]">
        <span>🗺 საქართველოს ინტერაქტიული რუკა</span>
        <span className="bg-[#0D1B2A] text-[#FAF8F3] px-2 py-0.5 rounded-md text-[10px] font-mono">
          {institutions.length}
        </span>
      </div>
    </div>
  );
};
