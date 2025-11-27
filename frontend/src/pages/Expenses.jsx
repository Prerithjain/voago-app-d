import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import axios from 'axios';
import Navbar from '../components/Navbar';
import PeopleManager from '../components/PeopleManager';

const COLORS = ['#233048', '#8aa6a2', '#e7dccb', '#f2a08a', '#FF8042', '#b48ead'];
const PAYER_COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const Expenses = () => {
    const [expenses, setExpenses] = useState([]);
    const [members, setMembers] = useState([]); // NEW: Trip members
    const [newExpense, setNewExpense] = useState({
        category: 'Food',
        amount: '',
        note: '',
        payer: '',
        currency: 'INR',
        date: new Date().toISOString().split('T')[0],
    });
    const [tripId, setTripId] = useState(1); // Mock trip ID
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchExpenses();
        fetchMembers(); // NEW: Fetch trip members
    }, []);

    const fetchExpenses = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`http://localhost:8000/api/trips/${tripId}/expenses`);
            setExpenses(res.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // NEW: Fetch trip members
    const fetchMembers = async () => {
        try {
            const res = await axios.get(`http://localhost:8000/api/trips/${tripId}/members`);
            setMembers(res.data || []);
        } catch (err) {
            console.error('Failed to fetch members', err);
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newExpense.amount || isNaN(Number(newExpense.amount))) return alert('Enter a valid amount');

        // Get actual user ID from cookie
        const u = document.cookie.split('; ').find(row => row.startsWith('session_user='));
        const userId = u ? parseInt(u.split('=')[1]) : 1;

        try {
            await axios.post('http://localhost:8000/api/expenses', {
                trip_id: tripId,
                user_id: userId,
                category: newExpense.category,
                amount: parseFloat(newExpense.amount),
                currency: newExpense.currency || 'INR',
                date: newExpense.date,
                note: newExpense.note || '',
                payer: newExpense.payer || 'Unknown',
                cleared: false
            });

            setNewExpense({
                category: 'Food',
                amount: '',
                note: '',
                payer: '',
                currency: 'INR',
                date: new Date().toISOString().split('T')[0],
            });

            fetchExpenses();
        } catch (err) {
            console.error(err);
        }
    };

    const exportPDF = () => {
        const input = document.getElementById('expense-report');
        if (!input) return;

        html2canvas(input).then((canvas) => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgProps = pdf.getImageProperties(imgData);

            const pdfWidth = pdf.internal.pageSize.getWidth() - 20;
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            pdf.addImage(imgData, 'PNG', 10, 10, pdfWidth, pdfHeight);
            pdf.save('voyago_expenses.pdf');
        });
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this expense?')) return;

        try {
            await axios.delete(`http://localhost:8000/api/expenses/${id}`);
            setExpenses((prev) => prev.filter((e) => e.id !== id));
        } catch (err) {
            console.error(err);
        }
    };

    // Chart Data (all expenses)
    const chartData = expenses.reduce((acc, curr) => {
        const found = acc.find((x) => x.name === curr.category);
        if (found) found.value += curr.amount;
        else acc.push({ name: curr.category, value: curr.amount });
        return acc;
    }, []);

    // Payer Breakdown Data (using reduce for aggregation)
    const payerData = expenses.reduce((acc, curr) => {
        const payer = curr.payer || 'Unknown';
        const found = acc.find((x) => x.name === payer);
        if (found) {
            found.amount += curr.amount;
            found.count += 1;
        } else {
            acc.push({ name: payer, amount: curr.amount, count: 1 });
        }
        return acc;
    }, []);

    const totalSpent = expenses.reduce((sum, item) => sum + (item.amount || 0), 0);

    return (
        <>
            <Navbar />

            <div className="min-h-screen bg-sand p-8">
                {/* People Manager Section */}
                <div className="max-w-6xl mx-auto mb-8">
                    <PeopleManager tripId={tripId} onMemberAdded={fetchMembers} />
                </div>

                <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* Left Side */}
                    <div className="space-y-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-2xl shadow-xl p-6"
                        >
                            <h2 className="text-2xl font-bold text-navy mb-4">Add Expense</h2>

                            <form onSubmit={handleAdd} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <select
                                        className="p-3 bg-gray-50 rounded-xl border"
                                        value={newExpense.category}
                                        onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                                    >
                                        <option>Food</option>
                                        <option>Transport</option>
                                        <option>Accommodation</option>
                                        <option>Activity</option>
                                        <option>Shopping</option>
                                        <option>Other</option>
                                    </select>

                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            placeholder="Amount"
                                            className="flex-1 p-3 bg-gray-50 rounded-xl border"
                                            value={newExpense.amount}
                                            onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                                            required
                                        />
                                        <select
                                            className="p-3 bg-gray-50 rounded-xl border"
                                            value={newExpense.currency}
                                            onChange={(e) => setNewExpense({ ...newExpense, currency: e.target.value })}
                                        >
                                            <option value="INR">₹ INR</option>
                                            <option value="USD">$ USD</option>
                                            <option value="EUR">€ EUR</option>
                                            <option value="GBP">£ GBP</option>
                                            <option value="JPY">¥ JPY</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <select
                                        className="p-3 bg-gray-50 rounded-xl border"
                                        value={newExpense.payer}
                                        onChange={(e) => setNewExpense({ ...newExpense, payer: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Person</option>
                                        {members.map((member) => (
                                            <option key={member.id} value={member.name}>
                                                {member.name}
                                            </option>
                                        ))}
                                    </select>

                                    <input
                                        type="date"
                                        className="p-3 bg-gray-50 rounded-xl border"
                                        value={newExpense.date}
                                        onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                                        required
                                    />
                                </div>

                                <input
                                    type="text"
                                    placeholder="Description"
                                    className="w-full p-3 bg-gray-50 rounded-xl border"
                                    value={newExpense.note}
                                    onChange={(e) => setNewExpense({ ...newExpense, note: e.target.value })}
                                />

                                <button type="submit" className="w-full btn-primary">
                                    Add Expense
                                </button>
                            </form>
                        </motion.div>

                        {/* Expense List */}
                        <div className="bg-white rounded-2xl shadow-xl p-6 max-h-96 overflow-y-auto">
                            <h3 className="text-xl font-bold text-navy mb-4">History</h3>

                            <ul className="space-y-3">
                                {loading && <p className="text-gray-500">Loading...</p>}

                                {!loading && expenses.length === 0 && (
                                    <p className="text-gray-500">No expenses added yet.</p>
                                )}

                                {expenses.map((exp, i) => (
                                    <li
                                        key={i}
                                        className="flex justify-between items-center p-3 bg-gray-50 rounded-xl"
                                    >
                                        <div>
                                            <span className="font-bold text-navy">{exp.category}</span>
                                            <p className="text-xs text-gray-500">{exp.note}</p>
                                            <p className="text-xs text-gray-400">{exp.payer} • {exp.date}</p>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <span className="font-bold text-teal">
                                                {exp.currency} {exp.amount}
                                            </span>

                                            <button
                                                onClick={() => handleDelete(exp.id)}
                                                className="px-3 py-1 rounded-lg text-sm text-red-500 bg-red-50 hover:bg-red-100"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Right: Chart & Report */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white rounded-2xl shadow-xl p-8"
                        id="expense-report"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-navy">Expense Breakdown</h2>
                            <button onClick={exportPDF} className="btn-secondary text-sm">
                                Export PDF
                            </button>
                        </div>

                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={chartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={COLORS[index % COLORS.length]}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="mt-8 text-center">
                            <p className="text-gray-500">Total Spent</p>
                            <p className="text-4xl font-bold text-navy">₹{totalSpent}</p>
                        </div>

                        {/* Payer Breakdown Bar Chart */}
                        {payerData.length > 0 && (
                            <div className="mt-8">
                                <h3 className="text-xl font-bold text-navy mb-4 text-center">Who Paid How Much?</h3>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={payerData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis />
                                            <Tooltip
                                                formatter={(value, name) => {
                                                    if (name === 'amount') return [`₹${value}`, 'Amount'];
                                                    if (name === 'count') return [value, 'Transactions'];
                                                    return value;
                                                }}
                                            />
                                            <Legend />
                                            <Bar dataKey="amount" fill="#4f46e5" name="Amount Paid" />
                                            <Bar dataKey="count" fill="#06b6d4" name="# of Payments" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Payer Summary */}
                                <div className="mt-4 space-y-2">
                                    {payerData.map((payer, idx) => (
                                        <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-4 h-4 rounded-full"
                                                    style={{ backgroundColor: PAYER_COLORS[idx % PAYER_COLORS.length] }}
                                                ></div>
                                                <span className="font-bold text-navy">{payer.name}</span>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-teal">₹{payer.amount.toFixed(2)}</p>
                                                <p className="text-xs text-gray-500">{payer.count} payment{payer.count > 1 ? 's' : ''}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </motion.div>

                </div>
            </div>
        </>
    );
};

export default Expenses;
