import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
    return (
        <div className="min-h-screen bg-sand flex flex-col items-center justify-center text-center p-4">
            <h1 className="text-6xl font-bold text-navy mb-4">404</h1>
            <p className="text-xl text-gray-600 mb-8">Oops! Looks like you're lost.</p>
            <Link to="/dashboard" className="btn-primary">Go Home</Link>
        </div>
    );
};

export default NotFound;
