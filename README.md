# 수능 수학, 한 줄씩 천천히 (2027학년도 수능 수학)

수학 초보자를 위한 학습 사이트. 46문항 문제 이미지 · 직접 답 입력 · 한 줄씩 펼치는 풀이 · 문제별 Claude 질문(챗봇).

- 실행: `npm install && npm start` (기본 포트 3000)
- 환경변수: `ANTHROPIC_API_KEY`(필수, 챗봇), `CLAUDE_MODEL`(기본 claude-opus-5-5),
  `LIMIT_PER_MIN`(IP당 1분, 기본 6), `LIMIT_PER_DAY`(IP당 하루, 기본 40), `LIMIT_GLOBAL_DAY`(전체 하루, 기본 1500)
- 데이터: `public/data.json` (문항별 문제 옮김 q, 개념 concepts, 한 줄 풀이 steps[t,h], 정답 ans)
