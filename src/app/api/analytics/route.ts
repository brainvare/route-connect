import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

function getDb() {
  return new Database(path.join(process.cwd(), 'data', 'bni.db'), { readonly: true });
}

export async function GET(request: NextRequest) {
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const region = searchParams.get('region');
  const state = searchParams.get('state');
  const profession = searchParams.get('profession');
  const day = searchParams.get('day');

  // Build WHERE clauses
  let chapterWhere = 'WHERE 1=1';
  let memberWhere = 'WHERE 1=1';
  const chapterParams: any[] = [];
  const memberParams: any[] = [];

  if (region) {
    chapterWhere += ` AND c.region_id = (SELECT region_id FROM regions WHERE region_name = ?)`;
    memberWhere += ` AND m.region_id = (SELECT region_id FROM regions WHERE region_name = ?)`;
    chapterParams.push(region);
    memberParams.push(region);
  }
  if (state) {
    chapterWhere += ` AND c.state = ?`;
    chapterParams.push(state);
  }
  if (day) {
    chapterWhere += ` AND c.meeting_day = ?`;
    chapterParams.push(day);
  }
  if (profession) {
    memberWhere += ` AND m.profession_category = ?`;
    memberParams.push(profession);
  }

  // ═══ KPI 1: Totals ═══
  const totals = {
    chapters: (db.prepare(`SELECT COUNT(*) as c FROM chapters c ${chapterWhere}`).get(...chapterParams) as any).c,
    members: (db.prepare(`SELECT COUNT(*) as c FROM members m ${memberWhere}`).get(...memberParams) as any).c,
    regions: (db.prepare("SELECT COUNT(*) as c FROM regions").get() as any).c,
    cities: (db.prepare("SELECT COUNT(DISTINCT city) as c FROM members WHERE city != ''").get() as any).c,
    states: (db.prepare("SELECT COUNT(DISTINCT state) as c FROM chapters WHERE state != ''").get() as any).c,
    avgMembersPerChapter: (db.prepare(`SELECT ROUND(AVG(total_members), 1) as a FROM chapters c ${chapterWhere}`).get(...chapterParams) as any).a,
    maxMembersInChapter: (db.prepare(`SELECT MAX(total_members) as m FROM chapters c ${chapterWhere}`).get(...chapterParams) as any).m,
    minMembersInChapter: (db.prepare(`SELECT MIN(total_members) as m FROM chapters c ${chapterWhere} AND c.total_members > 0`).get(...chapterParams) as any)?.m || 0,
    chaptersWithNoMembers: (db.prepare(`SELECT COUNT(*) as c FROM chapters c ${chapterWhere} AND c.total_members = 0`).get(...chapterParams) as any).c,
  };

  // ═══ KPI 2: Top Regions (by members) ═══
  const topRegionsByMembers = db.prepare(`
    SELECT r.region_name, r.total_chapters, r.total_members,
      ROUND(CAST(r.total_members AS FLOAT) / NULLIF(r.total_chapters, 0), 1) as avg_per_chapter
    FROM regions r ORDER BY r.total_members DESC LIMIT 20
  `).all();

  // ═══ KPI 3: Profession Distribution ═══
  const professionDistribution = db.prepare(`
    SELECT profession_category, COUNT(*) as count,
      ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM members m ${memberWhere}), 1) as percentage
    FROM members m ${memberWhere} AND m.profession_category != ''
    GROUP BY profession_category ORDER BY count DESC LIMIT 25
  `).all(...memberParams, ...memberParams);

  // ═══ KPI 4: Meeting Days ═══
  const meetingDays = db.prepare(`
    SELECT meeting_day, COUNT(*) as count,
      ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM chapters c ${chapterWhere}), 1) as percentage
    FROM chapters c ${chapterWhere} AND c.meeting_day != ''
    GROUP BY meeting_day ORDER BY count DESC
  `).all(...chapterParams, ...chapterParams);

  // ═══ KPI 5: State Distribution ═══
  const stateDistribution = db.prepare(`
    SELECT c.state, COUNT(*) as chapters, SUM(c.total_members) as members,
      ROUND(AVG(c.total_members), 1) as avg_members
    FROM chapters c ${chapterWhere} AND c.state != ''
    GROUP BY c.state ORDER BY members DESC
  `).all(...chapterParams);

  // ═══ KPI 6: Chapter Size Distribution ═══
  const sizeDistribution = db.prepare(`
    SELECT 
      CASE 
        WHEN total_members = 0 THEN '0 (Empty)'
        WHEN total_members <= 10 THEN '1-10'
        WHEN total_members <= 20 THEN '11-20'
        WHEN total_members <= 30 THEN '21-30'
        WHEN total_members <= 40 THEN '31-40'
        WHEN total_members <= 50 THEN '41-50'
        WHEN total_members <= 75 THEN '51-75'
        WHEN total_members <= 100 THEN '76-100'
        ELSE '100+'
      END as size_range,
      COUNT(*) as count
    FROM chapters c ${chapterWhere}
    GROUP BY size_range ORDER BY MIN(total_members)
  `).all(...chapterParams);

  // ═══ KPI 7: Top Cities ═══
  const topCities = db.prepare(`
    SELECT m.city, COUNT(*) as members, COUNT(DISTINCT m.chapter_id) as chapters
    FROM members m ${memberWhere} AND m.city != ''
    GROUP BY m.city ORDER BY members DESC LIMIT 20
  `).all(...memberParams);

  // ═══ KPI 8: Largest Chapters ═══
  const largestChapters = db.prepare(`
    SELECT c.chapter_id, c.chapter_name, c.total_members, c.city, c.state,
      c.meeting_day, c.meeting_schedule, r.region_name
    FROM chapters c LEFT JOIN regions r ON c.region_id = r.region_id
    ${chapterWhere} ORDER BY c.total_members DESC LIMIT 15
  `).all(...chapterParams);

  // ═══ KPI 9: Profession by Region heatmap data ═══
  const professionByRegion = db.prepare(`
    SELECT r.region_name, m.profession_category, COUNT(*) as count
    FROM members m
    LEFT JOIN regions r ON m.region_id = r.region_id
    WHERE m.profession_category != '' AND r.region_name IS NOT NULL
    GROUP BY r.region_name, m.profession_category
    HAVING count >= 10
    ORDER BY count DESC LIMIT 100
  `).all();

  // ═══ KPI 10: Region density (chapters per region) ═══
  const regionDensity = db.prepare(`
    SELECT r.region_name, r.total_chapters, r.total_members,
      ROUND(CAST(r.total_members AS FLOAT) / NULLIF(r.total_chapters, 0), 1) as density
    FROM regions r ORDER BY density DESC LIMIT 20
  `).all();

  // ═══ KPI 11: Companies with most members ═══
  const topCompanies = db.prepare(`
    SELECT m.company_name, COUNT(*) as members, COUNT(DISTINCT m.chapter_id) as chapters
    FROM members m ${memberWhere} AND m.company_name != ''
    GROUP BY m.company_name ORDER BY members DESC LIMIT 15
  `).all(...memberParams);

  // ═══ KPI 12: Filter options ═══
  const filterOptions = {
    regions: db.prepare("SELECT region_name FROM regions ORDER BY region_name").all().map((r: any) => r.region_name),
    states: db.prepare("SELECT DISTINCT state FROM chapters WHERE state != '' ORDER BY state").all().map((s: any) => s.state),
    professions: db.prepare("SELECT DISTINCT profession_category FROM members WHERE profession_category != '' ORDER BY profession_category").all().map((p: any) => p.profession_category),
    days: db.prepare("SELECT DISTINCT meeting_day FROM chapters WHERE meeting_day != '' ORDER BY meeting_day").all().map((d: any) => d.meeting_day),
  };

  db.close();
  return NextResponse.json({
    totals, topRegionsByMembers, professionDistribution, meetingDays,
    stateDistribution, sizeDistribution, topCities, largestChapters,
    professionByRegion, regionDensity, topCompanies, filterOptions,
  });
}
