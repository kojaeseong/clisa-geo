"""커밋으로 바뀐 쪽 가운데 사이트맵에 있는 주소를 IndexNow로 알린다(빙·네이버 등 참여 검색엔진이 함께 받는다). 2026-11-21."""
import json, os, re, subprocess, sys, urllib.request
HOST = "clisa.ai"; KEY = "1ecf6a0e1a553be4f7fec946ac445678"; BASE = "https://" + HOST + "/"
def locs(f):
    try: return re.findall(r"<loc>([^<]+)</loc>", open(f, encoding="utf-8").read())
    except FileNotFoundError: return []
SM = set(locs("sitemap.xml") + locs("en/sitemap.xml"))
if os.environ.get("ALL") == "true":
    urls = sorted(SM)
else:
    before, after = os.environ.get("BEFORE", ""), os.environ.get("AFTER", "HEAD")
    rng = [before, after] if before and set(before) != {"0"} else [after + "~1", after]
    try: files = subprocess.run(["git", "diff", "--name-only", *rng], capture_output=True, text=True, check=True).stdout.split()
    except subprocess.CalledProcessError as e: print("git diff 실패:", e.stderr); sys.exit(0)
    urls = set()
    for f in files:
        if f == "index.html": urls.add(BASE)
        elif f.endswith("/index.html"): urls.add(BASE + f[:-len("index.html")])
        elif f in ("sitemap.xml", "en/sitemap.xml"): pass
    urls = sorted(u for u in urls if u in SM)
print(len(urls), "개 주소")
if not urls: sys.exit(0)
for i in range(0, len(urls), 10000):
    body = json.dumps({"host": HOST, "key": KEY, "keyLocation": BASE + KEY + ".txt", "urlList": urls[i:i + 10000]}).encode()
    req = urllib.request.Request("https://api.indexnow.org/indexnow", data=body, headers={"Content-Type": "application/json; charset=utf-8"})
    try:
        with urllib.request.urlopen(req, timeout=30) as r: print("응답", r.status)
    except urllib.error.HTTPError as e:
        print("응답", e.code, e.read()[:300]); sys.exit(1)
