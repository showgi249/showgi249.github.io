"""
SHOWGI249 — مزامنة موحدة للمحتوى
يجمع: YouTube + Telegram
يكتب النتيجة في: content.json
"""

import os
import re
import json
import time
from datetime import datetime, timezone
from pathlib import Path

import requests
from bs4 import BeautifulSoup

# ============ الإعدادات ============
YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")
YOUTUBE_HANDLE = os.getenv("YOUTUBE_HANDLE", "showgi249")
TELEGRAM_CHANNEL = os.getenv("TELEGRAM_CHANNEL", "showgi249")

OUTPUT = Path("content.json")
MAX_YOUTUBE = 15
TIMEOUT = 15
RETRIES = 3


def log(msg: str) -> None:
    print(f"[{datetime.now(timezone.utc).isoformat(timespec='seconds')}] {msg}", flush=True)


def safe_get(url, params=None, headers=None):
    for attempt in range(1, RETRIES + 1):
        try:
            r = requests.get(url, params=params, headers=headers, timeout=TIMEOUT)
            if r.status_code == 200:
                return r
            log(f"⚠️  محاولة {attempt}: HTTP {r.status_code} — {r.text[:150]}")
        except requests.RequestException as e:
            log(f"⚠️  محاولة {attempt}: {e}")
        time.sleep(2 ** attempt)
    return None


# ============ YouTube ============
def fetch_youtube():
    if not YOUTUBE_API_KEY:
        log("❌ YOUTUBE_API_KEY غير موجود في Secrets.")
        return []

    handle = YOUTUBE_HANDLE if YOUTUBE_HANDLE.startswith("@") else f"@{YOUTUBE_HANDLE}"
    log(f"📡 جلب بيانات قناة YouTube: {handle}")

    r = safe_get(
        "https://www.googleapis.com/youtube/v3/channels",
        {"part": "contentDetails", "forHandle": handle, "key": YOUTUBE_API_KEY},
    )
    if not r:
        return []

    data = r.json()
    if not data.get("items"):
        log(f"❌ لا توجد قناة للمقبض {handle}")
        return []

    playlist = data["items"][0]["contentDetails"]["relatedPlaylists"]["uploads"]
    log(f"✅ وجدت القناة. Uploads Playlist: {playlist}")

    r = safe_get(
        "https://www.googleapis.com/youtube/v3/playlistItems",
        {"part": "snippet", "playlistId": playlist, "maxResults": MAX_YOUTUBE, "key": YOUTUBE_API_KEY},
    )
    if not r:
        return []

    videos = []
    for item in r.json().get("items", []):
        sn = item.get("snippet", {})
        vid = sn.get("resourceId", {}).get("videoId")
        if not vid:
            continue
        videos.append({
            "id": vid,
            "platform": "youtube",
            "type": "video",
            "title": sn.get("title", ""),
            "text": sn.get("description", ""),
            "url": f"https://www.youtube.com/watch?v={vid}",
            "media": sn.get("thumbnails", {}).get("high", {}).get("url"),
            "date": sn.get("publishedAt"),
        })
    log(f"✅ YouTube: {len(videos)} فيديو")
    return videos


# ============ Telegram ============
def fetch_telegram():
    url = f"https://t.me/s/{TELEGRAM_CHANNEL}"
    log(f"📡 جلب قناة Telegram: {url}")

    r = safe_get(url, headers={"User-Agent": "Mozilla/5.0 (compatible; SHOWGI249/1.0)"})
    if not r:
        return []

    soup = BeautifulSoup(r.text, "html.parser")
    posts = []

    for wrap in soup.select(".tgme_widget_message_wrap"):
        msg = wrap.select_one(".tgme_widget_message")
        if not msg:
            continue

        post_id = msg.get("data-post", "")
        if not post_id:
            continue

        text_el = msg.select_one(".tgme_widget_message_text")
        text = text_el.get_text("\n", strip=True) if text_el else ""

        time_el = msg.select_one("time[datetime]")
        date = time_el["datetime"] if time_el else None

        img_el = msg.select_one(".tgme_widget_message_photo_wrap")
        media = None
        if img_el and img_el.has_attr("style"):
            m = re.search(r"url\(['\"]?(.*?)['\"]?\)", img_el["style"])
            if m:
                media = m.group(1)

        is_video = bool(msg.select_one(".tgme_widget_message_video_wrap"))

        posts.append({
            "id": post_id.replace("/", "_"),
            "platform": "telegram",
            "type": "video" if is_video else ("image" if media else "text"),
            "title": "",
            "text": text,
            "url": f"https://t.me/{post_id}",
            "media": media,
            "date": date,
        })

    log(f"✅ Telegram: {len(posts)} منشور")
    return posts


# ============ Main ============
def main():
    log("=" * 55)
    log("🚀 بدء مزامنة SHOWGI249")
    log("=" * 55)

    all_posts = []
    all_posts.extend(fetch_youtube())
    all_posts.extend(fetch_telegram())

    all_posts.sort(key=lambda p: p.get("date") or "", reverse=True)

    payload = {
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "posts": all_posts,
    }

    OUTPUT.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    log(f"🎉 تم إنشاء {OUTPUT} بإجمالي {len(all_posts)} منشور")


if __name__ == "__main__":
    main()