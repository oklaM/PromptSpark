import React from 'react';
import { promptService } from '../services/promptService';
import { useToast } from '../context/ToastContext';

interface BulkActionsProps {
  selectedIds: string[];
  onCleared?: () => void;
  onImported?: () => void;
}

export function BulkActions({ selectedIds, onCleared, onImported }: BulkActionsProps) {
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
      const data = await promptService.exportPrompts(selectedIds, format);
      if (format === 'json') {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'prompts.json';
        a.click();
      } else {
        const blob = new Blob([data], { type: format === 'csv' ? 'text/csv' : 'text/markdown' });
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

  return (
    <div className="flex items-center gap-2">
      <button onClick={() => doAction('publish')} disabled={loading} className="btn">
        发布
      </button>
      <button onClick={() => doAction('unpublish')} disabled={loading} className="btn">
        取消发布
      </button>
      <button onClick={() => doAction('delete')} disabled={loading} className="btn text-red-600">
        删除
      </button>

      <div className="inline-flex items-center gap-1">
        <button onClick={() => exportSelected('json')} className="btn">导出 JSON</button>
        <button onClick={() => exportSelected('csv')} className="btn">导出 CSV</button>
        <button onClick={() => exportSelected('md')} className="btn">导出 MD</button>
      </div>

      <label className="btn cursor-pointer">
        导入 JSON
        <input type="file" accept="application/json" onChange={importJson} className="hidden" />
      </label>
    </div>
  );
}
