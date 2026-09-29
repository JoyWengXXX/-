import { useState } from "react";
import { playErrorSound, playSuccessSound } from "../../lib/sound";

// 純前端模擬的「書店 API」+ 簡化版 Postman pm.* 測試腳本引擎，不會真的發網路請求
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
  responseTime: number;
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
  const responseTime = Math.round(40 + Math.random() * 160);
  const withTiming = (response: Omit<MockResponse, "responseTime">): MockResponse => ({ ...response, responseTime });

  if (method === "GET" && path === "/books") {
    return { response: withTiming({ status: 200, body: books }), books, nextId };
  }
  if (method === "GET" && idMatch) {
    const book = books.find((b) => b.id === Number(idMatch[1]));
    return {
      response: withTiming(
        book ? { status: 200, body: book } : { status: 404, body: { error: "找不到這本書" } }
      ),
      books,
      nextId,
    };
  }
  if (method === "POST" && path === "/books") {
    try {
      const parsed = JSON.parse(body ?? "{}");
      if (!parsed.title) {
        return { response: withTiming({ status: 400, body: { error: "缺少 title 欄位" } }), books, nextId };
      }
      const newBook: Book = { id: nextId, title: parsed.title, stock: parsed.stock ?? 0 };
      return {
        response: withTiming({ status: 201, body: newBook }),
        books: [...books, newBook],
        nextId: nextId + 1,
      };
    } catch {
      return { response: withTiming({ status: 400, body: { error: "body 不是合法的 JSON" } }), books, nextId };
    }
  }
  if (method === "PUT" && idMatch) {
    const targetId = Number(idMatch[1]);
    const existing = books.find((b) => b.id === targetId);
    if (!existing) {
      return { response: withTiming({ status: 404, body: { error: "找不到這本書" } }), books, nextId };
    }
    try {
      const parsed = JSON.parse(body ?? "{}");
      if (typeof parsed.stock !== "number") {
        return { response: withTiming({ status: 400, body: { error: "缺少 stock 欄位或格式錯誤" } }), books, nextId };
      }
      const updated: Book = { ...existing, stock: parsed.stock };
      const nextBooks = books.map((b) => (b.id === targetId ? updated : b));
      return { response: withTiming({ status: 200, body: updated }), books: nextBooks, nextId };
    } catch {
      return { response: withTiming({ status: 400, body: { error: "body 不是合法的 JSON" } }), books, nextId };
    }
  }
  if (method === "DELETE" && idMatch) {
    const targetId = Number(idMatch[1]);
    const exists = books.some((b) => b.id === targetId);
    if (!exists) {
      return { response: withTiming({ status: 404, body: { error: "找不到這本書" } }), books, nextId };
    }
    return {
      response: withTiming({ status: 200, body: { message: "刪除成功" } }),
      books: books.filter((b) => b.id !== targetId),
      nextId,
    };
  }
  return { response: withTiming({ status: 404, body: { error: "沒有這個路由" } }), books, nextId };
}

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

// 極簡版的 pm.* API + chai 風格斷言，只支援本頁練習需要的幾種寫法
function runTestsScript(script: string, response: MockResponse): { results: TestResult[]; scriptError?: string } {
  const results: TestResult[] = [];

  function expect(actual: unknown) {
    const chain = {
      to: {
        eql(expected: unknown) {
          if (JSON.stringify(actual) !== JSON.stringify(expected)) {
            throw new Error(`預期為 ${JSON.stringify(expected)}，但實際是 ${JSON.stringify(actual)}`);
          }
        },
        equal(expected: unknown) {
          if (actual !== expected) throw new Error(`預期為 ${String(expected)}，但實際是 ${String(actual)}`);
        },
        have: {
          property(prop: string) {
            if (typeof actual !== "object" || actual === null || !(prop in (actual as object))) {
              throw new Error(`預期物件要有屬性 "${prop}"`);
            }
          },
        },
        be: {
          a(type: string) {
            const actualType = Array.isArray(actual) ? "array" : typeof actual;
            if (actualType !== type) throw new Error(`預期型別為 ${type}，但實際是 ${actualType}`);
          },
          below(n: number) {
            if (!(typeof actual === "number" && actual < n)) {
              throw new Error(`預期小於 ${n}，實際是 ${String(actual)}`);
            }
          },
        },
        include(value: unknown) {
          if (Array.isArray(actual)) {
            if (!actual.some((v) => JSON.stringify(v) === JSON.stringify(value))) {
              throw new Error("陣列中找不到指定的值");
            }
          } else if (typeof actual === "string") {
            if (!actual.includes(String(value))) throw new Error("字串中找不到指定內容");
          } else {
            throw new Error("include 只支援陣列或字串");
          }
        },
      },
    };
    return chain;
  }

  const pm = {
    response: {
      code: response.status,
      responseTime: response.responseTime,
      json: () => response.body,
      to: {
        have: {
          status(code: number) {
            if (response.status !== code) {
              throw new Error(`預期狀態碼 ${code}，實際是 ${response.status}`);
            }
          },
        },
      },
    },
    expect,
    test(name: string, fn: () => void) {
      try {
        fn();
        results.push({ name, passed: true });
      } catch (e) {
        results.push({ name, passed: false, error: e instanceof Error ? e.message : String(e) });
      }
    },
  };

  try {
    // 只把 pm 注入到執行環境，讓學習者寫的腳本跟真正的 Postman Tests 分頁語法一致
    const runner = new Function("pm", script);
    runner(pm);
  } catch (e) {
    return { results, scriptError: e instanceof Error ? e.message : String(e) };
  }
  return { results };
}

const requestPresets: { label: string; method: Method; path: string; body?: string }[] = [
  { label: "查全部書籍", method: "GET", path: "{{base_url}}/books" },
  { label: "新增一本書（合法）", method: "POST", path: "{{base_url}}/books", body: '{"title": "深度工作力", "stock": 5}' },
  { label: "新增一本書（缺 title，故意測反向案例）", method: "POST", path: "{{base_url}}/books", body: '{"stock": 5}' },
  { label: "修改庫存", method: "PUT", path: "{{base_url}}/books/1", body: '{"stock": 20}' },
  { label: "刪除一本書", method: "DELETE", path: "{{base_url}}/books/1" },
];

const testPresets: { label: string; script: string }[] = [
  {
    label: "驗證查詢成功（200 + 陣列）",
    script:
      'pm.test("狀態碼應該是 200", function () {\n  pm.response.to.have.status(200);\n});\n\npm.test("回應應該是陣列", function () {\n  pm.expect(pm.response.json()).to.be.a("array");\n});',
  },
  {
    label: "驗證新增成功（201 + 有 id）",
    script:
      'pm.test("狀態碼應該是 201", function () {\n  pm.response.to.have.status(201);\n});\n\npm.test("回應要有 id 欄位", function () {\n  pm.expect(pm.response.json()).to.have.property("id");\n});',
  },
  {
    label: "驗證反向案例（缺欄位應該回 400）",
    script:
      'pm.test("缺少 title 應該回傳 400", function () {\n  pm.response.to.have.status(400);\n});\n\npm.test("錯誤訊息要提到 title", function () {\n  const body = JSON.stringify(pm.response.json());\n  pm.expect(body).to.include("title");\n});',
  },
  {
    label: "驗證回應時間（效能斷言）",
    script:
      'pm.test("回應時間要在合理範圍內", function () {\n  pm.expect(pm.response.responseTime).to.be.below(1000);\n});',
  },
];

export default function PostmanSandbox() {
  const [books, setBooks] = useState<Book[]>(initialBooks);
  const [nextId, setNextId] = useState(initialBooks.length + 1);
  const [baseUrl, setBaseUrl] = useState("");
  const [method, setMethod] = useState<Method>("GET");
  const [path, setPath] = useState("{{base_url}}/books");
  const [body, setBody] = useState("");
  const [testsScript, setTestsScript] = useState(testPresets[0].script);
  const [response, setResponse] = useState<MockResponse | null>(null);
  const [testResults, setTestResults] = useState<TestResult[] | null>(null);
  const [scriptError, setScriptError] = useState<string | null>(null);

  function send() {
    const resolvedPath = path.replaceAll("{{base_url}}", baseUrl);
    const result = performRequest(books, nextId, method, resolvedPath, body);
    setBooks(result.books);
    setNextId(result.nextId);
    setResponse(result.response);

    const testRun = runTestsScript(testsScript, result.response);
    setTestResults(testRun.results);
    setScriptError(testRun.scriptError ?? null);
    const allPassed = !testRun.scriptError && testRun.results.every((r) => r.passed);
    allPassed ? playSuccessSound() : playErrorSound();
  }

  function resetData() {
    setBooks(initialBooks);
    setNextId(initialBooks.length + 1);
    setResponse(null);
    setTestResults(null);
    setScriptError(null);
  }

  return (
    <div className="sandbox postman-sandbox">
      <p className="sandbox-hint">
        這是簡化版的 Postman 練習：Path 支援 <code>{"{{base_url}}"}</code> 這種 Environment 變數，送出請求後會自動執行下面的
        Tests 腳本（跟真正 Postman 的 <code>pm.test</code> / <code>pm.expect</code> 語法一致）。
      </p>
      <div className="sandbox-actions">
        <label htmlFor="postman-base-url">Environment 變數 base_url =</label>
        <input
          id="postman-base-url"
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          placeholder="留空即可，換成 /v2 之類的值試試看"
        />
      </div>
      <div className="preset-list">
        {requestPresets.map((p) => (
          <button
            key={p.label}
            className="secondary"
            onClick={() => {
              setMethod(p.method);
              setPath(p.path);
              setBody(p.body ?? "");
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
        <input value={path} onChange={(e) => setPath(e.target.value)} placeholder="{{base_url}}/books" />
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

      <p className="sandbox-hint">
        <strong>Tests 腳本</strong>（送出請求後自動執行）：
      </p>
      <div className="preset-list">
        {testPresets.map((p) => (
          <button key={p.label} className="secondary" onClick={() => setTestsScript(p.script)}>
            {p.label}
          </button>
        ))}
      </div>
      <textarea
        className="sandbox-textarea"
        rows={8}
        value={testsScript}
        onChange={(e) => setTestsScript(e.target.value)}
        spellCheck={false}
      />

      {response && (
        <>
          <p className="sandbox-hint">
            <strong>Response</strong>：
          </p>
          <div className="api-response">
            <div className={`status-badge status-${Math.floor(response.status / 100)}xx`}>
              Status: {response.status}（{response.responseTime} ms）
            </div>
            <pre>{JSON.stringify(response.body, null, 2)}</pre>
          </div>
        </>
      )}

      {(testResults || scriptError) && (
        <>
          <p className="sandbox-hint">
            <strong>Test Results</strong>：
          </p>
          {scriptError && <div className="sandbox-error">腳本執行錯誤：{scriptError}</div>}
          {testResults && testResults.length > 0 && (
            <ul className="test-results-list">
              {testResults.map((r, i) => (
                <li key={i} className={r.passed ? "test-pass" : "test-fail"}>
                  {r.passed ? "✅" : "❌"} {r.name}
                  {!r.passed && r.error && <div className="test-error">{r.error}</div>}
                </li>
              ))}
            </ul>
          )}
        </>
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
