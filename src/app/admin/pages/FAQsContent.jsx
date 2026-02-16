import { useState, useEffect } from 'react';
import { Trash2, Plus, Edit2, ChevronDown, Upload } from 'lucide-react';
import { getFAQs, addFAQ, updateFAQ, deleteFAQ, getFAQMetadata, updateFAQMetadata } from '../services/contentService';

const FAQsContent = () => {
  const [faqs, setFAQs] = useState([]);
  const [metadata, setMetadata] = useState({ title: '', description: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [isEditingMetadata, setIsEditingMetadata] = useState(false);
  const [formData, setFormData] = useState({
    question: '',
    answer: ''
  });
  const [metadataForm, setMetadataForm] = useState({
    title: '',
    description: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [faqsData, metadataData] = await Promise.all([
        getFAQs(),
        getFAQMetadata()
      ]);
      setFAQs(faqsData);
      if (metadataData) {
        setMetadata(metadataData);
        setMetadataForm(metadataData);
      }
      setError('');
    } catch (err) {
      setError('Failed to load FAQs');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };


  const handleUpdateMetadata = async () => {
    try {
      if (!metadataForm.title || !metadataForm.description) {
        setError('Please fill all metadata fields');
        return;
      }
      await updateFAQMetadata(metadataForm);
      setMetadata(metadataForm);
      setSuccess('FAQ metadata updated successfully');
      setTimeout(() => setSuccess(''), 3000);
      setIsEditingMetadata(false);
    } catch (err) {
      setError('Failed to update metadata');
      console.error(err);
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleSubmit = async () => {
    try {
      if (!formData.question || !formData.answer) {
        setError('Please fill all fields');
        return;
      }

      if (editingId) {
        await updateFAQ(editingId, formData);
        setSuccess('FAQ updated successfully');
      } else {
        await addFAQ(formData);
        setSuccess('FAQ added successfully');
      }

      setTimeout(() => setSuccess(''), 3000);
      setFormData({ question: '', answer: '' });
      setIsAddingNew(false);
      setEditingId(null);
      await loadData();
    } catch (err) {
      setError('Failed to save FAQ');
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this FAQ?')) return;
    try {
      await deleteFAQ(id);
      setSuccess('FAQ deleted successfully');
      setTimeout(() => setSuccess(''), 3000);
      await loadData();
    } catch (err) {
      setError('Failed to delete FAQ');
      console.error(err);
    }
  };

  const handleEdit = (faq) => {
    setFormData({
      question: faq.question,
      answer: faq.answer
    });
    setEditingId(faq.id);
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


      {/* Metadata Card */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <h2 className="card-title">FAQ Section Metadata</h2>
        </div>
        <div className="card-content">
          {!isEditingMetadata ? (
            <div>
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: '600', color: 'var(--admin-muted-foreground)' }}>Title</p>
                <p style={{ margin: 0, fontSize: '1rem', color: 'var(--admin-foreground)' }}>{metadata.title || 'Not set'}</p>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: '600', color: 'var(--admin-muted-foreground)' }}>Description</p>
                <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--admin-foreground)', whiteSpace: 'pre-wrap' }}>{metadata.description || 'Not set'}</p>
              </div>
              <button
                onClick={() => {
                  setMetadataForm(metadata);
                  setIsEditingMetadata(true);
                }}
                className="btn btn-primary"
              >
                <Edit2 size={16} /> Edit Metadata
              </button>
            </div>
          ) : (
            <form style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--admin-muted-foreground)' }}>Section Title *</label>
                <input
                  type="text"
                  className="input"
                  value={metadataForm.title}
                  onChange={(e) => setMetadataForm({ ...metadataForm, title: e.target.value })}
                  placeholder="e.g., Frequently Asked Questions"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--admin-muted-foreground)' }}>Description *</label>
                <textarea
                  className="input"
                  value={metadataForm.description}
                  onChange={(e) => setMetadataForm({ ...metadataForm, description: e.target.value })}
                  placeholder="e.g., Everything you need to know about our services"
                  style={{ minHeight: '80px', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="button" onClick={handleUpdateMetadata} className="btn btn-primary" style={{ flex: 1 }}>
                  Save Metadata
                </button>
                <button type="button" onClick={() => setIsEditingMetadata(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '2rem', alignItems: 'start' }}>
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">FAQ List</h2>
          </div>
          <div className="card-content">
            {isLoading ? (
              <div style={{ padding: '2rem', textAlign: 'center' }}>
                <div className="loading-spinner" style={{ width: 40, height: 40, borderWidth: 3 }}></div>
              </div>
            ) : faqs.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--admin-muted-foreground)' }}>
                No FAQs yet. Add one to get started!
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {faqs.map(faq => (
                  <div key={faq.id} style={{ padding: '1rem', backgroundColor: 'var(--admin-secondary)', borderRadius: 'var(--admin-radius-sm)', border: '1px solid var(--admin-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '0.75rem' }}>
                      <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => setExpandedId(expandedId === faq.id ? null : faq.id)}>
                        <p style={{ margin: '0', fontWeight: '600', color: 'var(--admin-foreground)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <ChevronDown size={16} style={{ transform: expandedId === faq.id ? 'rotate(0)' : 'rotate(-90deg)', transition: 'transform 0.2s' }} />
                          {faq.question}
                        </p>
                      </div>
                    </div>
                    {expandedId === faq.id && (
                      <div style={{ marginBottom: '0.75rem', paddingLeft: '1.5rem', borderLeft: '2px solid var(--admin-primary)' }}>
                        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: 'var(--admin-foreground)', whiteSpace: 'pre-wrap' }}>{faq.answer}</p>
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => handleEdit(faq)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--admin-primary)', flex: 1 }}>
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(faq.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', flex: 1 }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card" style={{ height: 'fit-content' }}>
          <div className="card-header">
            <h2 className="card-title">{editingId ? 'Edit' : 'Add'} FAQ</h2>
          </div>
          <div className="card-content">
            {!isAddingNew ? (
              <button onClick={() => setIsAddingNew(true)} className="btn btn-primary" style={{ width: '100%' }}>
                <Plus size={18} /> Add FAQ
              </button>
            ) : (
              <form style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--admin-muted-foreground)' }}>Question *</label>
                  <textarea
                    className="input"
                    value={formData.question}
                    onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                    placeholder="Enter question"
                    style={{ minHeight: '80px', resize: 'vertical' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--admin-muted-foreground)' }}>Answer *</label>
                  <textarea
                    className="input"
                    value={formData.answer}
                    onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                    placeholder="Enter answer"
                    style={{ minHeight: '120px', resize: 'vertical' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button type="button" onClick={handleSubmit} className="btn btn-primary" style={{ flex: 1 }}>
                    {editingId ? 'Update' : 'Add'}
                  </button>
                  <button type="button" onClick={() => { setIsAddingNew(false); setEditingId(null); setFormData({ question: '', answer: '' }); }} className="btn btn-secondary" style={{ flex: 1 }}>
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

export default FAQsContent;
