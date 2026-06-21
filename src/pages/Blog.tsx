import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Megaphone, FileText, Pin } from 'lucide-react';
import { listPublished } from '../lib/announcements';
import type { Announcement } from '../lib/appwrite';

export default function Blog() {
  const [posts, setPosts] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listPublished(50).then(setPosts).catch(() => setPosts([])).finally(() => setLoading(false));
  }, []);

  return (
    <div className="container blog-wrap">
      <header className="blog-header">
        <span className="hud-label hud-label--accent">// Newsroom</span>
        <h1>Announcements &amp; updates</h1>
        <p className="muted">Patch notes, new features and news from the Raidar team.</p>
      </header>

      {loading ? (
        <div className="route-loading"><div className="spinner" /><span>Loading…</span></div>
      ) : posts.length === 0 ? (
        <p className="muted">No posts yet — check back soon.</p>
      ) : (
        <div className="blog-grid">
          {posts.map((p) => (
            <Link to={`/blog/${p.slug}`} key={p.$id} className="blog-card bracketed">
              {p.coverImage && <div className="blog-card-cover"><img src={p.coverImage} alt="" /></div>}
              <div className="blog-card-body">
                <div className="blog-card-meta">
                  <span className={`blog-tag ${p.type === 'blog' ? 'blog' : ''}`}>
                    {p.type === 'blog' ? <FileText size={12} /> : <Megaphone size={12} />}
                    {p.type === 'blog' ? 'Blog' : 'Announcement'}
                  </span>
                  {p.pinned && <span className="blog-pin"><Pin size={12} /> Pinned</span>}
                  <span className="blog-date mono">{new Date(p.$createdAt).toLocaleDateString()}</span>
                </div>
                <h2>{p.title}</h2>
                {p.excerpt && <p className="muted">{p.excerpt}</p>}
                <span className="blog-readmore">Read more →</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
