'use client';
import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, Building2, MapPin, Users, Search, Map } from 'lucide-react';

interface Chapter {
  name: string;
  count: number;
  region: string;
}

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function CountryDetailContent() {
  const searchParams = useSearchParams();
  const countryParam = searchParams.get('country') || 'India';
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [regions, setRegions] = useState<{name: string, count: number}[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { loadAllMembers } = await import('@/lib/loadMembers');
      const members = await loadAllMembers();
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
        
        // Reverse map to get code from name
        const nameToCode: Record<string, string> = {};
        for (const [code, name] of Object.entries(COUNTRY_NAMES)) {
          nameToCode[name] = code;
        }
        
        const targetCode = nameToCode[countryParam] || countryParam;
        
        const chapMap: Record<string, any> = {};
        const regMap: Record<string, number> = {};
        
        members.forEach((m: any) => {
          if (m.country === targetCode || m.country_code === targetCode) {
            if (m.chapter_name) {
              if (!chapMap[m.chapter_name]) chapMap[m.chapter_name] = { name: m.chapter_name, count: 0, region: m.region_name };
              chapMap[m.chapter_name].count++;
            }
            if (m.region_name) {
              regMap[m.region_name] = (regMap[m.region_name] || 0) + 1;
            }
          }
        });
        
        setChapters(Object.values(chapMap).sort((a, b) => b.count - a.count));
        setRegions(Object.entries(regMap).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count));
        setLoading(false);
    })();
  }, [countryParam]);

  const filteredChapters = chapters.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    (c.region && c.region.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="page-container">
      <Link href="/countries" className="back-link" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', textDecoration: 'none', marginBottom: 24, fontSize: 13 }}>
        <ChevronLeft size={16} /> Back to Countries
      </Link>

      <div className="page-header" style={{ marginBottom: 32 }}>
        <h1 className="page-title" style={{ fontSize: 32, fontWeight: 800 }}>📍 {countryParam} Explorer</h1>
        <p className="page-subtitle">{chapters.length} Chapters · {regions.length} Regions</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 32 }}>
        <div>
          <div className="search-bar" style={{ marginBottom: 24 }}>
            <Search size={18} />
            <input 
              placeholder="Search chapters or regions..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
            {filteredChapters.map((c, i) => (
              <motion.div key={c.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.01 }}>
                <Link href={`/members?chapter=${encodeURIComponent(c.name)}`} style={{ textDecoration: 'none' }}>
                  <div className="card hover-card" style={{ padding: 16 }}>
                    <div style={{ fontWeight: 700, marginBottom: 4, color: 'var(--text-primary)' }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={10} /> {c.region || 'Regional Chapter'}
                    </div>
                    <div style={{ marginTop: 12, fontSize: 12, fontWeight: 600, color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Users size={12} /> {c.count} Members
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Map size={16} /> Regions
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {regions.map(r => (
                <div key={r.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{r.name}</span>
                  <span className="badge" style={{ fontSize: 10 }}>{r.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CountryDetailPage() {
  return (
    <Suspense fallback={<div className="page-container"><div className="loading">Loading country details...</div></div>}>
      <CountryDetailContent />
    </Suspense>
  );
}
