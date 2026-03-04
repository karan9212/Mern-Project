import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Alert, Snackbar } from '@mui/material';

function Navbar() {
  const navigate = useNavigate();
  const name = localStorage.getItem('name');
  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  const closeToast = (_, reason) => {
    if (reason === 'clickaway') return;
    setToast((prev) => ({ ...prev, open: false }));
  };

  return (
    <>
      <nav className="navbar">
        <h1 className="navbar-logo">MyApp</h1>
        <ul className="navbar-links">
          {name ? (
            <>
              <li>Hello, {name}</li>
              <li>
                <button
                  onClick={() => {
                    localStorage.removeItem('name');
                    localStorage.removeItem('userId');
                    localStorage.removeItem('sessionExpiry');
                    setToast({ open: true, message: 'You have been logged out.', severity: 'info' });
                    setTimeout(() => navigate('/'), 250);
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
      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={closeToast}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={closeToast} severity={toast.severity} variant="filled" sx={{ width: '100%' }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </>
  );
}

export default Navbar;
