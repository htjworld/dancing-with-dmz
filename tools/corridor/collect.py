"""Collect masked 30 m HH observations across the continuous observation band.

Only range requests are made; the source HDF5 files are not downloaded in full.
Credentials and temporary signed URLs are never written to the cache or logs.
"""
from pathlib import Path
from concurrent.futures import ProcessPoolExecutor, as_completed
import argparse
import importlib.util
import json
import math
import os
import sys
import time
import warnings

import fsspec
import h5py
import numpy as np
import rasterio
from rasterio.features import rasterize
from rasterio.transform import from_origin
from pyproj import Transformer
from shapely.geometry import shape, mapping, Polygon
from shapely.ops import transform, unary_union

warnings.filterwarnings('ignore', category=DeprecationWarning)
REPO = Path(__file__).resolve().parents[2]
HERE = REPO / 'data/cache/corridor'
CACHE = HERE / 'cache'
NODATA = -9999.0
RES = 30
TILE = 512


def read(path):
    return json.loads(path.read_text(encoding='utf-8-sig'))


def write(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + '.tmp')
    tmp.write_text(json.dumps(value, ensure_ascii=False, indent=1) + '\n', encoding='utf-8', newline='\n')
    tmp.replace(path)


def helper():
    spec = importlib.util.spec_from_file_location('existing_extract', REPO / 'tools/extract_nisar.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def setup():
    geometry = transform(Transformer.from_crs(4326, 32652, always_xy=True).transform,
                         shape(read(HERE / 'corridor.geojson')['features'][0]['geometry']))
    xmin, ymin, xmax, ymax = geometry.bounds
    left, top = math.floor(xmin / RES) * RES, math.ceil(ymax / RES) * RES
    width, height = math.ceil((xmax - left) / RES), math.ceil((top - ymin) / RES)
    affine = from_origin(left, top, RES, RES)
    mask = rasterize([(mapping(geometry), 1)], out_shape=(height, width), transform=affine, dtype='uint8').astype(bool)
    return mask, affine, geometry


def find_granules(date):
    entries = [e for e in read(HERE / 'catalog-expanded.json')
               if e['time_start'][:10] == date and '_133_D_' in e['title'] and '_4005_DHDH_' in e['title']]
    found = []
    for e in sorted(entries, key=lambda e: e['title'].split('_')[7]):
        urls = [v['href'] for v in e['links'] if v['href'].startswith('https://nisar.asf.earthdatacloud.nasa.gov/') and v['href'].endswith('.h5')]
        if not urls:
            continue
        polygons = []
        for rings in e.get('polygons', []):
            for ring in rings:
                v = list(map(float, ring.split()))
                polygons.append(Polygon([(v[i+1], v[i]) for i in range(0, len(v), 2)]))
        found.append({'id': e['title'], 'url': urls[0], 'collection': e['_queried_collection'],
                      'footprint': unary_union(polygons)})
    assert len(found) == 2, f'Expected the two adjacent same-track frames for {date}'
    return found


def multilook_valid(hh, qa):
    """Average actual valid native power, never dB or filled-in samples."""
    assert hh.shape == qa.shape and hh.ndim == 2
    rows, cols = hh.shape
    assert rows % 3 == 0 and cols % 3 == 0
    valid = np.isfinite(hh) & (hh > 0) & (qa > 0) & (qa < 255)
    shape = (rows//3, 3, cols//3, 3)
    count = valid.reshape(shape).sum(axis=(1,3))
    sums = np.where(valid,hh,0).reshape(shape).sum(axis=(1,3),dtype='float64')
    values = np.full(count.shape,NODATA,dtype='float32')
    np.divide(sums,count,out=values,where=count>0)
    return values, count


def collect(date):
    started = time.time()
    CACHE.mkdir(exist_ok=True)
    target = CACHE / f'{date}.tif'
    report_path = CACHE / f'{date}.json'
    if target.exists() and report_path.exists() and read(report_path).get('status') == 'complete':
        return {'date': date, 'status': 'cached', 'seconds': 0}
    mask, affine, geometry = setup()
    height, width = mask.shape
    output = np.full(mask.shape, NODATA, dtype='float32')
    module = helper()
    token = module.token()
    granules = find_granules(date)
    reports = []
    for g in granules:
        # 069 has precedence; 070 fills only pixels without a valid 069 observation.
        need = mask & (output == NODATA)
        if not need.any():
            break
        signed = module.signed_url(g['url'], token)
        fs = fsspec.filesystem('https')
        remote = fs.open(signed, block_size=1024*1024, cache_type='blockcache')
        report = {k: g[k] for k in ['id', 'url', 'collection']}
        report['tiles'] = 0
        with remote, h5py.File(remote, 'r') as h:
            grid = module.grid_group(h)
            xs, ys = grid['xCoordinates'][:], grid['yCoordinates'][:]
            epsg = int(np.asarray(grid['projection'][()]).item())
            assert epsg == 32652 and abs(xs[1]-xs[0]-10) < 1e-6 and abs(ys[1]-ys[0]+10) < 1e-6
            left, top = float(xs[0]-5), float(ys[0]+5)
            right, bottom = float(xs[-1]+5), float(ys[-1]-5)
            report['mask_description'] = str(grid['mask'].attrs.get('description', ''))
            col_min = max(0, math.ceil((left - affine.c) / RES))
            col_max = min(width, math.floor((right - affine.c) / RES))
            row_min = max(0, math.ceil((affine.f - top) / RES))
            row_max = min(height, math.floor((affine.f - bottom) / RES))
            candidates = []
            for r in range(0, height, TILE):
                for c in range(0, width, TILE):
                    r0, r1 = max(r, row_min), min(r+TILE, row_max)
                    c0, c1 = max(c, col_min), min(c+TILE, col_max)
                    if r1 > r0 and c1 > c0 and need[r0:r1, c0:c1].any():
                        candidates.append((r0,r1,c0,c1))
            print(f'{date} frame {g["id"].split("_")[7]}: {len(candidates)} windows', flush=True)
            for r0,r1,c0,c1 in candidates:
                src_c = (affine.c + c0*RES - left) / 10
                src_r = (top - (affine.f - r0*RES)) / 10
                assert abs(src_c-round(src_c)) < 1e-5 and abs(src_r-round(src_r)) < 1e-5
                src_c, src_r = round(src_c), round(src_r)
                hh = np.asarray(grid['HHHH'][src_r:src_r+(r1-r0)*3, src_c:src_c+(c1-c0)*3], dtype='float32')
                qa = np.asarray(grid['mask'][src_r:src_r+(r1-r0)*3, src_c:src_c+(c1-c0)*3])
                assert hh.shape == ((r1-r0)*3,(c1-c0)*3) and qa.shape == hh.shape
                values, count = multilook_valid(hh, qa)
                dest = output[r0:r1,c0:c1]
                selected = need[r0:r1,c0:c1] & (count > 0)
                dest[selected] = values[selected]
                report['tiles'] += 1
                if report['tiles'] % 10 == 0:
                    write(CACHE / f'{date}.progress.json', {'date':date, 'status':'extracting',
                          'frame':g['id'].split('_')[7], 'windows_done':report['tiles'], 'windows_total':len(candidates),
                          'seconds':round(time.time()-started)})
                    print(f'{date} {g["id"].split("_")[7]}: {report["tiles"]}/{len(candidates)}', flush=True)
        reports.append(report)
    valid = mask & (output != NODATA)
    tmp = target.with_suffix('.tmp.tif')
    with rasterio.open(tmp, 'w', driver='GTiff', height=height, width=width, count=1, dtype='float32',
                       crs='EPSG:32652', transform=affine, nodata=NODATA, tiled=True, compress='deflate', predictor=3, zlevel=4) as dst:
        dst.write(output, 1)
        dst.update_tags(units='linear gamma0 power', date=date, product='NISAR GCOV HH',
                        processing='Valid mask 1..254; mean linear power over 3x3 native 10 m cells; no gap interpolation')
    tmp.replace(target)
    result = {'date': date, 'status':'complete', 'seconds':round(time.time()-started), 'resolution_m':RES,
              'epsg':32652, 'size':[width,height], 'corridor_pixels':int(mask.sum()),
              'valid_pixels':int(valid.sum()), 'valid_fraction':float(valid.sum()/mask.sum()),
              'source_frames':reports, 'terrain_shadow_layover_screened':False,
              'overlap_rule':'Frame 069 first; frame 070 fills only missing cells; same date/track/mode/polarization.'}
    write(report_path, result)
    write(CACHE / f'{date}.progress.json', {k:v for k,v in result.items() if k != 'source_frames'})
    print(f'{date}: complete, valid {result["valid_fraction"]:.4%}, {result["seconds"]} seconds', flush=True)
    return {k:v for k,v in result.items() if k != 'source_frames'}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--dates', default='')
    parser.add_argument('--workers', type=int, default=3)
    args = parser.parse_args()
    dates = args.dates.split(',') if args.dates else read(HERE / 'coverage-plan.json')['dates']
    failed = []
    with ProcessPoolExecutor(max_workers=args.workers) as pool:
        jobs = {pool.submit(collect, date):date for date in dates}
        for job in as_completed(jobs):
            date = jobs[job]
            try:
                job.result()
            except Exception as exc:
                # Do not print tracebacks containing signed cloud URLs.
                failed.append(date)
                write(CACHE / f'{date}.progress.json', {'date':date,'status':'failed','error_type':type(exc).__name__})
                print(date, 'failed:', type(exc).__name__, flush=True)
    if failed:
        print('Retry dates:', ','.join(failed), flush=True)
        sys.exit(1)


if __name__ == '__main__':
    main()
