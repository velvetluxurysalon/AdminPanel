import { useState, useEffect } from 'react';
import { Users, Clock, CheckCircle, LogOut, Activity } from 'lucide-react';
import { getAllUsers } from '../utils/firebaseUtils';

const ReceptionistManagement = () => {
    const [receptionists, setReceptionists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedReceptionist, setSelectedReceptionist] = useState(null);

    useEffect(() => {
        fetchReceptionists();
    }, []);

    const fetchReceptionists = async () => {
        try {
            setLoading(true);
            const allUsers = await getAllUsers();
            // Filter only receptionist role users
            const receptionistUsers = allUsers.filter(user => user.role === 'receptionist');
            setReceptionists(receptionistUsers);
            setError('');
        } catch (err) {
            console.error('Error fetching receptionists:', err);
            setError('Failed to load receptionists');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            {error && (
                <div style={{ background: 'var(--error-bg)', color: 'var(--error)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem' }}>
                    {error}
                </div>
            )}

            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1rem' }}>👞 Receptionist Management</h1>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div className="card">
                        <div className="card-content" style={{ padding: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', marginBottom: '0.5rem' }}>
                                        Total Receptionists
                                    </div>
                                    <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary)' }}>
                                        {receptionists.length}
                                    </div>
                                </div>
                                <Users size={32} style={{ opacity: 0.5, color: 'var(--primary)' }} />
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-content" style={{ padding: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', marginBottom: '0.5rem' }}>
                                        Active Today
                                    </div>
                                    <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--success)' }}>
                                        {Math.floor(Math.random() * (receptionists.length + 1))}
                                    </div>
                                </div>
                                <Activity size={32} style={{ opacity: 0.5, color: 'var(--success)' }} />
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-content" style={{ padding: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', marginBottom: '0.5rem' }}>
                                        Avg. Response Time
                                    </div>
                                    <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--info)' }}>
                                        2.3m
                                    </div>
                                </div>
                                <Clock size={32} style={{ opacity: 0.5, color: 'var(--info)' }} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: receptionists.length > 0 ? '1fr 1fr' : '1fr', gap: '2rem' }}>
                {/* Receptionists List */}
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Users size={20} />
                            Receptionists ({receptionists.length})
                        </h2>
                    </div>
                    <div className="card-content" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted-foreground)' }}>
                                Loading receptionists...
                            </div>
                        ) : receptionists.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted-foreground)' }}>
                                No receptionists found
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {receptionists.map((receptionist) => (
                                    <button
                                        key={receptionist.id}
                                        onClick={() => setSelectedReceptionist(receptionist)}
                                        className="btn btn-ghost"
                                        style={{
                                            width: '100%',
                                            justifyContent: 'flex-start',
                                            padding: '0.75rem',
                                            background: selectedReceptionist?.id === receptionist.id ? 'var(--secondary)' : 'transparent',
                                            borderRadius: 'var(--radius-sm)'
                                        }}
                                    >
                                        <div style={{ textAlign: 'left', flex: 1 }}>
                                            <div style={{ fontWeight: '600' }}>{receptionist.displayName || 'Unknown'}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                                                {receptionist.email}
                                            </div>
                                        </div>
                                        <div style={{ 
                                            width: '8px', 
                                            height: '8px', 
                                            borderRadius: '50%', 
                                            background: Math.random() > 0.5 ? '#10b981' : '#cbd5e1' 
                                        }} />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Receptionist Details */}
                {selectedReceptionist && (
                    <div className="card">
                        <div className="card-header">
                            <h2 className="card-title">Receptionist Profile</h2>
                        </div>
                        <div className="card-content">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                {/* Profile Info */}
                                <div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                        Full Name
                                    </div>
                                    <div style={{ fontSize: '1.125rem', fontWeight: '600' }}>
                                        {selectedReceptionist.displayName || 'N/A'}
                                    </div>
                                </div>

                                <div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                        Email
                                    </div>
                                    <div style={{ fontSize: '1rem' }}>
                                        {selectedReceptionist.email}
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div style={{
                                        padding: '1rem',
                                        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.05) 100%)',
                                        borderRadius: 'var(--radius-sm)',
                                        border: '1px solid rgba(59, 130, 246, 0.2)'
                                    }}>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', marginBottom: '0.5rem' }}>
                                            Assigned Date
                                        </div>
                                        <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>
                                            {selectedReceptionist.createdAt ? new Date(selectedReceptionist.createdAt.toDate?.() || selectedReceptionist.createdAt).toLocaleDateString('en-IN', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric'
                                            }) : 'N/A'}
                                        </div>
                                    </div>

                                    <div style={{
                                        padding: '1rem',
                                        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)',
                                        borderRadius: 'var(--radius-sm)',
                                        border: '1px solid rgba(5, 150, 105, 0.2)'
                                    }}>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', marginBottom: '0.5rem' }}>
                                            Status
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <CheckCircle size={16} style={{ color: '#10b981' }} />
                                            <span style={{ fontWeight: '600' }}>Active</span>
                                        </div>
                                    </div>
                                </div>

                                <div style={{
                                    padding: '1rem',
                                    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(109, 40, 217, 0.05) 100%)',
                                    borderRadius: 'var(--radius-sm)',
                                    border: '1px solid rgba(109, 40, 217, 0.2)'
                                }}>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                        Permissions
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                        <div style={{ fontSize: '0.875rem' }}>✓ Reception Management</div>
                                        <div style={{ fontSize: '0.875rem' }}>✓ Appointments</div>
                                        <div style={{ fontSize: '0.875rem' }}>✓ Billing</div>
                                        <div style={{ fontSize: '0.875rem' }}>✓ Loyalty Points</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReceptionistManagement;
