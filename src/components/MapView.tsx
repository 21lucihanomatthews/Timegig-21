import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { UserLocation, Gig } from '../types';
import { Navigation, Layers, Globe, Search, Loader2, Plus, Minus } from 'lucide-react';

interface MapViewProps {
  userLocation: UserLocation;
  gigs: Gig[];
  selectedGig: Gig | null;
  onSelectGig: (gig: Gig) => void;
  onRefreshLocation: () => void;
  onUpdateLocation: (loc: UserLocation) => void;
  selfieUrl: string | null;
}

export const MapView: React.FC<MapViewProps> = ({
  userLocation,
  gigs,
  selectedGig,
  onSelectGig,
  onRefreshLocation,
  onUpdateLocation,
  selfieUrl,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const userMarkerRef = useRef<L.Marker | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);

  const [mapStyle, setMapStyle] = useState<'osm' | 'satellite'>('osm');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Initialize Map once without default zoom control
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView([userLocation.lat, userLocation.lng], 15);

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update tile layer when mapStyle changes (OSM vs Satellite)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    let tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    if (mapStyle === 'satellite') {
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    }

    L.tileLayer(tileUrl, {
      maxZoom: 19,
      attribution: '',
    }).addTo(map);
  }, [mapStyle]);

  // Update User Location Marker & View on startup
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const userIconHtml = `
      <div class="user-location-pulse flex items-center justify-center w-8 h-8 rounded-full bg-sky-500 text-white shadow-lg border-2 border-white ring-4 ring-sky-400/30">
        <div class="w-3 h-3 bg-white rounded-full"></div>
      </div>
    `;

    const userIcon = L.divIcon({
      className: 'custom-user-marker',
      html: userIconHtml,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
    } else {
      userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], {
        icon: userIcon,
        zIndexOffset: 1000,
      }).addTo(map);
    }

    map.setView([userLocation.lat, userLocation.lng], 15, { animate: true });
  }, [userLocation.lat, userLocation.lng]);

  // Update Gig Markers on Map & Routing Polyline if accepted
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const currentGigIds = new Set(gigs.map((g) => g.id));
    Object.keys(markersRef.current).forEach((id) => {
      if (!currentGigIds.has(id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });

    // Remove existing routing polyline
    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }

    gigs.forEach((gig) => {
      const isSelected = selectedGig?.id === gig.id;
      const isGreen = gig.status === 'accepted';

      const borderColor = isGreen ? 'border-emerald-500 ring-2 ring-emerald-400' : 'border-indigo-500 ring-2 ring-indigo-400';
      const avatarSrc = selfieUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&crop=faces';

      const gigIconHtml = `
        <div class="flex items-center gap-1.5 px-2 py-1 rounded-full shadow-md bg-white dark:bg-slate-900 border ${borderColor} transition-transform ${
          isSelected ? 'scale-110 shadow-xl' : 'hover:scale-105'
        }">
          <img 
            src="${avatarSrc}" 
            alt="Profile" 
            class="w-5 h-5 rounded-full object-cover shrink-0" 
          />
          <span class="font-extrabold text-[10px] text-slate-900 dark:text-white pr-0.5">${gig.pay}</span>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-gig-pin',
        html: gigIconHtml,
        iconSize: [70, 30],
        iconAnchor: [35, 15],
      });

      if (markersRef.current[gig.id]) {
        markersRef.current[gig.id].setLatLng([gig.lat, gig.lng]);
        markersRef.current[gig.id].setIcon(customIcon);
      } else {
        const marker = L.marker([gig.lat, gig.lng], { icon: customIcon }).addTo(map);
        marker.on('click', () => {
          onSelectGig(gig);
        });
        markersRef.current[gig.id] = marker;
      }

      // If accepted, draw navigation polyline from user location to gig destination
      if (isGreen) {
        const polyline = L.polyline(
          [
            [userLocation.lat, userLocation.lng],
            [gig.lat, gig.lng],
          ],
          { color: '#10b981', weight: 4, dashArray: '6, 6' }
        ).addTo(map);
        polylineRef.current = polyline;
        try {
          map.fitBounds(polyline.getBounds(), { padding: [60, 60], maxZoom: 16 });
        } catch (e) {
          // ignore if single point
        }
      }
    });
  }, [gigs, selectedGig, userLocation.lat, userLocation.lng, selfieUrl]);

  // Handle Search using Nominatim OpenStreetMap Geocoder
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        onUpdateLocation({
          lat: parseFloat(lat),
          lng: parseFloat(lon),
          address: display_name,
          isTracking: false,
        });
      } else {
        alert('Location not found.');
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Map Element */}
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0" />

      {/* Top Bar: Search Bar */}
      <div className="absolute top-4 left-4 right-4 z-10 flex justify-center pointer-events-none">
        <form
          onSubmit={handleSearchSubmit}
          className="pointer-events-auto w-full max-w-lg bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800/80 flex items-center px-4 py-3 gap-2"
        >
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search area, street, location, province..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none placeholder:text-slate-400"
          />
          {isSearching ? (
            <Loader2 className="w-4 h-4 text-sky-500 animate-spin shrink-0" />
          ) : (
            <button
              type="submit"
              className="text-xs font-bold bg-sky-500 hover:bg-sky-600 text-white px-3.5 py-1.5 rounded-xl transition shadow"
            >
              Search
            </button>
          )}
        </form>
      </div>

      {/* Active Navigation in Progress Banner */}
      {(() => {
        const acceptedGig = gigs.find((g) => g.status === 'accepted');
        if (!acceptedGig) return null;
        return (
          <div className="absolute top-20 left-4 right-4 z-10 flex justify-center pointer-events-none animate-fadeIn">
            <div
              onClick={() => onSelectGig(acceptedGig)}
              className="pointer-events-auto cursor-pointer max-w-lg w-full bg-emerald-600/95 dark:bg-emerald-900/95 backdrop-blur-md text-white rounded-2xl shadow-xl px-4 py-2.5 flex items-center justify-between border border-emerald-400/40 hover:bg-emerald-600 transition"
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <Navigation className="w-4 h-4 text-white animate-pulse" />
                </div>
                <div className="overflow-hidden">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold truncate">Navigating Seeker to Destination</span>
                    <span className="text-[10px] font-extrabold bg-white/20 px-2 py-0.5 rounded-full shrink-0">
                      {acceptedGig.pay}
                    </span>
                  </div>
                  <p className="text-[10px] text-emerald-100 truncate">{acceptedGig.title}</p>
                </div>
              </div>
              <span className="text-[11px] font-bold bg-white text-emerald-700 px-3 py-1 rounded-xl shadow shrink-0 hover:bg-emerald-50 transition">
                View Gig
              </span>
            </div>
          </div>
        );
      })()}

      {/* Floating Action Menu (Bottom Right) */}
      <div className="absolute bottom-16 right-4 z-20 flex flex-col gap-2">
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
          <button
            onClick={() => mapInstanceRef.current?.zoomIn()}
            title="Zoom In"
            className="p-2.5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition border-b border-slate-200 flex items-center justify-center"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={() => mapInstanceRef.current?.zoomOut()}
            title="Zoom Out"
            className="p-2.5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition flex items-center justify-center"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={() => setMapStyle(mapStyle === 'osm' ? 'satellite' : 'osm')}
          title="Switch View"
          className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-2.5 rounded-2xl shadow-xl border border-slate-200 text-slate-700 flex items-center justify-center"
        >
          {mapStyle === 'osm' ? <Globe className="w-4 h-4 text-sky-500" /> : <Layers className="w-4 h-4 text-emerald-500" />}
        </button>


      </div>
    </div>
  );
};
