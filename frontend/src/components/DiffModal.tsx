import React from 'react';
import { X } from 'lucide-react';
import { DiffViewer } from './DiffViewer';

interface DiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  oldVersion?: { version: number; content: string; createdAt: string };
  newVersion?: { version: number; content: string; createdAt: string };
}

export const DiffModal: React.FC<DiffModalProps> = ({ 
  isOpen, 
  onClose, 
  oldVersion, 
  newVersion 
}) => {
  if (!isOpen || !oldVersion || !newVersion) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <div>
             <h3 className="text-lg font-bold text-gray-900">版本对比</h3>
             <p className="text-sm text-gray-500">
               对比 v{oldVersion.version} 和 v{newVersion.version} 的差异
             </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 bg-gray-50">
           <div className="bg-white border rounded-lg p-4 shadow-sm">
             <DiffViewer 
                oldText={oldVersion.content} 
                newText={newVersion.content} 
                mode="words" 
             />
           </div>
        </div>

        <div className="p-4 border-t bg-gray-50 rounded-b-xl flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-medium"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};
