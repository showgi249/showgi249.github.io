import os
import json
import requests

API_KEY = os.getenv("YOUTUBE_API_KEY")
HANDLE = os.getenv("YOUTUBE_HANDLE", "showgi249")

def get_youtube_videos():
    if not API_KEY:
        print("خطأ: لم يتم ضبط YOUTUBE_API_KEY في إعدادات Secrets.")
        return []

    # التأكد من وجود علامة @ في بداية اسم المقبض (Handle)
    clean_handle = HANDLE if HANDLE.startswith("@") else f"@{HANDLE}"
    
    # 1. جلب معرّف القائمة التشغيلية (Uploads Playlist) باستخدام forHandle
    url = "https://www.googleapis.com/youtube/v3/channels"
    params = {
        "part": "contentDetails",
        "forHandle": clean_handle,
        "key": API_KEY
    }
    
    response = requests.get(url, params=params)
    
    if response.status_code != 200:
        print(f"فشل الطلب مع رمز الحالة {response.status_code}: {response.text}")
        return []

    data = response.json()

    if not data.get("items"):
        print(f"لم يتم العثور على قناة يوتيوب بالمقبض: {clean_handle}")
        print("استجابة الـ API:", data)
        return []

    uploads_playlist = data["items"][0]["contentDetails"]["relatedPlaylists"]["uploads"]

    # 2. جلب آخر 10 فيديوهات من قائمة التشغيل
    playlist_url = "https://www.googleapis.com/youtube/v3/playlistItems"
    playlist_params = {
        "part": "snippet",
        "playlistId": uploads_playlist,
        "maxResults": 10,
        "key": API_KEY
    }

    playlist_response = requests.get(playlist_url, params=playlist_params)
    if playlist_response.status_code != 200:
        print(f"فشل جلب فيديوهات القائمة: {playlist_response.text}")
        return []

    playlist_data = playlist_response.json()
    videos = []

    for item in playlist_data.get("items", []):
        snippet = item.get("snippet", {})
        videos.append({
            "title": snippet.get("title"),
            "description": snippet.get("description"),
            "videoId": snippet.get("resourceId", {}).get("videoId"),
            "publishedAt": snippet.get("publishedAt"),
            "thumbnail": snippet.get("thumbnails", {}).get("high", {}).get("url")
        })

    return videos

def update_content_json():
    videos = get_youtube_videos()
    content = {"youtube_videos": videos}
    
    with open("content.json", "w", encoding="utf-8") as f:
        json.dump(content, f, ensure_ascii=False, indent=2)
    
    print(f"تمت تحديث content.json بنجاح وبعدد {len(videos)} فيديو.")

if __name__ == "__main__":
    update_content_json()
