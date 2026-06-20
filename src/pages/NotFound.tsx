import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="notfound">
      <span className="hud-label hud-label--accent">// Error 404</span>
      <h1>Off the map</h1>
      <p>This page doesn’t exist — or it got raided. Let’s get you back to safety.</p>
      <Link className="btn btn-lg" to="/">Back to base</Link>
    </div>
  );
}
