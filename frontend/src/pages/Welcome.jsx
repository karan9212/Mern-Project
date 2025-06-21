import React from 'react';

function Welcome() {
  const userName = localStorage.getItem('name');

  return (
    <div className="container">
      <h2>Welcome, {userName}!</h2>
    </div>
  );
}

export default Welcome;
