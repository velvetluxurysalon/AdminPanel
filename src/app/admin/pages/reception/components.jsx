import React from 'react';
import {
  Users, UserPlus, Scissors, CreditCard, CheckCircle, AlertCircle,
  Plus, ShoppingCart, DollarSign, ChevronDown, Phone, Eye, Trash2,
  Tag, CreditCard as CardIcon, Smartphone, Wallet, Send, FileText,
  Download, Printer, Mail, MessageCircle, X, Check, Crown, Clock
} from 'lucide-react';

export const ReceptionHeader = ({ onNewCheckIn, error, success, loading, activeSection, setActiveSection, visits = [], filteredVisits, searchTerm, setSearchTerm }) => {
  return (
    <div style={{ background: 'var(--admin-card-bg)', borderRadius: '0', padding: '1.5rem', marginBottom: '0', border: 'none', borderBottom: '1px solid var(--admin-border)', margin: '-2rem -2rem 0 -2rem', paddingLeft: '2rem', paddingRight: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: 'var(--admin-foreground)' }}>Reception Manager</h2>
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--admin-muted-foreground)' }}>
              <div style={{ width: '12px', height: '12px', border: '2px solid var(--admin-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              Updating...
            </div>
          )}
        </div>
        <button
          onClick={onNewCheckIn}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.625rem 1.25rem',
            background: 'var(--admin-success)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--admin-radius-sm)',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#059669';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'var(--admin-success)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <UserPlus size={18} /> Check In Customer
        </button>
      </div>
      {/* ALERTS */}
      {error && (
        <div style={{ background: 'var(--admin-danger-light)', border: '1px solid #fca5a5', color: 'var(--admin-danger)', padding: '0.75rem 1rem', borderRadius: 'var(--admin-radius-sm)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={18} /> {error}
        </div>
      )}
      {success && (
        <div style={{ background: 'var(--admin-success-light)', border: '1px solid #a7f3d0', color: 'var(--admin-success)', padding: '0.75rem 1rem', borderRadius: 'var(--admin-radius-sm)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle size={18} /> {success}
        </div>
      )}

      {/* NAVIGATION TABS */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        {[
          { id: 'checkout', label: 'Ready for Billing', icon: CardIcon, color: 'var(--admin-primary)' },
          { id: 'completed', label: 'Completed', icon: CheckCircle, color: 'var(--admin-success)' }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              style={{
                background: isActive ? 'rgba(201, 162, 39, 0.08)' : 'transparent',
                color: isActive ? 'var(--admin-foreground)' : 'var(--admin-muted-foreground)',
                border: `2px solid ${isActive ? tab.color : 'transparent'}`,
                padding: '0.625rem 1rem',
                borderRadius: 'var(--admin-radius-sm)',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
                minWidth: 'max-content'
              }}
              onMouseEnter={e => {
                if (!isActive) e.currentTarget.style.background = 'rgba(201, 162, 39, 0.04)';
              }}
              onMouseLeave={e => {
                if (!isActive) e.currentTarget.style.background = 'transparent';
              }}
            >
              <Icon size={18} /> {tab.label}
              <span style={{
                background: tab.color,
                color: 'white',
                padding: '0.125rem 0.5rem',
                borderRadius: '9999px',
                fontSize: '0.7rem',
                marginLeft: '0.25rem',
                fontWeight: 600
              }}>
                {visits.filter(v => {
                  if (tab.id === 'all') return true;
                  if (tab.id === 'checkin') return v.status === 'CHECKED_IN';
                  if (tab.id === 'checkout') return v.status === 'READY_FOR_BILLING';
                  if (tab.id === 'completed') return v.status === 'COMPLETED';
                  return false;
                }).length}
              </span>
            </button>
          );
        })}
      </div>

      {/* SEARCH BAR */}
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          placeholder="Search customers by name or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '0.75rem 1rem 0.75rem 2.75rem',
            background: 'var(--admin-input-bg)',
            border: '1px solid var(--admin-border)',
            borderRadius: 'var(--admin-radius-sm)',
            fontSize: '0.875rem',
            color: 'var(--admin-foreground)',
            outline: 'none',
            transition: 'all 0.2s'
          }}
          onFocus={e => e.currentTarget.style.borderColor = 'var(--admin-primary)'}
          onBlur={e => e.currentTarget.style.borderColor = 'var(--admin-border)'}
        />
        <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-muted-foreground)' }}>
          🔍
        </span>
      </div>
    </div>
  );
};

export const LoadingState = () => (
  <div style={{ padding: '4rem', textAlign: 'center' }}>
    <div style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>
      ✨
    </div>
    <p style={{ marginTop: '1rem', color: '#6b7280' }}>Loading reception dashboard...</p>
  </div>
);

export const EmptyState = ({ activeSection }) => (
  <div style={{ padding: '4rem 2rem', textAlign: 'center', color: '#6b7280' }}>
    <Users size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
    <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
      No {activeSection === 'all' ? '' : activeSection} visits found
    </h3>
    <p>Start by checking in a customer or try another tab</p>
  </div>
);
