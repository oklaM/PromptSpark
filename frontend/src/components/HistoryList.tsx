import { useEffect, useState } from 'react';
import { promptService } from '../services/promptService';
import { RotateCcw } from 'lucide-react';

interface PromptVersion {
  id: string;
  version: number;
  title: string;
  description: string;
  content: string;
  changedBy: string;
  createdAt: string;
}

interface HistoryListProps {
  promptId: string;
  onRevertSuccess?: () => void;
}

export function HistoryList({ promptId, onRevertSuccess }: HistoryListProps) {
  const [history, setHistory] = useState<PromptVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [revertingId, setRevertingId] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, [promptId]);

  const loadHistory = async () => {
    try {
      const res = await promptService.getHistory(promptId);
      if (res.success) {
        setHistory(res.data);
      }
    } catch (err) {
      console.error('Failed to load history', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRevert = async (version: number) => {
    if (!confirm(`Are you sure you want to revert to version ${version}? Current changes will be saved as a new version.`)) return;
    
    setRevertingId(version.toString());
    try {
      await promptService.revertPrompt(promptId, version);
      onRevertSuccess?.();
      loadHistory(); // Reload to see new version created by revert
    } catch (err) {
      console.error('Failed to revert', err);
      alert('Failed to revert to version');
    } finally {
      setRevertingId(null);
    }
  };

  if (loading) return <div className="p-4 text-center text-gray-500">Loading history...</div>;

  if (history.length === 0) return <div className="p-4 text-center text-gray-500">No history available.</div>;

  return (
    <div className="space-y-4">
      {history.map((ver) => (
        <div key={ver.id} className="bg-white border rounded-lg p-4 hover:shadow-sm transition-shadow">
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-0.5 rounded-full">v{ver.version}</span>
                <span className="text-gray-900 font-medium">{new Date(ver.createdAt).toLocaleString()}</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">Edited by: {ver.changedBy}</p>
            </div>
            <button
              onClick={() => handleRevert(ver.version)}
              disabled={!!revertingId}
              className="text-gray-500 hover:text-blue-600 p-1 rounded-full hover:bg-blue-50 transition-colors"
              title="Restore this version"
            >
              <RotateCcw className={`w-5 h-5 ${revertingId === ver.version.toString() ? 'animate-spin' : ''}`} />
            </button>
          </div>
          
          <div className="text-sm border-t pt-2 mt-2">
             <div className="grid grid-cols-1 gap-1">
                {ver.title && <div className="text-gray-800 font-medium">{ver.title}</div>}
                <div className="text-gray-500 line-clamp-2 font-mono bg-gray-50 p-2 rounded text-xs">
                    {ver.content}
                </div>
             </div>
          </div>
        </div>
      ))}
    </div>
  );
}
