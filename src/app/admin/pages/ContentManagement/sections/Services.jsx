import { Edit, Trash2 } from 'lucide-react';
import { TextInput, TextAreaInput, ImageUploadInput } from '../components';

export const Services = ({
  activeTab,
  services,
  serviceForm,
  setServiceForm,
  editingService,
  setEditingService,
  handleImageUpload,
  handleAddService,
  handleUpdateService,
  handleDeleteService
}) => {
  if (activeTab !== 'services') return null;

  return (
    <div id="services">
      <div className="section-container">
        <div className="form-container">
          <h2>{editingService ? 'Edit Service' : 'Add New Service'}</h2>
          <TextInput
            label="Service Name *"
            value={serviceForm.name}
            onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
            placeholder="Enter service name"
          />
          <TextAreaInput
            label="Description"
            value={serviceForm.description}
            onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
          />
          <TextInput
            label="Price *"
            value={serviceForm.price}
            onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })}
            placeholder="e.g., $45 - $85"
          />
          <TextInput
            label="Category"
            value={serviceForm.category}
            onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value })}
          />
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Rating</label>
            <input
              type="number"
              min="0"
              max="5"
              step="0.1"
              value={serviceForm.rating}
              onChange={(e) => setServiceForm({ ...serviceForm, rating: parseFloat(e.target.value) })}
              className="w-full p-2 border rounded-md"
            />
          </div>
          <div className="mb-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={serviceForm.featured}
                onChange={(e) => setServiceForm({ ...serviceForm, featured: e.target.checked })}
              />
              <span>Featured Service</span>
            </label>
          </div>
          <ImageUploadInput
            label="Service Image *"
            value={serviceForm.image}
            onChange={(e) => handleImageUpload(e, 'image', setServiceForm)}
          />
          <div className="flex gap-2">
            <button
              onClick={editingService ? handleUpdateService : handleAddService}
              className="btn btn-primary"
            >
              {editingService ? 'Update Service' : 'Add Service'}
            </button>
            {editingService && (
              <button
                onClick={() => {
                  setEditingService(null);
                  setServiceForm({
                    name: '',
                    description: '',
                    price: '',
                    rating: 5,
                    image: '',
                    category: '',
                    featured: false
                  });
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        <div className="items-list">
          <h3>Services List</h3>
          {services.length === 0 ? (
            <p className="text-gray-500">No services added yet</p>
          ) : (
            <div className="grid gap-4">
              {services.map((service) => (
                <div key={service.id} className="list-item">
                  <div className="flex gap-4">
                    {service.image && (
                      <img
                        src={service.image}
                        alt={service.name}
                        className="w-24 h-24 object-cover rounded-md"
                      />
                    )}
                    <div className="flex-1">
                      <h4 className="font-semibold">{service.name}</h4>
                      <p className="text-sm text-gray-600">{service.description}</p>
                      <p className="text-sm"><strong>Price:</strong> {service.price}</p>
                      <p className="text-sm"><strong>Rating:</strong> {service.rating} ⭐</p>
                      {service.featured && <span className="badge badge-success">Featured</span>}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingService(service);
                          setServiceForm(service);
                        }}
                        className="btn btn-sm btn-primary"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteService(service.id)}
                        className="btn btn-sm btn-danger"
                      >
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
    </div>
  );
};
