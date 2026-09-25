import { useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  Handle,
  Position,
  ReactFlowProvider,
} from "reactflow";
import "reactflow/dist/style.css";
import { useNavigate } from "react-router-dom";
import { topics } from "../content/topics";
import "./KnowledgeMap.css";

const stageColors = ["#5b8def", "#5b8def", "#37b874", "#f0973a", "#c94f8c", "#9b59b6"];

function TopicNode({ data }: { data: { title: string; tagline: string; stage: number } }) {
  return (
    <div className="topic-node" style={{ borderColor: stageColors[data.stage] }}>
      <Handle type="target" position={Position.Left} />
      <div className="topic-node-title">{data.title}</div>
      <div className="topic-node-tagline">{data.tagline}</div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

const nodeTypes = { topic: TopicNode };

export default function KnowledgeMap() {
  const navigate = useNavigate();
  const [hoveredStage, setHoveredStage] = useState<number | null>(null);

  const nodes: Node[] = useMemo(
    () =>
      topics.map((t) => ({
        id: t.id,
        type: "topic",
        position: t.position,
        data: { title: t.title, tagline: t.tagline, stage: t.stage },
      })),
    []
  );

  const edges: Edge[] = useMemo(
    () =>
      topics.flatMap((t) =>
        t.prerequisites.map((preId) => ({
          id: `${preId}-${t.id}`,
          source: preId,
          target: t.id,
          animated: true,
          style: { stroke: "#9aa5b1" },
        }))
      ),
    []
  );

  return (
    <div className="map-page">
      <header className="map-header">
        <h1>資訊系統知識學習地圖</h1>
        <p>從左到右、由淺入深。點一個節點開始闖關。</p>
        <div className="stage-legend">
          {["基礎心智模型", "資料怎麼存", "系統怎麼跑", "服務怎麼溝通", "系統怎麼撐大", "QA 專業技能"].map(
            (label, i) => (
              <span
                key={label}
                className="legend-item"
                style={{ borderColor: stageColors[i] }}
                onMouseEnter={() => setHoveredStage(i)}
                onMouseLeave={() => setHoveredStage(null)}
              >
                <span className="legend-dot" style={{ background: stageColors[i] }} />
                {label}
              </span>
            )
          )}
        </div>
      </header>
      <div className="map-canvas">
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodes.map((n) => ({
              ...n,
              style:
                hoveredStage !== null && n.data.stage !== hoveredStage
                  ? { opacity: 0.35 }
                  : undefined,
            }))}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodeClick={(_, node) => navigate(`/topic/${node.id}`)}
            fitView
            proOptions={{ hideAttribution: true }}
          >
            <Background />
            <Controls showInteractive={false} />
            <MiniMap pannable zoomable />
          </ReactFlow>
        </ReactFlowProvider>
      </div>
    </div>
  );
}
