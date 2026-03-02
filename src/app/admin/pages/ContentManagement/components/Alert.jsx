export const Alert = ({ message, type }) => (
  <div className={`alert ${type === 'error' ? 'alert-danger' : 'alert-success'}`}>
    <span>{message}</span>
  </div>
);
