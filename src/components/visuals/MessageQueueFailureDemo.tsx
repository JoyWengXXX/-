import { useState } from "react";

// 用固定劇本模擬「Consumer 當機時，佇列如何靠 ACK 機制保證訊息不遺失」
interface ScriptStep {
  log: string;
  location: "queue" | "consumer" | "done";
  consumer: string | null;
  crashed: boolean;
}

const script: ScriptStep[] = [
  {
    log: "佇列裡有一則等待處理的訊息。",
    location: "queue",
    consumer: null,
    crashed: false,
  },
  {
    log: "Consumer A 從佇列取出訊息，開始處理……",
    location: "consumer",
    consumer: "Consumer A",
    crashed: false,
  },
  {
    log: "💥 Consumer A 處理到一半當機了！它還沒來得及跟佇列說「我處理完成了」（沒有送出 ACK）。",
    location: "consumer",
    consumer: "Consumer A",
    crashed: true,
  },
  {
    log: "佇列等不到 ACK，判斷這則訊息沒有被成功處理，於是把它放回佇列，讓別的 Consumer 有機會重新接手。",
    location: "queue",
    consumer: null,
    crashed: false,
  },
  {
    log: "Consumer B（例如重新啟動後的服務）從佇列取出同一則訊息，重新處理一次。",
    location: "consumer",
    consumer: "Consumer B",
    crashed: false,
  },
  {
    log: "Consumer B 處理成功，回覆 ACK。佇列收到 ACK 才會把這則訊息標記完成、真正刪除。",
    location: "done",
    consumer: "Consumer B",
    crashed: false,
  },
];

export default function MessageQueueFailureDemo() {
  const [stepIndex, setStepIndex] = useState(0);
  const current = script[stepIndex];
  const isLast = stepIndex === script.length - 1;

  return (
    <div className="mq-failure-visual">
      <div className="mq-lanes">
        <div className="mq-lane">
          <div className="mq-lane-title">📥 佇列（Queue）</div>
          <div className="mq-lane-body">
            {current.location === "queue" ? (
              <span className="mq-ticket waiting">訂單 #88</span>
            ) : (
              <span className="mq-empty">（空）</span>
            )}
          </div>
        </div>
        <div className="mq-lane">
          <div className="mq-lane-title">
            🧑‍💻 Consumer{current.consumer ? `（${current.consumer}）` : ""}
          </div>
          <div className="mq-lane-body">
            {current.location === "consumer" ? (
              <span className={`mq-ticket ${current.crashed ? "crashed" : "processing"}`}>
                {current.crashed ? "💥 訂單 #88" : "訂單 #88"}
              </span>
            ) : (
              <span className="mq-empty">閒置中</span>
            )}
          </div>
        </div>
        <div className="mq-lane">
          <div className="mq-lane-title">✅ 已完成（收到 ACK）</div>
          <div className="mq-lane-body">
            {current.location === "done" ? (
              <span className="mq-ticket done">訂單 #88</span>
            ) : (
              <span className="mq-empty">還沒有</span>
            )}
          </div>
        </div>
      </div>

      <div className="mq-failure-log">
        {script.slice(0, stepIndex + 1).map((s, i) => (
          <p key={i} className={i === stepIndex ? "mq-failure-log-current" : ""}>
            {i + 1}. {s.log}
          </p>
        ))}
      </div>

      <div className="mq-actions">
        <button
          disabled={isLast}
          onClick={() => setStepIndex((i) => Math.min(i + 1, script.length - 1))}
        >
          {isLast ? "劇本結束" : "下一步"}
        </button>
        <button className="secondary" onClick={() => setStepIndex(0)}>
          重新模擬
        </button>
      </div>
    </div>
  );
}
