from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime

def change_badge(prev_rank: Optional[int], curr_rank: int) -> str:
    if prev_rank is None:
        return "NEW"
    delta = prev_rank - curr_rank
    if delta > 0:
        return f"▲{delta}"
    if delta < 0:
        return f"▼{abs(delta)}"
    return "-"

def build_rank_changes(curr_items: List[Dict[str, Any]], prev_items: Optional[List[Dict[str, Any]]]) -> Dict[str, Dict[str, Any]]:
    """Return per goods_id: {prev_rank, curr_rank, badge}"""
    prev_rank_map = {it["goods_id"]: int(it["rank"]) for it in (prev_items or [])}
    out: Dict[str, Dict[str, Any]] = {}
    for it in curr_items:
        gid = it["goods_id"]
        curr_rank = int(it["rank"])
        pr = prev_rank_map.get(gid)
        out[gid] = {"prev_rank": pr, "curr_rank": curr_rank, "badge": change_badge(pr, curr_rank)}
    return out

def render_top15_line(curr_items: List[Dict[str, Any]], changes: Dict[str, Dict[str, Any]], top_n: int = 15) -> str:
    parts = []
    for it in curr_items[:top_n]:
        gid = it["goods_id"]
        badge = changes.get(gid, {}).get("badge", "-")
        parts.append(f'{it["rank"]}위({badge}) {it["title"]}')
    return " | ".join(parts)

def render_table(curr_items: List[Dict[str, Any]], changes: Dict[str, Dict[str, Any]], top_n: int = 15) -> str:
    lines = []
    lines.append("|순위|변동|상품명|판매지수|평점|리뷰수|URL|")
    lines.append("|---:|:---:|---|---:|---:|---:|---|")
    for it in curr_items[:top_n]:
        gid = it["goods_id"]
        badge = changes.get(gid, {}).get("badge", "-")
        sales = it.get("sales_index") or ""
        rating = it.get("rating") if it.get("rating") is not None else ""
        reviews = it.get("review_count") if it.get("review_count") is not None else ""
        # URL은 마크다운 링크로 만들지 않고 원문 그대로 노출
        lines.append(f'|{it["rank"]}|{badge}|{it["title"]}|{sales}|{rating}|{reviews}|{it["url"]}|')
    return "\n".join(lines)

def render_list_bullets(items: List[Dict[str, Any]], max_items: int = 60) -> str:
    lines = []
    for it in items[:max_items]:
        lines.append(f'- {it["title"]} | {it["url"]}')
    if len(items) > max_items:
        lines.append(f'- ... (총 {len(items)}개, 나머지는 CSV 파일 참고)')
    return "\n".join(lines)

def summarize_movers(curr_items: List[Dict[str, Any]], changes: Dict[str, Dict[str, Any]], top_k: int = 5) -> str:
    movers = []
    for it in curr_items:
        gid = it["goods_id"]
        pr = changes.get(gid, {}).get("prev_rank")
        if pr is None:
            continue
        delta = pr - int(it["rank"])
        movers.append((abs(delta), delta, it["title"]))
    movers.sort(reverse=True)
    top = movers[:top_k]
    if not top:
        return "변동 데이터가 아직 누적되지 않았습니다. (첫 실행 또는 기준일 부족)"
    lines = []
    for _, delta, title in top:
        arrow = "상승" if delta > 0 else "하락" if delta < 0 else "유지"
        lines.append(f"- {title} ({arrow} {abs(delta)}칸)")
    return "\n".join(lines)

def build_markdown_report(
    *,
    now_ts: str,
    category_name: str,
    daily: Tuple[List[Dict[str, Any]], Dict[str, Dict[str, Any]]],
    weekly: Tuple[List[Dict[str, Any]], Dict[str, Dict[str, Any]]],
    monthly: Tuple[List[Dict[str, Any]], Dict[str, Dict[str, Any]]],
    now_book: Optional[List[Dict[str, Any]]] = None,
    choice: Optional[List[Dict[str, Any]]] = None,
    newproduct: Optional[List[Dict[str, Any]]] = None,
    top_n: int = 15,
    max_list_items: int = 60,
) -> str:
    daily_items, daily_changes = daily
    weekly_items, weekly_changes = weekly
    monthly_items, monthly_changes = monthly

    md = []
    md.append(f"## {category_name}")
    md.append("")
    md.append("### 1) 베스트셀러 TOP15 (일/주/월)")
    md.append("")
    md.append("🗓️ 일별 TOP15 (전일 대비)")
    md.append(render_top15_line(daily_items, daily_changes, top_n=top_n))
    md.append("")
    md.append("📆 주별 TOP15 (전주 대비)")
    md.append(render_top15_line(weekly_items, weekly_changes, top_n=top_n))
    md.append("")
    md.append("🧾 월별 TOP15 (전월 대비)")
    md.append(render_top15_line(monthly_items, monthly_changes, top_n=top_n))
    md.append("")
    md.append("🔎 변동 포인트(일별 기준)")
    md.append(summarize_movers(daily_items[:top_n], daily_changes, top_k=5))
    md.append("")
    md.append("#### (상세) 일별 TOP15 테이블")
    md.append(render_table(daily_items, daily_changes, top_n=top_n))
    md.append("")
    md.append("#### (상세) 주별 TOP15 테이블")
    md.append(render_table(weekly_items, weekly_changes, top_n=top_n))
    md.append("")
    md.append("#### (상세) 월별 TOP15 테이블")
    md.append(render_table(monthly_items, monthly_changes, top_n=top_n))
    md.append("")

    if now_book is not None:
        md.append("### 2) 지금 이 책")
        md.append(render_list_bullets(now_book, max_items=max_list_items))
        md.append("")
    if choice is not None:
        md.append("### 3) 예스24의 선택")
        md.append(render_list_bullets(choice, max_items=max_list_items))
        md.append("")
    if newproduct is not None:
        md.append("### 4) 주목할 신상품")
        md.append(render_list_bullets(newproduct, max_items=max_list_items))
        md.append("")
    return "\n".join(md)
