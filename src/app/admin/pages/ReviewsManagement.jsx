import { useState, useEffect } from 'react';
import { Trash2, Edit2, Star, Search, CheckCircle, AlertCircle, Mail, Calendar, Check, X, RefreshCw } from 'lucide-react';
import { db } from '../../../firebaseConfig';
import { collection, getDocs, deleteDoc, doc, updateDoc, query, where } from 'firebase/firestore';

const ReviewsManagement = () => {
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCollecting, setIsCollecting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVerified, setFilterVerified] = useState('all'); // all, verified, unverified
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    customerName: '',
    reviewText: '',
    rating: 5,
    verified: false
  });

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      setIsLoading(true);
      const reviewsRef = collection(db, 'reviews');
      const snapshot = await getDocs(reviewsRef);
      const reviewsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setReviews(reviewsData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      setError('');
    } catch (err) {
      setError('Failed to load reviews from database');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    try {
      await deleteDoc(doc(db, 'reviews', id));
      setSuccess('Review deleted successfully');
      setTimeout(() => setSuccess(''), 3000);
      await loadReviews();
    } catch (err) {
      setError('Failed to delete review');
      console.error(err);
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleEdit = (review) => {
    setEditFormData({
      customerName: review.customerName,
      reviewText: review.reviewText,
      rating: review.rating,
      verified: review.verified || false
    });
    setEditingId(review.id);
  };

  const handleUpdateReview = async () => {
    if (!editingId) return;
    try {
      await updateDoc(doc(db, 'reviews', editingId), {
        customerName: editFormData.customerName,
        reviewText: editFormData.reviewText,
        rating: editFormData.rating,
        verified: editFormData.verified
      });
      setSuccess('Review updated successfully');
      setTimeout(() => setSuccess(''), 3000);
      setEditingId(null);
      await loadReviews();
    } catch (err) {
      setError('Failed to update review');
      console.error(err);
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleToggleVerification = async (review) => {
    try {
      await updateDoc(doc(db, 'reviews', review.id), {
        verified: !review.verified
      });
      setSuccess(`Review ${!review.verified ? 'verified' : 'unverified'} successfully`);
      setTimeout(() => setSuccess(''), 3000);
      await loadReviews();
    } catch (err) {
      setError('Failed to update verification status');
      console.error(err);
      setTimeout(() => setError(''), 3000);
    }
  };

  const collectAllReviews = async () => {
    setIsCollecting(true);
    try {
      await loadReviews();
      setSuccess(`Successfully collected ${reviews.length} reviews`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to collect reviews');
      console.error(err);
      setTimeout(() => setError(''), 3000);
    } finally {
      setIsCollecting(false);
    }
  };

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = 
      review.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.reviewText.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = 
      filterVerified === 'all' ||
      (filterVerified === 'verified' && review.verified) ||
      (filterVerified === 'unverified' && !review.verified);
    
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: reviews.length,
    verified: reviews.filter(r => r.verified).length,
    unverified: reviews.filter(r => !r.verified).length,
    averageRating: reviews.length > 0 
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : 0
  };

  return (
    <div>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      {error && (
        <div style={{
          padding: '1rem',
          marginBottom: '1rem',
          backgroundColor: 'rgba(220, 38, 38, 0.1)',
          border: '1px solid #dc2626',
          borderRadius: 'var(--admin-radius-sm)',
          color: '#dc2626',
          display: 'flex',
          gap: '0.5rem',
          alignItems: 'center'
        }}>
          <AlertCircle size={18} />
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
          display: 'flex',
          gap: '0.5rem',
          alignItems: 'center'
        }}>
          <CheckCircle size={18} />
          ✓ {success}
        </div>
      )}

      {/* Stats Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="card" style={{ padding: '1.5rem' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--admin-muted-foreground)', margin: '0 0 0.5rem 0' }}>Total Reviews</p>
          <p style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--admin-foreground)', margin: 0 }}>{stats.total}</p>
        </div>
        <div className="card" style={{ padding: '1.5rem' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--admin-muted-foreground)', margin: '0 0 0.5rem 0' }}>Verified</p>
          <p style={{ fontSize: '2rem', fontWeight: '700', color: '#059669', margin: 0 }}>{stats.verified}</p>
        </div>
        <div className="card" style={{ padding: '1.5rem' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--admin-muted-foreground)', margin: '0 0 0.5rem 0' }}>Pending Verification</p>
          <p style={{ fontSize: '2rem', fontWeight: '700', color: '#f59e0b', margin: 0 }}>{stats.unverified}</p>
        </div>
        <div className="card" style={{ padding: '1.5rem' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--admin-muted-foreground)', margin: '0 0 0.5rem 0' }}>Average Rating</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <p style={{ fontSize: '2rem', fontWeight: '700', color: '#fbbf24', margin: 0 }}>{stats.averageRating}</p>
            <Star size={20} style={{ fill: '#fbbf24', color: '#fbbf24' }} />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <h2 className="card-title">Reviews ({filteredReviews.length})</h2>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              onClick={collectAllReviews}
              disabled={isCollecting}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: 'var(--admin-primary)',
                color: 'white',
                border: '1px solid var(--admin-primary)',
                borderRadius: 'var(--admin-radius-sm)',
                cursor: isCollecting ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                opacity: isCollecting ? 0.6 : 1,
                transition: 'opacity 0.2s'
              }}
              title="Collect all reviews from the database"
            >
              <RefreshCw size={16} style={{ animation: isCollecting ? 'spin 1s linear infinite' : 'none' }} />
              {isCollecting ? 'Collecting...' : 'Collect Reviews'}
            </button>
            <button
              onClick={() => setFilterVerified('all')}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: filterVerified === 'all' ? 'var(--admin-primary)' : 'transparent',
                color: filterVerified === 'all' ? 'white' : 'var(--admin-foreground)',
                border: `1px solid ${filterVerified === 'all' ? 'var(--admin-primary)' : 'var(--admin-border)'}`,
                borderRadius: 'var(--admin-radius-sm)',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
            >
              All
            </button>
            <button
              onClick={() => setFilterVerified('verified')}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: filterVerified === 'verified' ? '#059669' : 'transparent',
                color: filterVerified === 'verified' ? 'white' : 'var(--admin-foreground)',
                border: `1px solid ${filterVerified === 'verified' ? '#059669' : 'var(--admin-border)'}`,
                borderRadius: 'var(--admin-radius-sm)',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
            >
              Verified
            </button>
            <button
              onClick={() => setFilterVerified('unverified')}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: filterVerified === 'unverified' ? '#f59e0b' : 'transparent',
                color: filterVerified === 'unverified' ? 'white' : 'var(--admin-foreground)',
                border: `1px solid ${filterVerified === 'unverified' ? '#f59e0b' : 'var(--admin-border)'}`,
                borderRadius: 'var(--admin-radius-sm)',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
            >
              Pending
            </button>
          </div>
        </div>

        <div className="card-content">
          {/* Search */}
          <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Search size={18} style={{ color: 'var(--admin-muted-foreground)' }} />
            <input
              type="text"
              className="input"
              placeholder="Search by name, email, or review text..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ flex: 1 }}
            />
          </div>

          {isLoading ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <div className="loading-spinner" style={{ width: 40, height: 40, borderWidth: 3 }}></div>
            </div>
          ) : filteredReviews.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--admin-muted-foreground)' }}>
              {searchTerm || filterVerified !== 'all' ? 'No reviews match your filters.' : 'No reviews yet!'}
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {filteredReviews.map(review => (
                <div key={review.id}>
                  {editingId === review.id ? (
                    // Edit Mode
                    <div style={{ padding: '1.5rem', backgroundColor: 'var(--admin-secondary)', borderRadius: 'var(--admin-radius-sm)', border: '2px solid var(--admin-primary)' }}>
                      <h3 style={{ margin: '0 0 1rem 0', color: 'var(--admin-foreground)', fontSize: '1rem', fontWeight: '600' }}>Edit Review</h3>
                      
                      <div style={{ display: 'grid', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
                          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--admin-muted-foreground)' }}>Customer Name</label>
                          <input
                            type="text"
                            className="input"
                            value={editFormData.customerName}
                            onChange={(e) => setEditFormData({ ...editFormData, customerName: e.target.value })}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--admin-muted-foreground)' }}>Rating</label>
                          <select
                            className="input"
                            value={editFormData.rating}
                            onChange={(e) => setEditFormData({ ...editFormData, rating: parseInt(e.target.value) })}
                          >
                            {[5, 4, 3, 2, 1].map(num => (
                              <option key={num} value={num}>{num}.0/5 Stars</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--admin-muted-foreground)' }}>Review Text</label>
                          <textarea
                            className="input"
                            value={editFormData.reviewText}
                            onChange={(e) => setEditFormData({ ...editFormData, reviewText: e.target.value })}
                            style={{ minHeight: '100px', resize: 'vertical' }}
                          />
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <input
                            type="checkbox"
                            id={`verify-${review.id}`}
                            checked={editFormData.verified}
                            onChange={(e) => setEditFormData({ ...editFormData, verified: e.target.checked })}
                            style={{ cursor: 'pointer' }}
                          />
                          <label htmlFor={`verify-${review.id}`} style={{ cursor: 'pointer', fontSize: '0.875rem', fontWeight: '500', color: 'var(--admin-foreground)' }}>
                            Mark as verified
                          </label>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button
                          onClick={handleUpdateReview}
                          className="btn btn-primary"
                          style={{ flex: 1 }}
                        >
                          Save Changes
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="btn btn-secondary"
                          style={{ flex: 1 }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <div style={{ padding: '1.5rem', backgroundColor: 'var(--admin-secondary)', borderRadius: 'var(--admin-radius-sm)', border: '1px solid var(--admin-border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <h3 style={{ margin: 0, color: 'var(--admin-foreground)', fontSize: '1rem', fontWeight: '600' }}>
                              {review.customerName}
                            </h3>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              padding: '0.25rem 0.75rem',
                              backgroundColor: review.verified ? 'rgba(5, 150, 105, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                              color: review.verified ? '#059669' : '#f59e0b',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              borderRadius: 'var(--admin-radius-sm)',
                              textTransform: 'uppercase'
                            }}>
                              {review.verified ? <Check size={12} /> : <AlertCircle size={12} />}
                              {review.verified ? 'Verified' : 'Pending'}
                            </span>
                          </div>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.875rem', color: 'var(--admin-muted-foreground)', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Mail size={14} />
                              {review.customerEmail}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Calendar size={14} />
                              {review.createdAt ? new Date(review.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.75rem' }}>
                            {[...Array(review.rating)].map((_, i) => (
                              <Star key={i} size={16} style={{ fill: '#fbbf24', color: '#fbbf24' }} />
                            ))}
                          </div>
                        </div>
                        <span style={{ fontSize: '2rem', fontWeight: '700', color: '#fbbf24' }}>
                          {review.rating}.0/5
                        </span>
                      </div>

                      <p style={{ margin: '1rem 0', fontSize: '0.95rem', color: 'var(--admin-foreground)', fontStyle: 'italic', lineHeight: '1.5' }}>
                        "{review.reviewText}"
                      </p>

                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => handleToggleVerification(review)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: review.verified ? '#059669' : '#f59e0b',
                            padding: '0.5rem 1rem',
                            borderRadius: '0.25rem',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                          title={review.verified ? 'Mark as unverified' : 'Verify review'}
                        >
                          {review.verified ? <Check size={16} /> : <AlertCircle size={16} />}
                          {review.verified ? 'Verified' : 'Verify'}
                        </button>
                        <button
                          onClick={() => handleEdit(review)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--admin-primary)', padding: '0.5rem 1rem', borderRadius: '0.25rem' }}
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(review.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: '0.5rem 1rem', borderRadius: '0.25rem' }}
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewsManagement;
