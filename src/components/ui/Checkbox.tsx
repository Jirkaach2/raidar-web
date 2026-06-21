import { Check } from 'lucide-react';

interface Props {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: React.ReactNode;
  disabled?: boolean;
  id?: string;
}

/** Custom, fully-styled checkbox replacing the native input[type=checkbox]. */
export default function Checkbox({ checked, onChange, label, disabled, id }: Props) {
  return (
    <label className={`ui-check ${disabled ? 'disabled' : ''}`}>
      <input
        id={id} type="checkbox" checked={checked} disabled={disabled}
        onChange={(e) => onChange(e.target.checked)} className="ui-check-input"
      />
      <span className="ui-check-box"><Check size={13} strokeWidth={3} /></span>
      {label && <span className="ui-check-label">{label}</span>}
    </label>
  );
}
