import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import RocketTransition from "../components/RocketTransition";

// Teddy Face Component
function TeddyFace({ state }) {
    const closed = state === "cover_eyes" || state === "close_eyes";
    const lookBack = state === "look_back";

    return (
        <div className="relative w-full h-full flex items-center justify-center">
            <svg width="220" height="220" viewBox="0 0 220 220" className="drop-shadow-xl">
                <circle cx="110" cy="110" r="90" fill="#E6B17E" />
                <circle cx="55" cy="55" r="35" fill="#E6B17E" />
                <circle cx="55" cy="55" r="20" fill="#D49E6A" />
                <circle cx="165" cy="55" r="35" fill="#E6B17E" />
                <circle cx="165" cy="55" r="20" fill="#D49E6A" />

                {!closed && <circle cx={80 + (lookBack ? -8 : 0)} cy="110" r="10" fill="#333" />}
                {closed && <rect x={70 + (lookBack ? -8 : 0)} y="108" width="20" height="6" rx="3" fill="#333" />}
                {!closed && <circle cx={140 + (lookBack ? -8 : 0)} cy="110" r="10" fill="#333" />}
                {closed && <rect x={130 + (lookBack ? -8 : 0)} y="108" width="20" height="6" rx="3" fill="#333" />}

                <circle cx="110" cy="135" r="12" fill="#333" />
                <path d="M80 150 Q110 175 140 150" stroke="#333" strokeWidth="6" fill="none" strokeLinecap="round" />
            </svg>
        </div>
    );
}

// Login Component
export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [anim, setAnim] = useState("idle");
    const [showRocket, setShowRocket] = useState(false);
    const passwordRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (password.length > 0) {
            setAnim("close_eyes");
        } else if (document.activeElement === passwordRef.current) {
            setAnim("cover_eyes");
        } else {
            setAnim("idle");
        }
    }, [password]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setAnim("close_eyes");
        try {
            const res = await axios.post(
                "http://localhost:8000/api/auth/login",
                { email, password },
                { withCredentials: true }
            );
            if (res.data.user) {
                setShowRocket(true);
                setTimeout(() => navigate("/dashboard"), 1500);
            }
        } catch (err) {
            console.error(err);
            setAnim("shake_head");
            setTimeout(() => setAnim("idle"), 1500);
        }
    };

    return (
        <>
            {showRocket && <RocketTransition />}
            <div className="min-h-screen bg-sand flex items-center justify-center p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden">
                    <div className="bg-navy p-8 flex flex-col items-center justify-center relative">
                        <h2 className="text-white text-3xl font-bold mb-4 z-10">Welcome Back!</h2>
                        <div className="w-full h-64 md:h-96 flex items-center justify-center">
                            <motion.div
                                animate={{ x: anim === "shake_head" ? [0, -10, 10, -10, 10, 0] : 0 }}
                                transition={{ duration: 0.6 }}
                            >
                                <TeddyFace state={anim} />
                            </motion.div>
                        </div>
                        <p className="text-teal text-sm mt-4 text-center">Watch Teddy react as you type!</p>
                    </div>

                    <div className="p-8 flex flex-col justify-center">
                        <h1 className="text-3xl font-bold text-navy mb-6">Login to Voyago</h1>
                        <form onSubmit={handleLogin} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Email</label>
                                <input
                                    type="email"
                                    className="mt-1 block w-full rounded-2xl border-gray-300 shadow-sm focus:border-teal focus:ring focus:ring-teal p-3 bg-gray-50"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    onFocus={() => setAnim("look_back")}
                                    onBlur={() => setAnim(password.length ? "close_eyes" : "idle")}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Password</label>
                                <input
                                    ref={passwordRef}
                                    type="password"
                                    className="mt-1 block w-full rounded-2xl border-gray-300 shadow-sm focus:border-teal focus:ring focus:ring-teal p-3 bg-gray-50"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onFocus={() => setAnim("cover_eyes")}
                                    onBlur={() => setAnim(password.length ? "close_eyes" : "idle")}
                                    required
                                />
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                className="w-full btn-primary"
                            >
                                Sign In
                            </motion.button>
                        </form>

                        <div className="mt-4 text-center">
                            <p className="text-sm text-gray-600">
                                Don't have an account? <Link to="/signup" className="text-teal font-bold">Sign Up</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
