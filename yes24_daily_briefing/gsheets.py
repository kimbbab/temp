from __future__ import annotations

import base64
import json
import os
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Sequence, Tuple

# Google deps are optional until you enable Sheets sync.
from google.oauth2 import service_account
from googleapiclient.discovery import build

SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]


def _load_service_account_info(
    *,
    creds_path: Optional[str] = None,
    env_file_key: str = "GOOGLE_SERVICE_ACCOUNT_FILE",
    env_json_key: str = "GOOGLE_SERVICE_ACCOUNT_JSON",
    env_json_b64_key: str = "GOOGLE_SERVICE_ACCOUNT_JSON_B64",
) -> Dict[str, Any]:
    """Load service-account JSON from:
    1) explicit creds_path arg
    2) GOOGLE_SERVICE_ACCOUNT_FILE (path)
    3) GOOGLE_SERVICE_ACCOUNT_JSON_B64 (base64)
    4) GOOGLE_SERVICE_ACCOUNT_JSON (raw)
    """
    if creds_path:
        with open(creds_path, "r", encoding="utf-8") as f:
            return json.load(f)

    file_path = os.getenv(env_file_key)
    if file_path:
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)

    json_b64 = os.getenv(env_json_b64_key)
    if json_b64:
        raw = base64.b64decode(json_b64).decode("utf-8")
        return json.loads(raw)

    raw_json = os.getenv(env_json_key)
    if raw_json:
        return json.loads(raw_json)

    raise RuntimeError(
        "Google Sheets 인증정보가 없습니다. "
        "GOOGLE_SERVICE_ACCOUNT_FILE(파일경로) 또는 "
        "GOOGLE_SERVICE_ACCOUNT_JSON(원문) 또는 "
        "GOOGLE_SERVICE_ACCOUNT_JSON_B64(base64) 중 하나를 설정하세요."
    )


def get_sheets_service(creds_path: Optional[str] = None):
    info = _load_service_account_info(creds_path=creds_path)
    creds = service_account.Credentials.from_service_account_info(info, scopes=SCOPES)
    return build("sheets", "v4", credentials=creds)


def get_existing_sheet_titles(service, spreadsheet_id: str) -> Tuple[Dict[str, int], List[str]]:
    meta = service.spreadsheets().get(spreadsheetId=spreadsheet_id).execute()
    title_to_id: Dict[str, int] = {}
    titles: List[str] = []
    for sh in meta.get("sheets", []):
        props = sh.get("properties", {})
        t = props.get("title")
        sid = props.get("sheetId")
        if isinstance(t, str) and isinstance(sid, int):
            title_to_id[t] = sid
            titles.append(t)
    return title_to_id, titles


def ensure_sheets(service, spreadsheet_id: str, sheet_titles: Sequence[str]) -> None:
    title_to_id, _ = get_existing_sheet_titles(service, spreadsheet_id)
    reqs = []
    for title in sheet_titles:
        if title not in title_to_id:
            reqs.append({"addSheet": {"properties": {"title": title}}})
    if reqs:
        service.spreadsheets().batchUpdate(
            spreadsheetId=spreadsheet_id,
            body={"requests": reqs},
        ).execute()


def clear_values(service, spreadsheet_id: str, sheet_name: str) -> None:
    service.spreadsheets().values().clear(
        spreadsheetId=spreadsheet_id,
        range=f"{sheet_name}!A:Z",
        body={},
    ).execute()


def update_values(service, spreadsheet_id: str, sheet_name: str, values: List[List[Any]], start_cell: str = "A1") -> None:
    service.spreadsheets().values().update(
        spreadsheetId=spreadsheet_id,
        range=f"{sheet_name}!{start_cell}",
        valueInputOption="RAW",
        body={"values": values},
    ).execute()


def append_values(service, spreadsheet_id: str, sheet_name: str, values: List[List[Any]]) -> None:
    service.spreadsheets().values().append(
        spreadsheetId=spreadsheet_id,
        range=f"{sheet_name}!A1",
        valueInputOption="RAW",
        insertDataOption="INSERT_ROWS",
        body={"values": values},
    ).execute()


def get_first_row(service, spreadsheet_id: str, sheet_name: str, width: int) -> Optional[List[Any]]:
    # A1:Z1 정도면 충분하지만 width에 맞춰 계산
    end_col = chr(ord("A") + max(0, min(width, 26) - 1))
    rng = f"{sheet_name}!A1:{end_col}1"
    res = service.spreadsheets().values().get(spreadsheetId=spreadsheet_id, range=rng).execute()
    vals = res.get("values") or []
    if not vals:
        return None
    return vals[0]


def dicts_to_values(rows: List[Dict[str, Any]], columns: Sequence[str], include_header: bool = True) -> List[List[Any]]:
    out: List[List[Any]] = []
    if include_header:
        out.append(list(columns))
    for r in rows:
        out.append([("" if r.get(c) is None else r.get(c)) for c in columns])
    return out


def write_latest_table(service, spreadsheet_id: str, sheet_name: str, rows: List[Dict[str, Any]], columns: Sequence[str]) -> None:
    clear_values(service, spreadsheet_id, sheet_name)
    update_values(service, spreadsheet_id, sheet_name, dicts_to_values(rows, columns, include_header=True))


def append_history_table(service, spreadsheet_id: str, sheet_name: str, rows: List[Dict[str, Any]], columns: Sequence[str]) -> None:
    first = get_first_row(service, spreadsheet_id, sheet_name, width=len(columns))
    if not first:
        update_values(service, spreadsheet_id, sheet_name, [list(columns)], start_cell="A1")
    append_values(service, spreadsheet_id, sheet_name, dicts_to_values(rows, columns, include_header=False))


def write_briefing_lines(service, spreadsheet_id: str, sheet_name: str, now_ts: str, text: str) -> None:
    lines = text.splitlines()
    values: List[List[Any]] = []
    values.append(["기준시각", now_ts])
    values.append(["line_no", "text"])
    for i, line in enumerate(lines, start=1):
        values.append([i, line])
    clear_values(service, spreadsheet_id, sheet_name)
    update_values(service, spreadsheet_id, sheet_name, values)


@dataclass
class SheetNames:
    latest_best: str
    history_best: str
    latest_now: str
    latest_choice: str
    latest_new: str
    briefing: str


def default_sheet_names(prefix: str = "YES24") -> SheetNames:
    p = (prefix or "YES24").strip() or "YES24"
    return SheetNames(
        latest_best=f"{p}_BEST_LATEST",
        history_best=f"{p}_BEST_HISTORY",
        latest_now=f"{p}_NOWBOOK_LATEST",
        latest_choice=f"{p}_CHOICE_LATEST",
        latest_new=f"{p}_NEW_LATEST",
        briefing=f"{p}_BRIEFING",
    )


def sync_to_google_sheets(
    *,
    spreadsheet_id: str,
    creds_path: Optional[str],
    prefix: str,
    now_ts: str,
    best_rows: List[Dict[str, Any]],
    now_rows: List[Dict[str, Any]],
    choice_rows: List[Dict[str, Any]],
    new_rows: List[Dict[str, Any]],
    briefing_text: str,
    write_history: bool = True,
) -> None:
    """Sync outputs to Google Sheets.

    - Overwrites *_LATEST tabs each run
    - Optionally appends to *_HISTORY
    """
    service = get_sheets_service(creds_path=creds_path)

    names = default_sheet_names(prefix)
    ensure_sheets(
        service,
        spreadsheet_id,
        [names.latest_best, names.history_best, names.latest_now, names.latest_choice, names.latest_new, names.briefing],
    )

    BEST_COLS = [
        "기준시각",
        "카테고리키",
        "카테고리",
        "리스트",
        "순위",
        "변동",
        "이전순위",
        "상품ID",
        "상품명",
        "저자",
        "출판사",
        "출간",
        "판매지수",
        "평점",
        "리뷰수",
        "URL",
        "출처URL",
    ]

    SIMPLE_COLS = [
        "기준시각",
        "카테고리키",
        "카테고리",
        "순위",
        "상품ID",
        "상품명",
        "저자",
        "출판사",
        "출간",
        "판매지수",
        "평점",
        "리뷰수",
        "URL",
        "출처URL",
    ]

    write_latest_table(service, spreadsheet_id, names.latest_best, best_rows, BEST_COLS)
    write_latest_table(service, spreadsheet_id, names.latest_now, now_rows, SIMPLE_COLS)
    write_latest_table(service, spreadsheet_id, names.latest_choice, choice_rows, SIMPLE_COLS)
    write_latest_table(service, spreadsheet_id, names.latest_new, new_rows, SIMPLE_COLS)
    write_briefing_lines(service, spreadsheet_id, names.briefing, now_ts, briefing_text)

    if write_history:
        append_history_table(service, spreadsheet_id, names.history_best, best_rows, BEST_COLS)
