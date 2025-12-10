import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Welcome() {
  const navigate = useNavigate();
  const name = localStorage.getItem('name');
  const id = localStorage.getItem('userId');
  const sessionExpiry = localStorage.getItem('sessionExpiry');

  useEffect(() => {
    const now = new Date().getTime();
    if (!name || !sessionExpiry || now > Number(sessionExpiry)) {
      handleLogout(); // logout if expired
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('name');
    localStorage.removeItem('userId');
    localStorage.removeItem('sessionExpiry');
    alert('You have been logged out.');
    navigate('/');
  };

  return (
    <div className="container">
      <h2>Welcome {name}</h2>
      <p>Your ID is: <strong>{id}</strong></p>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}

export default Welcome;
