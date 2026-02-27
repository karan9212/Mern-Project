import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/protected/Dashboard';
import ChangePassword from './pages/protected/ChangePassword';
import Settings from './pages/protected/Settings';
import { ThemeModeProvider } from './context/ThemeModeContext';
import './App.css';

function App() {
  return (
    <ThemeModeProvider>
      <Router>
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/change-password" element={<ChangePassword />} />
        </Routes>
      </Router>
    </ThemeModeProvider>
  );
}

export default App;
