import React, { useState, useEffect } from 'react';
import { Plus, Scissors, ShoppingCart, X, Check, Search, Flame } from 'lucide-react';

const AddItemsModal = ({
  selectedVisit,
  services,
  products,
  selectedServices,
  setSelectedServices,
  selectedProducts,
  setSelectedProducts,
  selectedCategory,
  setSelectedCategory,
  onClose,
  onAdd
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [frequentlyUsedIds, setFrequentlyUsedIds] = useState([]);

  // Load frequently used services from localStorage
  useEffect(() => {
    const storedFrequent = localStorage.getItem('frequentlyUsedServices');
    if (storedFrequent) {
      try {
        setFrequentlyUsedIds(JSON.parse(storedFrequent).slice(0, 5)); // Top 5
      } catch (e) {
        console.log('Error reading frequently used services');
      }
    }
  }, []);

  const items = selectedCategory === 'services' ? services : products;
  const selectedItems = selectedCategory === 'services' ? selectedServices : selectedProducts;
  
  // Get frequently used items
  const frequentItems = items.filter(item => frequentlyUsedIds.includes(item.id));
  
  // Filter items based on search
  const filteredItems = searchTerm.trim() === '' 
    ? items 
    : items.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase()))
      );

  // Separate frequently used and others
  const frequentFiltered = filteredItems.filter(item => frequentlyUsedIds.includes(item.id));
  const otherFiltered = filteredItems.filter(item => !frequentlyUsedIds.includes(item.id));

  // Generate suggestions
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setSuggestions([]);
    } else {
      const matchingItems = items.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, 5);
      setSuggestions(matchingItems);
    }
  }, [searchTerm, items]);
  
  const isSelected = (item) => {
    if (selectedCategory === 'services') {
      return selectedServices.some(s => s.id === item.id);
    } else {
      return selectedProducts.some(p => p.id === item.id);
    }
  };

  const trackServiceUsage = (serviceId) => {
    const storedFrequent = localStorage.getItem('frequentlyUsedServices');
    let frequentList = storedFrequent ? JSON.parse(storedFrequent) : [];
    
    // Remove if already exists and add to beginning
    frequentList = frequentList.filter(id => id !== serviceId);
    frequentList.unshift(serviceId);
    
    // Keep only top 10
    frequentList = frequentList.slice(0, 10);
    localStorage.setItem('frequentlyUsedServices', JSON.stringify(frequentList));
    setFrequentlyUsedIds(frequentList.slice(0, 5));
  };

  const toggleItem = (item) => {
    trackServiceUsage(item.id);
    
    if (selectedCategory === 'services') {
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

  const selectFromSuggestion = (item) => {
    setSearchTerm('');
    setSuggestions([]);
    toggleItem(item);
  };

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
      <div className="glass-card" style={{ width: '800px', maxHeight: '90vh', borderRadius: '0.75rem', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937', margin: 0 }}>
              Add Services & Products
            </h2>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              For: {selectedVisit.customer?.name}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
            <X size={24} />
          </button>
        </div>

        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
          {/* TABS */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' }}>
            {['services', 'products'].map(type => {
              const isActive = selectedCategory === type;
              const Icon = type === 'services' ? Scissors : ShoppingCart;
              return (
                <button
                  key={type}
                  onClick={() => {
                    setSelectedCategory(type);
                    setSearchTerm('');
                    setSuggestions([]);
                  }}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: isActive ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent',
                    color: isActive ? 'white' : '#6b7280',
                    border: 'none',
                    borderRadius: '0.75rem',
                    fontWeight: '600',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <Icon size={18} />
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              );
            })}
          </div>

          {/* SEARCH BAR */}
          <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '0.875rem', color: '#9ca3af', pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder={`Search ${selectedCategory}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem 0.75rem 2.5rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '0.75rem',
                  fontSize: '0.875rem',
                  fontFamily: 'inherit',
                  transition: 'all 0.2s',
                  outline: 'none',
                  background: 'white'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#667eea';
                  e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* SUGGESTIONS DROPDOWN */}
            {suggestions.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '0.75rem',
                marginTop: '0.5rem',
                zIndex: 10,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                maxHeight: '200px',
                overflowY: 'auto'
              }}>
                {suggestions.map(item => (
                  <div
                    key={item.id}
                    onClick={() => selectFromSuggestion(item)}
                    style={{
                      padding: '0.75rem 1rem',
                      borderBottom: '1px solid #f3f4f6',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      background: isSelected(item) ? 'rgba(102, 126, 234, 0.05)' : 'transparent',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(102, 126, 234, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = isSelected(item) ? 'rgba(102, 126, 234, 0.05)' : 'transparent';
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '600', color: '#1f2937', fontSize: '0.875rem' }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                        ₹{item.price}
                      </div>
                    </div>
                    {isSelected(item) && <Check size={16} color="#667eea" />}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* FREQUENTLY USED SECTION */}
          {frequentItems.length > 0 && searchTerm === '' && (
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontWeight: '700', color: '#f59e0b' }}>
                <Flame size={18} />
                Frequently Used
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                gap: '1rem',
                paddingRight: '0rem',
                marginBottom: '1.5rem'
              }}>
                {frequentItems.map(item => (
                  <div
                    key={item.id}
                    onClick={() => toggleItem(item)}
                    style={{
                      padding: '1rem',
                      background: isSelected(item) ? 'rgba(102, 126, 234, 0.1)' : 'linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(245, 158, 11, 0.02) 100%)',
                      border: `2px solid ${isSelected(item) ? '#667eea' : '#fbbf24'}`,
                      borderRadius: '0.75rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      position: 'relative'
                    }}
                  >
                    <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem' }}>
                      <Flame size={14} color="#f59e0b" />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <div style={{ fontWeight: '600', color: '#1f2937' }}>{item.name}</div>
                      {isSelected(item) && <Check size={16} color="#667eea" />}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                      {item.category || 'General'}
                    </div>
                    <div style={{ fontWeight: '700', color: '#10b981' }}>₹{item.price}</div>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: '2px solid #e5e7eb', paddingTop: '1.5rem' }} />
            </div>
          )}

          {/* ALL ITEMS SECTION */}
          <div>
            {searchTerm !== '' && filteredItems.length > 0 && (
              <div style={{ marginBottom: '1rem', fontSize: '0.875rem', color: '#6b7280', fontWeight: '600' }}>
                Search Results ({filteredItems.length})
              </div>
            )}
            {searchTerm === '' && frequentItems.length > 0 && (
              <div style={{ marginBottom: '1rem', fontSize: '0.875rem', color: '#6b7280', fontWeight: '600' }}>
                All {selectedCategory}
              </div>
            )}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
              gap: '1rem',
              paddingRight: '0.5rem'
            }}>
              {(searchTerm !== '' ? filteredItems : otherFiltered).map(item => (
                <div
                  key={item.id}
                  onClick={() => toggleItem(item)}
                  style={{
                    padding: '1rem',
                    background: isSelected(item) ? 'rgba(102, 126, 234, 0.1)' : 'white',
                    border: `2px solid ${isSelected(item) ? '#667eea' : '#e5e7eb'}`,
                    borderRadius: '0.75rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div style={{ fontWeight: '600', color: '#1f2937' }}>{item.name}</div>
                    {isSelected(item) && <Check size={16} color="#667eea" />}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                    {item.category || 'General'}
                  </div>
                  <div style={{ fontWeight: '700', color: '#10b981' }}>₹{item.price}</div>
                </div>
              ))}
            </div>
            {(searchTerm !== '' ? filteredItems : items).length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
                {searchTerm !== '' ? `No ${selectedCategory} found matching "${searchTerm}"` : `No ${selectedCategory} available`}
              </div>
            )}
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div style={{ display: 'flex', gap: '1rem', padding: '1rem 1.5rem', borderTop: '1px solid #e5e7eb' }}>
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
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={onAdd}
            disabled={selectedServices.length === 0 && selectedProducts.length === 0}
            style={{
              flex: 1,
              padding: '0.875rem',
              background: selectedServices.length === 0 && selectedProducts.length === 0 ? '#d1d5db' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '0.75rem',
              fontWeight: '600',
              cursor: selectedServices.length === 0 && selectedProducts.length === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            Add Selected ({selectedServices.length + selectedProducts.length})
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddItemsModal;
