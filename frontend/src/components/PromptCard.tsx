import React from 'react';
import { Eye, Heart, Copy, Globe, Lock } from 'lucide-react';
import { usePromptStore } from '../stores/promptStore';
import { promptService } from '../services/promptService';

interface PromptCardProps {
  id: string;
  title: string;
  description: string;
  content?: string;
  category: string;
  author: string;
  isPublic?: boolean;
  views: number;
  likes: number;
  tags: string[];
  onClick?: () => void;
  selected?: boolean;
  onSelect?: (id: string, selected: boolean) => void;
  onDuplicate?: (id: string) => void;
}

export function PromptCard({
  id,
  title,
  description,
  content,
  category,
  author,
  isPublic,
  views,
  likes,
  tags,
  onClick,
  selected,
  onSelect,
  onDuplicate,
}: PromptCardProps) {
  const updatePrompt = usePromptStore((state) => state.updatePrompt);
  const [isLiked, setIsLiked] = React.useState(false);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const liked = !isLiked;
      setIsLiked(liked);
      await promptService.toggleLike(id, liked);
      updatePrompt(id, { likes: isLiked ? likes - 1 : likes + 1 });
    } catch (error) {
      setIsLiked(!isLiked);
      console.error('Failed to toggle like:', error);
    }
  };

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onSelect && onSelect(id, (e.target as HTMLInputElement).checked);
  };

  const handleDuplicate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDuplicate) onDuplicate(id);
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow hover:shadow-lg transition-all p-4 cursor-pointer border border-gray-200 hover:border-blue-300 hover:scale-105 transform duration-200 flex flex-col h-full"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 rounded-full">
            {category || 'General'}
          </span>
          {isPublic !== undefined && (
            <span title={isPublic ? "已发布 (公开)" : "未发布 (私有)"} className="text-gray-400">
              {isPublic ? <Globe className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            </span>
          )}
        </div>
        <input
          type="checkbox"
          checked={selected}
          onChange={handleSelect}
          onClick={(e) => e.stopPropagation()}
          className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
        />
      </div>

      <div className="flex-1">
        <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 line-clamp-2 min-h-[2.5rem]">{title}</h3>
        <p className="text-gray-600 text-sm mb-3 line-clamp-2 break-words">{description || content}</p>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
            >
              #{tag}
            </span>
          ))}
          {tags.length > 2 && (
            <span className="text-xs text-gray-500 px-2 py-1">+{tags.length - 2}</span>
          )}
        </div>
      </div>

      <div className="border-t border-gray-100 pt-3 space-y-3 mt-auto">
        <div className="flex items-center justify-between text-xs sm:text-sm">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 transition-colors">
              <Eye className="w-4 h-4" />
              <span>{views}</span>
            </span>
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 transition-colors ${
                isLiked ? 'text-red-500' : 'text-gray-600 hover:text-red-500'
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              <span>{likes}</span>
            </button>
          </div>
          <button
            onClick={handleDuplicate}
            className="flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
          >
            <Copy className="w-4 h-4" />
            <span className="hidden sm:inline">复制</span>
          </button>
        </div>
        <div className="text-xs text-gray-500 truncate">
          by <span className="font-medium text-gray-700">{author}</span>
        </div>
      </div>
    </div>
  );
}
