'use client';
import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Users, Calendar, Building2 } from 'lucide-react';

export default function ChapterDetail({ paramsPromise }: { paramsPromise: Promise<{ id: string }> }) {
  const { id } = use(paramsPromise);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/data/chapters/${id}.json`).then(r => {
      if (!r.ok) throw new Error('Not found');
      return r.json();
    }).then(setData).catch(() => setData(null)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loading" style={{ height: '100vh' }}><div className="spinner" /> Loading...</div>;
  if (!data) return <div className="page-container"><div className="empty-state"><h3>Chapter not found</h3></div></div>;

  const { chapter, members, professions } = data;
  const maxProf = professions[0]?.count || 1;

  return (
    <div className="page-container">
      <Link href="/chapters/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 13, textDecoration: 'none', marginBottom: 16 }}>
        <ArrowLeft size={14} /> Back to Chapters
      </Link>
      <div className="page-header">
        <h1 className="page-title">{chapter.chapter_name}</h1>
        <p className="page-subtitle">{chapter.region_name}</p>
      </div>
      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="section-title"><Building2 size={16} style={{ color: 'var(--accent-blue)' }} /> Chapter Info</div>
          {chapter.venue_name && <p style={{ fontSize: 14, marginBottom: 8 }}>📍 {chapter.venue_name}</p>}
          {chapter.address && <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>{chapter.address}</p>}
          {chapter.city && <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>{chapter.city}, {chapter.state}</p>}
          {chapter.meeting_schedule && <p style={{ fontSize: 13, marginBottom: 4 }}><Calendar size={13} style={{ verticalAlign: -2 }} /> {chapter.meeting_schedule}</p>}
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <span className="badge green"><Users size={12} /> {chapter.total_members} members</span>
            {chapter.meeting_day && <span className="badge">{chapter.meeting_day}</span>}
          </div>
        </div>
        <div className="card">
          <div className="section-title">📊 Profession Breakdown</div>
          {professions.slice(0, 10).map((p: any) => (
            <div key={p.profession_category} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ width: 110, fontSize: 12, color: 'var(--text-secondary)', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.profession_category}</span>
              <div style={{ flex: 1, height: 6, background: 'var(--bg-glass)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(p.count / maxProf) * 100}%`, background: 'linear-gradient(90deg, var(--accent-blue), var(--accent-green))', borderRadius: 3 }} />
              </div>
              <span style={{ width: 30, fontSize: 11, color: 'var(--text-muted)', textAlign: 'right' }}>{p.count}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
          <div className="section-title" style={{ marginBottom: 0 }}>👥 Members ({members.length})</div>
        </div>
        <div className="table-container">
          <table>
            <thead><tr><th>Name</th><th>Profession</th><th>Company</th><th>City</th></tr></thead>
            <tbody>
              {members.map((m: any) => (
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
