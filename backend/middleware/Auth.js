import jwt from "jsonwebtoken";


const JWT_SECRET=process.env.JWT_SECRET 


const verifyToken = (req, res, next) => {
  // 1️⃣ Check token in cookie first
  const token = req.cookies?.TMSAuthToken;


  if (!token) {
    console.log("❌ No token found in cookies");
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    // 2️⃣ Verify JWT
    const decoded = jwt.verify(token, JWT_SECRET);
req.user = { id: decoded.id, role: decoded.role, email: decoded.email, name: decoded.name };

    // 3️⃣ Attach user info to request
    req.user = {
      id: decoded.id,
      role: decoded.role,
      email: decoded.email,
      name: decoded.name,
      slackId: decoded.slackId
    };

    next();
  } catch (err) {
    console.log("❌ Token verification failed:", err.message);
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

export default verifyToken;
