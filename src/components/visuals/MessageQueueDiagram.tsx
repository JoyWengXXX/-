import { useEffect, useRef, useState } from "react";

// 純視覺化的排隊動畫，模擬 Producer -> Queue -> Consumer 一次處理一個的效果
interface Ticket {
  id: number;
}

const PICKUP_DELAY = 500;
const PROCESS_DELAY = 1500;

export default function MessageQueueDiagram() {
  const [queue, setQueue] = useState<Ticket[]>([]);
  const [processing, setProcessing] = useState<Ticket | null>(null);
  const [done, setDone] = useState<Ticket[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const nextIdRef = useRef(1);

  function enqueue() {
    const id = nextIdRef.current++;
    setQueue((q) => [...q, { id }]);
  }

  function reset() {
    setQueue([]);
    setProcessing(null);
    setDone([]);
    nextIdRef.current = 1;
  }

  // Queue -> Consumer：櫃檯空閒時，過一小段時間就把排最前面的客人叫進去處理
  useEffect(() => {
    if (processing !== null || queue.length === 0) return;
    const timer = setTimeout(() => {
      setQueue((q) => {
        if (q.length === 0) return q;
        const [first, ...rest] = q;
        setProcessing(first);
        return rest;
      });
    }, PICKUP_DELAY);
    return () => clearTimeout(timer);
  }, [queue, processing]);

  // Consumer 處理中 -> 完成
  useEffect(() => {
    if (processing === null) return;
    const timer = setTimeout(() => {
      setDone((d) => [...d, processing]);
      setProcessing(null);
    }, PROCESS_DELAY);
    return () => clearTimeout(timer);
  }, [processing]);

  return (
    <div className="mq-visual">
      <div className="mq-actions">
        <button onClick={enqueue}>客人抽號碼牌（送出新請求）</button>
        <button className="secondary" onClick={reset}>
          重置
        </button>
      </div>

      <div className="mq-lanes">
        <div className="mq-lane">
          <div className="mq-lane-title">🧍 排隊中（Queue）</div>
          <div className="mq-lane-body">
            {queue.length === 0 && <span className="mq-empty">目前沒人排隊</span>}
            {queue.map((t) => (
              <span className="mq-ticket waiting" key={t.id}>
                #{t.id}
              </span>
            ))}
          </div>
        </div>
        <div className="mq-lane">
          <div className="mq-lane-title">🧑‍💼 櫃檯處理中（Consumer）</div>
          <div className="mq-lane-body">
            {processing ? (
              <span className="mq-ticket processing">#{processing.id}</span>
            ) : (
              <span className="mq-empty">櫃檯空閒</span>
            )}
          </div>
        </div>
        <div className="mq-lane">
          <div className="mq-lane-title">✅ 已完成</div>
          <div className="mq-lane-body">
            {done.length === 0 && <span className="mq-empty">還沒有人處理完</span>}
            {done.map((t) => (
              <span className="mq-ticket done" key={t.id}>
                #{t.id}
              </span>
            ))}
          </div>
        </div>
      </div>
      <p className="sandbox-hint">
        連續按幾次「送出新請求」，你會看到號碼牌先在排隊區堆起來，櫃檯還是一次只處理一個——這就是佇列「非同步、依序處理」的效果。
      </p>

      <button className="secondary docker-toggle" onClick={() => setShowComparison((v) => !v)}>
        {showComparison ? "收起比較圖" : "看看「有沒有佇列」差在哪"}
      </button>

      {showComparison && (
        <div className="docker-comparison">
          <div className="docker-comparison-col">
            <h3>❌ 沒有佇列（同步）</h3>
            <p>
              客人一定要站在窗口前，直到櫃檯把他的事情辦完才能走。如果前面的人卡很久，後面所有人都得跟著罰站等待，系統很容易被塞住。
            </p>
          </div>
          <div className="docker-comparison-col">
            <h3>✅ 有佇列（非同步）</h3>
            <p>
              客人抽完號碼牌就可以先去做別的事，系統會照順序在背後慢慢處理，處理完再通知。就算突然湧入一大堆請求，也只是排隊變長，不會整個系統當機。
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
