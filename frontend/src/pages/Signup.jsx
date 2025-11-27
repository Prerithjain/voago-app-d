import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const Signup = () => {
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        password: '',
        confirm_password: ''
    });
    const navigate = useNavigate();
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirm_password) {
            setError("Passwords do not match!");
            return;
        }
        try {
            await axios.post('http://localhost:8000/api/auth/signup', formData, { withCredentials: true });
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.detail || "Signup failed");
        }
    };

    return (
        <div className="min-h-screen bg-sand flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md"
            >
                <h1 className="text-3xl font-bold text-navy mb-6 text-center">Join Voyago</h1>
                {error && <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</div>}

                <form onSubmit={handleSignup} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Full Name</label>
                        <input
                            type="text"
                            name="full_name"
                            className="mt-1 block w-full rounded-2xl border-gray-300 shadow-sm p-3 bg-gray-50 focus:ring-teal focus:border-teal"
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                            type="email"
                            name="email"
                            className="mt-1 block w-full rounded-2xl border-gray-300 shadow-sm p-3 bg-gray-50 focus:ring-teal focus:border-teal"
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <input
                            type="password"
                            name="password"
                            className="mt-1 block w-full rounded-2xl border-gray-300 shadow-sm p-3 bg-gray-50 focus:ring-teal focus:border-teal"
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
                        <input
                            type="password"
                            name="confirm_password"
                            className="mt-1 block w-full rounded-2xl border-gray-300 shadow-sm p-3 bg-gray-50 focus:ring-teal focus:border-teal"
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        className="w-full btn-primary mt-4"
                    >
                        Create Account
                    </motion.button>
                </form>
                <div className="mt-4 text-center">
                    <p className="text-sm text-gray-600">
                        Already have an account? <Link to="/login" className="text-teal font-bold hover:underline">Log In</Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default Signup;
