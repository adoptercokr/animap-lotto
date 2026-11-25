import os
import json
import glob
import shutil
import subprocess
import urllib.request
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

BASE_RAW_URL = "https://raw.githubusercontent.com/smok95/lotto/main"
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT_DIR = os.path.join(ROOT_DIR, "public", "data")
os.makedirs(OUTPUT_DIR, exist_ok=True)


def fetch_json(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, context=ctx, timeout=15) as res:
        return json.loads(res.read().decode("utf-8"))


def main():
    print("Checking latest lotto draw...")
    latest = fetch_json(f"{BASE_RAW_URL}/results/latest.json")
    latest_draw = latest.get("draw_no", 0)
    print(f"Latest remote draw_no: {latest_draw}")

    history_path = os.path.join(OUTPUT_DIR, "lotto_history.json")
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

    # 1. History 업데이트 (2022-01-01 이후 전체)
    all_results = fetch_json(f"{BASE_RAW_URL}/results/all.json")
    filtered_results = [d for d in all_results if d.get("date", "") >= "2022-01-01"]
    filtered_results.sort(key=lambda x: x.get("draw_no", 0), reverse=True)
    with open(history_path, "w", encoding="utf-8") as f:
        json.dump(filtered_results, f, ensure_ascii=False, separators=(",", ":"))
    print(f"Updated lotto_history.json ({len(filtered_results)} draws up to {latest_draw})")

    # 2. 전체 winning-stores 클론 후 1y/6m/3m 포함 완전 재집계
    tmp_repo = os.path.join(ROOT_DIR, "scratch", "tmp_lotto_sync")
    if os.path.exists(tmp_repo):
        shutil.rmtree(tmp_repo, ignore_errors=True)
    os.makedirs(os.path.dirname(tmp_repo), exist_ok=True)

    subprocess.run(
        ["git", "clone", "--depth", "1", "https://github.com/smok95/lotto.git", tmp_repo],
        check=True,
    )

    winning_dir = os.path.join(tmp_repo, "winning-stores")
    json_files = [
        f
        for f in glob.glob(os.path.join(winning_dir, "*.json"))
        if os.path.basename(f).replace(".json", "").isdigit()
        and int(os.path.basename(f).replace(".json", "")) <= latest_draw
    ]

    cut_1y = latest_draw - 51
    cut_6m = latest_draw - 25
    cut_3m = latest_draw - 12

    stores_dict = {}
    for fpath in json_files:
        drw_no = int(os.path.basename(fpath).replace(".json", ""))
        try:
            with open(fpath, "r", encoding="utf-8") as f:
                data = json.load(f)
            for item in data:
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

                key = f"{name}_{reg}_{sig}"
                if key not in stores_dict:
                    stores_dict[key] = {
                        "id": key,
                        "name": name,
                        "addr": addr,
                        "lat": lat,
                        "lng": lng,
                        "reg": reg,
                        "sig": sig,
                        "cnt": 0,
                        "c1y": 0,
                        "c6m": 0,
                        "c3m": 0,
                        "auto": 0,
                        "man": 0,
                        "rec": [],
                    }

                s = stores_dict[key]
                if lat and not s["lat"]:
                    s["lat"] = lat
                if lng and not s["lng"]:
                    s["lng"] = lng

                s["cnt"] += 1
                if drw_no >= cut_1y:
                    s["c1y"] += 1
                if drw_no >= cut_6m:
                    s["c6m"] += 1
                if drw_no >= cut_3m:
                    s["c3m"] += 1

                if "자동" in comb and "반자동" not in comb:
                    s["auto"] += 1
                elif "수동" in comb:
                    s["man"] += 1

                s["rec"].append(drw_no)
        except Exception:
            pass

    compact = []
    for s in stores_dict.values():
        if s["lat"] and s["lng"]:
            cnt = s["cnt"]
            s["grd"] = "다이아" if cnt >= 15 else ("골드" if cnt >= 10 else ("실버" if cnt >= 5 else "일반"))
            s["lat"] = round(s["lat"], 6)
            s["lng"] = round(s["lng"], 6)
            s["rec"] = sorted(s["rec"], reverse=True)[:3]
            compact.append(s)

    compact.sort(key=lambda x: x["cnt"], reverse=True)

    stores_path = os.path.join(OUTPUT_DIR, "lotto_stores_compact.json")
    with open(stores_path, "w", encoding="utf-8") as f:
        json.dump(compact, f, ensure_ascii=False, separators=(",", ":"))

    top100_path = os.path.join(OUTPUT_DIR, "lotto_top100.json")
    with open(top100_path, "w", encoding="utf-8") as f:
        json.dump(compact[:100], f, ensure_ascii=False, indent=2)

    shutil.rmtree(tmp_repo, ignore_errors=True)
    print(f"Updated {len(compact)} stores with 1y/6m/3m stats up to draw {latest_draw}.")


if __name__ == "__main__":
    main()
