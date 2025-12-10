// React import not needed with automatic JSX runtime
import { useFilterStore } from '../stores/filterStore';

const CATEGORIES = ['写作', '编程', '分析', '其他'];
const POPULAR_TAGS = ['AI', '创意', '实用', '学习', '工作', '生活'];

export function Sidebar() {
  const selectedCategory = useFilterStore((state) => state.selectedCategory);
  const selectedTags = useFilterStore((state) => state.selectedTags);
  const setSelectedCategory = useFilterStore((state) => state.setSelectedCategory);
  const toggleTag = useFilterStore((state) => state.toggleTag);
  const reset = useFilterStore((state) => state.reset);

  return (
    <div className="w-64 bg-white rounded-lg shadow p-6 h-fit sticky top-4">
      <div className="mb-6">
        <h3 className="font-semibold text-gray-900 mb-3">分类</h3>
        <div className="space-y-2">
          <button
            onClick={() => setSelectedCategory('')}
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
              onClick={() => setSelectedCategory(cat)}
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
              onClick={() => toggleTag(tag)}
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
          onClick={reset}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-medium text-sm"
        >
          清除筛选
        </button>
      )}
    </div>
  );
}
