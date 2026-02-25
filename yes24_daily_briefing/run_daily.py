from __future__ import annotations

import argparse
import json
import os
from datetime import datetime
from zoneinfo import ZoneInfo
from typing import Dict, Any, List, Optional, Tuple

import pandas as pd

from scraper import Yes24Client, parse_book_list, to_dicts
import db as dbm
from report import build_rank_changes, build_markdown_report
from llm import generate_insights_with_openai

LIST_TYPES = [
    ("daily", "daily_bestseller"),
    ("weekly", "weekly_bestseller"),
    ("monthly", "monthly_bestseller"),
]


def load_config(path: str) -> Dict[str, Any]:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def ensure_dir(path: str) -> None:
    os.makedirs(path, exist_ok=True)


def save_csv(path: str, rows: List[Dict[str, Any]]) -> None:
    df = pd.DataFrame(rows)
    df.to_csv(path, index=False, encoding="utf-8-sig")


def pick_now_book_url(cfg: Dict[str, Any], category_number: str, client: Yes24Client) -> Tuple[str, List[Dict[str, Any]]]:
    template = cfg["sources"]["now_book_template"]
    for seq in cfg.get("now_book_elemSeq_try_order", [1, 2, 3, 4, 5]):
        url = template.format(categoryNumber=category_number, elemSeq=seq)
        html = client.fetch(url)
        items = to_dicts(parse_book_list(html))
        if len(items) > 0:
            return url, items
    # fallback: return first try (maybe empty)
    url = template.format(categoryNumber=category_number, elemSeq=cfg.get("now_book_elemSeq_try_order", [1])[0])
    html = client.fetch(url)
    return url, to_dicts(parse_book_list(html))


def _best_row(now_ts: str, cat_key: str, cat_name: str, list_type: str, source_url: str, item: Dict[str, Any], change: Dict[str, Any]) -> Dict[str, Any]:
    gid = item.get("goods_id") or ""
    return {
        "기준시각": now_ts,
        "카테고리키": cat_key,
        "카테고리": cat_name,
        "리스트": list_type,
        "순위": item.get("rank"),
        "변동": change.get("badge", "-"),
        "이전순위": "" if change.get("prev_rank") is None else change.get("prev_rank"),
        "상품ID": gid,
        "상품명": item.get("title"),
        "저자": item.get("author") or "",
        "출판사": item.get("publisher") or "",
        "출간": item.get("pub_date") or "",
        "판매지수": "" if item.get("sales_index") is None else item.get("sales_index"),
        "평점": "" if item.get("rating") is None else item.get("rating"),
        "리뷰수": "" if item.get("review_count") is None else item.get("review_count"),
        "URL": item.get("url") or "",
        "출처URL": source_url,
    }


def _simple_row(now_ts: str, cat_key: str, cat_name: str, source_url: str, item: Dict[str, Any]) -> Dict[str, Any]:
    gid = item.get("goods_id") or ""
    return {
        "기준시각": now_ts,
        "카테고리키": cat_key,
        "카테고리": cat_name,
        "순위": item.get("rank"),
        "상품ID": gid,
        "상품명": item.get("title"),
        "저자": item.get("author") or "",
        "출판사": item.get("publisher") or "",
        "출간": item.get("pub_date") or "",
        "판매지수": "" if item.get("sales_index") is None else item.get("sales_index"),
        "평점": "" if item.get("rating") is None else item.get("rating"),
        "리뷰수": "" if item.get("review_count") is None else item.get("review_count"),
        "URL": item.get("url") or "",
        "출처URL": source_url,
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--config", default="config.json")
    ap.add_argument("--db", default="./output/yes24.sqlite")
    ap.add_argument("--out", default="./output")
    ap.add_argument("--no-llm", action="store_true", help="LLM 요약 문장 생성 비활성화")

    # Google Sheets (optional)
    ap.add_argument("--no-gsheet", action="store_true", help="구글시트 동기화 비활성화")
    ap.add_argument("--gsheet-id", default=os.getenv("GSHEET_ID"), help="Google Spreadsheet ID (URL의 /d/.../edit 중 ... 부분)")
    ap.add_argument("--gsheet-creds", default=os.getenv("GOOGLE_SERVICE_ACCOUNT_FILE"), help="Service Account JSON 파일 경로(옵션)")
    ap.add_argument("--gsheet-prefix", default=os.getenv("GSHEET_PREFIX", "YES24"), help="탭 이름 접두어 (기본: YES24)")
    ap.add_argument("--gsheet-no-history", action="store_true", help="HISTORY 탭 append를 하지 않고 LATEST만 갱신")

    args = ap.parse_args()

    cfg = load_config(args.config)
    tz = ZoneInfo(cfg.get("timezone", "Asia/Seoul"))
    now = datetime.now(tz)
    now_ts = now.strftime("%Y-%m-%d %H:%M")

    ensure_dir(args.out)
    out_day_dir = os.path.join(args.out, now.strftime("%Y-%m-%d"))
    ensure_dir(out_day_dir)

    conn = dbm.connect(args.db)
    dbm.init_db(conn)

    client = Yes24Client(
        user_agent=cfg["request"]["user_agent"],
        timeout_sec=int(cfg["request"]["timeout_sec"]),
        retries=int(cfg["request"]["retries"]),
        sleep_between_requests_sec=float(cfg["request"]["sleep_between_requests_sec"]),
    )

    top_n = int(cfg["output"]["top_n"])
    max_list_items = int(cfg["output"].get("max_list_items_in_report", 60))

    # for Google Sheets
    best_sheet_rows: List[Dict[str, Any]] = []
    now_sheet_rows: List[Dict[str, Any]] = []
    choice_sheet_rows: List[Dict[str, Any]] = []
    new_sheet_rows: List[Dict[str, Any]] = []

    # report assembly
    report_lines: List[str] = []
    report_lines.append(f"{now_ts} 기준 예스24 참고서 시장 데일리 브리핑")
    report_lines.append("")
    report_lines.append("※ 변동 표기: ▲상승 / ▼하락 / NEW 신규진입")
    report_lines.append("")

    for cat in cfg["categories"]:
        cat_key = cat["key"]
        cat_name = cat["name"]
        cat_num = cat["categoryNumber"]

        # 1) daily/weekly/monthly bestseller
        list_results: Dict[str, Tuple[List[Dict[str, Any]], Dict[str, Dict[str, Any]]]] = {}

        for list_type, source_key in LIST_TYPES:
            url = cfg["sources"][source_key].format(categoryNumber=cat_num)
            html = client.fetch(url)
            items = to_dicts(parse_book_list(html, top_n=top_n))

            snapshot_id = dbm.insert_snapshot(
                conn,
                collected_at=now.isoformat(),
                category_key=cat_key,
                category_name=cat_name,
                list_type=list_type,
                source_url=url,
            )
            dbm.insert_items(conn, snapshot_id, items)

            prev = dbm.get_latest_snapshot_before(conn, category_key=cat_key, list_type=list_type, collected_at=now.isoformat())
            prev_items = None
            if prev:
                prev_items = dbm.get_items_by_snapshot(conn, prev[0])

            changes = build_rank_changes(items, prev_items)
            list_results[list_type] = (items, changes)

            # save csv
            save_csv(os.path.join(out_day_dir, f"{cat_key}_{list_type}_top{top_n}.csv"), items)

            # rows for Google Sheets
            for it in items[:top_n]:
                ch = changes.get(it.get("goods_id"), {}) if it.get("goods_id") else {}
                best_sheet_rows.append(_best_row(now_ts, cat_key, cat_name, list_type, url, it, ch))

        # 2) now book
        now_url, now_items = pick_now_book_url(cfg, cat_num, client)
        save_csv(os.path.join(out_day_dir, f"{cat_key}_now_book.csv"), now_items)
        for it in now_items:
            now_sheet_rows.append(_simple_row(now_ts, cat_key, cat_name, now_url, it))

        # 3) yes24 choice
        choice_url = cfg["sources"]["yes24_choice"].format(categoryNumber=cat_num)
        choice_html = client.fetch(choice_url)
        choice_items = to_dicts(parse_book_list(choice_html))
        save_csv(os.path.join(out_day_dir, f"{cat_key}_yes24_choice.csv"), choice_items)
        for it in choice_items:
            choice_sheet_rows.append(_simple_row(now_ts, cat_key, cat_name, choice_url, it))

        # 4) new product
        new_url = cfg["sources"]["newproduct"].format(categoryNumber=cat_num)
        new_html = client.fetch(new_url)
        new_items = to_dicts(parse_book_list(new_html))
        save_csv(os.path.join(out_day_dir, f"{cat_key}_newproduct.csv"), new_items)
        for it in new_items:
            new_sheet_rows.append(_simple_row(now_ts, cat_key, cat_name, new_url, it))

        # markdown per category
        report_lines.append(
            build_markdown_report(
                now_ts=now_ts,
                category_name=cat_name,
                daily=list_results["daily"],
                weekly=list_results["weekly"],
                monthly=list_results["monthly"],
                now_book=now_items,
                choice=choice_items,
                newproduct=new_items,
                top_n=top_n,
                max_list_items=max_list_items,
            )
        )
        report_lines.append("")

    # optional cross-category insights via LLM
    if not args.no_llm:
        prompt = (
            "아래는 예스24 초/중/고 참고서 데일리 브리핑 원자료입니다.\n"
            "1) 급상승/신규진입/하락 요인을 교육 트렌드(개정 교육과정, 학기/시험 시즌, 과목 수요) 관점으로 연결해 8~12줄로 요약\n"
            "2) 다음 1주 관측 포인트 5개(불릿)\n"
            "3) 주목할 키워드 5개(해시태그)\n\n"
            + "\n".join(report_lines[-2000:])  # safety: last part only
        )
        llm_text = generate_insights_with_openai(prompt)
        if llm_text:
            report_lines.append("## 종합 리뷰 및 시사점")
            report_lines.append(llm_text)
            report_lines.append("")
        else:
            report_lines.append("## 종합 리뷰 및 시사점")
            report_lines.append("- (선택) OPENAI_API_KEY가 설정되지 않아 LLM 요약은 생략되었습니다.")
            report_lines.append("")
    else:
        report_lines.append("## 종합 리뷰 및 시사점")
        report_lines.append("- (설정) --no-llm 옵션으로 LLM 요약을 비활성화했습니다.")
        report_lines.append("")

    md_path = os.path.join(out_day_dir, "briefing.md")
    full_report_text = "\n".join(report_lines)
    with open(md_path, "w", encoding="utf-8") as f:
        f.write(full_report_text)

    print(f"Saved: {md_path}")

    # Google Sheets sync
    if (not args.no_gsheet) and args.gsheet_id:
        try:
            from gsheets import sync_to_google_sheets
            sync_to_google_sheets(
                spreadsheet_id=args.gsheet_id,
                creds_path=args.gsheet_creds or None,
                prefix=args.gsheet_prefix,
                now_ts=now_ts,
                best_rows=best_sheet_rows,
                now_rows=now_sheet_rows,
                choice_rows=choice_sheet_rows,
                new_rows=new_sheet_rows,
                briefing_text=full_report_text,
                write_history=(not args.gsheet_no_history),
            )
            print(f"Synced to Google Sheets: {args.gsheet_id}")
        except Exception as e:
            print(f"Google Sheets sync failed: {e}")
    else:
        if not args.no_gsheet:
            print("GSHEET_ID가 없어 구글시트 동기화를 건너뜁니다. (환경변수 GSHEET_ID 또는 --gsheet-id 설정)")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
