import React from 'react';
import { promptService } from '../services/promptService';
import { useToast } from '../context/ToastContext';
import { 
  Trash2, 
  Eye, 
  EyeOff, 
  FileJson, 
  FileType, 
  FileText 
} from 'lucide-react';

interface BulkActionsProps {
  selectedIds: string[];
  onCleared?: () => void;
  onSuccess?: () => void;
}

export function BulkActions({ selectedIds, onCleared, onSuccess }: BulkActionsProps) {
  const [loading, setLoading] = React.useState(false);
  const { show } = useToast();

  const doAction = async (action: string) => {
    if (selectedIds.length === 0) return;

    if (action === 'delete') {
      const confirmed = window.confirm(`确定要删除选中的 ${selectedIds.length} 个提示词吗？此操作不可撤销。`);
      if (!confirmed) return;
    }

    setLoading(true);
    try {
      await promptService.bulkAction(action, selectedIds);
      show('操作成功', 'success');
      onCleared && onCleared();
      onSuccess && onSuccess();
    } catch (err) {
      console.error('Bulk action failed', err);
      show('操作失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const exportSelected = async (format: 'json' | 'csv' | 'md') => {
    if (selectedIds.length === 0) return;
    try {
      const response = await promptService.exportPrompts(selectedIds, format);
      if (format === 'json') {
        const jsonData = response.data && Array.isArray(response.data) ? response.data : response;
        const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'prompts.json';
        a.click();
      } else {
        const blob = new Blob([response], { type: format === 'csv' ? 'text/csv' : 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `prompts.${format === 'csv' ? 'csv' : 'md'}`;
        a.click();
      }
      show('导出成功', 'success');
    } catch (err) {
      console.error('Export failed', err);
      show('导出失败', 'error');
    }
  };

  const btnClass = "flex items-center gap-2 px-3 py-2 md:px-4 md:py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all disabled:opacity-50 active:scale-95 whitespace-nowrap";
  const actionBtn = `${btnClass} text-gray-300 hover:text-white hover:bg-white/10`;
  const deleteBtn = `${btnClass} text-red-400 hover:text-white hover:bg-red-500/40 border border-transparent hover:border-red-500/50`;
  const primaryBtn = `${btnClass} bg-blue-600 text-white hover:bg-blue-500 shadow-xl shadow-blue-900/40 hover:scale-[1.02]`;

  return (
    <div className="flex items-center gap-2 md:gap-6 px-1 md:px-2">
      {/* Left: Status & Count */}
      <div className="flex items-center gap-3 md:gap-5 pr-2 md:pr-6 border-r border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <span className="w-6 h-6 md:w-7 md:h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px] md:text-xs font-black shadow-lg shadow-blue-600/30">
              {selectedIds.length}
            </span>
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]"></span>
          </div>
          <span className="text-white text-xs md:text-sm font-black hidden sm:inline">已选中项目</span>
        </div>
        <button 
          onClick={onCleared} 
          className="text-gray-400 hover:text-blue-400 text-[10px] md:text-xs font-bold uppercase tracking-widest transition-colors"
        >
          取消
        </button>
      </div>

      {/* Center: Main Actions */}
      <div className="flex items-center gap-1.5 md:gap-3">
        <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-2xl border border-white/10">
          <button onClick={() => doAction('publish')} disabled={loading} className={primaryBtn}>
            <Eye className="w-4 h-4 md:w-5 md:h-5" />
            <span className="hidden xs:inline">批量发布</span>
          </button>
          <button onClick={() => doAction('unpublish')} disabled={loading} className={actionBtn}>
            <EyeOff className="w-4 h-4 md:w-5 md:h-5" />
            <span className="hidden lg:inline">下架</span>
          </button>
        </div>

        {/* Export Group */}
        <div className="flex items-center bg-white/5 p-1 rounded-2xl border border-white/10 gap-1">
          <button onClick={() => exportSelected('json')} className={actionBtn} title="JSON 格式">
            <FileJson className="w-4 h-4 md:w-5 md:h-5" />
            <span className="hidden xl:inline">JSON</span>
          </button>
          <button onClick={() => exportSelected('csv')} className={actionBtn} title="CSV 格式">
            <FileType className="w-4 h-4 md:w-5 md:h-5" />
            <span className="hidden xl:inline">CSV</span>
          </button>
          <button onClick={() => exportSelected('md')} className={actionBtn} title="Markdown 格式">
            <FileText className="w-4 h-4 md:w-5 md:h-5" />
            <span className="hidden xl:inline">MD</span>
          </button>
        </div>
      </div>

      {/* Right: Danger Zone */}
      <div className="pl-2 md:pl-6 border-l border-white/10">
        <button onClick={() => doAction('delete')} disabled={loading} className={deleteBtn}>
          <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
          <span className="hidden md:inline text-white">彻底删除</span>
        </button>
      </div>
    </div>
  );
}
