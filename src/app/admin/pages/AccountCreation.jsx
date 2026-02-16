import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, X, Eye, EyeOff, UserPlus, Users } from 'lucide-react';
import { createUserAccount, getAllUsers, deleteUserAccount, updateUserRole } from '../utils/firebaseUtils';

const AccountCreation = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [formType, setFormType] = useState('receptionist'); // 'receptionist' or 'admin'
    const [showPassword, setShowPassword] = useState(false);
    const [userFilter, setUserFilter] = useState('all'); // 'all', 'admin', 'receptionist'
    
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        displayName: '',
        role: 'receptionist'
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const allUsers = await getAllUsers();
            setUsers(allUsers);
            setError('');
        } catch (err) {
            console.error('Error fetching users:', err);
            setError('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const validateForm = () => {
        if (!formData.email.trim()) {
            setError('Email is required');
            return false;
        }
        if (!formData.password.trim()) {
            setError('Password is required');
            return false;
        }
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return false;
        }
        if (!formData.displayName.trim()) {
            setError('Display name is required');
            return false;
        }
        return true;
    };

    const handleCreateAccount = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!validateForm()) return;

        try {
            setLoading(true);
            // Set role based on formType
            const role = formType === 'admin' ? 'admin' : 'receptionist';
            await createUserAccount(formData.email, formData.password, formData.displayName, role);
            setSuccess(`${role === 'admin' ? 'Admin' : 'Receptionist'} account created successfully!`);
            setFormData({ email: '', password: '', displayName: '', role: 'receptionist' });
            setShowForm(false);
            await fetchUsers();
        } catch (err) {
            setError(err.message || 'Failed to create account');
        } finally {
            setLoading(false);
        }
    };

    const handleQuickAddReceptionist = () => {
        setFormType('receptionist');
        setFormData({ email: '', password: '', displayName: '', role: 'receptionist' });
        setShowForm(true);
    };

    const handleDeleteUser = async (uid, userName) => {
        if (!window.confirm(`Are you sure you want to delete ${userName}'s account?`)) return;

        try {
            setLoading(true);
            await deleteUserAccount(uid);
            setSuccess(`${userName}'s account deleted successfully`);
            await fetchUsers();
        } catch (err) {
            setError('Failed to delete account');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateRole = async (uid, newRole) => {
        try {
            setLoading(true);
            await updateUserRole(uid, newRole);
            setSuccess('User role updated successfully');
            await fetchUsers();
        } catch (err) {
            setError('Failed to update user role');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setShowForm(false);
        setFormData({ email: '', password: '', displayName: '', role: 'receptionist' });
        setError('');
    };

    return (
        <div>
            {error && (
                <div style={{ background: 'var(--error-bg)', color: 'var(--error)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{error}</span>
                    <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>
                        <X size={18} />
                    </button>
                </div>
            )}
            {success && (
                <div style={{ background: 'var(--success-bg)', color: 'var(--success)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{success}</span>
                    <button onClick={() => setSuccess('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>
                        <X size={18} />
                    </button>
                </div>
            )}

            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: 0, marginBottom: '1rem' }}>👥 Account Management</h1>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <button
                        onClick={handleQuickAddReceptionist}
                        className="btn"
                        style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.5rem',
                            padding: '0.625rem 1.5rem',
                            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)',
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                            color: '#3b82f6',
                            borderRadius: '0.375rem',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '0.875rem'
                        }}
                    >
                        <Users size={18} />
                        Add Receptionist
                    </button>
                    <button
                        onClick={() => {
                            setFormType('admin');
                            setFormData({ email: '', password: '', displayName: '', role: 'admin' });
                            setShowForm(true);
                        }}
                        className="btn"
                        style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.5rem',
                            padding: '0.625rem 1.5rem',
                            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: '#ef4444',
                            borderRadius: '0.375rem',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '0.875rem'
                        }}
                    >
                        <UserPlus size={18} />
                        Add Admin
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: showForm ? '1fr 1fr' : '1fr', gap: '2rem' }}>
                {/* Create Account Form */}
                {showForm && (
                    <div className="card">
                        <div className="card-header">
                            <h2 className="card-title">
                                {formType === 'admin' ? 'Create Admin Account' : 'Create Receptionist Account'}
                            </h2>
                        </div>
                        <div className="card-content">
                            <form onSubmit={handleCreateAccount} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--muted-foreground)' }}>
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        name="displayName"
                                        className="input"
                                        value={formData.displayName}
                                        onChange={handleInputChange}
                                        placeholder="Enter full name"
                                        required
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--muted-foreground)' }}>
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        className="input"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        placeholder="email@example.com"
                                        required
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--muted-foreground)' }}>
                                        Password
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            name="password"
                                            className="input"
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            placeholder="Minimum 6 characters"
                                            required
                                            style={{ paddingRight: '2.75rem' }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            style={{
                                                position: 'absolute',
                                                right: '1rem',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                color: 'var(--muted-foreground)'
                                            }}
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--muted-foreground)' }}>
                                        Role
                                    </label>
                                    <div style={{
                                        padding: '0.625rem 1rem',
                                        background: 'var(--secondary)',
                                        border: '1px solid var(--border)',
                                        borderRadius: 'var(--radius-sm)',
                                        fontSize: '0.875rem',
                                        fontWeight: '500'
                                    }}>
                                        {formType === 'admin' ? 'Admin Account' : 'Receptionist Account'}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button 
                                        type="submit" 
                                        className="btn btn-primary" 
                                        style={{ flex: 1 }} 
                                        disabled={loading}
                                    >
                                        <Plus size={18} style={{ marginRight: '0.5rem' }} />
                                        {loading ? 'Creating...' : `Create ${formType === 'admin' ? 'Admin' : 'Receptionist'}`}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleCancel}
                                        style={{
                                            flex: 1,
                                            padding: '0.625rem',
                                            background: 'transparent',
                                            border: '1px solid var(--border)',
                                            borderRadius: 'var(--radius-sm)',
                                            cursor: 'pointer',
                                            color: 'var(--foreground)',
                                            fontWeight: '500'
                                        }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Users List */}
                <div className="card">
                    <div className="card-header">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                            <h2 className="card-title">Active Accounts ({users.length})</h2>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    onClick={() => setUserFilter('all')}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        background: userFilter === 'all' ? 'var(--primary)' : 'transparent',
                                        color: userFilter === 'all' ? 'white' : 'var(--foreground)',
                                        border: userFilter === 'all' ? 'none' : '1px solid var(--border)',
                                        borderRadius: '0.375rem',
                                        cursor: 'pointer',
                                        fontSize: '0.75rem',
                                        fontWeight: '600'
                                    }}
                                >
                                    All
                                </button>
                                <button
                                    onClick={() => setUserFilter('admin')}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        background: userFilter === 'admin' ? '#ef4444' : 'transparent',
                                        color: userFilter === 'admin' ? 'white' : 'var(--foreground)',
                                        border: userFilter === 'admin' ? 'none' : '1px solid var(--border)',
                                        borderRadius: '0.375rem',
                                        cursor: 'pointer',
                                        fontSize: '0.75rem',
                                        fontWeight: '600'
                                    }}
                                >
                                    Admin
                                </button>
                                <button
                                    onClick={() => setUserFilter('receptionist')}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        background: userFilter === 'receptionist' ? '#3b82f6' : 'transparent',
                                        color: userFilter === 'receptionist' ? 'white' : 'var(--foreground)',
                                        border: userFilter === 'receptionist' ? 'none' : '1px solid var(--border)',
                                        borderRadius: '0.375rem',
                                        cursor: 'pointer',
                                        fontSize: '0.75rem',
                                        fontWeight: '600'
                                    }}
                                >
                                    Receptionist
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="card-content" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                        {loading && !showForm ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted-foreground)' }}>
                                Loading accounts...
                            </div>
                        ) : users.filter(u => userFilter === 'all' ? true : u.role === userFilter).length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted-foreground)' }}>
                                No {userFilter === 'all' ? 'accounts' : userFilter} found
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {users.filter(u => userFilter === 'all' ? true : u.role === userFilter).map(user => (
                                    <div
                                        key={user.id}
                                        style={{
                                            padding: '1rem',
                                            background: 'rgba(255, 255, 255, 0.05)',
                                            border: '1px solid var(--glass-border)',
                                            borderRadius: 'var(--radius-sm)',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}
                                    >
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: '600', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                {user.displayName || 'Unknown'}
                                                <span style={{
                                                    fontSize: '0.75rem',
                                                    padding: '0.25rem 0.5rem',
                                                    background: user.role === 'admin' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                                                    color: user.role === 'admin' ? '#ef4444' : '#3b82f6',
                                                    borderRadius: '0.25rem',
                                                    fontWeight: '700'
                                                }}>
                                                    {user.role === 'admin' ? 'Admin' : 'Receptionist'}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                                                {user.email}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteUser(user.id, user.displayName)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                color: 'var(--danger)',
                                                opacity: 0.7,
                                                padding: '0.5rem'
                                            }}
                                            className="hover:opacity-100"
                                            title="Delete account"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AccountCreation;
