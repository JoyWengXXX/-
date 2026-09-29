import { useEffect, useRef, useState } from "react";
import { playErrorSound, playSuccessSound } from "../../lib/sound";

// 純前端模擬的 docker CLI，不會真的連到 Docker daemon，只重現 build/images/run/ps/stop/rm 等指令的行為
interface DockerImage {
  tag: string;
  id: string;
}

interface DockerContainer {
  id: string;
  name: string;
  image: string;
  status: "running" | "exited";
}

const ADJECTIVES = ["brave", "clever", "gentle", "happy", "quirky", "silent", "sunny", "witty"];
const NOUNS = ["falcon", "curie", "panda", "nova", "otter", "comet", "lynx", "maple"];

function randId(len = 12): string {
  const chars = "0123456789abcdef";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function randomContainerName(): string {
  const a = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const n = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  return `${a}_${n}`;
}

function normalizeTag(tag: string): string {
  return tag.includes(":") ? tag : `${tag}:latest`;
}

interface ParsedArgs {
  flags: Record<string, string | true>;
  positional: string[];
}

function parseArgs(args: string[]): ParsedArgs {
  const flags: Record<string, string | true> = {};
  const positional: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "-d" || a === "--detach") flags.detach = true;
    else if (a === "-a" || a === "--all") flags.all = true;
    else if (a === "--name") flags.name = args[++i] ?? "";
    else if (a === "-t") flags.tag = args[++i] ?? "";
    else if (a === ".") continue;
    else positional.push(a);
  }
  return { flags, positional };
}

const presetGroups: { label: string; items: { label: string; command: string }[] }[] = [
  {
    label: "映像檔（Image）操作",
    items: [
      { label: "看看目前有哪些 image", command: "docker images" },
      { label: "打包一個新的 image", command: "docker build -t myapp ." },
      { label: "刪除一個 image", command: "docker rmi myapp" },
    ],
  },
  {
    label: "容器（Container）操作",
    items: [
      { label: "用 image 啟動一個容器（背景執行）", command: "docker run -d --name myapp myapp" },
      { label: "看看有哪些容器正在跑", command: "docker ps" },
      { label: "看看所有容器（含已停止的）", command: "docker ps -a" },
      { label: "看容器的 log", command: "docker logs myapp" },
      { label: "把容器停掉", command: "docker stop myapp" },
      { label: "把停止的容器刪掉", command: "docker rm myapp" },
    ],
  },
];

interface LogEntry {
  command: string;
  output: string;
}

interface ExecResult {
  output: string;
  isError: boolean;
  images: DockerImage[];
  containers: DockerContainer[];
  clear?: boolean;
}

function err(output: string, images: DockerImage[], containers: DockerContainer[]): ExecResult {
  return { output, isError: true, images, containers };
}

function execOne(images: DockerImage[], containers: DockerContainer[], trimmed: string): ExecResult {
  const [first, sub, ...args] = trimmed.split(/\s+/);

  if (first === "clear") return { output: "", isError: false, images, containers, clear: true };
  if (first === "help" || !first) {
    return {
      output:
        "可用指令：docker build -t <tag> .、docker images、docker run [-d] [--name <name>] <image>、docker ps [-a]、docker logs <name>、docker stop <name>、docker rm <name>、docker rmi <tag>、clear（可用 && 串連多個指令）",
      isError: false,
      images,
      containers,
    };
  }
  if (first !== "docker") {
    return err(`指令不存在：${first}（Docker 指令要以 docker 開頭，例如 docker ps；也可以輸入 help 或 clear）`, images, containers);
  }

  if (sub === "build") {
    const { flags } = parseArgs(args);
    if (typeof flags.tag !== "string" || !flags.tag) {
      return err("docker build: 請指定 image 名稱，例如 docker build -t myapp .", images, containers);
    }
    const tag = normalizeTag(flags.tag);
    const id = randId();
    const nextImages = [...images.filter((img) => img.tag !== tag), { tag, id }];
    return {
      output: `Sending build context to Docker daemon\nStep 1/1 : FROM node:20\nSuccessfully built ${id.slice(0, 12)}\nSuccessfully tagged ${tag}`,
      isError: false,
      images: nextImages,
      containers,
    };
  }

  if (sub === "images") {
    if (images.length === 0) {
      return { output: "目前沒有任何 image，先用 docker build 打包一個吧", isError: false, images, containers };
    }
    const header = "REPOSITORY:TAG".padEnd(24) + "IMAGE ID";
    const rows = images.map((img) => img.tag.padEnd(24) + img.id.slice(0, 12));
    return { output: [header, ...rows].join("\n"), isError: false, images, containers };
  }

  if (sub === "run") {
    const { flags, positional } = parseArgs(args);
    const imageArg = positional[0];
    if (!imageArg) {
      return err("docker run: 請指定要啟動的 image，例如 docker run -d --name myapp myapp", images, containers);
    }
    const imageTag = normalizeTag(imageArg);
    const image = images.find((img) => img.tag === imageTag);
    if (!image) {
      return err(
        `Unable to find image '${imageArg}' locally\ndocker: Error response from daemon: pull access denied for ${imageArg}，先用 docker build 打包這個 image`,
        images,
        containers
      );
    }
    const name = typeof flags.name === "string" && flags.name ? flags.name : randomContainerName();
    if (containers.some((c) => c.name === name)) {
      return err(`docker: Error response from daemon: Conflict. The container name "/${name}" is already in use`, images, containers);
    }
    const id = randId();
    const status: DockerContainer["status"] = flags.detach ? "running" : "exited";
    const nextContainers = [...containers, { id, name, image: image.tag, status }];
    const output = flags.detach
      ? id
      : `Hello from ${image.tag}!\n（這次沒有加 -d，容器執行完馬上結束，狀態變成 exited）`;
    return { output, isError: false, images, containers: nextContainers };
  }

  if (sub === "ps") {
    const { flags } = parseArgs(args);
    const list = flags.all ? containers : containers.filter((c) => c.status === "running");
    if (list.length === 0) {
      return {
        output: flags.all ? "目前沒有任何容器" : "目前沒有正在執行的容器（試試加上 -a 看看所有容器）",
        isError: false,
        images,
        containers,
      };
    }
    const header = "CONTAINER ID".padEnd(14) + "IMAGE".padEnd(16) + "STATUS".padEnd(10) + "NAMES";
    const rows = list.map(
      (c) => c.id.slice(0, 12).padEnd(14) + c.image.padEnd(16) + (c.status === "running" ? "Up" : "Exited").padEnd(10) + c.name
    );
    return { output: [header, ...rows].join("\n"), isError: false, images, containers };
  }

  if (sub === "logs") {
    const name = args[0];
    if (!name) return err("docker logs: 請指定容器名稱，例如 docker logs myapp", images, containers);
    const target = containers.find((c) => c.name === name);
    if (!target) return err(`Error: No such container: ${name}`, images, containers);
    return {
      output: `[app] Server started on port 3000\n[app] Listening for requests...\n[app] 目前狀態：${target.status === "running" ? "運作中" : "已停止"}`,
      isError: false,
      images,
      containers,
    };
  }

  if (sub === "stop") {
    const name = args[0];
    if (!name) return err("docker stop: 請指定容器名稱，例如 docker stop myapp", images, containers);
    const target = containers.find((c) => c.name === name);
    if (!target) return err(`Error: No such container: ${name}`, images, containers);
    if (target.status === "exited") return err(`docker: 容器「${name}」已經是停止狀態了`, images, containers);
    const nextContainers = containers.map((c) => (c.name === name ? { ...c, status: "exited" as const } : c));
    return { output: name, isError: false, images, containers: nextContainers };
  }

  if (sub === "start") {
    const name = args[0];
    if (!name) return err("docker start: 請指定容器名稱，例如 docker start myapp", images, containers);
    const target = containers.find((c) => c.name === name);
    if (!target) return err(`Error: No such container: ${name}`, images, containers);
    if (target.status === "running") return err(`docker: 容器「${name}」已經在執行中了`, images, containers);
    const nextContainers = containers.map((c) => (c.name === name ? { ...c, status: "running" as const } : c));
    return { output: name, isError: false, images, containers: nextContainers };
  }

  if (sub === "rm") {
    const name = args[0];
    if (!name) return err("docker rm: 請指定容器名稱，例如 docker rm myapp", images, containers);
    const target = containers.find((c) => c.name === name);
    if (!target) return err(`Error: No such container: ${name}`, images, containers);
    if (target.status === "running") {
      return err(
        "docker: Error response from daemon: You cannot remove a running container. Stop the container before attempting removal.",
        images,
        containers
      );
    }
    return { output: name, isError: false, images, containers: containers.filter((c) => c.name !== name) };
  }

  if (sub === "rmi") {
    const tagArg = args[0];
    if (!tagArg) return err("docker rmi: 請指定 image 名稱，例如 docker rmi myapp", images, containers);
    const tag = normalizeTag(tagArg);
    const image = images.find((img) => img.tag === tag);
    if (!image) return err(`Error: No such image: ${tagArg}`, images, containers);
    const usedBy = containers.find((c) => c.image === image.tag);
    if (usedBy) {
      return err(
        `Error response from daemon: conflict: unable to remove repository reference "${tag}" (must force) - container ${usedBy.id.slice(0, 12)} is using its referenced image`,
        images,
        containers
      );
    }
    return {
      output: `Untagged: ${tag}\nDeleted: ${image.id}`,
      isError: false,
      images: images.filter((img) => img.tag !== tag),
      containers,
    };
  }

  return err(`docker: '${sub}' 不是有效的指令（試試 build、images、run、ps、logs、stop、start、rm、rmi 或 help）`, images, containers);
}

export default function DockerSandbox() {
  const [images, setImages] = useState<DockerImage[]>([{ tag: "nginx:latest", id: randId() }]);
  const [containers, setContainers] = useState<DockerContainer[]>([]);
  const [input, setInput] = useState("");
  const [log, setLog] = useState<LogEntry[]>([
    { command: "", output: "已經幫你準備好一個 nginx:latest 的 image，輸入 help 看看有哪些指令可以用。" },
  ]);
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = terminalRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [log]);

  function run(rawCommand: string) {
    const trimmedFull = rawCommand.trim();
    if (!trimmedFull) return;
    // 支援 && 串連多個指令，前一個失敗就不繼續執行後面的指令
    const parts = trimmedFull
      .split("&&")
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length === 0) return;

    let currentImages = images;
    let currentContainers = containers;
    let entries: LogEntry[] = [];
    let cleared = false;
    let lastIsError = false;

    for (const part of parts) {
      const result = execOne(currentImages, currentContainers, part);
      if (result.clear) {
        entries = [];
        cleared = true;
        continue;
      }
      currentImages = result.images;
      currentContainers = result.containers;
      lastIsError = result.isError;
      entries.push({ command: part, output: result.output });
      if (result.isError) break;
    }

    setImages(currentImages);
    setContainers(currentContainers);
    lastIsError ? playErrorSound() : playSuccessSound();
    setLog((prev) => (cleared ? entries : [...prev, ...entries]));
    setInput("");
  }

  return (
    <div className="sandbox docker-sandbox">
      <p className="sandbox-hint">
        這是模擬的 docker 指令列（不會真的連到 Docker daemon），已經幫你準備好一個 <code>nginx:latest</code> 的 image。
      </p>
      {presetGroups.map((group) => (
        <div key={group.label}>
          <p className="sandbox-hint">{group.label}：</p>
          <div className="preset-list">
            {group.items.map((p) => (
              <button key={p.label} className="secondary" onClick={() => run(p.command)}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
      ))}
      <div className="terminal" ref={terminalRef}>
        {log.map((entry, i) => (
          <div className="terminal-line" key={i}>
            {entry.command && (
              <div className="terminal-prompt">
                <span className="terminal-cwd">$</span> {entry.command}
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
        <span className="terminal-cwd">$</span>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="輸入指令，例如 docker ps"
          spellCheck={false}
          autoComplete="off"
        />
        <button type="submit">送出</button>
      </form>
    </div>
  );
}
