import { useState, useEffect } from 'react';
import { Plus, Trash2, Printer, Search, Star, CreditCard, Banknote, Smartphone } from 'lucide-react';
import { getServices, searchCustomers } from '../utils/firebaseUtils';

const Billing = () => {
    const [services, setServices] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [billDetails, setBillDetails] = useState({
        customer: '',
        contactNo: '',
        items: [],
        taxRate: 18,
        discountRate: 0,
        paymentMode: 'Cash',
        feedbackRating: 0,
        feedbackComment: ''
    });

    const [customerType, setCustomerType] = useState('');

    useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        try {
            setLoading(true);
            const data = await getServices(false);
            setServices(data);
            const uniqueCategories = ['All', ...new Set(data.map(s => s.category || 'General'))];
            setCategories(uniqueCategories);
            setError('');
        } catch (error) {
            console.error('Error fetching services:', error);
            setError('Failed to load services');
        } finally {
            setLoading(false);
        }
    };

    const handleCustomerSearch = async (phone) => {
        setBillDetails(prev => ({ ...prev, contactNo: phone }));
        if (phone.length >= 10) {
            try {
                const results = await searchCustomers(phone);
                if (results && results.length > 0) {
                    setBillDetails(prev => ({ ...prev, customer: results[0].name }));
                    setCustomerType('Existing');
                } else {
                    setCustomerType('New');
                }
            } catch (error) {
                console.error('Error searching customer:', error);
                setCustomerType('New');
            }
        } else {
            setCustomerType('');
        }
    };

    const handleAddItem = (service) => {
        setBillDetails(prev => ({
            ...prev,
            items: [...prev.items, { serviceId: service.id, name: service.name, price: service.price }]
        }));
    };

    const handleRemoveItem = (index) => {
        const newItems = [...billDetails.items];
        newItems.splice(index, 1);
        setBillDetails(prev => ({ ...prev, items: newItems }));
    };

    const calculateTotals = () => {
        const subtotal = billDetails.items.reduce((sum, item) => sum + item.price, 0);
        const discountAmount = (subtotal * billDetails.discountRate) / 100;
        const taxAmount = ((subtotal - discountAmount) * billDetails.taxRate) / 100;
        const total = (subtotal - discountAmount) + taxAmount;

        return { subtotal, discountAmount, taxAmount, total };
    };

    const handleCreateBill = async () => {
        if (!billDetails.customer || billDetails.items.length === 0) return;

        const totals = calculateTotals();

        try {
            const response = await fetch('/api/bills', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerName: billDetails.customer,
                    contactNo: billDetails.contactNo,
                    items: billDetails.items,
                    taxRate: parseFloat(billDetails.taxRate),
                    discountRate: parseFloat(billDetails.discountRate),
                    paymentMode: billDetails.paymentMode,
                    feedbackRating: billDetails.feedbackRating,
                    feedbackComment: billDetails.feedbackComment
                }),
            });

            if (response.ok) {
                alert(`Bill created successfully! Total: ₹${totals.total.toFixed(2)}`);
                setBillDetails({
                    customer: '',
                    contactNo: '',
                    items: [],
                    taxRate: 18,
                    discountRate: 0,
                    paymentMode: 'Cash',
                    feedbackRating: 0,
                    feedbackComment: ''
                });
                setCustomerType('');
            }
        } catch (error) {
            console.error('Error creating bill:', error);
        }
    };

    const totals = calculateTotals();
    const filteredServices = selectedCategory === 'All'
        ? services
        : services.filter(s => s.category === selectedCategory);

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 450px', gap: '2rem', height: 'calc(100vh - 120px)' }}>
            {/* Service Selection */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', overflow: 'hidden' }}>
                <div className="card">
                    <div className="card-content" style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`btn ${selectedCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
                                    style={{ whiteSpace: 'nowrap', borderRadius: '999px', padding: '0.5rem 1.25rem' }}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div style={{ overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', paddingBottom: '1rem' }}>
                    {filteredServices.map(service => (
                        <div
                            key={service.id}
                            className="card"
                            onClick={() => handleAddItem(service)}
                            style={{ cursor: 'pointer', transition: 'all 0.2s', border: '1px solid var(--glass-border)' }}
                        >
                            <div className="card-content" style={{ padding: '1.25rem' }}>
                                <div style={{ fontWeight: '600', fontSize: '1.1rem', marginBottom: '0.25rem' }}>{service.name}</div>
                                <div style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem' }}>{service.category}</div>
                                <div style={{ marginTop: '1rem', fontWeight: '700', color: 'var(--primary)', fontSize: '1.25rem' }}>
                                    ₹{service.price.toFixed(2)}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Bill Details */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
                <div className="card-header" style={{ background: 'rgba(212, 175, 55, 0.05)' }}>
                    <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Receipt size={20} /> Current Bill
                    </h2>
                </div>
                <div className="card-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem', overflow: 'hidden' }}>

                    {/* Customer Details */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--muted-foreground)', marginBottom: '0.25rem', display: 'block' }}>Contact No.</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="text"
                                    className="input"
                                    value={billDetails.contactNo}
                                    onChange={(e) => handleCustomerSearch(e.target.value)}
                                    placeholder="Phone"
                                />
                                <Search size={14} style={{ position: 'absolute', right: '10px', top: '12px', color: 'var(--muted-foreground)' }} />
                            </div>
                        </div>
                        <div>
                            <label style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--muted-foreground)', marginBottom: '0.25rem', display: 'block' }}>Customer Name</label>
                            <input
                                type="text"
                                className="input"
                                value={billDetails.customer}
                                onChange={(e) => setBillDetails({ ...billDetails, customer: e.target.value })}
                                placeholder="Name"
                            />
                        </div>
                    </div>
                    {customerType && (
                        <div style={{
                            fontSize: '0.75rem',
                            color: customerType === 'Old' ? '#10b981' : '#60a5fa',
                            fontWeight: '600',
                            background: customerType === 'Old' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            width: 'fit-content'
                        }}>
                            {customerType} Customer
                        </div>
                    )}

                    {/* Items List */}
                    <div style={{ flex: 1, overflowY: 'auto', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius)', padding: '0.5rem' }}>
                        {billDetails.items.map((item, index) => (
                            <div key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', borderBottom: '1px solid var(--glass-border)', fontSize: '0.9rem' }}>
                                <span style={{ fontWeight: '500' }}>{item.name}</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <span style={{ color: 'var(--primary)' }}>₹{item.price.toFixed(2)}</span>
                                    <button onClick={() => handleRemoveItem(index)} style={{ border: 'none', background: 'none', color: 'var(--danger)', cursor: 'pointer', opacity: 0.7 }}>
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {billDetails.items.length === 0 && (
                            <div style={{ textAlign: 'center', color: 'var(--muted-foreground)', padding: '2rem', fontSize: '0.875rem' }}>
                                No items added
                            </div>
                        )}
                    </div>

                    {/* Financials */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--muted-foreground)' }}>Discount (%)</label>
                            <input
                                type="number"
                                className="input"
                                value={billDetails.discountRate}
                                onChange={(e) => setBillDetails({ ...billDetails, discountRate: parseFloat(e.target.value) || 0 })}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--muted-foreground)' }}>Tax / GST (%)</label>
                            <input
                                type="number"
                                className="input"
                                value={billDetails.taxRate}
                                onChange={(e) => setBillDetails({ ...billDetails, taxRate: parseFloat(e.target.value) || 0 })}
                            />
                        </div>
                    </div>

                    {/* Payment Mode */}
                    <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--muted-foreground)' }}>Payment Mode</label>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                            {[
                                { label: 'Cash', icon: Banknote },
                                { label: 'UPI', icon: Smartphone },
                                { label: 'Card', icon: CreditCard }
                            ].map(mode => (
                                <button
                                    key={mode.label}
                                    onClick={() => setBillDetails({ ...billDetails, paymentMode: mode.label })}
                                    className={`btn ${billDetails.paymentMode === mode.label ? 'btn-primary' : 'btn-secondary'}`}
                                    style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem', gap: '0.25rem' }}
                                >
                                    <mode.icon size={14} /> {mode.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Feedback */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--muted-foreground)' }}>Feedback:</label>
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                            {[1, 2, 3, 4, 5].map(star => (
                                <Star
                                    key={star}
                                    size={20}
                                    fill={billDetails.feedbackRating >= star ? 'var(--primary)' : 'none'}
                                    color={billDetails.feedbackRating >= star ? 'var(--primary)' : 'var(--muted-foreground)'}
                                    style={{ cursor: 'pointer', transition: 'transform 0.1s' }}
                                    onClick={() => setBillDetails({ ...billDetails, feedbackRating: star })}
                                    className="hover:scale-110"
                                />
                            ))}
                        </div>
                    </div>

                    {/* Totals & Action */}
                    <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                            <span>Subtotal</span>
                            <span>₹{totals.subtotal.toFixed(2)}</span>
                        </div>
                        {totals.discountAmount > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.875rem', color: 'var(--success)' }}>
                                <span>Discount</span>
                                <span>-₹{totals.discountAmount.toFixed(2)}</span>
                            </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                            <span>Tax</span>
                            <span>+₹{totals.taxAmount.toFixed(2)}</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary)', marginBottom: '1rem' }}>
                            <span>Total</span>
                            <span>₹{totals.total.toFixed(2)}</span>
                        </div>

                        <button
                            className="btn btn-primary"
                            style={{ width: '100%', padding: '1rem', fontSize: '1rem' }}
                            onClick={handleCreateBill}
                            disabled={!billDetails.customer || billDetails.items.length === 0}
                        >
                            <Printer size={20} style={{ marginRight: '0.5rem' }} />
                            Generate Bill
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Billing;
