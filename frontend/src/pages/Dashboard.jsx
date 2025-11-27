import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useAnimation } from 'framer-motion';
import axios from 'axios';
import Navbar from '../components/Navbar';
import MapComponent from '../components/MapComponent';

// --- HeroMascot Function (Placed above Dashboard) ---
// (No changes needed in the SVG itself, just ensuring it's available)
function HeroMascot({ selectedCity, isActive }) {
    const controls = useAnimation();
    const pinned = Boolean(selectedCity);
    
    // Simplified city coordinates for pin visualization on the compass/map area
    const cityCoordinates = { 
        'New York': { x: -30, y: -40 },
        'Tokyo': { x: 45, y: 15 },
        'London': { x: -10, y: -25 },
        'Select City...': { x: 0, y: 0 } 
    };
    const pinPosition = cityCoordinates[selectedCity] || cityCoordinates['Select City...'];


    // Animation: Map Spin & Launch
    useEffect(() => {
        if (isActive) {
            // Rapid spin during launch
            controls.start({
                rotate: 720, 
                transition: { duration: 1.0, ease: 'easeOutQuint' },
            }).then(() => controls.set({ rotate: 360 })); 
        } else {
            // Idle, slow, continuous rotation
            controls.start({
                rotate: 360,
                transition: { repeat: Infinity, duration: 40, ease: 'linear' },
            });
        }
    }, [isActive, controls]);

    // Idle pulse animation for the central Gold star
    const starControls = useAnimation();
    useEffect(() => {
        starControls.start({
            scale: [1, 1.05, 1],
            transition: { repeat: Infinity, duration: 3, ease: 'easeInOut' }
        });
    }, [starControls]);

    return (
        <div className="w-full h-full flex items-center justify-center pointer-events-none">
            <svg viewBox="0 0 360 240" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
                <defs>
                    <linearGradient id="skyGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#1e293b" /> 
                        <stop offset="100%" stopColor="#0f172a" /> 
                    </linearGradient>
                </defs>

                {/* Background card (Slate/Navy) */}
                <rect x="0" y="0" width="360" height="240" rx="16" fill="url(#skyGradient)" />

                {/* Star Field/Subtle Background Dots */}
                <circle cx="50" cy="50" r="1.5" fill="rgba(255,255,255,0.2)" />
                <circle cx="300" cy="180" r="1.0" fill="rgba(255,255,255,0.3)" />
                <circle cx="100" cy="20" r="0.8" fill="rgba(255,255,255,0.1)" />

                {/* 🧭 Compass Ring Group (Centered) */}
                <g transform="translate(180, 120)">
                    {/* Orbit Ring (Teal) */}
                    <motion.circle
                        cx="0" cy="0" r="100" 
                        stroke="#20c997" // Vibrant Teal
                        strokeWidth="3" fill="none" 
                        initial={{ opacity: 0.5 }}
                        animate={{ opacity: [0.5, 0.7, 0.5] }}
                        transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
                    />

                    {/* Inner Map/Compass Face - Rotates */}
                    <motion.g
                        animate={controls}
                        initial={{ rotate: 0 }}
                    >
                        {/* Map Background Circle (Darker Teal) */}
                        <circle cx="0" cy="0" r="80" fill="#0f766e" />
                        
                        {/* Compass Axes (White Lines) */}
                        <line x1="-80" y1="0" x2="80" y2="0" stroke="white" strokeWidth="1" opacity="0.4" />
                        <line x1="0" y1="-80" x2="0" y2="80" stroke="white" strokeWidth="1" opacity="0.4" />
                        <line x1="-56" y1="-56" x2="56" y2="56" stroke="white" strokeWidth="1" opacity="0.2" />
                        <line x1="-56" y1="56" x2="56" y2="-56" stroke="white" strokeWidth="1" opacity="0.2" />

                        {/* Compass Needle (Coral Accent) */}
                        <path 
                            d="M0 -75 L10 -10 L10 10 L0 75 L-10 10 L-10 -10 Z" 
                            fill="#f97373" // Coral Red
                            transform="rotate(45)"
                        />
                        
                        {/* 📌 Pulsing Pin on Selected City */}
                        {pinned && (
                            <g transform={`translate(${pinPosition.x}, ${pinPosition.y})`}>
                                <motion.circle
                                    r={10}
                                    fill="rgba(249,115,115,0.4)" // Soft Coral glow
                                    animate={{ scale: [1, 2.0, 1] }}
                                    transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
                                />
                                <circle r={5} fill="#f97373" stroke="#fff" strokeWidth="1.5" />
                            </g>
                        )}
                        
                    </motion.g>

                    {/* Central Gold Star/Pivot Point (Non-rotating) */}
                    <motion.g animate={starControls}>
                        {/* Simple 4-point star for navigation focus */}
                        <path d="M0 -15 L3 -3 L15 0 L3 3 L0 15 L-3 3 L-15 0 L-3 -3 Z" fill="#facc15" /> 
                    </motion.g>
                    
                </g>


                {/* Caption */}
                <g transform="translate(18,200)">
                    <text x="0" y="0" fill="#99f6e4" fontSize="16" fontWeight="700">Voyago</text>
                    <text x="0" y="20" fill="#a5f3fc" fontSize="12">Map your perfect journey.</text>
                </g>
            </svg>
        </div>
    );
}

// -----------------------------
// Dashboard (Implementation of fixes)
// -----------------------------
const Dashboard = () => {
    // ... (State variables remain the same)
    const [user, setUser] = useState(null);
    const [trips, setTrips] = useState([]);
    const [cities, setCities] = useState([]);
    const [cityData, setCityData] = useState([]);

    const [selectedCity, setSelectedCity] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [budget, setBudget] = useState(50000);
    const [showMapModal, setShowMapModal] = useState(false);
    const [showSurpriseModal, setShowSurpriseModal] = useState(false); 
    const [planeActive, setPlaneActive] = useState(false); 

    const navigate = useNavigate();

    // ... (useEffect, fetchTrips, handleDelete, handleStartPlanning functions remain the same)
    useEffect(() => {
        const u = document.cookie.split('; ').find(row => row.startsWith('session_user='));
        const userId = u ? u.split('=')[1] : '1';
        setUser({ id: userId });
        fetchTrips(userId);

        axios.get('http://localhost:8000/api/filters').then(res => {
            setCities(res.data.cities || []);
            setCityData(res.data.city_data || []);
        }).catch(err => {
            console.error('Failed to fetch filters. Check API server.', err);
            setCities(['New York', 'Tokyo', 'London']); 
            setCityData([{City: 'New York', lat: 40.71, lon: -74.00}, {City: 'Tokyo', lat: 35.68, lon: 139.75}, {City: 'London', lat: 51.50, lon: 0.12}]);
        });
    }, []);

    const fetchTrips = async (userId) => {
        try {
            const res = await axios.get(`http://localhost:8000/api/trips/user/${userId}`);
            setTrips(res.data || []);
        } catch (err) {
            console.error("Failed to fetch trips. Check API server.", err);
        }
    };

    const handleDelete = async (tripId) => {
        if (!window.confirm("Are you sure you want to delete this itinerary?")) return;
        try {
            await axios.delete(`http://localhost:8000/api/trips/${tripId}`);
            fetchTrips(user.id);
        } catch (err) {
            alert("Failed to delete trip");
        }
    };

    const handleStartPlanning = () => {
        if (selectedCity && startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (start < today) {
                return alert("Start date cannot be in the past");
            }
            if (end < start) {
                return alert("End date must be after start date");
            }

            const diffTime = end - start;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

            if (diffDays <= 0) {
                return alert("Invalid date range");
            }

            setPlaneActive(true);
            setTimeout(() => {
                setPlaneActive(false);
                navigate(`/trip-planner?city=${encodeURIComponent(selectedCity)}&start=${startDate}&end=${endDate}&budget=${budget}&days=${diffDays}`);
            }, 900);
        }
    };

    const handleSurpriseMe = async () => {
        try {
            const res = await axios.get('http://localhost:8000/api/surprise-destination');
            
            setSelectedCity(res.data.city); 
            setShowSurpriseModal(true);

        } catch (err) {
            console.error('Failed to get surprise destination', err);
            const randomCity = cities[Math.floor(Math.random() * cities.length)];
            setSelectedCity(randomCity);
            setShowSurpriseModal(true);
        }
    };

    const closeSurpriseModal = (confirm = false) => {
        setShowSurpriseModal(false);
    };


    return (
        <div className="min-h-screen bg-sand">
            <Navbar /> 

            {/* Hero Section */}
            <div className="bg-navy text-white py-20 px-8 relative overflow-hidden">
                <div className="max-w-7xl mx-auto relative z-10 flex"> {/* <--- FIX: Use flex to divide space */}
                    
                    {/* Left Column: Text and Input Card (Occupies 55% of container) */}
                    <div className="w-[55%] pr-10"> 
                        <motion.h1
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="text-5xl font-bold mb-6"
                        >
                            Where to next?
                        </motion.h1>
                        <p className="text-xl text-teal mb-8 max-w-2xl">
                            Select a city, pick your dates, and set your budget to start planning.
                        </p>

                        <div className="bg-white p-6 rounded-2xl shadow-lg w-full grid grid-cols-4 gap-4 text-navy">
                            
                            {/* Row 1: Destination & Map Button */}
                            {/* Destination Dropdown (Span 2 columns) */}
                            <div className="col-span-2 relative"> 
                                <label className="block text-xs font-bold text-gray-500 mb-1">Destination</label>
                                <select
                                    className="w-full p-2 rounded-lg bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-teal"
                                    value={selectedCity}
                                    onChange={(e) => setSelectedCity(e.target.value)}
                                >
                                    <option value="">Select City...</option>
                                    {cities.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <button
                                    onClick={() => setShowMapModal(true)}
                                    className="w-full mt-2 p-2 rounded-lg bg-blue-50 border-2 border-blue-300 text-blue-700 font-bold hover:bg-blue-100 transition-all flex items-center justify-center gap-2"
                                >
                                    📍 Select on Map
                                </button>
                            </div>
                            
                            {/* Surprise Me Button (Span 2 columns, placed neatly beside Destination) */}
                            <div className="col-span-2 flex items-stretch"> {/* Use items-stretch to make button fill height */}
                                <motion.button
                                    onClick={handleSurpriseMe}
                                    className="w-full mt-6 p-2 rounded-xl font-extrabold text-white text-lg transition-all shadow-md flex flex-col items-center justify-center"
                                    // <--- FIX: New gradient using Teal and Coral for theme blending
                                    style={{ background: 'linear-gradient(135deg, #14b8a6, #f97373)' }} 
                                    whileHover={{ scale: 1.03, rotate: 1 }}
                                    whileTap={{ scale: 0.97 }}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                >
                                    🎲 Surprise Me! 
                                    <span className='text-xs font-normal opacity-90 mt-1'>I'm feeling lucky</span>
                                </motion.button>
                            </div>

                            {/* Row 2: Dates */}
                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-gray-500 mb-1">Start Date</label>
                                <input
                                    type="date"
                                    className="w-full p-2 rounded-lg bg-gray-50 border border-gray-200"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-gray-500 mb-1">End Date</label>
                                <input
                                    type="date"
                                    className="w-full p-2 rounded-lg bg-gray-50 border border-gray-200"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    min={startDate || new Date().toISOString().split('T')[0]}
                                />
                            </div>
                            
                            {/* Row 3: Budget and Plan Button */}
                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-gray-500 mb-1">Budget</label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        className="flex-1 p-2 rounded-lg bg-gray-50 border border-gray-200"
                                        value={budget}
                                        onChange={(e) => setBudget(e.target.value)}
                                        placeholder="50000"
                                    />
                                    <select
                                        className="p-2 rounded-lg bg-gray-50 border border-gray-200 text-sm font-bold"
                                        defaultValue="INR"
                                    >
                                        <option value="INR">₹ INR</option>
                                        <option value="USD">$ USD</option>
                                        <option value="EUR">€ EUR</option>
                                        <option value="GBP">£ GBP</option>
                                        <option value="JPY">¥ JPY</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-gray-500 mb-1 invisible">Placeholder</label>
                                <button
                                    onClick={handleStartPlanning}
                                    disabled={!selectedCity || !startDate || !endDate}
                                    className={`w-full py-3 rounded-xl font-bold transition-all transform ${selectedCity && startDate && endDate && budget
                                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:scale-105 hover:shadow-xl'
                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        }`}
                                >
                                    {selectedCity && startDate && endDate && budget ? '🚀 Explore & Plan' : 'Fill All Fields to Continue'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Hero Mascot (Occupies 45% of container) */}
                    <div className="w-[45%] flex items-center justify-start h-[320px]"> {/* <--- FIX: Ensure height and alignment */}
                        <div style={{ width: '420px', height: '320px' }}>
                            <HeroMascot
                                selectedCity={selectedCity}
                                isActive={planeActive}
                            />
                        </div>
                    </div>

                </div>
            </div>

            {/* Surprise Destination Modal (No changes needed here, as the problem was the button/layout) */}
            {showSurpriseModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm p-4">
                    <motion.div
                        initial={{ opacity: 0, y: -50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        transition={{ duration: 0.3 }}
                        className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl text-navy relative"
                    >
                        <button
                            onClick={() => closeSurpriseModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-navy transition-colors text-2xl"
                        >
                            ✕
                        </button>
                        <div className='text-center'>
                            <p className='text-6xl mb-4'>🎉</p>
                            <h2 className="text-3xl font-bold mb-3">You're going to...</h2>
                            <p className="text-5xl font-extrabold text-coral uppercase tracking-wider mb-6">
                                {selectedCity}
                            </p>
                            <p className="text-gray-600 mb-6">
                                The **Voyago Randomizer** has selected your next adventure! Now, fill in your dates and budget to start planning this spontaneous trip.
                            </p>
                            <button
                                onClick={() => closeSurpriseModal(false)}
                                className="w-full py-3 rounded-xl bg-teal text-white font-bold text-lg hover:bg-emerald-600 transition-colors"
                            >
                                Awesome! Let's Plan
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Map Modal */}
            {showMapModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl w-full max-w-5xl h-[80vh] relative shadow-2xl overflow-hidden flex flex-col">
                        <div className="p-6 border-b flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-navy">Select a Destination</h2>
                            <button
                                onClick={() => setShowMapModal(false)}
                                className="bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="flex-1 relative">
                            <MapComponent
                                places={cityData.map(c => ({
                                    Name: c.City,
                                    Latitude: c.lat,
                                    Longitude: c.lon,
                                    Type: 'City'
                                }))}
                                interactive={true}
                                style="mapbox://styles/mapbox/satellite-streets-v12"
                                onPlaceSelect={(p) => {
                                    setSelectedCity(p.Name);
                                    setShowMapModal(false);
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Itineraries List and Stats (No layout changes here) */}
            <div className="max-w-7xl mx-auto p-8">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 -mt-16 relative z-20">
                    <div className="bg-white p-6 rounded-2xl shadow-xl">
                        <p className="text-gray-500 text-sm">Total Trips</p>
                        <p className="text-3xl font-bold text-navy">{trips.length}</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-xl">
                        <p className="text-gray-500 text-sm">Total Budget Spent</p>
                        <p className="text-3xl font-bold text-teal">₹{trips.reduce((acc, t) => acc + (t.total_cost || 0), 0).toLocaleString()}</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-xl">
                        <p className="text-gray-500 text-sm">Next Adventure</p>
                        <p className="text-xl font-bold text-coral">{trips.length > 0 ? trips[trips.length - 1].destination : "Not Planned"}</p>
                    </div>
                </div>

                {/* Itineraries List */}
                <h2 className="text-3xl font-bold text-navy mb-8">Your Itineraries</h2>

                {trips.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
                        <p className="text-gray-500 text-lg">You haven't planned any trips yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {trips.map((trip) => (
                            <motion.div
                                key={trip.id}
                                layout
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow flex flex-col"
                            >
                                <div className="p-6 flex-1">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-2xl font-bold text-navy">{trip.destination}</h3>
                                        <span className="bg-sand text-navy px-3 py-1 rounded-full text-xs font-bold">
                                            {trip.num_days} Days
                                        </span>
                                    </div>
                                    <div className="space-y-2 text-sm text-gray-600 mb-6">
                                        <p>✈️ {trip.travel_mode}</p>
                                        <p>💰 ₹{trip.total_cost?.toLocaleString()}</p>
                                        <p>📅 Created: {new Date(trip.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="bg-gray-50 p-4 flex gap-4 border-t border-gray-100">
                                    <Link
                                        to={`/trip-details/${trip.id}`}
                                        className="flex-1 bg-navy text-white text-center py-2 rounded-xl font-medium hover:bg-opacity-90"
                                    >
                                        View Details
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(trip.id)}
                                        className="px-4 py-2 text-red-500 hover:bg-red-50 rounded-xl font-medium transition-colors"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;