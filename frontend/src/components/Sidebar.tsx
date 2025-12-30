import { X } from 'lucide-react';
import { useFilterStore } from '../stores/filterStore';

const CATEGORIES = ['写作', '编程', '分析', '其他'];
const POPULAR_TAGS = ['AI', '创意', '实用', '学习', '工作', '生活'];

interface SidebarProps {
  onMobileClose?: () => void;
}

export function Sidebar({ onMobileClose }: SidebarProps) {
  const selectedCategory = useFilterStore((state) => state.selectedCategory);
  const selectedTags = useFilterStore((state) => state.selectedTags);
  const setSelectedCategory = useFilterStore((state) => state.setSelectedCategory);
  const toggleTag = useFilterStore((state) => state.toggleTag);
  const reset = useFilterStore((state) => state.reset);

  const handleCategorySelect = (cat: string) => {
    setSelectedCategory(cat);
    onMobileClose?.();
  };

  const handleTagToggle = (tag: string) => {
    toggleTag(tag);
    // Tags don't necessarily close the sidebar as user might want to select multiple,
    // but usually on mobile after one click user might expect feedback.
    // Let's keep it open for multiple tag selection.
  };

  return (
    <div className="w-full md:w-64 bg-white rounded-lg shadow-lg md:shadow p-6 h-full md:h-fit sticky top-0 md:top-4 overflow-y-auto">
      <div className="flex justify-between items-center mb-6 md:hidden">
        <h2 className="text-xl font-bold text-gray-900">筛选</h2>
        <button onClick={onMobileClose} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="mb-6">
        <h3 className="font-semibold text-gray-900 mb-3">分类</h3>
        <div className="space-y-2">
          <button
            onClick={() => handleCategorySelect('')}
            className={`block w-full text-left px-3 py-2 rounded transition-colors ${
              selectedCategory === ''
                ? 'bg-blue-100 text-blue-700'
                : 'hover:bg-gray-100'
            }`}
          >
            全部
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategorySelect(cat)}
              className={`block w-full text-left px-3 py-2 rounded transition-colors ${
                selectedCategory === cat
                  ? 'bg-blue-100 text-blue-700'
                  : 'hover:bg-gray-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6 border-t pt-6">
        <h3 className="font-semibold text-gray-900 mb-3">热门标签</h3>
        <div className="flex flex-wrap gap-2">
          {POPULAR_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => handleTagToggle(tag)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                selectedTags.includes(tag)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      {(selectedCategory || selectedTags.length > 0) && (
        <button
          onClick={() => {
            reset();
            onMobileClose?.();
          }}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-medium text-sm"
        >
          清除筛选
        </button>
      )}
    </div>
  );
}
