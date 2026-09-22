import { Routes, Route } from "react-router-dom";
import KnowledgeMap from "./components/KnowledgeMap";
import TopicDetail from "./components/TopicDetail";

function App() {
  return (
    <Routes>
      <Route path="/" element={<KnowledgeMap />} />
      <Route path="/topic/:topicId" element={<TopicDetail />} />
    </Routes>
  );
}

export default App

