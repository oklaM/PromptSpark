import React, { useMemo } from 'react';
import * as Diff from 'diff';

interface DiffViewerProps {
  oldText: string;
  newText: string;
  mode?: 'chars' | 'words' | 'lines';
  className?: string;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({ 
  oldText, 
  newText, 
  mode = 'words',
  className = '' 
}) => {
  const diff = useMemo(() => {
    if (mode === 'chars') return Diff.diffChars(oldText, newText);
    if (mode === 'words') return Diff.diffWords(oldText, newText);
    return Diff.diffLines(oldText, newText);
  }, [oldText, newText, mode]);

  return (
    <div className={`font-mono text-sm whitespace-pre-wrap ${className}`}>
      {diff.map((part, index) => {
        const color = part.added ? 'bg-green-100 text-green-800' :
                      part.removed ? 'bg-red-100 text-red-800 line-through' : 
                      'text-gray-600';
        
        // Ensure newlines are preserved and visible
        return (
          <span key={index} className={`${color} px-0.5 rounded-sm`}>
            {part.value}
          </span>
        );
      })}
    </div>
  );
};
