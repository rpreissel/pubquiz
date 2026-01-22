import './Input.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

export function Input({ label, error, fullWidth = false, className = '', ...props }: InputProps) {
  const inputClasses = ['input', fullWidth ? 'input--full-width' : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={`input-wrapper ${fullWidth ? 'input-wrapper--full-width' : ''}`}>
      {label && <label className="input-label">{label}</label>}
      <input className={inputClasses} {...props} />
      {error && <span className="input-error">{error}</span>}
    </div>
  );
}
