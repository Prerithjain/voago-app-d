import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        // Clear cookie logic here if needed, or just redirect
        document.cookie = "session_user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        navigate('/login');
    };

    return (
        <nav className="bg-navy text-white p-4 shadow-lg sticky top-0 z-50">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                <Link to="/dashboard" className="text-2xl font-bold flex items-center gap-2">
                    <span>🌍</span> Voyago Lite
                </Link>

                <div className="flex items-center gap-6">
                    <Link to="/dashboard" className="hover:text-teal transition-colors font-medium">Home</Link>
                    <Link to="/expenses" className="hover:text-teal transition-colors font-medium">Expenses</Link>
                    <button
                        onClick={handleLogout}
                        className="bg-coral text-navy px-4 py-1.5 rounded-xl font-bold hover:bg-opacity-90 transition-all text-sm"
                    >
                        Logout
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
