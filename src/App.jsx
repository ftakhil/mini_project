import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import FormPage from './pages/FormPage';
import Dashboard from './pages/Dashboard';
import WorkerDashboard from './pages/WorkerDashboard';
import AdminLogin from './pages/AdminLogin';
import TeamLogin from './pages/TeamLogin';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/form" element={<FormPage />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/team-login" element={<TeamLogin />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/worker" element={<WorkerDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
