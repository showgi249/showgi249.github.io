import os
import json
from datetime import datetime, timezone

import requests


OUTPUT_FILE = "content.json"


def get_youtube_videos():
    api_key = os.getenv("YOUTUBE_API_KEY")
    handle = os.getenv("YOUTUBE_HANDLE", "showgi249")

    if not api_key:
        return []

    # العثور على القناة بواسطة الـ Handle
    channel_url = "https://www.googleapis.com/youtube/v3/channels"

    params = {
        "part": "contentDetails",
        "forHandle": handle,
        "key": api_key
    }

    response = requests.get(channel_url, params=params, timeout=30)
    response.raise_for_status()

    data = response.json()

    if not data.get("items"):
        return []

    uploads_playlist = data["items"][0]["contentDetails"]["relatedPlaylists"]["uploads"]

    # جلب الفيديوهات
    playlist_url = "https://www.googleapis.com/youtube/v3/playlistItems"

    params = {
        "part": "snippet,contentDetails",
        "playlistId": uploads_playlist,
        "maxResults": 50,
        "key": api_key
    }

    response = requests.get(playlist_url, params=params, timeout=30)
    response.raise_for_status()

    data = response.json()

    posts = []

    for item in data.get("items", []):
        snippet = item.get("snippet", {})
        resource = snippet.get("resourceId", {})

        video_id = resource.get("videoId")

        if not video_id:
            continue

        posts.append({
            "id": f"youtube-{video_id}",
            "platform": "youtube",
            "type": "video",
            "title": snippet.get("title", ""),
            "text": snippet.get("description", ""),
            "url": f"https://www.youtube.com/watch?v={video_id}",
            "thumbnail": (
                f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg"
            ),
            "published_at": snippet.get("publishedAt", "")
        })

    return posts


def main():
    posts = []

    try:
        posts.extend(get_youtube_videos())
    except Exception as e:
        print("YouTube sync error:", e)

    content = {
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "posts": posts
    }

    with open(OUTPUT_FILE, "w", encoding="utf-8") as file:
        json.dump(content, file, ensure_ascii=False, indent=2)

    print(f"Saved {len(posts)} posts to {OUTPUT_FILE}")


if __name__ == "__main__":
    main()