import { X, Copy } from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface SdkIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  promptId: string;
}

export function SdkIntegrationModal({ isOpen, onClose, promptId }: SdkIntegrationModalProps) {
  const { show } = useToast();

  if (!isOpen) return null;

  const origin = window.location.origin;
  const curlCode = `curl -X GET "${origin}/api/sdk/prompts/${promptId}" \
  -H "Authorization: Bearer <YOUR_API_TOKEN>"`;

  const pythonCode = `import requests

response = requests.get(
    "${origin}/api/sdk/prompts/${promptId}",
    headers={"Authorization": "Bearer <YOUR_API_TOKEN>"}
)
data = response.json()['data']
print(data['content'])`;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    show('Copied to clipboard', 'success');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-4 sm:p-6 overflow-y-auto max-h-[95vh]">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg sm:text-xl font-bold">集成到应用</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X className="w-6 h-6" />
          </button>
        </div>
        <p className="text-xs sm:text-sm text-gray-500 mb-6">
          通过 SDK API 在您的代码中直接调用此提示词。请确保在设置中创建了 API Token。
        </p>

        <div className="mb-4">
          <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">cURL</label>
          <div className="relative group rounded-lg bg-gray-900">
            <div className="p-3 sm:p-4 overflow-x-auto custom-scrollbar">
              <code className="text-xs sm:text-sm text-gray-100 font-mono whitespace-pre">
                {curlCode}
              </code>
            </div>
            <button
              onClick={() => handleCopy(curlCode)}
              className="absolute top-2 right-2 p-1.5 bg-gray-700/50 hover:bg-gray-700 text-gray-400 hover:text-white rounded transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
              title="Copy"
            >
              <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Python</label>
          <div className="relative group rounded-lg bg-gray-900">
            <div className="p-3 sm:p-4 overflow-x-auto custom-scrollbar">
              <code className="text-xs sm:text-sm text-gray-100 font-mono whitespace-pre">
                {pythonCode}
              </code>
            </div>
            <button
              onClick={() => handleCopy(pythonCode)}
              className="absolute top-2 right-2 p-1.5 bg-gray-700/50 hover:bg-gray-700 text-gray-400 hover:text-white rounded transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
              title="Copy"
            >
              <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium text-sm"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
