import { AlertTriangle } from 'lucide-react';

export default function DeleteConfirm({ open, onClose, onConfirm, itemName }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in p-6">
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle size={28} className="text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Delete {itemName || 'Item'}?</h3>
          <p className="text-slate-500 mb-6">This action cannot be undone. Are you sure you want to delete this item?</p>
          <div className="flex gap-3 w-full">
            <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button onClick={onConfirm} className="btn-danger flex-1">Delete</button>
          </div>
        </div>
      </div>
    </div>
  );
}
