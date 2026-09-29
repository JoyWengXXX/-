import { useEffect, useRef, useState } from "react";
import initSqlJs, { type Database } from "sql.js";
import sqlWasmUrl from "sql.js/dist/sql-wasm.wasm?url";
import { playErrorSound, playSuccessSound } from "../../lib/sound";

type CrudType = "select" | "insert" | "update" | "delete";

const crudLabels: Record<CrudType, string> = {
  select: "查詢（SELECT）",
  insert: "新增（INSERT）",
  update: "修改（UPDATE）",
  delete: "刪除（DELETE）",
};

interface ScenarioPreset {
  label: string;
  sql: string;
  type: CrudType;
}

interface Scenario {
  id: string;
  label: string;
  description: string;
  seedSql: string;
  defaultQuery: string;
  tables: string[];
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
    tables: ["books"],
    presets: [
      { label: "庫存最多的書", type: "select", sql: "SELECT title, stock FROM books ORDER BY stock DESC LIMIT 1;" },
      { label: "庫存低於 10 本（需要補貨）", type: "select", sql: "SELECT * FROM books WHERE stock < 10;" },
      { label: "依庫存由少到多排序", type: "select", sql: "SELECT title, stock FROM books ORDER BY stock ASC;" },
      {
        label: "新增一本新書",
        type: "insert",
        sql: "INSERT INTO books (title, author, stock) VALUES ('原子習慣2', '詹姆斯克利爾', 15);",
      },
      {
        label: "賣出一本書，庫存要扣 1",
        type: "update",
        sql: "UPDATE books SET stock = stock - 1 WHERE title = '三體';",
      },
      { label: "下架一本書", type: "delete", sql: "DELETE FROM books WHERE title = '被討厭的勇氣';" },
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
    tables: ["customers", "orders"],
    presets: [
      {
        label: "查每筆訂單是哪位客戶下的（JOIN）",
        type: "select",
        sql: "SELECT customers.name, orders.book_title, orders.status\nFROM orders\nJOIN customers ON orders.customer_id = customers.id;",
      },
      { label: "只找『已取消』的訂單", type: "select", sql: "SELECT * FROM orders WHERE status = '已取消';" },
      {
        label: "統計每位客戶下了幾張訂單",
        type: "select",
        sql: "SELECT customers.name, COUNT(*) AS order_count\nFROM orders\nJOIN customers ON orders.customer_id = customers.id\nGROUP BY customers.name;",
      },
      {
        label: "新增一筆訂單",
        type: "insert",
        sql: "INSERT INTO orders (customer_id, book_title, amount, status) VALUES (2, '被討厭的勇氣', 1, '處理中');",
      },
      { label: "把處理中的訂單改成已出貨", type: "update", sql: "UPDATE orders SET status = '已出貨' WHERE id = 2;" },
      { label: "清掉所有已取消的訂單", type: "delete", sql: "DELETE FROM orders WHERE status = '已取消';" },
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
    tables: ["members"],
    presets: [
      {
        label: "找出 email 是 NULL 的帳號（資料缺漏）",
        type: "select",
        sql: "SELECT * FROM members WHERE email IS NULL;",
      },
      {
        label: "邊界值：年齡剛好等於 18 或 65（規則邊界最容易出 bug）",
        type: "select",
        sql: "SELECT * FROM members WHERE age = 18 OR age = 65;",
      },
      {
        label: "找出名字重複的帳號（資料重複也是常見缺陷）",
        type: "select",
        sql: "SELECT name, COUNT(*) AS cnt FROM members GROUP BY name HAVING COUNT(*) > 1;",
      },
      {
        label: "再新增一筆邊界年齡的測試帳號",
        type: "insert",
        sql: "INSERT INTO members (name, age, email) VALUES ('測試帳號F', 18, NULL);",
      },
      { label: "補齊某個帳號缺漏的 email", type: "update", sql: "UPDATE members SET email = 'b@test.com' WHERE name = '測試帳號B';" },
      { label: "刪除年齡明顯異常（0 歲）的髒資料", type: "delete", sql: "DELETE FROM members WHERE age = 0;" },
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
  const [tableSnapshots, setTableSnapshots] = useState<Record<string, QueryResult>>({});

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
      runQuery(db, scenario.defaultQuery, scenario.tables);
      refreshTableSnapshots(db, scenario.tables);
    });
    return () => {
      cancelled = true;
      dbRef.current?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function fetchTable(db: Database, table: string): QueryResult {
    const res = db.exec(`SELECT * FROM ${table};`);
    return res[0] ? { columns: res[0].columns, values: res[0].values } : { columns: [], values: [] };
  }

  function refreshTableSnapshots(db: Database, tables: string[]) {
    const next: Record<string, QueryResult> = {};
    for (const table of tables) next[table] = fetchTable(db, table);
    setTableSnapshots(next);
  }

  function runQuery(db: Database, query: string, tables: string[], withSound = false) {
    try {
      const res = db.exec(query);
      setError(null);
      setResult(res[0] ? { columns: res[0].columns, values: res[0].values } : { columns: [], values: [] });
      if (withSound) playSuccessSound();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setResult(null);
      if (withSound) playErrorSound();
    } finally {
      refreshTableSnapshots(db, tables);
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
    runQuery(db, next.defaultQuery, next.tables);
  }

  function resetDatabase() {
    loadScenario(scenario);
  }

  const groupedPresets = (["select", "insert", "update", "delete"] as CrudType[])
    .map((type) => ({ type, items: scenario.presets.filter((p) => p.type === type) }))
    .filter((g) => g.items.length > 0);

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
          onClick={() => dbRef.current && runQuery(dbRef.current, sql, scenario.tables, true)}
        >
          {ready ? "執行 SQL" : "資料庫載入中…"}
        </button>
        <button className="secondary" disabled={!ready} onClick={resetDatabase}>
          重置資料庫
        </button>
      </div>
      {error && <div className="sandbox-error">錯誤：{error}</div>}
      {result && (
        <>
          <p className="sandbox-hint">
            <strong>這次查詢的結果</strong>：
          </p>
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
        </>
      )}

      {groupedPresets.map((group) => (
        <div key={group.type}>
          <p className="sandbox-hint">{crudLabels[group.type]}練習題：</p>
          <div className="sandbox-actions">
            {group.items.map((p) => (
              <button key={p.label} className="secondary" onClick={() => setSql(p.sql)}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
      ))}

      <p className="sandbox-hint">
        <strong>目前資料表內容</strong>（每次執行 SQL 後都會自動更新，新增／修改／刪除的結果都看得到）：
      </p>
      {scenario.tables.map((table) => {
        const snapshot = tableSnapshots[table];
        return (
          <div className="table-snapshot" key={table}>
            <div className="table-snapshot-label">{table}</div>
            <table className="sandbox-table">
              <thead>
                <tr>
                  {(snapshot?.columns ?? []).map((c) => (
                    <th key={c}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(snapshot?.values ?? []).map((row, i) => (
                  <tr key={i}>
                    {row.map((v, j) => (
                      <td key={j}>{v === null ? <em>NULL</em> : String(v)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
