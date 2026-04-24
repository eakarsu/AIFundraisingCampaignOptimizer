import { useEffect } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

export default function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  if (!message) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] animate-slide-in">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border ${
        type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
        'bg-red-50 border-red-200 text-red-800'
      }`}>
        {type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
        <span className="font-medium text-sm">{message}</span>
        <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100"><X size={16} /></button>
      </div>
    </div>
  );
}
