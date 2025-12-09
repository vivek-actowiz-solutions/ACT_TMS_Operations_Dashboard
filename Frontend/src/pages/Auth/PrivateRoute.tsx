// import { Navigate, Outlet } from "react-router";
// import { isTokenValid } from "./auth";

// export default function PrivateRoute() {
//   return isTokenValid() ? <Outlet /> : <Navigate to="/login" replace />;
// }
import { Navigate, Outlet } from "react-router";
import Cookies from "js-cookie";

interface TokenPayload {
  id: string;
  email: string;
  role: string;
  name?: string;
  exp?: number;
}

// Decode JWT token from cookie
function decodeToken(): TokenPayload | null {
  const token = Cookies.get("TMSAuthToken");
  console.log("Token from cookie:", token);

  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    console.log("Decoded payload:", payload);
    return payload;
  } catch (err) { 
    console.error("Invalid token", err);
    return null;
  }
}

// Check if token exists and is not expired
function isTokenValid(): boolean {
  const decoded = decodeToken();
  if (!decoded || !decoded.exp) return false;

  const now = Date.now() / 1000; // current time in seconds
  return decoded.exp > now;
}

export default function PrivateRoute() {
  return isTokenValid() ? <Outlet /> : <Navigate to="/TMS-operations/login" replace />;
}