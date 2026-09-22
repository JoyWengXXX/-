import { useState } from "react";

// 純前端模擬的「書店 API」，不會真的發網路請求，只是重現 Request/Response 的樣子
type Method = "GET" | "POST" | "DELETE";

interface Book {
  id: number;
  title: string;
  stock: number;
}

const initialBooks: Book[] = [
  { id: 1, title: "三體", stock: 12 },
  { id: 2, title: "原子習慣", stock: 8 },
];

function mockFetch(
  books: Book[],
  method: Method,
  path: string,
  body?: string
): { status: number; body: unknown } {
  if (method === "GET" && path === "/books") {
    return { status: 200, body: books };
  }
  const idMatch = path.match(/^\/books\/(\d+)$/);
  if (method === "GET" && idMatch) {
    const book = books.find((b) => b.id === Number(idMatch[1]));
    return book ? { status: 200, body: book } : { status: 404, body: { error: "找不到這本書" } };
  }
  if (method === "POST" && path === "/books") {
    try {
      const parsed = JSON.parse(body ?? "{}");
      if (!parsed.title) {
        return { status: 400, body: { error: "缺少 title 欄位" } };
      }
      return { status: 201, body: { id: books.length + 1, title: parsed.title, stock: parsed.stock ?? 0 } };
    } catch {
      return { status: 400, body: { error: "body 不是合法的 JSON" } };
    }
  }
  if (method === "DELETE" && idMatch) {
    const exists = books.some((b) => b.id === Number(idMatch[1]));
    return exists ? { status: 200, body: { message: "刪除成功" } } : { status: 404, body: { error: "找不到這本書" } };
  }
  return { status: 404, body: { error: "沒有這個路由" } };
}

const presets: { label: string; method: Method; path: string; body?: string }[] = [
  { label: "查全部書籍", method: "GET", path: "/books" },
  { label: "查單本書（存在）", method: "GET", path: "/books/1" },
  { label: "查單本書（不存在）", method: "GET", path: "/books/999" },
  { label: "新增一本書", method: "POST", path: "/books", body: '{"title": "深度工作力", "stock": 5}' },
  { label: "刪除一本書", method: "DELETE", path: "/books/1" },
];

export default function ApiPlayground() {
  const [books] = useState<Book[]>(initialBooks);
  const [method, setMethod] = useState<Method>("GET");
  const [path, setPath] = useState("/books");
  const [body, setBody] = useState("");
  const [response, setResponse] = useState<{ status: number; body: unknown } | null>(null);

  function send() {
    setResponse(mockFetch(books, method, path, body));
  }

  return (
    <div className="sandbox api-sandbox">
      <p className="sandbox-hint">
        這是模擬的「書店 API」，不會真的連網路，但請求/回應的樣子跟真實 API 一樣。試試下面幾個情境：
      </p>
      <div className="preset-list">
        {presets.map((p) => (
          <button
            key={p.label}
            className="secondary"
            onClick={() => {
              setMethod(p.method);
              setPath(p.path);
              setBody(p.body ?? "");
              setResponse(mockFetch(books, p.method, p.path, p.body));
            }}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="api-request-row">
        <select value={method} onChange={(e) => setMethod(e.target.value as Method)}>
          <option>GET</option>
          <option>POST</option>
          <option>DELETE</option>
        </select>
        <input value={path} onChange={(e) => setPath(e.target.value)} placeholder="/books" />
        <button onClick={send}>送出請求</button>
      </div>
      {method === "POST" && (
        <textarea
          className="sandbox-textarea"
          rows={3}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder='{"title": "書名", "stock": 5}'
        />
      )}
      {response && (
        <div className="api-response">
          <div className={`status-badge status-${Math.floor(response.status / 100)}xx`}>
            Status: {response.status}
          </div>
          <pre>{JSON.stringify(response.body, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
