import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function NavBar() {
  const { user, signOut } = useAuth();

  return (
    <nav className="flex items-center justify-between border-b border-calm-200 bg-white px-6 py-4">
      <Link to={user ? '/dashboard' : '/'} className="text-lg font-semibold text-calm-700">
        MindJournal
      </Link>
      {user && (
        <div className="flex items-center gap-4 text-sm">
          <Link to="/dashboard" className="text-calm-600 hover:text-calm-800">
            Dashboard
          </Link>
          <Link to="/insights" className="text-calm-600 hover:text-calm-800">
            Insights
          </Link>
          <Link to="/settings" className="text-calm-600 hover:text-calm-800">
            Settings
          </Link>
          <button
            onClick={signOut}
            className="rounded-md border border-calm-300 px-3 py-1.5 text-calm-700 hover:bg-calm-100"
          >
            Log out
          </button>
        </div>
      )}
    </nav>
  );
}
