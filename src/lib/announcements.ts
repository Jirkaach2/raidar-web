import { databases, DB_ID, ANNOUNCEMENTS_COLLECTION_ID, Query, type Announcement } from './appwrite';

/** Pinned first, then newest. */
function sortPosts(list: Announcement[]): Announcement[] {
  return [...list].sort((a, b) => {
    if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
    return +new Date(b.$createdAt) - +new Date(a.$createdAt);
  });
}

export async function listPublished(limit = 30): Promise<Announcement[]> {
  const res = await databases.listDocuments<Announcement>(DB_ID, ANNOUNCEMENTS_COLLECTION_ID, [
    Query.equal('published', true), Query.orderDesc('$createdAt'), Query.limit(limit),
  ]);
  return sortPosts(res.documents);
}

export async function latestPublished(): Promise<Announcement | null> {
  const list = await listPublished(5);
  return list[0] || null;
}

export async function getBySlug(slug: string): Promise<Announcement | null> {
  const res = await databases.listDocuments<Announcement>(DB_ID, ANNOUNCEMENTS_COLLECTION_ID, [
    Query.equal('slug', slug), Query.limit(1),
  ]);
  return res.documents[0] || null;
}

/** Admin: list everything including drafts. */
export async function listAll(limit = 100): Promise<Announcement[]> {
  const res = await databases.listDocuments<Announcement>(DB_ID, ANNOUNCEMENTS_COLLECTION_ID, [
    Query.orderDesc('$createdAt'), Query.limit(limit),
  ]);
  return sortPosts(res.documents);
}

export function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}
