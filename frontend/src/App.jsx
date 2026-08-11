import { Route, Routes, useLocation } from 'react-router-dom';
import NavBar from './components/NavBar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

import Landing from './pages/Landing';
import Signup from './pages/Signup';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import NewEntry from './pages/NewEntry';
import EntryDetail from './pages/EntryDetail';
import Insights from './pages/Insights';
import Settings from './pages/Settings';
import Breakdown from './pages/Breakdown';
import Report from './pages/Report';
import About from './pages/About';
import HowItWorks from './pages/HowItWorks';
import FAQ from './pages/FAQ';
import Resources from './pages/Resources';
import PricingFAQ from './pages/PricingFAQ';
import PrivacyTerms from './pages/PrivacyTerms';

const protect = (element) => <ProtectedRoute>{element}</ProtectedRoute>;

// The footer is a site map, so it belongs on the pages people browse and
// nowhere near the ones they're trying to finish. Auth screens and the signed-in
// app get none of it — a list of marketing links under a half-written journal
// entry is just somewhere else to click.
const FOOTER_PATHS = new Set([
  '/',
  '/about',
  '/how-it-works',
  '/faq',
  '/resources',
  '/pricing-faq',
  '/privacy-and-terms',
]);

function App() {
  const location = useLocation();

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <NavBar />
      {/* Keying on pathname replays the entrance animation per navigation, so a
          route change reads as a new page rather than a content swap. */}
      <div key={location.pathname} className="fade-in flex-1">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth/signup" element={<Signup />} />
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/forgot-password" element={<ForgotPassword />} />
          <Route path="/auth/reset-password" element={<ResetPassword />} />

          <Route path="/about" element={<About />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/pricing-faq" element={<PricingFAQ />} />
          <Route path="/privacy-and-terms" element={<PrivacyTerms />} />

          <Route path="/dashboard" element={protect(<Dashboard />)} />
          <Route path="/entry/new" element={protect(<NewEntry />)} />
          <Route path="/entry/:id" element={protect(<EntryDetail />)} />
          <Route path="/insights" element={protect(<Insights />)} />
          <Route path="/settings" element={protect(<Settings />)} />
          <Route path="/breakdown" element={protect(<Breakdown />)} />
          <Route path="/report" element={protect(<Report />)} />
        </Routes>
      </div>
      {FOOTER_PATHS.has(location.pathname) && <Footer />}
    </div>
  );
}

export default App;
