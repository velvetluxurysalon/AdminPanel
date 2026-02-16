import { useState, useEffect } from 'react';
import { Edit, FileText } from 'lucide-react';
import {
  getHeroContent,
  updateHeroContent,
  getContactInfo,
  updateContactInfo,
  uploadImage
} from '../../services/contentService';

const ContentManagement = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('hero');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Hero State
  const [editingHero, setEditingHero] = useState(false);
  const [heroForm, setHeroForm] = useState({
    title: '',
    subtitle: '',
    image: '',
    ctaButtonText: '',
    ctaButtonLink: ''
  });

  // Contact State
  const [editingContact, setEditingContact] = useState(false);
  const [contactForm, setContactForm] = useState({
    phone: '',
    email: '',
    address: '',
    city: '',
    zipCode: '',
  });

  // Handle hash navigation from sidebar
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.substring(1);
      if (hash && ['hero', 'team', 'gallery', 'testimonials', 'faqs', 'blog', 'offers', 'contact'].includes(hash)) {
        setActiveTab(hash);
      } else if (!hash) {
        setActiveTab('hero');
      }
    };

    // Check initial hash
    handleHashChange();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [hero, contact] = await Promise.all([
        getHeroContent(),
        getContactInfo()
      ]);
      if (hero) setHeroForm(hero);
      if (contact) setContactForm(contact);
    } catch (err) {
      setError('Failed to load content');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e, fieldName, formSetter) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      const url = await uploadImage(file, 'content');
      formSetter(prev => ({ ...prev, [fieldName]: url }));
      setSuccess('Image uploaded successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to upload image');
      console.error(err);
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleUpdateHero = async () => {
    try {
      if (!heroForm.title || !heroForm.subtitle || !heroForm.image) {
        setError('Please fill all required fields');
        return;
      }
      await updateHeroContent(heroForm);
      setSuccess('Hero content updated successfully');
      setEditingHero(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to update hero content');
      console.error(err);
    }
  };

  const handleUpdateContact = async () => {
    try {
      if (!contactForm.phone || !contactForm.email || !contactForm.address) {
        setError('Please fill all required fields');
        return;
      }
      await updateContactInfo(contactForm);
      setSuccess('Contact info updated successfully');
      setEditingContact(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to update contact info');
      console.error(err);
    }
  };

  const tabs = [
    { id: 'hero', label: 'Hero Section' },
    { id: 'team', label: 'Team Members' },
    { id: 'gallery', label: 'Gallery' },
    { id: 'testimonials', label: 'Testimonials' },
    { id: 'faqs', label: 'FAQs' },
    { id: 'blog', label: 'Blog Posts' },
    { id: 'offers', label: 'Special Offers' },
    { id: 'contact', label: 'Contact Info' },
  ];

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
          color: '#dc2626',
          animation: 'slideDown 0.3s ease'
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
          color: '#059669',
          animation: 'slideDown 0.3s ease'
        }}>
          {success}
        </div>
      )}

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '2rem',
        borderBottom: '1px solid var(--admin-border)',
        overflowX: 'auto',
        paddingBottom: '0'
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: activeTab === tab.id ? 'var(--admin-primary)' : 'var(--admin-muted-foreground)',
              borderBottom: activeTab === tab.id ? '2px solid var(--admin-primary)' : '2px solid transparent',
              fontSize: '0.875rem',
              fontWeight: '500',
              transition: 'all var(--admin-transition-fast)',
              whiteSpace: 'nowrap'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <div className="loading-spinner" style={{ width: 40, height: 40, borderWidth: 3 }}></div>
        </div>
      ) : (
        <div>
          {/* Hero Section Tab */}
          {activeTab === 'hero' && (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Hero Section Content</h2>
              </div>
              <div className="card-content">
                {!editingHero ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', backgroundColor: 'var(--admin-secondary)', borderRadius: 'var(--admin-radius-sm)' }}>
                    <div>
                      <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: '600' }}>{heroForm.title || 'Hero Title'}</h3>
                      <p style={{ margin: 0, color: 'var(--admin-muted-foreground)', fontSize: '0.875rem' }}>{heroForm.subtitle || 'Hero Subtitle'}</p>
                    </div>
                    <button
                      onClick={() => setEditingHero(true)}
                      className="btn btn-primary"
                    >
                      <Edit size={18} /> Edit
                    </button>
                  </div>
                ) : (
                  <form style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--admin-muted-foreground)' }}>Hero Title *</label>
                      <input
                        type="text"
                        className="input"
                        value={heroForm.title}
                        onChange={(e) => setHeroForm({ ...heroForm, title: e.target.value })}
                        placeholder="Enter hero title"
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--admin-muted-foreground)' }}>Hero Subtitle *</label>
                      <textarea
                        className="input"
                        style={{ minHeight: '100px', resize: 'vertical' }}
                        value={heroForm.subtitle}
                        onChange={(e) => setHeroForm({ ...heroForm, subtitle: e.target.value })}
                        placeholder="Enter hero subtitle"
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--admin-muted-foreground)' }}>Hero Image *</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, 'image', setHeroForm)}
                        className="input"
                        style={{ cursor: 'pointer' }}
                      />
                      {heroForm.image && (
                        <div style={{ marginTop: '1rem' }}>
                          <img src={heroForm.image} alt="Hero preview" style={{ maxWidth: '200px', maxHeight: '150px', borderRadius: 'var(--admin-radius-sm)' }} />
                        </div>
                      )}
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--admin-muted-foreground)' }}>CTA Button Text</label>
                      <input
                        type="text"
                        className="input"
                        value={heroForm.ctaButtonText}
                        onChange={(e) => setHeroForm({ ...heroForm, ctaButtonText: e.target.value })}
                        placeholder="e.g., Book Now"
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--admin-muted-foreground)' }}>CTA Button Link</label>
                      <input
                        type="text"
                        className="input"
                        value={heroForm.ctaButtonLink}
                        onChange={(e) => setHeroForm({ ...heroForm, ctaButtonLink: e.target.value })}
                        placeholder="e.g., /booking"
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', paddingTop: '1rem' }}>
                      <button type="button" onClick={handleUpdateHero} className="btn btn-primary">
                        Save Changes
                      </button>
                      <button type="button" onClick={() => setEditingHero(false)} className="btn btn-secondary">
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* Team Members Tab */}
          {activeTab === 'team' && (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Team Members</h2>
              </div>
              <div className="card-content">
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--admin-muted-foreground)' }}>
                  <p>Team Members management coming soon...</p>
                </div>
              </div>
            </div>
          )}

          {/* Gallery Tab */}
          {activeTab === 'gallery' && (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Gallery</h2>
              </div>
              <div className="card-content">
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--admin-muted-foreground)' }}>
                  <p>Gallery management coming soon...</p>
                </div>
              </div>
            </div>
          )}

          {/* Testimonials Tab */}
          {activeTab === 'testimonials' && (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Testimonials</h2>
              </div>
              <div className="card-content">
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--admin-muted-foreground)' }}>
                  <p>Testimonials management coming soon...</p>
                </div>
              </div>
            </div>
          )}

          {/* FAQs Tab */}
          {activeTab === 'faqs' && (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">FAQs</h2>
              </div>
              <div className="card-content">
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--admin-muted-foreground)' }}>
                  <p>FAQs management coming soon...</p>
                </div>
              </div>
            </div>
          )}

          {/* Blog Posts Tab */}
          {activeTab === 'blog' && (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Blog Posts</h2>
              </div>
              <div className="card-content">
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--admin-muted-foreground)' }}>
                  <p>Blog Posts management coming soon...</p>
                </div>
              </div>
            </div>
          )}

          {/* Special Offers Tab */}
          {activeTab === 'offers' && (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Special Offers</h2>
              </div>
              <div className="card-content">
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--admin-muted-foreground)' }}>
                  <p>Special Offers management coming soon...</p>
                </div>
              </div>
            </div>
          )}

          {/* Contact Info Tab */}
          {activeTab === 'contact' && (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Contact Information</h2>
              </div>
              <div className="card-content">
                {!editingContact ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                    <div style={{ padding: '1rem', backgroundColor: 'var(--admin-secondary)', borderRadius: 'var(--admin-radius-sm)' }}>
                      <p style={{ margin: '0 0 0.5rem 0', color: 'var(--admin-muted-foreground)', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase' }}>Phone</p>
                      <p style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>{contactForm.phone || 'N/A'}</p>
                    </div>
                    <div style={{ padding: '1rem', backgroundColor: 'var(--admin-secondary)', borderRadius: 'var(--admin-radius-sm)' }}>
                      <p style={{ margin: '0 0 0.5rem 0', color: 'var(--admin-muted-foreground)', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase' }}>Email</p>
                      <p style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>{contactForm.email || 'N/A'}</p>
                    </div>
                    <div style={{ padding: '1rem', backgroundColor: 'var(--admin-secondary)', borderRadius: 'var(--admin-radius-sm)' }}>
                      <p style={{ margin: '0 0 0.5rem 0', color: 'var(--admin-muted-foreground)', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase' }}>City</p>
                      <p style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>{contactForm.city || 'N/A'}</p>
                    </div>
                    <div style={{ padding: '1rem', backgroundColor: 'var(--admin-secondary)', borderRadius: 'var(--admin-radius-sm)' }}>
                      <p style={{ margin: '0 0 0.5rem 0', color: 'var(--admin-muted-foreground)', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase' }}>Zip Code</p>
                      <p style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>{contactForm.zipCode || 'N/A'}</p>
                    </div>
                    <div style={{ padding: '1rem', backgroundColor: 'var(--admin-secondary)', borderRadius: 'var(--admin-radius-sm)', gridColumn: 'span 1' }}>
                      <p style={{ margin: '0 0 0.5rem 0', color: 'var(--admin-muted-foreground)', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase' }}>Address</p>
                      <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: '500' }}>{contactForm.address || 'N/A'}</p>
                    </div>
                  </div>
                ) : null}

                {editingContact && (
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
                      <button type="button" onClick={() => setEditingContact(false)} className="btn btn-secondary">
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {!editingContact && (
                  <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--admin-border)' }}>
                    <button onClick={() => setEditingContact(true)} className="btn btn-primary">
                      <Edit size={18} /> Edit Information
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ContentManagement;
