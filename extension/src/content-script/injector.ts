import { SparkPrompt, parseGenerationData, parsePromptsFromHtml, extractLoras, generateUuid } from './parser';

/**
 * Inject "Spark Capture" button into the page
 */
export function injectCaptureButton() {
  // Find all potential generation data containers
  const generationContainers = findGenerationContainers();
  
  generationContainers.forEach((container, index) => {
    // Skip if button is already injected
    if (container.querySelector('.spark-capture-button')) {
      return;
    }
    
    // Create and inject capture button
    const button = createCaptureButton();
    container.appendChild(button);
    
    // Add click event listener
    button.addEventListener('click', () => {
      captureGenerationData(container, index);
    });
  });
}

/**
 * Find generation data containers on the page
 */
function findGenerationContainers(): HTMLElement[] {
  const containers: HTMLElement[] = [];
  
  // Common selectors for generation data containers
  const selectors = [
    '.generation-data',
    '.generation-info',
    '.prompt-container',
    '.metadata-container',
    '[class*="generation"]',
    '[class*="metadata"]',
    '[class*="prompt"]',
    // Specific to Civitai
    '.flex.flex-col.gap-3',
    // Specific to Liblib.art
    '.work-info',
    '.info-panel'
  ];
  
  // Try all selectors
  selectors.forEach(selector => {
    const elements = document.querySelectorAll<HTMLElement>(selector);
    elements.forEach(element => {
      // Check if this element contains generation data
      const text = element.textContent || '';
      if (text.includes('Steps:') || text.includes('Sampler:') || text.includes('CFG scale:') || text.includes('Seed:')) {
        containers.push(element);
      }
    });
  });
  
  // If no containers found, try to find images and their parents
  if (containers.length === 0) {
    const images = document.querySelectorAll<HTMLImageElement>('img');
    images.forEach(image => {
      if (image.src.includes('civitai') || image.src.includes('liblib.art')) {
        const parent = image.parentElement;
        if (parent) {
          containers.push(parent as HTMLElement);
        }
      }
    });
  }
  
  return containers;
}

/**
 * Create the capture button element
 */
function createCaptureButton(): HTMLButtonElement {
  const button = document.createElement('button');
  button.className = 'spark-capture-button bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-sm font-medium shadow-md transition-all duration-200 flex items-center gap-1.5 z-50';
  button.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
    </svg>
    Spark Capture
  `;
  
  // Add custom styles to ensure button is visible
  const style = document.createElement('style');
  style.textContent = `
    .spark-capture-button {
      position: relative;
      margin: 8px 0;
      cursor: pointer;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .spark-capture-button:active {
      transform: scale(0.98);
    }
  `;
  
  if (!document.head.querySelector('style[data-spark-capture]')) {
    style.setAttribute('data-spark-capture', 'true');
    document.head.appendChild(style);
  }
  
  return button;
}

/**
 * Capture generation data from the container
 */
async function captureGenerationData(container: HTMLElement, index: number) {
  try {
    // Get page URL and preview image
    const sourceUrl = window.location.href;
    const previewImageUrl = getPreviewImageUrl(container);
    
    // Parse generation data from container text
    const rawText = container.textContent || '';
    const generationData = parseGenerationData(rawText);
    
    // Parse prompts from HTML
    const { positive, negative } = parsePromptsFromHtml(container);
    
    // Extract LoRAs from positive prompt
    const loras = extractLoras(positive);
    
    // Create complete SparkPrompt object
    const sparkPrompt: SparkPrompt = {
      id: generateUuid(),
      sourceUrl,
      previewImageUrl,
      timestamp: Date.now(),
      positivePrompt: positive,
      negativePrompt: negative,
      sampler: generationData.sampler || 'Unknown',
      model: generationData.model || 'Unknown',
      seed: generationData.seed || '0',
      steps: generationData.steps || 20,
      cfgScale: generationData.cfgScale || 7,
      loras
    };
    
    // Save to Chrome storage
    await saveToStorage(sparkPrompt);
    
    // Show success message
    showNotification('✅ Generation data captured!', 'success');
    
  } catch (error) {
    console.error('Error capturing generation data:', error);
    showNotification('❌ Failed to capture data', 'error');
  }
}

/**
 * Get preview image URL from container
 */
function getPreviewImageUrl(container: HTMLElement): string {
  // Look for images in the container or its parents
  const image = container.querySelector('img');
  if (image) {
    return image.src;
  }
  
  // Look for background images
  const backgroundImage = container.style.backgroundImage;
  if (backgroundImage) {
    const urlMatch = backgroundImage.match(/url\(['"]?([^'"]+)['"]?\)/);
    if (urlMatch) {
      return urlMatch[1];
    }
  }
  
  // Fallback: look for images near the container
  const nearbyImages = container.parentElement?.querySelectorAll('img');
  if (nearbyImages && nearbyImages.length > 0) {
    return nearbyImages[0].src;
  }
  
  return '';
}

/**
 * Save SparkPrompt to Chrome storage
 */
async function saveToStorage(prompt: SparkPrompt): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['sparkPrompts'], (result) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
        return;
      }
      
      const prompts = result.sparkPrompts || [];
      prompts.push(prompt);
      
      chrome.storage.local.set({ sparkPrompts: prompts }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  });
}

/**
 * Show notification to user
 */
function showNotification(message: string, type: 'success' | 'error' | 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `spark-notification fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 transition-all duration-300 transform translate-x-full`;
  
  // Set styles based on type
  if (type === 'success') {
    notification.className += ' bg-green-500 text-white';
  } else if (type === 'error') {
    notification.className += ' bg-red-500 text-white';
  } else {
    notification.className += ' bg-blue-500 text-white';
  }
  
  notification.textContent = message;
  
  // Add to document
  document.body.appendChild(notification);
  
  // Animate in
  setTimeout(() => {
    notification.classList.remove('translate-x-full');
  }, 100);
  
  // Animate out and remove
  setTimeout(() => {
    notification.classList.add('translate-x-full');
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}

// Inject button when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectCaptureButton);
} else {
  injectCaptureButton();
}

// Also inject when new content is added (for single-page apps)
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.addedNodes.length > 0) {
      injectCaptureButton();
    }
  });
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});
