'use client';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Building2, Users, ChevronLeft, ChevronRight, MapPin, Calendar, Clock, ArrowRight } from 'lucide-react';

interface Chapter {
  chapter_id: number; chapter_name: string; venue_name: string; city: string;
  meeting_schedule: string; total_members: number; region_name: string; meeting_day: string;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.05, duration: 0.4 }
  })
};

function ChaptersContent() {
  const [allChapters, setAllChapters] = useState<Chapter[]>([]);
  const [search, setSearch] = useState('');
  const [day, setDay] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const limit = 30; // Reduced limit for better performance with animations

  useEffect(() => {
    fetch('/data/chapters.json').then(r => r.json()).then(d => { 
      setAllChapters(d); 
      setLoading(false); 
    });
  }, []);

  const filtered = allChapters.filter(ch => {
    if (search && !`${ch.chapter_name} ${ch.venue_name} ${ch.city} ${ch.region_name}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (day && ch.meeting_day !== day) return false;
    return true;
  });
  const total = filtered.length;
  const chapters = filtered.slice(page * limit, (page + 1) * limit);
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: 32 }}>
        <h1 className="page-title" style={{ fontSize: 32, fontWeight: 800 }}>🏢 Chapter Directory</h1>
        <p className="page-subtitle" style={{ fontSize: 14 }}>Find and visit {total.toLocaleString()} BNI chapters across India</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 32 }}>
        <div className="search-bar" style={{ flex: 1, padding: '12px 18px' }}>
          <Search size={18} />
          <input 
            placeholder="Search chapters by name, city, or region..." 
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }} 
            style={{ fontSize: 15 }}
          />
        </div>

        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, paddingLeft: 4 }}>
            Meeting Day
          </div>
          <div className="chip-row">
            <span className={`chip ${!day ? 'active' : ''}`} onClick={() => { setDay(''); setPage(0); }}>All Days</span>
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(d => (
              <span key={d} className={`chip ${day === d ? 'active' : ''}`} onClick={() => { setDay(d); setPage(0); }}>
                {d}
              </span>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading" style={{ height: 300 }}>
          <div className="spinner" /> 
          <span style={{ fontWeight: 500 }}>Loading chapters...</span>
        </div>
      ) : (
        <>
          <div className="grid-3" style={{ gap: 20 }}>
            <AnimatePresence mode="popLayout">
              {chapters.map((ch, i) => (
                <motion.div
                  key={ch.chapter_id}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0, scale: 0.95 }}
                  custom={i}
                  layout
                >
                  <Link href={`/chapters/${ch.chapter_id}/`} className="chapter-card" style={{ textDecoration: 'none', height: '100%', display: 'flex', flexDirection: 'column', padding: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div className="chapter-card-name" style={{ fontSize: 17, marginBottom: 0 }}>{ch.chapter_name}</div>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, var(--bg-glass-2), var(--bg-glass))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Building2 size={18} style={{ color: 'var(--accent-blue)' }} />
                      </div>
                    </div>
                    
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                      <div className="chapter-card-venue" style={{ fontSize: 13 }}>
                        <MapPin size={14} style={{ color: 'var(--text-muted)' }} /> 
                        {ch.venue_name || ch.city || '—'}
                      </div>
                      <div className="chapter-card-schedule" style={{ fontSize: 12 }}>
                        <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                        {ch.meeting_day || '—'}
                        <Clock size={14} style={{ color: 'var(--text-muted)', marginLeft: 8 }} />
                        {ch.meeting_schedule?.split('at')?.[1] || '—'}
                      </div>
                    </div>

                    <div className="chapter-card-footer" style={{ borderTop: '1px solid var(--border)', paddingTop: 14, marginTop: 'auto' }}>
                      <span className="chapter-card-members" style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
                        <Users size={14} /> 
                        {ch.total_members} members
                      </span>
                      <span className="badge" style={{ marginLeft: 'auto', fontSize: 10, padding: '2px 8px' }}>
                        {ch.region_name}
                      </span>
                    </div>
                    
                    <div style={{ position: 'absolute', right: 20, bottom: 20, opacity: 0, transform: 'translateX(-10px)', transition: 'all 0.3s ease' }} className="chapter-card-arrow">
                      <ArrowRight size={18} style={{ color: 'var(--accent-blue)' }} />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {total === 0 && (
            <div className="empty-state" style={{ padding: '80px 0' }}>
              <Building2 size={48} style={{ marginBottom: 16, opacity: 0.1 }} />
              <h3>No chapters match your criteria</h3>
              <p>Try clearing your filters or search term</p>
            </div>
          )}

          <div className="pagination" style={{ marginTop: 40 }}>
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

      <style jsx global>{`
        .chapter-card:hover .chapter-card-arrow {
          opacity: 1;
          transform: translateX(0);
        }
      `}</style>
    </div>
  );
}

export default function ChaptersPage() {
  return <Suspense fallback={<div className="loading"><div className="spinner" /> Loading chapters...</div>}><ChaptersContent /></Suspense>;
}
