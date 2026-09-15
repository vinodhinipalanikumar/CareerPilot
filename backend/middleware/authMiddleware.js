const jwt = require("jsonwebtoken");

// Verifies the Bearer token on incoming requests and attaches
// the decoded payload (contains the user id) to req.user.
// Not wired into any route yet in this step — available for
// protecting future API endpoints (e.g. GET /api/auth/me).
function protect(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Not authorized, invalid token" });
  }
}

module.exports = protect;
