import { useState, useEffect, useRef } from 'react';
import { aiService } from '../services/aiService';
import { X, Play, Settings, RefreshCw, Layers, Check, Copy, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface PromptPlaygroundProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt: string;
  promptId?: string;
}

export function PromptPlayground({ isOpen, onClose, initialPrompt, promptId }: PromptPlaygroundProps) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [availableModels, setAvailableModels] = useState<Array<{ id: string, name: string, provider: string, color: string }>>([]);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [outputs, setOutputs] = useState<Record<string, string>>({});
  const [runningModels, setRunningModels] = useState<Set<string>>(new Set());
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [config, setConfig] = useState({ temperature: 0.7, maxTokens: 1024 });
  const [showSettings, setShowSettings] = useState(false);
  const [ratings, setRatings] = useState<Record<string, number | null>>({});
  const { show } = useToast();
  
  const outputRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (isOpen) {
      setPrompt(initialPrompt);
      setOutputs({});
      setRatings({});
      aiService.getModels().then(models => {
        setAvailableModels(models);
        if (models.length > 0 && selectedModels.length === 0) {
          setSelectedModels([models[0].id]);
        }
      }).catch(err => console.error('Failed to fetch models', err));
    }
  }, [isOpen, initialPrompt]);

  // Auto-detect variables: {{variable_name}}
  useEffect(() => {
    const regex = /\{\{([^}]+)\}\}/g;
    const matches = Array.from(prompt.matchAll(regex)).map(m => m[1]);
    const uniqueVars = Array.from(new Set(matches));
    
    setVariables(prev => {
      const next: Record<string, string> = {};
      uniqueVars.forEach(v => {
        next[v] = prev[v] || ''; // Preserve existing values
      });
      return next;
    });
  }, [prompt]);

  const toggleModel = (modelId: string) => {
    setSelectedModels(prev => 
      prev.includes(modelId) 
        ? prev.filter(id => id !== modelId) 
        : [...prev, modelId]
    );
  };

  const handleRate = async (modelId: string, score: number) => {
    if (!outputs[modelId]) return;
    
    setRatings(prev => ({ ...prev, [modelId]: score }));

    try {
      let promptToSend = prompt;
      Object.entries(variables).forEach(([key, val]) => {
        promptToSend = promptToSend.replace(new RegExp(`{{${key}}}`, 'g'), val);
      });

      await aiService.logEval({
        promptId: promptId,
        modelId,
        variables,
        content: promptToSend,
        output: outputs[modelId],
        score,
      });
      show('评价已保存', 'success');
    } catch (err) {
      console.error('Failed to log eval', err);
      show('保存评价失败', 'error');
    }
  };

  const handleRun = async () => {
    if (runningModels.size > 0 || selectedModels.length === 0) return;
    
    // Clear previous outputs
    const initialOutputs: Record<string, string> = {};
    selectedModels.forEach(id => initialOutputs[id] = '');
    setOutputs(initialOutputs);
    setRatings({});
    setRunningModels(new Set(selectedModels));

    // Interpolate variables
    let promptToSend = prompt;
    Object.entries(variables).forEach(([key, val]) => {
      promptToSend = promptToSend.replace(new RegExp(`{{${key}}}`, 'g'), val);
    });

    // Run all models in parallel
    selectedModels.forEach(modelId => {
      aiService.runPrompt(
        promptToSend,
        config,
        (text) => {
          setOutputs(prev => ({ ...prev, [modelId]: (prev[modelId] || '') + text }));
          // Auto-scroll
          const el = outputRefs.current[modelId];
          if (el) {
            el.scrollTop = el.scrollHeight;
          }
        },
        () => {
          setRunningModels(prev => {
            const next = new Set(prev);
            next.delete(modelId);
            return next;
          });
        },
        (err) => {
          setOutputs(prev => ({ ...prev, [modelId]: (prev[modelId] || '') + `\n\n[Error: ${err.message}]` }));
          setRunningModels(prev => {
            const next = new Set(prev);
            next.delete(modelId);
            return next;
          });
        },
        modelId
      );
    });
  };

  if (!isOpen) return null;

  const isAnyRunning = runningModels.size > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-800">🚀 Model Arena</h2>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Compare Models</span>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left Column: Input & Config */}
          <div className="w-full lg:w-1/3 flex flex-col border-b lg:border-b-0 lg:border-r border-gray-200 bg-white max-h-[40vh] lg:max-h-full">
            <div className="flex-1 p-4 flex flex-col gap-4 overflow-y-auto">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Prompt Template</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full h-32 lg:h-48 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm resize-none"
                  placeholder="Enter your prompt here. Use {{variable}} for dynamic inputs."
                />
              </div>

              {/* Model Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Select Models to Compare</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
                  {availableModels.length === 0 ? (
                      <p className="text-sm text-gray-500 italic">Loading models...</p>
                  ) : (
                    availableModels.map(m => (
                    <button
                      key={m.id}
                      onClick={() => toggleModel(m.id)}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg border transition-all ${
                        selectedModels.includes(m.id)
                          ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${m.color}`}></div>
                        <span className="text-sm font-medium">{m.name}</span>
                      </div>
                      {selectedModels.includes(m.id) && <Check className="w-4 h-4" />}
                    </button>
                  )))}
                </div>
              </div>

              {/* Variables Section */}
              {Object.keys(variables).length > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <h3 className="text-sm font-bold text-blue-800 mb-3 flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    Test Variables
                  </h3>
                  <div className="space-y-3">
                    {Object.keys(variables).map(v => (
                      <div key={v}>
                        <label className="block text-xs font-medium text-blue-700 mb-1">{v}</label>
                        <input
                          type="text"
                          value={variables[v]}
                          onChange={(e) => setVariables(prev => ({ ...prev, [v]: e.target.value }))}
                          className="w-full px-2 py-1.5 border border-blue-200 rounded text-sm focus:ring-1 focus:ring-blue-500"
                          placeholder={`Value for {{${v}}}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Settings Toggle */}
              <div>
                <button 
                  onClick={() => setShowSettings(!showSettings)}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  <Settings className="w-4 h-4" />
                  {showSettings ? 'Hide Settings' : 'Advanced Settings'}
                </button>
                
                {showSettings && (
                  <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
                    <div>
                      <div className="flex justify-between">
                        <label className="text-xs font-medium text-gray-700">Temperature</label>
                        <span className="text-xs text-gray-500">{config.temperature}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={config.temperature}
                        onChange={(e) => setConfig(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                        className="w-full mt-1"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Max Tokens</label>
                      <input
                        type="number"
                        value={config.maxTokens}
                        onChange={(e) => setConfig(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
                        className="w-full px-2 py-1 border rounded text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Run Bar */}
            <div className="p-4 border-t bg-white">
              <button
                onClick={handleRun}
                disabled={isAnyRunning || selectedModels.length === 0}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 font-bold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAnyRunning ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 fill-current" />
                    Run Comparison
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Comparison View */}
          <div className="flex-1 bg-gray-100 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-x-auto">
              <div className={`h-full flex min-w-full ${selectedModels.length > 1 ? 'w-max lg:w-full' : 'w-full'}`}>
                {selectedModels.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-4 min-h-[300px]">
                    <Layers className="w-16 h-16 opacity-20" />
                    <p>Select at least one model to start the arena</p>
                  </div>
                ) : (
                  selectedModels.map(modelId => {
                    const model = availableModels.find(m => m.id === modelId);
                    const isRunning = runningModels.has(modelId);
                    const rating = ratings[modelId];

                    return (
                      <div 
                        key={modelId} 
                        className={`flex flex-col border-r border-gray-200 last:border-r-0 bg-gray-900 ${
                          selectedModels.length === 1 ? 'w-full' : 'w-[85vw] sm:w-96 lg:flex-1'
                        }`}
                      >
                        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800 bg-gray-800 text-gray-300 text-sm">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${model?.color}`}></div>
                            <span className="font-semibold">{model?.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {outputs[modelId] && !isRunning && (
                                <>
                                  <button 
                                    onClick={() => handleRate(modelId, 1)}
                                    className={`p-1 transition-colors ${rating === 1 ? 'text-green-400' : 'text-gray-500 hover:text-green-400'}`}
                                    title="Good response"
                                  >
                                    <ThumbsUp className={`w-4 h-4 ${rating === 1 ? 'fill-current' : ''}`} />
                                  </button>
                                  <button 
                                    onClick={() => handleRate(modelId, 0)}
                                    className={`p-1 transition-colors ${rating === 0 ? 'text-red-400' : 'text-gray-500 hover:text-red-400'}`}
                                    title="Bad response"
                                  >
                                    <ThumbsDown className={`w-4 h-4 ${rating === 0 ? 'fill-current' : ''}`} />
                                  </button>
                                </>
                            )}
                            {isRunning && <RefreshCw className="w-3 h-3 animate-spin text-blue-400" />}
                            <button 
                              onClick={() => { navigator.clipboard.writeText(outputs[modelId] || ''); }}
                              className="p-1 hover:text-white transition-colors"
                              title="Copy output"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div 
                          ref={el => outputRefs.current[modelId] = el}
                          className="flex-1 p-4 overflow-y-auto font-mono text-sm text-gray-100 whitespace-pre-wrap leading-relaxed custom-scrollbar"
                        >
                          {outputs[modelId] || (
                            <span className="text-gray-600 italic">
                              {isRunning ? 'Generating response...' : 'Ready for execution'}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
