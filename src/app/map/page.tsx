'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Search, MapPin, Users, Clock, Filter } from 'lucide-react';

interface Chapter {
  chapter_id: number; chapter_name: string; venue_name: string; address: string;
  city: string; state: string; latitude: number; longitude: number;
  meeting_day: string; meeting_time: string; meeting_schedule: string;
  total_members: number; region_name: string;
}

export default function MapPage() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [search, setSearch] = useState('');
  const [dayFilter, setDayFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: '2000' });
    if (search) params.set('search', search);
    if (dayFilter) params.set('day', dayFilter);
    const res = await fetch(`/api/chapters?${params}`);
    const data = await res.json();
    setChapters(data.chapters);
    setLoading(false);
  }, [search, dayFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!chapters.length || mapReady) return;

    const loadMap = async () => {
      const mapboxgl = (await import('mapbox-gl')).default;
      await import('mapbox-gl/dist/mapbox-gl.css');

      mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

      const map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [78.9629, 20.5937],
        zoom: 4.5,
      });

      map.addControl(new mapboxgl.NavigationControl(), 'top-right');

      map.on('load', () => {
        // Add chapter markers as a GeoJSON source
        const geojson = {
          type: 'FeatureCollection' as const,
          features: chapters.filter(c => c.latitude && c.longitude).map(ch => ({
            type: 'Feature' as const,
            geometry: { type: 'Point' as const, coordinates: [ch.longitude, ch.latitude] },
            properties: {
              id: ch.chapter_id, name: ch.chapter_name, venue: ch.venue_name,
              schedule: ch.meeting_schedule, members: ch.total_members,
              city: ch.city, region: ch.region_name,
            }
          }))
        };

        map.addSource('chapters', { type: 'geojson', data: geojson, cluster: true, clusterMaxZoom: 12, clusterRadius: 50 });

        // Cluster circles
        map.addLayer({
          id: 'clusters', type: 'circle', source: 'chapters', filter: ['has', 'point_count'],
          paint: {
            'circle-color': ['step', ['get', 'point_count'], '#10b981', 10, '#3b82f6', 30, '#8b5cf6'],
            'circle-radius': ['step', ['get', 'point_count'], 18, 10, 24, 30, 32],
            'circle-opacity': 0.85,
            'circle-stroke-width': 2,
            'circle-stroke-color': 'rgba(255,255,255,0.1)',
          }
        });

        map.addLayer({
          id: 'cluster-count', type: 'symbol', source: 'chapters', filter: ['has', 'point_count'],
          layout: { 'text-field': '{point_count_abbreviated}', 'text-size': 13 },
          paint: { 'text-color': '#ffffff' }
        });

        // Individual pins
        map.addLayer({
          id: 'unclustered-point', type: 'circle', source: 'chapters', filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-color': '#10b981', 'circle-radius': 7,
            'circle-stroke-width': 2, 'circle-stroke-color': '#ffffff',
          }
        });

        // Click cluster to zoom
        map.on('click', 'clusters', (e) => {
          const features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] });
          const clusterId = features[0]?.properties?.cluster_id;
          if (clusterId) {
            (map.getSource('chapters') as any).getClusterExpansionZoom(clusterId, (err: any, zoom: number) => {
              if (!err) map.easeTo({ center: (features[0].geometry as any).coordinates, zoom });
            });
          }
        });

        // Click pin to show popup
        map.on('click', 'unclustered-point', (e) => {
          const f = e.features?.[0];
          if (f) {
            const coords = (f.geometry as any).coordinates.slice();
            const p = f.properties!;
            new mapboxgl.Popup({ offset: 15 })
              .setLngLat(coords)
              .setHTML(`
                <div class="popup-name">${p.name}</div>
                <div class="popup-venue">📍 ${p.venue || p.city}</div>
                <div class="popup-schedule">🕐 ${p.schedule || 'Schedule TBD'}</div>
                <div class="popup-members">👥 ${p.members} members</div>
                <a href="/chapters/${p.id}" class="btn btn-primary btn-sm popup-btn">View Chapter</a>
              `)
              .addTo(map);
          }
        });

        map.on('mouseenter', 'clusters', () => { map.getCanvas().style.cursor = 'pointer'; });
        map.on('mouseleave', 'clusters', () => { map.getCanvas().style.cursor = ''; });
        map.on('mouseenter', 'unclustered-point', () => { map.getCanvas().style.cursor = 'pointer'; });
        map.on('mouseleave', 'unclustered-point', () => { map.getCanvas().style.cursor = ''; });
      });

      setMapReady(true);
    };

    loadMap().catch(console.error);
  }, [chapters, mapReady]);

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Sidebar Panel */}
      <div style={{ width: 380, flexShrink: 0, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
        <div style={{ padding: 16, borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>🗺️ Map Explorer</h2>
          <div className="search-bar" style={{ marginBottom: 12 }}>
            <Search size={16} />
            <input placeholder="Search chapters..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchData()} />
          </div>
          <div className="chip-row">
            {['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(d => (
              <span key={d} className={`chip ${dayFilter === d ? 'active' : ''}`} onClick={() => setDayFilter(d)}>
                {d || 'All Days'}
              </span>
            ))}
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
          {loading ? (
            <div className="loading"><div className="spinner" /> Loading...</div>
          ) : (
            <>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, padding: '0 4px' }}>
                {chapters.length} chapters
              </div>
              {chapters.slice(0, 100).map(ch => (
                <Link key={ch.chapter_id} href={`/chapters/${ch.chapter_id}`} className="chapter-card" style={{ textDecoration: 'none', marginBottom: 8, display: 'block' }}>
                  <div className="chapter-card-name">{ch.chapter_name}</div>
                  <div className="chapter-card-venue"><MapPin size={12} /> {ch.venue_name || ch.city}</div>
                  <div className="chapter-card-schedule"><Clock size={12} /> {ch.meeting_schedule || 'TBD'}</div>
                  <div className="chapter-card-footer">
                    <span className="chapter-card-members"><Users size={12} /> {ch.total_members}</span>
                    <span className="badge">{ch.region_name}</span>
                  </div>
                </Link>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Map */}
      <div style={{ flex: 1, position: 'relative' }}>
        <div id="map" style={{ width: '100%', height: '100%' }} />
        {!mapReady && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
            <div className="loading"><div className="spinner" /> Loading map...</div>
          </div>
        )}
      </div>
    </div>
  );
}
