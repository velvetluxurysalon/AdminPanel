export const TextInput = ({ label, value, onChange, placeholder = '', type = 'text' }) => (
  <div>
    <label className="block">{label}</label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
    />
  </div>
);
