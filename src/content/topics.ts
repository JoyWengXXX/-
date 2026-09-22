import type { Topic } from "./types";

export const topics: Topic[] = [
  {
    id: "data-structure",
    title: "資料結構",
    stage: 0,
    tagline: "資料的「收納方式」——決定你找東西快不快",
    notTaught: ["時間複雜度 Big-O", "平衡樹細節", "演算法競賽技巧"],
    prerequisites: [],
    position: { x: 0, y: 0 },
    steps: [
      {
        type: "analogy",
        title: "比喻：收納方式",
        body: "資料結構就像家裡的收納方式——抽屜、櫃子、族譜樹，決定你找東西快不快。同一批東西，收納方式不同，找起來的速度天差地遠。",
      },
      {
        type: "concept",
        title: "核心概念",
        bullets: [
          "陣列 / 清單：一排編號的置物櫃，依號碼找東西",
          "Key-Value：貼標籤的箱子，例如字典，用「名字」找內容",
          "樹狀結構：家族族譜、資料夾巢狀結構，一層包一層",
          "為什麼「結構選對」查詢會變快：翻書 vs 翻字典的差別",
        ],
      },
      {
        type: "quiz",
        title: "小驗收",
        question: "如果你要做一本「通訊錄」，用姓名快速查電話，比較適合用哪種收納方式？",
        options: ["按登記順序排的清單", "用姓名當標籤的 Key-Value", "沒有規則的散亂堆放"],
        correctIndex: 1,
        explanation: "用姓名當 Key 直接對應到電話，就像字典一樣可以快速查到，不用整本翻過一遍。",
      },
    ],
  },
  {
    id: "networking",
    title: "網路傳輸",
    stage: 0,
    tagline: "兩台電腦怎麼「對話」？",
    notTaught: ["TCP 三向交握細節", "OSI 七層模型全部背誦", "封包格式"],
    prerequisites: [],
    position: { x: 0, y: 260 },
    steps: [
      {
        type: "analogy",
        title: "比喻：打電話",
        body: "兩台電腦對話就像兩個人打電話——要有「電話號碼」（IP）、「分機」（Port），還要講同一種語言（協定），對方才聽得懂。",
      },
      {
        type: "concept",
        title: "核心概念",
        bullets: [
          "IP：電腦在網路上的地址",
          "Port：同一台電腦裡，不同服務的「分機號碼」",
          "Client-Server：誰先開口發請求、誰負責回應",
          "HTTP 是一種「對話規則」，不是網路本身",
          "TCP（掛號信，保證送達）vs UDP（普通信，快但不保證）",
        ],
      },
      {
        type: "quiz",
        title: "小驗收",
        question: "網址 http://example.com:8080 裡的「8080」代表什麼？",
        options: ["網站的密碼", "分機號碼（Port）", "檔案的版本號"],
        correctIndex: 1,
        explanation: "8080 是 Port，代表要連到這台主機上「哪一個服務」，就像打電話轉分機一樣。",
      },
    ],
  },
  {
    id: "sql",
    title: "SQL / 資料庫",
    stage: 1,
    tagline: "一個很會整理的 Excel 系統",
    notTaught: ["正規化理論", "交易隔離等級", "索引優化細節"],
    prerequisites: ["data-structure"],
    position: { x: 300, y: 0 },
    steps: [
      {
        type: "analogy",
        title: "比喻：進階版 Excel",
        body: "資料庫就是「一個很會整理的 Excel 系統」，SQL 是你跟它下指令的語言，讓它幫你新增、查詢、修改、刪除資料。",
      },
      {
        type: "concept",
        title: "核心概念",
        bullets: [
          "Table / 欄位 / 資料列：就是進階版的 Excel 表格",
          "CRUD：新增（INSERT）、查詢（SELECT）、修改（UPDATE）、刪除（DELETE）",
          "主鍵：每個人的身分證字號，不會重複，用來認出「是哪一列」",
          "簡單的表格關聯：訂單表 連到 客戶表（先不學複雜 JOIN）",
        ],
      },
      {
        type: "sql-sandbox",
        title: "動手試試：真的跑一次 SQL",
        body: "下面是一個「線上書店」的資料庫，已經幫你建好 books 表格。試著修改 SQL 查出庫存最多的書。",
      },
      {
        type: "quiz",
        title: "小驗收",
        question: "想要「查出所有書名」，該用哪個指令開頭？",
        options: ["SELECT", "INSERT", "DELETE"],
        correctIndex: 0,
        explanation: "SELECT 用來查詢資料，INSERT 是新增、DELETE 是刪除。",
      },
    ],
  },
  {
    id: "linux",
    title: "Linux",
    stage: 2,
    tagline: "另一種作業系統，只是改用打字下指令",
    notTaught: ["Shell script 進階語法", "核心（kernel）原理", "系統管理"],
    prerequisites: [],
    position: { x: 300, y: 260 },
    steps: [
      {
        type: "analogy",
        title: "比喻：打字版的檔案總管",
        body: "Linux 就是「另一種作業系統」，沒有滑鼠點點點，改用打字下指令。Terminal 就是「打字版的檔案總管」。",
      },
      {
        type: "concept",
        title: "核心概念",
        bullets: [
          "為什麼工程師常用 Linux：伺服器幾乎都跑 Linux",
          "基本指令：ls（列出檔案）、cd（切換資料夾）、pwd（目前在哪）、cat（看檔案內容）、mkdir（新增資料夾）",
          "檔案權限：誰可以看 / 改 / 執行，用「鑰匙」比喻",
        ],
      },
      {
        type: "linux-sandbox",
        title: "動手試試：模擬終端機",
        body: "下面是一個模擬的終端機，已經幫你準備好 /home/user 底下的檔案。試著用指令探索看看。",
      },
      {
        type: "quiz",
        title: "小驗收",
        question: "指令 mkdir project && cd project 在做什麼？",
        options: [
          "刪除 project 資料夾",
          "新增一個叫 project 的資料夾，然後切換進去",
          "列出 project 資料夾內容",
        ],
        correctIndex: 1,
        explanation: "mkdir 新增資料夾，&& 代表「前一步成功才繼續」，cd 是切換進去該資料夾。",
      },
    ],
  },

  {
    id: "docker",
    title: "Docker",
    stage: 2,
    tagline: "隨身攜帶的完整房間",
    notTaught: ["Docker Compose 進階編排", "Kubernetes", "網路模式細節"],
    prerequisites: ["linux"],
    position: { x: 600, y: 260 },
    steps: [
      {
        type: "analogy",
        title: "比喻：隨身攜帶的房間",
        body: "Docker 就是「隨身攜帶的完整房間」——不管搬到誰的電腦，房間裡的擺設（環境）都一樣，不會出現「在我電腦可以跑，換一台就壞掉」的問題。",
      },
      {
        type: "concept",
        title: "核心概念",
        bullets: [
          "為什麼需要它：解決「環境不一致」的痛點",
          "Image：房間的設計圖（不會變動）",
          "Container：真的蓋出來、正在運作的房間",
          "常用指令：docker run（蓋房間並住進去）、docker ps（看有哪些房間在運作）、docker stop（把房間關掉）",
          "Dockerfile：蓋房間的施工說明書",
        ],
      },
      {
        type: "docker-visual",
        title: "圖解：從 Dockerfile 到 Container",
        body: "點下面每個方塊看說明，也可以展開「有沒有 Docker」的比較圖。",
      },
      {
        type: "quiz",
        title: "小驗收",
        question: "Image 跟 Container 的差別，比較接近下面哪一個說法？",
        options: [
          "Image 是設計圖，Container 是照圖蓋出來、正在運作的房間",
          "兩者是同一件事，只是名字不同",
          "Container 是設計圖，Image 是蓋好的房間",
        ],
        correctIndex: 0,
        explanation: "Image 不會變動，是「藍圖」；Container 是根據 Image 實際跑起來的實體。",
      },
    ],
  },
  {
    id: "rest-api",
    title: "RESTful API",
    stage: 3,
    tagline: "餐廳菜單——照著點餐，廚房就會出餐",
    notTaught: ["GraphQL", "API 版本控制策略", "OAuth 完整規格"],
    prerequisites: ["networking", "sql"],
    position: { x: 600, y: 0 },
    steps: [
      {
        type: "analogy",
        title: "比喻：餐廳菜單",
        body: "API 就是「餐廳菜單」——你不用進廚房，只要照著菜單點餐（發請求），廚房就會出餐（回應資料）。",
      },
      {
        type: "concept",
        title: "核心概念",
        bullets: [
          "Request / Response：請求要有方法、網址、資料；回應會有結果",
          "GET / POST / PUT / DELETE 對應「查、增、改、刪」，跟 SQL 的 CRUD 是同一件事的不同說法",
          "Status Code：200（成功）、404（找不到）、500（伺服器出錯），像服務生的回覆",
          "JSON：資料的共同語言格式，讓不同系統都看得懂",
        ],
      },
      {
        type: "api-sandbox",
        title: "動手試試：呼叫一個模擬 API",
        body: "點下面的按鈕，模擬對一個「書店 API」發出請求，觀察它怎麼回應。",
      },
      {
        type: "quiz",
        title: "小驗收",
        question: "呼叫 API 後收到 Status Code 404，代表什麼？",
        options: ["請求成功", "找不到你要的資源", "伺服器內部發生錯誤"],
        correctIndex: 1,
        explanation: "404 代表「找不到」，通常是網址或資源 ID 不存在；500 才是伺服器自己出錯。",
      },
    ],
  },
  {
    id: "message-queue",
    title: "資料佇列 / MQ",
    stage: 4,
    tagline: "銀行的排隊叫號機",
    notTaught: ["Kafka 分區機制", "訊息保證語意細節", "叢集架構"],
    prerequisites: ["rest-api", "docker"],
    position: { x: 900, y: 130 },
    steps: [
      {
        type: "analogy",
        title: "比喻：排隊叫號機",
        body: "資料佇列就是「銀行的排隊叫號機」——客人（請求）不用一直站著等櫃檯處理完，先抽號碼牌，系統會照順序慢慢處理。",
      },
      {
        type: "concept",
        title: "核心概念",
        bullets: [
          "為什麼需要它：同步請求太慢、系統忙不過來時的解法",
          "Producer（發號碼牌的人）/ Consumer（櫃檯）/ Queue（排隊隊伍）",
          "「非同步」：先做別的事，等通知再回來處理",
          "ACK（確認收到）：Consumer 處理完要跟佇列回報一聲，佇列才會真的刪掉這則訊息",
          "常見場景：訂單處理、寄送通知信",
        ],
      },
      {
        type: "mq-visual",
        title: "圖解：排隊動畫",
        body: "連續按幾次「送出新請求」，看看號碼牌怎麼排隊、怎麼被一個一個處理掉。",
      },
      {
        type: "mq-failure-visual",
        title: "圖解：Consumer 突然掛掉，訊息會不見嗎？",
        body: "一步一步看：處理到一半的 Consumer 當機了，佇列怎麼確保這則訊息還是會被處理完成，不會憑空消失。",
      },
      {
        type: "quiz",
        title: "小驗收",
        question: "網路購物「付款後立刻跳成功頁面，出貨通知信晚點才寄到」，比較像哪種模式？",
        options: ["同步，馬上處理完才給結果", "非同步排隊，之後再慢慢處理", "沒有任何處理"],
        correctIndex: 1,
        explanation: "付款結果馬上給你，但寄信這種「不急著馬上完成」的事會被丟進佇列，之後再慢慢處理。",
      },
    ],
  },
];

export const getTopic = (id: string) => topics.find((t) => t.id === id);
