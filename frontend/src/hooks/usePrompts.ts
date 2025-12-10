import { useEffect } from 'react';
import { usePromptStore } from '../stores/promptStore';
import { useFilterStore } from '../stores/filterStore';
import { promptService } from '../services/promptService';

export function usePrompts() {
  const { prompts, setPrompts, setLoading, setError } = usePromptStore();
  const { searchQuery, selectedCategory, selectedTags } = useFilterStore();

  useEffect(() => {
    const loadPrompts = async () => {
      setLoading(true);
      try {
        if (searchQuery) {
          const result = await promptService.searchPrompts(searchQuery, selectedCategory, selectedTags);
          setPrompts(result.data || []);
        } else {
          const result = await promptService.getAllPrompts(1, 20);
          setPrompts(result.data || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load prompts');
      } finally {
        setLoading(false);
      }
    };

    loadPrompts();
  }, [searchQuery, selectedCategory, selectedTags, setPrompts, setLoading, setError]);

  return prompts;
}

export function usePromptDetail(id: string) {
  const { currentPrompt, setCurrentPrompt, setLoading, setError } = usePromptStore();

  useEffect(() => {
    const loadPrompt = async () => {
      setLoading(true);
      try {
        const result = await promptService.getPrompt(id);
        setCurrentPrompt(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load prompt');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadPrompt();
    }
  }, [id, setCurrentPrompt, setLoading, setError]);

  return currentPrompt;
}
