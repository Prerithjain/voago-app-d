import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import Navbar from '../components/Navbar';
import MapComponent from '../components/MapComponent';

const TripPlanner = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const cityParam = searchParams.get('city');
  const startParam = searchParams.get('start');
  const endParam = searchParams.get('end');
  const budgetParam = searchParams.get('budget');
  const daysParam = searchParams.get('days');

  const [places, setPlaces] = useState([]);
  const [filteredPlaces, setFilteredPlaces] = useState([]);
  const [selectedPlaces, setSelectedPlaces] = useState([]);
  const [loading, setLoading] = useState(true);

  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'

  // Filters
  const [filters, setFilters] = useState({
    types: [],
    significance: [],
    minRating: 0,
    maxFee: 5000,
    dslrAllowed: false,
    bestTime: '',
    activityType: '',
    kidFriendly: false,
    maxDuration: 10
  });

  const [uniqueOptions, setUniqueOptions] = useState({
    types: [],
    significance: [],
    bestTime: [],
    activityTypes: []
  });

  // Trip Config (Initialized from URL)
  const [tripConfig, setTripConfig] = useState({
    days: daysParam ? Number(daysParam) : 3,
    budget: budgetParam ? Number(budgetParam) : 50000,
    travelMode: 'Flight',
    startDate: startParam || '',
    endDate: endParam || ''
  });

  useEffect(() => {
    if (cityParam) {
      fetchPlaces(cityParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cityParam]);

  const fetchPlaces = async (city) => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:8000/api/places?city=${encodeURIComponent(city)}`);
      const data = Array.isArray(res.data) ? res.data : [];
      setPlaces(data);
      setFilteredPlaces(data);

      // Extract unique options for filters (safely)
      const types = [...new Set(data.map(p => p.Type).filter(Boolean))];
      const sigs = [...new Set(data.map(p => p.Significance).filter(Boolean))];
      const times = [...new Set(data.map(p => p.Best_Time_to_visit).filter(Boolean))];
      const activities = [...new Set(data.map(p => p.Activity_Type).filter(Boolean))];

      setUniqueOptions({ types, significance: sigs, bestTime: times, activityTypes: activities });
    } catch (err) {
      console.error('Error fetching places:', err);
      alert('Failed to load places. Please try again.');
      setPlaces([]);
      setFilteredPlaces([]);
      setUniqueOptions({ types: [], significance: [], bestTime: [], activityTypes: [] });
    } finally {
      setLoading(false);
    }
  };

  // Apply filters
  useEffect(() => {
    let result = [...places];

    if (filters.types.length > 0) {
      result = result.filter(p => filters.types.includes(p.Type));
    }
    if (filters.significance.length > 0) {
      result = result.filter(p => filters.significance.includes(p.Significance));
    }
    if (filters.minRating > 0) {
      result = result.filter(p => Number(p.Google_review_rating) >= filters.minRating);
    }
    if (filters.dslrAllowed) {
      result = result.filter(p => String(p.DSLR_Allowed).toLowerCase() === 'yes');
    }
    if (filters.maxFee < 5000) {
      result = result.filter(p => Number(p.Entrance_Fee_INR || 0) <= filters.maxFee);
    }
    if (filters.bestTime) {
      result = result.filter(p => p.Best_Time_to_visit === filters.bestTime);
    }
    if (filters.activityType) {
      result = result.filter(p => p.Activity_Type === filters.activityType);
    }
    if (filters.kidFriendly) {
      result = result.filter(p => String(p.Kid_Friendly).toLowerCase() === 'yes');
    }
    if (filters.maxDuration < 10) {
      result = result.filter(p => Number(p.time_needed_to_visit_hrs || 0) <= filters.maxDuration);
    }

    setFilteredPlaces(result);
  }, [filters, places]);

  const togglePlaceSelection = (placeName) => {
    if (selectedPlaces.includes(placeName)) {
      setSelectedPlaces(prev => prev.filter(p => p !== placeName));
    } else {
      setSelectedPlaces(prev => [...prev, placeName]);
    }
  };

  const handleCreateTrip = async () => {
    if (selectedPlaces.length === 0) return alert("Select at least one place!");

    try {
      // Get actual user ID from cookie
      const u = document.cookie.split('; ').find(row => row.startsWith('session_user='));
      const userId = u ? u.split('=')[1] : '1';

      const response = await axios.post('http://localhost:8000/api/trips/create', {
        user_id: parseInt(userId),
        origin: 'Your Location',
        destination: cityParam,
        categories: filters.types, // Just for metadata
        num_days: Number(tripConfig.days),
        budget: Number(tripConfig.budget),
        travel_mode: tripConfig.travelMode,
        selected_places: selectedPlaces,
        start_date: tripConfig.startDate,
        end_date: tripConfig.endDate
      });

      alert("Trip Created Successfully! Check your email.");
      // Navigate with state to trigger refresh
      navigate('/dashboard', { state: { refresh: true } });
    } catch (err) {
      console.error(err);
      alert("Failed to create trip");
    }
  };

  if (!cityParam) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold text-navy mb-4">No City Selected</h2>
        <p className="text-gray-600 mb-4">Please select a city from the Dashboard.</p>
        <a href="/dashboard" className="btn-primary">Go to Dashboard</a>
      </div>
    </div>
  );

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-teal mx-auto mb-4"></div>
        <p className="text-xl font-bold text-navy">Loading places for {cityParam}...</p>
        <p className="text-gray-600 mt-2">Please wait</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="flex h-[calc(100vh-64px)] overflow-hidden">
        {/* Sidebar Filters */}
        <div className="w-80 bg-white shadow-xl overflow-y-auto p-6 flex-shrink-0 z-20">
          <h2 className="text-xl font-bold text-navy mb-6">Filters</h2>

          {/* View Toggle */}
          <div className="flex bg-gray-100 p-1 rounded-lg mb-6">
            <button
              className={`flex-1 py-1 rounded-md text-sm font-bold transition-all ${viewMode === 'list' ? 'bg-white shadow text-navy' : 'text-gray-500'}`}
              onClick={() => setViewMode('list')}
            >
              List
            </button>
            <button
              className={`flex-1 py-1 rounded-md text-sm font-bold transition-all ${viewMode === 'map' ? 'bg-white shadow text-navy' : 'text-gray-500'}`}
              onClick={() => setViewMode('map')}
            >
              Map
            </button>
          </div>

          {/* Kid Friendly */}
          <div className="mb-6 flex items-center gap-2">
            <input
              type="checkbox"
              checked={filters.kidFriendly}
              onChange={e => setFilters({ ...filters, kidFriendly: e.target.checked })}
              className="w-5 h-5 text-teal rounded focus:ring-teal"
            />
            <label className="text-sm font-bold text-gray-700">Kid Friendly</label>
          </div>

          {/* Activity Type */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-2">Activity Type</label>
            <select
              value={filters.activityType}
              onChange={e => setFilters({ ...filters, activityType: e.target.value })}
              className="w-full p-2 border rounded-lg text-sm"
            >
              <option value="">All Activities</option>
              {uniqueOptions.activityTypes.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Max Duration */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-2">Max Duration: {filters.maxDuration} hrs</label>
            <input
              type="range" min="0.5" max="10" step="0.5"
              value={filters.maxDuration}
              onChange={e => setFilters({ ...filters, maxDuration: Number(e.target.value) })}
              className="w-full accent-teal"
            />
          </div>

          {/* Rating */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-2">Min Rating: {filters.minRating}+</label>
            <input
              type="range" min="0" max="5" step="0.5"
              value={filters.minRating}
              onChange={e => setFilters({ ...filters, minRating: Number(e.target.value) })}
              className="w-full accent-teal"
            />
          </div>

          {/* Entrance Fee */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-2">Max Fee: ₹{filters.maxFee}</label>
            <input
              type="range" min="0" max="5000" step="100"
              value={filters.maxFee}
              onChange={e => setFilters({ ...filters, maxFee: Number(e.target.value) })}
              className="w-full accent-teal"
            />
          </div>

          {/* DSLR */}
          <div className="mb-6 flex items-center gap-2">
            <input
              type="checkbox"
              checked={filters.dslrAllowed}
              onChange={e => setFilters({ ...filters, dslrAllowed: e.target.checked })}
              className="w-5 h-5 text-teal rounded focus:ring-teal"
            />
            <label className="text-sm font-bold text-gray-700">DSLR Allowed Only</label>
          </div>

          {/* Types */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
            <div className="flex flex-wrap gap-2">
              {uniqueOptions.types.map(t => (
                <button
                  key={t}
                  onClick={() => {
                    const newTypes = filters.types.includes(t)
                      ? filters.types.filter(x => x !== t)
                      : [...filters.types, t];
                    setFilters({ ...filters, types: newTypes });
                  }}
                  className={`px-3 py-1 rounded-full text-xs transition-colors ${filters.types.includes(t) ? 'bg-navy text-white' : 'bg-gray-100 text-gray-600'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Significance */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-2">Significance</label>
            <div className="flex flex-wrap gap-2">
              {uniqueOptions.significance.map(s => (
                <button
                  key={s}
                  onClick={() => {
                    const newSigs = filters.significance.includes(s)
                      ? filters.significance.filter(x => x !== s)
                      : [...filters.significance, s];
                    setFilters({ ...filters, significance: newSigs });
                  }}
                  className={`px-3 py-1 rounded-full text-xs transition-colors ${filters.significance.includes(s) ? 'bg-coral text-white' : 'bg-gray-100 text-gray-600'}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-8 relative">
          <div className="max-w-5xl mx-auto pb-32">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h1 className="text-4xl font-bold text-navy mb-2">Explore {cityParam}</h1>
                <p className="text-gray-600">Found {filteredPlaces.length} places matching your criteria</p>
              </div>

              {/* Trip Config Display */}
              <div className="flex gap-4 bg-white p-4 rounded-xl shadow-sm">
                <div className="text-center px-4 border-r border-gray-100">
                  <p className="text-xs font-bold text-gray-500">Dates</p>
                  <p className="font-bold text-navy">{tripConfig.startDate || 'N/A'} - {tripConfig.endDate || 'N/A'}</p>
                </div>
                <div className="text-center px-4">
                  <p className="text-xs font-bold text-gray-500">Days</p>
                  <p className="font-bold text-navy">{tripConfig.days}</p>
                </div>
                <div className="text-center px-4">
                  <p className="text-xs font-bold text-gray-500">Budget</p>
                  <p className="font-bold text-navy">₹{tripConfig.budget}</p>
                </div>
              </div>
            </div>

            {/* View modes */}
            {viewMode === 'map' ? (
              <div className="h-[60vh] bg-white rounded-2xl shadow-lg overflow-hidden">
                <MapComponent
                  places={filteredPlaces.map(p => ({
                    Name: p.Name,
                    Latitude: p.lat ?? p.Latitude ?? p.latitude,
                    Longitude: p.lon ?? p.Longitude ?? p.longitude,
                    Type: p.Type
                  }))}
                  interactive={true}
                  style="mapbox://styles/mapbox/streets-v11"
                  onPlaceSelect={(p) => {
                    // MapComponent sends a place object — toggle by Name when clicked on map pin
                    togglePlaceSelection(p.Name);
                  }}
                />
              </div>
            ) : (
              filteredPlaces.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl shadow-lg">
                  <div className="text-6xl mb-4">🏝️</div>
                  <h3 className="text-2xl font-bold text-navy mb-2">No places found</h3>
                  <p className="text-gray-600">Try adjusting your filters or select a different city</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredPlaces.map((place, idx) => {
                    const name = place.Name || place.name;
                    const isSelected = selectedPlaces.includes(name);
                    return (
                      <motion.div
                        key={name + idx}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.03 }}
                        className={`bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-all border-2 ${isSelected ? 'border-teal transform scale-105' : 'border-transparent'}`}
                        onClick={() => togglePlaceSelection(name)}
                      >
                        <div className="h-32 bg-gray-200 relative">
                          <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-4xl">
                            🏞️
                          </div>
                          <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded-lg text-xs font-bold shadow-sm">
                            {place.Type}
                          </div>
                        </div>
                        <div className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-navy leading-tight">{name}</h3>
                            <div className="flex items-center bg-sand px-1.5 py-0.5 rounded text-xs font-bold text-navy">
                              ★ {place.Google_review_rating ?? 'N/A'}
                              <span className="text-gray-500 font-normal ml-1">({place.Number_of_google_review_in_lakhs ?? '-'})</span>
                            </div>
                          </div>

                          <div className="space-y-1 text-xs text-gray-600 mb-4">
                            <p>⏱️ {place.time_needed_to_visit_hrs ?? 'N/A'} hrs needed</p>
                            <p>💰 {place.Entrance_Fee_INR === 0 ? 'Free' : `₹${place.Entrance_Fee_INR ?? '-'}`}</p>
                            <p>🗓️ Best Time: {place.Best_Time_to_visit ?? '-'}</p>
                            {String(place.Kid_Friendly).toLowerCase() === 'yes' && <p>👶 Kid Friendly</p>}
                          </div>

                          <button
                            className={`w-full py-2 rounded-xl font-bold transition-colors ${isSelected ? 'bg-teal text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          >
                            {isSelected ? 'Selected ✓' : 'Add to Itinerary'}
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )
            )}
          </div>

          {/* Floating Action Bar */}
          <AnimatePresence>
            {selectedPlaces.length > 0 && (
              <motion.div
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                exit={{ y: 100 }}
                className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-navy text-white px-8 py-4 rounded-full shadow-2xl z-50 flex items-center gap-6"
              >
                <div>
                  <span className="font-bold text-teal text-xl">{selectedPlaces.length}</span> places selected
                </div>
                <button
                  onClick={handleCreateTrip}
                  className="bg-teal text-white px-6 py-2 rounded-xl font-bold hover:bg-white hover:text-teal transition-colors"
                >
                  Generate Itinerary
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default TripPlanner;
