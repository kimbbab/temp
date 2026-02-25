from __future__ import annotations

import re
import time
from dataclasses import dataclass, asdict
from typing import Optional, List, Dict, Any
from urllib.parse import urljoin, urlparse
import requests
from bs4 import BeautifulSoup

NUM_RE = re.compile(r"(\d+[\d,]*)")

@dataclass
class BookItem:
    rank: int
    goods_id: str
    title: str
    url: str
    author: Optional[str] = None
    publisher: Optional[str] = None
    pub_date: Optional[str] = None
    sales_index: Optional[int] = None
    rating: Optional[float] = None
    review_count: Optional[int] = None

def _text_one(el, selector: str) -> Optional[str]:
    if el is None:
        return None
    found = el.select_one(selector)
    if not found:
        return None
    txt = found.get_text(" ", strip=True)
    return txt or None

def _parse_int_from_text(txt: Optional[str]) -> Optional[int]:
    if not txt:
        return None
    m = NUM_RE.search(txt.replace(" ", ""))
    if not m:
        return None
    try:
        return int(m.group(1).replace(",", ""))
    except ValueError:
        return None

def _parse_float_from_text(txt: Optional[str]) -> Optional[float]:
    if not txt:
        return None
    m = re.search(r"(\d+\.\d+|\d+)", txt)
    if not m:
        return None
    try:
        return float(m.group(1))
    except ValueError:
        return None

def _goods_id_from_url(url: str) -> str:
    # e.g. https://www.yes24.com/product/goods/154183839
    path = urlparse(url).path.rstrip("/")
    # last segment
    seg = path.split("/")[-1]
    # sometimes there are query params; already removed
    return seg

class Yes24Client:
    def __init__(self, user_agent: str, timeout_sec: int = 20, retries: int = 3, sleep_between_requests_sec: float = 1.0):
        self.session = requests.Session()
        self.headers = {
            "User-Agent": user_agent,
            "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
        }
        self.timeout_sec = timeout_sec
        self.retries = retries
        self.sleep = sleep_between_requests_sec

    def fetch(self, url: str) -> str:
        last_err = None
        for attempt in range(1, self.retries + 1):
            try:
                r = self.session.get(url, headers=self.headers, timeout=self.timeout_sec)
                r.raise_for_status()
                time.sleep(self.sleep)
                return r.text
            except Exception as e:
                last_err = e
                # backoff
                time.sleep(min(2 ** attempt, 10))
        raise RuntimeError(f"Failed to fetch {url}: {last_err}")

def parse_book_list(html: str, *, top_n: Optional[int] = None) -> List[BookItem]:
    """Parse YES24 list pages that use the common 'yesBestList' + 'itemUnit' structure.

    Works for:
    - /product/category/bestseller
    - /product/category/weekbestseller
    - /product/category/monthbestseller
    - /product/category/newproduct
    - /product/category/more/...

    If the page structure changes, adjust selectors here.
    """
    soup = BeautifulSoup(html, "lxml")

    parent = soup.select_one("#yesBestList") or soup
    items = parent.select(".itemUnit")
    if not items:
        # fallback: sometimes container differs
        items = soup.select(".itemUnit")

    results: List[BookItem] = []
    for idx, it in enumerate(items, start=1):
        a = it.select_one("a.gd_name") or it.select_one(".gd_name a")
        if not a:
            continue
        title = a.get_text(" ", strip=True)
        href = a.get("href", "")
        url = urljoin("https://www.yes24.com", href)
        goods_id = _goods_id_from_url(url)

        author = _text_one(it, ".info_auth") or _text_one(it, ".authPub.info_auth")
        publisher = _text_one(it, ".info_pub") or _text_one(it, ".authPub.info_pub")
        pub_date = _text_one(it, ".info_date") or _text_one(it, ".authPub.info_date")

        sales_text = _text_one(it, ".saleNum")
        sales_index = _parse_int_from_text(sales_text)

        review_text = _text_one(it, ".rating_rvCount")
        review_count = _parse_int_from_text(review_text)

        rating_text = _text_one(it, ".rating_grade .yes_b") or _text_one(it, ".rating_grade")
        rating = _parse_float_from_text(rating_text)

        results.append(
            BookItem(
                rank=idx,
                goods_id=goods_id,
                title=title,
                url=url,
                author=author,
                publisher=publisher,
                pub_date=pub_date,
                sales_index=sales_index,
                rating=rating,
                review_count=review_count,
            )
        )
        if top_n and len(results) >= top_n:
            break
    return results

def to_dicts(items: List[BookItem]) -> List[Dict[str, Any]]:
    return [asdict(x) for x in items]
