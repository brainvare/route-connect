'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, Users, Globe, MapPin, TrendingUp, BarChart3, Briefcase, Calendar, Award, ChevronRight } from 'lucide-react';

interface Stats {
  totals: { chapters: number; members: number; regions: number; cities: number };
  topRegions: { region_name: string; total_chapters: number; total_members: number }[];
  topProfessions: { profession_category: string; count: number }[];
  meetingDays: { meeting_day: string; count: number }[];
  stateDistribution: { state: string; count: number }[];
  topChapters: { chapter_id: number; chapter_name: string; total_members: number; city: string }[];
}

const BAR_COLORS = ['blue', 'green', 'amber', 'purple', 'rose', 'cyan'] as const;

function AdminStatCard({ label, value, icon: Icon, color, index }: { label: string; value: string | number; icon: any; color: string; index: number }) {
  return (
    <motion.div 
      className="stat-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
    >
      <div className={`stat-icon ${color}`}><Icon size={22} /></div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </motion.div>
  );
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch('/data/stats.json').then(r => r.json()).then(setStats);
  }, []);

  if (!stats) return (
    <div className="loading" style={{ height: '100vh', flexDirection: 'column', gap: 16 }}>
      <div className="spinner" style={{ width: 40, height: 40 }} />
      <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Initializing dashboard...</span>
    </div>
  );

  const maxRegion = stats.topRegions[0]?.total_members || 1;
  const maxProf = stats.topProfessions[0]?.count || 1;

  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: 40 }}>
        <h1 className="page-title" style={{ fontSize: 36, fontWeight: 900 }}>📊 Admin Dashboard</h1>
        <p className="page-subtitle" style={{ fontSize: 16 }}>BNI India High-Level Network Performance</p>
      </div>

      {/* Primary Stats */}
      <div className="stat-grid" style={{ marginBottom: 32 }}>
        <AdminStatCard index={0} label="Total Chapters" value={stats.totals.chapters.toLocaleString()} icon={Building2} color="green" />
        <AdminStatCard index={1} label="Total Members" value={stats.totals.members.toLocaleString()} icon={Users} color="blue" />
        <AdminStatCard index={2} label="Active Regions" value={stats.totals.regions} icon={Globe} color="purple" />
        <AdminStatCard index={3} label="Cities Covered" value={stats.totals.cities.toLocaleString()} icon={MapPin} color="amber" />
      </div>

      <div className="grid-2" style={{ marginBottom: 32, gap: 24 }}>
        {/* Top Regions Chart */}
        <motion.div 
          className="card"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="section-title"><TrendingUp size={18} style={{ color: 'var(--accent-green)' }} /> Regional Leaders</h2>
          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {stats.topRegions.slice(0, 8).map((r, i) => (
              <div key={r.region_name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, fontWeight: 700 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{r.region_name}</span>
                  <span style={{ color: 'var(--text-primary)' }}>{r.total_members.toLocaleString()}</span>
                </div>
                <div className="bar-track" style={{ height: 6 }}>
                  <motion.div 
                    className={`bar-fill ${BAR_COLORS[i % BAR_COLORS.length]}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${(r.total_members / maxRegion) * 100}%` }}
                    transition={{ duration: 1, delay: i * 0.05 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Top Professions Chart */}
        <motion.div 
          className="card"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="section-title"><Briefcase size={18} style={{ color: 'var(--accent-purple)' }} /> Top Professions</h2>
          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {stats.topProfessions.slice(0, 8).map((p, i) => (
              <div key={p.profession_category}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, fontWeight: 700 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{p.profession_category}</span>
                  <span style={{ color: 'var(--text-primary)' }}>{p.count.toLocaleString()}</span>
                </div>
                <div className="bar-track" style={{ height: 6 }}>
                  <motion.div 
                    className={`bar-fill ${BAR_COLORS[(i + 2) % BAR_COLORS.length]}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${(p.count / maxProf) * 100}%` }}
                    transition={{ duration: 1, delay: i * 0.05 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="grid-2" style={{ marginBottom: 32, gap: 24 }}>
        {/* Meeting Days Bar Chart */}
        <motion.div 
          className="card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="section-title"><Calendar size={18} style={{ color: 'var(--accent-blue)' }} /> Schedule Intensity</h2>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, height: 160, paddingTop: 30 }}>
            {stats.meetingDays.map((d, i) => {
              const maxDay = stats.meetingDays[0]?.count || 1;
              const height = (d.count / maxDay) * 100;
              return (
                <div key={d.meeting_day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
                  <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--accent-blue)', marginBottom: 8 }}>{d.count}</div>
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ duration: 0.8, delay: i * 0.1 }}
                    style={{ background: 'linear-gradient(180deg, var(--accent-blue), rgba(59,130,246,0.1))', borderRadius: '4px 4px 0 0', width: '70%' }} 
                  />
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginTop: 10 }}>{d.meeting_day?.slice(0, 3)}</div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* State Tags */}
        <motion.div 
          className="card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h2 className="section-title"><Globe size={18} style={{ color: 'var(--accent-amber)' }} /> State Coverage</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 10 }}>
            {stats.stateDistribution.map((s, i) => (
              <motion.span 
                key={s.state} 
                className="chip"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.02 }}
                whileHover={{ scale: 1.05 }}
              >
                {s.state} <span style={{ opacity: 0.5, marginLeft: 8, fontWeight: 900 }}>{s.count}</span>
              </motion.span>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Top Chapters Table */}
      <motion.div 
        className="card" 
        style={{ padding: 0, overflow: 'hidden' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Award size={20} style={{ color: 'var(--accent-amber)' }} /> Network Hall of Fame
          </h2>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>TOP 10 CHAPTERS BY SIZE</span>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th style={{ width: 60 }}>Rank</th>
                <th>Chapter Name</th>
                <th>Location</th>
                <th style={{ textAlign: 'right' }}>Members</th>
                <th style={{ width: 60 }}></th>
              </tr>
            </thead>
            <tbody>
              {stats.topChapters.map((ch, i) => (
                <tr key={ch.chapter_id}>
                  <td style={{ fontWeight: 900, color: i < 3 ? 'var(--accent-amber)' : 'var(--text-muted)', fontSize: 16 }}>#{i + 1}</td>
                  <td style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{ch.chapter_name}</td>
                  <td><div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}><MapPin size={14} style={{ color: 'var(--text-muted)' }} /> {ch.city || '—'}</div></td>
                  <td style={{ textAlign: 'right' }}><span className="badge green" style={{ fontWeight: 900, padding: '4px 12px', fontSize: 13 }}>{ch.total_members}</span></td>
                  <td style={{ textAlign: 'right' }}><ChevronRight size={18} style={{ color: 'var(--text-muted)' }} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
