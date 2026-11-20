// 2027 수능 수학 — 초보자용 풀이·질문 사이트 서버
// 정적 파일 + /api/chat (Claude 프록시, 요청 제한 포함)
import express from "express";
import Anthropic from "@anthropic-ai/sdk";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUB = path.join(__dirname, "public");
const PORT = process.env.PORT || 3000;
const MODEL = process.env.CLAUDE_MODEL || "claude-opus-5-5";

// ---- 남용 방지 설정 (Render 환경변수로 조정 가능) ----
const PER_MIN = +process.env.LIMIT_PER_MIN || 6;      // IP당 1분
const PER_DAY = +process.env.LIMIT_PER_DAY || 40;     // IP당 하루
const GLOBAL_DAY = +process.env.LIMIT_GLOBAL_DAY || 1500; // 사이트 전체 하루
const MAX_Q_LEN = 600;    // 질문 길이(자)
const MAX_TURNS = 10;     // 대화 기록(최근 n개 메시지)
const MAX_TOKENS = 1500;  // 답변 길이 상한

const DATA = JSON.parse(fs.readFileSync(path.join(PUB, "data.json"), "utf8"));
const BY_ID = Object.fromEntries(DATA.map((d) => [d.id, d]));
const SUBJ = { common: "공통", prob: "확률과 통계", calc: "미적분", geo: "기하" };
const IMG_B64 = {};
for (const d of DATA) IMG_B64[d.id] = fs.readFileSync(path.join(PUB, d.img)).toString("base64");

const client = process.env.ANTHROPIC_API_KEY ? new Anthropic() : null;

// ---- 요청 제한 (메모리, 재시작 시 초기화) ----
const hits = new Map(); // ip -> [timestamps]
let dayKey = "", dayCount = 0;
const today = () => new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10); // KST
function checkLimit(ip) {
  const now = Date.now();
  if (dayKey !== today()) { dayKey = today(); dayCount = 0; hits.clear(); }
  if (dayCount >= GLOBAL_DAY) return "오늘 사이트 전체 질문 한도가 다 찼어요. 내일 다시 이용해 주세요.";
  const arr = (hits.get(ip) || []).filter((t) => now - t < 86400e3);
  if (arr.length >= PER_DAY) return `한 사람당 하루 ${PER_DAY}번까지 질문할 수 있어요. 내일 다시 이용해 주세요.`;
  if (arr.filter((t) => now - t < 60e3).length >= PER_MIN) return "질문이 너무 빨라요. 1분쯤 뒤에 다시 물어봐 주세요.";
  arr.push(now); hits.set(ip, arr); dayCount++;
  return null;
}
setInterval(() => { // 오래된 기록 정리
  const now = Date.now();
  for (const [ip, arr] of hits) { const a = arr.filter((t) => now - t < 86400e3); a.length ? hits.set(ip, a) : hits.delete(ip); }
}, 3600e3).unref();

const strip = (h) => h.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
function context(d) {
  const steps = d.steps.map((s, i) => `${i + 1}. ${s.t}${s.h ? `  (보충: ${s.h})` : ""}`).join("\n");
  return `[문제] 2027학년도 수능 수학 ${SUBJ[d.subj]} ${d.n}번 (${d.pts}점, ${d.mc ? "5지선다" : "단답형"})
문제 원문은 위 이미지입니다. 텍스트 옮김: ${d.q}
정답: ${d.ans}
핵심: ${d.key}

[사이트에 보이는 한 줄씩 풀이]
${steps}

[참고: 압축 풀이]
${strip(d.sol)}`;
}

const SYSTEM = `당신은 수학을 잘 모르는 사람(수포자, 학부모, 오랜만에 수학을 보는 어른 포함)을 돕는 친절한 수학 선생님입니다. 학습 사이트에서 2027학년도 수능 수학 한 문제와 그 풀이를 보며 질문하는 사용자에게 답합니다.

답변 원칙:
- 한국어 존댓말로, 쉬운 말로 짧게 답하세요. 보통 3~8줄. 사용자가 더 자세히 원할 때만 길게.
- 용어가 나오면 한 번은 뜻을 풀어 주세요. 필요하면 아주 쉬운 숫자 예시를 드세요.
- 사용자가 묻는 그 한 줄(또는 그 부분)에 집중하세요. 풀이 전체를 다시 쓰지 마세요.
- 수식은 LaTeX로 $...$(인라인) 또는 $$...$$(별도 줄)로 쓰세요. 마크다운 표·제목은 쓰지 마세요. 굵게(**...**)는 가끔만.
- 주어진 정답과 풀이는 검증된 것입니다. 계산을 확인할 때도 이 정답과 어긋나지 않게 하세요.
- 사용자가 직접 풀어 본 답이나 과정을 보여 주면, 맞은 부분을 먼저 짚고 틀린 곳을 부드럽게 알려 주세요. 사용자가 원하지 않으면 정답을 먼저 말하지 말고 힌트를 주세요.
- 이 문제·수학 학습과 무관한 요청(다른 과제 대행, 코드 작성, 잡담 등)은 정중히 사양하고 이 문제로 돌아오세요.`;

const app = express();
app.set("trust proxy", 1); // Render 프록시 뒤의 실제 IP
app.use(express.json({ limit: "32kb" }));
app.use(express.static(PUB, { maxAge: "1h" }));

app.get("/api/health", (_q, r) => r.json({ ok: true, chat: !!client }));

app.post("/api/chat", async (req, res) => {
  const { id, messages } = req.body || {};
  const d = BY_ID[id];
  if (!d || !Array.isArray(messages) || !messages.length) return res.status(400).json({ error: "잘못된 요청이에요." });
  if (!client) return res.status(503).json({ error: "챗봇이 아직 준비되지 않았어요 (API 키 미설정)." });

  // 메시지 검증: user/assistant 교대, 마지막은 user, 길이 제한
  const hist = messages.slice(-MAX_TURNS).map((m) => ({
    role: m.role === "assistant" ? "assistant" : "user",
    content: String(m.content || "").slice(0, m.role === "assistant" ? 4000 : MAX_Q_LEN),
  })).filter((m) => m.content.trim());
  while (hist.length && hist[0].role !== "user") hist.shift();
  if (!hist.length || hist[hist.length - 1].role !== "user") return res.status(400).json({ error: "질문을 입력해 주세요." });
  for (let i = 1; i < hist.length; i++) if (hist[i].role === hist[i - 1].role) return res.status(400).json({ error: "대화 형식이 올바르지 않아요." });

  const lim = checkLimit(req.ip);
  if (lim) return res.status(429).json({ error: lim });

  const msgs = [
    { role: "user", content: [
      { type: "image", source: { type: "base64", media_type: "image/png", data: IMG_B64[d.id] } },
      { type: "text", text: context(d), cache_control: { type: "ephemeral" } },
    ] },
    { role: "assistant", content: "네, 문제와 풀이를 확인했어요. 궁금한 점을 물어보세요." },
    ...hist,
  ];

  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("X-Accel-Buffering", "no");
  const send = (o) => res.write(`data: ${JSON.stringify(o)}\n\n`);

  const ac = new AbortController();
  res.on("close", () => ac.abort());
  try {
    const stream = client.beta.messages.stream({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM,
      thinking: { type: "adaptive" },
      output_config: { effort: "low" },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      messages: msgs,
    }, { signal: ac.signal });
    stream.on("text", (t) => send({ t }));
    const final = await stream.finalMessage();
    if (final.stop_reason === "refusal") send({ t: "\n\n(이 질문에는 답하기 어려워요. 문제와 관련된 질문으로 다시 물어봐 주세요.)" });
    if (final.stop_reason === "max_tokens") send({ t: "\n\n(답이 길어 여기서 끊었어요. 이어서 물어봐 주세요.)" });
    const u = final.usage || {};
    console.log(`chat ${d.id} ip=${req.ip} in=${u.input_tokens} cache_r=${u.cache_read_input_tokens} out=${u.output_tokens} day=${dayCount}`);
    send({ done: true });
  } catch (e) {
    if (ac.signal.aborted) return;
    console.error("chat error", e?.status, e?.message);
    const msg = e instanceof Anthropic.RateLimitError ? "지금 질문이 몰려서 잠시 쉬는 중이에요. 조금 뒤에 다시 해 주세요."
      : e instanceof Anthropic.AuthenticationError ? "챗봇 설정(API 키)에 문제가 있어요. 관리자에게 알려 주세요."
      : "답변을 받는 중 문제가 생겼어요. 다시 시도해 주세요.";
    send({ error: msg });
  }
  res.end();
});

app.listen(PORT, () => console.log(`listening on ${PORT}, chat=${!!client}, model=${MODEL}`));
