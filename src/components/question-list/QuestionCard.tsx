type Props = {
  text: string;
  category: string;
  recommended?: boolean;
  actionType: 'add' | 'remove';
  onAdd?: () => void;
  onRemove?: () => void;
};

export default function QuestionCard({ text, category, recommended, actionType, onAdd, onRemove }: Props) {
  return (
    <div className="relative bg-white border border-gray-200 rounded-lg px-4 py-3 mb-3 shadow-sm hover:shadow-md transition-all duration-150 flex flex-col gap-2">
      {recommended && (
        <span className="absolute -top-2 -left-2 bg-sage-green-500 text-white px-2 py-0.5 rounded-full text-xs font-bold shadow-sm">おすすめ</span>
      )}
      <div className="text-sm text-gray-900 leading-relaxed">{text}</div>
      <div className="flex items-center gap-2 text-xs">
        <span className="bg-deep-blue-100 text-deep-blue-700 px-2 py-0.5 rounded font-medium">{category}</span>
        {actionType === 'add' ? (
          <button 
            className="ml-auto bg-deep-blue-500 text-white px-3 py-1 rounded font-medium text-xs hover:bg-deep-blue-600 transition-colors duration-150" 
            onClick={onAdd}
          >
            追加
          </button>
        ) : (
          <button 
            className="ml-auto bg-red-50 text-red-600 border border-red-200 px-3 py-1 rounded font-medium text-xs hover:bg-red-100 transition-colors duration-150" 
            onClick={onRemove}
          >
            削除
          </button>
        )}
      </div>
    </div>
  );
} 