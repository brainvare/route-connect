import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

function getDb() {
  return new Database(path.join(process.cwd(), 'data', 'bni.db'), { readonly: true });
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function pointToSegmentDistance(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax, dy = by - ay;
  if (dx === 0 && dy === 0) return haversine(px, py, ax, ay);
  let t = ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy);
  t = Math.max(0, Math.min(1, t));
  return haversine(px, py, ax + t * dx, ay + t * dy);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { waypoints, radius = 15, profession } = body;
  // waypoints: [[lat, lng], [lat, lng], ...]

  if (!waypoints || waypoints.length < 2) {
    return NextResponse.json({ error: 'Need at least 2 waypoints (start and end)' }, { status: 400 });
  }

  const db = getDb();

  // Get bounding box of entire route with buffer
  const allLats = waypoints.map((w: number[]) => w[0]);
  const allLngs = waypoints.map((w: number[]) => w[1]);
  const bufferDeg = radius / 111.0;
  const minLat = Math.min(...allLats) - bufferDeg;
  const maxLat = Math.max(...allLats) + bufferDeg;
  const minLng = Math.min(...allLngs) - bufferDeg;
  const maxLng = Math.max(...allLngs) + bufferDeg;

  // Get all chapters in bounding box
  const candidates = db.prepare(`
    SELECT c.*, r.region_name FROM chapters c 
    LEFT JOIN regions r ON c.region_id = r.region_id
    WHERE c.latitude BETWEEN ? AND ? AND c.longitude BETWEEN ? AND ?
  `).all(minLat, maxLat, minLng, maxLng) as any[];

  // Calculate min distance from each chapter to any route segment
  const results = [];
  for (const ch of candidates) {
    let minDist = Infinity;
    for (let i = 0; i < waypoints.length - 1; i++) {
      const dist = pointToSegmentDistance(
        ch.latitude, ch.longitude,
        waypoints[i][0], waypoints[i][1],
        waypoints[i + 1][0], waypoints[i + 1][1]
      );
      if (dist < minDist) minDist = dist;
    }
    if (minDist <= radius) {
      // Get member count and top professions for this chapter
      let memberQuery = `SELECT COUNT(*) as count FROM members WHERE chapter_id = ?`;
      const memberParams: any[] = [ch.chapter_id];
      if (profession) {
        memberQuery += ` AND profession_category = ?`;
        memberParams.push(profession);
      }
      const memberCount = (db.prepare(memberQuery).get(...memberParams) as any)?.count || 0;

      const topProfs = db.prepare(`
        SELECT profession_category, COUNT(*) as count FROM members 
        WHERE chapter_id = ? AND profession_category != '' 
        GROUP BY profession_category ORDER BY count DESC LIMIT 5
      `).all(ch.chapter_id);

      results.push({
        ...ch,
        distance_km: Math.round(minDist * 10) / 10,
        matching_members: memberCount,
        top_professions: topProfs,
      });
    }
  }

  // Sort by distance to route  
  results.sort((a, b) => a.distance_km - b.distance_km);

  db.close();
  return NextResponse.json({ chapters: results, total: results.length, radius });
}
