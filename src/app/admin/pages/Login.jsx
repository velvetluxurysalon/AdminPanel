import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { Scissors, Mail, Lock, UserPlus } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            
            // Fetch user role from Firestore
            const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
            if (userDoc.exists()) {
                const userRole = userDoc.data().role || 'receptionist';
                console.log(`User logged in with role: ${userRole}`);
            }
            
            navigate('/');
        } catch (err) {
            setError(err.message || 'Failed to login');
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
            <div className="card animate-slideUp" style={{ width: '100%', maxWidth: '420px' }}>
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
                    <p style={{ color: 'var(--muted-foreground)', fontSize: '0.9375rem' }}>Welcome back! Please sign in.</p>
                </div>

                {/* Form */}
                <div style={{ padding: '1.5rem 2rem 2rem' }}>
                    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="label">Email Address</label>
                            <div className="input-group">
                                <Mail size={18} className="input-icon" />
                                <input
                                    type="email"
                                    className="input"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    required
                                    style={{ paddingLeft: '2.75rem' }}
                                />
                            </div>
                        </div>

                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="label">Password</label>
                            <div className="input-group">
                                <Lock size={18} className="input-icon" />
                                <input
                                    type="password"
                                    className="input"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    required
                                    style={{ paddingLeft: '2.75rem' }}
                                />
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
                                    Signing in...
                                </>
                            ) : 'Sign In'}
                        </button>

                        <div style={{ textAlign: 'center', borderTop: '1px solid var(--border-light)', paddingTop: '1rem', marginTop: '1rem' }}>
                            <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', marginBottom: '0.75rem' }}>
                                Don't have an admin account yet?
                            </p>
                            <Link
                                to="/admin/register"
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.625rem 1.5rem',
                                    background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0.05) 100%)',
                                    border: '1px solid rgba(34, 197, 94, 0.3)',
                                    borderRadius: '0.375rem',
                                    color: '#22c55e',
                                    textDecoration: 'none',
                                    fontSize: '0.875rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.background = 'linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(34, 197, 94, 0.1) 100%)';
                                    e.target.style.borderColor = 'rgba(34, 197, 94, 0.5)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0.05) 100%)';
                                    e.target.style.borderColor = 'rgba(34, 197, 94, 0.3)';
                                }}
                            >
                                <UserPlus size={18} />
                                Create Admin Account
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

export default Login;
