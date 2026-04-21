import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

function getDb() {
  return new Database(path.join(process.cwd(), 'data', 'bni.db'), { readonly: true });
}

export async function GET(request: NextRequest) {
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (id) {
    const region = db.prepare(`SELECT * FROM regions WHERE region_id = ?`).get(id) as any;
    if (!region) { db.close(); return NextResponse.json({ error: 'Not found' }, { status: 404 }); }
    const chapters = db.prepare(`SELECT * FROM chapters WHERE region_id = ? ORDER BY total_members DESC`).all(id);
    const topProfessions = db.prepare(`
      SELECT profession_category, COUNT(*) as count FROM members 
      WHERE region_id = ? AND profession_category != '' 
      GROUP BY profession_category ORDER BY count DESC LIMIT 15
    `).all(id);
    const cities = db.prepare(`
      SELECT city, COUNT(*) as count FROM members 
      WHERE region_id = ? AND city != '' GROUP BY city ORDER BY count DESC LIMIT 20
    `).all(id);
    db.close();
    return NextResponse.json({ region, chapters, topProfessions, cities });
  }

  const regions = db.prepare(`SELECT * FROM regions ORDER BY total_members DESC`).all();
  db.close();
  return NextResponse.json({ regions });
}
