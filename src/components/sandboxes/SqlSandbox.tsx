import { useEffect, useRef, useState } from "react";
import initSqlJs, { type Database } from "sql.js";
import sqlWasmUrl from "sql.js/dist/sql-wasm.wasm?url";
import { playErrorSound, playSuccessSound } from "../../lib/sound";

interface ScenarioPreset {
  label: string;
  sql: string;
}

interface Scenario {
  id: string;
  label: string;
  description: string;
  seedSql: string;
  defaultQuery: string;
  presets: ScenarioPreset[];
}

const scenarios: Scenario[] = [
  {
    id: "bookstore",
    label: "情境一：書店庫存",
    description: "一個「線上書店」的 books 表格，練習最基本的查詢與排序。",
    seedSql: `
CREATE TABLE books (
  id INTEGER PRIMARY KEY,
  title TEXT,
  author TEXT,
  stock INTEGER
);
INSERT INTO books (title, author, stock) VALUES
  ('三體', '劉慈欣', 12),
  ('人類大歷史', '哈拉瑞', 30),
  ('原子習慣', '詹姆斯克利爾', 8),
  ('被討厭的勇氣', '岸見一郎', 21);
`,
    defaultQuery: "SELECT * FROM books;",
    presets: [
      { label: "庫存最多的書", sql: "SELECT title, stock FROM books ORDER BY stock DESC LIMIT 1;" },
      { label: "庫存低於 10 本（需要補貨）", sql: "SELECT * FROM books WHERE stock < 10;" },
      { label: "依庫存由少到多排序", sql: "SELECT title, stock FROM books ORDER BY stock ASC;" },
    ],
  },
  {
    id: "orders",
    label: "情境二：訂單與客戶（JOIN）",
    description: "兩張互相關聯的表格：customers（客戶）與 orders（訂單），練習跨表查詢。",
    seedSql: `
CREATE TABLE customers (
  id INTEGER PRIMARY KEY,
  name TEXT
);
CREATE TABLE orders (
  id INTEGER PRIMARY KEY,
  customer_id INTEGER,
  book_title TEXT,
  amount INTEGER,
  status TEXT
);
INSERT INTO customers (name) VALUES ('王小明'), ('林小美'), ('陳大文');
INSERT INTO orders (customer_id, book_title, amount, status) VALUES
  (1, '三體', 2, '已出貨'),
  (2, '原子習慣', 1, '處理中'),
  (1, '人類大歷史', 1, '已出貨'),
  (3, '被討厭的勇氣', 3, '已取消');
`,
    defaultQuery: "SELECT * FROM orders;",
    presets: [
      {
        label: "查每筆訂單是哪位客戶下的（JOIN）",
        sql: "SELECT customers.name, orders.book_title, orders.status\nFROM orders\nJOIN customers ON orders.customer_id = customers.id;",
      },
      { label: "只找『已取消』的訂單", sql: "SELECT * FROM orders WHERE status = '已取消';" },
      {
        label: "統計每位客戶下了幾張訂單",
        sql: "SELECT customers.name, COUNT(*) AS order_count\nFROM orders\nJOIN customers ON orders.customer_id = customers.id\nGROUP BY customers.name;",
      },
    ],
  },
  {
    id: "edge-cases",
    label: "情境三：邊界值與 NULL（QA 視角）",
    description: "members 表格故意放了 NULL、重複資料、邊界年齡，練習用 QA 的角度找資料異常。",
    seedSql: `
CREATE TABLE members (
  id INTEGER PRIMARY KEY,
  name TEXT,
  age INTEGER,
  email TEXT
);
INSERT INTO members (name, age, email) VALUES
  ('測試帳號A', 17, 'a@test.com'),
  ('測試帳號B', 18, NULL),
  ('測試帳號C', 65, 'c@test.com'),
  ('測試帳號C', 66, 'd@test.com'),
  ('測試帳號E', 0, 'e@test.com');
`,
    defaultQuery: "SELECT * FROM members;",
    presets: [
      { label: "找出 email 是 NULL 的帳號（資料缺漏）", sql: "SELECT * FROM members WHERE email IS NULL;" },
      {
        label: "邊界值：年齡剛好等於 18 或 65（規則邊界最容易出 bug）",
        sql: "SELECT * FROM members WHERE age = 18 OR age = 65;",
      },
      {
        label: "找出名字重複的帳號（資料重複也是常見缺陷）",
        sql: "SELECT name, COUNT(*) AS cnt FROM members GROUP BY name HAVING COUNT(*) > 1;",
      },
    ],
  },
];

interface QueryResult {
  columns: string[];
  values: unknown[][];
}

export default function SqlSandbox() {
  const dbRef = useRef<Database | null>(null);
  const sqlModuleRef = useRef<Awaited<ReturnType<typeof initSqlJs>> | null>(null);
  const [ready, setReady] = useState(false);
  const [scenarioId, setScenarioId] = useState(scenarios[0].id);
  const [sql, setSql] = useState(scenarios[0].defaultQuery);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const scenario = scenarios.find((s) => s.id === scenarioId) ?? scenarios[0];

  useEffect(() => {
    let cancelled = false;
    initSqlJs({ locateFile: () => sqlWasmUrl }).then((SQL) => {
      if (cancelled) return;
      sqlModuleRef.current = SQL;
      const db = new SQL.Database();
      db.run(scenario.seedSql);
      dbRef.current = db;
      setReady(true);
      runQuery(db, scenario.defaultQuery);
    });
    return () => {
      cancelled = true;
      dbRef.current?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function runQuery(db: Database, query: string, withSound = false) {
    try {
      const res = db.exec(query);
      setError(null);
      setResult(res[0] ? { columns: res[0].columns, values: res[0].values } : { columns: [], values: [] });
      if (withSound) playSuccessSound();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setResult(null);
      if (withSound) playErrorSound();
    }
  }

  function loadScenario(next: Scenario) {
    const SQL = sqlModuleRef.current;
    if (!SQL) return;
    dbRef.current?.close();
    const db = new SQL.Database();
    db.run(next.seedSql);
    dbRef.current = db;
    setScenarioId(next.id);
    setSql(next.defaultQuery);
    runQuery(db, next.defaultQuery);
  }

  function resetDatabase() {
    loadScenario(scenario);
  }

  return (
    <div className="sandbox sql-sandbox">
      <p className="sandbox-hint">
        這是真的 SQLite 資料庫（在瀏覽器裡跑）。切換下面的情境練習不同的查詢題目。
      </p>
      <div className="sandbox-actions">
        {scenarios.map((s) => (
          <button
            key={s.id}
            className={s.id === scenarioId ? "" : "secondary"}
            disabled={!ready}
            onClick={() => loadScenario(s)}
          >
            {s.label}
          </button>
        ))}
      </div>
      <p className="sandbox-hint">{scenario.description}</p>
      <textarea
        className="sandbox-textarea"
        value={sql}
        onChange={(e) => setSql(e.target.value)}
        rows={4}
        spellCheck={false}
      />
      <div className="sandbox-actions">
        <button
          disabled={!ready}
          onClick={() => dbRef.current && runQuery(dbRef.current, sql, true)}
        >
          {ready ? "執行 SQL" : "資料庫載入中…"}
        </button>
        <button className="secondary" disabled={!ready} onClick={resetDatabase}>
          重置資料庫
        </button>
      </div>
      <div className="sandbox-actions">
        {scenario.presets.map((p) => (
          <button key={p.label} className="secondary" onClick={() => setSql(p.sql)}>
            練習題：{p.label}
          </button>
        ))}
      </div>
      {error && <div className="sandbox-error">錯誤：{error}</div>}
      {result && (
        <table className="sandbox-table">
          <thead>
            <tr>
              {result.columns.map((c) => (
                <th key={c}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.values.map((row, i) => (
              <tr key={i}>
                {row.map((v, j) => (
                  <td key={j}>{v === null ? <em>NULL</em> : String(v)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
