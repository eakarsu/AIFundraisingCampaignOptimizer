import { useState } from 'react';
import { Copy, Check, Sparkles } from 'lucide-react';

function formatAIText(text) {
  if (!text) return null;
  if (typeof text === 'object') {
    text = JSON.stringify(text, null, 2);
  }
  text = String(text);

  // Split into lines and process
  const lines = text.split('\n');
  const elements = [];
  let inList = false;
  let listItems = [];

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="space-y-1 my-2 ml-4">
          {listItems.map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-2 flex-shrink-0" />
              <span dangerouslySetInnerHTML={{ __html: inlineFormat(item) }} />
            </li>
          ))}
        </ul>
      );
      listItems = [];
      inList = false;
    }
  };

  const inlineFormat = (line) => {
    return line
      .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-slate-900">$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code class="px-1.5 py-0.5 bg-slate-100 rounded text-sm font-mono text-primary-700">$1</code>')
      .replace(/\$[\d,]+(?:\.\d{2})?/g, '<span class="font-semibold text-emerald-600">$&</span>')
      .replace(/\b(\d{1,3}(?:,\d{3})*(?:\.\d+)?%)/g, '<span class="font-semibold text-primary-600">$1</span>');
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      elements.push(<div key={idx} className="h-2" />);
      return;
    }

    // Headers
    if (trimmed.startsWith('### ')) {
      flushList();
      elements.push(<h4 key={idx} className="text-md font-semibold text-slate-800 mt-4 mb-1">{trimmed.slice(4)}</h4>);
      return;
    }
    if (trimmed.startsWith('## ')) {
      flushList();
      elements.push(<h3 key={idx} className="text-lg font-bold text-slate-800 mt-4 mb-2 pb-1 border-b border-slate-200">{trimmed.slice(3)}</h3>);
      return;
    }
    if (trimmed.startsWith('# ')) {
      flushList();
      elements.push(<h2 key={idx} className="text-xl font-bold text-primary-700 mt-3 mb-2">{trimmed.slice(2)}</h2>);
      return;
    }

    // Numbered items or bullet items
    if (/^[\d]+[.)]\s/.test(trimmed) || /^[-*]\s/.test(trimmed)) {
      inList = true;
      const content = trimmed.replace(/^[\d]+[.)]\s|^[-*]\s/, '');
      listItems.push(content);
      return;
    }

    // Horizontal rule
    if (/^[-=]{3,}$/.test(trimmed)) {
      flushList();
      elements.push(<hr key={idx} className="my-3 border-slate-200" />);
      return;
    }

    flushList();
    elements.push(
      <p key={idx} className="text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: inlineFormat(trimmed) }} />
    );
  });

  flushList();
  return elements;
}

export default function AIResponse({ content, loading, title }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = typeof content === 'object' ? JSON.stringify(content, null, 2) : String(content);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-primary-50 to-emerald-50 rounded-xl p-8 border border-primary-100">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="relative">
            <Sparkles size={32} className="text-primary-500 animate-pulse" />
          </div>
          <p className="text-primary-700 font-medium">AI is generating your content...</p>
          <div className="loading-dots text-primary-400">
            <span /><span /><span />
          </div>
        </div>
      </div>
    );
  }

  if (!content) return null;

  return (
    <div className="bg-gradient-to-br from-primary-50/80 to-emerald-50/80 rounded-xl border border-primary-100 overflow-hidden animate-fade-in">
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-primary-200" />
          <span className="text-white font-medium text-sm">{title || 'AI Response'}</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-primary-200 hover:text-white text-sm transition-colors"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <div className="p-5 space-y-1">
        {formatAIText(content)}
      </div>
    </div>
  );
}
