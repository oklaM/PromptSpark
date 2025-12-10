import { create } from 'zustand';

interface FilterStore {
  searchQuery: string;
  selectedCategory: string;
  selectedTags: string[];
  sortBy: 'recent' | 'popular' | 'mostLiked';

  // Actions
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string) => void;
  toggleTag: (tag: string) => void;
  clearTags: () => void;
  setSortBy: (sort: 'recent' | 'popular' | 'mostLiked') => void;
  reset: () => void;
}

const initialState = {
  searchQuery: '',
  selectedCategory: '',
  selectedTags: [],
  sortBy: 'recent' as const,
};

export const useFilterStore = create<FilterStore>((set) => ({
  ...initialState,

  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  toggleTag: (tag) =>
    set((state) => ({
      selectedTags: state.selectedTags.includes(tag)
        ? state.selectedTags.filter((t) => t !== tag)
        : [...state.selectedTags, tag],
    })),
  clearTags: () => set({ selectedTags: [] }),
  setSortBy: (sort) => set({ sortBy: sort }),
  reset: () => set(initialState),
}));
