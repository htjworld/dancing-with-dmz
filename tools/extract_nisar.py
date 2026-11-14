"""NISAR L2 GCOV 장면에서 DMZ 다섯 지역의 창만 원격으로 읽어 30 m 캐시로 저장한다.

전체 파일(장면당 약 6 GB)을 내려받지 않고, HTTP 범위 요청으로 필요한 화소만 읽는다.
이미 저장된 (지역, 날짜)는 건너뛰므로 중간에 끊겨도 다시 실행하면 이어진다.

사용:
  python tools/extract_nisar.py --list            # 장면 목록만 출력
  python tools/extract_nisar.py --probe           # 첫 장면의 HDF5 구조 출력
  python tools/extract_nisar.py --workers 3       # 추출

토큰: Earthdata Login 토큰을 .env 의 EARTHDATA_TOKEN 에 넣는다(저장소에 올리지 않는다).
"""
import argparse, json, os, sys, time
from concurrent.futures import ProcessPoolExecutor, as_completed
from pathlib import Path

import numpy as np
import requests

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / "data" / "cache"
CMR = "https://cmr.earthdata.nasa.gov/search/granules.json"
COLLECTIONS = ["NISAR_L2_GCOV_PROVISIONAL_V1", "NISAR_L2_GCOV_V1"]
STACK = "_133_D_069_4005_"          # 같은 궤도·프레임·모드만 쓴다(같은 기하로 반복 관측)
BBOX = "126.6,37.85,128.25,38.4"
LOOKS = 3                           # 3x3 평균(원본 격자가 10 m 면 30 m)

# 지역 창: (서, 남, 동, 북) 경위도. 팀이 지도에서 고른 범위이며 행정 경계가 아니다.
REGIONS = {
    "paju":      (126.62, 37.86, 126.80, 38.00),   # 장단·대성동 일대
    "yeoncheon": (126.85, 37.98, 127.10, 38.18),   # 임진강이 DMZ를 지나는 구간
    "cheorwon":  (127.15, 38.15, 127.55, 38.42),   # 철원 평야(동쪽 김화, 북쪽 평강 쪽 평지까지)
    "hwacheon":  (127.65, 38.18, 127.90, 38.38),   # 백암산 일대
    "yanggu":    (128.05, 38.22, 128.22, 38.36),   # 해안분지(펀치볼)
}


def token(env_file=None):
    if os.environ.get("EARTHDATA_TOKEN"):
        return os.environ["EARTHDATA_TOKEN"].strip()
    for p in [env_file, ROOT / ".env"]:
        if p and Path(p).exists():
            for line in Path(p).read_text(encoding="utf-8").splitlines():
                if line.strip().startswith("EARTHDATA_TOKEN="):
                    v = line.split("=", 1)[1].strip().strip('"').strip("'")
                    if v:
                        return v
    sys.exit("EARTHDATA_TOKEN 이 없습니다. .env 에 토큰을 넣어 주세요.")


def granules():
    out = []
    for sn in COLLECTIONS:
        r = requests.get(CMR, params={"short_name": sn, "bounding_box": BBOX, "page_size": 500,
                                      "temporal": "2026-05-01T00:00:00Z,2026-11-16T00:00:00Z",
                                      "sort_key": "start_date"}, timeout=60)
        r.raise_for_status()
        for e in r.json()["feed"]["entry"]:
            if STACK not in e["title"]:
                continue
            href = [l["href"] for l in e["links"] if l["href"].startswith("https") and l["href"].endswith(".h5")]
            if href:
                out.append({"id": e["title"], "date": e["time_start"][:10], "time": e["time_start"],
                            "collection": sn, "cycle_no": int(e["title"].split("_")[4]), "url": href[0]})
    out.sort(key=lambda g: g["time"])
    return out


def signed_url(url, tok):
    """Earthdata 인증을 거쳐 실제 저장소 주소(서명된 URL)까지 따라간다. 토큰은 NASA 호스트에만 보낸다."""
    s = requests.Session()
    for _ in range(8):
        host = url.split("/")[2]
        nasa = host.endswith("earthdatacloud.nasa.gov") or host.endswith("earthdata.nasa.gov")
        r = s.get(url, headers={"Authorization": f"Bearer {tok}"} if nasa else {}, allow_redirects=False,
                  stream=True, timeout=60)
        if r.status_code in (301, 302, 303, 307):
            r.close()
            url = requests.compat.urljoin(url, r.headers["Location"])
            continue
        r.close()
        if r.status_code in (200, 206):
            return url
        raise RuntimeError(f"HTTP {r.status_code} ({host})")
    raise RuntimeError("redirect 가 너무 많습니다")


def open_h5(url, tok):
    import fsspec, h5py
    fs = fsspec.filesystem("https")
    f = fs.open(signed_url(url, tok), block_size=4 * 1024 * 1024, cache_type="blockcache")
    return h5py.File(f, "r")


def grid_group(h):
    g = h["science"]
    band = "LSAR" if "LSAR" in g else list(g.keys())[0]
    return g[band]["GCOV"]["grids"]["frequencyA"]


def window(xs, ys, bounds, epsg):
    from pyproj import Transformer
    w, s, e, n = bounds
    t = Transformer.from_crs(4326, epsg, always_xy=True)
    px, py = t.transform([w, e, w, e], [s, s, n, n])
    c = np.where((xs >= min(px)) & (xs <= max(px)))[0]
    r = np.where((ys >= min(py)) & (ys <= max(py)))[0]
    if not len(c) or not len(r):
        return None
    return int(r.min()), int(r.max()) + 1, int(c.min()), int(c.max()) + 1


def multilook(a, k=LOOKS):
    a = np.where(np.isfinite(a) & (a > 0), a, np.nan).astype("float32")
    H, W = (a.shape[0] // k) * k, (a.shape[1] // k) * k
    b = a[:H, :W].reshape(H // k, k, W // k, k)
    with np.errstate(all="ignore"):
        return np.nanmean(b, axis=(1, 3)).astype("float32")


def extract(g, tok, regions):
    todo = [r for r in regions if not (CACHE / r / f"{g['date']}.npz").exists()]
    if not todo:
        return g["date"], "이미 있음"
    t0 = time.time()
    with open_h5(g["url"], tok) as h:
        grp = grid_group(h)
        xs, ys = grp["xCoordinates"][:], grp["yCoordinates"][:]
        epsg = int(np.asarray(grp["projection"][()]).item()) if grp["projection"].shape == () else int(grp["projection"].attrs["epsg_code"])
        done = []
        for r in todo:
            win = window(xs, ys, REGIONS[r], epsg)
            if win is None:
                done.append(f"{r}:범위 밖")
                continue
            r0, r1, c0, c1 = win
            hh = multilook(grp["HHHH"][r0:r1, c0:c1])
            hv = multilook(grp["HVHV"][r0:r1, c0:c1])
            k = LOOKS
            x = xs[c0:c1][: hh.shape[1] * k].reshape(-1, k).mean(1)
            y = ys[r0:r1][: hh.shape[0] * k].reshape(-1, k).mean(1)
            out = CACHE / r
            out.mkdir(parents=True, exist_ok=True)
            tmp = out / f"{g['date']}.tmp.npz"
            np.savez_compressed(tmp, hh=hh, hv=hv, x=x, y=y, epsg=epsg, granule=g["id"], collection=g["collection"])
            tmp.replace(out / f"{g['date']}.npz")
            done.append(f"{r}:{hh.shape[0]}x{hh.shape[1]}")
    return g["date"], f"{', '.join(done)} ({time.time() - t0:.0f}s)"


def probe(g, tok):
    with open_h5(g["url"], tok) as h:
        grp = grid_group(h)
        print("frequencyA:", list(grp.keys()))
        for k in ("HHHH", "HVHV"):
            d = grp[k]
            print(k, d.shape, d.dtype, "chunks", d.chunks, d.compression)
        xs, ys = grp["xCoordinates"][:], grp["yCoordinates"][:]
        print("x", xs[0], xs[-1], "dx", xs[1] - xs[0], "| y", ys[0], ys[-1], "dy", ys[1] - ys[0])
        p = grp["projection"]
        print("projection", p.shape, p[()] if p.shape == () else "", dict(p.attrs).get("epsg_code"))
        epsg = int(np.asarray(p[()]).item())
        for r, b in REGIONS.items():
            print(r, window(xs, ys, b, epsg))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--list", action="store_true")
    ap.add_argument("--probe", action="store_true")
    ap.add_argument("--workers", type=int, default=3)
    ap.add_argument("--env-file")
    ap.add_argument("--regions", default=",".join(REGIONS))
    a = ap.parse_args()
    gs = granules()
    CACHE.mkdir(parents=True, exist_ok=True)
    (ROOT / "data" / "granules.json").write_text(json.dumps(gs, indent=1), encoding="utf-8")
    if a.list:
        for g in gs:
            print(g["date"], g["cycle_no"], g["collection"], g["id"])
        return
    tok = token(a.env_file)
    if a.probe:
        return probe(gs[0], tok)
    regions = a.regions.split(",")
    with ProcessPoolExecutor(a.workers) as ex:
        futs = {ex.submit(extract, g, tok, regions): g for g in gs}
        for f in as_completed(futs):
            g = futs[f]
            try:
                print(*f.result(), flush=True)
            except Exception as e:
                print(g["date"], "실패:", repr(e)[:200], flush=True)


if __name__ == "__main__":
    main()
