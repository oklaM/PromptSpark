# Bug Fix Verification: DeepSeek API 404 Error

## Issue
Users reported a 404 error when running prompts using DeepSeek models.
The error log indicated the application was trying to access `https://api.deepseek.com/responses`.
This endpoint is related to the OpenAI "Responses" API (experimental) which DeepSeek does not support.

## Root Cause
The `createOpenAI` function from `@ai-sdk/openai` was defaulting to the "Responses" model implementation (likely due to the model name or default SDK behavior). This implementation uses the `/responses` endpoint.
DeepSeek is an OpenAI-compatible provider that supports `/chat/completions` (Chat API) but not `/responses`.

## Fix
1. Modified `backend/src/services/aiService.ts`.
2. Updated `getModel` to explicitly call `.chat()` on the provider instance for DeepSeek.
   - `deepseek.chat(modelName)` forces the use of `OpenAIChatLanguageModel`.
3. Updated `baseURL` to `https://api.deepseek.com/v1` to follow standard OpenAI-compatible API conventions (ensuring the SDK constructs the correct `/v1/chat/completions` URL).

## Verification
- [x] Codebase analysis confirmed `createOpenAI` usage.
- [x] `npm run build` in `backend` passed successfully after changes, confirming type safety of `.chat()` method.
- [x] Verified that `.chat()` maps to `OpenAIChatLanguageModel` which uses `/chat/completions` endpoint.
- [x] Confirmed `https://api.deepseek.com/v1` is a valid base for DeepSeek when using OpenAI clients.

## Status
Fixed.
