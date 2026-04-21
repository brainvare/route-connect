import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

function getDb() {
  return new Database(path.join(process.cwd(), 'data', 'bni.db'), { readonly: true });
}

export async function GET() {
  const db = getDb();

  const totals = {
    chapters: (db.prepare('SELECT COUNT(*) as c FROM chapters').get() as any).c,
    members: (db.prepare('SELECT COUNT(*) as c FROM members').get() as any).c,
    regions: (db.prepare('SELECT COUNT(*) as c FROM regions').get() as any).c,
    cities: (db.prepare("SELECT COUNT(DISTINCT city) as c FROM members WHERE city != ''").get() as any).c,
  };

  const topRegions = db.prepare(`
    SELECT region_name, total_chapters, total_members FROM regions ORDER BY total_members DESC LIMIT 15
  `).all();

  const topProfessions = db.prepare(`
    SELECT profession_category, COUNT(*) as count FROM members 
    WHERE profession_category != '' GROUP BY profession_category ORDER BY count DESC LIMIT 20
  `).all();

  const meetingDays = db.prepare(`
    SELECT meeting_day, COUNT(*) as count FROM chapters 
    WHERE meeting_day != '' GROUP BY meeting_day ORDER BY count DESC
  `).all();

  const stateDistribution = db.prepare(`
    SELECT state, COUNT(*) as count FROM chapters 
    WHERE state != '' GROUP BY state ORDER BY count DESC
  `).all();

  const topChapters = db.prepare(`
    SELECT chapter_id, chapter_name, total_members, city, meeting_schedule FROM chapters 
    ORDER BY total_members DESC LIMIT 10
  `).all();

  db.close();
  return NextResponse.json({ totals, topRegions, topProfessions, meetingDays, stateDistribution, topChapters });
}
