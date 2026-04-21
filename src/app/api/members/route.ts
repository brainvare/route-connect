import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

function getDb() {
  return new Database(path.join(process.cwd(), 'data', 'bni.db'), { readonly: true });
}

export async function GET(request: NextRequest) {
  const db = getDb();
  const { searchParams } = new URL(request.url);

  const search = searchParams.get('search');
  const profession = searchParams.get('profession');
  const city = searchParams.get('city');
  const chapter = searchParams.get('chapter');
  const region = searchParams.get('region');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  let query = `SELECT m.*, c.chapter_name, c.latitude, c.longitude, r.region_name 
    FROM members m 
    LEFT JOIN chapters c ON m.chapter_id = c.chapter_id 
    LEFT JOIN regions r ON m.region_id = r.region_id 
    WHERE 1=1`;
  const params: any[] = [];

  if (search) {
    query += ` AND (m.full_name LIKE ? OR m.company_name LIKE ? OR m.profession LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (profession) {
    query += ` AND m.profession_category = ?`;
    params.push(profession);
  }
  if (city) {
    query += ` AND m.city LIKE ?`;
    params.push(`%${city}%`);
  }
  if (chapter) {
    query += ` AND m.chapter_id = ?`;
    params.push(chapter);
  }
  if (region) {
    query += ` AND r.region_name = ?`;
    params.push(region);
  }

  const countQuery = query.replace(/SELECT m\.\*.*?WHERE/, 'SELECT COUNT(*) as total FROM members m LEFT JOIN chapters c ON m.chapter_id = c.chapter_id LEFT JOIN regions r ON m.region_id = r.region_id WHERE');
  const total = (db.prepare(countQuery).get(...params) as any)?.total || 0;

  query += ` ORDER BY m.full_name LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const members = db.prepare(query).all(...params);

  // Get profession categories for filter
  const categories = db.prepare(`
    SELECT profession_category, COUNT(*) as count 
    FROM members WHERE profession_category != '' 
    GROUP BY profession_category ORDER BY count DESC
  `).all();

  db.close();
  return NextResponse.json({ members, total, limit, offset, categories });
}
