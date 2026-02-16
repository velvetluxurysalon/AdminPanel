import { useState, useEffect } from 'react';
import { Edit } from 'lucide-react';
import { getNewsletterContent, updateNewsletterContent } from '../services/contentService';

const NewsletterContent = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [newsletterForm, setNewsletterForm] = useState({
    heading: 'Stay Beautiful, Stay Informed',
    subtitle: 'Get exclusive offers and beauty tips delivered to your inbox',
    inputPlaceholder: 'Enter your email address',
    buttonText: 'Subscribe',
    privacyText: "We respect your privacy. Unsubscribe at any time.",
    stats: {
      subscribers: '10K+',
      subscribersLabel: 'Subscribers',
      discount: '20%',
      discountLabel: 'Exclusive Discount',
      frequency: 'Weekly',
      frequencyLabel: 'Beauty Tips'
    }
  });

  useEffect(() => {
    loadNewsletterContent();
  }, []);

  const loadNewsletterContent = async () => {
    try {
      setIsLoading(true);
      const newsletter = await getNewsletterContent();
      if (newsletter) setNewsletterForm(newsletter);
      setError('');
    } catch (err) {
      setError('Failed to load newsletter content');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateNewsletter = async () => {
    try {
      if (!newsletterForm.heading || !newsletterForm.subtitle) {
        setError('Please fill all required fields');
        return;
      }
      await updateNewsletterContent(newsletterForm);
      setSuccess('Newsletter content updated successfully');
      setIsEditing(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to update newsletter content');
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
            <h2 className="card-title">Newsletter Content</h2>
          </div>
          <div className="card-content">
            {!isEditing ? (
              <div>
                {/* Display Mode */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                  <div>
                    <p style={{ margin: '0 0 0.5rem 0', color: 'var(--admin-muted-foreground)', fontSize: '0.875rem', fontWeight: '600' }}>Heading</p>
                    <p style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600', color: 'var(--admin-foreground)' }}>{newsletterForm.heading}</p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 0.5rem 0', color: 'var(--admin-muted-foreground)', fontSize: '0.875rem', fontWeight: '600' }}>Button Text</p>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--admin-foreground)' }}>{newsletterForm.buttonText}</p>
                  </div>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                  <p style={{ margin: '0 0 0.5rem 0', color: 'var(--admin-muted-foreground)', fontSize: '0.875rem', fontWeight: '600' }}>Subtitle</p>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--admin-foreground)' }}>{newsletterForm.subtitle}</p>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                  <p style={{ margin: '0 0 0.5rem 0', color: 'var(--admin-muted-foreground)', fontSize: '0.875rem', fontWeight: '600' }}>Input Placeholder</p>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--admin-foreground)' }}>{newsletterForm.inputPlaceholder}</p>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                  <p style={{ margin: '0 0 0.5rem 0', color: 'var(--admin-muted-foreground)', fontSize: '0.875rem', fontWeight: '600' }}>Privacy Text</p>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--admin-foreground)' }}>{newsletterForm.privacyText}</p>
                </div>

                <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: 'var(--admin-muted)', borderRadius: 'var(--admin-radius-sm)' }}>
                  <p style={{ margin: '0 0 1rem 0', color: 'var(--admin-muted-foreground)', fontSize: '0.875rem', fontWeight: '600' }}>Statistics</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                    <div>
                      <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600', color: 'var(--admin-foreground)' }}>{newsletterForm.stats.subscribers}</p>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: 'var(--admin-muted-foreground)' }}>{newsletterForm.stats.subscribersLabel}</p>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600', color: 'var(--admin-foreground)' }}>{newsletterForm.stats.discount}</p>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: 'var(--admin-muted-foreground)' }}>{newsletterForm.stats.discountLabel}</p>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600', color: 'var(--admin-foreground)' }}>{newsletterForm.stats.frequency}</p>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: 'var(--admin-muted-foreground)' }}>{newsletterForm.stats.frequencyLabel}</p>
                    </div>
                  </div>
                </div>

                <button onClick={() => setIsEditing(true)} className="btn btn-primary">
                  <Edit size={18} /> Edit Newsletter Content
                </button>
              </div>
            ) : (
              <div>
                {/* Edit Mode */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--admin-foreground)', fontSize: '0.875rem', fontWeight: '600' }}>
                      Heading *
                    </label>
                    <input
                      type="text"
                      value={newsletterForm.heading}
                      onChange={(e) => setNewsletterForm({ ...newsletterForm, heading: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        borderRadius: 'var(--admin-radius-sm)',
                        border: '1px solid var(--admin-border)',
                        fontFamily: 'inherit',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--admin-foreground)', fontSize: '0.875rem', fontWeight: '600' }}>
                      Button Text
                    </label>
                    <input
                      type="text"
                      value={newsletterForm.buttonText}
                      onChange={(e) => setNewsletterForm({ ...newsletterForm, buttonText: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        borderRadius: 'var(--admin-radius-sm)',
                        border: '1px solid var(--admin-border)',
                        fontFamily: 'inherit',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--admin-foreground)', fontSize: '0.875rem', fontWeight: '600' }}>
                    Subtitle *
                  </label>
                  <textarea
                    value={newsletterForm.subtitle}
                    onChange={(e) => setNewsletterForm({ ...newsletterForm, subtitle: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      borderRadius: 'var(--admin-radius-sm)',
                      border: '1px solid var(--admin-border)',
                      fontFamily: 'inherit',
                      fontSize: '0.875rem',
                      minHeight: '80px'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '2rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--admin-foreground)', fontSize: '0.875rem', fontWeight: '600' }}>
                    Input Placeholder
                  </label>
                  <input
                    type="text"
                    value={newsletterForm.inputPlaceholder}
                    onChange={(e) => setNewsletterForm({ ...newsletterForm, inputPlaceholder: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      borderRadius: 'var(--admin-radius-sm)',
                      border: '1px solid var(--admin-border)',
                      fontFamily: 'inherit',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '2rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--admin-foreground)', fontSize: '0.875rem', fontWeight: '600' }}>
                    Privacy Text
                  </label>
                  <textarea
                    value={newsletterForm.privacyText}
                    onChange={(e) => setNewsletterForm({ ...newsletterForm, privacyText: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      borderRadius: 'var(--admin-radius-sm)',
                      border: '1px solid var(--admin-border)',
                      fontFamily: 'inherit',
                      fontSize: '0.875rem',
                      minHeight: '60px'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: 'var(--admin-muted)', borderRadius: 'var(--admin-radius-sm)' }}>
                  <p style={{ margin: '0 0 1rem 0', color: 'var(--admin-muted-foreground)', fontSize: '0.875rem', fontWeight: '600' }}>Statistics</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--admin-foreground)', fontSize: '0.875rem', fontWeight: '600' }}>
                        Subscribers Count
                      </label>
                      <input
                        type="text"
                        value={newsletterForm.stats.subscribers}
                        onChange={(e) => setNewsletterForm({
                          ...newsletterForm,
                          stats: { ...newsletterForm.stats, subscribers: e.target.value }
                        })}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          borderRadius: 'var(--admin-radius-sm)',
                          border: '1px solid var(--admin-border)',
                          fontFamily: 'inherit',
                          fontSize: '0.875rem'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--admin-foreground)', fontSize: '0.875rem', fontWeight: '600' }}>
                        Subscribers Label
                      </label>
                      <input
                        type="text"
                        value={newsletterForm.stats.subscribersLabel}
                        onChange={(e) => setNewsletterForm({
                          ...newsletterForm,
                          stats: { ...newsletterForm.stats, subscribersLabel: e.target.value }
                        })}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          borderRadius: 'var(--admin-radius-sm)',
                          border: '1px solid var(--admin-border)',
                          fontFamily: 'inherit',
                          fontSize: '0.875rem'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--admin-foreground)', fontSize: '0.875rem', fontWeight: '600' }}>
                        Discount Count
                      </label>
                      <input
                        type="text"
                        value={newsletterForm.stats.discount}
                        onChange={(e) => setNewsletterForm({
                          ...newsletterForm,
                          stats: { ...newsletterForm.stats, discount: e.target.value }
                        })}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          borderRadius: 'var(--admin-radius-sm)',
                          border: '1px solid var(--admin-border)',
                          fontFamily: 'inherit',
                          fontSize: '0.875rem'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--admin-foreground)', fontSize: '0.875rem', fontWeight: '600' }}>
                        Discount Label
                      </label>
                      <input
                        type="text"
                        value={newsletterForm.stats.discountLabel}
                        onChange={(e) => setNewsletterForm({
                          ...newsletterForm,
                          stats: { ...newsletterForm.stats, discountLabel: e.target.value }
                        })}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          borderRadius: 'var(--admin-radius-sm)',
                          border: '1px solid var(--admin-border)',
                          fontFamily: 'inherit',
                          fontSize: '0.875rem'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--admin-foreground)', fontSize: '0.875rem', fontWeight: '600' }}>
                        Frequency Count
                      </label>
                      <input
                        type="text"
                        value={newsletterForm.stats.frequency}
                        onChange={(e) => setNewsletterForm({
                          ...newsletterForm,
                          stats: { ...newsletterForm.stats, frequency: e.target.value }
                        })}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          borderRadius: 'var(--admin-radius-sm)',
                          border: '1px solid var(--admin-border)',
                          fontFamily: 'inherit',
                          fontSize: '0.875rem'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--admin-foreground)', fontSize: '0.875rem', fontWeight: '600' }}>
                        Frequency Label
                      </label>
                      <input
                        type="text"
                        value={newsletterForm.stats.frequencyLabel}
                        onChange={(e) => setNewsletterForm({
                          ...newsletterForm,
                          stats: { ...newsletterForm.stats, frequencyLabel: e.target.value }
                        })}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          borderRadius: 'var(--admin-radius-sm)',
                          border: '1px solid var(--admin-border)',
                          fontFamily: 'inherit',
                          fontSize: '0.875rem'
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button onClick={handleUpdateNewsletter} className="btn btn-primary">
                    Save Changes
                  </button>
                  <button 
                    onClick={() => setIsEditing(false)} 
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: 'var(--admin-radius-sm)',
                      border: '1px solid var(--admin-border)',
                      backgroundColor: 'var(--admin-background)',
                      color: 'var(--admin-foreground)',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NewsletterContent;
