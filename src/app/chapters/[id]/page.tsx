'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Users, Clock, Building2, ArrowLeft, Briefcase, Globe } from 'lucide-react';

interface ChapterDetail {
  chapter: {
    chapter_id: number; chapter_name: string; venue_name: string; address: string;
    city: string; state: string; latitude: number; longitude: number;
    meeting_day: string; meeting_time: string; meeting_schedule: string;
    total_members: number; region_name: string; domain: string;
  };
  members: { member_id: number; full_name: string; profession: string; profession_category: string; company_name: string; city: string }[];
  professionBreakdown: { profession_category: string; count: number }[];
}

export default function ChapterDetailPage() {
  const params = useParams();
  const [data, setData] = useState<ChapterDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    fetch(`/api/chapters/${params.id}`).then(r => r.json()).then(d => { setData(d); setLoading(false); });
  }, [params.id]);

  useEffect(() => {
    if (!data?.chapter?.latitude || mapLoaded) return;
    const init = async () => {
      const mapboxgl = (await import('mapbox-gl')).default;
      await import('mapbox-gl/dist/mapbox-gl.css');
      mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';
      const map = new mapboxgl.Map({
        container: 'chapter-map',
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [data.chapter.longitude, data.chapter.latitude],
        zoom: 13,
      });
      new mapboxgl.Marker({ color: '#10b981' })
        .setLngLat([data.chapter.longitude, data.chapter.latitude])
        .addTo(map);
      setMapLoaded(true);
    };
    init().catch(console.error);
  }, [data, mapLoaded]);

  if (loading) return <div className="loading" style={{ height: '100vh' }}><div className="spinner" /> Loading...</div>;
  if (!data?.chapter) return <div className="page-container"><h1>Chapter not found</h1></div>;

  const { chapter, members, professionBreakdown } = data;
  const maxProf = professionBreakdown[0]?.count || 1;

  return (
    <div className="page-container">
      <Link href="/map" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
        <ArrowLeft size={14} /> Back to Map
      </Link>

      <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
        {/* Left: Info */}
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>{chapter.chapter_name}</h1>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            <span className="badge">{chapter.region_name}</span>
            {chapter.meeting_day && <span className="badge green"><Clock size={12} /> {chapter.meeting_day}</span>}
            <span className="badge amber"><Users size={12} /> {chapter.total_members} members</span>
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Venue</div>
                <div style={{ fontSize: 14, color: 'var(--text-primary)' }}>{chapter.venue_name || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Meeting Schedule</div>
                <div style={{ fontSize: 14, color: 'var(--text-primary)' }}>{chapter.meeting_schedule || '—'}</div>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Address</div>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{chapter.address || '—'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Mini Map */}
        <div style={{ width: 360 }}>
          <div id="chapter-map" style={{ width: '100%', height: 220, borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--border)' }} />
        </div>
      </div>

      {/* Profession Breakdown */}
      {professionBreakdown.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>📊 Profession Breakdown</h2>
          <div style={{ display: 'grid', gap: 8 }}>
            {professionBreakdown.slice(0, 12).map(p => (
              <div key={p.profession_category} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ width: 140, fontSize: 13, color: 'var(--text-secondary)', flexShrink: 0 }}>{p.profession_category}</span>
                <div style={{ flex: 1, height: 8, background: 'var(--bg-glass)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(p.count / maxProf) * 100}%`, background: 'linear-gradient(90deg, var(--accent-blue), var(--accent-purple))', borderRadius: 4 }} />
                </div>
                <span style={{ width: 30, fontSize: 12, color: 'var(--text-muted)', textAlign: 'right' }}>{p.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Members Table */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>👥 Members ({members.length})</h2>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr><th>Name</th><th>Profession</th><th>Company</th><th>City</th></tr>
            </thead>
            <tbody>
              {members.map(m => (
                <tr key={m.member_id}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{m.full_name}</td>
                  <td><span className="badge">{m.profession_category || '—'}</span></td>
                  <td>{m.company_name || '—'}</td>
                  <td>{m.city || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
