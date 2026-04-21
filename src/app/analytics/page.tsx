'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Building2, Users, Globe, MapPin, TrendingUp, BarChart3,
  PieChart, Activity, Target, Award, Briefcase, Calendar,
  Filter, Download, ChevronDown
} from 'lucide-react';

interface AnalyticsData {
  totals: {
    chapters: number; members: number; regions: number; cities: number;
    states: number; avgMembersPerChapter: number; maxMembersInChapter: number;
    minMembersInChapter: number; chaptersWithNoMembers: number;
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

function BarChart({ data, maxValue, color = 'blue', labelWidth = 100 }: {
  data: { label: string; value: number; sub?: string }[]; maxValue: number;
  color?: string; labelWidth?: number;
}) {
  return (
    <div className="bar-chart">
      {data.map((d, i) => (
        <div key={i} className="bar-row">
          <span className="bar-label" style={{ width: labelWidth }} title={d.label}>{d.label}</span>
          <div className="bar-track">
            <div className={`bar-fill ${BAR_COLORS[i % BAR_COLORS.length] || color}`}
              style={{ width: `${(d.value / maxValue) * 100}%` }} />
          </div>
          <span className="bar-value">{d.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

function MiniDonut({ segments, size = 120 }: { segments: { label: string; value: number; color: string }[]; size?: number }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  const r = size / 2 - 8;
  const cx = size / 2, cy = size / 2;
  let cumulativePercent = 0;

  return (
    <div style={{ textAlign: 'center' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
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
            <path key={i}
              d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`}
              fill={seg.color} opacity={0.85} stroke="var(--bg-primary)" strokeWidth="2"
            />
          );
        })}
        <circle cx={cx} cy={cy} r={r * 0.55} fill="var(--bg-card)" />
        <text x={cx} y={cy - 4} textAnchor="middle" fill="var(--text-primary)" fontSize="16" fontWeight="800">{total.toLocaleString()}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fill="var(--text-muted)" fontSize="9">TOTAL</text>
      </svg>
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ region: '', state: '', profession: '', day: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.region) params.set('region', filters.region);
    if (filters.state) params.set('state', filters.state);
    if (filters.profession) params.set('profession', filters.profession);
    if (filters.day) params.set('day', filters.day);
    const res = await fetch(`/api/analytics?${params}`);
    const d = await res.json();
    setData(d);
    setLoading(false);
  }, [filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading || !data) {
    return <div className="loading" style={{ height: '100vh' }}><div className="spinner" /> Loading analytics...</div>;
  }

  const { totals, topRegionsByMembers, professionDistribution, meetingDays, stateDistribution,
    sizeDistribution, topCities, largestChapters, regionDensity, topCompanies, filterOptions } = data;

  const profDonutSegments = professionDistribution.slice(0, 8).map((p, i) => ({
    label: p.profession_category, value: p.count, color: COLORS[i % COLORS.length]
  }));

  const dayDonutSegments = meetingDays.map((d, i) => ({
    label: d.meeting_day, value: d.count, color: COLORS[i % COLORS.length]
  }));

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">📊 Analytics & Reports</h1>
        <p className="page-subtitle">Comprehensive BNI India network intelligence — {totals.members.toLocaleString()} members across {totals.chapters.toLocaleString()} chapters</p>
      </div>

      {/* Filters */}
      <div className="analytics-filters">
        <Filter size={14} style={{ color: 'var(--text-muted)' }} />
        <label>Filters:</label>
        <select className="select-input" value={filters.region} onChange={e => setFilters(f => ({ ...f, region: e.target.value }))}>
          <option value="">All Regions</option>
          {filterOptions.regions.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select className="select-input" value={filters.state} onChange={e => setFilters(f => ({ ...f, state: e.target.value }))}>
          <option value="">All States</option>
          {filterOptions.states.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="select-input" value={filters.profession} onChange={e => setFilters(f => ({ ...f, profession: e.target.value }))}>
          <option value="">All Professions</option>
          {filterOptions.professions.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select className="select-input" value={filters.day} onChange={e => setFilters(f => ({ ...f, day: e.target.value }))}>
          <option value="">All Days</option>
          {filterOptions.days.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        {(filters.region || filters.state || filters.profession || filters.day) && (
          <button className="btn btn-ghost btn-sm" onClick={() => setFilters({ region: '', state: '', profession: '', day: '' })}>
            Clear All
          </button>
        )}
      </div>

      {/* KPI Cards Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
        <div className="kpi-card">
          <div className="kpi-value" style={{ color: 'var(--accent-green)' }}>{totals.chapters.toLocaleString()}</div>
          <div className="kpi-label">Total Chapters</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value" style={{ color: 'var(--accent-blue)' }}>{totals.members.toLocaleString()}</div>
          <div className="kpi-label">Total Members</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value" style={{ color: 'var(--accent-purple)' }}>{totals.regions}</div>
          <div className="kpi-label">Regions</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value" style={{ color: 'var(--accent-amber)' }}>{totals.states}</div>
          <div className="kpi-label">States</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value" style={{ color: 'var(--accent-cyan)' }}>{totals.cities.toLocaleString()}</div>
          <div className="kpi-label">Cities</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value" style={{ color: 'var(--accent-rose)' }}>{totals.avgMembersPerChapter}</div>
          <div className="kpi-label">Avg per Chapter</div>
        </div>
      </div>

      {/* KPI Cards Row 2 */}
      <div className="grid-3" style={{ marginBottom: 24 }}>
        <div className="kpi-card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div className="stat-icon green"><Award size={20} /></div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{totals.maxMembersInChapter}</div>
            <div className="kpi-label" style={{ textAlign: 'left' }}>Largest Chapter</div>
          </div>
        </div>
        <div className="kpi-card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div className="stat-icon amber"><Target size={20} /></div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{totals.minMembersInChapter}</div>
            <div className="kpi-label" style={{ textAlign: 'left' }}>Smallest Active</div>
          </div>
        </div>
        <div className="kpi-card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div className="stat-icon rose"><Activity size={20} /></div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{totals.chaptersWithNoMembers}</div>
            <div className="kpi-label" style={{ textAlign: 'left' }}>Empty Chapters</div>
          </div>
        </div>
      </div>

      {/* Row: Regions + Professions */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="section-title"><TrendingUp size={16} style={{ color: 'var(--accent-green)' }} /> Top Regions by Members</div>
          <BarChart
            data={topRegionsByMembers.slice(0, 12).map(r => ({ label: r.region_name, value: r.total_members }))}
            maxValue={topRegionsByMembers[0]?.total_members || 1}
          />
        </div>
        <div className="card">
          <div className="section-title"><Briefcase size={16} style={{ color: 'var(--accent-purple)' }} /> Profession Distribution</div>
          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
            <MiniDonut segments={profDonutSegments} size={140} />
            <div style={{ flex: 1 }}>
              <div className="donut-legend" style={{ flexDirection: 'column', gap: 6 }}>
                {professionDistribution.slice(0, 8).map((p, i) => (
                  <div key={p.profession_category} className="donut-legend-item">
                    <span className="donut-legend-dot" style={{ background: COLORS[i] }} />
                    <span style={{ flex: 1 }}>{p.profession_category}</span>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{p.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row: Meeting Days + Chapter Size */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="section-title"><Calendar size={16} style={{ color: 'var(--accent-blue)' }} /> Meetings by Day</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 180, paddingTop: 16 }}>
            {meetingDays.map((d, i) => {
              const maxDay = meetingDays[0]?.count || 1;
              const height = (d.count / maxDay) * 140;
              return (
                <div key={d.meeting_day} style={{ flex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: COLORS[i], marginBottom: 6 }}>{d.count}</div>
                  <div style={{ height, width: '70%', background: `linear-gradient(180deg, ${COLORS[i]}, ${COLORS[i]}33)`, borderRadius: '6px 6px 0 0', transition: 'height 0.5s ease' }} />
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 8, fontWeight: 600 }}>{d.meeting_day?.slice(0, 3)}</div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{d.percentage}%</div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="card">
          <div className="section-title"><BarChart3 size={16} style={{ color: 'var(--accent-amber)' }} /> Chapter Size Distribution</div>
          <BarChart
            data={sizeDistribution.map(s => ({ label: s.size_range, value: s.count }))}
            maxValue={Math.max(...sizeDistribution.map(s => s.count))}
            color="amber"
          />
        </div>
      </div>

      {/* Row: States + Top Cities */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="section-title"><MapPin size={16} style={{ color: 'var(--accent-rose)' }} /> State Distribution</div>
          <div className="table-container" style={{ maxHeight: 400, overflow: 'auto' }}>
            <table>
              <thead><tr><th>State</th><th>Chapters</th><th>Members</th><th>Avg/Ch</th></tr></thead>
              <tbody>
                {stateDistribution.map(s => (
                  <tr key={s.state}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.state}</td>
                    <td><span className="badge green">{s.chapters}</span></td>
                    <td><span className="badge">{s.members?.toLocaleString()}</span></td>
                    <td style={{ color: 'var(--accent-amber)' }}>{s.avg_members}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <div className="section-title"><Globe size={16} style={{ color: 'var(--accent-cyan)' }} /> Top Cities</div>
          <BarChart
            data={topCities.slice(0, 12).map(c => ({ label: c.city, value: c.members, sub: `${c.chapters} ch` }))}
            maxValue={topCities[0]?.members || 1}
            color="cyan"
          />
        </div>
      </div>

      {/* Row: Region Density + Top Companies */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="section-title"><Activity size={16} style={{ color: 'var(--accent-green)' }} /> Region Density (Members per Chapter)</div>
          <BarChart
            data={regionDensity.slice(0, 12).map(r => ({ label: r.region_name, value: r.density }))}
            maxValue={regionDensity[0]?.density || 1}
            color="green"
            labelWidth={90}
          />
        </div>
        <div className="card">
          <div className="section-title"><Briefcase size={16} style={{ color: 'var(--accent-purple)' }} /> Top Companies</div>
          <div className="table-container" style={{ maxHeight: 400, overflow: 'auto' }}>
            <table>
              <thead><tr><th>Company</th><th>Members</th><th>Chapters</th></tr></thead>
              <tbody>
                {topCompanies.map(c => (
                  <tr key={c.company_name}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.company_name}</td>
                    <td><span className="badge">{c.members}</span></td>
                    <td><span className="badge green">{c.chapters}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Largest Chapters Table */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="section-title"><Award size={16} style={{ color: 'var(--accent-amber)' }} /> Top 15 Largest Chapters</div>
        <div className="table-container">
          <table>
            <thead>
              <tr><th>#</th><th>Chapter</th><th>Region</th><th>City</th><th>State</th><th>Day</th><th>Members</th></tr>
            </thead>
            <tbody>
              {largestChapters.map((ch, i) => (
                <tr key={ch.chapter_id}>
                  <td style={{ fontWeight: 800, color: i < 3 ? 'var(--accent-amber)' : 'var(--text-muted)' }}>{i + 1}</td>
                  <td>
                    <Link href={`/chapters/${ch.chapter_id}`} style={{ color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 600 }}>
                      {ch.chapter_name}
                    </Link>
                  </td>
                  <td><span className="badge purple">{ch.region_name}</span></td>
                  <td>{ch.city || '—'}</td>
                  <td>{ch.state || '—'}</td>
                  <td><span className="badge">{ch.meeting_day || '—'}</span></td>
                  <td><span className="badge green" style={{ fontSize: 12, fontWeight: 800 }}>{ch.total_members}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Profession by Region Heatmap */}
      <div className="card">
        <div className="section-title"><PieChart size={16} style={{ color: 'var(--accent-blue)' }} /> Profession × Region Insights</div>
        <p className="section-subtitle" style={{ marginBottom: 14 }}>Showing profession-region combinations with 10+ members</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {data.professionByRegion.slice(0, 60).map((pr, i) => (
            <div key={i} style={{
              padding: '5px 10px', borderRadius: 8,
              background: `rgba(${pr.count > 50 ? '59,130,246' : pr.count > 30 ? '16,185,129' : pr.count > 20 ? '245,158,11' : '139,92,246'}, ${Math.min(0.3, pr.count / 200)})`,
              border: '1px solid var(--border)', fontSize: 10, color: 'var(--text-secondary)',
            }}>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{pr.region_name}</span>
              {' · '}{pr.profession_category}{' '}
              <span style={{ fontWeight: 700, color: 'var(--accent-blue)' }}>({pr.count})</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
