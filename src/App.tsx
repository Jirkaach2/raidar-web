import { Suspense, lazy, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import Nav from './components/Nav';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';

/* ── Route-level code splitting ────────────────────────────
   Only the landing page ships in the entry chunk. Everything
   else (docs, blog, auth, dashboard, admin, legal) loads on
   demand, so a first-time visitor downloads a fraction of the
   previous single-bundle payload. */
const Docs = lazy(() => import('./pages/Docs'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Verify = lazy(() => import('./pages/Verify'));
const SteamCallback = lazy(() => import('./pages/SteamCallback'));
const CompleteSteamSignup = lazy(() => import('./pages/CompleteSteamSignup'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Settings = lazy(() => import('./pages/Settings'));
const Admin = lazy(() => import('./pages/Admin'));
const NotFound = lazy(() => import('./pages/NotFound'));
const PrivacyPolicy = lazy(() => import('./pages/legal/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/legal/TermsOfService'));
const RefundPolicy = lazy(() => import('./pages/legal/RefundPolicy'));
const CookiePolicy = lazy(() => import('./pages/legal/CookiePolicy'));
const Blog = lazy(() => import('./pages/Blog'));
const BlogPost = lazy(() => import('./pages/BlogPost'));
const LinkApp = lazy(() => import('./pages/LinkApp'));
const Status = lazy(() => import('./pages/Status'));
const Security = lazy(() => import('./pages/Security'));
const About = lazy(() => import('./pages/About'));
const Changelog = lazy(() => import('./pages/Changelog'));

/** Scroll to top (or to the #hash target) on every navigation. */
function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

/** Minimal placeholder while a lazy route chunk is in flight. */
function RouteFallback() {
  return (
    <div className="route-loading" role="status" aria-live="polite">
      <span className="spinner" />
    </div>
  );
}

export default function App() {
  return (
    <div className="app-shell">
      <ScrollManager />
      <Nav />
      <main className="app-main">
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/docs" element={<Docs />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify" element={<Verify />} />
            <Route path="/auth/steam" element={<SteamCallback />} />
            <Route path="/auth/steam/complete" element={<CompleteSteamSignup />} />
            <Route path="/link-app" element={<LinkApp />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/refunds" element={<RefundPolicy />} />
            <Route path="/cookies" element={<CookiePolicy />} />
            <Route path="/security" element={<Security />} />
            <Route path="/about" element={<About />} />
            <Route path="/changelog" element={<Changelog />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute adminOnly>
                  <Admin />
                </ProtectedRoute>
              }
            />
            <Route path="/status" element={<Status />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
