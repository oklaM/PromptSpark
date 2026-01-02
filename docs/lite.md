# Chrome Extension Specification (PromptSpark Capture)

## 1. Overview

**PromptSpark Capture** is a Chrome Extension (Manifest V3) acting as the **primary user acquisition channel (Hook)** for the PromptSpark platform.

*   **Role:** Capture high-value generation data (Prompts, Seeds, Models) from AI art platforms and funnel them into the PromptSpark Cloud.
*   **Target Sites:** `civitai.com` (Primary), `liblib.art` (Secondary).
*   **Core Workflow:** 
    1.  User browses images on target sites.
    2.  Click "Spark Capture" button injected by the extension.
    3.  Data is parsed and saved to local storage.
    4.  User opens Popup and clicks **"Sync to Cloud"**.
    5.  Data is uploaded to PromptSpark Web Platform for professional management.

## 2. Tech Stack

*   **Runtime:** Chrome Extension Manifest V3.
*   **Framework:** Vite + React (TypeScript).
*   **Styling:** Tailwind CSS.
*   **State:** React State + Chrome Storage.
*   **Communication:** `axios` for API calls to PromptSpark Backend.

## 3. Data Structures

The extension captures structured data which is stored locally as `SparkPrompt` and then converted to `CreatePromptDTO` during sync.

```typescript
// Local Capture Model
export interface SparkPrompt {
  id: string;             // UUID
  sourceUrl: string;      // URL where captured
  previewImageUrl: string;
  timestamp: number;
  
  // Parsed Parameters
  positivePrompt: string;
  negativePrompt: string;
  
  // Structured Metadata (The Value Prop)
  sampler: string;        // e.g., "DPM++ 2M Karras"
  model: string;          // e.g., "ChilloutMix_v1"
  seed: string;
  steps: number;
  cfgScale: number;
  loras: Array<{ name: string; weight: number }>;
}
```

## 4. Key Modules

### A. Parser & Injector (`content-script/`)
*   **Injector:** Automatically detects image generation parameter blocks on Civitai/Liblib DOM. Injects the "Spark Capture" button.
*   **Parser:** Uses Regex to extract key-value pairs (`Steps: 20`, `Model: ...`) and LoRA tags (`<lora:name:1.0>`) from the text content.

### B. Popup & Sync (`App.tsx`)
*   **Dual View:** Displays locally captured prompts waiting for sync.
*   **Auth Integration:** Reads JWT token from `chrome.storage` (set manually or via cookie sharing).
*   **Sync Logic:**
    *   Endpoint: `POST /api/prompts/sync`
    *   Payload: Array of `SparkPrompt` objects.
    *   Action: On success, clears local storage and notifies user.

## 5. User Flow

1.  **Install:** User installs extension.
2.  **Browse:** User visits Civitai.
3.  **Capture:** User sees a prompt they like, clicks "Spark Capture".
4.  **Notify:** "✅ Captured!" toast appears.
5.  **Sync:** User opens extension popup, sees "3 items waiting". Clicks "Sync to Cloud".
6.  **Value:** User logs into PromptSpark Web, sees the prompts with **full structured metadata panels**, ready for AI optimization or editing.