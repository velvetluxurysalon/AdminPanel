export const TextAreaInput = ({ label, value, onChange, placeholder = '', rows = 4 }) => (
  <div>
    <label className="block">{label}</label>
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
    />
  </div>
);
