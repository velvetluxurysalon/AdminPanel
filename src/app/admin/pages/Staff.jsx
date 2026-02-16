import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, X, Search, DollarSign, TrendingUp } from 'lucide-react';
import { getStaff, addStaff, updateStaff, uploadServiceImage } from '../utils/firebaseUtils';

const STAFF_ROLES = [
    'Hair Stylist',
    'Barber',
    'Spa Therapist',
    'Nail Artist',
    'Hair Colorist',
    'Makeup Artist',
    'Receptionist',
    'Manager',
    'Esthetician',
    'Massage Therapist',
    'Lash Artist',
    'Cosmetologist'
];

const Staff = () => {
    const [teamMembers, setTeamMembers] = useState([]);
    const [filteredMembers, setFilteredMembers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [newMember, setNewMember] = useState({ 
        name: '', 
        role: '', 
        specialties: '', 
        experience: '',
        bio: '',
        image: '',
        socials: {
            facebook: '',
            instagram: '',
            twitter: ''
        },
        // NEW: Salary fields
        salaryType: 'hourly', // 'hourly' or 'fixed'
        hourlyRate: 150,
        baseSalary: 0,
        bonusPercentage: 5
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editingMember, setEditingMember] = useState(null);
    const [imagePreview, setImagePreview] = useState('');

    useEffect(() => {
        fetchTeamMembers();
    }, []);

    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredMembers(teamMembers);
        } else {
            const lowerQuery = searchQuery.toLowerCase();
            const filtered = teamMembers.filter(member =>
                member.name.toLowerCase().includes(lowerQuery) ||
                member.role.toLowerCase().includes(lowerQuery)
            );
            setFilteredMembers(filtered);
        }
    }, [searchQuery, teamMembers]);

    const fetchTeamMembers = async () => {
        try {
            setLoading(true);
            const data = await getStaff();
            setTeamMembers(data);
            setFilteredMembers(data);
            setError('');
        } catch (error) {
            console.error('Error fetching staff:', error);
            setError('Failed to load staff');
        } finally {
            setLoading(false);
        }
    };

    const handleAddMember = async (e) => {
        e.preventDefault();
        if (!newMember.name || !newMember.role) return;

        try {
            setLoading(true);
            const specialtiesArray = newMember.specialties
                .split(',')
                .map(s => s.trim())
                .filter(s => s.length > 0);

            if (editingMember) {
                // Update existing member in staff collection
                await updateStaff(editingMember.id, {
                    name: newMember.name,
                    role: newMember.role,
                    specialties: specialtiesArray,
                    experience: newMember.experience || '',
                    bio: newMember.bio || '',
                    image: newMember.image || '',
                    socials: {
                        facebook: newMember.socials.facebook || '',
                        instagram: newMember.socials.instagram || '',
                        twitter: newMember.socials.twitter || ''
                    },
                    // Include salary fields when updating
                    salaryType: newMember.salaryType,
                    hourlyRate: parseFloat(newMember.hourlyRate) || 150,
                    baseSalary: parseFloat(newMember.baseSalary) || 0,
                    bonusPercentage: parseFloat(newMember.bonusPercentage) || 5
                });
                setEditingMember(null);
            } else {
                // Add new staff member
                await addStaff({
                    name: newMember.name,
                    phone: '',
                    email: '',
                    role: newMember.role,
                    specialties: specialtiesArray,
                    experience: newMember.experience || '',
                    bio: newMember.bio || '',
                    image: newMember.image || '',
                    socials: {
                        facebook: newMember.socials.facebook || '',
                        instagram: newMember.socials.instagram || '',
                        twitter: newMember.socials.twitter || ''
                    },
                    // NEW: Salary data
                    salaryType: newMember.salaryType,
                    hourlyRate: parseFloat(newMember.hourlyRate) || 150,
                    baseSalary: parseFloat(newMember.baseSalary) || 0,
                    bonusPercentage: parseFloat(newMember.bonusPercentage) || 5
                });
            }
            setNewMember({ name: '', role: '', specialties: '', experience: '', bio: '', image: '', socials: { facebook: '', instagram: '', twitter: '' }, salaryType: 'hourly', hourlyRate: 150, baseSalary: 0, bonusPercentage: 5 });
            setImagePreview('');
            await fetchTeamMembers();
            setError('');
        } catch (error) {
            console.error('Error saving staff:', error);
            setError('Failed to save staff');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteMember = async (id) => {
        if (!window.confirm('Are you sure you want to delete this staff member?')) return;

        try {
            setLoading(true);
            // Soft delete by setting active to false
            await updateStaff(id, { active: false });
            await fetchTeamMembers();
            setError('');
        } catch (error) {
            console.error('Error deleting staff:', error);
            setError('Failed to delete staff');
        } finally {
            setLoading(false);
        }
    };

    const handleEditMember = (member) => {
        setEditingMember(member);
        setNewMember({
            name: member.name,
            role: member.role,
            specialties: (member.specialties || []).join(', '),
            experience: member.experience || '',
            bio: member.bio || '',
            image: member.image || '',
            socials: {
                facebook: member.socials?.facebook || '',
                instagram: member.socials?.instagram || '',
                twitter: member.socials?.twitter || ''
            },
            // NEW: Salary fields
            salaryType: member.salaryType || 'hourly',
            hourlyRate: member.hourlyRate || 150,
            baseSalary: member.baseSalary || 0,
            bonusPercentage: member.bonusPercentage || 5
        });
        setImagePreview(member.image || '');
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setLoading(true);
            const url = await uploadServiceImage(file);
            setNewMember({ ...newMember, image: url });
            setImagePreview(url);
            setError('');
        } catch (error) {
            console.error('Error uploading image:', error);
            setError('Failed to upload image');
        } finally {
            setLoading(false);
        }
    };

    const cancelEdit = () => {
        setEditingMember(null);
        setNewMember({ name: '', role: '', specialties: '', experience: '', bio: '', image: '', socials: { facebook: '', instagram: '', twitter: '' }, salaryType: 'hourly', hourlyRate: 150, baseSalary: 0, bonusPercentage: 5 });
        setImagePreview('');
    };

    return (
        <div>
            <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
                <div style={{ position: 'relative', width: '300px' }}>
                    <input
                        type="text"
                        className="input"
                        placeholder="Search staff members..."
                        style={{ paddingLeft: '2.5rem' }}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Search size={18} style={{ position: 'absolute', left: '1rem', top: '0.75rem', color: 'var(--muted-foreground)' }} />
                </div>
            </div>

            {error && (
                <div style={{ padding: '1rem', marginBottom: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid #ef4444', borderRadius: '4px', color: '#dc2626' }}>
                    {error}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '2rem', alignItems: 'start' }}>
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">Staff Members</h2>
                    </div>
                    <div className="card-content" style={{ maxHeight: '600px', overflowY: 'auto', padding: 0 }}>
                        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0' }}>
                            <thead>
                                <tr>
                                    <th style={{ position: 'sticky', top: 0, background: 'var(--option-bg)', zIndex: 20, padding: '1rem', width: '60px' }}>Photo</th>
                                    <th style={{ position: 'sticky', top: 0, background: 'var(--option-bg)', zIndex: 20, padding: '1rem' }}>Name</th>
                                    <th style={{ position: 'sticky', top: 0, background: 'var(--option-bg)', zIndex: 20, padding: '1rem' }}>Role</th>
                                    <th style={{ position: 'sticky', top: 0, background: 'var(--option-bg)', zIndex: 20, padding: '1rem' }}>Experience</th>
                                    <th style={{ position: 'sticky', top: 0, background: 'var(--option-bg)', zIndex: 20, padding: '1rem' }}>Salary</th>
                                    <th style={{ position: 'sticky', top: 0, background: 'var(--option-bg)', zIndex: 20, padding: '1rem', width: '100px' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredMembers.map(member => (
                                    <tr key={member.id}>
                                        <td style={{ padding: '0.5rem' }}>
                                            <img 
                                                src={member.image || 'https://via.placeholder.com/50?text=No+Image'} 
                                                alt={member.name}
                                                style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }}
                                                onError={(e) => e.currentTarget.src = 'https://via.placeholder.com/50?text=No+Image'}
                                            />
                                        </td>
                                        <td style={{ fontWeight: '500' }}>{member.name}</td>
                                        <td>
                                            <span style={{
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '999px',
                                                fontSize: '0.75rem',
                                                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                                                color: 'var(--primary)',
                                                border: '1px solid var(--glass-border)'
                                            }}>
                                                {member.role}
                                            </span>
                                        </td>
                                        <td style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem' }}>{member.experience}</td>
                                        <td style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--primary)' }}>
                                            {member.salaryType === 'hourly' ? `₹${member.hourlyRate || 150}/hr` : `₹${member.baseSalary || 0}/mo`}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button
                                                    onClick={() => handleEditMember(member)}
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', opacity: 0.7 }}
                                                    className="hover:opacity-100"
                                                    title="Edit member"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteMember(member.id)}
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', opacity: 0.7 }}
                                                    className="hover:opacity-100"
                                                    title="Delete member"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredMembers.length === 0 && (
                                    <tr>
                                        <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted-foreground)' }}>
                                            No staff members found {searchQuery && `matching "${searchQuery}"`}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="card" style={{ height: 'fit-content' }}>
                    <div className="card-header">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 className="card-title">{editingMember ? 'Edit Staff Member' : 'Add New Staff Member'}</h2>
                            {editingMember && (
                                <button
                                    onClick={cancelEdit}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)' }}
                                >
                                    <X size={20} />
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="card-content">
                        <form onSubmit={handleAddMember} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {/* Image Upload */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--muted-foreground)' }}>Photo</label>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                    <div>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            style={{ display: 'none' }}
                                            id="image-upload"
                                            disabled={loading}
                                        />
                                        <label
                                            htmlFor="image-upload"
                                            style={{
                                                display: 'inline-block',
                                                padding: '0.75rem 1.5rem',
                                                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                                                color: 'var(--primary)',
                                                border: '1px solid var(--primary)',
                                                borderRadius: '0.375rem',
                                                cursor: loading ? 'not-allowed' : 'pointer',
                                                fontSize: '0.875rem',
                                                fontWeight: '500',
                                                opacity: loading ? 0.5 : 1
                                            }}
                                        >
                                            Upload Photo
                                        </label>
                                    </div>
                                    {imagePreview && (
                                        <img 
                                            src={imagePreview} 
                                            alt="Preview"
                                            style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--glass-border)' }}
                                        />
                                    )}
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--muted-foreground)' }}>Name</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={newMember.name}
                                    onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                                    placeholder="e.g. Sarah Johnson"
                                    required
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--muted-foreground)' }}>Role</label>
                                <select
                                    className="input"
                                    value={newMember.role}
                                    onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                                    required
                                    style={{ cursor: 'pointer' }}
                                >
                                    <option value="">Select a role...</option>
                                    {STAFF_ROLES.map(role => (
                                        <option key={role} value={role}>{role}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--muted-foreground)' }}>Experience</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={newMember.experience}
                                    onChange={(e) => setNewMember({ ...newMember, experience: e.target.value })}
                                    placeholder="e.g. 12 years"
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--muted-foreground)' }}>Specialties (comma-separated)</label>
                                <textarea
                                    className="input"
                                    value={newMember.specialties}
                                    onChange={(e) => setNewMember({ ...newMember, specialties: e.target.value })}
                                    placeholder="e.g. Hair Coloring, Balayage, Extensions"
                                    rows="2"
                                    style={{ fontFamily: 'inherit', resize: 'vertical' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--muted-foreground)' }}>Bio</label>
                                <textarea
                                    className="input"
                                    value={newMember.bio}
                                    onChange={(e) => setNewMember({ ...newMember, bio: e.target.value })}
                                    placeholder="Professional biography..."
                                    rows="3"
                                    style={{ fontFamily: 'inherit', resize: 'vertical' }}
                                />
                            </div>

                            <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem' }}>
                                <h3 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--muted-foreground)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <DollarSign size={16} />
                                    Salary Configuration
                                </h3>
                                
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--muted-foreground)' }}>Salary Type</label>
                                    <select
                                        className="input"
                                        value={newMember.salaryType}
                                        onChange={(e) => setNewMember({ ...newMember, salaryType: e.target.value })}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <option value="hourly">Hourly Rate</option>
                                        <option value="fixed">Fixed Monthly Salary</option>
                                    </select>
                                </div>

                                {newMember.salaryType === 'hourly' ? (
                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--muted-foreground)' }}>Hourly Rate (₹)</label>
                                        <input
                                            type="number"
                                            className="input"
                                            value={newMember.hourlyRate}
                                            onChange={(e) => setNewMember({ ...newMember, hourlyRate: parseFloat(e.target.value) || 150 })}
                                            placeholder="150"
                                            min="50"
                                            step="10"
                                        />
                                        <div style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)', marginTop: '0.25rem' }}>Standard: 8 hrs/day, Overtime: 1.5x rate</div>
                                    </div>
                                ) : (
                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--muted-foreground)' }}>Monthly Salary (₹)</label>
                                        <input
                                            type="number"
                                            className="input"
                                            value={newMember.baseSalary}
                                            onChange={(e) => setNewMember({ ...newMember, baseSalary: parseFloat(e.target.value) || 0 })}
                                            placeholder="20000"
                                            min="0"
                                            step="100"
                                        />
                                    </div>
                                )}

                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--muted-foreground)' }}>Performance Bonus (%)</label>
                                    <input
                                        type="number"
                                        className="input"
                                        value={newMember.bonusPercentage}
                                        onChange={(e) => setNewMember({ ...newMember, bonusPercentage: parseFloat(e.target.value) || 5 })}
                                        placeholder="5"
                                        min="0"
                                        max="20"
                                        step="0.5"
                                    />
                                    <div style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)', marginTop: '0.25rem' }}>Awarded at 95%+ attendance</div>
                                </div>
                            </div>

                            <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem' }}>
                                <h3 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--muted-foreground)' }}>Social Media (Optional)</h3>
                                
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--muted-foreground)' }}>Facebook URL</label>
                                    <input
                                        type="url"
                                        className="input"
                                        value={newMember.socials.facebook}
                                        onChange={(e) => setNewMember({ ...newMember, socials: { ...newMember.socials, facebook: e.target.value } })}
                                        placeholder="https://facebook.com/..."
                                    />
                                </div>

                                <div style={{ marginTop: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--muted-foreground)' }}>Instagram URL</label>
                                    <input
                                        type="url"
                                        className="input"
                                        value={newMember.socials.instagram}
                                        onChange={(e) => setNewMember({ ...newMember, socials: { ...newMember.socials, instagram: e.target.value } })}
                                        placeholder="https://instagram.com/..."
                                    />
                                </div>

                                <div style={{ marginTop: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--muted-foreground)' }}>Twitter URL</label>
                                    <input
                                        type="url"
                                        className="input"
                                        value={newMember.socials.twitter}
                                        onChange={(e) => setNewMember({ ...newMember, socials: { ...newMember.socials, twitter: e.target.value } })}
                                        placeholder="https://twitter.com/..."
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                                    <Plus size={18} style={{ marginRight: '0.5rem' }} />
                                    {editingMember ? 'Update Staff Member' : 'Add Staff Member'}
                                </button>
                                {editingMember && (
                                    <button 
                                        type="button" 
                                        onClick={cancelEdit}
                                        style={{
                                            padding: '0.625rem 1.5rem',
                                            backgroundColor: 'transparent',
                                            border: '1px solid var(--glass-border)',
                                            color: 'var(--muted-foreground)',
                                            borderRadius: '0.375rem',
                                            cursor: 'pointer',
                                            fontSize: '0.875rem',
                                            fontWeight: '500'
                                        }}
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Staff;
