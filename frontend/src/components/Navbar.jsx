import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { isAuthenticated, logout, onAuthChange } from "../utils/auth";

function Navbar() {
  const navigate = useNavigate();
  // Reactive, not just computed once at mount: isAuthenticated() also
  // validates token expiry now (see utils/auth.js), and onAuthChange lets
  // this update immediately after a login/logout elsewhere in the app,
  // instead of only being correct after a full remount.
  const [loggedIn, setLoggedIn] = useState(() => isAuthenticated());

  useEffect(() => {
    setLoggedIn(isAuthenticated());
    return onAuthChange(() => setLoggedIn(isAuthenticated()));
  }, []);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <nav className="bg-white shadow">
  <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">

    <Link
      to="/"
      className="text-2xl font-bold text-blue-600"
    >
      CareerPilot
    </Link>

    <ul className="flex flex-wrap justify-center gap-4 md:gap-8 text-sm md:text-base font-medium">
      <li>
        <Link to="/" className="hover:text-blue-600">
          Home
        </Link>
      </li>

      <li>
        <Link
          to="/how-it-works"
          className="hover:text-blue-600"
        >
          How It Works
        </Link>
      </li>

      {loggedIn ? (
        <>
          <li>
            <Link to="/dashboard" className="hover:text-blue-600">
              Dashboard
            </Link>
          </li>
          <li>
            <button
              onClick={handleLogout}
              className="hover:text-blue-600"
            >
              Logout
            </button>
          </li>
        </>
      ) : (
        <li>
          <Link
            to="/login"
            className="hover:text-blue-600"
          >
            Login
          </Link>
        </li>
      )}
    </ul>

  </div>
</nav>
  );
}

export default Navbar;