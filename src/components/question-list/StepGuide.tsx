export default function StepGuide() {
  return (
    <div className="flex items-center gap-0 flex-wrap">
      <div className="bg-gray-100 rounded-md px-3 py-2 flex items-center font-medium text-gray-700 text-xs">
        <span className="bg-deep-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center font-bold mr-2 text-xs">1</span>
        おすすめ質問を確認
      </div>
      <span className="mx-2 text-deep-blue-500 text-lg">→</span>
      <div className="bg-gray-100 rounded-md px-3 py-2 flex items-center font-medium text-gray-700 text-xs">
        <span className="bg-deep-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center font-bold mr-2 text-xs">2</span>
        必要に応じて質問を追加・削除
      </div>
      <span className="mx-2 text-deep-blue-500 text-lg">→</span>
      <div className="bg-gray-100 rounded-md px-3 py-2 flex items-center font-medium text-gray-700 text-xs">
        <span className="bg-deep-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center font-bold mr-2 text-xs">3</span>
        優先順位を調整
      </div>
      <span className="mx-2 text-deep-blue-500 text-lg">→</span>
      <div className="bg-gray-100 rounded-md px-3 py-2 flex items-center font-medium text-gray-700 text-xs">
        <span className="bg-deep-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center font-bold mr-2 text-xs">4</span>
        保存して次へ
      </div>
    </div>
  );
} 