import { useState, useEffect } from 'react';
import { Gift, TrendingUp, History, Award, Calendar, Scissors, Barcode, Dices, X } from 'lucide-react';
import { getCustomers, getCustomerLoyaltyPoints, getCustomerPointsHistory, getVisitsByCustomer } from '../utils/firebaseUtils';

const Loyalty = () => {
    const [customers, setCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [loyaltyPoints, setLoyaltyPoints] = useState(0);
    const [pointsHistory, setPointsHistory] = useState([]);
    const [customerVisits, setCustomerVisits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [shuffleCount, setShuffleCount] = useState(1);
    const [selectedWinners, setSelectedWinners] = useState([]);
    const [showShuffleModal, setShowShuffleModal] = useState(false);
    const [isShuffling, setIsShuffling] = useState(false);

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            setLoading(true);
            const data = await getCustomers(false);
            setCustomers(data);
            setError('');
        } catch (err) {
            console.error('Error fetching customers:', err);
            setError('Failed to load customers');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectCustomer = async (customer) => {
        try {
            setSelectedCustomer(customer);
            // Use loyaltyPoints directly from customer document
            const pointsValue = customer.loyaltyPoints || 0;
            setLoyaltyPoints(pointsValue);
            
            const customerHistory = await getCustomerPointsHistory(customer.id);
            setPointsHistory(customerHistory);
            const visits = await getVisitsByCustomer(customer.id);
            setCustomerVisits(visits);
            
            // Calculate total spend from customer document
            const totalSpend = customer.totalSpent || 0;
            setSelectedCustomer(prev => ({
                ...prev,
                calculatedTotalSpent: totalSpend
            }));
            
            setError('');
        } catch (err) {
            console.error('Error fetching loyalty info:', err);
            setError('Failed to load loyalty info');
        }
    };

    const handleShuffleAndSelect = () => {
        const count = parseInt(shuffleCount) || 1;
        
        if (count <= 0) {
            setError('Please enter a valid number greater than 0');
            return;
        }
        
        if (count > customers.length) {
            setError(`Cannot select ${count} customers. Only ${customers.length} customers available.`);
            return;
        }

        setIsShuffling(true);
        
        // Simulate shuffling animation duration
        setTimeout(() => {
            // Fisher-Yates shuffle algorithm
            const shuffled = [...customers];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }

            const winners = shuffled.slice(0, count);
            setSelectedWinners(winners);
            setSuccess(`Randomly selected ${count} customer${count !== 1 ? 's' : ''} for gift!`);
            setIsShuffling(false);
            
            setTimeout(() => setSuccess(''), 5000);
        }, 2000);
    };

    const handleCloseShuffleModal = () => {
        setShowShuffleModal(false);
        setSelectedWinners([]);
        setShuffleCount(1);
    };

    return (
        <div>
            {/* Styles for animations */}
            <style>{`
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }

                @keyframes fadeIn {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }

                @keyframes shuffle {
                    0%, 100% {
                        transform: rotateX(0) rotateY(0) scale(1);
                    }
                    25% {
                        transform: rotateX(10deg) rotateY(15deg) scale(0.98);
                    }
                    50% {
                        transform: rotateX(-10deg) rotateY(-15deg) scale(0.95);
                    }
                    75% {
                        transform: rotateX(5deg) rotateY(10deg) scale(0.97);
                    }
                }

                @keyframes cardFlip {
                    0% {
                        transform: rotateY(0deg) scale(1);
                    }
                    50% {
                        transform: rotateY(90deg) scale(1.05);
                    }
                    100% {
                        transform: rotateY(0deg) scale(1);
                    }
                }

                @keyframes pulse-glow {
                    0%, 100% {
                        box-shadow: 0 0 0 0 rgba(168, 85, 247, 0.7);
                    }
                    50% {
                        box-shadow: 0 0 0 15px rgba(168, 85, 247, 0);
                    }
                }

                .shuffle-modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    animation: fadeIn 0.3s ease-out;
                    backdrop-filter: blur(4px);
                }

                .shuffle-modal {
                    background: var(--background);
                    border: 1px solid var(--border);
                    border-radius: 12px;
                    padding: 2rem;
                    max-width: 600px;
                    width: 90%;
                    max-height: 90vh;
                    overflow-y: auto;
                    animation: slideIn 0.3s ease-out;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                }

                .shuffling-container {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 300px;
                    gap: 1rem;
                    margin: 2rem 0;
                    flex-wrap: wrap;
                }

                .shuffle-card {
                    width: 100px;
                    height: 120px;
                    background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%);
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: 700;
                    animation: ${isShuffling ? 'shuffle 0.8s infinite' : 'none'};
                    perspective: 1000px;
                    box-shadow: 0 10px 25px rgba(168, 85, 247, 0.3);
                }

                .shuffle-card-1 { animation-delay: 0s; }
                .shuffle-card-2 { animation-delay: 0.1s; }
                .shuffle-card-3 { animation-delay: 0.2s; }

                .winner-card {
                    animation: slideIn 0.5s ease-out;
                }

                .winner-card:nth-child(1) { animation-delay: 0.1s; }
                .winner-card:nth-child(2) { animation-delay: 0.2s; }
                .winner-card:nth-child(3) { animation-delay: 0.3s; }
                .winner-card:nth-child(4) { animation-delay: 0.4s; }
                .winner-card:nth-child(5) { animation-delay: 0.5s; }

                .pulse-gift {
                    animation: pulse-glow 2s infinite;
                }
            `}</style>

            {error && <div style={{ background: 'var(--error-bg)', color: 'var(--error)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem' }}>{error}</div>}
            {success && <div style={{ background: 'var(--success-bg)', color: 'var(--success)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem' }}>{success}</div>}

            {/* Shuffle Modal */}
            {showShuffleModal && (
                <div className="shuffle-modal-overlay" onClick={handleCloseShuffleModal}>
                    <div className="shuffle-modal" onClick={(e) => e.stopPropagation()}>
                        {/* Close Button */}
                        <button
                            onClick={handleCloseShuffleModal}
                            style={{
                                position: 'absolute',
                                top: '1rem',
                                right: '1rem',
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                color: 'var(--muted-foreground)',
                                padding: '0.5rem'
                            }}
                        >
                            <X size={24} />
                        </button>

                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                                🎁 Shuffle & Select Winners
                            </h2>
                            <p style={{ color: 'var(--muted-foreground)' }}>
                                Randomly select customers for special gifts
                            </p>
                        </div>

                        {/* Number Input */}
                        <div style={{ marginBottom: '2rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.95rem', fontWeight: 600 }}>
                                How many winners do you need?
                            </label>
                            <input
                                type="number"
                                value={shuffleCount}
                                onChange={(e) => setShuffleCount(e.target.value)}
                                min="1"
                                max={customers.length}
                                disabled={isShuffling}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '2px solid var(--border)',
                                    borderRadius: '8px',
                                    background: 'var(--secondary)',
                                    color: 'var(--foreground)',
                                    fontSize: '1.1rem',
                                    textAlign: 'center',
                                    fontWeight: 600
                                }}
                                placeholder="Enter number"
                            />
                            <div style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', marginTop: '0.5rem', textAlign: 'center' }}>
                                Total customers available: <strong>{customers.length}</strong>
                            </div>
                        </div>

                        {/* Shuffling Animation */}
                        {isShuffling && (
                            <div className="shuffling-container">
                                <div className="shuffle-card shuffle-card-1">♠</div>
                                <div className="shuffle-card shuffle-card-2">♥</div>
                                <div className="shuffle-card shuffle-card-3">♦</div>
                            </div>
                        )}

                        {/* Selected Winners Display */}
                        {selectedWinners.length > 0 && !isShuffling && (
                            <div style={{ marginBottom: '2rem' }}>
                                <div style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: 600 }}>
                                    ✨ Your Lucky Winners! ✨
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {selectedWinners.map((winner, idx) => (
                                        <div
                                            key={winner.id}
                                            className="winner-card"
                                            style={{
                                                padding: '1rem',
                                                background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.15) 0%, rgba(202, 138, 4, 0.08) 100%)',
                                                border: '2px solid rgba(234, 179, 8, 0.4)',
                                                borderRadius: '10px',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            }}
                                        >
                                            <div>
                                                <div style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.25rem', color: '#eab308' }}>
                                                    🏆 Winner #{idx + 1}
                                                </div>
                                                <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                                                    {winner.name}
                                                </div>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)' }}>
                                                    {winner.phone || winner.contactNo}
                                                </div>
                                            </div>
                                            <div style={{
                                                background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
                                                color: 'white',
                                                padding: '0.5rem 1rem',
                                                borderRadius: '50px',
                                                fontSize: '0.85rem',
                                                fontWeight: 700,
                                                textAlign: 'center'
                                            }}>
                                                {winner.loyaltyPoints || 0} <br /> pts
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                onClick={handleShuffleAndSelect}
                                disabled={isShuffling}
                                style={{
                                    flex: 1,
                                    padding: '0.875rem',
                                    background: isShuffling ? 'var(--muted-foreground)' : 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: 700,
                                    cursor: isShuffling ? 'not-allowed' : 'pointer',
                                    fontSize: '1rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    opacity: isShuffling ? 0.6 : 1
                                }}
                            >
                                <Dices size={20} />
                                {isShuffling ? 'Shuffling...' : 'Shuffle & Select'}
                            </button>
                            <button
                                onClick={handleCloseShuffleModal}
                                style={{
                                    padding: '0.875rem 1.5rem',
                                    background: 'var(--secondary)',
                                    color: 'var(--foreground)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '8px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    fontSize: '1rem'
                                }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Top Bar with Shuffle Button */}
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>💎 Loyalty Management</h1>
                <button
                    onClick={() => setShowShuffleModal(true)}
                    className="pulse-gift"
                    style={{
                        padding: '0.75rem 1.5rem',
                        background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontSize: '0.95rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                >
                    <Dices size={18} />
                    Shuffle Winners
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {/* Customer Selection */}
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">
                            <Award size={20} />
                            Select Customer
                        </h2>
                    </div>
                    <div className="card-content">
                        <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                            {[...customers].sort((a, b) => {
                                // Sort by loyaltyPoints first (highest first)
                                const pointsDiff = (b.loyaltyPoints || 0) - (a.loyaltyPoints || 0);
                                if (pointsDiff !== 0) return pointsDiff;
                                // If points are equal, sort by totalSpent (highest first)
                                return (b.totalSpent || 0) - (a.totalSpent || 0);
                            }).map(customer => (
                                <button
                                    key={customer.id}
                                    onClick={() => handleSelectCustomer(customer)}
                                    className="btn btn-ghost"
                                    style={{
                                        width: '100%',
                                        justifyContent: 'flex-start',
                                        padding: '0.75rem',
                                        marginBottom: '0.5rem',
                                        background: selectedCustomer?.id === customer.id ? 'var(--secondary)' : 'transparent',
                                        borderRadius: 'var(--radius-sm)'
                                    }}
                                >
                                    <div style={{ textAlign: 'left', flex: 1 }}>
                                        <div style={{ fontWeight: 600 }}>{customer.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{customer.phone || customer.contactNo}</div>
                                    </div>
                                    <div style={{ background: 'var(--primary-gradient)', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600 }}>
                                        {customer.loyaltyPoints || 0} pts
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Customer Loyalty Details */}
                {selectedCustomer && (
                    <div style={{ gridColumn: 'span 1' }}>
                        <div className="card">
                            <div className="card-header">
                                <h2 className="card-title">
                                    <Gift size={20} />
                                    {selectedCustomer.name} - Loyalty
                                </h2>
                            </div>
                            <div className="card-content">
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                    {/* Total Points */}
                                    <div style={{
                                        padding: '1rem',
                                        background: 'linear-gradient(135deg, rgba(232, 197, 71, 0.1) 0%, rgba(201, 162, 39, 0.05) 100%)',
                                        borderRadius: 'var(--radius-sm)',
                                        border: '1px solid rgba(201, 162, 39, 0.2)'
                                    }}>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', marginBottom: '0.5rem' }}>Available Loyalty Points</div>
                                        <div style={{ fontSize: '2rem', fontWeight: 700, color: '#a855f7' }}>{loyaltyPoints}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginTop: '0.25rem' }}>{Math.floor(loyaltyPoints / 20)} available as rupees</div>
                                    </div>

                                    {/* Total Spent */}
                                    <div style={{
                                        padding: '1rem',
                                        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)',
                                        borderRadius: 'var(--radius-sm)',
                                        border: '1px solid rgba(5, 150, 105, 0.2)'
                                    }}>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', marginBottom: '0.5rem' }}>Total Spent</div>
                                        <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--success)' }}>₹{(selectedCustomer.calculatedTotalSpent || 0).toFixed(2)}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginTop: '0.25rem' }}>{Math.floor((selectedCustomer.calculatedTotalSpent || 0) * 1)} loyalty points earned</div>
                                    </div>

                                    {/* Total Visits */}
                                    <div style={{
                                        padding: '1rem',
                                        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.05) 100%)',
                                        borderRadius: 'var(--radius-sm)',
                                        border: '1px solid rgba(59, 130, 246, 0.2)'
                                    }}>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', marginBottom: '0.5rem' }}>Total Visits</div>
                                        <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--info)' }}>{selectedCustomer.totalVisits || customerVisits.length}</div>
                                    </div>

                                    {/* Average Spend Per Visit */}
                                    <div style={{
                                        padding: '1rem',
                                        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(109, 40, 217, 0.05) 100%)',
                                        borderRadius: 'var(--radius-sm)',
                                        border: '1px solid rgba(109, 40, 217, 0.2)'
                                    }}>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', marginBottom: '0.5rem' }}>Avg Spend/Visit</div>
                                        <div style={{ fontSize: '2rem', fontWeight: 700, color: '#8b5cf6' }}>₹{customerVisits.length > 0 ? ((selectedCustomer.calculatedTotalSpent || 0) / customerVisits.length).toFixed(2) : '0'}</div>
                                    </div>
                                </div>

                                {/* Points History */}
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 600, marginBottom: '1rem' }}>
                                        <History size={16} />
                                        Points History
                                    </div>
                                    {pointsHistory.length > 0 ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                            {pointsHistory.slice(0, 10).map((tx) => (
                                                <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--secondary)', borderRadius: 'var(--radius-sm)' }}>
                                                    <div>
                                                        <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                                                            {tx.description || `${tx.type === 'earned' ? 'Points Earned' : tx.type === 'deducted' ? 'Points Used' : 'Points Adjusted'}`}
                                                        </div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                                                            {new Date(tx.transactionDate?.toDate?.() || tx.transactionDate).toLocaleDateString('en-IN', {
                                                                day: 'numeric',
                                                                month: 'short',
                                                                year: 'numeric'
                                                            })}
                                                            {tx.billDetails?.amountSpent && ` • ₹${tx.billDetails.amountSpent}`}
                                                        </div>
                                                    </div>
                                                    <div style={{ 
                                                        fontSize: '0.875rem', 
                                                        fontWeight: 600,
                                                        color: tx.points > 0 ? '#10b981' : '#ef4444'
                                                    }}>
                                                        {tx.points > 0 ? '+' : ''}{tx.points} pts
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div style={{ textAlign: 'center', color: 'var(--muted-foreground)', padding: '2rem' }}>
                                            No transaction history
                                        </div>
                                    )}
                                </div>

                                {/* Visit History Section Below Points History */}
                                {customerVisits.length > 0 && (
                                    <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '2px solid var(--border)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 600, marginBottom: '1rem' }}>
                                            <Calendar size={16} />
                                            Visit History ({customerVisits.length})
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '400px', overflowY: 'auto' }}>
                                            {customerVisits.map((visit, idx) => (
                                                <div key={visit.id} style={{
                                                    padding: '0.75rem',
                                                    background: 'rgba(100, 116, 139, 0.1)',
                                                    borderRadius: 'var(--radius-sm)',
                                                    border: '1px solid rgba(100, 116, 139, 0.2)',
                                                    transition: 'all 0.2s',
                                                    cursor: 'pointer'
                                                }}
                                                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(100, 116, 139, 0.5)'}
                                                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(100, 116, 139, 0.2)'}
                                                >
                                                    {/* Visit Header */}
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ fontWeight: 600, color: 'var(--foreground)', fontSize: '0.9rem', marginBottom: '0.2rem' }}>
                                                                Visit #{idx + 1}
                                                            </div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                                                                <Calendar size={12} />
                                                                {new Date(visit.date?.toDate?.() || visit.date).toLocaleDateString('en-IN', { 
                                                                    day: 'numeric', 
                                                                    month: 'short', 
                                                                    year: 'numeric',
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                })}
                                                            </div>
                                                        </div>
                                                        <div style={{
                                                            padding: '0.2rem 0.6rem',
                                                            borderRadius: '999px',
                                                            fontSize: '0.7rem',
                                                            fontWeight: 600,
                                                            background: visit.status === 'COMPLETED' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                                                            color: visit.status === 'COMPLETED' ? '#10b981' : '#3b82f6'
                                                        }}>
                                                            {visit.status || 'UNKNOWN'}
                                                        </div>
                                                    </div>

                                                    {/* Amount & Payment Info */}
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.75rem', marginBottom: '0.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(100, 116, 139, 0.15)' }}>
                                                        <div>
                                                            <div style={{ color: 'var(--muted-foreground)', marginBottom: '0.1rem' }}>Total: </div>
                                                            <div style={{ fontWeight: 600, color: 'var(--foreground)' }}>₹{(visit.totalAmount || 0).toFixed(2)}</div>
                                                        </div>
                                                        <div>
                                                            <div style={{ color: 'var(--muted-foreground)', marginBottom: '0.1rem' }}>Paid: </div>
                                                            <div style={{ fontWeight: 600, color: visit.paidAmount >= visit.totalAmount ? '#10b981' : '#ef4444' }}>₹{(visit.paidAmount || 0).toFixed(2)}</div>
                                                        </div>
                                                    </div>

                                                    {/* Services Summary */}
                                                    {visit.items && visit.items.length > 0 && (
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                                                            {visit.items.length} service{visit.items.length !== 1 ? 's' : ''}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Visit Details Section */}
                {selectedCustomer && customerVisits.length > 0 && (
                    <div style={{ gridColumn: 'span 1' }}>
                        <div className="card">
                            <div className="card-header">
                                <h2 className="card-title">
                                    <Calendar size={20} />
                                    Visit History ({customerVisits.length})
                                </h2>
                            </div>
                            <div className="card-content">
                                <div style={{ maxHeight: '600px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {customerVisits.map((visit, idx) => (
                                        <div key={visit.id} style={{
                                            padding: '1rem',
                                            background: 'var(--secondary)',
                                            borderRadius: 'var(--radius-sm)',
                                            border: '1px solid rgba(100, 116, 139, 0.2)',
                                            transition: 'all 0.2s',
                                            cursor: 'pointer'
                                        }}
                                            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(100, 116, 139, 0.5)'}
                                            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(100, 116, 139, 0.2)'}
                                        >
                                            {/* Visit Header */}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem' }}>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: 600, color: 'var(--foreground)', fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                                                        Visit #{idx + 1}
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                                                        <Calendar size={12} />
                                                        {new Date(visit.date?.toDate?.() || visit.date).toLocaleDateString('en-IN', { 
                                                            day: 'numeric', 
                                                            month: 'short', 
                                                            year: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </div>
                                                </div>
                                                <div style={{
                                                    padding: '0.25rem 0.75rem',
                                                    borderRadius: '999px',
                                                    fontSize: '0.7rem',
                                                    fontWeight: 600,
                                                    background: visit.status === 'COMPLETED' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                                                    color: visit.status === 'COMPLETED' ? '#10b981' : '#3b82f6'
                                                }}>
                                                    {visit.status || 'UNKNOWN'}
                                                </div>
                                            </div>

                                            {/* Services & Products */}
                                            {visit.items && visit.items.length > 0 && (
                                                <div style={{ marginBottom: '0.75rem' }}>
                                                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                                        <Scissors size={12} />
                                                        Services & Products ({visit.items.length})
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                                        {visit.items.slice(0, 3).map((item, i) => (
                                                            <div key={i} style={{ fontSize: '0.75rem', color: 'var(--foreground)', paddingLeft: '1.25rem' }}>
                                                                <span style={{ color: 'var(--muted-foreground)' }}>•</span> {item.name} <span style={{ color: 'var(--muted-foreground)' }}>x{item.quantity} @ ₹{item.price}</span>
                                                            </div>
                                                        ))}
                                                        {visit.items.length > 3 && (
                                                            <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', paddingLeft: '1.25rem' }}>
                                                                +{visit.items.length - 3} more items
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Amount Details */}
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.75rem', marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(100, 116, 139, 0.2)' }}>
                                                <div>
                                                    <div style={{ color: 'var(--muted-foreground)', marginBottom: '0.15rem' }}>Total Amount</div>
                                                    <div style={{ fontWeight: 600, color: 'var(--foreground)' }}>₹{(visit.totalAmount || 0).toFixed(2)}</div>
                                                </div>
                                                <div>
                                                    <div style={{ color: 'var(--muted-foreground)', marginBottom: '0.15rem' }}>Amount Paid</div>
                                                    <div style={{ fontWeight: 600, color: visit.paidAmount >= visit.totalAmount ? '#10b981' : '#ef4444' }}>₹{(visit.paidAmount || 0).toFixed(2)}</div>
                                                </div>
                                            </div>

                                            {/* Payment & Invoice Info */}
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.75rem' }}>
                                                {visit.paymentMode && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--muted-foreground)' }}>
                                                        <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'currentColor' }} />
                                                        Payment: {visit.paymentMode}
                                                    </div>
                                                )}
                                                {visit.invoiceId && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--muted-foreground)' }}>
                                                        <Barcode size={12} />
                                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            Inv: {visit.invoiceId.substring(0, 8)}...
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default Loyalty;