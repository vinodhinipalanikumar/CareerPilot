import { Navigate } from "react-router-dom";
import { isAuthenticated } from "../utils/auth";

// Wrap any route element with this to require a logged-in user.
// Unauthenticated visitors are redirected to /login.
function ProtectedRoute({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default ProtectedRoute;
