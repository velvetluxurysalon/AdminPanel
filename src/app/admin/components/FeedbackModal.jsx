import { useState } from 'react';
import { X, Star } from 'lucide-react';
import { submitFeedback } from '../utils/firebaseUtils';

const FeedbackModal = ({ visitId, onClose, onSubmit }) => {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        setLoading(true);
        setError('');
        try {
            await submitFeedback(visitId, {
                rating,
                comment
            });
            onSubmit();
            onClose();
        } catch (error) {
            console.error('Feedback failed:', error);
            setError('Failed to submit feedback');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div className="card" style={{ width: '400px' }}>
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 className="card-title">Customer Feedback</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white' }}><X size={20} /></button>
                </div>
                <div className="card-content">
                    <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                        {[1, 2, 3, 4, 5].map(star => (
                            <Star
                                key={star}
                                size={32}
                                fill={rating >= star ? 'var(--primary)' : 'none'}
                                color={rating >= star ? 'var(--primary)' : 'var(--muted-foreground)'}
                                style={{ cursor: 'pointer', transition: 'transform 0.1s' }}
                                onClick={() => setRating(star)}
                                className="hover:scale-110"
                            />
                        ))}
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Comments (Optional)</label>
                        <textarea
                            className="input"
                            rows="3"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="How was the service?"
                        />
                    </div>

                    <button
                        className="btn btn-primary"
                        style={{ width: '100%' }}
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        Submit Feedback
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FeedbackModal;
