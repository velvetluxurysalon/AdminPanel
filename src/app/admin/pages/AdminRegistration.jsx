import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '../../../firebaseConfig';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Scissors, Mail, Lock, User, Eye, EyeOff, ArrowLeft } from 'lucide-react';

const AdminRegistration = () => {
    const [displayName, setDisplayName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const navigate = useNavigate();

    const validateForm = () => {
        if (!displayName.trim()) {
            setError('Full name is required');
            return false;
        }
        if (!email.trim()) {
            setError('Email is required');
            return false;
        }
        if (!email.includes('@')) {
            setError('Invalid email format');
            return false;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return false;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return false;
        }
        return true;
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (!validateForm()) {
                setLoading(false);
                return;
            }

            // Create user in Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            
            // Update user profile
            await updateProfile(userCredential.user, { displayName });

            // Create user document in Firestore with admin role
            await setDoc(doc(db, 'users', userCredential.user.uid), {
                email: userCredential.user.email,
                displayName: displayName,
                role: 'admin',
                createdAt: serverTimestamp(),
                isFirstAdmin: true
            });

            // Add a small delay to ensure Firestore sync completes
            await new Promise(resolve => setTimeout(resolve, 500));

            // Redirect to dashboard
            navigate('/admin');
        } catch (err) {
            console.error('Registration error:', err);
            if (err.code === 'auth/email-already-in-use') {
                setError('Email is already registered');
            } else if (err.code === 'auth/weak-password') {
                setError('Password is too weak');
            } else {
                setError(err.message || 'Failed to create admin account');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            padding: '1rem',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%)'
        }}>
            <div className="card animate-slideUp" style={{ width: '100%', maxWidth: '480px' }}>
                {/* Header */}
                <div style={{ 
                    padding: '2rem 2rem 1.5rem', 
                    textAlign: 'center',
                    borderBottom: '1px solid var(--border-light)'
                }}>
                    <div style={{
                        width: 60,
                        height: 60,
                        background: 'var(--primary-gradient)',
                        borderRadius: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1rem'
                    }}>
                        <Scissors size={28} color="white" />
                    </div>
                    <h1 style={{ 
                        fontSize: '1.75rem', 
                        fontWeight: '700', 
                        color: 'var(--foreground)', 
                        marginBottom: '0.25rem' 
                    }}>Velvet Luxury Salon</h1>
                    <p style={{ color: 'var(--muted-foreground)', fontSize: '0.9375rem' }}>Create Admin Account</p>
                </div>

                {/* Form */}
                <div style={{ padding: '1.5rem 2rem 2rem' }}>
                    <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="label">Full Name</label>
                            <div className="input-group">
                                <User size={18} className="input-icon" />
                                <input
                                    type="text"
                                    className="input"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    placeholder="Enter your full name"
                                    required
                                    style={{ paddingLeft: '2.75rem' }}
                                />
                            </div>
                        </div>

                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="label">Email Address</label>
                            <div className="input-group">
                                <Mail size={18} className="input-icon" />
                                <input
                                    type="email"
                                    className="input"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="admin@example.com"
                                    required
                                    style={{ paddingLeft: '2.75rem' }}
                                />
                            </div>
                        </div>

                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="label">Password</label>
                            <div className="input-group" style={{ position: 'relative' }}>
                                <Lock size={18} className="input-icon" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    className="input"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Minimum 6 characters"
                                    required
                                    style={{ paddingLeft: '2.75rem', paddingRight: '2.75rem' }}
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
                                        color: 'var(--muted-foreground)',
                                        display: 'flex',
                                        alignItems: 'center'
                                    }}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="label">Confirm Password</label>
                            <div className="input-group" style={{ position: 'relative' }}>
                                <Lock size={18} className="input-icon" />
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    className="input"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm password"
                                    required
                                    style={{ paddingLeft: '2.75rem', paddingRight: '2.75rem' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    style={{
                                        position: 'absolute',
                                        right: '1rem',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: 'var(--muted-foreground)',
                                        display: 'flex',
                                        alignItems: 'center'
                                    }}
                                >
                                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="alert alert-danger" style={{ marginBottom: 0 }}>
                                {error}
                            </div>
                        )}

                        <button 
                            type="submit" 
                            className="btn btn-primary btn-lg" 
                            style={{ width: '100%', marginTop: '0.5rem' }} 
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <div className="loading-spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></div>
                                    Creating Account...
                                </>
                            ) : 'Create Admin Account'}
                        </button>

                        <div style={{ textAlign: 'center', fontSize: '0.875rem' }}>
                            <span style={{ color: 'var(--muted-foreground)' }}>Already have an account? </span>
                            <Link 
                                to="/admin/login" 
                                style={{ 
                                    color: 'var(--primary)', 
                                    textDecoration: 'none', 
                                    fontWeight: '600',
                                    borderBottom: '2px solid var(--primary)'
                                }}
                            >
                                Sign in
                            </Link>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div style={{ 
                    padding: '1rem 2rem', 
                    background: 'var(--muted)', 
                    borderTop: '1px solid var(--border-light)',
                    textAlign: 'center',
                    fontSize: '0.8125rem',
                    color: 'var(--muted-foreground)'
                }}>
                    Kalingarayanpalayam, Bhavani, Erode District, Tamil Nadu
                </div>
            </div>
        </div>
    );
};

export default AdminRegistration;
