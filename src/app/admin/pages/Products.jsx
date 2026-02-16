import { useState, useEffect } from 'react';
import { Plus, Package, X, Trash2 } from 'lucide-react';
import { getProducts, addProduct, uploadProductImage, deleteProduct } from '../utils/firebaseUtils';


const Products = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [newProduct, setNewProduct] = useState({ name: '', category: '', price: '', stock: '', image: null, imagePreview: null });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const data = await getProducts();
            setProducts(data);
            // Extract unique categories
            const uniqueCategories = Array.from(new Set(data.map(p => p.category).filter(Boolean)));
            setCategories(uniqueCategories);
            setError('');
        } catch (error) {
            console.error('Error fetching products:', error);
            setError('Failed to load products');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteProduct = async (productId, productName) => {
        if (window.confirm(`Are you sure you want to delete "${productName}"? This action cannot be undone.`)) {
            try {
                setLoading(true);
                await deleteProduct(productId);
                await fetchProducts();
                setError('');
            } catch (error) {
                console.error('Error deleting product:', error);
                setError('Failed to delete product');
            } finally {
                setLoading(false);
            }
        }
    };

    const handleAddProduct = async (e) => {
        e.preventDefault();
        if (!newProduct.name || !newProduct.price) return;

        try {
            setLoading(true);
            setUploading(true);
            
            let imageUrl = null;
            if (newProduct.image) {
                imageUrl = await uploadProductImage(newProduct.image);
            }
            
            await addProduct({
                name: newProduct.name,
                category: newProduct.category || 'General',
                price: parseFloat(newProduct.price),
                stock: parseInt(newProduct.stock) || 0,
                imageUrl: imageUrl
            });
            setNewProduct({ name: '', category: '', price: '', stock: '', image: null, imagePreview: null });
            await fetchProducts();
            setError('');
        } catch (error) {
            console.error('Error adding product:', error);
            setError('Failed to add product');
        } finally {
            setLoading(false);
            setUploading(false);
        }
    };

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setNewProduct({
                    ...newProduct,
                    image: file,
                    imagePreview: event.target.result
                });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setNewProduct({
            ...newProduct,
            image: null,
            imagePreview: null
        });
    };

    return (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">Inventory List</h2>
                    </div>
                    <div className="card-content">
                        <table style={{ width: '100%' }}>
                            <thead>
                                <tr>
                                    <th style={{ width: '60px' }}>Image</th>
                                    <th>Name</th>
                                    <th>Category</th>
                                    <th style={{ textAlign: 'right' }}>Price</th>
                                    <th style={{ textAlign: 'right' }}>Stock</th>
                                    <th style={{ width: '50px', textAlign: 'center' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map(product => (
                                    <tr key={product.id}>
                                        <td>
                                            {product.imageUrl ? (
                                                <img
                                                    src={product.imageUrl}
                                                    alt={product.name}
                                                    style={{
                                                        width: '50px',
                                                        height: '50px',
                                                        borderRadius: '4px',
                                                        objectFit: 'cover'
                                                    }}
                                                />
                                            ) : (
                                                <div style={{
                                                    width: '50px',
                                                    height: '50px',
                                                    borderRadius: '4px',
                                                    background: 'var(--option-bg)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}>
                                                    <Package size={20} color="var(--muted-foreground)" />
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ fontWeight: '500' }}>{product.name}</td>
                                        <td>{product.category}</td>
                                        <td style={{ textAlign: 'right', color: 'var(--primary)' }}>₹{product.price.toFixed(2)}</td>
                                        <td style={{ textAlign: 'right' }}>
                                            <span style={{
                                                padding: '0.2rem 0.5rem',
                                                borderRadius: '4px',
                                                background: product.stock < 5 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                                                color: product.stock < 5 ? '#ef4444' : 'inherit'
                                            }}>
                                                {product.stock}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <button
                                                onClick={() => handleDeleteProduct(product.id, product.name)}
                                                style={{
                                                    background: 'transparent',
                                                    border: 'none',
                                                    color: '#ef4444',
                                                    cursor: 'pointer',
                                                    padding: '0.25rem',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    borderRadius: '4px',
                                                    transition: 'background-color 0.2s'
                                                }}
                                                onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
                                                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                                title="Delete product"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="card" style={{ height: 'fit-content' }}>
                    <div className="card-header">
                        <h2 className="card-title">Add New Product</h2>
                    </div>
                    <div className="card-content">
                        <form onSubmit={handleAddProduct} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Name</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={newProduct.name}
                                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                                    placeholder="e.g. Shampoo"
                                    required
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Category</label>
                                <input
                                    list="category-list"
                                    type="text"
                                    className="input"
                                    value={newProduct.category}
                                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                                    placeholder="e.g. Hair Care"
                                />
                                <datalist id="category-list">
                                    {categories.map((cat) => (
                                        <option key={cat} value={cat} />
                                    ))}
                                </datalist>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Price (₹)</label>
                                    <input
                                        type="number"
                                        className="input"
                                        value={newProduct.price}
                                        onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Stock</label>
                                    <input
                                        type="number"
                                        className="input"
                                        value={newProduct.stock}
                                        onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Product Image</label>
                                {newProduct.imagePreview ? (
                                    <div style={{ position: 'relative', marginBottom: '1rem' }}>
                                        <img
                                            src={newProduct.imagePreview}
                                            alt="Preview"
                                            style={{
                                                width: '100%',
                                                height: '120px',
                                                borderRadius: '4px',
                                                objectFit: 'cover'
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={handleRemoveImage}
                                            style={{
                                                position: 'absolute',
                                                top: '4px',
                                                right: '4px',
                                                background: 'rgba(0, 0, 0, 0.7)',
                                                border: 'none',
                                                borderRadius: '4px',
                                                color: 'white',
                                                padding: '4px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ) : null}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageSelect}
                                    style={{
                                        padding: '0.5rem',
                                        border: '1px solid var(--border)',
                                        borderRadius: '4px',
                                        background: 'var(--option-bg)',
                                        color: 'var(--foreground)',
                                        cursor: 'pointer',
                                        width: '100%',
                                        fontSize: '0.875rem'
                                    }}
                                />
                            </div>
                            <button type="submit" className="btn btn-primary" disabled={uploading}>
                                <Plus size={18} style={{ marginRight: '0.5rem' }} />
                                {uploading ? 'Uploading...' : 'Add Product'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Products;
