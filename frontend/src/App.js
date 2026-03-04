import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Register from './pages/Register';
import Login from './pages/Login';
import Aadhaar from './pages/Aadhaar';
import Overview from './pages/protected/Overview';
import Profile from './pages/protected/Profile';
import Team from './pages/protected/Team';
import Tasks from './pages/protected/Tasks';
import Reports from './pages/protected/Reports';
import Settings from './pages/protected/Settings';
import AllUserData from './pages/protected/AllUserData';
import AllEmployeeData from './pages/protected/AllEmployeeData';
import { ThemeModeProvider } from './context/ThemeModeContext';
import './App.css';

function App() {
  return (
    <ThemeModeProvider>
      <Router>
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/aadhaar" element={<Aadhaar />} />
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Overview />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/team" element={<Team />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/all-users" element={<AllUserData />} />
          <Route path="/all-employees" element={<AllEmployeeData />} />
        </Routes>
      </Router>
    </ThemeModeProvider>
  );
}

export default App;
