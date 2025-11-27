import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import MapComponent from '../components/MapComponent';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ExpenseTracker from '../components/ExpenseTracker';

// Sortable Item Component
function SortableItem({ item, onDelete }) {
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
                <button onClick={() => onDelete(item.id)} className="btn-icon" title="Delete">
                    🗑️
                </button>
            </div>
        </div>
    );
}

const ChecklistSection = ({ tripId }) => {
    const [items, setItems] = useState([]);
    const [newTask, setNewTask] = useState('');
    const [progress, setProgress] = useState(0);
    const [stats, setStats] = useState({ total: 0, completed: 0 });

    useEffect(() => {
        const fetchChecklist = async () => {
            try {
                const res = await axios.get(`http://localhost:8000/api/trips/${tripId}/checklist`);
                // NEW: Handle progress data from backend
                if (res.data.items) {
                    setItems(res.data.items);
                    setProgress(res.data.progress || 0);
                    setStats({ total: res.data.total || 0, completed: res.data.completed || 0 });
                } else {
                    setItems(res.data);
                }
            } catch (err) {
                console.error("Failed to fetch checklist", err);
            }
        };
        fetchChecklist();
    }, [tripId]);

    const handleAddTask = async (e) => {
        e.preventDefault();
        if (!newTask.trim()) return;
        try {
            const res = await axios.post(`http://localhost:8000/api/trips/${tripId}/checklist`, { trip_id: tripId, task: newTask });
            setItems(prevItems => [...prevItems, res.data]);
            setNewTask('');
        } catch (err) {
            console.error("Failed to add task", err);
        }
    };

    const toggleTask = async (item) => {
        try {
            await axios.put(`http://localhost:8000/api/checklist/${item.id}`, { is_completed: !item.is_completed });
            setItems(items.map(i => i.id === item.id ? { ...i, is_completed: !i.is_completed } : i));
        } catch (err) {
            console.error("Failed to update task", err);
        }
    };

    const deleteTask = async (itemId) => {
        try {
            await axios.delete(`http://localhost:8000/api/checklist/${itemId}`);
            setItems(items.filter(i => i.id !== itemId));
        } catch (err) {
            console.error("Failed to delete task", err);
        }
    };

    return (
        <div className="glass-card p-6 rounded-3xl mb-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    ✅ Travel Checklist
                </h2>
                {stats.total > 0 && (
                    <div className="text-sm font-bold text-gray-600">
                        {stats.completed} / {stats.total} completed ({progress}%)
                    </div>
                )}
            </div>

            {/* Progress Bar */}
            {stats.total > 0 && (
                <div className="mb-4">
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                            className="bg-gradient-to-r from-teal to-green-500 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                </div>
            )}

            <form onSubmit={handleAddTask} className="flex gap-2 mb-4">
                <input
                    type="text"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    placeholder="Add a new item (e.g., Passport, Sunscreen)"
                    className="flex-1 p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal outline-none"
                />
                <button type="submit" className="bg-teal text-white px-6 py-2 rounded-xl font-bold hover:bg-opacity-90">
                    Add
                </button>
            </form>

            <div className="space-y-2">
                {items.length === 0 && <p className="text-gray-500 text-center py-4">No items yet. Add something to pack!</p>}
                {items.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                checked={item.is_completed}
                                onChange={() => toggleTask(item)}
                                className="w-5 h-5 text-teal rounded focus:ring-teal cursor-pointer"
                            />
                            <span className={`text-lg ${item.is_completed ? 'line-through text-gray-400' : 'text-navy'}`}>
                                {item.task}
                            </span>
                        </div>
                        <button onClick={() => deleteTask(item.id)} className="text-red-400 hover:text-red-600 p-2">
                            ✕
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

const TripDetails = () => {
    const { id } = useParams();
    const [trip, setTrip] = useState(null);
    const [itineraryItems, setItineraryItems] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [totalBudget, setTotalBudget] = useState(0);
    const [spentAmount, setSpentAmount] = useState(0);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        const fetchTrip = async (userId) => {
            try {
                const res = await axios.get(`http://localhost:8000/api/trips/user/${userId}`);
                const found = res.data.find(t => t.id === parseInt(id));
                if (found) {
                    setTrip(found);
                    setTotalBudget(found.budget || 0);

                    // Fetch itinerary items
                    try {
                        const itemsRes = await axios.get(`http://localhost:8000/api/itinerary/${id}`);
                        const items = itemsRes.data.map((item, idx) => ({
                            ...item,
                            id: item.id || `item-${idx}`
                        }));
                        setItineraryItems(items);
                    } catch (err) {
                        console.log('No itinerary items found', err);
                    }

                    // Fetch expenses and actually spent amount
                    try {
                        // Fetch actually spent (includes flight fees + expenses) using NumPy endpoint
                        const actuallySpentRes = await axios.get(`http://localhost:8000/api/trips/${id}/actually-spent`);
                        setSpentAmount(actuallySpentRes.data.actually_spent || 0);

                        // Also fetch expenses list for display
                        const expensesRes = await axios.get(`http://localhost:8000/api/trips/${id}/expenses`);
                        setExpenses(expensesRes.data);
                    } catch (err) {
                        console.log('No expenses found', err);
                    }
                }
            } catch (err) {
                console.error(err);
            }
        };

        const u = document.cookie.split('; ').find(row => row.startsWith('session_user='));
        if (u) {
            const userId = u.split('=')[1];
            fetchTrip(userId);
        }
    }, [id]);

    const handleDragEnd = async (event) => {
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

                // Persist changes to backend
                updatedItems.forEach(async (item) => {
                    try {
                        await axios.put(`http://localhost:8000/api/itinerary/${item.id}`, item, { withCredentials: true });
                    } catch (err) {
                        console.error("Failed to update item", item.id, err);
                    }
                });

                return updatedItems;
            });
        }
    };

    const handleDeleteItem = async (itemId) => {
        if (window.confirm('Are you sure you want to delete this item?')) {
            try {
                await axios.delete(`http://localhost:8000/api/itinerary/${itemId}`, { withCredentials: true });
                setItineraryItems(items => items.filter(item => item.id !== itemId));
            } catch (err) {
                console.error("Failed to delete item", err);
                alert("Failed to delete item");
            }
        }
    };

    const budgetPercentage = totalBudget > 0 ? (spentAmount / totalBudget) * 100 : 0;
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
                            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                {trip.destination} Adventure
                            </h1>
                            <p className="text-gray-600 text-lg">
                                📅 {trip.start_date || 'TBD'} to {trip.end_date || 'TBD'} • {trip.num_days} Days • {trip.travel_mode}
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">

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

                {/* Interactive Map */}
                <div className="glass-card p-6 mb-6 rounded-3xl">
                    <h2 className="text-2xl font-bold mb-4">🗺️ Trip Map</h2>
                    <div className="h-96 w-full rounded-xl overflow-hidden shadow-inner">
                        <MapComponent places={itineraryItems.map(i => ({
                            Name: i.place_name,
                            Latitude: i.Latitude,
                            Longitude: i.Longitude,
                            Type: i.Type || 'Place'
                        }))} />
                    </div>
                </div>

                {/* Drag-and-Drop Itinerary */}
                <div className="glass-card p-6 rounded-3xl mb-6">
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                        📅 Drag-and-Drop Itinerary
                    </h2>

                    {itineraryItems.length > 0 ? (
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
                                                />
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <p>No itinerary items yet. Start planning your trip!</p>
                        </div>
                    )}
                </div>

                {/* Expense Tracker */}
                <ExpenseTracker tripId={id} />

                {/* Checklist Section */}
                <ChecklistSection tripId={id} />

                {/* Original Itinerary HTML (fallback) */}
                {trip.itinerary_html && (
                    <div className="glass-card p-6 rounded-3xl mb-6">
                        <h2 className="text-2xl font-bold mb-4">📋 Detailed Itinerary</h2>
                        <div className="prose max-w-none">
                            <div dangerouslySetInnerHTML={{ __html: trip.itinerary_html }} />
                        </div>
                    </div>
                )}

                <div className="mt-8 flex justify-between">
                    <Link to="/dashboard" className="btn-secondary">
                        ← Back to Dashboard
                    </Link>
                    <div className="flex gap-3">
                        <button
                            onClick={async () => {
                                try {
                                    const res = await axios.get(`http://localhost:8000/api/trips/${id}/export?format=json`);
                                    const dataStr = JSON.stringify(res.data, null, 2);
                                    const dataBlob = new Blob([dataStr], { type: 'application/json' });
                                    const url = URL.createObjectURL(dataBlob);
                                    const link = document.createElement('a');
                                    link.href = url;
                                    link.download = `trip_${trip.destination}_${new Date().toISOString().split('T')[0]}.json`;
                                    link.click();
                                } catch (err) {
                                    console.error("Export failed", err);
                                    alert("Failed to export itinerary");
                                }
                            }}
                            className="btn-primary"
                        >
                            📄 Export JSON
                        </button>
                        <button
                            onClick={async () => {
                                window.open(`http://localhost:8000/api/trips/${id}/export?format=csv`, '_blank');
                            }}
                            className="btn-primary"
                        >
                            📊 Export CSV
                        </button>
                    </div>
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

export default TripDetails;
