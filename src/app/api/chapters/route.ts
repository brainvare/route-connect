import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

function getDb() {
  const db = new Database(path.join(process.cwd(), 'data', 'bni.db'), { readonly: true });
  db.pragma('journal_mode = WAL');
  return db;
}

export async function GET(request: NextRequest) {
  const db = getDb();
  const { searchParams } = new URL(request.url);

  const region = searchParams.get('region');
  const city = searchParams.get('city');
  const day = searchParams.get('day');
  const near = searchParams.get('near'); // lat,lng
  const radius = parseFloat(searchParams.get('radius') || '10'); // km
  const limit = parseInt(searchParams.get('limit') || '100');
  const offset = parseInt(searchParams.get('offset') || '0');
  const search = searchParams.get('search');

  let query = `SELECT c.*, r.region_name FROM chapters c LEFT JOIN regions r ON c.region_id = r.region_id WHERE 1=1`;
  const params: any[] = [];

  if (search) {
    query += ` AND (c.chapter_name LIKE ? OR c.venue_name LIKE ? OR c.city LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (region) {
    query += ` AND r.region_name = ?`;
    params.push(region);
  }
  if (city) {
    query += ` AND c.city LIKE ?`;
    params.push(`%${city}%`);
  }
  if (day) {
    query += ` AND c.meeting_day = ?`;
    params.push(day);
  }

  if (near) {
    const [lat, lng] = near.split(',').map(Number);
    // Haversine approximation for SQLite
    const latDeg = radius / 111.0;
    const lngDeg = radius / (111.0 * Math.cos(lat * Math.PI / 180));
    query += ` AND c.latitude BETWEEN ? AND ? AND c.longitude BETWEEN ? AND ?`;
    params.push(lat - latDeg, lat + latDeg, lng - lngDeg, lng + lngDeg);
  }

  // Count total
  const countQuery = query.replace(/SELECT c\.\*, r\.region_name/, 'SELECT COUNT(*) as total');
  const total = (db.prepare(countQuery).get(...params) as any)?.total || 0;

  query += ` ORDER BY c.total_members DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const chapters = db.prepare(query).all(...params);

  // If near, add distance to each result
  if (near) {
    const [lat, lng] = near.split(',').map(Number);
    for (const ch of chapters as any[]) {
      ch.distance_km = haversine(lat, lng, ch.latitude, ch.longitude);
    }
    (chapters as any[]).sort((a: any, b: any) => a.distance_km - b.distance_km);
  }

  db.close();
  return NextResponse.json({ chapters, total, limit, offset });
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
