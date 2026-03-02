import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Calendar, Plus, Trash2, Printer, ArrowLeft, ShoppingBag, Scissors, CheckCircle, Star } from 'lucide-react';
import FeedbackModal from '../components/FeedbackModal';
import { getDocument, getServices, getProducts, getStaff, addVisitItem, removeVisitItem, createInvoice } from '../utils/firebaseUtils';

const VisitDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [visit, setVisit] = useState(null);
    const [services, setServices] = useState([]);
    const [products, setProducts] = useState([]);
    const [staffList, setStaffList] = useState([]);
    const [taxPercent, setTaxPercent] = useState(18);
    const [discountPercent, setDiscountPercent] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Modal states
    const [showAddService, setShowAddService] = useState(false);
    const [showAddProduct, setShowAddProduct] = useState(false);
    const [showFeedback, setShowFeedback] = useState(false);

    useEffect(() => {
        fetchVisit();
        fetchResources();
    }, [id]);

    const fetchVisit = async () => {
        try {
            const data = await getDocument('visits', id);
            setVisit(data);
            setError('');
        } catch (error) {
            console.error('Error fetching visit:', error);
            setError('Failed to load visit');
        }
    };

    const fetchResources = async () => {
        try {
            setLoading(true);
            const [sData, pData, stData] = await Promise.all([
                getServices(false),
                getProducts(),
                getStaff()
            ]);
            setServices(sData);
            setProducts(pData);
            setStaffList(stData);
            setError('');
        } catch (error) {
            console.error('Error fetching resources:', error);
            setError('Failed to load resources');
        } finally {
            setLoading(false);
        }
    };

    const handleAddItem = async (type, itemId, name, price) => {
        try {
            setLoading(true);
            await addVisitItem(id, {
                type: type,
                itemId: itemId,
                name: name,
                price: price,
                quantity: 1
            });
            await fetchVisit();
            setShowAddService(false);
            setShowAddProduct(false);
            setError('');
        } catch (error) {
            console.error('Error adding item:', error);
            setError('Failed to add item');
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveItem = async (itemId) => {
        if (!confirm('Remove this item?')) return;
        
        try {
            setLoading(true);
            await removeVisitItem(id, itemId);
            await fetchVisit();
            setError('');
        } catch (error) {
            console.error('Error removing item:', error);
            setError('Failed to remove item');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateInvoice = async () => {
        try {
            setLoading(true);
            await createInvoice(id);
            await fetchVisit();
            setError('');
        } catch (error) {
            console.error('Error generating invoice:', error);
            setError('Failed to generate invoice');
        } finally {
            setLoading(false);
        }
    };

    if (!visit) return <div>Loading...</div>;

    return (
        <div>
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button onClick={() => navigate('/')} className="btn btn-secondary" style={{ padding: '0.5rem' }}>
                    <ArrowLeft size={20} />
                </button>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <span style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '999px',
                        background: visit.status === 'COMPLETED' ? 'var(--success)' : 'var(--primary)',
                        color: visit.status === 'COMPLETED' ? 'white' : 'black',
                        fontWeight: '600'
                    }}>
                        {visit.status.replace('_', ' ')}
                    </span>
                </div>
            </div>

            <div className="grid-responsive">
                {/* Main Content: Services & Products */}
                <div className="card">
                    <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 className="card-title">Services & Products</h2>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {visit.status !== 'COMPLETED' && (
                                <button className="btn btn-primary" onClick={() => setShowAddService(true)}>
                                    <Plus size={16} /> Add Service
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="card-content">
                        <table style={{ width: '100%' }}>
                            <thead>
                                <tr>
                                    <th>Item</th>
                                    <th>Type</th>
                                    <th>Staff</th>
                                    <th style={{ textAlign: 'right' }}>Price</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {visit.items.map(item => (
                                    <tr key={item.id}>
                                        <td style={{ fontWeight: '500' }}>{item.service?.name || item.product?.name}</td>
                                        <td>
                                            <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: item.type === 'SERVICE' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(245, 158, 11, 0.1)', color: item.type === 'SERVICE' ? '#3b82f6' : '#f59e0b' }}>
                                                {item.type}
                                            </span>
                                        </td>
                                        <td>{item.staff?.name || '-'}</td>
                                        <td style={{ textAlign: 'right' }}>₹{item.price.toFixed(2)}</td>
                                        <td style={{ textAlign: 'right' }}>
                                            {visit.status !== 'COMPLETED' && (
                                                <button onClick={() => handleRemoveItem(item.id)} style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}>
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Sidebar: Customer & Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="card">
                        <div className="card-header">
                            <h2 className="card-title">Customer</h2>
                        </div>
                        <div className="card-content">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'black' }}>
                                    <User size={24} />
                                </div>
                                <div>
                                    <div style={{ fontWeight: '600', fontSize: '1.1rem' }}>{visit.customer.name}</div>
                                    <div style={{ color: 'var(--muted-foreground)' }}>{visit.customer.contactNo}</div>
                                </div>
                            </div>
                            {visit.notes && (
                                <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius)', fontSize: '0.9rem' }}>
                                    <strong>Notes:</strong> {visit.notes}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <h2 className="card-title">Billing</h2>
                        </div>
                        <div className="card-content">
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span style={{ color: 'var(--muted-foreground)' }}>Total Items</span>
                                <span>{visit.items.length}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: '700', color: 'var(--primary)' }}>
                                <span>{visit.invoice ? 'Total Due' : 'Est. Total'}</span>
                                <span>₹{(visit.invoice ? visit.invoice.total : (visit.items.reduce((sum, i) => sum + i.price, 0) * (1 - discountPercent / 100) * (1 + taxPercent / 100))).toFixed(2)}</span>
                            </div>

                            {visit.status !== 'COMPLETED' && visit.status !== 'WAITING_PAYMENT' && (
                                <div style={{ marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem' }}>GST %</label>
                                        <input
                                            type="number"
                                            className="input"
                                            value={taxPercent}
                                            onChange={(e) => setTaxPercent(parseFloat(e.target.value) || 0)}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Sale %</label>
                                        <input
                                            type="number"
                                            className="input"
                                            value={discountPercent}
                                            onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons based on Status */}
                            {visit.status !== 'COMPLETED' && visit.status !== 'WAITING_PAYMENT' && (
                                <button
                                    className="btn btn-primary"
                                    style={{ width: '100%' }}
                                    onClick={handleGenerateInvoice}
                                    disabled={visit.items.length === 0}
                                >
                                    <Printer size={18} style={{ marginRight: '0.5rem' }} />
                                    Generate Invoice
                                </button>
                            )}

                            {visit.status === 'WAITING_PAYMENT' && (
                                <button
                                    className="btn btn-primary"
                                    style={{ width: '100%', backgroundColor: '#10b981', borderColor: '#10b981', cursor: 'not-allowed', opacity: 0.6 }}
                                    disabled
                                    title="Use Reception module for payment processing"
                                >
                                    <CheckCircle size={18} style={{ marginRight: '0.5rem' }} />
                                    Payment in Reception
                                </button>
                            )}

                            {visit.status === 'COMPLETED' && (
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ padding: '0.5rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: 'var(--radius)', marginBottom: '1rem' }}>
                                        Paid & Completed
                                    </div>
                                    {!visit.feedback && (
                                        <button
                                            className="btn btn-secondary"
                                            style={{ width: '100%' }}
                                            onClick={() => setShowFeedback(true)}
                                        >
                                            <Star size={18} style={{ marginRight: '0.5rem' }} />
                                            Add Feedback
                                        </button>
                                    )}
                                    {visit.feedback && (
                                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.25rem', color: 'var(--primary)' }}>
                                            {[...Array(visit.feedback.rating)].map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}


            {showAddService && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="card" style={{ width: '900px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
                        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem' }}>
                            <div>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary)' }}>Select Service</h3>
                                <p style={{ color: 'var(--muted-foreground)' }}>Choose a service to add to the visit</p>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <input
                                    type="text"
                                    placeholder="Search services..."
                                    className="input"
                                    style={{ width: '250px' }}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    autoFocus
                                />
                                <button onClick={() => setShowAddService(false)} style={{ background: 'none', border: 'none', color: 'var(--muted-foreground)', cursor: 'pointer' }}>
                                    <X size={24} />
                                </button>
                            </div>
                        </div>
                        <div className="card-content" style={{ overflowY: 'auto', padding: '1.5rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
                                {services.filter(s =>
                                    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    s.category.toLowerCase().includes(searchTerm.toLowerCase())
                                ).map(s => {
                                    // Gender-Aware Image Mapping
                                    const gender = visit?.customer?.gender || 'Female'; // Default to Female if unknown
                                    const isMale = gender === 'Male';

                                    let imgUrl = 'https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&w=400&q=80'; // Default
                                    const name = s.name.toLowerCase();

                                    if (name.includes('hair') && name.includes('cut')) {
                                        imgUrl = isMale
                                            ? 'https://images.unsplash.com/photo-1593202804784-57242080db71?auto=format&fit=crop&w=400&q=80' // Men's Haircut
                                            : 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=400&q=80'; // Women's Haircut
                                    }
                                    else if (name.includes('spa')) {
                                        imgUrl = 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=400&q=80';
                                    }
                                    else if (name.includes('color') || name.includes('root')) {
                                        imgUrl = 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=400&q=80';
                                    }
                                    else if (name.includes('facial') || name.includes('clean')) {
                                        imgUrl = isMale
                                            ? 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&w=400&q=80' // Men's Facial
                                            : 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=400&q=80'; // Women's Facial
                                    }
                                    else if (name.includes('manicure') || name.includes('pedicure')) {
                                        imgUrl = 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=400&q=80';
                                    }
                                    else if (name.includes('wax')) {
                                        imgUrl = 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=400&q=80';
                                    }
                                    else if (name.includes('makeup')) {
                                        imgUrl = 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=400&q=80';
                                    }

                                    return (
                                        <div
                                            key={s.id}
                                            onClick={() => handleAddItem('SERVICE', s.id, s.price)}
                                            className="service-card"
                                            style={{
                                                cursor: 'pointer',
                                                borderRadius: 'var(--radius)',
                                                overflow: 'hidden',
                                                background: 'rgba(255,255,255,0.03)',
                                                border: '1px solid var(--glass-border)',
                                                transition: 'transform 0.2s, border-color 0.2s',
                                                display: 'flex', flexDirection: 'column'
                                            }}
                                            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.borderColor = 'var(--primary)'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'var(--glass-border)'; }}
                                        >
                                            <div style={{ height: '140px', overflow: 'hidden' }}>
                                                <img src={imgUrl} alt={s.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            </div>
                                            <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                                <div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.25rem' }}>{s.category}</div>
                                                    <div style={{ fontWeight: '600', fontSize: '1rem', marginBottom: '0.5rem', lineHeight: '1.2' }}>{s.name}</div>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                                                    <span style={{ color: 'var(--primary)', fontWeight: '700', fontSize: '1.1rem' }}>₹{s.price}</span>
                                                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--primary)', color: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <Plus size={16} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {
                showAddProduct && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                        <div className="card" style={{ width: '400px', maxHeight: '80vh', overflowY: 'auto' }}>
                            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <h3>Add Product</h3>
                                <button onClick={() => setShowAddProduct(false)} style={{ background: 'none', border: 'none', color: 'white' }}><X size={20} /></button>
                            </div>
                            <div className="card-content">
                                {products.map(p => (
                                    <div key={p.id} onClick={() => handleAddItem('PRODUCT', p.id, p.price)} style={{ padding: '0.75rem', borderBottom: '1px solid var(--glass-border)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}>
                                        <span>{p.name}</span>
                                        <span style={{ color: 'var(--primary)' }}>₹{p.price}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )
            }

            {
                showFeedback && (
                    <FeedbackModal
                        visitId={visit.id}
                        onClose={() => setShowFeedback(false)}
                        onSubmit={fetchVisit}
                    />
                )
            }
        </div >
    );
};

// Helper for X icon
const X = ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

export default VisitDetail;
