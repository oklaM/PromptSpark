import React from 'react';
import { usePromptStore } from '../stores/promptStore';
import { promptService } from '../services/promptService';

interface PromptCardProps {
  id: string;
  title: string;
  description: string;
  category: string;
  author: string;
  views: number;
  likes: number;
  tags: string[];
  onClick?: () => void;
}

export function PromptCard({
  id,
  title,
  description,
  category,
  author,
  views,
  likes,
  tags,
  onClick,
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

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-4 cursor-pointer border border-gray-200"
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold text-gray-900 flex-1 line-clamp-2">{title}</h3>
        <span className="ml-2 px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded">
          {category || 'General'}
        </span>
      </div>

      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{description}</p>

      <div className="flex flex-wrap gap-1 mb-3">
        {tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700"
          >
            #{tag}
          </span>
        ))}
        {tags.length > 3 && (
          <span className="text-xs text-gray-500">+{tags.length - 3}</span>
        )}
      </div>

      <div className="flex items-center justify-between text-sm text-gray-500 border-t pt-3">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
            {views}
          </span>
          <button
            onClick={handleLike}
            className={`flex items-center gap-1 transition-colors ${
              isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
            }`}
          >
            <svg className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} viewBox="0 0 20 20">
              <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
            </svg>
            {likes}
          </button>
        </div>
        <span className="text-xs">by {author}</span>
      </div>
    </div>
  );
}
