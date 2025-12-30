// React import not needed with automatic JSX runtime
import { useFilterStore } from '../stores/filterStore';

interface SearchBarProps {
  renderFilterButton?: React.ReactNode;
}

export function SearchBar({ renderFilterButton }: SearchBarProps) {
  const searchQuery = useFilterStore((state) => state.searchQuery);
  const setSearchQuery = useFilterStore((state) => state.setSearchQuery);

  return (
    <div className="w-full">
      <div className="relative">
        <svg
          className="absolute left-3 top-3 w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          placeholder="搜索提示词..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`w-full pl-10 ${renderFilterButton ? 'pr-12' : 'pr-4'} py-2.5 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white`}
        />
        {renderFilterButton && (
          <div className="absolute right-1 top-1 bottom-1 flex items-center">
            {renderFilterButton}
          </div>
        )}
      </div>
    </div>
  );
}
