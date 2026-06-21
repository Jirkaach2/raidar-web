import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export interface ConfirmOptions {
  title?: string;
  message: ReactNode;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

type Resolver = (ok: boolean) => void;

const ConfirmContext = createContext<((opts: ConfirmOptions) => Promise<boolean>) | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<Resolver | null>(null);

  const confirm = useCallback((o: ConfirmOptions) => {
    setOpts(o);
    return new Promise<boolean>((resolve) => { resolver.current = resolve; });
  }, []);

  const finish = (ok: boolean) => { resolver.current?.(ok); resolver.current = null; setOpts(null); };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {opts && (
        <div className="confirm-overlay" onClick={() => finish(false)}>
          <div className="confirm-box bracketed" onClick={(e) => e.stopPropagation()} role="alertdialog" aria-modal="true">
            <button className="confirm-x" onClick={() => finish(false)} aria-label="Close"><X size={16} /></button>
            <div className={`confirm-ic ${opts.danger ? 'danger' : ''}`}><AlertTriangle size={22} /></div>
            <h3>{opts.title || 'Are you sure?'}</h3>
            <div className="confirm-msg">{opts.message}</div>
            <div className="confirm-actions">
              <button className="btn btn-ghost" onClick={() => finish(false)}>{opts.cancelText || 'Cancel'}</button>
              <button className={`btn ${opts.danger ? 'btn-danger' : ''}`} onClick={() => finish(true)} autoFocus>{opts.confirmText || 'Confirm'}</button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within a ConfirmProvider');
  return ctx;
}
