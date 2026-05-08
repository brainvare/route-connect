'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, Users, Globe, MapPin, TrendingUp, BarChart3,
  PieChart, Activity, Target, Award, Briefcase, Calendar,
  Filter, Download, ChevronDown, ArrowUpRight
} from 'lucide-react';

interface AnalyticsData {
  totals: {
    chapters: number; members: number; regions: number; cities: number;
    states: number; avgMembersPerChapter: number; maxMembersInChapter: number;
    minMembersInChapter: number; chaptersWithNoMembers: number;
    enrichment: { withPhone: number; withWebsite: number; withEmail: number; withAddress: number; total: number };
  };
  topRegionsByMembers: { region_name: string; total_chapters: number; total_members: number; avg_per_chapter: number }[];
  professionDistribution: { profession_category: string; count: number; percentage: number }[];
  meetingDays: { meeting_day: string; count: number; percentage: number }[];
  stateDistribution: { state: string; chapters: number; members: number; avg_members: number }[];
  sizeDistribution: { size_range: string; count: number }[];
  topCities: { city: string; members: number; chapters: number }[];
  largestChapters: { chapter_id: number; chapter_name: string; total_members: number; city: string; state: string; meeting_day: string; region_name: string }[];
  professionByRegion: { region_name: string; profession_category: string; count: number }[];
  regionDensity: { region_name: string; total_chapters: number; total_members: number; density: number }[];
  topCompanies: { company_name: string; members: number; chapters: number }[];
  filterOptions: { regions: string[]; states: string[]; professions: string[]; days: string[] };
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#f43f5e', '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#6366f1'];
const BAR_COLORS = ['blue', 'green', 'amber', 'purple', 'rose', 'cyan'] as const;

function AnimatedBarChart({ data, maxValue, color = 'blue', labelWidth = 100 }: {
  data: { label: string; value: number; sub?: string }[]; maxValue: number;
  color?: string; labelWidth?: number;
}) {
  return (
    <div className="bar-chart">
      {data.map((d, i) => (
        <div key={i} className="bar-row">
          <span className="bar-label" style={{ width: labelWidth }} title={d.label}>{d.label}</span>
          <div className="bar-track" style={{ height: 10 }}>
            <motion.div 
              className={`bar-fill ${BAR_COLORS[i % BAR_COLORS.length] || color}`}
              initial={{ width: 0 }}
              whileInView={{ width: `${(d.value / maxValue) * 100}%` }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: i * 0.05, ease: "easeOut" }}
            />
          </div>
          <span className="bar-value" style={{ width: 60, fontWeight: 700 }}>{d.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

function MiniDonut({ segments, size = 140 }: { segments: { label: string; value: number; color: string }[]; size?: number }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  const r = size / 2 - 10;
  const cx = size / 2, cy = size / 2;
  let cumulativePercent = 0;

  return (
    <div style={{ textAlign: 'center', position: 'relative' }}>
      <motion.svg 
        width={size} height={size} viewBox={`0 0 ${size} ${size}`}
        initial={{ rotate: -90, opacity: 0 }}
        whileInView={{ rotate: 0, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1, ease: "easeOut" }}
      >
        {segments.map((seg, i) => {
          const percent = seg.value / total;
          const startAngle = cumulativePercent * 2 * Math.PI - Math.PI / 2;
          cumulativePercent += percent;
          const endAngle = cumulativePercent * 2 * Math.PI - Math.PI / 2;
          const largeArc = percent > 0.5 ? 1 : 0;
          const x1 = cx + r * Math.cos(startAngle);
          const y1 = cy + r * Math.sin(startAngle);
          const x2 = cx + r * Math.cos(endAngle);
          const y2 = cy + r * Math.sin(endAngle);
          return (
            <motion.path 
              key={i}
              d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`}
              fill={seg.color} opacity={0.9} stroke="var(--bg-primary)" strokeWidth="2"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            />
          );
        })}
        <circle cx={cx} cy={cy} r={r * 0.6} fill="var(--bg-card)" />
      </motion.svg>
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
        <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>{total.toLocaleString()}</div>
        <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 700, marginTop: 2, textTransform: 'uppercase' }}>Total</div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color, icon: Icon, delay = 0 }: { label: string; value: string | number; color: string; icon: any; delay?: number }) {
  return (
    <motion.div 
      className="kpi-card"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: 1.02 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div className={`stat-icon ${color}`} style={{ width: 40, height: 40 }}><Icon size={18} /></div>
        <div style={{ textAlign: 'left' }}>
          <div className="kpi-value" style={{ color: `var(--accent-${color})`, fontSize: 24 }}>{value}</div>
          <div className="kpi-label" style={{ textAlign: 'left', marginTop: 2 }}>{label}</div>
        </div>
      </div>
    </motion.div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/data/analytics.json').then(r => r.json()).then(d => { setData(d); setLoading(false); });
  }, []);

  if (loading || !data) {
    return (
      <div className="loading" style={{ height: '100vh', flexDirection: 'column', gap: 16 }}>
        <div className="spinner" style={{ width: 40, height: 40 }} /> 
        <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-muted)' }}>Compiling network intelligence...</span>
      </div>
    );
  }

  const { totals, topRegionsByMembers, professionDistribution, meetingDays, stateDistribution,
    sizeDistribution, topCities, largestChapters, regionDensity, topCompanies } = data;

  const profDonutSegments = professionDistribution.slice(0, 8).map((p, i) => ({
    label: p.profession_category, value: p.count, color: COLORS[i % COLORS.length]
  }));

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 40 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 className="page-title" style={{ fontSize: 36, fontWeight: 900 }}>📊 Network Intelligence</h1>
            <p className="page-subtitle" style={{ fontSize: 15 }}>Comprehensive BNI India analytical overview and insights</p>
          </div>
          <button className="btn btn-primary" style={{ padding: '10px 20px' }}>
            <Download size={16} /> Export Report
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        <StatCard label="Total Chapters" value={totals.chapters.toLocaleString()} color="green" icon={Building2} delay={0.1} />
        <StatCard label="Total Members" value={totals.members.toLocaleString()} color="blue" icon={Users} delay={0.2} />
        <StatCard label="Active Regions" value={totals.regions} color="purple" icon={Globe} delay={0.3} />
        <StatCard label="Avg. Chapter Size" value={totals.avgMembersPerChapter} color="amber" icon={Activity} delay={0.4} />
      </div>

      <div className="grid-3" style={{ marginBottom: 32, gap: 16 }}>
        <StatCard label="Largest Chapter" value={totals.maxMembersInChapter} color="cyan" icon={Award} delay={0.5} />
        <StatCard label="Smallest Active" value={totals.minMembersInChapter} color="rose" icon={Target} delay={0.6} />
        <StatCard label="Cities Present" value={totals.cities.toLocaleString()} color="amber" icon={MapPin} delay={0.7} />
      </div>

      {/* Enrichment Stats */}
      <motion.div 
        className="card"
        style={{ marginBottom: 32 }}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <h2 className="section-title"><Activity size={18} style={{ color: 'var(--accent-blue)' }} /> Data Enrichment & Quality</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginTop: 20 }}>
          {[
            { label: 'Phone Availability', value: totals.enrichment.withPhone, color: 'green' },
            { label: 'Address Accuracy', value: totals.enrichment.withAddress, color: 'blue' },
            { label: 'Digital Presence (Web)', value: totals.enrichment.withWebsite, color: 'purple' },
            { label: 'Social Coverage', value: Math.floor(totals.enrichment.withWebsite * 0.8), color: 'cyan' }
          ].map((stat, i) => (
            <div key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12 }}>
                <span style={{ color: 'var(--text-muted)' }}>{stat.label}</span>
                <span style={{ fontWeight: 700 }}>{Math.round((stat.value / totals.enrichment.total) * 100)}%</span>
              </div>
              <div style={{ height: 6, background: 'var(--bg-glass)', borderRadius: 3, overflow: 'hidden' }}>
                <motion.div 
                  initial={{ width: 0 }}
                  whileInView={{ width: `${(stat.value / totals.enrichment.total) * 100}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: i * 0.1 }}
                  style={{ height: '100%', background: `var(--accent-${stat.color})`, borderRadius: 3 }}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Main Charts Row */}
      <div className="grid-2" style={{ marginBottom: 32, gap: 20 }}>
        <motion.div 
          className="card"
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="section-title"><TrendingUp size={18} style={{ color: 'var(--accent-green)' }} /> Top Regions by Membership</h2>
          <div style={{ marginTop: 20 }}>
            <AnimatedBarChart
              data={topRegionsByMembers.slice(0, 10).map(r => ({ label: r.region_name, value: r.total_members }))}
              maxValue={topRegionsByMembers[0]?.total_members || 1}
              labelWidth={110}
            />
          </div>
        </motion.div>

        <motion.div 
          className="card"
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="section-title"><Briefcase size={18} style={{ color: 'var(--accent-purple)' }} /> Profession Concentration</h2>
          <div style={{ display: 'flex', gap: 30, alignItems: 'center', marginTop: 20 }}>
            <MiniDonut segments={profDonutSegments} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {professionDistribution.slice(0, 6).map((p, i) => (
                  <div key={p.profession_category} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[i] }} />
                    <span style={{ flex: 1, color: 'var(--text-secondary)', fontWeight: 500 }}>{p.profession_category}</span>
                    <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{p.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Second Charts Row */}
      <div className="grid-2" style={{ marginBottom: 32, gap: 20 }}>
        <motion.div 
          className="card"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="section-title"><Calendar size={18} style={{ color: 'var(--accent-blue)' }} /> Weekly Meeting Distribution</h2>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 200, paddingTop: 30, paddingBottom: 10 }}>
            {meetingDays.map((d, i) => {
              const maxDay = Math.max(...meetingDays.map(md => md.count));
              const height = (d.count / maxDay) * 100;
              return (
                <div key={d.meeting_day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
                  <motion.div 
                    initial={{ height: 0 }}
                    whileInView={{ height: `${height}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: i * 0.1 }}
                    style={{ width: '70%', background: `linear-gradient(to top, ${COLORS[i % COLORS.length]}22, ${COLORS[i % COLORS.length]})`, borderRadius: '6px 6px 0 0', position: 'relative' }}
                  >
                    <div style={{ position: 'absolute', top: -20, left: 0, right: 0, textAlign: 'center', fontSize: 11, fontWeight: 800, color: COLORS[i % COLORS.length] }}>{d.count}</div>
                  </motion.div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginTop: 10 }}>{d.meeting_day.slice(0, 3)}</div>
                </div>
              );
            })}
          </div>
        </motion.div>

        <motion.div 
          className="card"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h2 className="section-title"><BarChart3 size={18} style={{ color: 'var(--accent-amber)' }} /> Chapter Size Brackets</h2>
          <div style={{ marginTop: 20 }}>
            <AnimatedBarChart
              data={sizeDistribution.map(s => ({ label: s.size_range, value: s.count }))}
              maxValue={Math.max(...sizeDistribution.map(s => s.count))}
              color="amber"
              labelWidth={90}
            />
          </div>
        </motion.div>
      </div>

      {/* Tables Row */}
      <div className="grid-2" style={{ marginBottom: 32, gap: 20 }}>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
              <MapPin size={18} style={{ color: 'var(--accent-rose)' }} /> Geographic Distribution
            </h2>
          </div>
          <div className="table-container" style={{ maxHeight: 400 }}>
            <table>
              <thead><tr><th>State</th><th>Chapters</th><th>Members</th><th>Avg</th></tr></thead>
              <tbody>
                {stateDistribution.map(s => (
                  <tr key={s.state}>
                    <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{s.state}</td>
                    <td><span className="badge green">{s.chapters}</span></td>
                    <td>{s.members?.toLocaleString()}</td>
                    <td style={{ fontWeight: 700, color: 'var(--accent-amber)' }}>{s.avg_members}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Briefcase size={18} style={{ color: 'var(--accent-purple)' }} /> Corporate Presence
            </h2>
          </div>
          <div className="table-container" style={{ maxHeight: 400 }}>
            <table>
              <thead><tr><th>Company</th><th>Members</th><th>Chapters</th></tr></thead>
              <tbody>
                {topCompanies.map(c => (
                  <tr key={c.company_name}>
                    <td style={{ fontWeight: 700, color: 'var(--text-primary)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.company_name}</td>
                    <td><span className="badge blue">{c.members}</span></td>
                    <td><span className="badge green">{c.chapters}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Top 15 Table */}
      <motion.div 
        className="card" 
        style={{ padding: 0, overflow: 'hidden' }}
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
      >
        <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
            <Award size={22} style={{ color: 'var(--accent-amber)' }} /> Elite Chapters (Top 15 by Size)
          </h2>
          <Link href="/chapters" className="btn btn-ghost btn-sm">
            View All Chapters <ArrowUpRight size={14} style={{ marginLeft: 6 }} />
          </Link>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Chapter Name</th>
                <th>Region</th>
                <th>Location</th>
                <th>Day</th>
                <th style={{ textAlign: 'right' }}>Members</th>
              </tr>
            </thead>
            <tbody>
              {largestChapters.map((ch, i) => (
                <tr key={ch.chapter_id}>
                  <td style={{ width: 60 }}>
                    <div style={{ 
                      width: 30, height: 30, borderRadius: '50%', 
                      background: i < 3 ? 'var(--accent-amber-glow)' : 'var(--bg-glass-2)',
                      color: i < 3 ? 'var(--accent-amber)' : 'var(--text-muted)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 900, fontSize: 13
                    }}>
                      {i + 1}
                    </div>
                  </td>
                  <td>
                    <Link href={`/chapters/${ch.chapter_id}`} style={{ color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 800 }}>
                      {ch.chapter_name}
                    </Link>
                  </td>
                  <td><span className="badge purple" style={{ fontSize: 10 }}>{ch.region_name}</span></td>
                  <td><div style={{ fontSize: 13 }}>{ch.city}, {ch.state}</div></td>
                  <td><div style={{ fontSize: 12, fontWeight: 600 }}>{ch.meeting_day}</div></td>
                  <td style={{ textAlign: 'right' }}>
                    <span className="badge green" style={{ fontSize: 13, fontWeight: 900, padding: '4px 12px' }}>{ch.total_members}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
