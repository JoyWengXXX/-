import { useMemo, useState } from "react";
import { playQuizCorrectSound, playQuizWrongSound } from "../lib/sound";

interface QuizProps {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export default function Quiz({ question, options, correctIndex, explanation }: QuizProps) {
  const [selected, setSelected] = useState<number | null>(null);
  // 每次掛載都重新洗牌，避免正確答案位置固定
  const shuffledOptions = useMemo(() => shuffle(options.map((opt, i) => ({ opt, isCorrect: i === correctIndex }))), [options, correctIndex]);

  return (
    <div className="quiz">
      <p className="quiz-question">{question}</p>
      <div className="quiz-options">
        {shuffledOptions.map(({ opt, isCorrect: isCorrectAnswer }, i) => {
          const isSelected = selected === i;
          const isCorrect = selected !== null && isCorrectAnswer;
          const isWrongPick = isSelected && !isCorrectAnswer;
          return (
            <button
              key={opt}
              className={`quiz-option ${isCorrect ? "correct" : ""} ${isWrongPick ? "wrong" : ""}`}
              onClick={() => {
                setSelected(i);
                isCorrectAnswer ? playQuizCorrectSound() : playQuizWrongSound();
              }}
              disabled={selected !== null}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {selected !== null && (
        <div className={`quiz-feedback ${shuffledOptions[selected].isCorrect ? "ok" : "no"}`}>
          {shuffledOptions[selected].isCorrect ? "答對了！" : "再想想～"} {explanation}
        </div>
      )}
    </div>
  );
}
