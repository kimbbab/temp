# YES24 참고서 데일리 브리핑 자동화 (초/중/고)

YES24 카테고리(초등/중등/고등 참고서) 페이지를 매일 수집하여:
- 베스트(일/주/월) TOP15 변동 계산
- "지금 이 책", "예스24의 선택", "신상품" 리스트 수집
- 마크다운 데일리 브리핑 + CSV 산출
- (선택) OpenAI API로 시사점/요약 문장 자동 생성
- (선택) Google Sheets로 자동 업데이트(최신 탭 덮어쓰기 + 히스토리 append)

> 주의: 사이트 robots.txt/약관을 준수하세요. 검색 결과 페이지(/searchCenter/searchResult.aspx) 등 제한 경로는 수집하지 않습니다.

## 1) 설치
```bash
python -m venv .venv
# macOS/Linux
source .venv/bin/activate
# Windows
# .venv\Scripts\activate

pip install -r requirements.txt
```

## 2) 실행
```bash
python run_daily.py --out ./output --db ./output/yes24.sqlite
```

결과물:
- `output/YYYY-MM-DD/briefing.md`
- `output/YYYY-MM-DD/*.csv` (각 섹션별 목록)

## 3) (선택) OpenAI로 요약 문장 생성
환경변수 설정:
```bash
export OPENAI_API_KEY="..."
export OPENAI_MODEL="gpt-4o"
```

LLM 없이 실행:
```bash
python run_daily.py --no-llm --out ./output --db ./output/yes24.sqlite
```

## 4) (선택) Google Sheets 자동 업데이트

### 4-1. 구글시트 준비(1회)
1) Google Spreadsheet를 하나 만듭니다.  
2) Google Cloud Console에서 프로젝트 생성 → **Google Sheets API 활성화**  
3) **Service Account 생성** 후 키(JSON) 다운로드  
4) 만든 Spreadsheet를 **서비스계정 이메일(client_email)** 에 "편집자"로 공유

> 서비스계정 이메일은 JSON 안의 `client_email` 값입니다.

### 4-2. 환경변수 설정(로컬)
Spreadsheet ID는 URL 중간의 `/d/<ID>/edit` 에서 `<ID>` 입니다.

```bash
export GSHEET_ID="your_spreadsheet_id"
export GSHEET_PREFIX="YES24"     # 탭 이름 접두어(선택)
export GOOGLE_SERVICE_ACCOUNT_FILE="/path/to/service_account.json"
```

실행:
```bash
python run_daily.py --out ./output --db ./output/yes24.sqlite
```

### 4-3. 생성/갱신되는 탭
기본적으로 아래 탭을 자동 생성/갱신합니다(접두어는 `GSHEET_PREFIX`):

- `YES24_BEST_LATEST`   : 최신 베스트(일/주/월 + 초/중/고) — 매 실행 **덮어쓰기**
- `YES24_BEST_HISTORY`  : 베스트 히스토리 — 매 실행 **append**
- `YES24_NOWBOOK_LATEST`: 지금 이 책 — 최신 덮어쓰기
- `YES24_CHOICE_LATEST` : 예스24의 선택 — 최신 덮어쓰기
- `YES24_NEW_LATEST`    : 신상품 — 최신 덮어쓰기
- `YES24_BRIEFING`      : 마크다운 브리핑을 라인 단위로 저장

히스토리 append를 끄고 싶으면:
```bash
python run_daily.py --gsheet-no-history --out ./output --db ./output/yes24.sqlite
```

### 4-4. GitHub Actions에서 쓰는 방법(선택)
Repo Secrets에 아래를 추가하세요.

- `GSHEET_ID`
- `GOOGLE_SERVICE_ACCOUNT_JSON_B64` (권장)
- (선택) `OPENAI_API_KEY`

`GOOGLE_SERVICE_ACCOUNT_JSON_B64` 만들기:
- macOS:
  ```bash
  base64 service_account.json | tr -d '\n'
  ```
- Linux:
  ```bash
  base64 -w 0 service_account.json
  ```

## 5) 스케줄러
### cron (리눅스/맥) — 매일 09:00 KST
서버 타임존이 KST가 아니라면 `TZ=Asia/Seoul`을 설정하거나, cron 시간을 조정하세요.
```cron
0 9 * * * cd /path/to/yes24_daily_briefing && /path/to/python run_daily.py --out ./output --db ./output/yes24.sqlite >> ./output/cron.log 2>&1
```

### GitHub Actions (UTC 기준)
KST(UTC+9) 09:00 = UTC 00:00  
`.github/workflows/daily.yml` 참고.  
※ GitHub Actions로 "전일 대비" 변동을 계산하려면 SQLite DB를 캐시/저장해서 다음 실행에 이어 받아야 합니다(워크플로우에 캐시 포함).

## 6) 커스터마이즈
- `config.json`에서 카테고리/URL/수집 개수 등을 조정합니다.
- report 템플릿은 `report.py`에서 조정합니다.
