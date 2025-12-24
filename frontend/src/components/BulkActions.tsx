import React from 'react';
import { promptService } from '../services/promptService';
import { useToast } from '../context/ToastContext';
import { 
  Upload, 
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
  onImported?: () => void;
  onSuccess?: () => void;
}

export function BulkActions({ selectedIds, onCleared, onImported, onSuccess }: BulkActionsProps) {
  const [loading, setLoading] = React.useState(false);
  const { show } = useToast();

  const doAction = async (action: string) => {
    if (selectedIds.length === 0) {
      show('请先选择项目', 'info');
      return;
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
    if (selectedIds.length === 0) {
      show('请先选择项目', 'info');
      return;
    }
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

  const importJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const items = JSON.parse(text);
      await promptService.importPrompts(items);
      show('导入成功', 'success');
      onImported && onImported();
    } catch (err) {
      console.error('Import failed', err);
      show('导入失败: ' + (err instanceof Error ? err.message : '未知错误'), 'error');
    }
  };

  const btnClass = "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border shadow-sm disabled:opacity-50 disabled:cursor-not-allowed";
  const defaultBtn = `${btnClass} bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-blue-600`;
  const deleteBtn = `${btnClass} bg-white border-gray-200 text-red-600 hover:bg-red-50 hover:border-red-200`;
  const primaryBtn = `${btnClass} bg-blue-600 border-blue-600 text-white hover:bg-blue-700`;

  return (
    <div className="flex flex-wrap items-center gap-3 p-1">
      {/* Status Actions */}
      <div className="flex items-center gap-2">
        <button onClick={() => doAction('publish')} disabled={loading} className={defaultBtn} title="发布选中的提示词">
          <Eye className="w-4 h-4" />
          <span className="hidden sm:inline">发布</span>
        </button>
        <button onClick={() => doAction('unpublish')} disabled={loading} className={defaultBtn} title="取消发布选中的提示词">
          <EyeOff className="w-4 h-4" />
          <span className="hidden sm:inline">取消发布</span>
        </button>
      </div>

      <div className="w-px h-6 bg-gray-300 mx-1 hidden sm:block"></div>

      {/* Export Actions */}
      <div className="flex items-center gap-2">
        <button onClick={() => exportSelected('json')} className={defaultBtn} title="导出为 JSON">
          <FileJson className="w-4 h-4" />
          <span className="hidden lg:inline">JSON</span>
        </button>
        <button onClick={() => exportSelected('csv')} className={defaultBtn} title="导出为 CSV">
          <FileType className="w-4 h-4" />
          <span className="hidden lg:inline">CSV</span>
        </button>
        <button onClick={() => exportSelected('md')} className={defaultBtn} title="导出为 Markdown">
          <FileText className="w-4 h-4" />
          <span className="hidden lg:inline">MD</span>
        </button>
      </div>

      <div className="w-px h-6 bg-gray-300 mx-1 hidden sm:block"></div>

      {/* Import & Delete */}
      <div className="flex items-center gap-2">
        <label className={`${primaryBtn} cursor-pointer`}>
          <Upload className="w-4 h-4" />
          <span>导入</span>
          <input type="file" accept="application/json" onChange={importJson} className="hidden" />
        </label>
        
        <button onClick={() => doAction('delete')} disabled={loading} className={deleteBtn} title="删除选中的提示词">
          <Trash2 className="w-4 h-4" />
          <span>删除</span>
        </button>
      </div>
    </div>
  );
}
