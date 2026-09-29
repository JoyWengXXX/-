import { useEffect, useMemo, useRef, useState } from "react";
import { playErrorSound, playSuccessSound } from "../../lib/sound";

// 純前端模擬的檔案系統，不會執行真實指令，只重現 ls/cd/pwd/cat/mkdir 的行為
type FsNode = { type: "dir"; children: Record<string, FsNode> } | { type: "file"; content: string };

function makeInitialFs(): FsNode {
  return {
    type: "dir",
    children: {
      home: {
        type: "dir",
        children: {
          user: {
            type: "dir",
            children: {
              notes: {
                type: "dir",
                children: {
                  "todo.txt": { type: "file", content: "買牛奶\n寫程式\n讀書" },
                },
              },
              photos: { type: "dir", children: {} },
              "readme.txt": {
                type: "file",
                content: "歡迎使用模擬終端機！試著用 ls、cd、cat、pwd、mkdir 探索看看。",
              },
            },
          },
        },
      },
    },
  };
}

const HOME_PATH = ["home", "user"];

function cloneFs(fs: FsNode): FsNode {
  return JSON.parse(JSON.stringify(fs));
}

function getNode(fs: FsNode, path: string[]): FsNode | undefined {
  let node = fs;
  for (const seg of path) {
    if (node.type !== "dir") return undefined;
    const next = node.children[seg];
    if (!next) return undefined;
    node = next;
  }
  return node;
}

function resolvePath(cwd: string[], input: string): string[] {
  const isAbsolute = input.startsWith("/");
  const parts = input.split("/").filter((p) => p.length > 0);
  const base = isAbsolute ? [] : [...cwd];
  for (const part of parts) {
    if (part === ".") continue;
    if (part === "..") {
      base.pop();
    } else {
      base.push(part);
    }
  }
  return base;
}

const presets = [
  { label: "我現在在哪？", command: "pwd" },
  { label: "這裡有什麼？", command: "ls" },
  { label: "進去 notes 資料夾", command: "cd notes" },
  { label: "看看 todo.txt 寫什麼", command: "cat todo.txt" },
  { label: "新增一個資料夾", command: "mkdir my-folder" },
  { label: "連續指令：新增資料夾後直接切換進去", command: "mkdir project && cd project" },
];

interface LogEntry {
  cwd: string;
  command: string;
  output: string;
}

export default function LinuxSandbox() {
  const [fs, setFs] = useState<FsNode>(() => makeInitialFs());
  const [cwd, setCwd] = useState<string[]>(HOME_PATH);
  const [input, setInput] = useState("");
  const [log, setLog] = useState<LogEntry[]>([
    { cwd: "/" + HOME_PATH.join("/"), command: "", output: "輸入 help 看看有哪些指令可以用。" },
  ]);

  const cwdDisplay = useMemo(() => "/" + cwd.join("/"), [cwd]);
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = terminalRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [log]);

  function execOne(
    fsState: FsNode,
    cwdState: string[],
    trimmed: string
  ): { output: string; isError: boolean; fs: FsNode; cwd: string[]; clear?: boolean } {
    const [cmd, ...args] = trimmed.split(/\s+/);
    let output = "";
    let nextFs = fsState;
    let nextCwd = cwdState;
    const cwdDisplayLocal = "/" + cwdState.join("/");

    if (cmd === "help") {
      output = "可用指令：pwd、ls [路徑]、cd <路徑>、cat <檔案>、mkdir <名稱>、clear（可用 && 串連多個指令，例如 mkdir a && cd a）";
    } else if (cmd === "pwd") {
      output = cwdDisplayLocal;
    } else if (cmd === "ls") {
      const target = args[0] ? resolvePath(cwdState, args[0]) : cwdState;
      const node = getNode(fsState, target);
      if (!node) output = `ls: 找不到路徑「${args[0] ?? cwdDisplayLocal}」`;
      else if (node.type !== "dir") output = `ls: 「${args[0]}」不是資料夾`;
      else {
        const names = Object.entries(node.children).map(([name, child]) =>
          child.type === "dir" ? `${name}/` : name
        );
        output = names.length ? names.join("  ") : "(空資料夾)";
      }
    } else if (cmd === "cd") {
      if (!args[0]) {
        output = "cd: 請指定要去的路徑，例如 cd notes";
      } else {
        const target = resolvePath(cwdState, args[0]);
        const node = getNode(fsState, target);
        if (!node) output = `cd: 沒有這個路徑「${args[0]}」`;
        else if (node.type !== "dir") output = `cd: 「${args[0]}」是檔案，不是資料夾`;
        else {
          nextCwd = target;
          output = `已切換到 /${target.join("/")}`;
        }
      }
    } else if (cmd === "cat") {
      if (!args[0]) {
        output = "cat: 請指定要看的檔案，例如 cat todo.txt";
      } else {
        const target = resolvePath(cwdState, args[0]);
        const node = getNode(fsState, target);
        if (!node) output = `cat: 找不到檔案「${args[0]}」`;
        else if (node.type !== "file") output = `cat: 「${args[0]}」是資料夾，不是檔案`;
        else output = node.content;
      }
    } else if (cmd === "mkdir") {
      if (!args[0]) {
        output = "mkdir: 請指定資料夾名稱，例如 mkdir my-folder";
      } else {
        const parentNode = getNode(fsState, cwdState);
        if (parentNode && parentNode.type === "dir" && parentNode.children[args[0]]) {
          output = `mkdir: 「${args[0]}」已經存在了`;
        } else {
          const cloned = cloneFs(fsState);
          const parent = getNode(cloned, cwdState);
          if (parent && parent.type === "dir") {
            parent.children[args[0]] = { type: "dir", children: {} };
            nextFs = cloned;
            output = `已建立資料夾「${args[0]}」`;
          } else {
            output = "mkdir: 發生未預期的錯誤";
          }
        }
      }
    } else if (cmd === "clear") {
      return { output: "", isError: false, fs: fsState, cwd: cwdState, clear: true };
    } else {
      output = `指令不存在：${cmd}（試試 pwd、ls、cd、cat、mkdir 或 help）`;
    }

    const isError = output.startsWith(`${cmd}: `) || output.startsWith("指令不存在");
    return { output, isError, fs: nextFs, cwd: nextCwd };
  }

  function run(rawCommand: string) {
    const trimmedFull = rawCommand.trim();
    if (!trimmedFull) return;
    // 支援 && 串連多個指令，前一個失敗就不繼續執行後面的指令
    const parts = trimmedFull
      .split("&&")
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length === 0) return;

    let currentFs = fs;
    let currentCwd = cwd;
    let entries: LogEntry[] = [];
    let cleared = false;
    let lastIsError = false;

    for (const part of parts) {
      const beforeCwd = currentCwd;
      const result = execOne(currentFs, currentCwd, part);
      if (result.clear) {
        entries = [];
        cleared = true;
        continue;
      }
      currentFs = result.fs;
      currentCwd = result.cwd;
      lastIsError = result.isError;
      entries.push({ cwd: "/" + beforeCwd.join("/"), command: part, output: result.output });
      if (result.isError) break;
    }

    setFs(currentFs);
    setCwd(currentCwd);
    lastIsError ? playErrorSound() : playSuccessSound();
    setLog((prev) => (cleared ? entries : [...prev, ...entries]));
    setInput("");
  }


  return (
    <div className="sandbox linux-sandbox">
      <p className="sandbox-hint">
        這是模擬的終端機（不會真的連到任何電腦），已經幫你準備好一個假的檔案系統。試著探索 <code>/home/user</code> 底下有什麼。
      </p>
      <div className="preset-list">
        {presets.map((p) => (
          <button key={p.label} className="secondary" onClick={() => run(p.command)}>
            {p.label}
          </button>
        ))}
      </div>
      <div className="terminal" ref={terminalRef}>
        {log.map((entry, i) => (
          <div className="terminal-line" key={i}>
            {entry.command && (
              <div className="terminal-prompt">
                <span className="terminal-cwd">{entry.cwd}</span> $ {entry.command}
              </div>
            )}
            <div className="terminal-output">{entry.output}</div>
          </div>
        ))}
      </div>
      <form
        className="terminal-input-row"
        onSubmit={(e) => {
          e.preventDefault();
          run(input);
        }}
      >
        <span className="terminal-cwd">{cwdDisplay} $</span>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="輸入指令，例如 ls"
          spellCheck={false}
          autoComplete="off"
        />
        <button type="submit">送出</button>
      </form>
    </div>
  );
}
