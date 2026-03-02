import { useState, useEffect } from 'react';
import { Edit, Phone, Mail, MapPin, Hash } from 'lucide-react';
import { getContactInfo, updateContactInfo } from '../services/contentService';

const ContactContent = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [contactForm, setContactForm] = useState({
    phone: '',
    email: '',
    address: '',
    city: '',
    zipCode: '',
  });

  useEffect(() => {
    loadContactInfo();
  }, []);

  const loadContactInfo = async () => {
    try {
      setIsLoading(true);
      const contact = await getContactInfo();
      if (contact) setContactForm(contact);
      setError('');
    } catch (err) {
      setError('Failed to load contact information');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateContact = async () => {
    try {
      if (!contactForm.phone || !contactForm.email || !contactForm.address) {
        setError('Please fill all required fields');
        return;
      }
      await updateContactInfo(contactForm);
      setSuccess('Contact information updated successfully');
      setIsEditing(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to update contact information');
      console.error(err);
    }
  };

  return (
    <div>
      {/* Alerts */}
      {error && (
        <div style={{
          padding: '1rem',
          marginBottom: '1rem',
          backgroundColor: 'rgba(220, 38, 38, 0.1)',
          border: '1px solid #dc2626',
          borderRadius: 'var(--admin-radius-sm)',
          color: '#dc2626'
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          padding: '1rem',
          marginBottom: '1rem',
          backgroundColor: 'rgba(5, 150, 105, 0.1)',
          border: '1px solid #059669',
          borderRadius: 'var(--admin-radius-sm)',
          color: '#059669'
        }}>
          {success}
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <div className="loading-spinner" style={{ width: 40, height: 40, borderWidth: 3 }}></div>
        </div>
      ) : (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Contact Details</h2>
          </div>
          <div className="card-content">
            {!isEditing ? (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                  <div style={{ padding: '1.5rem', backgroundColor: 'var(--admin-secondary)', borderRadius: 'var(--admin-radius-sm)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <Phone size={18} style={{ color: 'var(--admin-primary)' }} />
                      <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: '600', color: 'var(--admin-muted-foreground)', textTransform: 'uppercase' }}>Phone</p>
                    </div>
                    <p style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600', color: 'var(--admin-foreground)' }}>{contactForm.phone}</p>
                  </div>

                  <div style={{ padding: '1.5rem', backgroundColor: 'var(--admin-secondary)', borderRadius: 'var(--admin-radius-sm)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <Mail size={18} style={{ color: 'var(--admin-primary)' }} />
                      <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: '600', color: 'var(--admin-muted-foreground)', textTransform: 'uppercase' }}>Email</p>
                    </div>
                    <p style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600', color: 'var(--admin-foreground)' }}>{contactForm.email}</p>
                  </div>

                  <div style={{ padding: '1.5rem', backgroundColor: 'var(--admin-secondary)', borderRadius: 'var(--admin-radius-sm)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <MapPin size={18} style={{ color: 'var(--admin-primary)' }} />
                      <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: '600', color: 'var(--admin-muted-foreground)', textTransform: 'uppercase' }}>City</p>
                    </div>
                    <p style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: 'var(--admin-foreground)' }}>{contactForm.city}</p>
                  </div>

                  <div style={{ padding: '1.5rem', backgroundColor: 'var(--admin-secondary)', borderRadius: 'var(--admin-radius-sm)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <Hash size={18} style={{ color: 'var(--admin-primary)' }} />
                      <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: '600', color: 'var(--admin-muted-foreground)', textTransform: 'uppercase' }}>Zip Code</p>
                    </div>
                    <p style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: 'var(--admin-foreground)' }}>{contactForm.zipCode}</p>
                  </div>
                </div>

                <div style={{ padding: '1.5rem', backgroundColor: 'var(--admin-secondary)', borderRadius: 'var(--admin-radius-sm)', marginBottom: '2rem' }}>
                  <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.75rem', fontWeight: '600', color: 'var(--admin-muted-foreground)', textTransform: 'uppercase' }}>Address</p>
                  <p style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: 'var(--admin-foreground)' }}>{contactForm.address}</p>
                </div>

                <button onClick={() => setIsEditing(true)} className="btn btn-primary">
                  <Edit size={18} /> Edit Contact Information
                </button>
              </div>
            ) : (
              <form style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--admin-muted-foreground)' }}>Phone *</label>
                  <input
                    type="tel"
                    className="input"
                    value={contactForm.phone}
                    onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                    placeholder="Enter phone number"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--admin-muted-foreground)' }}>Email *</label>
                  <input
                    type="email"
                    className="input"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    placeholder="Enter email address"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--admin-muted-foreground)' }}>Address *</label>
                  <input
                    type="text"
                    className="input"
                    value={contactForm.address}
                    onChange={(e) => setContactForm({ ...contactForm, address: e.target.value })}
                    placeholder="Enter street address"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--admin-muted-foreground)' }}>City *</label>
                  <input
                    type="text"
                    className="input"
                    value={contactForm.city}
                    onChange={(e) => setContactForm({ ...contactForm, city: e.target.value })}
                    placeholder="Enter city"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--admin-muted-foreground)' }}>Zip Code</label>
                  <input
                    type="text"
                    className="input"
                    value={contactForm.zipCode}
                    onChange={(e) => setContactForm({ ...contactForm, zipCode: e.target.value })}
                    placeholder="Enter zip code"
                  />
                </div>

                <div style={{ display: 'flex', gap: '1rem', paddingTop: '1rem' }}>
                  <button type="button" onClick={handleUpdateContact} className="btn btn-primary">
                    Save Changes
                  </button>
                  <button type="button" onClick={() => setIsEditing(false)} className="btn btn-secondary">
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactContent;
