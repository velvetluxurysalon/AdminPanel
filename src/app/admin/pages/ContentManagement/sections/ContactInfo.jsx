import { Edit, Trash2 } from 'lucide-react';
import { TextInput, TextAreaInput, ImageUploadInput } from '../components';

export const ContactInfo = ({
  activeTab,
  contactForm,
  setContactForm,
  editingContact,
  setEditingContact,
  handleUpdateContactInfo
}) => {
  if (activeTab !== 'contact') return null;

  return (
    <div id="contact" style={{ padding: '2rem' }}>
      <div className="section-container">
        {editingContact ? (
          <div className="form-container">
            <h2>Edit Contact Information</h2>
            <TextInput
              label="Phone *"
              value={contactForm.phone}
              onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
            />
            <TextInput
              label="Email *"
              value={contactForm.email}
              onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
            />
            <TextInput
              label="Address *"
              value={contactForm.address}
              onChange={(e) => setContactForm({ ...contactForm, address: e.target.value })}
            />
            <TextInput
              label="City *"
              value={contactForm.city}
              onChange={(e) => setContactForm({ ...contactForm, city: e.target.value })}
            />
            <TextInput
              label="Zip Code *"
              value={contactForm.zipCode}
              onChange={(e) => setContactForm({ ...contactForm, zipCode: e.target.value })}
            />
            <div className="flex gap-2">
              <button onClick={handleUpdateContactInfo} className="btn btn-primary">
                Save
              </button>
              <button onClick={() => setEditingContact(false)} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setEditingContact(true)} className="btn btn-primary">
            <Edit size={20} /> Edit Contact Information
          </button>
        )}
      </div>
    </div>
  );
};
