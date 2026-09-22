// 學習地圖內容的資料模型

export type Step =
  | { type: "analogy"; title: string; body: string }
  | { type: "concept"; title: string; bullets: string[] }
  | {
      type: "quiz";
      title: string;
      question: string;
      options: string[];
      correctIndex: number;
      explanation: string;
    }
  | { type: "sql-sandbox"; title: string; body: string }
  | { type: "api-sandbox"; title: string; body: string }
  | { type: "linux-sandbox"; title: string; body: string }
  | { type: "docker-visual"; title: string; body: string }
  | { type: "mq-visual"; title: string; body: string }
  | { type: "mq-failure-visual"; title: string; body: string };

export interface Topic {
  id: string;
  title: string;
  stage: number; // 0~4，對應學習地圖的階段分層
  tagline: string; // 節點上顯示的一句話比喻
  notTaught: string[]; // 這個知識點刻意「不教」的範圍
  prerequisites: string[]; // 依賴的前置 topic id
  position: { x: number; y: number };
  steps: Step[];
}
