import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

function getDb() {
  const db = new Database(path.join(process.cwd(), 'data', 'bni.db'), { readonly: true });
  return db;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();

  const chapter = db.prepare(`
    SELECT c.*, r.region_name 
    FROM chapters c LEFT JOIN regions r ON c.region_id = r.region_id 
    WHERE c.chapter_id = ?
  `).get(id) as any;

  if (!chapter) {
    db.close();
    return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
  }

  const members = db.prepare(`
    SELECT member_id, full_name, profession, profession_category, company_name, city 
    FROM members WHERE chapter_id = ? ORDER BY full_name
  `).all(id);

  // Profession breakdown
  const professionBreakdown = db.prepare(`
    SELECT profession_category, COUNT(*) as count 
    FROM members WHERE chapter_id = ? AND profession_category != '' 
    GROUP BY profession_category ORDER BY count DESC
  `).all(id);

  db.close();
  return NextResponse.json({ chapter, members, professionBreakdown });
}
