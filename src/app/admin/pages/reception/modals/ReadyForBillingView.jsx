import React from 'react';
import { ShoppingCart, CreditCard } from 'lucide-react';
import { Package, Scissors } from 'lucide-react';

const ReadyForBillingView = ({
  filteredVisits,
  calculateTotals,
  getStatusBadge,
  onCheckout,
  onBack
}) => {

  if (filteredVisits.length === 0) {
    return (
      <div style={{ padding: '3rem 2rem', textAlign: 'center', color: '#6b7280' }}>
        <ShoppingCart size={40} style={{ opacity: 0.3, marginBottom: '1rem' }} />
        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>No visits ready for billing</h3>
        <p style={{ fontSize: '0.875rem' }}>Once customers complete their services, they'll appear here for checkout</p>
      </div>
    );
  }

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <div style={{ display: 'grid', gap: '1rem' }}>
        {filteredVisits.map((visit) => {
          const totals = calculateTotals(visit);

          return (
            <div
              key={visit.id}
              style={{
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '0.75rem',
                overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.12)'}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)'}
            >
              {/* HEADER */}
              <div style={{ background: 'white', borderBottom: '1px solid #f0f0f0', padding: '1rem 1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: '700', margin: 0, color: '#1f2937' }}>{visit.customer?.name || visit.customerName}</h3>
                    <p style={{ fontSize: '0.813rem', color: '#6b7280', margin: '0.25rem 0 0 0' }}>
                      {visit.customer?.phone || visit.customer?.contactNo || visit.customerPhone}
                    </p>
                  </div>
                </div>
              </div>

              {/* CONTENT */}
              <div style={{ padding: '1rem 1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                  {/* LEFT - ITEMS */}
                  <div>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <ShoppingCart size={16} /> Items
                    </h4>

                    {visit.items && visit.items.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {visit.items.map((item, index) => (
                          <div
                            key={index}
                            style={{
                              padding: '0.75rem',
                              background: '#f9fafb',
                              border: '1px solid #f0f0f0',
                              borderRadius: '0.5rem',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                          >
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                {item.type === 'service' ? (
                                  <Scissors size={13} color="#3b82f6" />
                                ) : (
                                  <Package size={13} color="#10b981" />
                                )}
                                <span style={{ fontWeight: '600', color: '#1f2937', fontSize: '0.875rem' }}>{item.name}</span>
                              </div>
                              <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>
                                {item.type === 'service' ? 'Service' : 'Product'}{item.duration ? ` • ${item.duration}m` : ''}
                              </div>
                            </div>
                            <span style={{ fontWeight: '700', color: '#1f2937', fontSize: '0.875rem' }}>₹{item.price?.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ color: '#9ca3af', fontSize: '0.813rem' }}>No items</p>
                    )}
                  </div>

                  {/* RIGHT - BILLING SUMMARY */}
                  <div>
                    <div style={{
                      background: '#f9fafb',
                      border: '1px solid #e5e7eb',
                      padding: '1rem',
                      borderRadius: '0.5rem',
                      marginBottom: '0.75rem'
                    }}>
                      <div style={{ marginBottom: '0.75rem' }}>
                        <div style={{ fontSize: '0.7rem', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                          Subtotal
                        </div>
                        <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1f2937', marginTop: '0.25rem' }}>
                          ₹{totals.subtotal.toFixed(2)}
                        </div>
                      </div>

                      <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: '700', color: '#1f2937' }}>
                          <span>Total</span>
                          <span>₹{totals.total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {/* CHECKOUT BUTTON */}
                    <button
                      onClick={() => onCheckout(visit)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        fontWeight: '600',
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                      <CreditCard size={16} /> Pay
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ReadyForBillingView;
