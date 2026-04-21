'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Map, Route, Users, Building2, Globe, BarChart3, PieChart } from 'lucide-react';

const navItems = [
  { section: 'Discover', items: [
    { href: '/', label: 'Home', icon: Home, badge: '' },
    { href: '/map', label: 'Map Explorer', icon: Map, badge: '' },
    { href: '/route', label: 'Route Connect', icon: Route, badge: '' },
  ]},
  { section: 'Search', items: [
    { href: '/members', label: 'Members', icon: Users, badge: '61K' },
    { href: '/chapters', label: 'Chapters', icon: Building2, badge: '1.5K' },
    { href: '/regions', label: 'Regions', icon: Globe, badge: '153' },
  ]},
  { section: 'Intelligence', items: [
    { href: '/analytics', label: 'Analytics & Reports', icon: PieChart, badge: '' },
    { href: '/admin', label: 'Dashboard', icon: BarChart3, badge: '' },
  ]},
];

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <Link href="/" className="sidebar-logo" onClick={onNavigate}>
          <div className="sidebar-logo-icon">RC</div>
          <div>
            <div className="sidebar-logo-text">Route Connect</div>
            <div className="sidebar-logo-sub">BNI INDIA</div>
          </div>
        </Link>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((section) => (
          <div key={section.section} className="nav-section">
            <div className="nav-section-title">{section.section}</div>
            {section.items.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <Link key={item.href} href={item.href} className={`nav-item ${isActive ? 'active' : ''}`} onClick={onNavigate}>
                  <item.icon />
                  <span>{item.label}</span>
                  {item.badge && <span className="nav-item-badge">{item.badge}</span>}
                </Link>
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
