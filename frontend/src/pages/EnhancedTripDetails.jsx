import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Mapbox access token (you'll need to replace this with your own)
mapboxgl.accessToken = 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw';

// Sortable Item Component
function SortableItem({ item, onDelete, onEdit }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: item.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            className="itinerary-item"
        >
            <div className="drag-handle" {...listeners}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <circle cx="5" cy="5" r="1.5" />
                    <circle cx="5" cy="10" r="1.5" />
                    <circle cx="5" cy="15" r="1.5" />
                    <circle cx="10" cy="5" r="1.5" />
                    <circle cx="10" cy="10" r="1.5" />
                    <circle cx="10" cy="15" r="1.5" />
                </svg>
            </div>
            <div className="item-content">
                <div className="item-header">
                    <h4>{item.place_name}</h4>
                    <span className="item-day">Day {item.day}</span>
                </div>
                <div className="item-details">
                    <span className="time-slot">
                        🕐 {item.start_time} - {item.end_time}
                    </span>
                    <span className="cost">
                        💰 ₹{item.estimated_cost?.toLocaleString()}
                    </span>
                </div>
                {item.notes && <p className="item-notes">{item.notes}</p>}
            </div>
            <div className="item-actions">
                <button onClick={() => onEdit(item)} className="btn-icon" title="Edit">
                    ✏️
                </button>
                <button onClick={() => onDelete(item.id)} className="btn-icon" title="Delete">
                    🗑️
                </button>
            </div>
        </div>
    );
}

const EnhancedTripDetails = () => {
    const { id } = useParams();
    const [trip, setTrip] = useState(null);
    const [itineraryItems, setItineraryItems] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [totalBudget, setTotalBudget] = useState(0);
    const [spentAmount, setSpentAmount] = useState(0);
    const [estimatedCost, setEstimatedCost] = useState(0);
    const mapContainer = useRef(null);
    const map = useRef(null);
    const [mapLoaded, setMapLoaded] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        const u = document.cookie.split('; ').find(row => row.startsWith('session_user='));
        if (u) {
            const userId = u.split('=')[1];
            fetchTrip(userId);
        }
    }, [id]);

    const fetchTrip = async (userId) => {
        try {
            const res = await axios.get(`http://localhost:8000/api/trips/user/${userId}`);
            const found = res.data.find(t => t.id === parseInt(id));
            if (found) {
                setTrip(found);
                setTotalBudget(found.budget || 0);
                setEstimatedCost(found.total_cost || 0);

                // Fetch itinerary items
                const itemsRes = await axios.get(`http://localhost:8000/api/itinerary/${id}`);
                const items = itemsRes.data.map((item, idx) => ({
                    ...item,
                    id: item.id || `item-${idx}`
                }));
                setItineraryItems(items);

                // Fetch expenses
                const expensesRes = await axios.get(`http://localhost:8000/api/expenses/trip/${id}`);
                setExpenses(expensesRes.data);
                const spent = expensesRes.data.reduce((sum, exp) => sum + (exp.amount || 0), 0);
                setSpentAmount(spent);

                // Initialize map
                initializeMap(items);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const initializeMap = (items) => {
        if (map.current || !mapContainer.current) return;

        // Sample coordinates - in production, fetch from backend
        const coordinates = items.map((item, idx) => ({
            lng: 77.2090 + (idx * 0.05),
            lat: 28.6139 + (idx * 0.05),
            name: item.place_name
        }));

        if (coordinates.length === 0) return;

        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: [coordinates[0].lng, coordinates[0].lat],
            zoom: 11
        });

        map.current.on('load', () => {
            setMapLoaded(true);

            // Add markers for each place
            coordinates.forEach((coord, idx) => {
                const el = document.createElement('div');
                el.className = 'custom-marker';
                el.innerHTML = `<div class="marker-pin">${idx + 1}</div>`;

                new mapboxgl.Marker(el)
                    .setLngLat([coord.lng, coord.lat])
                    .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(
                        `<h3>${coord.name}</h3><p>Stop ${idx + 1}</p>`
                    ))
                    .addTo(map.current);
            });

            // Add route line
            if (coordinates.length > 1) {
                map.current.addSource('route', {
                    type: 'geojson',
                    data: {
                        type: 'Feature',
                        properties: {},
                        geometry: {
                            type: 'LineString',
                            coordinates: coordinates.map(c => [c.lng, c.lat])
                        }
                    }
                });

                map.current.addLayer({
                    id: 'route',
                    type: 'line',
                    source: 'route',
                    layout: {
                        'line-join': 'round',
                        'line-cap': 'round'
                    },
                    paint: {
                        'line-color': '#2D9CDB',
                        'line-width': 3,
                        'line-dasharray': [2, 2]
                    }
                });
            }
        });
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (active.id !== over.id) {
            setItineraryItems((items) => {
                const oldIndex = items.findIndex(item => item.id === active.id);
                const newIndex = items.findIndex(item => item.id === over.id);

                const newItems = arrayMove(items, oldIndex, newIndex);

                // Update day assignments based on new order
                let currentDay = 1;
                let dayHours = 0;
                const MAX_HOURS = 8;

                const updatedItems = newItems.map(item => {
                    const duration = parseFloat(item.duration || 2);

                    if (dayHours + duration > MAX_HOURS) {
                        currentDay++;
                        dayHours = 0;
                    }

                    dayHours += duration;

                    return {
                        ...item,
                        day: currentDay
                    };
                });

                return updatedItems;
            });
        }
    };

    const handleDeleteItem = (itemId) => {
        if (window.confirm('Are you sure you want to delete this item?')) {
            setItineraryItems(items => items.filter(item => item.id !== itemId));
            // In production, also send DELETE request to backend
        }
    };

    const handleEditItem = (item) => {
        // Implement edit functionality
        console.log('Edit item:', item);
    };

    const budgetPercentage = totalBudget > 0 ? (spentAmount / totalBudget) * 100 : 0;
    const estimatedPercentage = totalBudget > 0 ? (estimatedCost / totalBudget) * 100 : 0;
    const remainingBudget = totalBudget - spentAmount;

    if (!trip) return (
        <div className="min-h-screen bg-sand p-8 text-center">
            <div className="loading-spinner">Loading...</div>
        </div>
    );

    // Group items by day
    const itemsByDay = itineraryItems.reduce((acc, item) => {
        const day = item.day || 1;
        if (!acc[day]) acc[day] = [];
        acc[day].push(item);
        return acc;
    }, {});

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
            <Navbar />

            <div className="max-w-7xl mx-auto p-6">
                {/* Header Section */}
                <div className="trip-header glass-card p-8 mb-6 rounded-3xl">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-4xl font-bold text-navy mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                {trip.destination} Adventure
                            </h1>
                            <p className="text-gray-600 text-lg">
                                📅 {trip.start_date} to {trip.end_date} • {trip.num_days} Days • {trip.travel_mode}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-500 mb-1">Total Budget</p>
                            <p className="text-4xl font-bold text-teal">₹{totalBudget.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                {/* Budget Tracker */}
                <div className="glass-card p-6 mb-6 rounded-3xl">
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                        💰 Real-time Budget Tracker
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="budget-stat">
                            <div className="stat-label">Estimated Cost</div>
                            <div className="stat-value text-blue-600">₹{estimatedCost.toLocaleString()}</div>
                            <div className="stat-bar">
                                <div
                                    className="stat-fill bg-blue-500"
                                    style={{ width: `${Math.min(estimatedPercentage, 100)}%` }}
                                ></div>
                            </div>
                        </div>

                        <div className="budget-stat">
                            <div className="stat-label">Actually Spent</div>
                            <div className="stat-value text-orange-600">₹{spentAmount.toLocaleString()}</div>
                            <div className="stat-bar">
                                <div
                                    className="stat-fill bg-orange-500"
                                    style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
                                ></div>
                            </div>
                        </div>

                        <div className="budget-stat">
                            <div className="stat-label">Remaining</div>
                            <div className={`stat-value ${remainingBudget >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                ₹{remainingBudget.toLocaleString()}
                            </div>
                            <div className="stat-bar">
                                <div
                                    className={`stat-fill ${remainingBudget >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                                    style={{ width: `${Math.min(Math.abs((remainingBudget / totalBudget) * 100), 100)}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>

                    {budgetPercentage > 90 && (
                        <div className="alert alert-warning">
                            ⚠️ You've spent {budgetPercentage.toFixed(0)}% of your budget!
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Interactive Map */}
                    <div className="glass-card p-6 rounded-3xl">
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                            🗺️ Interactive Map
                        </h2>
                        <div
                            ref={mapContainer}
                            className="map-container rounded-2xl overflow-hidden"
                            style={{ height: '500px' }}
                        />
                    </div>

                    {/* Drag-and-Drop Itinerary */}
                    <div className="glass-card p-6 rounded-3xl">
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                            📅 Drag-and-Drop Itinerary
                        </h2>

                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={itineraryItems.map(item => item.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                <div className="itinerary-list">
                                    {Object.keys(itemsByDay).sort().map(day => (
                                        <div key={day} className="day-section mb-4">
                                            <h3 className="day-header">Day {day}</h3>
                                            {itemsByDay[day].map(item => (
                                                <SortableItem
                                                    key={item.id}
                                                    item={item}
                                                    onDelete={handleDeleteItem}
                                                    onEdit={handleEditItem}
                                                />
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>
                    </div>
                </div>

                {/* 3D Animation Section */}
                <div className="glass-card p-6 mt-6 rounded-3xl">
                    <h2 className="text-2xl font-bold mb-4">✨ Your Journey Visualization</h2>
                    <div className="journey-animation">
                        <canvas id="journey-canvas" className="w-full h-96 rounded-2xl"></canvas>
                    </div>
                </div>

                <div className="mt-8 flex justify-between">
                    <Link to="/dashboard" className="btn-secondary">
                        ← Back to Dashboard
                    </Link>
                    <button className="btn-primary">
                        Export Itinerary 📄
                    </button>
                </div>
            </div>

            <style jsx>{`
                .glass-card {
                    background: rgba(255, 255, 255, 0.9);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
                }

                .itinerary-item {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 1rem;
                    margin-bottom: 0.5rem;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
                    transition: all 0.3s ease;
                    cursor: move;
                }

                .itinerary-item:hover {
                    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
                    transform: translateY(-2px);
                }

                .drag-handle {
                    color: #999;
                    cursor: grab;
                }

                .drag-handle:active {
                    cursor: grabbing;
                }

                .item-content {
                    flex: 1;
                }

                .item-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 0.5rem;
                }

                .item-header h4 {
                    margin: 0;
                    font-size: 1.1rem;
                    font-weight: 600;
                    color: #2c3e50;
                }

                .item-day {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 0.25rem 0.75rem;
                    border-radius: 20px;
                    font-size: 0.85rem;
                    font-weight: 600;
                }

                .item-details {
                    display: flex;
                    gap: 1.5rem;
                    font-size: 0.9rem;
                    color: #666;
                }

                .item-notes {
                    margin-top: 0.5rem;
                    font-size: 0.85rem;
                    color: #888;
                }

                .item-actions {
                    display: flex;
                    gap: 0.5rem;
                }

                .btn-icon {
                    background: none;
                    border: none;
                    font-size: 1.2rem;
                    cursor: pointer;
                    padding: 0.25rem;
                    transition: transform 0.2s;
                }

                .btn-icon:hover {
                    transform: scale(1.2);
                }

                .day-header {
                    font-size: 1.2rem;
                    font-weight: 700;
                    color: #2c3e50;
                    margin-bottom: 1rem;
                    padding-bottom: 0.5rem;
                    border-bottom: 2px solid #e0e0e0;
                }

                .budget-stat {
                    padding: 1.5rem;
                    background: white;
                    border-radius: 16px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
                }

                .stat-label {
                    font-size: 0.9rem;
                    color: #666;
                    margin-bottom: 0.5rem;
                }

                .stat-value {
                    font-size: 2rem;
                    font-weight: 700;
                    margin-bottom: 0.75rem;
                }

                .stat-bar {
                    height: 8px;
                    background: #e0e0e0;
                    border-radius: 4px;
                    overflow: hidden;
                }

                .stat-fill {
                    height: 100%;
                    transition: width 0.5s ease;
                    border-radius: 4px;
                }

                .alert {
                    padding: 1rem;
                    border-radius: 12px;
                    font-weight: 500;
                }

                .alert-warning {
                    background: #fff3cd;
                    color: #856404;
                    border-left: 4px solid #ffc107;
                }

                .custom-marker {
                    cursor: pointer;
                }

                .marker-pin {
                    width: 30px;
                    height: 30px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
                }

                .loading-spinner {
                    border: 4px solid #f3f3f3;
                    border-top: 4px solid #3498db;
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    animation: spin 1s linear infinite;
                    margin: 0 auto;
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                .btn-primary {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 0.75rem 2rem;
                    border-radius: 12px;
                    border: none;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .btn-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
                }

                .btn-secondary {
                    background: white;
                    color: #667eea;
                    padding: 0.75rem 2rem;
                    border-radius: 12px;
                    border: 2px solid #667eea;
                    font-weight: 600;
                    text-decoration: none;
                    display: inline-block;
                    transition: all 0.3s ease;
                }

                .btn-secondary:hover {
                    background: #667eea;
                    color: white;
                    transform: translateY(-2px);
                }
            `}</style>
        </div>
    );
};

export default EnhancedTripDetails;
