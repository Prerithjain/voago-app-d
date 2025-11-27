import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import TripPlanner from './pages/TripPlanner';
import Expenses from './pages/Expenses';
import NotFound from './pages/NotFound';
import TripDetails from './pages/TripDetails';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/trip-planner" element={<TripPlanner />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/trip-details/:id" element={<TripDetails />} /> {/* Added TripDetails route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
