import { useParams, Link, useNavigate } from "react-router-dom";
import { getTopic, topics } from "../content/topics";
import Quiz from "./Quiz";
import SqlSandbox from "./sandboxes/SqlSandbox";
import ApiPlayground from "./sandboxes/ApiPlayground";
import LinuxSandbox from "./sandboxes/LinuxSandbox";
import DockerDiagram from "./visuals/DockerDiagram";
import MessageQueueDiagram from "./visuals/MessageQueueDiagram";
import MessageQueueFailureDemo from "./visuals/MessageQueueFailureDemo";
import "./TopicDetail.css";

export default function TopicDetail() {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const topic = topicId ? getTopic(topicId) : undefined;

  if (!topic) {
    return (
      <div className="topic-detail">
        <p>找不到這個知識點。</p>
        <Link to="/">回地圖</Link>
      </div>
    );
  }

  const prereqTitles = topic.prerequisites.map((id) => getTopic(id)?.title ?? id);
  const currentIndex = topics.findIndex((t) => t.id === topic.id);
  const next = topics[currentIndex + 1];

  return (
    <div className="topic-detail">
      <div className="topic-detail-header">
        <button className="back-link" onClick={() => navigate("/")}>
          ← 回地圖
        </button>
        <h1>{topic.title}</h1>
        <p className="topic-tagline">{topic.tagline}</p>
        {prereqTitles.length > 0 && (
          <p className="topic-prereq">建議先了解：{prereqTitles.join("、")}</p>
        )}
      </div>

      <div className="topic-steps" key={topic.id}>
        {topic.steps.map((step, i) => (
          <section className="step-card" key={i}>
            <h2>{step.title}</h2>
            {step.type === "analogy" && <p>{step.body}</p>}
            {step.type === "concept" && (
              <ul>
                {step.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            )}
            {step.type === "quiz" && (
              <Quiz
                question={step.question}
                options={step.options}
                correctIndex={step.correctIndex}
                explanation={step.explanation}
              />
            )}
            {step.type === "sql-sandbox" && (
              <>
                <p>{step.body}</p>
                <SqlSandbox />
              </>
            )}
            {step.type === "api-sandbox" && (
              <>
                <p>{step.body}</p>
                <ApiPlayground />
              </>
            )}
            {step.type === "linux-sandbox" && (
              <>
                <p>{step.body}</p>
                <LinuxSandbox />
              </>
            )}
            {step.type === "docker-visual" && (
              <>
                <p>{step.body}</p>
                <DockerDiagram />
              </>
            )}
            {step.type === "mq-visual" && (
              <>
                <p>{step.body}</p>
                <MessageQueueDiagram />
              </>
            )}
            {step.type === "mq-failure-visual" && (
              <>
                <p>{step.body}</p>
                <MessageQueueFailureDemo />
              </>
            )}
          </section>
        ))}

        <section className="step-card not-taught">
          <h2>這個知識點刻意不教</h2>
          <ul>
            {topic.notTaught.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
          <p className="not-taught-note">先求有概念，之後有需要再深入也不遲。</p>
        </section>
      </div>

      <div className="topic-detail-footer">
        {next ? (
          <button onClick={() => navigate(`/topic/${next.id}`)}>下一站：{next.title} →</button>
        ) : (
          <button onClick={() => navigate("/")}>完成！回地圖看全貌</button>
        )}
      </div>
    </div>
  );
}
