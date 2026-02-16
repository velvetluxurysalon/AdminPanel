import React, { useState, useEffect } from 'react';
import { X, Search, Plus, Scissors, ShoppingCart, Check, Flame } from 'lucide-react';
import { getCustomers, createVisit, addCustomer, getServices, getProducts } from '../../../utils/firebaseUtils';

const CheckInModal = ({ onClose, onCheckIn }) => {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({
    name: '',
    phone: '',
    email: '',
    dateOfBirth: ''
  });

  // Services and Products
  const [services, setServices] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [activeTab, setActiveTab] = useState('services');
  const [itemSearchTerm, setItemSearchTerm] = useState('');
  const [frequentlyUsedIds, setFrequentlyUsedIds] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [allCustomers, servicesData, productsData] = await Promise.all([
          getCustomers(),
          getServices(false),
          getProducts()
        ]);
        setCustomers(allCustomers || []);
        setServices(servicesData || []);
        setProducts(productsData || []);

        // Load frequently used services
        const storedFrequent = localStorage.getItem('frequentlyUsedServices');
        if (storedFrequent) {
          try {
            setFrequentlyUsedIds(JSON.parse(storedFrequent).slice(0, 5));
          } catch (e) {
            console.log('Error reading frequently used services');
          }
        }
      } catch (err) {
        setError('Failed to load data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredCustomers = customers.filter(customer =>
    customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.includes(searchTerm)
  );

  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setSearchTerm(customer.name || '');
    setShowDropdown(false);
  };

  const trackServiceUsage = (serviceId) => {
    const storedFrequent = localStorage.getItem('frequentlyUsedServices');
    let frequentList = storedFrequent ? JSON.parse(storedFrequent) : [];
    frequentList = frequentList.filter(id => id !== serviceId);
    frequentList.unshift(serviceId);
    frequentList = frequentList.slice(0, 10);
    localStorage.setItem('frequentlyUsedServices', JSON.stringify(frequentList));
    setFrequentlyUsedIds(frequentList.slice(0, 5));
  };

  const toggleItem = (item, type) => {
    trackServiceUsage(item.id);
    
    if (type === 'service') {
      setSelectedServices(prev =>
        prev.some(s => s.id === item.id)
          ? prev.filter(s => s.id !== item.id)
          : [...prev, item]
      );
    } else {
      setSelectedProducts(prev =>
        prev.some(p => p.id === item.id)
          ? prev.filter(p => p.id !== item.id)
          : [...prev, item]
      );
    }
  };

  const handleCheckIn = async () => {
    if (!selectedCustomer) {
      setError('Please select a customer');
      return;
    }

    if (selectedServices.length === 0 && selectedProducts.length === 0) {
      setError('Please select at least one service or product');
      return;
    }

    try {
      setLoading(true);
      
      // Create items array
      const items = [
        ...selectedServices.map(service => ({
          type: 'service',
          serviceId: service.id,
          name: service.name,
          price: service.price,
          duration: service.duration || 30,
          quantity: 1,
          staff: null,
          status: 'pending'
        })),
        ...selectedProducts.map(product => ({
          type: 'product',
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          status: 'added'
        }))
      ];

      await createVisit({
        customerId: selectedCustomer.id,
        customer: {
          id: selectedCustomer.id,
          name: selectedCustomer.name || '',
          phone: selectedCustomer.phone || '',
          email: selectedCustomer.email || ''
        },
        items: items,
        status: 'READY_FOR_BILLING', // Skip IN_SERVICE, go directly to billing
        notes: ''
      });

      setError('');
      onCheckIn();
      onClose();
    } catch (err) {
      setError('Failed to check in customer: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNewCustomer = async () => {
    if (!newCustomerData.name.trim()) {
      setError('Please enter customer name');
      return;
    }
    
    if (!newCustomerData.phone.trim()) {
      setError('Please enter phone number (required)');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const newCustomer = await addCustomer({
        name: newCustomerData.name.trim(),
        phone: newCustomerData.phone.trim(),
        email: newCustomerData.email.trim(),
        dateOfBirth: newCustomerData.dateOfBirth || null
      });

      setSelectedCustomer(newCustomer);
      setSearchTerm(newCustomer.name);
      setShowNewCustomerForm(false);
      setNewCustomerData({ name: '', phone: '', email: '', dateOfBirth: '' });
      
      const allCustomers = await getCustomers();
      setCustomers(allCustomers || []);
    } catch (err) {
      setError('Failed to create customer: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openNewCustomerForm = () => {
    const isPhoneNumber = /^\d+$/.test(searchTerm.replace(/[\s\-()]/g, ''));
    setShowNewCustomerForm(true);
    setShowDropdown(false);
    
    if (isPhoneNumber) {
      setNewCustomerData({ name: '', phone: searchTerm, email: '', dateOfBirth: '' });
    } else {
      setNewCustomerData({ name: searchTerm, phone: '', email: '', dateOfBirth: '' });
    }
  };

  const items = activeTab === 'services' ? services : products;
  const selectedItems = activeTab === 'services' ? selectedServices : selectedProducts;
  
  const frequentItems = items.filter(item => frequentlyUsedIds.includes(item.id));
  
  const filteredItems = itemSearchTerm.trim() === '' 
    ? items 
    : items.filter(item => 
        item.name.toLowerCase().includes(itemSearchTerm.toLowerCase()) ||
        (item.category && item.category.toLowerCase().includes(itemSearchTerm.toLowerCase()))
      );

  const frequentFiltered = filteredItems.filter(item => frequentlyUsedIds.includes(item.id));
  const otherFiltered = filteredItems.filter(item => !frequentlyUsedIds.includes(item.id));

  const isItemSelected = (item) => {
    if (activeTab === 'services') {
      return selectedServices.some(s => s.id === item.id);
    } else {
      return selectedProducts.some(p => p.id === item.id);
    }
  };

  const totalAmount = [...selectedServices, ...selectedProducts].reduce((sum, item) => sum + (item.price || 0), 0);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(4px)',
      animation: 'fadeIn 0.3s'
    }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .glass-card {
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(0, 0, 0, 0.05);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }
      `}</style>

      <div className="glass-card" style={{
        width: '95%',
        maxWidth: '900px',
        maxHeight: '90vh',
        borderRadius: '0.75rem',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* HEADER */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }}>
          <div>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              margin: 0
            }}>Quick Check-In & Add Services</h2>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', opacity: 0.9 }}>
              Select customer and add services in one step
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              cursor: 'pointer',
              color: 'white',
              padding: '0.5rem',
              borderRadius: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* CONTENT */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2rem' }}>
            {/* LEFT COLUMN - CUSTOMER SELECTION */}
            <div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  1️⃣ Select Customer
                </label>
                <div style={{ position: 'relative', zIndex: 20 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem',
                    border: '2px solid #d1d5db',
                    borderRadius: '0.75rem',
                    background: 'white'
                  }}>
                    <Search size={18} color="#6b7280" />
                    <input
                      type="text"
                      placeholder="Search by name or phone..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setShowDropdown(true);
                        setSelectedCustomer(null);
                      }}
                      onFocus={() => setShowDropdown(true)}
                      style={{
                        flex: 1,
                        border: 'none',
                        outline: 'none',
                        fontSize: '0.875rem',
                        fontFamily: 'inherit'
                      }}
                    />
                  </div>

                  {/* DROPDOWN */}
                  {showDropdown && filteredCustomers.length > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      background: 'white',
                      border: '1px solid #d1d5db',
                      borderTop: 'none',
                      borderRadius: '0 0 0.75rem 0.75rem',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      zIndex: 50,
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                    }}>
                      {filteredCustomers.map((customer, index) => (
                        <div
                          key={customer.id || index}
                          onClick={() => handleSelectCustomer(customer)}
                          style={{
                            padding: '0.75rem 1rem',
                            borderBottom: index < filteredCustomers.length - 1 ? '1px solid #e5e7eb' : 'none',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            background: selectedCustomer?.id === customer.id ? '#f3f4f6' : 'white'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#f9fafb';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = selectedCustomer?.id === customer.id ? '#f3f4f6' : 'white';
                          }}
                        >
                          <div style={{ fontWeight: '600', color: '#1f2937', fontSize: '0.875rem' }}>
                            {customer.name || 'Unknown'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                            {customer.phone || 'No phone'} {customer.email && `• ${customer.email}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* NO RESULTS */}
                  {showDropdown && filteredCustomers.length === 0 && searchTerm && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      background: 'white',
                      border: '1px solid #d1d5db',
                      borderTop: 'none',
                      borderRadius: '0 0 0.75rem 0.75rem',
                      padding: '1rem',
                      textAlign: 'center',
                      color: '#6b7280',
                      fontSize: '0.875rem',
                      zIndex: 50,
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                    }}>
                      <div style={{ marginBottom: '0.75rem' }}>No customers found</div>
                      <button
                        onClick={openNewCustomerForm}
                        style={{
                          width: '100%',
                          padding: '0.5rem 1rem',
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.5rem',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          transition: 'all 0.2s'
                        }}
                      >
                        <Plus size={16} />
                        Add New Customer
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* NEW CUSTOMER FORM */}
              {showNewCustomerForm && (
                <div style={{
                  background: '#f0fdf4',
                  border: '2px solid #10b981',
                  padding: '1rem',
                  borderRadius: '0.75rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.75rem' }}>
                    Add New Customer
                  </div>
                  
                  <div style={{ marginBottom: '0.75rem' }}>
                    <input
                      type="text"
                      placeholder="Customer Name *"
                      value={newCustomerData.name}
                      onChange={(e) => setNewCustomerData({ ...newCustomerData, name: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.625rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        fontFamily: 'inherit',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '0.75rem' }}>
                    <input
                      type="tel"
                      placeholder="Phone Number *"
                      value={newCustomerData.phone}
                      onChange={(e) => setNewCustomerData({ ...newCustomerData, phone: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.625rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        fontFamily: 'inherit',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '0.75rem' }}>
                    <input
                      type="email"
                      placeholder="Email (Optional)"
                      value={newCustomerData.email}
                      onChange={(e) => setNewCustomerData({ ...newCustomerData, email: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.625rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        fontFamily: 'inherit',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '0.75rem' }}>
                    <input
                      type="date"
                      placeholder="Date of Birth (Optional)"
                      value={newCustomerData.dateOfBirth}
                      onChange={(e) => setNewCustomerData({ ...newCustomerData, dateOfBirth: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.625rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        fontFamily: 'inherit',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={handleCreateNewCustomer}
                      disabled={loading || !newCustomerData.name.trim()}
                      style={{
                        flex: 1,
                        padding: '0.625rem',
                        background: loading || !newCustomerData.name.trim() ? '#d1d5db' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        cursor: loading || !newCustomerData.name.trim() ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {loading ? 'Creating...' : 'Create'}
                    </button>
                    <button
                      onClick={() => {
                        setShowNewCustomerForm(false);
                        setNewCustomerData({ name: '', phone: '', email: '' });
                      }}
                      disabled={loading}
                      style={{
                        flex: 1,
                        padding: '0.625rem',
                        background: 'white',
                        border: '1px solid #d1d5db',
                        color: '#374151',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* SELECTED CUSTOMER */}
              {selectedCustomer && (
                <div style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  padding: '1rem',
                  borderRadius: '0.75rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: '600', marginBottom: '0.25rem' }}>
                    ✓ SELECTED CUSTOMER
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#374151', fontWeight: '600' }}>
                    {selectedCustomer.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                    {selectedCustomer.phone}
                  </div>
                </div>
              )}

              {/* TOTAL AMOUNT */}
              <div style={{
                background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                border: '2px solid #fbbf24',
                padding: '1rem',
                borderRadius: '0.75rem',
                marginTop: '1rem'
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#78350f', marginBottom: '0.25rem' }}>
                  TOTAL AMOUNT
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#92400e' }}>
                  ₹{totalAmount.toFixed(2)}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#78350f', marginTop: '0.25rem' }}>
                  {selectedServices.length + selectedProducts.length} items selected
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN - SERVICES & PRODUCTS */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                2️⃣ Select Services & Products
              </label>

              {/* TABS */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                {['services', 'products'].map(type => {
                  const isActive = activeTab === type;
                  const Icon = type === 'services' ? Scissors : ShoppingCart;
                  return (
                    <button
                      key={type}
                      onClick={() => {
                        setActiveTab(type);
                        setItemSearchTerm('');
                      }}
                      style={{
                        flex: 1,
                        padding: '0.625rem 1rem',
                        background: isActive ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f3f4f6',
                        color: isActive ? 'white' : '#6b7280',
                        border: 'none',
                        borderRadius: '0.5rem',
                        fontWeight: '600',
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <Icon size={16} />
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  );
                })}
              </div>

              {/* SEARCH */}
              <div style={{ position: 'relative', marginBottom: '1rem' }}>
                <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '0.75rem', color: '#9ca3af', pointerEvents: 'none' }} />
                <input
                  type="text"
                  placeholder={`Search ${activeTab}...`}
                  value={itemSearchTerm}
                  onChange={(e) => setItemSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.625rem 1rem 0.625rem 2.5rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontFamily: 'inherit',
                    outline: 'none',
                    background: 'white'
                  }}
                />
              </div>

              {/* ITEMS GRID */}
              <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                {/* FREQUENTLY USED */}
                {frequentItems.length > 0 && itemSearchTerm === '' && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontWeight: '600', color: '#f59e0b', fontSize: '0.875rem' }}>
                      <Flame size={16} />
                      Frequently Used
                    </div>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                      gap: '0.75rem'
                    }}>
                      {frequentItems.map(item => (
                        <div
                          key={item.id}
                          onClick={() => toggleItem(item, activeTab === 'services' ? 'service' : 'product')}
                          style={{
                            padding: '0.75rem',
                            background: isItemSelected(item) ? 'rgba(102, 126, 234, 0.1)' : 'rgba(245, 158, 11, 0.05)',
                            border: `2px solid ${isItemSelected(item) ? '#667eea' : '#fbbf24'}`,
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            position: 'relative'
                          }}
                        >
                          {isItemSelected(item) && (
                            <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem' }}>
                              <Check size={14} color="#667eea" />
                            </div>
                          )}
                          <div style={{ fontWeight: '600', color: '#1f2937', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                            {item.name}
                          </div>
                          <div style={{ fontWeight: '700', color: '#10b981', fontSize: '0.875rem' }}>
                            ₹{item.price}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ALL ITEMS */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                  gap: '0.75rem'
                }}>
                  {(itemSearchTerm !== '' ? filteredItems : otherFiltered).map(item => (
                    <div
                      key={item.id}
                      onClick={() => toggleItem(item, activeTab === 'services' ? 'service' : 'product')}
                      style={{
                        padding: '0.75rem',
                        background: isItemSelected(item) ? 'rgba(102, 126, 234, 0.1)' : 'white',
                        border: `2px solid ${isItemSelected(item) ? '#667eea' : '#e5e7eb'}`,
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        position: 'relative'
                      }}
                    >
                      {isItemSelected(item) && (
                        <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem' }}>
                          <Check size={14} color="#667eea" />
                        </div>
                      )}
                      <div style={{ fontWeight: '600', color: '#1f2937', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                        {item.name}
                      </div>
                      <div style={{ fontWeight: '700', color: '#10b981', fontSize: '0.875rem' }}>
                        ₹{item.price}
                      </div>
                    </div>
                  ))}
                </div>

                {filteredItems.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af', fontSize: '0.875rem' }}>
                    No {activeTab} found
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ERROR MESSAGE */}
          {error && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              padding: '0.75rem',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              marginTop: '1rem'
            }}>
              {error}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          padding: '1rem 1.5rem',
          borderTop: '1px solid #e5e7eb',
          background: '#fafbfc'
        }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '0.875rem',
              background: 'white',
              border: '1px solid #d1d5db',
              color: '#374151',
              borderRadius: '0.75rem',
              fontWeight: '600',
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleCheckIn}
            disabled={!selectedCustomer || (selectedServices.length === 0 && selectedProducts.length === 0) || loading}
            style={{
              flex: 2,
              padding: '0.875rem',
              background: !selectedCustomer || (selectedServices.length === 0 && selectedProducts.length === 0) || loading 
                ? '#d1d5db' 
                : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '0.75rem',
              fontWeight: '600',
              fontSize: '0.875rem',
              cursor: !selectedCustomer || (selectedServices.length === 0 && selectedProducts.length === 0) || loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'all 0.2s'
            }}
          >
            {loading ? 'Processing...' : `✓ Check In & Add to Billing (₹${totalAmount.toFixed(2)})`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckInModal;
