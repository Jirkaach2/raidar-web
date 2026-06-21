import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  hint?: string;
}

interface Props {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
}

/** Custom, fully-styled dropdown replacing the native <select>. */
export default function Select({ value, options, onChange, placeholder = 'Select…', disabled, id }: Props) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  useEffect(() => {
    if (open) setActive(Math.max(0, options.findIndex((o) => o.value === value)));
  }, [open, value, options]);

  const pick = (v: string) => { onChange(v); setOpen(false); };

  const onKey = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (open && options[active]) pick(options[active].value);
      else setOpen(true);
    } else if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive((a) => Math.min(options.length - 1, a + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
    else if (e.key === 'Escape') setOpen(false);
  };

  return (
    <div className={`ui-select ${open ? 'open' : ''} ${disabled ? 'disabled' : ''}`} ref={ref}>
      <button
        type="button" id={id} className="ui-select-trigger" disabled={disabled}
        aria-haspopup="listbox" aria-expanded={open}
        onClick={() => !disabled && setOpen((o) => !o)} onKeyDown={onKey}
      >
        <span className={selected ? '' : 'ui-select-ph'}>{selected ? selected.label : placeholder}</span>
        <ChevronDown size={16} className="ui-select-caret" />
      </button>
      {open && (
        <ul className="ui-select-menu" role="listbox">
          {options.map((o, i) => (
            <li
              key={o.value} role="option" aria-selected={o.value === value}
              className={`ui-select-opt ${o.value === value ? 'selected' : ''} ${i === active ? 'active' : ''}`}
              onMouseEnter={() => setActive(i)} onClick={() => pick(o.value)}
            >
              <span className="ui-select-opt-main">{o.label}{o.hint && <span className="ui-select-opt-hint">{o.hint}</span>}</span>
              {o.value === value && <Check size={15} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
