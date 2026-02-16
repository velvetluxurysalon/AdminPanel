export const ImageUploadInput = ({ label, value, onChange }) => (
  <div>
    <label className="block">{label}</label>
    <div className="flex gap-3">
      <input
        type="file"
        accept="image/*"
        onChange={onChange}
        style={{ flex: 1 }}
      />
      {value && (
        <div className="file-preview">
          <img src={value} alt="preview" />
        </div>
      )}
    </div>
  </div>
);
