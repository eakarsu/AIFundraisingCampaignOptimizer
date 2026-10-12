import AIReport from './AIReport';

// Shared renderer for current AI responses and content stored on record details.
export default function AIResponse({ content, loading, title }) {
  return <AIReport response={content} loading={loading} title={title || 'AI response'} />;
}
