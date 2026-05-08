'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Globe, Users, Building2, ChevronRight, Map } from 'lucide-react';

interface CountryStats {
  country: string;
  count: number;
  regions: number;
  chapters: number;
}

export default function CountriesPage() {
  const [stats, setStats] = useState<CountryStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Generate stats from chunked members data
    (async () => {
      const { loadAllMembers } = await import('@/lib/loadMembers');
      const members = await loadAllMembers();
        const countries: Record<string, any> = {};
        members.forEach((m: any) => {
          const c = m.country || 'IN';
          if (!countries[c]) countries[c] = { country: c, count: 0, regions: new Set(), chapters: new Set() };
          countries[c].count++;
          if (m.region_name) countries[c].regions.add(m.region_name);
          if (m.chapter_name) countries[c].chapters.add(m.chapter_name);
        });
        
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
        
        const result = Object.values(countries).map(c => ({
          country: COUNTRY_NAMES[c.country] || c.country,
          code: c.country,
          count: c.count,
          regions: c.regions.size,
          chapters: c.chapters.size
        })).sort((a, b) => b.count - a.count);
        
        setStats(result);
        setLoading(false);
    })();
  }, []);

  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: 40 }}>
        <h1 className="page-title" style={{ fontSize: 36, fontWeight: 800 }}>🌍 Global Network</h1>
        <p className="page-subtitle">Explore BNI members and chapters across 83 countries</p>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" /> Analyzing global network...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
          {stats.map((s, i) => (
            <motion.div
              key={s.country}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Link href={`/countries/detail?country=${encodeURIComponent(s.country)}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="card hover-card" style={{ padding: 24, cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: -20, right: -20, opacity: 0.05 }}>
                    <Globe size={120} />
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                      <Globe size={24} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{s.country}</h3>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.count.toLocaleString()} Active Members</div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: 8 }}>
                      <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>Regions</div>
                      <div style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Map size={14} style={{ color: 'var(--accent-blue)' }} /> {s.regions}
                      </div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: 8 }}>
                      <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>Chapters</div>
                      <div style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Building2 size={14} style={{ color: 'var(--accent-blue)' }} /> {s.chapters}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, color: 'var(--accent-blue)' }}>
                    <span>Explore Country</span>
                    <ChevronRight size={16} />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
          
          {/* Placeholder for countries not yet scraped */}
          <div className="card" style={{ padding: 24, border: '1px dashed var(--border)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
            <div style={{ textAlign: 'center' }}>
              <Globe size={32} style={{ marginBottom: 12, margin: '0 auto' }} />
              <div style={{ fontSize: 14, fontWeight: 600 }}>81+ More Countries</div>
              <div style={{ fontSize: 11 }}>Scrape in progress...</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
