'use client';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Users, ChevronLeft, ChevronRight, Building2, MapPin, Briefcase, Phone, Globe, Mail } from 'lucide-react';

interface Member {
  member_id: number;
  full_name: string;
  profession: string;
  profession_category: string;
  company_name: string;
  city: string;
  chapter_id: number;
  chapter_name: string;
  region_name: string;
  phone?: string;
  mobile?: string;
  direct_phone?: string;
  email?: string;
  website?: string;
  street_address?: string;
  country?: string;
  state?: string;
}

const tableRowVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: (i: number) => ({
    opacity: 1, x: 0,
    transition: { delay: i * 0.03, duration: 0.3 }
  })
};

import { useSearchParams } from 'next/navigation';

function MembersContent() {
  const searchParams = useSearchParams();
  const countryParam = searchParams.get('country');
  const chapterParam = searchParams.get('chapter');
  
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [categories, setCategories] = useState<{ profession_category: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [profession, setProfession] = useState('');
  const limit = 50;

  useEffect(() => {
    async function loadMembers() {
      const idx = await fetch('/data/members/index.json').then(r => r.json());
      const chunks = await Promise.all(
        idx.files.map((f: string) => fetch(`/data/members/${f}`).then(r => r.json()))
      );
      const all = chunks.flat();
      // Build category counts
      const catMap: Record<string, number> = {};
      all.forEach((m: Member) => {
        const cat = m.profession_category || 'Other';
        catMap[cat] = (catMap[cat] || 0) + 1;
      });
      const cats = Object.entries(catMap)
        .map(([profession_category, count]) => ({ profession_category, count }))
        .sort((a, b) => b.count - a.count);
      setAllMembers(all);
      setCategories(cats);
      setLoading(false);
    }
    loadMembers();
  }, []);

  const filtered = allMembers.filter(m => {
    let targetCode = countryParam;
    if (countryParam) {
      const COUNTRY_NAMES: Record<string, string> = {
        "IN": "India", "GB": "United Kingdom", "US": "United States", "AU": "Australia",
        "CA": "Canada", "DE": "Germany", "FR": "France", "IT": "Italy", "ES": "Spain",
        "MX": "Mexico", "BR": "Brazil", "ZA": "South Africa", "NL": "Netherlands",
        "IE": "Ireland", "NZ": "New Zealand", "SG": "Singapore", "MY": "Malaysia",
        "HK": "Hong Kong", "PH": "Philippines", "TH": "Thailand", "VN": "Vietnam",
        "JP": "Japan", "KR": "South Korea", "CN": "China", "TW": "Taiwan",
        "AR": "Argentina", "CL": "Chile", "CO": "Colombia", "PE": "Peru",
        "PT": "Portugal", "PL": "Poland", "HU": "Hungary", "CZ": "Czech Republic",
        "RO": "Romania", "GR": "Greece", "TR": "Turkey", "IL": "Israel",
        "AE": "United Arab Emirates", "SP": "Spain", "HO": "Hong Kong", "TA": "Taiwan",
        "SW": "Sweden", "FI": "Finland", "NO": "Norway", "BE": "Belgium"
      };
      for (const [code, name] of Object.entries(COUNTRY_NAMES)) {
        if (name === countryParam) { targetCode = code; break; }
      }
    }
    
    if (countryParam && m.country !== targetCode) return false;
    if (chapterParam && m.chapter_name !== chapterParam) return false;
    if (search && !`${m.full_name} ${m.company_name} ${m.profession_category}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (profession && m.profession_category !== profession) return false;
    return true;
  });
  const total = filtered.length;
  const members = filtered.slice(page * limit, (page + 1) * limit);
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: 32 }}>
        <h1 className="page-title" style={{ fontSize: 32, fontWeight: 800 }}>👥 Member Search</h1>
        <p className="page-subtitle" style={{ fontSize: 14 }}>Explore {total.toLocaleString()} members across the BNI India network</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 32 }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <div className="search-bar" style={{ flex: 1, padding: '12px 18px' }}>
            <Search size={18} />
            <input 
              placeholder="Search by name, company, or profession..." 
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }} 
              style={{ fontSize: 15 }}
            />
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, paddingLeft: 4 }}>
            Filter by Profession
          </div>
          <div className="chip-row">
            <span className={`chip ${!profession ? 'active' : ''}`} onClick={() => { setProfession(''); setPage(0); }}>All Categories</span>
            {categories.slice(0, 15).map(c => (
              <span key={c.profession_category} className={`chip ${profession === c.profession_category ? 'active' : ''}`}
                onClick={() => { setProfession(c.profession_category); setPage(0); }}>
                {c.profession_category}
              </span>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading" style={{ height: 300 }}>
          <div className="spinner" /> 
          <span style={{ fontWeight: 500 }}>Fetching members...</span>
        </div>
      ) : (
        <>
          <motion.div 
            className="card" 
            style={{ padding: 0, overflow: 'hidden' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Member Name</th>
                    <th>Profession</th>
                    <th>Company</th>
                    <th>Location</th>
                    <th>Contact</th>
                    <th>Chapter</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence mode="popLayout">
                    {members.map((m, i) => (
                      <motion.tr 
                        key={m.member_id}
                        variants={tableRowVariants}
                        initial="hidden"
                        animate="visible"
                        custom={i}
                      >
                        <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                          <Link href={`/members/detail?id=${m.member_id}`} className="member-name-link" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'inherit' }}>
                            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, var(--bg-glass-2), var(--bg-glass))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
                              {m.full_name.charAt(0)}
                            </div>
                            <span>{m.full_name}</span>
                          </Link>
                        </td>
                        <td>
                          <span className="badge" style={{ padding: '4px 10px', fontSize: 11 }}>
                            <Briefcase size={10} style={{ marginRight: 4 }} />
                            {m.profession_category || '—'}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{m.company_name || '—'}</div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
                              <MapPin size={12} style={{ color: 'var(--text-muted)' }} />
                              {m.city || '—'}
                            </div>
                            {m.street_address && <div className="address-text" style={{ fontSize: 11 }}>{m.street_address}</div>}
                          </div>
                        </td>
                        <td>
                          <div className="contact-grid">
                            {(m.phone || m.mobile || m.direct_phone) && (
                              <div className="tooltip-container">
                                <div className="contact-icon phone"><Phone size={13} /></div>
                                <div className="tooltip-content">{m.phone || m.mobile || m.direct_phone}</div>
                              </div>
                            )}
                            {m.website && (
                              <a href={m.website} target="_blank" className="tooltip-container">
                                <div className="contact-icon website"><Globe size={13} /></div>
                                <div className="tooltip-content">Visit Website</div>
                              </a>
                            )}
                            {m.email && (
                              <div className="tooltip-container">
                                <div className="contact-icon email"><Mail size={13} /></div>
                                <div className="tooltip-content">{m.email}</div>
                              </div>
                            )}
                            {!(m.phone || m.mobile || m.direct_phone || m.email || m.website) && <span style={{ color: 'var(--text-muted)' }}>—</span>}
                          </div>
                        </td>
                        <td>
                          {m.chapter_id ? (
                            <Link href={`/chapters/detail?id=${m.chapter_id}`} style={{ color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                              <Building2 size={13} />
                              {m.chapter_name || m.chapter_id}
                            </Link>
                          ) : '—'}
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
            {total === 0 && (
              <div className="empty-state" style={{ padding: '80px 0' }}>
                <Users size={48} style={{ marginBottom: 16, opacity: 0.1 }} />
                <h3>No members found</h3>
                <p>Try adjusting your search or filters</p>
              </div>
            )}
          </motion.div>

          <div className="pagination" style={{ marginTop: 32 }}>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => { setPage(p => Math.max(0, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
              disabled={page === 0}
            >
              <ChevronLeft size={16} /> Previous
            </button>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', background: 'var(--bg-glass)', padding: '6px 16px', borderRadius: 20 }}>
              Page <span style={{ color: 'var(--text-primary)' }}>{page + 1}</span> of {totalPages}
            </div>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => { setPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
              disabled={page >= totalPages - 1}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function MembersPage() {
  return <Suspense fallback={<div className="loading"><div className="spinner" /> Loading members...</div>}><MembersContent /></Suspense>;
}
