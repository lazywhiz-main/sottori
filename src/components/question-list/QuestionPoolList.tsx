import QuestionCard from './QuestionCard';

type Question = {
  text: string;
  category: string;
};

type Props = {
  questions: Question[];
  onAdd: (q: Question) => void;
};

export default function QuestionPoolList({ questions, onAdd }: Props) {
  return (
    <div>
      {questions.map((q, i) => (
        <QuestionCard key={i} text={q.text} category={q.category} actionType="add" onAdd={() => onAdd(q)} />
      ))}
    </div>
  );
} 