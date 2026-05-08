'use client';
import { useEffect, useState, use, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, Building2, MapPin, Briefcase, Phone, Globe, Mail, 
  ExternalLink, User, Calendar, Map as MapIcon, ShieldCheck
} from 'lucide-react';

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

function MemberDetailContent() {
  const searchParams = useSearchParams();
  const idStr = searchParams.get('id');
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!idStr) {
      setLoading(false);
      return;
    }
    (async () => {
      const { loadAllMembers } = await import('@/lib/loadMembers');
      const members = await loadAllMembers();
      const m = members.find((m: any) => m.member_id === parseInt(idStr));
      setMember(m || null);
      setLoading(false);
    })();
  }, [idStr]);

  if (loading) return <div className="loading"><div className="spinner" /> Loading profile...</div>;
  if (!member) return <div className="page-container">Member not found</div>;

  return (
    <div className="page-container">
      <Link href="/members" className="back-link" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', textDecoration: 'none', marginBottom: 24, fontSize: 13, fontWeight: 500 }}>
        <ChevronLeft size={16} /> Back to Members
      </Link>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 32 }}>
        {/* Main Profile Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <motion.div 
            className="card" 
            style={{ padding: 40, position: 'relative', overflow: 'hidden' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, background: 'var(--accent-blue)', opacity: 0.05, borderRadius: '50%', filter: 'blur(60px)' }} />
            
            <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
              <div style={{ 
                width: 120, height: 120, borderRadius: 32, 
                background: 'linear-gradient(135deg, var(--bg-glass-2), var(--bg-glass))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 48, fontWeight: 800, color: 'var(--text-primary)',
                border: '1px solid var(--border)'
              }}>
                {member.full_name.charAt(0)}
              </div>
              
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <h1 style={{ fontSize: 42, fontWeight: 800, margin: 0 }}>{member.full_name}</h1>
                  <ShieldCheck size={24} style={{ color: 'var(--accent-blue)' }} />
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                  <span className="badge" style={{ fontSize: 14, padding: '6px 16px' }}>
                    <Briefcase size={14} style={{ marginRight: 8 }} />
                    {member.profession_category || 'Business Owner'}
                  </span>
                  <span className="badge" style={{ fontSize: 14, padding: '6px 16px', background: 'rgba(255,255,255,0.03)' }}>
                    <MapPin size={14} style={{ marginRight: 8 }} />
                    {member.city}, {member.country || 'India'}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <motion.div 
              className="card" 
              style={{ padding: 24 }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h3 style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-muted)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Building2 size={16} /> Company Details
              </h3>
              <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>{member.company_name}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{member.profession || 'Business Professional'}</div>
              
              <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', gap: 12 }}>
                  <MapIcon size={18} style={{ color: 'var(--text-muted)' }} />
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Location</div>
                    <div style={{ fontSize: 14 }}>{member.street_address || member.city}</div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div 
              className="card" 
              style={{ padding: 24 }}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3 style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-muted)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Calendar size={16} /> BNI Network
              </h3>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Chapter</div>
                <Link href={`/chapters/detail?id=${member.chapter_id}`} style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent-blue)', textDecoration: 'none' }}>
                  {member.chapter_name}
                </Link>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Region</div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>{member.region_name}</div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Sidebar Contact Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <motion.div 
            className="card" 
            style={{ padding: 24, background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.05))' }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 24 }}>Direct Contact</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {member.phone && (
                <div className="contact-item" style={{ display: 'flex', gap: 12 }}>
                  <div className="contact-icon phone" style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(59,130,246,0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Phone size={16} /></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Phone</div>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>{member.phone}</div>
                  </div>
                </div>
              )}
              {member.email && (
                <div className="contact-item" style={{ display: 'flex', gap: 12 }}>
                  <div className="contact-icon email" style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(59,130,246,0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Mail size={16} /></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Email</div>
                    <div style={{ fontSize: 14, fontWeight: 600, wordBreak: 'break-all' }}>{member.email}</div>
                  </div>
                </div>
              )}
              {member.website && (
                <a href={member.website.startsWith('http') ? member.website : `https://${member.website}`} target="_blank" className="contact-item" style={{ display: 'flex', gap: 12, textDecoration: 'none', color: 'inherit' }}>
                  <div className="contact-icon website" style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(59,130,246,0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Globe size={16} /></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Website</div>
                    <div style={{ fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                      Visit Site <ExternalLink size={12} />
                    </div>
                  </div>
                </a>
              )}
              
              {!(member.phone || member.email || member.website) && (
                <div style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  No public contact details available.
                </div>
              )}
            </div>

            <button className="btn btn-primary" style={{ width: '100%', marginTop: 32 }}>
              Message Member
            </button>
          </motion.div>

          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <User size={18} style={{ color: 'var(--text-muted)' }} />
              <div style={{ fontSize: 14, fontWeight: 600 }}>Professional ID</div>
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>
              BNI-IN-{member.member_id}-{member.chapter_id}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MemberDetailPage() {
  return (
    <Suspense fallback={<div className="loading"><div className="spinner" /> Loading member profile...</div>}>
      <MemberDetailContent />
    </Suspense>
  );
}
