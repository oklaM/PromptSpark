import { describe, it, expect } from 'vitest';
import { parseGenerationData, extractLoras, parsePromptsFromHtml } from '../parser';

describe('Parser Logic', () => {
  describe('parseGenerationData', () => {
    it('should correctly parse standard SD parameters', () => {
      const rawText = "Steps: 20, Sampler: DPM++ 2M Karras, CFG scale: 7, Seed: 123456789, Size: 512x768, Model: chilloutmix_NiPrunedFp32Fix";
      const result = parseGenerationData(rawText);
      
      expect(result.steps).toBe(20);
      expect(result.sampler).toBe('DPM++ 2M Karras');
      expect(result.cfgScale).toBe(7);
      expect(result.seed).toBe('123456789');
      expect(result.model).toBe('chilloutmix_NiPrunedFp32Fix');
    });

    it('should handle missing parameters gracefully', () => {
      const rawText = "Steps: 30, Seed: 999";
      const result = parseGenerationData(rawText);
      
      expect(result.steps).toBe(30);
      expect(result.seed).toBe('999');
      expect(result.sampler).toBeUndefined();
    });
  });

  describe('extractLoras', () => {
    it('should extract single LoRA tag', () => {
      const prompt = "a beautiful landscape <lora:epi_noise_offset:0.8>";
      const result = extractLoras(prompt);
      
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ name: 'epi_noise_offset', weight: 0.8 });
    });

    it('should extract multiple LoRA tags', () => {
      const prompt = "girl, <lora:add_detail:1.2>, <lora:korean_style:0.5>";
      const result = extractLoras(prompt);
      
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('add_detail');
      expect(result[1].name).toBe('korean_style');
    });
  });

  describe('parsePromptsFromHtml', () => {
    it('should parse positive and negative prompts from standard containers', () => {
      document.body.innerHTML = `
        <div class="prompt-container">
          <p>Positive prompt: high quality, masterpiece</p>
          <p>Negative prompt: low quality, blurry</p>
        </div>
      `;
      const container = document.querySelector('.prompt-container') as HTMLElement;
      const result = parsePromptsFromHtml(container);
      
      expect(result.positive).toBe('high quality, masterpiece');
      expect(result.negative).toBe('low quality, blurry');
    });

    it('should fallback to text content if no labels found', () => {
      document.body.innerHTML = `
        <div class="prompt-container">
          Just a simple prompt without labels
        </div>
      `;
      const container = document.querySelector('.prompt-container') as HTMLElement;
      const result = parsePromptsFromHtml(container);
      
      expect(result.positive).toBe('Just a simple prompt without labels');
      expect(result.negative).toBe('');
    });
  });
});
