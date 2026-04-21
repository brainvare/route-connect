/**
 * Seed script — imports BNI chapter + member data from JSON into SQLite.
 * Run with: node --loader ts-node/esm scripts/seed.ts
 * Or: npx tsx scripts/seed.ts
 */
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'bni.db');
const CHAPTERS_JSON = path.join(process.cwd(), '..', 'bni_chapters.json');
const MEMBERS_JSON = path.join(process.cwd(), '..', 'bni_members.json');

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

// Delete old DB
if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH);

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

console.log('Creating tables...');
db.exec(`
  CREATE TABLE regions (
    region_id INTEGER PRIMARY KEY AUTOINCREMENT,
    region_name TEXT UNIQUE NOT NULL,
    domain TEXT,
    total_chapters INTEGER DEFAULT 0,
    total_members INTEGER DEFAULT 0
  );
  CREATE TABLE chapters (
    chapter_id INTEGER PRIMARY KEY,
    chapter_name TEXT NOT NULL,
    region_id INTEGER,
    venue_name TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    latitude REAL,
    longitude REAL,
    meeting_day TEXT,
    meeting_time TEXT,
    meeting_schedule TEXT,
    total_members INTEGER DEFAULT 0,
    domain TEXT,
    detail_url TEXT,
    org_type TEXT,
    FOREIGN KEY (region_id) REFERENCES regions(region_id)
  );
  CREATE TABLE members (
    member_id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    profession TEXT,
    profession_category TEXT,
    company_name TEXT,
    city TEXT,
    chapter_id INTEGER,
    region_id INTEGER,
    domain TEXT
  );
  CREATE INDEX idx_chapters_region ON chapters(region_id);
  CREATE INDEX idx_chapters_lat_lng ON chapters(latitude, longitude);
  CREATE INDEX idx_chapters_city ON chapters(city);
  CREATE INDEX idx_chapters_day ON chapters(meeting_day);
  CREATE INDEX idx_members_chapter ON members(chapter_id);
  CREATE INDEX idx_members_region ON members(region_id);
  CREATE INDEX idx_members_profession ON members(profession_category);
  CREATE INDEX idx_members_city ON members(city);
  CREATE INDEX idx_members_name ON members(full_name);
  CREATE INDEX idx_members_company ON members(company_name);
`);

// ── Load chapters ──
console.log('Loading chapters...');
const chapters: any[] = JSON.parse(fs.readFileSync(CHAPTERS_JSON, 'utf-8'));

// Build regions from chapters
const regionMap = new Map<string, { domain: string; name: string }>();
for (const ch of chapters) {
  const region = ch.region || ch.domain?.replace('bni-', '').replace('.in', '') || '';
  if (region && !regionMap.has(region)) {
    regionMap.set(region, { domain: ch.domain || '', name: region });
  }
}

console.log(`Inserting ${regionMap.size} regions...`);
const insertRegion = db.prepare('INSERT INTO regions (region_name, domain) VALUES (?, ?)');
const regionIds = new Map<string, number>();
for (const [key, val] of regionMap) {
  const info = insertRegion.run(val.name, val.domain);
  regionIds.set(key, Number(info.lastInsertRowid));
}

// Parse meeting schedule
function parseMeetingSchedule(schedule: string): { day: string; time: string } {
  let day = '', time = '';
  if (schedule) {
    const dayMatch = schedule.match(/Every\s+(\w+)/i);
    if (dayMatch) day = dayMatch[1];
    const timeMatch = schedule.match(/(\d{1,2}:\d{2}\s*[AP]M\s*-\s*\d{1,2}:\d{2}\s*[AP]M)/i);
    if (timeMatch) time = timeMatch[1];
  }
  return { day, time };
}

// Parse address into city/state
function parseAddress(address: string): { city: string; state: string } {
  if (!address) return { city: '', state: '' };
  const parts = address.split(',').map(p => p.trim()).filter(Boolean);
  const states = ['Kerala','Karnataka','Maharashtra','Tamil Nadu','Gujarat','Rajasthan',
    'Uttar Pradesh','Telangana','Andhra Pradesh','West Bengal','Madhya Pradesh','Bihar',
    'Odisha','Punjab','Haryana','Chhattisgarh','Jharkhand','Uttarakhand','Goa','Assam',
    'Himachal Pradesh','Chandigarh','Delhi','Pondicherry','Puducherry','Manipur','Meghalaya',
    'Tripura','Sikkim','Nagaland','Mizoram','Arunachal Pradesh','Jammu and Kashmir'];
  
  let state = '', city = '';
  for (const p of parts) {
    if (states.some(s => p.includes(s))) {
      state = states.find(s => p.includes(s)) || '';
    }
  }
  // City is usually 2-3 parts before state
  for (const p of parts) {
    if (p !== state && p !== 'India' && !/^\d+$/.test(p) && p.length > 1 && !states.includes(p)) {
      city = p;
      break;
    }
  }
  return { city, state };
}

console.log(`Inserting ${chapters.length} chapters...`);
const insertChapter = db.prepare(`
  INSERT OR REPLACE INTO chapters (chapter_id, chapter_name, region_id, venue_name, address, city, state,
    latitude, longitude, meeting_day, meeting_time, meeting_schedule, domain, detail_url, org_type)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertChaptersTx = db.transaction(() => {
  for (const ch of chapters) {
    const region = ch.region || ch.domain?.replace('bni-','').replace('.in','') || '';
    const regionId = regionIds.get(region) || null;
    const { day, time } = parseMeetingSchedule(ch.meeting_schedule || '');
    const { city: parsedCity, state } = parseAddress(ch.address || '');
    
    insertChapter.run(
      ch.chapter_id,
      ch.chapter_name || '',
      regionId,
      ch.venue || '',
      ch.address || '',
      parsedCity,
      state,
      ch.lat || null,
      ch.lng || null,
      day,
      time,
      ch.meeting_schedule || '',
      ch.domain || '',
      ch.detail_url || '',
      ch.org_type || ''
    );
  }
});
insertChaptersTx();

// ── Load members ──
console.log('Loading members...');
const members: any[] = JSON.parse(fs.readFileSync(MEMBERS_JSON, 'utf-8'));

function professionCategory(prof: string): string {
  if (!prof) return '';
  const cat = prof.split('>')[0].trim();
  return cat;
}

console.log(`Inserting ${members.length} members...`);
const insertMember = db.prepare(`
  INSERT INTO members (full_name, profession, profession_category, company_name, city, chapter_id, region_id, domain)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

// Build valid chapter ID set + name->id map
const validChapterIds = new Set<number>();
const chapterNameToId = new Map<string, number>();
for (const ch of chapters) {
  if (ch.chapter_id) validChapterIds.add(ch.chapter_id);
  if (ch.chapter_name && ch.chapter_id) {
    chapterNameToId.set(`${ch.domain}|${ch.chapter_name}`, ch.chapter_id);
  }
}

const BATCH = 5000;
let count = 0;
let skippedChapterLinks = 0;
const insertMembersBatch = db.transaction((batch: any[]) => {
  for (const m of batch) {
    const region = m.region || m.domain?.replace('bni-','').replace('.in','') || '';
    const regionId = regionIds.get(region) || null;
    
    // Try to find chapter_id, validate it exists
    let chapterId: number | null = null;
    if (m.chapter_id) {
      const cid = parseInt(m.chapter_id);
      if (validChapterIds.has(cid)) {
        chapterId = cid;
      } else {
        skippedChapterLinks++;
      }
    }
    if (!chapterId && m.chapter && m.domain) {
      chapterId = chapterNameToId.get(`${m.domain}|${m.chapter}`) || null;
    }
    
    insertMember.run(
      m.name || m.full_name || '',
      m.profession || '',
      professionCategory(m.profession || ''),
      m.company || m.company_name || '',
      m.city || '',
      chapterId,
      regionId,
      m.domain || ''
    );
  }
});

let batch: any[] = [];
for (const m of members) {
  batch.push(m);
  if (batch.length >= BATCH) {
    insertMembersBatch(batch);
    count += batch.length;
    process.stdout.write(`\r  ${count}/${members.length}`);
    batch = [];
  }
}
if (batch.length > 0) {
  insertMembersBatch(batch);
  count += batch.length;
}
console.log(`\r  ${count}/${members.length} done (${skippedChapterLinks} unmatched chapter refs)`);

// ── Update counts ──
console.log('Updating counts...');
db.exec(`
  UPDATE chapters SET total_members = (SELECT COUNT(*) FROM members WHERE members.chapter_id = chapters.chapter_id);
  UPDATE regions SET total_chapters = (SELECT COUNT(*) FROM chapters WHERE chapters.region_id = regions.region_id);
  UPDATE regions SET total_members = (SELECT COUNT(*) FROM members WHERE members.region_id = regions.region_id);
`);

// ── Stats ──
const stats = {
  regions: db.prepare('SELECT COUNT(*) as c FROM regions').get() as any,
  chapters: db.prepare('SELECT COUNT(*) as c FROM chapters').get() as any,
  members: db.prepare('SELECT COUNT(*) as c FROM members').get() as any,
};
console.log(`\n✅ Database seeded!`);
console.log(`  Regions:  ${stats.regions.c}`);
console.log(`  Chapters: ${stats.chapters.c}`);
console.log(`  Members:  ${stats.members.c}`);
console.log(`  DB file:  ${DB_PATH}`);

db.close();
