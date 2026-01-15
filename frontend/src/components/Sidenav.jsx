import React from "react";
import { Link, useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();
  const name = localStorage.getItem("name");
  return (
    <nav className="navbar">
      <h1 className="navbar-logo">MyApp</h1>
      <ul className="navbar-links">
        {name ? (
          <>
            <li>Hello, {name}</li>
            <li>
              <button
                onClick={() => {
                  localStorage.removeItem("name");
                  localStorage.removeItem("userId");
                  localStorage.removeItem("sessionExpiry");
                  alert("You have been logged out.");
                  navigate("/");
                }}
              >
                Logout
              </button>
            </li>
          </>
        ) : (
          <>
            <li>
              <Link to="/login">Login</Link>
            </li>
            <li>
              <Link to="/register">Register</Link>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
}
export default Navbar;