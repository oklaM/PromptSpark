// React import not needed with automatic JSX runtime

interface PromptDetailProps {
  title: string;
  description: string;
  content: string;
  category: string;
  author: string;
  views: number;
  likes: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  onClose?: () => void;
  onEdit?: () => void;
}

export function PromptDetail({
  title,
  description,
  content,
  category,
  author,
  views,
  likes,
  tags,
  createdAt,
  updatedAt,
  onClose,
  onEdit,
}: PromptDetailProps) {
  const handleCopyContent = () => {
    navigator.clipboard.writeText(content);
    // 可以添加提示
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{title}</h1>
              <p className="text-blue-100 text-lg">{description}</p>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="text-blue-100 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-blue-500 rounded-full text-sm"
              >
                #{tag}
              </span>
            ))}
          </div>

          <div className="flex gap-6 text-sm">
            <span>分类: {category || '未分类'}</span>
            <span>作者: {author}</span>
            <span>创建于: {formatDate(createdAt)}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-gray-50 px-6 py-3 border-b flex gap-8 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
            浏览: {views}
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
            </svg>
            点赞: {likes}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">提示词内容</h2>
            <div className="relative bg-gray-50 rounded-lg p-4 border border-gray-200">
              <pre className="text-sm text-gray-700 font-mono whitespace-pre-wrap break-words">
                {content}
              </pre>
              <button
                onClick={handleCopyContent}
                className="absolute top-2 right-2 p-2 bg-white rounded border border-gray-300 hover:bg-gray-50 text-gray-600 hover:text-gray-900"
                title="复制内容"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>

          {updatedAt && (
            <p className="text-xs text-gray-500">
              最后更新: {formatDate(updatedAt)}
            </p>
          )}
        </div>

        {/* Actions */}
        {onEdit && (
          <div className="bg-gray-50 px-6 py-4 border-t flex gap-3">
            <button
              onClick={onEdit}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              编辑
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
