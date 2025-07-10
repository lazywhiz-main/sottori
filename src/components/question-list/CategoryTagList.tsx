type Props = {
  categories: string[];
  selected: string;
  onSelect: (cat: string) => void;
};

export default function CategoryTagList({ categories, selected, onSelect }: Props) {
  return (
    <div className="flex gap-2 mb-4 flex-wrap">
      {categories.map((cat) => (
        <button
          key={cat}
          className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all duration-150 ${
            selected === cat 
              ? 'bg-deep-blue-500 text-white border-deep-blue-500 shadow-sm' 
              : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-deep-blue-50 hover:text-deep-blue-700 hover:border-deep-blue-200'
          }`}
          onClick={() => onSelect(cat)}
        >
          {cat}
        </button>
      ))}
    </div>
  );
} 