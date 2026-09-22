import { useState } from "react";

// 純視覺化元件，點方塊看說明，不涉及真實 Docker 操作
type StageKey = "dockerfile" | "image" | "container";

const stages: { key: StageKey; icon: string; label: string; desc: string }[] = [
  {
    key: "dockerfile",
    icon: "📄",
    label: "Dockerfile",
    desc: "施工說明書：寫著「要用什麼基礎環境、要裝哪些套件、怎麼啟動」。這份說明書本身不是房間，只是文字檔。",
  },
  {
    key: "image",
    icon: "🧱",
    label: "Image",
    desc: "設計圖：docker build 依照 Dockerfile 蓋出來的藍圖。藍圖不會自己動，也不會被住進去，只是「還沒蓋出來的房間長什麼樣」。",
  },
  {
    key: "container",
    icon: "📦",
    label: "Container",
    desc: "真實的房間：docker run 依照同一張藍圖蓋出來、正在運作的實體。同一張 Image 可以蓋出好幾個一模一樣的 Container。",
  },
];

export default function DockerDiagram() {
  const [selected, setSelected] = useState<StageKey>("dockerfile");
  const [showComparison, setShowComparison] = useState(false);
  const activeStage = stages.find((s) => s.key === selected)!;

  return (
    <div className="docker-visual">
      <div className="docker-flow">
        {stages.map((stage, i) => (
          <div key={stage.key} className="docker-flow-item">
            <button
              className={`docker-box ${selected === stage.key ? "active" : ""}`}
              onClick={() => setSelected(stage.key)}
            >
              <span className="docker-box-icon">{stage.icon}</span>
              <span className="docker-box-label">{stage.label}</span>
            </button>
            {i < stages.length - 1 && (
              <span className="docker-arrow">
                {i === 0 ? "docker build →" : "docker run →"}
              </span>
            )}
          </div>
        ))}
      </div>
      <div className="docker-desc">{activeStage.desc}</div>

      <button className="secondary docker-toggle" onClick={() => setShowComparison((v) => !v)}>
        {showComparison ? "收起比較圖" : "看看「有沒有 Docker」差在哪"}
      </button>

      {showComparison && (
        <div className="docker-comparison">
          <div className="docker-comparison-col">
            <h3>❌ 沒有 Docker</h3>
            <div className="docker-machine-row">
              <div className="docker-machine">💻 工程師 A 電腦</div>
              <div className="docker-machine">💻 工程師 B 電腦</div>
              <div className="docker-machine">🖥️ 正式主機</div>
            </div>
            <p>每台電腦裝的套件版本、設定都可能不一樣，容易出現「在我電腦可以跑，換一台就壞掉」。</p>
          </div>
          <div className="docker-comparison-col">
            <h3>✅ 有 Docker</h3>
            <div className="docker-machine-row">
              <div className="docker-machine same">📦 Container</div>
              <div className="docker-machine same">📦 Container</div>
              <div className="docker-machine same">📦 Container</div>
            </div>
            <p>大家都用同一個 Image 蓋出 Container，裡面的環境保證一模一樣，換到哪台電腦都長得一樣。</p>
          </div>
        </div>
      )}
    </div>
  );
}
