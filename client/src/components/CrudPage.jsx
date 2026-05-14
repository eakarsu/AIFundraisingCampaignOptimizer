import { useState, useEffect, useCallback } from 'react';
import { Plus, ArrowLeft, Edit2, Trash2, Sparkles, Loader2 } from 'lucide-react';
import { api } from '../api';
import Modal from './Modal';
import DeleteConfirm from './DeleteConfirm';
import AIResponse from './AIResponse';
import Toast from './Toast';

export default function CrudPage({
  title,
  resource,
  icon: Icon,
  gradient = 'from-primary-600 to-primary-800',
  fields = [],
  columns = [],
  aiActions = [],
  renderDetail,
  itemLabel = 'Item',
}) {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({});
  const [showDelete, setShowDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiTitle, setAiTitle] = useState('');
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const limit = 20;

  const notify = (message, type = 'success') => setToast({ message, type });

  const loadItems = useCallback(async (p = page) => {
    setLoading(true);
    try {
      const res = await api.getAll(resource, { page: p, limit });
      // Support both paginated { data, pagination } and legacy flat array responses
      if (res && res.data && res.pagination) {
        setItems(Array.isArray(res.data) ? res.data : []);
        setPagination(res.pagination);
      } else {
        const arr = Array.isArray(res) ? res : (res.data || []);
        setItems(Array.isArray(arr) ? arr : []);
        setPagination(null);
      }
    } catch {
      setItems([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [resource, page, limit]);

  useEffect(() => { loadItems(page); }, [loadItems, page]);

  const openCreate = () => {
    setEditItem(null);
    const initial = {};
    fields.forEach(f => { initial[f.key] = f.default || ''; });
    setForm(initial);
    setShowForm(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    const initial = {};
    fields.forEach(f => { initial[f.key] = item[f.key] ?? f.default ?? ''; });
    setForm(initial);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editItem) {
        await api.update(resource, editItem._id || editItem.id, form);
        notify(`${itemLabel} updated`);
      } else {
        await api.create(resource, form);
        notify(`${itemLabel} created`);
      }
      setShowForm(false);
      setSelected(null);
      loadItems();
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(resource, deleteTarget._id || deleteTarget.id);
      notify(`${itemLabel} deleted`);
      setShowDelete(false);
      setDeleteTarget(null);
      if (selected && (selected._id || selected.id) === (deleteTarget._id || deleteTarget.id)) {
        setSelected(null);
      }
      loadItems();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const runAI = async (action) => {
    setAiLoading(true);
    setAiResult(null);
    setAiTitle(action.label);
    try {
      const body = action.getBody ? action.getBody(selected, items) : {};
      const res = await api.ai(resource, action.action, body);
      setAiResult(res.data || res.result || res.content || res.response || res.suggestion || res.analysis || res);
    } catch (err) {
      setAiResult('AI request failed: ' + err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const getVal = (item, col) => {
    const val = col.key.split('.').reduce((o, k) => o?.[k], item);
    if (col.render) return col.render(val, item);
    if (val === null || val === undefined) return '-';
    if (typeof val === 'boolean') return val ? 'Yes' : 'No';
    return String(val);
  };

  // Detail View
  if (selected) {
    return (
      <div className="animate-fade-in">
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}
        <button onClick={() => { setSelected(null); setAiResult(null); }}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-4 font-medium">
          <ArrowLeft size={18} /> Back to {title}
        </button>

        <div className="card p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-800">
              {selected.name || selected.title || selected.subject || `${itemLabel} Details`}
            </h2>
            <div className="flex gap-2">
              <button onClick={() => openEdit(selected)} className="btn-secondary flex items-center gap-1.5 text-sm">
                <Edit2 size={14} /> Edit
              </button>
              <button onClick={() => { setDeleteTarget(selected); setShowDelete(true); }}
                      className="btn-danger flex items-center gap-1.5 text-sm">
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>
          {renderDetail ? renderDetail(selected) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fields.map(f => (
                <div key={f.key} className={f.type === 'textarea' ? 'md:col-span-2' : ''}>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{f.label}</label>
                  <p className="mt-1 text-slate-800 whitespace-pre-wrap">
                    {selected[f.key] !== undefined && selected[f.key] !== null ? String(selected[f.key]) : '-'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI generated content on the item */}
        {selected.aiContent && (
          <div className="mb-4">
            <AIResponse content={selected.aiContent} title="AI Generated Content" />
          </div>
        )}
        {selected.generatedContent && (
          <div className="mb-4">
            <AIResponse content={selected.generatedContent} title="AI Generated Content" />
          </div>
        )}

        {/* AI Actions */}
        {aiActions.length > 0 && (
          <div className="card p-4 mb-4">
            <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <Sparkles size={18} className="text-primary-500" /> AI Actions
            </h3>
            <div className="flex flex-wrap gap-2">
              {aiActions.map(a => (
                <button key={a.action} onClick={() => runAI(a)} disabled={aiLoading}
                        className="btn-primary flex items-center gap-1.5 text-sm">
                  <Sparkles size={14} /> {a.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {(aiLoading || aiResult) && (
          <AIResponse content={aiResult} loading={aiLoading} title={aiTitle} />
        )}

        <DeleteConfirm open={showDelete} onClose={() => setShowDelete(false)}
                       onConfirm={handleDelete} itemName={itemLabel} />

        {/* Edit Modal */}
        <Modal open={showForm} onClose={() => setShowForm(false)} title={`Edit ${itemLabel}`}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.filter(f => !f.readOnly).map(f => (
              <div key={f.key}>
                <label className="block text-sm font-medium text-slate-700 mb-1">{f.label}</label>
                {f.type === 'textarea' ? (
                  <textarea value={form[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                            className="input-field" rows={4} />
                ) : f.type === 'select' ? (
                  <select value={form[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                          className="input-field">
                    <option value="">Select...</option>
                    {f.options?.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <input type={f.type || 'text'} value={form[f.key] || ''}
                         onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                         className="input-field" />
                )}
              </div>
            ))}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1">
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    );
  }

  // List View
  return (
    <div className="animate-fade-in">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div className={`bg-gradient-to-r ${gradient} text-white rounded-xl p-6 mb-6 shadow-lg`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {Icon && <Icon size={28} />}
            <div>
              <h1 className="text-2xl font-bold">{title}</h1>
              <p className="text-white/70 text-sm mt-0.5">{pagination ? pagination.total : items.length} {itemLabel.toLowerCase()}s total</p>
            </div>
          </div>
          <div className="flex gap-2">
            {aiActions.filter(a => a.global).map(a => (
              <button key={a.action} onClick={() => runAI(a)} disabled={aiLoading}
                      className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors">
                <Sparkles size={14} /> {a.label}
              </button>
            ))}
            <button onClick={openCreate}
                    className="flex items-center gap-1.5 bg-white text-primary-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-white/90 transition-colors shadow">
              <Plus size={16} /> New {itemLabel}
            </button>
          </div>
        </div>
      </div>

      {(aiLoading || aiResult) && (
        <div className="mb-6">
          <AIResponse content={aiResult} loading={aiLoading} title={aiTitle} />
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-primary-500" />
        </div>
      ) : items.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            {Icon && <Icon size={28} className="text-slate-400" />}
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-1">No {itemLabel.toLowerCase()}s yet</h3>
          <p className="text-slate-500 mb-4">Get started by creating your first {itemLabel.toLowerCase()}.</p>
          <button onClick={openCreate} className="btn-primary">
            <Plus size={16} className="inline mr-1" /> Create {itemLabel}
          </button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b">
                {columns.map(c => (
                  <th key={c.key} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={item._id || item.id || i}
                    onClick={() => setSelected(item)}
                    className="border-b last:border-0 hover:bg-primary-50/50 cursor-pointer transition-colors">
                  {columns.map(c => (
                    <td key={c.key} className="px-5 py-3.5 text-sm text-slate-700">
                      {getVal(item, c)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t bg-slate-50">
              <span className="text-xs text-slate-500">
                Page {pagination.page} of {pagination.totalPages} &mdash; {pagination.total} total
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={pagination.page <= 1}
                  className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Prev
                </button>
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const start = Math.max(1, Math.min(pagination.page - 2, pagination.totalPages - 4));
                  const p = start + i;
                  if (p > pagination.totalPages) return null;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                        p === pagination.page
                          ? 'border-indigo-500 bg-indigo-500 text-white'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editItem ? `Edit ${itemLabel}` : `New ${itemLabel}`}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.filter(f => !f.readOnly).map(f => (
            <div key={f.key}>
              <label className="block text-sm font-medium text-slate-700 mb-1">{f.label}</label>
              {f.type === 'textarea' ? (
                <textarea value={form[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                          className="input-field" rows={4} placeholder={f.placeholder || ''} />
              ) : f.type === 'select' ? (
                <select value={form[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                        className="input-field">
                  <option value="">Select...</option>
                  {f.options?.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input type={f.type || 'text'} value={form[f.key] || ''}
                       onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                       className="input-field" placeholder={f.placeholder || ''} />
              )}
            </div>
          ))}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'Saving...' : editItem ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      <DeleteConfirm open={showDelete} onClose={() => setShowDelete(false)}
                     onConfirm={handleDelete} itemName={itemLabel} />
    </div>
  );
}
