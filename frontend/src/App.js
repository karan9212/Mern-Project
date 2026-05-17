import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import { ThemeModeProvider } from './context/ThemeModeContext';
import PageLoader from './components/common/PageLoader';
import './App.css';

const Register = lazy(() => import('./pages/Register'));
const Login = lazy(() => import('./pages/Login'));
const Aadhaar = lazy(() => import('./pages/Aadhaar'));
const Product = lazy(() => import('./pages/Product'));
const Seller = lazy(() => import('./pages/Seller'));
const ManageHub = lazy(() => import('./pages/ManageHub'));
const Dashboard = lazy(() => import('./pages/protected/Dashboard'));
const AllUserData = lazy(() => import('./pages/protected/AllUserData'));
const AllEmployeeData = lazy(() => import('./pages/protected/AllEmployeeData'));

function App() {
  return (
    <ThemeModeProvider>
      <Router>
        <Suspense fallback={<PageLoader message="Loading page..." minHeight="100vh" />}>
          <Routes>
            <Route path="/register" element={<Register />} />
            <Route path="/aadhaar" element={<Aadhaar />} />
            <Route path="/products" element={<Product />} />
            <Route path="/sellers" element={<Seller />} />
            <Route path="/manage-hub" element={<ManageHub />} />
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/profile" element={<Dashboard />} />
            <Route path="/dashboard/attendance" element={<Dashboard />} />
            <Route path="/dashboard/leave" element={<Dashboard />} />
            <Route path="/dashboard/team" element={<Dashboard />} />
            <Route path="/dashboard/documents" element={<Dashboard />} />
            <Route path="/dashboard/announcements" element={<Dashboard />} />
            <Route path="/dashboard/support" element={<Dashboard />} />
            <Route path="/dashboard/manage-team" element={<Dashboard />} />
            <Route path="/dashboard/tasks" element={<Dashboard />} />
            <Route path="/dashboard/reports" element={<Dashboard />} />
            <Route path="/dashboard/settings" element={<Dashboard />} />
            <Route path="/profile" element={<Navigate to="/dashboard/profile" replace />} />
            <Route path="/team" element={<Navigate to="/dashboard/team" replace />} />
            <Route path="/tasks" element={<Navigate to="/dashboard/tasks" replace />} />
            <Route path="/reports" element={<Navigate to="/dashboard/reports" replace />} />
            <Route path="/settings" element={<Navigate to="/dashboard/settings" replace />} />
            <Route path="/all-users" element={<AllUserData />} />
            <Route path="/all-employees" element={<AllEmployeeData />} />
          </Routes>
        </Suspense>
      </Router>
    </ThemeModeProvider>
  );
}

export default App;
