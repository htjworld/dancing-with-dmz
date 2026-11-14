"""Measure the observation band and inspect authenticated source grids."""
from pathlib import Path
import argparse
import importlib.util
import json
import math
import sys

import numpy as np
import requests
from pyproj import Transformer
from shapely.geometry import shape, Polygon, mapping
from shapely.ops import transform, unary_union

REPO = Path(__file__).resolve().parents[2]
HERE = REPO / 'data/cache/corridor'


def write(name, value):
    HERE.mkdir(parents=True, exist_ok=True)
    (HERE / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--probe', action='store_true')
    args = parser.parse_args()
    source = json.loads((REPO / 'app/data/dmz.geojson').read_text(encoding='utf-8'))
    layers = json.loads((REPO / 'app/data/layers.json').read_text(encoding='utf-8'))
    fwd = Transformer.from_crs(4326, 32652, always_xy=True).transform
    inv = Transformer.from_crs(32652, 4326, always_xy=True).transform
    line = transform(fwd, shape(source['features'][0]['geometry']))
    regions = {k: transform(fwd, Polygon(v['corners'])) for k, v in layers['regions'].items()}
    extent = unary_union(list(regions.values()))
    low, high = 0., 50000.
    for _ in range(22):
        middle = (low + high) / 2
        if line.buffer(middle, quad_segs=16).covers(extent):
            high = middle
        else:
            low = middle
    width = math.ceil(high / 1000) * 1000
    band = line.buffer(width, quad_segs=16)
    assert band.covers(extent)
    geographic = transform(inv, band)
    properties = {'kind': 'observation_corridor', 'half_width_m': width,
                  'is_official_dmz_boundary': False,
                  'basis': 'Smallest symmetric metric buffer covering all five existing image footprints, rounded up to 1 km.',
                  'source': 'OpenStreetMap contributors (ODbL), inherited approximate military demarcation line'}
    write('corridor.geojson', {'type': 'FeatureCollection', 'features': [
        {'type': 'Feature', 'properties': properties, 'geometry': mapping(geographic)}]})
    write('corridor-edges.geojson', {'type': 'FeatureCollection', 'features': [
        {'type': 'Feature', 'properties': {**properties, 'side': side},
         'geometry': mapping(transform(inv, line.offset_curve(sign * width, quad_segs=16)))}
        for side, sign in [('north', 1), ('south', -1)]]})
    catalog = json.loads((REPO / 'data/granules.json').read_text(encoding='utf-8'))
    coverage = []
    for path in sorted((REPO / 'data/collected/nisar/metadata/cmr').glob('*.json')):
        item = json.loads(path.read_text(encoding='utf-8'))['items'][0]['umm']
        polys = item['SpatialExtent']['HorizontalSpatialDomain']['Geometry']['GPolygons']
        footprint = unary_union([Polygon([(p['Longitude'], p['Latitude']) for p in poly['Boundary']['Points']]) for poly in polys])
        projected = transform(fwd, footprint)
        coverage.append({'granule': item['GranuleUR'], 'corridor_footprint_fraction': band.intersection(projected).area / band.area})
    report = {'minimum_half_width_m': round(high, 1), 'half_width_m': width, 'total_width_m': 2 * width,
              'area_km2': round(band.area / 1e6, 2), 'bounds_lonlat': list(geographic.bounds),
              'all_existing_footprints_inside': True, 'catalog_granules': len(catalog),
              'catalog_footprint_coverage': coverage,
              'coverage_note': 'Catalog footprint only; actual valid pixel coverage remains to be checked.',
              'dates': [g['date'] for g in catalog]}
    write('coverage-plan.json', report)
    print(json.dumps({k: v for k, v in report.items() if k != 'catalog_footprint_coverage'}, ensure_ascii=False), flush=True)
    print('Metadata footprint fractions:', sorted({round(v['corridor_footprint_fraction'], 6) for v in coverage}), flush=True)
    entries = []
    for collection in ['NISAR_L2_GCOV_PROVISIONAL_V1', 'NISAR_L2_GCOV_V1']:
        response = requests.get('https://cmr.earthdata.nasa.gov/search/granules.json', params={
            'short_name': collection, 'bounding_box': ','.join(map(str, geographic.bounds)),
            'temporal': f'{report["dates"][0]}T00:00:00Z,{report["dates"][-1]}T23:59:59Z',
            'page_size': 2000, 'sort_key': 'start_date'}, timeout=60)
        response.raise_for_status()
        found = response.json()['feed']['entry']
        assert len(found) == int(response.headers['CMR-Hits']), 'Catalog is paginated; extend collection before processing.'
        for entry in found:
            entry['_queried_collection'] = collection
        entries.extend(found)
    write('catalog-expanded.json', entries)
    print('Saved', len(entries), 'catalog entries for adjacent-frame selection.', flush=True)
    if not args.probe:
        return
    spec = importlib.util.spec_from_file_location('existing_extract', REPO / 'tools/extract_nisar.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    tok = module.token()
    with module.open_h5(catalog[0]['url'], tok) as h:
        grid = module.grid_group(h)
        xs, ys = grid['xCoordinates'][:], grid['yCoordinates'][:]
        epsg = int(np.asarray(grid['projection'][()]).item())
        desc = str(grid['mask'].attrs.get('description', ''))
        details = {'granule': catalog[0]['id'], 'epsg': epsg,
                   'x': [float(xs[0]), float(xs[-1]), float(xs[1] - xs[0])],
                   'y': [float(ys[0]), float(ys[-1]), float(ys[1] - ys[0])],
                   'hh_shape': list(grid['HHHH'].shape), 'hh_chunks': list(grid['HHHH'].chunks),
                   'mask_description': desc, 'grid_keys': list(grid.keys())}
        write('source-grid.json', details)
        print('Authenticated source grid:', {k: v for k, v in details.items() if k not in ('mask_description', 'grid_keys')}, flush=True)


if __name__ == '__main__':
    try:
        main()
    except Exception as exc:
        # Network exceptions can include temporary signed URLs. Never print them.
        print('Inspection failed:', type(exc).__name__, flush=True)
        sys.exit(1)
