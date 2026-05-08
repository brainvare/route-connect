'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, Map, Route, Users, Building2, Globe, BarChart3, PieChart } from 'lucide-react';

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const [stats, setStats] = useState({ members: '85K+', chapters: '9K+', regions: '150+' });

  useEffect(() => {
    fetch('/data/analytics.json')
      .then(r => r.json())
      .then(d => {
        setStats({
          members: (d.total / 1000).toFixed(1) + 'K',
          chapters: '9.8K', // Placeholder until chapters table is globally populated
          regions: '150+',
        });
      })
      .catch(e => console.error('Failed to load analytics', e));
  }, []);

  const navItems = [
    { section: 'Discover', items: [
      { href: '/', label: 'Home', icon: Home, badge: '' },
      { href: '/map', label: 'Map Explorer', icon: Map, badge: '' },
      { href: '/route', label: 'Route Connect', icon: Route, badge: '' },
    ]},
    { section: 'Search', items: [
      { href: '/countries', label: 'Countries', icon: Globe, badge: '83' },
      { href: '/regions', label: 'Regions', icon: Building2, badge: stats.regions },
      { href: '/members', label: 'Members', icon: Users, badge: stats.members },
      { href: '/chapters', label: 'Chapters', icon: Building2, badge: stats.chapters },
    ]},
    { section: 'Intelligence', items: [
      { href: '/analytics', label: 'Analytics & Reports', icon: PieChart, badge: '' },
      { href: '/admin', label: 'Dashboard', icon: BarChart3, badge: '' },
    ]},
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <Link href="/" className="sidebar-logo" onClick={onNavigate}>
          <div className="sidebar-logo-icon">RC</div>
          <div>
            <div className="sidebar-logo-text">Route Connect</div>
            <div className="sidebar-logo-sub">Global Network</div>
          </div>
        </Link>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((section, si) => (
          <div key={section.section} className="nav-section">
            <div className="nav-section-title">{section.section}</div>
            {section.items.map((item, ii) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (si * 3 + ii) * 0.04, duration: 0.3 }}
                >
                  <Link href={item.href} className={`nav-item ${isActive ? 'active' : ''}`} onClick={onNavigate}>
                    <item.icon />
                    <span>{item.label}</span>
                    {item.badge && <span className="nav-item-badge">{item.badge}</span>}
                  </Link>
                </motion.div>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div style={{ padding: '12px 18px', borderTop: '1px solid var(--border)', fontSize: 10, color: 'var(--text-muted)' }}>
          61,521 members · 1,584 chapters · 153 regions
        </div>
      </div>
    </aside>
  );
}
