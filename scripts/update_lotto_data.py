import os
import json
import urllib.request
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

BASE_RAW_URL = "https://raw.githubusercontent.com/smok95/lotto/main"
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "public", "data")
os.makedirs(OUTPUT_DIR, exist_ok=True)

def fetch_json(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, context=ctx, timeout=15) as res:
        return json.loads(res.read().decode("utf-8"))

def main():
    print("Checking latest lotto draw...")
    latest = fetch_json(f"{BASE_RAW_URL}/results/latest.json")
    latest_draw = latest.get("draw_no")
    print(f"Latest remote draw_no: {latest_draw}")

    history_path = os.path.join(OUTPUT_DIR, "lotto_history.json")
    stores_path = os.path.join(OUTPUT_DIR, "lotto_stores_compact.json")

    current_latest_draw = 0
    if os.path.exists(history_path):
        with open(history_path, "r", encoding="utf-8") as f:
            hist = json.load(f)
            if hist:
                current_latest_draw = hist[0].get("draw_no", 0)

    print(f"Current local draw_no: {current_latest_draw}")

    if latest_draw <= current_latest_draw:
        print("Already up-to-date. Exiting.")
        return

    # 1. History 업데이트
    all_results = fetch_json(f"{BASE_RAW_URL}/results/all.json")
    all_results.sort(key=lambda x: x.get("draw_no", 0), reverse=True)
    with open(history_path, "w", encoding="utf-8") as f:
        json.dump(all_results[:150], f, ensure_ascii=False, separators=(",", ":"))
    print(f"Updated lotto_history.json up to draw {latest_draw}")

    # 2. 신규 회차 판매점 병합
    if os.path.exists(stores_path):
        with open(stores_path, "r", encoding="utf-8") as f:
            stores_list = json.load(f)
    else:
        stores_list = []

    stores_map = {s["id"]: s for s in stores_list}

    for drw in range(current_latest_draw + 1, latest_draw + 1):
        try:
            new_stores = fetch_json(f"{BASE_RAW_URL}/winning-stores/{drw}.json")
            for item in new_stores:
                name = item.get("name", "").strip()
                addr = item.get("address", "").strip()
                lat = item.get("lat")
                lng = item.get("lng")
                comb = item.get("combination", "").strip()
                if not name or not addr:
                    continue

                parts = addr.split()
                reg = parts[0] if parts else ""
                sig = parts[1] if len(parts) > 1 else ""
                if "동행복권" in addr or "dhlottery" in addr or "인터넷" in name:
                    reg = "온라인"
                    sig = "동행복권"
                    lat = 37.482063
                    lng = 127.015785

                if not lat or not lng:
                    continue

                key = f"{name}_{reg}_{sig}"
                if key not in stores_map:
                    stores_map[key] = {
                        "id": key,
                        "name": name,
                        "addr": addr,
                        "lat": round(lat, 6),
                        "lng": round(lng, 6),
                        "reg": reg,
                        "sig": sig,
                        "cnt": 0,
                        "grd": "일반",
                        "auto": 0,
                        "man": 0,
                        "rec": []
                    }

                s = stores_map[key]
                s["cnt"] += 1
                if "자동" in comb and "반자동" not in comb:
                    s["auto"] += 1
                elif "수동" in comb:
                    s["man"] += 1

                if drw not in s["rec"]:
                    s["rec"] = sorted([drw] + s["rec"], reverse=True)[:3]

                cnt = s["cnt"]
                s["grd"] = "다이아" if cnt >= 15 else ("골드" if cnt >= 10 else ("실버" if cnt >= 5 else "일반"))

            print(f"Merged draw {drw} winning stores.")
        except Exception as e:
            print(f"Failed draw {drw}: {e}")

    updated_list = sorted(stores_map.values(), key=lambda x: x["cnt"], reverse=True)
    with open(stores_path, "w", encoding="utf-8") as f:
        json.dump(updated_list, f, ensure_ascii=False, separators=(",", ":"))
    print(f"Saved {len(updated_list)} stores to lotto_stores_compact.json.")

if __name__ == "__main__":
    main()
