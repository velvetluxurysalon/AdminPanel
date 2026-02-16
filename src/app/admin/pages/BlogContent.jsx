import { useState, useEffect } from 'react';
import { Trash2, Plus, Edit2, Eye, EyeOff, Search } from 'lucide-react';
import { getBlogPosts, addBlogPost, updateBlogPost, deleteBlogPost, uploadImage } from '../services/contentService';

const BlogContent = () => {
  const [blogs, setBlogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    author: '',
    image: '',
    date: new Date().toISOString().split('T')[0],
    status: 'published'
  });

  useEffect(() => {
    loadBlogs();
  }, []);

  const loadBlogs = async () => {
    try {
      setIsLoading(true);
      const data = await getBlogPosts();
      setBlogs(data);
      setError('');
    } catch (err) {
      setError('Failed to load blogs');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;
      const url = await uploadImage(file, 'blogs');
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
      if (!formData.title || !formData.content || !formData.author || !formData.image) {
        setError('Please fill all required fields');
        return;
      }

      if (editingId) {
        await updateBlogPost(editingId, formData);
        setSuccess('Blog updated successfully');
      } else {
        await addBlogPost(formData);
        setSuccess('Blog added successfully');
      }

      setTimeout(() => setSuccess(''), 3000);
      setFormData({ title: '', content: '', author: '', image: '', date: new Date().toISOString().split('T')[0], status: 'published' });
      setIsAddingNew(false);
      setEditingId(null);
      await loadBlogs();
    } catch (err) {
      setError('Failed to save blog');
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this blog post?')) return;
    try {
      await deleteBlogPost(id);
      setSuccess('Blog deleted successfully');
      setTimeout(() => setSuccess(''), 3000);
      await loadBlogs();
    } catch (err) {
      setError('Failed to delete blog');
      console.error(err);
    }
  };

  const handleEdit = (blog) => {
    setFormData({
      title: blog.title,
      content: blog.content,
      author: blog.author,
      image: blog.image,
      date: blog.date,
      status: blog.status || 'published'
    });
    setEditingId(blog.id);
    setIsAddingNew(true);
  };

  const filteredBlogs = blogs.filter(blog => 
    blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    blog.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

      {/* Stats Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="card" style={{ padding: '1.5rem' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--admin-muted-foreground)', margin: '0 0 0.5rem 0' }}>Total Posts</p>
          <p style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--admin-foreground)', margin: 0 }}>{blogs.length}</p>
        </div>
        <div className="card" style={{ padding: '1.5rem' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--admin-muted-foreground)', margin: '0 0 0.5rem 0' }}>Published</p>
          <p style={{ fontSize: '2rem', fontWeight: '700', color: '#059669', margin: 0 }}>{blogs.filter(b => b.status === 'published').length}</p>
        </div>
        <div className="card" style={{ padding: '1.5rem' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--admin-muted-foreground)', margin: '0 0 0.5rem 0' }}>Drafts</p>
          <p style={{ fontSize: '2rem', fontWeight: '700', color: '#f59e0b', margin: 0 }}>{blogs.filter(b => b.status === 'draft').length}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '2rem', alignItems: 'start' }}>
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
            <h2 className="card-title">Blog Posts ({filteredBlogs.length})</h2>
            <button onClick={() => setIsAddingNew(true)} className="btn btn-primary" style={{ marginLeft: 'auto' }}>
              <Plus size={16} /> Add Post
            </button>
          </div>
          <div className="card-content">
            {/* Search */}
            <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <Search size={18} style={{ color: 'var(--admin-muted-foreground)' }} />
              <input
                type="text"
                className="input"
                placeholder="Search by title or author..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ flex: 1 }}
              />
            </div>

            {isLoading ? (
              <div style={{ padding: '2rem', textAlign: 'center' }}>
                <div className="loading-spinner" style={{ width: 40, height: 40, borderWidth: 3 }}></div>
              </div>
            ) : filteredBlogs.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--admin-muted-foreground)' }}>
                {searchTerm ? 'No posts match your search.' : 'No blog posts yet. Add one to get started!'}
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {filteredBlogs.map(blog => (
                  <div key={blog.id} style={{ 
                    padding: '1rem', 
                    backgroundColor: 'var(--admin-secondary)', 
                    borderRadius: 'var(--admin-radius-sm)', 
                    border: '1px solid var(--admin-border)',
                    display: 'grid',
                    gridTemplateColumns: '100px 1fr auto',
                    gap: '1rem',
                    alignItems: 'center'
                  }}>
                    {blog.image && (
                      <img src={blog.image} alt={blog.title} style={{ width: '100px', height: '80px', objectFit: 'cover', borderRadius: 'var(--admin-radius-sm)' }} />
                    )}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <p style={{ margin: 0, fontWeight: '600', color: 'var(--admin-foreground)', fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{blog.title}</p>
                        <span style={{ 
                          display: 'inline-block',
                          padding: '0.25rem 0.75rem',
                          backgroundColor: blog.status === 'published' ? 'rgba(5, 150, 105, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                          color: blog.status === 'published' ? '#059669' : '#f59e0b',
                          fontSize: '0.7rem',
                          fontWeight: '600',
                          borderRadius: 'var(--admin-radius-sm)',
                          textTransform: 'uppercase'
                        }}>
                          {blog.status || 'published'}
                        </span>
                      </div>
                      <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.75rem', color: 'var(--admin-muted-foreground)' }}>
                        By {blog.author} • {new Date(blog.date).toLocaleDateString()}
                      </p>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--admin-muted-foreground)', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {blog.content}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                      <button 
                        onClick={() => handleEdit(blog)} 
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--admin-primary)', padding: '0.5rem', borderRadius: '0.25rem', hover: { backgroundColor: 'rgba(0,0,0,0.1)' } }}
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(blog.id)} 
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: '0.5rem', borderRadius: '0.25rem' }}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {isAddingNew && (
          <div className="card" style={{ height: 'fit-content', position: 'sticky', top: '80px' }}>
            <div className="card-header">
              <h2 className="card-title">{editingId ? 'Edit' : 'Add'} Blog Post</h2>
            </div>
            <div className="card-content">
              <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--admin-muted-foreground)' }}>Title *</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Blog post title"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--admin-muted-foreground)' }}>Author *</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    placeholder="Author name"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--admin-muted-foreground)' }}>Status</label>
                  <select
                    className="input"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--admin-muted-foreground)' }}>Date</label>
                  <input
                    type="date"
                    className="input"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--admin-muted-foreground)' }}>Content *</label>
                  <textarea
                    className="input"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Blog post content"
                    style={{ minHeight: '100px', resize: 'vertical' }}
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
                    <img src={formData.image} alt="Preview" style={{ marginTop: '0.75rem', maxWidth: '100%', maxHeight: '120px', borderRadius: 'var(--admin-radius-sm)', objectFit: 'cover' }} />
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button type="button" onClick={handleSubmit} className="btn btn-primary" style={{ flex: 1 }}>
                    {editingId ? 'Update' : 'Publish'}
                  </button>
                  <button type="button" onClick={() => { setIsAddingNew(false); setEditingId(null); setFormData({ title: '', content: '', author: '', image: '', date: new Date().toISOString().split('T')[0], status: 'published' }); }} className="btn btn-secondary" style={{ flex: 1 }}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogContent;
