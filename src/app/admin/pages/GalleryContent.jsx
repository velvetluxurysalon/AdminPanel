import { useState, useEffect } from 'react';
import { Trash2, Plus, Edit2 } from 'lucide-react';
import { getGalleryImages, addGalleryImage, updateGalleryImage, deleteGalleryImage, uploadImage } from '../services/contentService';

const GalleryContent = () => {
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    image: '',
    title: '',
    description: ''
  });

  useEffect(() => {
    loadGalleryImages();
  }, []);

  const loadGalleryImages = async () => {
    try {
      setIsLoading(true);
      const galleryImages = await getGalleryImages();
      setImages(galleryImages);
      setError('');
    } catch (err) {
      setError('Failed to load gallery images');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;
      const url = await uploadImage(file, 'gallery');
      setFormData(prev => ({ ...prev, image: url }));
      setSuccess('Image uploaded successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to upload image');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleSubmit = async () => {
    try {
      if (!formData.image || !formData.title) {
        setError('Please fill required fields (Image, Title)');
        return;
      }

      if (editingId) {
        await updateGalleryImage(editingId, formData);
        setSuccess('Gallery image updated successfully');
      } else {
        await addGalleryImage(formData);
        setSuccess('Gallery image added successfully');
      }

      setTimeout(() => setSuccess(''), 3000);
      setFormData({ image: '', title: '', description: '' });
      setIsAddingNew(false);
      setEditingId(null);
      await loadGalleryImages();
    } catch (err) {
      setError('Failed to save gallery image');
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this image?')) return;
    try {
      await deleteGalleryImage(id);
      setSuccess('Gallery image deleted successfully');
      setTimeout(() => setSuccess(''), 3000);
      await loadGalleryImages();
    } catch (err) {
      setError('Failed to delete gallery image');
      console.error(err);
    }
  };

  const handleEdit = (image) => {
    setFormData({
      image: image.image,
      title: image.title || '',
      description: image.description || ''
    });
    setEditingId(image.id);
    setIsAddingNew(true);
  };

  return (
    <div>
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '2rem', alignItems: 'start' }}>
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Gallery Images</h2>
          </div>
          <div className="card-content">
            {isLoading ? (
              <div style={{ padding: '2rem', textAlign: 'center' }}>
                <div className="loading-spinner" style={{ width: 40, height: 40, borderWidth: 3 }}></div>
              </div>
            ) : images.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--admin-muted-foreground)' }}>
                No gallery images yet. Add one to get started!
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                {images.map(image => (
                  <div key={image.id} style={{ position: 'relative', borderRadius: 'var(--admin-radius-sm)', overflow: 'hidden', border: '1px solid var(--admin-border)' }}>
                    <img src={image.image} alt={image.title} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
                    <div style={{ padding: '0.75rem' }}>
                      <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: '600', color: 'var(--admin-foreground)' }}>{image.title}</p>
                      {image.description && <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: 'var(--admin-muted-foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{image.description}</p>}
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                        <button onClick={() => handleEdit(image)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--admin-primary)', flex: 1, padding: '0.5rem' }} className="btn btn-ghost">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(image.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', flex: 1, padding: '0.5rem' }} className="btn btn-ghost">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card" style={{ height: 'fit-content' }}>
          <div className="card-header">
            <h2 className="card-title">{editingId ? 'Edit Image' : 'Add Image'}</h2>
          </div>
          <div className="card-content">
            {!isAddingNew ? (
              <button onClick={() => setIsAddingNew(true)} className="btn btn-primary" style={{ width: '100%' }}>
                <Plus size={18} /> Add Gallery Image
              </button>
            ) : (
              <form style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--admin-muted-foreground)' }}>Title *</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Hair Transformation"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--admin-muted-foreground)' }}>Description</label>
                  <textarea
                    className="input"
                    style={{ minHeight: '100px', resize: 'vertical' }}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe this gallery image..."
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--admin-muted-foreground)' }}>Image *</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="input"
                    style={{ cursor: 'pointer' }}
                  />
                  {formData.image && (
                    <img src={formData.image} alt="Preview" style={{ marginTop: '1rem', maxWidth: '100%', maxHeight: '150px', borderRadius: 'var(--admin-radius-sm)' }} />
                  )}
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button type="button" onClick={handleSubmit} className="btn btn-primary" style={{ flex: 1 }}>
                    {editingId ? 'Update' : 'Add'}
                  </button>
                  <button type="button" onClick={() => { setIsAddingNew(false); setEditingId(null); setFormData({ image: '', title: '', description: '' }); }} className="btn btn-secondary" style={{ flex: 1 }}>
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GalleryContent;
