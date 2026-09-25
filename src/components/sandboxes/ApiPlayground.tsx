import { useState } from "react";
import { playErrorSound, playSuccessSound } from "../../lib/sound";

// 純前端模擬的「書店 API」，不會真的發網路請求，但資料真的會被新增/修改/刪除，重新整理才會恢復
type Method = "GET" | "POST" | "PUT" | "DELETE";

interface Book {
  id: number;
  title: string;
  stock: number;
}

const initialBooks: Book[] = [
  { id: 1, title: "三體", stock: 12 },
  { id: 2, title: "原子習慣", stock: 8 },
];

interface MockResponse {
  status: number;
  body: unknown;
}

// 根據 method/path/body 對「資料庫」(books 陣列) 做真正的新增/修改/刪除，回傳回應與更新後的資料
function performRequest(
  books: Book[],
  nextId: number,
  method: Method,
  path: string,
  body: string | undefined
): { response: MockResponse; books: Book[]; nextId: number } {
  const idMatch = path.match(/^\/books\/(\d+)$/);

  if (method === "GET" && path === "/books") {
    return { response: { status: 200, body: books }, books, nextId };
  }
  if (method === "GET" && idMatch) {
    const book = books.find((b) => b.id === Number(idMatch[1]));
    return {
      response: book
        ? { status: 200, body: book }
        : { status: 404, body: { error: "找不到這本書" } },
      books,
      nextId,
    };
  }
  if (method === "POST" && path === "/books") {
    try {
      const parsed = JSON.parse(body ?? "{}");
      if (!parsed.title) {
        return { response: { status: 400, body: { error: "缺少 title 欄位" } }, books, nextId };
      }
      const newBook: Book = { id: nextId, title: parsed.title, stock: parsed.stock ?? 0 };
      return {
        response: { status: 201, body: newBook },
        books: [...books, newBook],
        nextId: nextId + 1,
      };
    } catch {
      return { response: { status: 400, body: { error: "body 不是合法的 JSON" } }, books, nextId };
    }
  }
  if (method === "PUT" && idMatch) {
    const targetId = Number(idMatch[1]);
    const existing = books.find((b) => b.id === targetId);
    if (!existing) {
      return { response: { status: 404, body: { error: "找不到這本書" } }, books, nextId };
    }
    try {
      const parsed = JSON.parse(body ?? "{}");
      if (typeof parsed.stock !== "number") {
        return { response: { status: 400, body: { error: "缺少 stock 欄位或格式錯誤" } }, books, nextId };
      }
      const updated: Book = { ...existing, stock: parsed.stock };
      const nextBooks = books.map((b) => (b.id === targetId ? updated : b));
      return { response: { status: 200, body: updated }, books: nextBooks, nextId };
    } catch {
      return { response: { status: 400, body: { error: "body 不是合法的 JSON" } }, books, nextId };
    }
  }
  if (method === "DELETE" && idMatch) {
    const targetId = Number(idMatch[1]);
    const exists = books.some((b) => b.id === targetId);
    if (!exists) {
      return { response: { status: 404, body: { error: "找不到這本書" } }, books, nextId };
    }
    return {
      response: { status: 200, body: { message: "刪除成功" } },
      books: books.filter((b) => b.id !== targetId),
      nextId,
    };
  }
  return { response: { status: 404, body: { error: "沒有這個路由" } }, books, nextId };
}

const presets: { label: string; method: Method; path: string; body?: string }[] = [
  { label: "查全部書籍", method: "GET", path: "/books" },
  { label: "查單本書（存在）", method: "GET", path: "/books/1" },
  { label: "查單本書（不存在）", method: "GET", path: "/books/999" },
  { label: "新增一本書", method: "POST", path: "/books", body: '{"title": "深度工作力", "stock": 5}' },
  { label: "修改庫存", method: "PUT", path: "/books/1", body: '{"stock": 20}' },
  { label: "刪除一本書", method: "DELETE", path: "/books/1" },
];

export default function ApiPlayground() {
  const [books, setBooks] = useState<Book[]>(initialBooks);
  const [nextId, setNextId] = useState(initialBooks.length + 1);
  const [method, setMethod] = useState<Method>("GET");
  const [path, setPath] = useState("/books");
  const [body, setBody] = useState("");
  const [response, setResponse] = useState<MockResponse | null>(null);

  function apply(m: Method, p: string, b?: string) {
    const result = performRequest(books, nextId, m, p, b);
    setBooks(result.books);
    setNextId(result.nextId);
    setResponse(result.response);
    result.response.status < 400 ? playSuccessSound() : playErrorSound();
  }

  function send() {
    apply(method, path, body);
  }

  function resetData() {
    setBooks(initialBooks);
    setNextId(initialBooks.length + 1);
    setResponse(null);
  }

  return (
    <div className="sandbox api-sandbox">
      <p className="sandbox-hint">
        這是模擬的「書店 API」，不會真的連網路，但新增／修改／刪除是「真的」會改動下面的資料。試著先查全部書籍，操作後再查一次確認結果：
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
              apply(p.method, p.path, p.body);
            }}
          >
            {p.label}
          </button>
        ))}
        <button className="secondary" onClick={resetData}>
          重置資料
        </button>
      </div>
      <div className="api-request-row">
        <select value={method} onChange={(e) => setMethod(e.target.value as Method)}>
          <option>GET</option>
          <option>POST</option>
          <option>PUT</option>
          <option>DELETE</option>
        </select>
        <input value={path} onChange={(e) => setPath(e.target.value)} placeholder="/books" />
        <button onClick={send}>送出請求</button>
      </div>
      {(method === "POST" || method === "PUT") && (
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
      <p className="sandbox-hint">目前資料庫實際狀態：</p>
      <table className="sandbox-table">
        <thead>
          <tr>
            <th>id</th>
            <th>title</th>
            <th>stock</th>
          </tr>
        </thead>
        <tbody>
          {books.map((b) => (
            <tr key={b.id}>
              <td>{b.id}</td>
              <td>{b.title}</td>
              <td>{b.stock}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
