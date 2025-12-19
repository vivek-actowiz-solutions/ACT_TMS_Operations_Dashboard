import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";

// Define the type of the decoded JWT payload
interface DecodedToken {
  _id?: string;
  name?: string;
  email?: string;
  role?: string;
  exp?: number; // optional: token expiry
}

interface User {
  id: any;
  name: string;
  email: string;
  role: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User>({
    id: "",
    name: "",
    email: "",
    role: "",
  });

  useEffect(() => {
    const token = Cookies.get("TMSAuthToken"); // read JWT from cookies
    if (token) {
      try {
        const decoded = jwtDecode<DecodedToken>(token); // type-safe decode
        setUser({
          name: decoded.name || "User",
          email: decoded.email || "",
          role: decoded.role || "",
          id: decoded._id || "",
        });
      } catch (error) {
        console.error("Invalid JWT token:", error);
        setUser({ name: "", email: "", role: "", id: "" });
      }
    }
  }, []);

  const logout = () => {
    Cookies.remove("TMSAuthToken"); // remove token cookie
    window.location.href = "/TMS-operations/login"; // redirect to login
  };

  return { user, logout, role: user.role };
};
