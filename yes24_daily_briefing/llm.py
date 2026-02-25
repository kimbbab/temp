from __future__ import annotations

import os
from typing import Optional

def generate_insights_with_openai(prompt: str) -> Optional[str]:
    """Optional: Generate insights text using OpenAI Responses API.

    Requires:
      - OPENAI_API_KEY env var
      - openai python package
    """
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return None

    model = os.getenv("OPENAI_MODEL", "gpt-4o")

    try:
        from openai import OpenAI
        client = OpenAI(api_key=api_key)
        resp = client.responses.create(
            model=model,
            input=[
                {
                    "role": "system",
                    "content": "당신은 한국어 시장 분석 리포터입니다. 출력은 한국어로, 불릿과 이모지를 적절히 사용하고, URL은 원문 그대로 노출하세요."
                },
                {"role": "user", "content": prompt},
            ],
        )
        return getattr(resp, "output_text", None) or None
    except Exception:
        return None
