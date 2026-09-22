import { useEffect, useRef, useState } from "react";
import initSqlJs, { type Database } from "sql.js";
import sqlWasmUrl from "sql.js/dist/sql-wasm.wasm?url";

const SEED_SQL = `
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
`;

const DEFAULT_QUERY = "SELECT * FROM books;";

interface QueryResult {
  columns: string[];
  values: unknown[][];
}

export default function SqlSandbox() {
  const dbRef = useRef<Database | null>(null);
  const sqlModuleRef = useRef<Awaited<ReturnType<typeof initSqlJs>> | null>(null);
  const [ready, setReady] = useState(false);
  const [sql, setSql] = useState(DEFAULT_QUERY);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    initSqlJs({ locateFile: () => sqlWasmUrl }).then((SQL) => {
      if (cancelled) return;
      sqlModuleRef.current = SQL;
      const db = new SQL.Database();
      db.run(SEED_SQL);
      dbRef.current = db;
      setReady(true);
      runQuery(db, DEFAULT_QUERY);
    });
    return () => {
      cancelled = true;
      dbRef.current?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function runQuery(db: Database, query: string) {
    try {
      const res = db.exec(query);
      setError(null);
      setResult(res[0] ? { columns: res[0].columns, values: res[0].values } : { columns: [], values: [] });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setResult(null);
    }
  }

  function resetDatabase() {
    const SQL = sqlModuleRef.current;
    if (!SQL) return;
    dbRef.current?.close();
    const db = new SQL.Database();
    db.run(SEED_SQL);
    dbRef.current = db;
    setSql(DEFAULT_QUERY);
    runQuery(db, DEFAULT_QUERY);
  }

  return (
    <div className="sandbox sql-sandbox">
      <p className="sandbox-hint">
        這是真的 SQLite 資料庫（在瀏覽器裡跑），已經幫你建好 <code>books</code> 表格。試著查出「庫存最多的書」。
      </p>
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
          onClick={() => dbRef.current && runQuery(dbRef.current, sql)}
        >
          {ready ? "執行 SQL" : "資料庫載入中…"}
        </button>
        <button
          className="secondary"
          onClick={() => setSql("SELECT title, stock FROM books ORDER BY stock DESC LIMIT 1;")}
        >
          給我提示
        </button>
        <button className="secondary" disabled={!ready} onClick={resetDatabase}>
          重置資料庫
        </button>
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
                  <td key={j}>{String(v)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
