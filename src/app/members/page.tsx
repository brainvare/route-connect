'use client';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { Search, Users, ChevronLeft, ChevronRight } from 'lucide-react';

interface Member {
  member_id: number; full_name: string; profession: string; profession_category: string;
  company_name: string; city: string; chapter_id: number; chapter_name: string; region_name: string;
}

function MembersContent() {
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [categories, setCategories] = useState<{ profession_category: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [profession, setProfession] = useState('');
  const limit = 50;

  useEffect(() => {
    fetch('/data/members.json').then(r => r.json()).then(d => {
      setAllMembers(d.members);
      setCategories(d.categories || []);
      setLoading(false);
    });
  }, []);

  const filtered = allMembers.filter(m => {
    if (search && !`${m.full_name} ${m.company_name} ${m.profession_category}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (profession && m.profession_category !== profession) return false;
    return true;
  });
  const total = filtered.length;
  const members = filtered.slice(page * limit, (page + 1) * limit);
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">👥 Member Search</h1>
        <p className="page-subtitle">{total.toLocaleString()} members</p>
      </div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <div className="search-bar" style={{ flex: 1 }}>
          <Search size={16} />
          <input placeholder="Search by name, company, or profession..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }} />
        </div>
      </div>
      <div className="chip-row" style={{ marginBottom: 24 }}>
        <span className={`chip ${!profession ? 'active' : ''}`} onClick={() => { setProfession(''); setPage(0); }}>All</span>
        {categories.slice(0, 12).map(c => (
          <span key={c.profession_category} className={`chip ${profession === c.profession_category ? 'active' : ''}`}
            onClick={() => { setProfession(c.profession_category); setPage(0); }}>
            {c.profession_category}
          </span>
        ))}
      </div>
      {loading ? <div className="loading"><div className="spinner" /> Loading...</div> : (
        <>
          <div className="card" style={{ padding: 0 }}>
            <div className="table-container">
              <table>
                <thead><tr><th>Name</th><th>Profession</th><th>Company</th><th>City</th><th>Chapter</th></tr></thead>
                <tbody>
                  {members.map(m => (
                    <tr key={m.member_id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{m.full_name}</td>
                      <td><span className="badge">{m.profession_category || '—'}</span></td>
                      <td>{m.company_name || '—'}</td>
                      <td>{m.city || '—'}</td>
                      <td>{m.chapter_id ? <Link href={`/chapters/${m.chapter_id}/`} style={{ color: 'var(--accent-blue)', textDecoration: 'none' }}>{m.chapter_name || m.chapter_id}</Link> : '—'}</td>
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
