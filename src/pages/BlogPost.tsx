import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Megaphone, FileText } from 'lucide-react';
import { getBySlug } from '../lib/announcements';
import type { Announcement } from '../lib/appwrite';

export default function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    getBySlug(slug).then(setPost).catch(() => setPost(null)).finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="route-loading"><div className="spinner" /><span>Loading…</span></div>;

  if (!post || !post.published) {
    return (
      <div className="container blog-wrap">
        <p className="muted">That post couldn’t be found.</p>
        <Link className="btn btn-ghost btn-sm" to="/blog"><ArrowLeft size={14} /> Back to all posts</Link>
      </div>
    );
  }

  return (
    <article className="container blog-post">
      <Link className="blog-back" to="/blog"><ArrowLeft size={14} /> All posts</Link>
      <div className="blog-card-meta">
        <span className={`blog-tag ${post.type === 'blog' ? 'blog' : ''}`}>
          {post.type === 'blog' ? <FileText size={12} /> : <Megaphone size={12} />}
          {post.type === 'blog' ? 'Blog' : 'Announcement'}
        </span>
        <span className="blog-date mono">{new Date(post.$createdAt).toLocaleDateString()}</span>
        {post.authorName && <span className="muted">· by {post.authorName}</span>}
      </div>
      <h1>{post.title}</h1>
      {post.coverImage && <div className="blog-post-cover"><img src={post.coverImage} alt="" /></div>}
      <div className="blog-post-body">
        {post.body.split(/\n{2,}/).map((para, i) => <p key={i}>{para.split('\n').map((line, j) => <span key={j}>{line}<br /></span>)}</p>)}
      </div>
    </article>
  );
}
