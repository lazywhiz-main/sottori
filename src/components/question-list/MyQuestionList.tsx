import QuestionCard from './QuestionCard';

type Question = {
  text: string;
  category: string;
  recommended?: boolean;
};

type Props = {
  questions: Question[];
  onRemove: (q: Question) => void;
};

export default function MyQuestionList({ questions, onRemove }: Props) {
  return (
    <div>
      {questions.map((q, i) => (
        <QuestionCard key={i} text={q.text} category={q.category} recommended={q.recommended} actionType="remove" onRemove={() => onRemove(q)} />
      ))}
    </div>
  );
} 