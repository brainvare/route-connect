// Shared utility to load chunked members data
export interface Member {
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

export async function loadAllMembers(): Promise<Member[]> {
  const idx = await fetch('/data/members/index.json').then(r => r.json());
  const chunks = await Promise.all(
    idx.files.map((f: string) => fetch(`/data/members/${f}`).then(r => r.json()))
  );
  return chunks.flat();
}
