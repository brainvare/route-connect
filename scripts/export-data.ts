import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'bni.db');
const PUBLIC_DIR = path.join(process.cwd(), 'public', 'data');

if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR, { recursive: true });
if (!fs.existsSync(path.join(PUBLIC_DIR, 'chapters'))) fs.mkdirSync(path.join(PUBLIC_DIR, 'chapters'), { recursive: true });

const db = new Database(DB_PATH);

console.log('Exporting members.json...');
const members = db.prepare(`
  SELECT 
    m.*, 
    COALESCE(c.chapter_name, m.chapter_name) as chapter_name, 
    COALESCE(r.region_name, m.region_name) as region_name 
  FROM members m
  LEFT JOIN chapters c ON m.chapter_id = c.chapter_id
  LEFT JOIN regions r ON m.region_id = r.region_id
`).all();

const categories = db.prepare(`
  SELECT profession_category, COUNT(*) as count 
  FROM members 
  WHERE profession_category != '' 
  GROUP BY profession_category 
  ORDER BY count DESC
`).all();

fs.writeFileSync(path.join(PUBLIC_DIR, 'members.json'), JSON.stringify({ members, categories }, null, 2));

console.log('Exporting analytics.json...');
const enrichmentStats = {
  withPhone: (db.prepare("SELECT COUNT(*) as c FROM members WHERE phone != '' OR mobile != '' OR direct_phone != ''").get() as any).c,
  withWebsite: (db.prepare("SELECT COUNT(*) as c FROM members WHERE website != ''").get() as any).c,
  withEmail: (db.prepare("SELECT COUNT(*) as c FROM members WHERE email != ''").get() as any).c,
  withAddress: (db.prepare("SELECT COUNT(*) as c FROM members WHERE street_address != ''").get() as any).c,
  total: members.length
};

const analytics = {
  totals: {
    ...(db.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM chapters) as chapters,
        (SELECT COUNT(*) FROM members) as members,
        (SELECT COUNT(*) FROM regions) as regions,
        (SELECT COUNT(DISTINCT city) FROM chapters) as cities,
        (SELECT COUNT(DISTINCT state) FROM chapters) as states,
        (SELECT AVG(total_members) FROM chapters) as avgMembersPerChapter,
        (SELECT MAX(total_members) FROM chapters) as maxMembersInChapter,
        (SELECT MIN(total_members) FROM chapters WHERE total_members > 0) as minMembersInChapter,
        (SELECT COUNT(*) FROM chapters WHERE total_members = 0) as chaptersWithNoMembers
    `).get() as any),
    enrichment: enrichmentStats
  },
  topRegionsByMembers: db.prepare(`
    SELECT region_name, total_chapters, total_members, 
    CAST(total_members AS FLOAT)/total_chapters as avg_per_chapter 
    FROM regions ORDER BY total_members DESC LIMIT 15
  `).all(),
  professionDistribution: db.prepare(`
    SELECT profession_category, COUNT(*) as count, 
    ROUND(CAST(COUNT(*) AS FLOAT) * 100 / (SELECT COUNT(*) FROM members), 1) as percentage
    FROM members WHERE profession_category != ''
    GROUP BY profession_category ORDER BY count DESC LIMIT 20
  `).all(),
  meetingDays: db.prepare(`
    SELECT meeting_day, COUNT(*) as count,
    ROUND(CAST(COUNT(*) AS FLOAT) * 100 / (SELECT COUNT(*) FROM chapters), 1) as percentage
    FROM chapters WHERE meeting_day != ''
    GROUP BY meeting_day ORDER BY count DESC
  `).all(),
  stateDistribution: db.prepare(`
    SELECT state, COUNT(*) as chapters, SUM(total_members) as members,
    ROUND(AVG(total_members), 1) as avg_members
    FROM chapters WHERE state != ''
    GROUP BY state ORDER BY members DESC
  `).all(),
  sizeDistribution: [
    { size_range: '0-20', count: (db.prepare("SELECT COUNT(*) as c FROM chapters WHERE total_members <= 20").get() as any).c },
    { size_range: '21-40', count: (db.prepare("SELECT COUNT(*) as c FROM chapters WHERE total_members > 20 AND total_members <= 40").get() as any).c },
    { size_range: '41-60', count: (db.prepare("SELECT COUNT(*) as c FROM chapters WHERE total_members > 40 AND total_members <= 60").get() as any).c },
    { size_range: '61-80', count: (db.prepare("SELECT COUNT(*) as c FROM chapters WHERE total_members > 60 AND total_members <= 80").get() as any).c },
    { size_range: '80+', count: (db.prepare("SELECT COUNT(*) as c FROM chapters WHERE total_members > 80").get() as any).c }
  ],
  topCities: db.prepare(`
    SELECT city, SUM(total_members) as members, COUNT(*) as chapters
    FROM chapters WHERE city != ''
    GROUP BY city ORDER BY members DESC LIMIT 15
  `).all(),
  largestChapters: db.prepare(`
    SELECT c.*, r.region_name
    FROM chapters c
    LEFT JOIN regions r ON c.region_id = r.region_id
    ORDER BY total_members DESC LIMIT 15
  `).all(),
  topCompanies: db.prepare(`
    SELECT company_name, COUNT(*) as members, COUNT(DISTINCT chapter_id) as chapters
    FROM members WHERE company_name != ''
    GROUP BY company_name ORDER BY members DESC LIMIT 15
  `).all()
};

fs.writeFileSync(path.join(PUBLIC_DIR, 'analytics.json'), JSON.stringify(analytics, null, 2));

console.log('Exporting chapter JSONs...');
const chapters = db.prepare('SELECT * FROM chapters').all() as any[];

for (const ch of chapters) {
  const chMembers = db.prepare('SELECT * FROM members WHERE chapter_id = ?').all(ch.chapter_id);
  const chProfessions = db.prepare(`
    SELECT profession_category, COUNT(*) as count 
    FROM members 
    WHERE chapter_id = ? AND profession_category != '' 
    GROUP BY profession_category 
    ORDER BY count DESC
  `).all(ch.chapter_id);
  
  fs.writeFileSync(
    path.join(PUBLIC_DIR, 'chapters', `${ch.chapter_id}.json`),
    JSON.stringify({ chapter: ch, members: chMembers, professions: chProfessions }, null, 2)
  );
}

console.log('✅ Export complete!');
db.close();
