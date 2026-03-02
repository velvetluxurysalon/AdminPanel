import { Edit } from 'lucide-react';
import { TextInput, TextAreaInput, ImageUploadInput } from '../components';

export const HeroSection = ({
  activeTab,
  heroForm,
  setHeroForm,
  editingHero,
  setEditingHero,
  handleImageUpload,
  handleUpdateHeroContent
}) => {
  if (activeTab !== 'hero') return null;

  return (
    <div id="hero" style={{ padding: '2rem' }}>
      <div className="section-container">
        {editingHero ? (
          <div className="form-container">
            <h2>Edit Hero Section</h2>
            <TextInput
              label="Title"
              value={heroForm.title}
              onChange={(e) => setHeroForm({ ...heroForm, title: e.target.value })}
              placeholder="Enter hero title"
            />
            <TextAreaInput
              label="Subtitle"
              value={heroForm.subtitle}
              onChange={(e) => setHeroForm({ ...heroForm, subtitle: e.target.value })}
              placeholder="Enter hero subtitle"
            />
            <ImageUploadInput
              label="Hero Image"
              value={heroForm.image}
              onChange={(e) => handleImageUpload(e, 'image', setHeroForm)}
            />
            <TextInput
              label="CTA Button Text"
              value={heroForm.ctaButtonText}
              onChange={(e) => setHeroForm({ ...heroForm, ctaButtonText: e.target.value })}
            />
            <TextInput
              label="CTA Button Link"
              value={heroForm.ctaButtonLink}
              onChange={(e) => setHeroForm({ ...heroForm, ctaButtonLink: e.target.value })}
            />
            <div className="flex gap-2">
              <button onClick={handleUpdateHeroContent} className="btn btn-primary">
                Save
              </button>
              <button onClick={() => setEditingHero(false)} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <button 
              onClick={() => setEditingHero(true)} 
              className="btn btn-primary"
            >
              <Edit size={20} /> Edit Hero Section
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
