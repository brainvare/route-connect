'use client';
import { useEffect, useState, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { Search, Users, ChevronLeft, ChevronRight } from 'lucide-react';

interface Member {
  member_id: number; full_name: string; profession: string; profession_category: string;
  company_name: string; city: string; chapter_id: number; chapter_name: string; region_name: string;
}

function MembersContent() {
  const [members, setMembers] = useState<Member[]>([]);
  const [categories, setCategories] = useState<{ profession_category: string; count: number }[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [profession, setProfession] = useState('');
  const [city, setCity] = useState('');
  const limit = 50;

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: String(limit), offset: String(page * limit) });
    if (search) params.set('search', search);
    if (profession) params.set('profession', profession);
    if (city) params.set('city', city);
    const res = await fetch(`/api/members?${params}`);
    const data = await res.json();
    setMembers(data.members);
    setTotal(data.total);
    if (data.categories) setCategories(data.categories);
    setLoading(false);
  }, [search, profession, city, page]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">👥 Member Search</h1>
        <p className="page-subtitle">{total.toLocaleString()} members found</p>
      </div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <div className="search-bar" style={{ flex: 1 }}>
          <Search size={16} />
          <input placeholder="Search by name, company, or profession..." value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { setPage(0); fetchMembers(); } }} />
        </div>
        <input className="route-input" style={{ width: 180 }} placeholder="Filter by city..." value={city}
          onChange={e => setCity(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { setPage(0); fetchMembers(); } }} />
        <button className="btn btn-primary" onClick={() => { setPage(0); fetchMembers(); }}>
          <Search size={14} /> Search
        </button>
      </div>
      <div className="chip-row" style={{ marginBottom: 24 }}>
        <span className={`chip ${!profession ? 'active' : ''}`} onClick={() => { setProfession(''); setPage(0); }}>All</span>
        {categories.slice(0, 12).map(c => (
          <span key={c.profession_category} className={`chip ${profession === c.profession_category ? 'active' : ''}`}
            onClick={() => { setProfession(c.profession_category); setPage(0); }}>
            {c.profession_category} <span style={{ opacity: 0.5, marginLeft: 4 }}>{c.count.toLocaleString()}</span>
          </span>
        ))}
      </div>
      {loading ? (
        <div className="loading"><div className="spinner" /> Loading members...</div>
      ) : (
        <>
          <div className="card" style={{ padding: 0 }}>
            <div className="table-container">
              <table>
                <thead>
                  <tr><th>Name</th><th>Profession</th><th>Company</th><th>City</th><th>Chapter</th><th>Region</th></tr>
                </thead>
                <tbody>
                  {members.map(m => (
                    <tr key={m.member_id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{m.full_name}</td>
                      <td><span className="badge">{m.profession_category || '—'}</span></td>
                      <td>{m.company_name || '—'}</td>
                      <td>{m.city || '—'}</td>
                      <td>{m.chapter_id ? <Link href={`/chapters/${m.chapter_id}`} style={{ color: 'var(--accent-blue)', textDecoration: 'none' }}>{m.chapter_name || m.chapter_id}</Link> : '—'}</td>
                      <td>{m.region_name || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="pagination">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}><ChevronLeft size={14} /> Prev</button>
            <span>Page {page + 1} of {totalPages}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}>Next <ChevronRight size={14} /></button>
          </div>
        </>
      )}
    </div>
  );
}

export default function MembersPage() {
  return <Suspense fallback={<div className="loading"><div className="spinner" /> Loading...</div>}><MembersContent /></Suspense>;
}
