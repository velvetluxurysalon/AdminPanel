import { useState, useEffect } from 'react';
import { Trash2, Plus, Search, RotateCcw, Edit2, X, Star, Settings, ChevronDown, ChevronUp, Download, FileJson } from 'lucide-react';
import { getServices, getRecentServices, addService, updateService, deleteService, restoreService, uploadServiceImage, getServiceCategories, addServiceCategory, updateServiceCategory, deleteServiceCategory, initializeDefaultCategories } from '../utils/firebaseUtils';
import { exportServicesAsPDF, exportServicesAsExcel } from '../pages/exportUtils';

const Services = () => {
    const [services, setServices] = useState([]);
    const [filteredServices, setFilteredServices] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [newService, setNewService] = useState({ name: '', price: '', category: 'General', gender: 'Unisex', description: '', image: '' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [recentServices, setRecentServices] = useState({ added: [], deleted: [] });
    const [editingService, setEditingService] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [exportingPDF, setExportingPDF] = useState(false);
    const [exportingExcel, setExportingExcel] = useState(false);
    
    // Category management state
    const [categories, setCategories] = useState([]);
    const [showCategoryManager, setShowCategoryManager] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [editingCategory, setEditingCategory] = useState(null);
    const [categoryLoading, setCategoryLoading] = useState(false);
    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');

    useEffect(() => {
        fetchServices();
        fetchCategories();
    }, []);

    useEffect(() => {
        let filtered = [...services];
        
        // Filter by category
        if (selectedCategoryFilter !== 'All') {
            filtered = filtered.filter(service => service.category === selectedCategoryFilter);
        }
        
        // Filter by search query
        if (searchQuery.trim() !== '') {
            const lowerQuery = searchQuery.toLowerCase();
            filtered = filtered.filter(service =>
                service.name.toLowerCase().includes(lowerQuery) ||
                service.category.toLowerCase().includes(lowerQuery)
            );
        }
        
        // Sort by category name, then by service name
        filtered.sort((a, b) => {
            const categoryCompare = (a.category || '').localeCompare(b.category || '');
            if (categoryCompare !== 0) return categoryCompare;
            return (a.name || '').localeCompare(b.name || '');
        });
        
        setFilteredServices(filtered);
    }, [searchQuery, services, selectedCategoryFilter]);

    const fetchCategories = async () => {
        try {
            setCategoryLoading(true);
            let fetchedCategories = await getServiceCategories();
            
            // Initialize default categories if none exist
            if (fetchedCategories.length === 0) {
                fetchedCategories = await initializeDefaultCategories();
            }
            
            setCategories(fetchedCategories);
        } catch (error) {
            console.error('Error fetching categories:', error);
            setError('Failed to load categories');
        } finally {
            setCategoryLoading(false);
        }
    };

    const handleAddCategory = async (e) => {
        e.preventDefault();
        if (!newCategoryName.trim()) return;
        
        try {
            setCategoryLoading(true);
            if (editingCategory) {
                await updateServiceCategory(editingCategory.id, { name: newCategoryName.trim() });
                setEditingCategory(null);
            } else {
                await addServiceCategory({ name: newCategoryName.trim() });
            }
            setNewCategoryName('');
            await fetchCategories();
        } catch (error) {
            console.error('Error saving category:', error);
            setError('Failed to save category');
        } finally {
            setCategoryLoading(false);
        }
    };

    const handleEditCategory = (category) => {
        setEditingCategory(category);
        setNewCategoryName(category.name);
    };

    const handleDeleteCategory = async (categoryId, categoryName) => {
        // Check if any services use this category
        const servicesUsingCategory = services.filter(s => s.category === categoryName);
        if (servicesUsingCategory.length > 0) {
            if (!window.confirm(`${servicesUsingCategory.length} service(s) are using this category. They will be set to "Other". Continue?`)) {
                return;
            }
            // Update services to use "Other" category
            for (const service of servicesUsingCategory) {
                await updateService(service.id, { ...service, category: 'Other' });
            }
        } else {
            if (!window.confirm('Are you sure you want to delete this category?')) return;
        }
        
        try {
            setCategoryLoading(true);
            await deleteServiceCategory(categoryId);
            await fetchCategories();
            await fetchServices();
        } catch (error) {
            console.error('Error deleting category:', error);
            setError('Failed to delete category');
        } finally {
            setCategoryLoading(false);
        }
    };

    const cancelCategoryEdit = () => {
        setEditingCategory(null);
        setNewCategoryName('');
    };

    const fetchServices = async () => {
        try {
            setLoading(true);
            const [allServices, recent] = await Promise.all([
                getServices(false),
                getRecentServices(7)
            ]);

            setServices(allServices);
            setFilteredServices(allServices);
            setRecentServices({ added: recent, deleted: [] });
            setError('');
        } catch (error) {
            console.error('Error fetching services:', error);
            setError('Failed to load services');
        } finally {
            setLoading(false);
        }
    };

    const handleAddService = async (e) => {
        e.preventDefault();
        if (!newService.name || !newService.price) return;

        try {
            setLoading(true);
            const serviceData = {
                name: newService.name,
                category: newService.category || 'General',
                price: typeof newService.price === 'number' ? newService.price : parseFloat(newService.price),
                duration: 30,
                gender: newService.gender || 'Unisex',
                description: newService.description || '',
                image: newService.image || ''
            };

            if (editingService) {
                // Update existing service
                await updateService(editingService.id, serviceData);
                setEditingService(null);
            } else {
                // Add new service
                await addService(serviceData);
            }
            setNewService({ name: '', price: '', category: 'General', gender: 'Unisex', description: '', image: '' });
            setImagePreview('');
            await fetchServices();
            setError('');
        } catch (error) {
            console.error('Error saving service:', error);
            setError('Failed to save service');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteService = async (id) => {
        if (!window.confirm('Are you sure you want to delete this service?')) return;

        try {
            setLoading(true);
            await deleteService(id);
            await fetchServices();
            setError('');
        } catch (error) {
            console.error('Error deleting service:', error);
            setError('Failed to delete service');
        } finally {
            setLoading(false);
        }
    };

    const handleRestoreService = async (id) => {
        try {
            setLoading(true);
            await restoreService(id);
            await fetchServices();
            setError('');
        } catch (error) {
            console.error('Error restoring service:', error);
            setError('Failed to restore service');
        } finally {
            setLoading(false);
        }
    };

    const handleEditService = (service) => {
        setEditingService(service);
        setNewService({
            name: service.name,
            price: service.price,
            category: service.category || 'General',
            gender: service.gender || 'Unisex',
            description: service.description || '',
            image: service.image || ''
        });
        setImagePreview(service.image || '');
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setLoading(true);
            const url = await uploadServiceImage(file);
            setNewService({ ...newService, image: url });
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
        setEditingService(null);
        setNewService({ name: '', price: '', category: 'General', gender: 'any', description: '', image: '' });
        setImagePreview('');
    };

    const handleExportPDF = async () => {
        try {
            setExportingPDF(true);
            const fileName = `velvet-salon-services-${new Date().toISOString().split('T')[0]}.pdf`;
            await exportServicesAsPDF(filteredServices, fileName);
            setError('');
        } catch (error) {
            console.error('Error exporting PDF:', error);
            setError('Failed to export PDF');
        } finally {
            setExportingPDF(false);
        }
    };

    const handleExportExcel = async () => {
        try {
            setExportingExcel(true);
            const fileName = `velvet-salon-services-${new Date().toISOString().split('T')[0]}.xlsx`;
            await exportServicesAsExcel(filteredServices, fileName);
            setError('');
        } catch (error) {
            console.error('Error exporting Excel:', error);
            setError('Failed to export Excel');
        } finally {
            setExportingExcel(false);
        }
    };

    // Group filtered services by category
    const getGroupedServices = () => {
        const grouped = {};
        filteredServices.forEach(service => {
            const cat = service.category || 'Uncategorized';
            if (!grouped[cat]) {
                grouped[cat] = [];
            }
            grouped[cat].push(service);
        });
        return grouped;
    };

    const groupedServices = getGroupedServices();
    const categoryGroups = Object.keys(groupedServices).sort();

    return (
        <div>
            <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ position: 'relative', width: '300px' }}>
                    <input
                        type="text"
                        className="input"
                        placeholder="Search services..."
                        style={{ paddingLeft: '2.5rem' }}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Search size={18} style={{ position: 'absolute', left: '1rem', top: '0.75rem', color: 'var(--muted-foreground)' }} />
                </div>
                <select
                    className="input"
                    value={selectedCategoryFilter}
                    onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                    style={{ width: '200px', cursor: 'pointer' }}
                >
                    <option value="All">All Categories</option>
                    {categories.filter(cat => cat.isActive !== false).map(category => (
                        <option key={category.id} value={category.name}>{category.name}</option>
                    ))}
                </select>
                
                {/* Export Buttons */}
                <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
                    <button
                        onClick={handleExportPDF}
                        disabled={filteredServices.length === 0 || exportingPDF || exportingExcel}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.625rem 1rem',
                            backgroundColor: filteredServices.length === 0 || exportingPDF || exportingExcel ? 'rgba(139, 92, 246, 0.3)' : 'rgba(139, 92, 246, 0.1)',
                            color: 'var(--primary)',
                            border: '1px solid var(--primary)',
                            borderRadius: '0.375rem',
                            cursor: filteredServices.length === 0 || exportingPDF || exportingExcel ? 'not-allowed' : 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            opacity: filteredServices.length === 0 || exportingPDF || exportingExcel ? 0.6 : 1,
                            transition: 'all 0.2s'
                        }}
                        title={filteredServices.length === 0 ? 'No services to export' : 'Export as PDF'}
                    >
                        <Download size={16} />
                        {exportingPDF ? 'Exporting...' : 'PDF'}
                    </button>
                    <button
                        onClick={handleExportExcel}
                        disabled={filteredServices.length === 0 || exportingPDF || exportingExcel}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.625rem 1rem',
                            backgroundColor: filteredServices.length === 0 || exportingPDF || exportingExcel ? 'rgba(34, 197, 94, 0.3)' : 'rgba(34, 197, 94, 0.1)',
                            color: '#22c55e',
                            border: '1px solid #22c55e',
                            borderRadius: '0.375rem',
                            cursor: filteredServices.length === 0 || exportingPDF || exportingExcel ? 'not-allowed' : 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            opacity: filteredServices.length === 0 || exportingPDF || exportingExcel ? 0.6 : 1,
                            transition: 'all 0.2s'
                        }}
                        title={filteredServices.length === 0 ? 'No services to export' : 'Export as Excel'}
                    >
                        <FileJson size={16} />
                        {exportingExcel ? 'Exporting...' : 'Excel'}
                    </button>
                </div>
                
                <span style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                    {filteredServices.length} service{filteredServices.length !== 1 ? 's' : ''}
                </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 350px', gap: '2rem', alignItems: 'start' }}>
                {/* Services by Category */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {categoryGroups.length === 0 ? (
                        <div className="card">
                            <div className="card-content" style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--muted-foreground)' }}>
                                No services found
                            </div>
                        </div>
                    ) : (
                        categoryGroups.map(categoryName => (
                            <div key={categoryName} className="card">
                                <div className="card-header">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h3 className="card-title" style={{ fontSize: '1.125rem', margin: 0 }}>
                                            {categoryName}
                                            <span style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', marginLeft: '0.5rem' }}>
                                                ({groupedServices[categoryName].length})
                                            </span>
                                        </h3>
                                    </div>
                                </div>
                                <div className="card-content" style={{ padding: '0' }}>
                                    <div style={{ overflowX: 'auto' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem', padding: '1rem', minWidth: '100%' }}>
                                            {groupedServices[categoryName].map(service => (
                                                <div 
                                                    key={service.id}
                                                    style={{
                                                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                                        border: '1px solid var(--glass-border)',
                                                        borderRadius: '0.75rem',
                                                        padding: '1rem',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        gap: '0.75rem'
                                                    }}
                                                    className="hover:border-purple-500/50 transition-colors"
                                                >
                                                    {/* Service Image */}
                                                    <img 
                                                        src={service.image || 'https://via.placeholder.com/250?text=No+Image'} 
                                                        alt={service.name}
                                                        style={{ 
                                                            width: '100%', 
                                                            height: '160px', 
                                                            borderRadius: '0.5rem', 
                                                            objectFit: 'cover',
                                                            cursor: 'pointer'
                                                        }}
                                                        onError={(e) => e.currentTarget.src = 'https://via.placeholder.com/250?text=No+Image'}
                                                    />
                                                    
                                                    {/* Service Info */}
                                                    <div>
                                                        <h4 style={{ fontWeight: '600', margin: '0 0 0.25rem 0', fontSize: '0.95rem' }}>
                                                            {service.name}
                                                        </h4>
                                                        <p style={{ margin: '0', fontSize: '0.85rem', color: 'var(--muted-foreground)' }}>
                                                            {service.description && service.description.substring(0, 50)}
                                                            {service.description && service.description.length > 50 ? '...' : ''}
                                                        </p>
                                                    </div>

                                                    {/* Price & Duration */}
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderTop: '1px solid var(--glass-border)', borderBottom: '1px solid var(--glass-border)' }}>
                                                        <div>
                                                            <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', display: 'block' }}>Price</span>
                                                            <span style={{ fontWeight: '600', color: 'var(--primary)' }}>
                                                                ₹{typeof service.price === 'number' ? service.price.toFixed(2) : service.price}
                                                            </span>
                                                        </div>
                                                        {service.duration && (
                                                            <div style={{ textAlign: 'right' }}>
                                                                <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', display: 'block' }}>Duration</span>
                                                                <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{service.duration}m</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Actions */}
                                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                        <button
                                                            onClick={() => handleEditService(service)}
                                                            style={{ 
                                                                background: 'none', 
                                                                border: 'none', 
                                                                cursor: 'pointer', 
                                                                color: 'var(--primary)', 
                                                                opacity: 0.7,
                                                                padding: '0.5rem'
                                                            }}
                                                            className="hover:opacity-100"
                                                            title="Edit service"
                                                        >
                                                            <Edit2 size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteService(service.id)}
                                                            style={{ 
                                                                background: 'none', 
                                                                border: 'none', 
                                                                cursor: 'pointer', 
                                                                color: 'var(--danger)', 
                                                                opacity: 0.7,
                                                                padding: '0.5rem'
                                                            }}
                                                            className="hover:opacity-100"
                                                            title="Delete service"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="card" style={{ height: 'fit-content' }}>
                        <div className="card-header">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h2 className="card-title">{editingService ? 'Edit Service' : 'Add New Service'}</h2>
                                {editingService && (
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
                            <form onSubmit={handleAddService} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                {/* Image Upload */}
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--muted-foreground)' }}>Service Image</label>
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
                                                Choose Image
                                            </label>
                                        </div>
                                        {imagePreview && (
                                            <img 
                                                src={imagePreview} 
                                                alt="Preview"
                                                style={{ width: '100px', height: '100px', borderRadius: '0.375rem', objectFit: 'cover', border: '1px solid var(--glass-border)' }}
                                            />
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--muted-foreground)' }}>Service Name</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={newService.name}
                                        onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                                        placeholder="e.g. Gold Facial"
                                        required
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--muted-foreground)' }}>Description</label>
                                    <textarea
                                        className="input"
                                        value={newService.description}
                                        onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                                        placeholder="Service description..."
                                        rows="3"
                                        style={{ fontFamily: 'inherit', resize: 'vertical' }}
                                    />
                                </div>

                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                        <label style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--muted-foreground)' }}>Category</label>
                                        <button
                                            type="button"
                                            onClick={() => setShowCategoryManager(!showCategoryManager)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                color: 'var(--primary)',
                                                fontSize: '0.75rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.25rem'
                                            }}
                                        >
                                            <Settings size={14} />
                                            Manage
                                        </button>
                                    </div>
                                    <select
                                        className="input"
                                        value={newService.category}
                                        onChange={(e) => setNewService({ ...newService, category: e.target.value })}
                                        required
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <option value="">Select a category...</option>
                                        {categories.filter(cat => cat.isActive !== false).map(category => (
                                            <option key={category.id} value={category.name}>{category.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Category Manager Panel */}
                                {showCategoryManager && (
                                    <div style={{
                                        backgroundColor: 'rgba(0, 0, 0, 0.2)',
                                        border: '1px solid var(--glass-border)',
                                        borderRadius: '0.5rem',
                                        padding: '1rem'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                            <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--foreground)' }}>
                                                Manage Categories
                                            </h4>
                                            <button
                                                type="button"
                                                onClick={() => setShowCategoryManager(false)}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)' }}
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                        
                                        {/* Add/Edit Category Form */}
                                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                                            <input
                                                type="text"
                                                className="input"
                                                value={newCategoryName}
                                                onChange={(e) => setNewCategoryName(e.target.value)}
                                                placeholder="Category name..."
                                                style={{ flex: 1, fontSize: '0.875rem', padding: '0.5rem' }}
                                            />
                                            <button
                                                type="button"
                                                onClick={handleAddCategory}
                                                disabled={!newCategoryName.trim() || categoryLoading}
                                                style={{
                                                    padding: '0.5rem 0.75rem',
                                                    backgroundColor: 'var(--primary)',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '0.375rem',
                                                    cursor: newCategoryName.trim() && !categoryLoading ? 'pointer' : 'not-allowed',
                                                    fontSize: '0.75rem',
                                                    fontWeight: '500',
                                                    opacity: newCategoryName.trim() && !categoryLoading ? 1 : 0.5
                                                }}
                                            >
                                                {editingCategory ? 'Update' : 'Add'}
                                            </button>
                                            {editingCategory && (
                                                <button
                                                    type="button"
                                                    onClick={cancelCategoryEdit}
                                                    style={{
                                                        padding: '0.5rem 0.75rem',
                                                        backgroundColor: 'transparent',
                                                        color: 'var(--muted-foreground)',
                                                        border: '1px solid var(--glass-border)',
                                                        borderRadius: '0.375rem',
                                                        cursor: 'pointer',
                                                        fontSize: '0.75rem'
                                                    }}
                                                >
                                                    Cancel
                                                </button>
                                            )}
                                        </div>
                                        
                                        {/* Category List */}
                                        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                            {categories.map(category => (
                                                <div
                                                    key={category.id}
                                                    style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        padding: '0.5rem',
                                                        borderBottom: '1px solid var(--glass-border)',
                                                        backgroundColor: editingCategory?.id === category.id ? 'rgba(139, 92, 246, 0.1)' : 'transparent'
                                                    }}
                                                >
                                                    <span style={{ fontSize: '0.875rem', color: 'var(--foreground)' }}>{category.name}</span>
                                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleEditCategory(category)}
                                                            style={{
                                                                background: 'none',
                                                                border: 'none',
                                                                cursor: 'pointer',
                                                                color: 'var(--primary)',
                                                                padding: '0.25rem'
                                                            }}
                                                        >
                                                            <Edit2 size={14} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteCategory(category.id, category.name)}
                                                            style={{
                                                                background: 'none',
                                                                border: 'none',
                                                                cursor: 'pointer',
                                                                color: 'var(--danger)',
                                                                padding: '0.25rem'
                                                            }}
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                            {categories.length === 0 && (
                                                <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--muted-foreground)', fontSize: '0.875rem' }}>
                                                    No categories yet
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--muted-foreground)' }}>Price (₹)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="input"
                                        value={newService.price}
                                        onChange={(e) => setNewService({ ...newService, price: e.target.value })}
                                        placeholder="0.00"
                                        required
                                    />
                                </div>

                                <div>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                                            <Plus size={18} style={{ marginRight: '0.5rem' }} />
                                            {editingService ? 'Update Service' : 'Add Service'}
                                        </button>
                                        {editingService && (
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
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="card">
                        <div className="card-header">
                            <h2 className="card-title">Recent Activity</h2>
                        </div>
                        <div className="card-content">
                            <div style={{ marginBottom: '1.5rem' }}>
                                <h3 style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Last Added</h3>
                                {recentServices.added.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {recentServices.added.map(s => (
                                            <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                                <span>{s.name}</span>
                                                <span style={{ color: 'var(--success)' }}>+ ₹{s.price}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', fontStyle: 'italic' }}>No recent additions</div>
                                )}
                            </div>

                            <div>
                                <h3 style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Last Deleted</h3>
                                {recentServices.deleted.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {recentServices.deleted.map(s => (
                                            <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem', opacity: 0.7 }}>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ textDecoration: 'line-through' }}>{s.name}</span>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--danger)' }}>Deleted</span>
                                                </div>
                                                <button
                                                    onClick={() => handleRestoreService(s.id)}
                                                    style={{
                                                        background: 'none',
                                                        border: '1px solid var(--glass-border)',
                                                        borderRadius: '4px',
                                                        padding: '0.25rem 0.5rem',
                                                        cursor: 'pointer',
                                                        color: 'var(--primary)',
                                                        fontSize: '0.75rem',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.25rem'
                                                    }}
                                                    className="hover:bg-white/5"
                                                >
                                                    <RotateCcw size={12} />
                                                    Undo
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', fontStyle: 'italic' }}>No recent deletions</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Services;
