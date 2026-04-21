'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { MapPin, Users, Clock, Navigation, Search, X, Locate } from 'lucide-react';

interface RouteChapter {
  chapter_id: number; chapter_name: string; venue_name: string; address: string;
  city: string; latitude: number; longitude: number; meeting_schedule: string;
  total_members: number; region_name: string; distance_km: number;
  matching_members: number; top_professions: { profession_category: string; count: number }[];
}

interface Suggestion {
  place_name: string;
  center: [number, number];
  text: string;
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

function AddressInput({ label, value, onChange, onSelect, placeholder, icon }: {
  label: string; value: string; onChange: (v: string) => void;
  onSelect: (place: Suggestion) => void; placeholder: string; icon: string;
}) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setShowSuggestions(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 2) { setSuggestions([]); return; }
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&country=IN&limit=5&types=place,locality,poi,address`
      );
      const data = await res.json();
      setSuggestions(data.features?.map((f: any) => ({
        place_name: f.place_name,
        center: f.center,
        text: f.text,
      })) || []);
      setShowSuggestions(true);
    } catch { setSuggestions([]); }
  }, []);

  const handleChange = (v: string) => {
    onChange(v);
    if (debounceTimer) clearTimeout(debounceTimer);
    const timer = setTimeout(() => fetchSuggestions(v), 300);
    setDebounceTimer(timer);
  };

  return (
    <div ref={ref} style={{ position: 'relative', marginBottom: 12 }}>
      <div className="route-input-label">{icon} {label}</div>
      <div style={{ position: 'relative' }}>
        <input
          className="route-input"
          placeholder={placeholder}
          value={value}
          onChange={e => handleChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
        />
        {value && (
          <button onClick={() => { onChange(''); setSuggestions([]); }}
            style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={14} />
          </button>
        )}
      </div>
      {showSuggestions && suggestions.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
          background: 'var(--bg-secondary)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)', marginTop: 4, overflow: 'hidden',
          boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
        }}>
          {suggestions.map((s, i) => (
            <div key={i} onClick={() => { onSelect(s); onChange(s.place_name); setShowSuggestions(false); }}
              style={{
                padding: '10px 14px', cursor: 'pointer', fontSize: 13,
                borderBottom: i < suggestions.length - 1 ? '1px solid var(--border)' : 'none',
                color: 'var(--text-secondary)', transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => { (e.target as HTMLElement).style.background = 'var(--bg-glass)'; (e.target as HTMLElement).style.color = 'var(--text-primary)'; }}
              onMouseLeave={e => { (e.target as HTMLElement).style.background = 'transparent'; (e.target as HTMLElement).style.color = 'var(--text-secondary)'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MapPin size={14} style={{ color: 'var(--accent-blue)', flexShrink: 0 }} />
                <span>{s.place_name}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function RoutePage() {
  const [fromText, setFromText] = useState('');
  const [toText, setToText] = useState('');
  const [fromCoords, setFromCoords] = useState<[number, number] | null>(null);
  const [toCoords, setToCoords] = useState<[number, number] | null>(null);
  const [radius, setRadius] = useState(15);
  const [results, setResults] = useState<RouteChapter[]>([]);
  const [loading, setLoading] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);
  const [searched, setSearched] = useState(false);
  const mapInstanceRef = useRef<any>(null);
  const mapboxglRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  // Initialize map
  useEffect(() => {
    const init = async () => {
      const mapboxgl = (await import('mapbox-gl')).default;
      await import('mapbox-gl/dist/mapbox-gl.css');
      mapboxgl.accessToken = MAPBOX_TOKEN;

      const map = new mapboxgl.Map({
        container: 'route-map',
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [78.9629, 20.5937],
        zoom: 4.5,
      });
      map.addControl(new mapboxgl.NavigationControl(), 'top-right');
      mapInstanceRef.current = map;
      mapboxglRef.current = mapboxgl;
    };
    init().catch(console.error);
    return () => { mapInstanceRef.current?.remove(); };
  }, []);

  const clearMap = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    // Remove route layer
    if (map.getLayer('route-line')) map.removeLayer('route-line');
    if (map.getLayer('route-outline')) map.removeLayer('route-outline');
    if (map.getSource('route')) map.removeSource('route');
    // Remove markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
  };

  const findRoute = async () => {
    if (!fromCoords || !toCoords) return;
    setLoading(true);
    setSearched(true);
    clearMap();

    const map = mapInstanceRef.current;
    const mapboxgl = mapboxglRef.current;
    if (!map || !mapboxgl) { setLoading(false); return; }

    let waypoints: [number, number][] = [[fromCoords[1], fromCoords[0]], [toCoords[1], toCoords[0]]]; // [lat, lng]

    try {
      // Get Mapbox Directions
      const res = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${fromCoords[0]},${fromCoords[1]};${toCoords[0]},${toCoords[1]}?geometries=geojson&overview=full&steps=true&access_token=${MAPBOX_TOKEN}`
      );
      const data = await res.json();

      if (data.routes?.[0]) {
        const route = data.routes[0];
        const coords = route.geometry.coordinates;

        // Route info
        const distKm = (route.distance / 1000).toFixed(1);
        const durMin = Math.round(route.duration / 60);
        const hours = Math.floor(durMin / 60);
        const mins = durMin % 60;
        setRouteInfo({
          distance: `${distKm} km`,
          duration: hours > 0 ? `${hours}h ${mins}m` : `${mins}m`,
        });

        // Draw route on map
        map.addSource('route', { type: 'geojson', data: route.geometry });
        // Route outline (glow)
        map.addLayer({
          id: 'route-outline', type: 'line', source: 'route',
          paint: { 'line-color': '#3b82f6', 'line-width': 8, 'line-opacity': 0.25, 'line-blur': 3 }
        });
        // Route line
        map.addLayer({
          id: 'route-line', type: 'line', source: 'route',
          paint: { 'line-color': '#3b82f6', 'line-width': 4, 'line-opacity': 0.9 }
        });

        // Add start/end markers
        const startEl = document.createElement('div');
        startEl.style.cssText = 'width:24px;height:24px;background:#10b981;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3);';
        markersRef.current.push(new mapboxgl.Marker(startEl).setLngLat(fromCoords).addTo(map));

        const endEl = document.createElement('div');
        endEl.style.cssText = 'width:24px;height:24px;background:#f43f5e;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3);';
        markersRef.current.push(new mapboxgl.Marker(endEl).setLngLat(toCoords).addTo(map));

        // Fit map to route
        const bounds = coords.reduce(
          (b: any, c: [number, number]) => b.extend(c),
          new mapboxgl.LngLatBounds(coords[0], coords[0])
        );
        map.fitBounds(bounds, { padding: 80 });

        // Build waypoints for route API
        const step = Math.max(1, Math.floor(coords.length / 60));
        waypoints = coords
          .filter((_: any, i: number) => i % step === 0 || i === coords.length - 1)
          .map((c: [number, number]) => [c[1], c[0]] as [number, number]);
      }
    } catch (err) {
      console.error('Directions error:', err);
    }

    // Find chapters near route
    try {
      const res = await fetch('/api/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ waypoints, radius }),
      });
      const data = await res.json();
      setResults(data.chapters || []);

      // Add chapter markers
      for (const ch of (data.chapters || [])) {
        const el = document.createElement('div');
        el.style.cssText = `
          width:14px;height:14px;background:var(--accent-amber, #f59e0b);
          border:2px solid white;border-radius:50%;cursor:pointer;
          box-shadow:0 2px 6px rgba(0,0,0,0.3);
        `;

        const popup = new mapboxgl.Popup({ offset: 15, maxWidth: '280px' }).setHTML(`
          <div class="popup-name">${ch.chapter_name}</div>
          <div class="popup-venue">📍 ${ch.venue_name || ch.city || ch.address}</div>
          <div class="popup-schedule">🕐 ${ch.meeting_schedule || 'TBD'}</div>
          <div class="popup-members">👥 ${ch.total_members} members · ${ch.distance_km}km from route</div>
          <a href="/chapters/${ch.chapter_id}" class="btn btn-primary btn-sm popup-btn" style="margin-top:8px;display:block;text-align:center;text-decoration:none;">View Chapter</a>
        `);

        const marker = new mapboxgl.Marker(el)
          .setLngLat([ch.longitude, ch.latitude])
          .setPopup(popup)
          .addTo(map);
        markersRef.current.push(marker);
      }
    } catch {}

    setLoading(false);
  };

  return (
    <div className="route-layout">
      {/* Panel */}
      <div className="route-panel">
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>
            <span style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Route Connect</span>
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Find BNI chapters along your travel route
          </p>
        </div>

        {/* From/To Inputs with Autocomplete */}
        <AddressInput
          label="FROM" icon="🟢"
          value={fromText} onChange={setFromText}
          onSelect={(s) => setFromCoords(s.center)}
          placeholder="Enter starting location..."
        />
        <AddressInput
          label="TO" icon="🔴"
          value={toText} onChange={setToText}
          onSelect={(s) => setToCoords(s.center)}
          placeholder="Enter destination..."
        />

        {/* Radius Slider */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span className="route-input-label" style={{ margin: 0 }}>📏 Search Radius</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-blue)' }}>{radius} km</span>
          </div>
          <input type="range" min={1} max={50} value={radius} onChange={e => setRadius(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--accent-blue)', height: 4 }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)' }}>
            <span>1 km</span><span>25 km</span><span>50 km</span>
          </div>
        </div>

        {/* Search Button */}
        <button
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: 15, marginBottom: 20 }}
          onClick={findRoute}
          disabled={loading || !fromCoords || !toCoords}
        >
          {loading ? (
            <><div className="spinner" style={{ width: 16, height: 16 }} /> Finding chapters...</>
          ) : (
            <><Navigation size={18} /> Find Chapters on Route</>
          )}
        </button>

        {/* Route Info */}
        {routeInfo && (
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <div className="stat-card" style={{ flex: 1, padding: '12px 16px' }}>
              <div><div style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent-blue)' }}>{routeInfo.distance}</div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Distance</div></div>
            </div>
            <div className="stat-card" style={{ flex: 1, padding: '12px 16px' }}>
              <div><div style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent-green)' }}>{routeInfo.duration}</div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Travel Time</div></div>
            </div>
            <div className="stat-card" style={{ flex: 1, padding: '12px 16px' }}>
              <div><div style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent-amber)' }}>{results.length}</div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Chapters</div></div>
            </div>
          </div>
        )}

        {/* Results */}
        <div style={{ flex: 1 }}>
          {results.length > 0 && (
            <>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                📍 {results.length} chapters within {radius}km of route
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {results.map(ch => (
                  <Link key={ch.chapter_id} href={`/chapters/${ch.chapter_id}`} className="chapter-card" style={{ textDecoration: 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div className="chapter-card-name" style={{ fontSize: 14 }}>{ch.chapter_name}</div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-amber)', background: 'rgba(245,158,11,0.1)', padding: '2px 8px', borderRadius: 10, flexShrink: 0 }}>
                        {ch.distance_km} km
                      </span>
                    </div>
                    <div className="chapter-card-venue" style={{ fontSize: 12 }}><MapPin size={11} /> {ch.venue_name || ch.city || ch.address?.slice(0, 40)}</div>
                    <div className="chapter-card-schedule" style={{ fontSize: 11 }}><Clock size={11} /> {ch.meeting_schedule || 'TBD'}</div>
                    <div className="chapter-card-footer">
                      <span className="chapter-card-members" style={{ fontSize: 11 }}><Users size={11} /> {ch.total_members} members</span>
                      <span className="badge" style={{ fontSize: 10 }}>{ch.region_name}</span>
                    </div>
                    {ch.top_professions?.length > 0 && (
                      <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {ch.top_professions.slice(0, 3).map(p => (
                          <span key={p.profession_category} style={{ fontSize: 10, padding: '1px 6px', borderRadius: 6, background: 'var(--bg-glass)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                            {p.profession_category} ({p.count})
                          </span>
                        ))}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </>
          )}
          {searched && results.length === 0 && !loading && (
            <div className="empty-state" style={{ padding: '30px 10px' }}>
              <MapPin size={36} style={{ opacity: 0.2, marginBottom: 12 }} />
              <h3>No chapters found</h3>
              <p style={{ fontSize: 13 }}>Try increasing the search radius</p>
            </div>
          )}
        </div>
      </div>

      {/* Map */}
      <div className="route-map">
        <div id="route-map" style={{ width: '100%', height: '100%' }} />
      </div>
    </div>
  );
}
