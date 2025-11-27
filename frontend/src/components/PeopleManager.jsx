import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const PeopleManager = ({ tripId, onMemberAdded }) => {
    const [members, setMembers] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newMember, setNewMember] = useState({ name: '', email: '' });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (tripId) {
            fetchMembers();
        }
    }, [tripId]);

    const fetchMembers = async () => {
        try {
            const res = await axios.get(`http://localhost:8000/api/trips/${tripId}/members`);
            setMembers(res.data || []);
        } catch (err) {
            console.error('Failed to fetch members', err);
        }
    };

    const handleAddMember = async (e) => {
        e.preventDefault();
        if (!newMember.name || !newMember.email) {
            return alert('Please enter both name and email');
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(newMember.email)) {
            return alert('Please enter a valid email address');
        }

        try {
            setLoading(true);
            const memberName = newMember.name; // Store before clearing
            await axios.post('http://localhost:8000/api/trip-members', {
                trip_id: tripId,
                name: newMember.name,
                email: newMember.email
            });

            setNewMember({ name: '', email: '' });
            setShowAddForm(false);
            await fetchMembers();

            // Notify parent component to refresh its member list
            if (onMemberAdded) {
                onMemberAdded();
            }

            alert(`✅ ${memberName} has been added and will receive an email invite!`);
        } catch (err) {
            console.error('Failed to add member', err);
            alert(err.response?.data?.detail || 'Failed to add member');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteMember = async (memberId, memberName) => {
        if (!window.confirm(`Remove ${memberName} from this trip?`)) return;

        try {
            await axios.delete(`http://localhost:8000/api/trip-members/${memberId}`);
            setMembers(members.filter(m => m.id !== memberId));
        } catch (err) {
            console.error('Failed to delete member', err);
            alert('Failed to remove member');
        }
    };

    return (
        <div className="glass-card p-6 rounded-3xl">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        👥 Trip Members
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                        Add people to track expenses together
                    </p>
                </div>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="px-4 py-2 bg-teal text-white rounded-lg hover:bg-opacity-90 transition-all"
                >
                    {showAddForm ? '✕ Cancel' : '+ Add Person'}
                </button>
            </div>

            {/* Add Member Form */}
            <AnimatePresence>
                {showAddForm && (
                    <motion.form
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        onSubmit={handleAddMember}
                        className="bg-gray-50 p-4 rounded-xl mb-6"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Name</label>
                                <input
                                    type="text"
                                    value={newMember.name}
                                    onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                                    className="w-full p-2 rounded-lg border border-gray-300"
                                    placeholder="e.g., John Doe"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={newMember.email}
                                    onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                                    className="w-full p-2 rounded-lg border border-gray-300"
                                    placeholder="e.g., john@example.com"
                                    required
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-4 bg-teal text-white py-2 rounded-lg font-bold hover:bg-opacity-90 transition-all disabled:opacity-50"
                        >
                            {loading ? '📧 Sending Invite...' : '✅ Add & Send Email Invite'}
                        </button>
                    </motion.form>
                )}
            </AnimatePresence>

            {/* Members List */}
            {members.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    <div className="text-6xl mb-4">👤</div>
                    <p>No members added yet</p>
                    <p className="text-sm mt-2">Click "Add Person" to invite people to this trip</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {members.map((member, idx) => (
                        <motion.div
                            key={member.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-teal bg-opacity-20 flex items-center justify-center text-2xl">
                                    👤
                                </div>
                                <div>
                                    <div className="font-bold text-navy">{member.name}</div>
                                    <div className="text-sm text-gray-600">{member.email}</div>
                                    <div className="text-xs text-gray-400">
                                        Added: {new Date(member.added_at).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => handleDeleteMember(member.id, member.name)}
                                className="px-3 py-1 rounded-lg text-sm text-red-500 bg-red-50 hover:bg-red-100 transition-colors"
                            >
                                Remove
                            </button>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PeopleManager;
