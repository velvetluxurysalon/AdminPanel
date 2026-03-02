import { useState, useEffect } from 'react';
import { Edit } from 'lucide-react';
import { getHeroContent, updateHeroContent, uploadImage } from '../services/contentService';

const HeroContent = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [heroForm, setHeroForm] = useState({
    title: '',
    subtitle: '',
    image: '',
    ctaButtonText: '',
    ctaButtonLink: ''
  });

  useEffect(() => {
    loadHeroContent();
  }, []);

  const loadHeroContent = async () => {
    try {
      setIsLoading(true);
      const hero = await getHeroContent();
      if (hero) setHeroForm(hero);
      setError('');
    } catch (err) {
      setError('Failed to load hero content');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      const url = await uploadImage(file, 'hero');
      setHeroForm(prev => ({ ...prev, image: url }));
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
      setIsEditing(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to update hero content');
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
            <h2 className="card-title">Hero Content</h2>
          </div>
          <div className="card-content">
            {!isEditing ? (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                  <div>
                    <p style={{ margin: '0 0 0.5rem 0', color: 'var(--admin-muted-foreground)', fontSize: '0.875rem', fontWeight: '600' }}>Title</p>
                    <p style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600', color: 'var(--admin-foreground)' }}>{heroForm.title}</p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 0.5rem 0', color: 'var(--admin-muted-foreground)', fontSize: '0.875rem', fontWeight: '600' }}>Subtitle</p>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--admin-foreground)' }}>{heroForm.subtitle}</p>
                  </div>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                  <p style={{ margin: '0 0 0.5rem 0', color: 'var(--admin-muted-foreground)', fontSize: '0.875rem', fontWeight: '600' }}>Hero Image</p>
                  {heroForm.image && (
                    <img src={heroForm.image} alt="Hero" style={{ maxWidth: '300px', maxHeight: '200px', borderRadius: 'var(--admin-radius-sm)', border: '1px solid var(--admin-border)' }} />
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                  <div>
                    <p style={{ margin: '0 0 0.5rem 0', color: 'var(--admin-muted-foreground)', fontSize: '0.875rem', fontWeight: '600' }}>CTA Button Text</p>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--admin-foreground)' }}>{heroForm.ctaButtonText || '-'}</p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 0.5rem 0', color: 'var(--admin-muted-foreground)', fontSize: '0.875rem', fontWeight: '600' }}>CTA Button Link</p>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--admin-foreground)' }}>{heroForm.ctaButtonLink || '-'}</p>
                  </div>
                </div>

                <button onClick={() => setIsEditing(true)} className="btn btn-primary">
                  <Edit size={18} /> Edit Hero Content
                </button>
              </div>
            ) : (
              <form style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--admin-muted-foreground)' }}>Title *</label>
                  <input
                    type="text"
                    className="input"
                    value={heroForm.title}
                    onChange={(e) => setHeroForm({ ...heroForm, title: e.target.value })}
                    placeholder="Enter hero title"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--admin-muted-foreground)' }}>Subtitle *</label>
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
                    onChange={handleImageUpload}
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

export default HeroContent;
