import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

const ExpenseTracker = ({ tripId, onExpenseAdded }) => {
    const [expenses, setExpenses] = useState([]);
    const [newExpense, setNewExpense] = useState({
        description: '',
        amount: '',
        currency: 'INR',
        category: 'food',
        date: new Date().toISOString().split('T')[0],
        payer: '',
        note: ''
    });
    const [showForm, setShowForm] = useState(false);

    const categories = {
        food: { icon: '🍔', label: 'Food', color: 'bg-orange-100 text-orange-700' },
        transport: { icon: '🚗', label: 'Transport', color: 'bg-blue-100 text-blue-700' },
        accommodation: { icon: '🏨', label: 'Accommodation', color: 'bg-purple-100 text-purple-700' },
        activity: { icon: '🎭', label: 'Activity', color: 'bg-pink-100 text-pink-700' },
        shopping: { icon: '🛍️', label: 'Shopping', color: 'bg-green-100 text-green-700' },
        other: { icon: '📦', label: 'Other', color: 'bg-gray-100 text-gray-700' }
    };

    useEffect(() => {
        fetchExpenses();
    }, [tripId]);

    const fetchExpenses = async () => {
        try {
            const res = await axios.get(`http://localhost:8000/api/trips/${tripId}/expenses`);
            setExpenses(res.data);
        } catch (err) {
            console.error('Failed to fetch expenses', err);
        }
    };

    const handleAddExpense = async (e) => {
        e.preventDefault();

        // Get actual user ID from cookie
        const u = document.cookie.split('; ').find(row => row.startsWith('session_user='));
        const userId = u ? parseInt(u.split('=')[1]) : 1;

        try {
            await axios.post('http://localhost:8000/api/expenses', {
                trip_id: tripId,
                user_id: userId,
                category: newExpense.category,
                amount: parseFloat(newExpense.amount),
                currency: newExpense.currency,
                date: newExpense.date,
                note: newExpense.description || '',
                payer: newExpense.payer || 'Unknown',
                cleared: false
            });

            setNewExpense({
                description: '',
                amount: '',
                currency: 'INR',
                category: 'food',
                date: new Date().toISOString().split('T')[0],
                payer: ''
            });
            setShowForm(false);
            fetchExpenses();

            // Notify parent component to refresh budget tracker
            if (onExpenseAdded) {
                onExpenseAdded();
            }
        } catch (err) {
            console.error('Failed to add expense', err);
            alert('Failed to add expense');
        }
    };

    const handleClearExpenses = async () => {
        if (!window.confirm('⚠️ Clear all expenses? This cannot be undone!')) return;

        try {
            const res = await axios.delete(`http://localhost:8000/api/trips/${tripId}/expenses/clear`);
            alert(res.data.message);
            setExpenses([]);
        } catch (err) {
            console.error('Failed to clear expenses', err);
            alert('Failed to clear expenses');
        }
    };

    const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const expensesByCategory = expenses.reduce((acc, exp) => {
        acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
        return acc;
    }, {});

    return (
        <div className="glass-card p-6 rounded-3xl mb-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        💰 Expense Tracker
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                        Total: <span className="font-bold text-teal text-lg">₹{totalExpenses.toLocaleString()}</span>
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="px-4 py-2 bg-teal text-white rounded-lg hover:bg-opacity-90 transition-all"
                    >
                        {showForm ? '✕ Cancel' : '+ Add Expense'}
                    </button>
                    {expenses.length > 0 && (
                        <button
                            onClick={handleClearExpenses}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all"
                        >
                            🗑️ Clear All
                        </button>
                    )}
                </div>
            </div>

            {/* Add Expense Form */}
            {showForm && (
                <motion.form
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    onSubmit={handleAddExpense}
                    className="bg-gray-50 p-4 rounded-xl mb-6"
                >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                            <input
                                type="text"
                                value={newExpense.description}
                                onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                                className="w-full p-2 rounded-lg border border-gray-300"
                                placeholder="e.g., Lunch at restaurant"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Amount</label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    value={newExpense.amount}
                                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                                    className="flex-1 p-2 rounded-lg border border-gray-300"
                                    placeholder="0"
                                    required
                                    min="0"
                                    step="0.01"
                                />
                                <select
                                    value={newExpense.currency}
                                    onChange={(e) => setNewExpense({ ...newExpense, currency: e.target.value })}
                                    className="p-2 rounded-lg border border-gray-300"
                                >
                                    <option value="INR">₹</option>
                                    <option value="USD">$</option>
                                    <option value="EUR">€</option>
                                    <option value="GBP">£</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Category</label>
                            <select
                                value={newExpense.category}
                                onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                                className="w-full p-2 rounded-lg border border-gray-300"
                            >
                                {Object.entries(categories).map(([key, cat]) => (
                                    <option key={key} value={key}>
                                        {cat.icon} {cat.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Date</label>
                            <input
                                type="date"
                                value={newExpense.date}
                                onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                                className="w-full p-2 rounded-lg border border-gray-300"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Paid By</label>
                            <input
                                type="text"
                                value={newExpense.payer}
                                onChange={(e) => setNewExpense({ ...newExpense, payer: e.target.value })}
                                className="w-full p-2 rounded-lg border border-gray-300"
                                placeholder="e.g., John, Me, Sarah"
                                required
                            />
                        </div>
                        <div className="md:col-span-2">
                            <button
                                type="submit"
                                className="w-full bg-teal text-white py-2 rounded-lg font-bold hover:bg-opacity-90 transition-all"
                            >
                                ✅ Add Expense
                            </button>
                        </div>
                    </div>
                </motion.form>
            )}

            {/* Category Breakdown */}
            {expenses.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                    {Object.entries(expensesByCategory).map(([category, amount]) => {
                        const cat = categories[category] || categories.other;
                        return (
                            <div key={category} className={`p-3 rounded-lg ${cat.color}`}>
                                <div className="text-2xl mb-1">{cat.icon}</div>
                                <div className="text-xs font-bold">{cat.label}</div>
                                <div className="text-sm font-bold">₹{amount.toLocaleString()}</div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Expense List */}
            {expenses.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    <div className="text-6xl mb-4">💸</div>
                    <p>No expenses recorded yet</p>
                    <p className="text-sm mt-2">Click "Add Expense" to start tracking</p>
                </div>
            ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                    {expenses.map((expense, idx) => {
                        const cat = categories[expense.category] || categories.other;
                        return (
                            <motion.div
                                key={expense.id || idx}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-full ${cat.color} flex items-center justify-center text-2xl`}>
                                        {cat.icon}
                                    </div>
                                    <div>
                                        <div className="font-bold text-navy">{expense.note || 'Expense'}</div>
                                        <div className="text-sm text-gray-600">
                                            {new Date(expense.date).toLocaleDateString()} • {cat.label}
                                            {expense.payer && ` • Paid by ${expense.payer}`}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-lg text-teal">
                                        {expense.currency === 'INR' ? '₹' : expense.currency} {expense.amount.toLocaleString()}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ExpenseTracker;
