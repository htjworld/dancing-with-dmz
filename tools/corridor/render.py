"""Build georeferenced display tiles from the 11 collected HH observations."""
from pathlib import Path
import json
import math
import shutil
import argparse
import time
import warnings

import numpy as np
import rasterio
from rasterio.features import rasterize
from rasterio.transform import from_origin
from rasterio.warp import reproject, Resampling
from pyproj import Transformer
from scipy.ndimage import uniform_filter
from shapely.geometry import shape, mapping, Polygon
from shapely.ops import transform
from PIL import Image

warnings.filterwarnings('ignore', category=DeprecationWarning)
REPO = Path(__file__).resolve().parents[2]
HERE = REPO / 'data/cache/corridor'
OUT = HERE / 'published'
CACHE = HERE / 'cache'
DISPLAY_RES = 80  # Web Mercator meters: approximately 63 ground meters near the DMZ.
TILE = 1024
SCALE = 1.5
NODATA = -9999.0


def read(path):
    return json.loads(path.read_text(encoding='utf-8-sig'))


def write(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=1, allow_nan=False)+'\n', encoding='utf-8', newline='\n')


def smooth_linear(values, size=5):
    valid = np.isfinite(values) & (values > 0)
    numerator = uniform_filter(np.where(valid, values, 0).astype('float64'), size, mode='nearest')
    denominator = uniform_filter(valid.astype('float64'), size, mode='nearest')
    result = np.full(values.shape, NODATA, dtype='float32')
    np.divide(numerator, denominator, out=result, where=valid & (denominator > 0))
    return result


def rgba(sigma, valid, value=False):
    scaled = np.clip(np.nan_to_num(sigma) / SCALE, 0, 1)
    out = np.zeros(sigma.shape+(4,), dtype='uint8')
    if value:
        out[..., :3] = np.round(scaled*255).astype('uint8')[..., None]
    else:
        out[..., :3] = np.clip(np.stack([scaled, scaled**2.2, .25*(1-scaled)], -1)*255, 0, 255).astype('uint8')
    out[..., 3] = np.where(valid, 255, 0)
    return out


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--publish', action='store_true', help='Copy the validated display data into app/data.')
    parser.add_argument('--follow', action='store_true', help='Process completed observations while collection continues.')
    args = parser.parse_args()
    plan = read(HERE/'coverage-plan.json')
    dates = plan['dates']
    def ready(date):
        deadline=time.monotonic()+3600
        while not (CACHE/f'{date}.json').exists():
            assert args.follow and time.monotonic()<deadline, f'Observation not ready: {date}'
            time.sleep(2)
        assert read(CACHE/f'{date}.json')['status']=='complete', date
    ready(dates[0])
    with rasterio.open(CACHE/f'{dates[0]}.tif') as src:
        native_shape, native_transform, native_crs = src.shape, src.transform, src.crs
    zones = [z for z in read(REPO/'app/data/regions.json')['zones'] if z['role']=='ref']
    to_native = Transformer.from_crs(4326,32652,always_xy=True).transform
    zone_labels = rasterize([(mapping(transform(to_native,Polygon(z['polygon']))), i+1) for i,z in enumerate(zones)],
                            out_shape=native_shape, transform=native_transform, dtype='uint8')
    geo_band = shape(read(HERE/'corridor.geojson')['features'][0]['geometry'])
    band = transform(Transformer.from_crs(4326,3857,always_xy=True).transform, geo_band)
    xmin,ymin,xmax,ymax = band.bounds
    left,top = math.floor(xmin/DISPLAY_RES)*DISPLAY_RES, math.ceil(ymax/DISPLAY_RES)*DISPLAY_RES
    width,height = math.ceil((xmax-left)/DISPLAY_RES), math.ceil((top-ymin)/DISPLAY_RES)
    affine = from_origin(left,top,DISPLAY_RES,DISPLAY_RES)
    inside = rasterize([(mapping(band),1)],out_shape=(height,width),transform=affine,dtype='uint8').astype(bool)
    inv = Transformer.from_crs(3857,4326,always_xy=True)
    tiles=[]
    for r in range(0,height,TILE):
        for c in range(0,width,TILE):
            h,w=min(TILE,height-r),min(TILE,width-c)
            if not inside[r:r+h,c:c+w].any(): continue
            identity=f'c{c//TILE:02d}-r{r//TILE:02d}'
            x0,y0=left+c*DISPLAY_RES,top-r*DISPLAY_RES
            # Square edge tiles avoid MapLibre image-source culling of narrow slivers.
            # Padding is transparent and retains exactly the same pixel scale/location.
            corners=[inv.transform(x,y) for x,y in [(x0,y0),(x0+TILE*DISPLAY_RES,y0),(x0+TILE*DISPLAY_RES,y0-TILE*DISPLAY_RES),(x0,y0-TILE*DISPLAY_RES)]]
            tiles.append({'id':identity,'row':r,'col':c,'height':h,'width':w,'corners':corners,'frames':[]})
            (OUT/'corridor'/identity).mkdir(parents=True,exist_ok=True)
    count=np.zeros((height,width),dtype='uint8')
    mean=np.zeros((height,width),dtype='float64')
    moment=np.zeros((height,width),dtype='float64')
    references=[]
    coverage=[]
    for index,date in enumerate(dates):
        ready(date)
        with rasterio.open(CACHE/f'{date}.tif') as src:
            assert src.shape == native_shape and src.transform == native_transform and src.crs == native_crs
            raw=src.read(1)
        smoothed=smooth_linear(raw)
        del raw
        forest=[]
        for i,z in enumerate(zones):
            values=smoothed[(zone_labels==i+1)&(smoothed>0)]
            assert len(values)>100, (date,z['id'])
            forest.append({'id':z['id'],'pixels':int(len(values)), 'hh_db':float(10*np.log10(np.mean(values,dtype='float64')))})
        reference=float(np.median([v['hh_db'] for v in forest]))
        references.append({'date':date,'reference_db':reference,'forests':forest})
        display=np.full((height,width),NODATA,dtype='float32')
        reproject(smoothed, display, src_transform=native_transform, src_crs=native_crs,
                  dst_transform=affine,dst_crs='EPSG:3857',src_nodata=NODATA,dst_nodata=NODATA,
                  resampling=Resampling.average,num_threads=2)
        del smoothed
        valid=inside & np.isfinite(display) & (display>0)
        values=np.zeros(display.shape,dtype='float32')
        values[valid]=10*np.log10(display[valid])-reference
        count[valid]+=1
        delta=values[valid]-mean[valid]
        mean[valid]+=delta/count[valid]
        moment[valid]+=delta*(values[valid]-mean[valid])
        coverage.append({'date':date,'display_valid_fraction':float(valid.sum()/inside.sum())})
        if index == 0: continue
        eligible=inside & (count>=2)
        sigma=np.zeros((height,width),dtype='float32')
        variance = np.divide(moment,count,out=np.zeros_like(moment),where=eligible)
        np.sqrt(np.maximum(variance,0),out=sigma)
        color=rgba(sigma,eligible)
        for tile in tiles:
            r,c,h,w=[tile[k] for k in ['row','col','height','width']]
            file=f'corridor/{tile["id"]}/f{index:02d}.webp'
            padded=np.zeros((TILE,TILE,4),dtype='uint8')
            padded[:h,:w]=color[r:r+h,c:c+w]
            Image.fromarray(padded).save(OUT/file,'WEBP',quality=80,method=4)
            tile['frames'].append(file)
            if index == len(dates)-1:
                numeric=rgba(sigma[r:r+h,c:c+w],eligible[r:r+h,c:c+w],value=True)
                tile['value']=f'corridor/{tile["id"]}/value.webp'
                tile['color']=file
                padded_value=np.zeros((TILE,TILE,4),dtype='uint8')
                padded_value[:h,:w]=numeric
                Image.fromarray(padded_value).save(OUT/tile['value'],'WEBP',lossless=True,method=4)
        print(date,'display coverage',round(100*valid.sum()/inside.sum(),5),'%',flush=True)
    regions={t['id']:{k:t[k] for k in ['corners','color','value','frames']} | {'size':[TILE,TILE]} for t in tiles}
    manifest={'schema_version':1,'projection':'EPSG:3857','metric':'HH seasonal standard deviation relative to the median of five reference-forest means (dB)',
              'source':'NISAR GCOV HH native power, masked and averaged to 30 m; adjacent frames 069/070 on track 133 descending',
              'scale_db':[0,SCALE],'dates':dates,'regions':regions,
              'bounds':[[geo_band.bounds[0],geo_band.bounds[1]],[geo_band.bounds[2],geo_band.bounds[3]]],
              'half_width_km':plan['half_width_m']/1000,'is_official_dmz_boundary':False,
              'edges':read(HERE/'corridor-edges.geojson'),
              'coverage':{'pixels':int(inside.sum()),'with_two_or_more_observations':int(eligible.sum()),
                          'fraction':float(eligible.sum()/inside.sum()),'per_date':coverage,
                          'native_per_date':[{'date':date,'valid_fraction':read(CACHE/f'{date}.json')['valid_fraction']} for date in dates]},
              'processing':{'native_spacing_m':10,'analysis_grid_m':30,'multilook':'3x3 mean of finite positive power with product mask 1..254',
                            'smoothing':'5x5 mean of valid 30 m linear power, retaining the centre-cell validity',
                            'reference':'Median of the five per-region reference-forest linear-power means converted to dB, one shared scalar per date',
                            'standard_deviation':'Population standard deviation; only actual observed dates; minimum 2 observations',
                            'display_grid':'EPSG:3857, 80 projected meters (about 63 ground meters); area-average resampling of linear power before dB',
                            'edge_tiles':'1024x1024 with transparent padding; padding has no observations or numerical values',
                            'overlaps':'Use valid frame 069 cells first; frame 070 fills missing cells on the same date',
                            'nodata':'Transparent; no gap filling, extrapolation, or synthetic radar pixels',
                            'terrain_shadow_layover_screened':False},
              'references':references,
              'comparison_note':'Existing mission/evidence statistics retain their original local forest references and are not recomputed by this display background.',
              'sources':[{'date':date,'granules':[{k:g[k] for k in ['id','url','collection']} for g in read(CACHE/f'{date}.json')['source_frames']]} for date in dates],
              'attribution':'NASA/ISRO NISAR, ASF DAAC; approximate demarcation line © OpenStreetMap contributors (ODbL)',
              'documentation':'https://nisar-docs.asf.alaska.edu/gcov/'}
    write(OUT/'corridor.json',manifest)
    write(HERE/'display-validation.json',{'status':'PASS','tile_count':len(tiles),'dates':len(dates),
                                         'frames_per_tile':len(dates)-1,'coverage':manifest['coverage'],
                                         'all_existing_footprints_inside':plan['all_existing_footprints_inside']})
    print('Published',len(tiles),'tiles;',round(sum(p.stat().st_size for p in OUT.rglob('*') if p.is_file())/1024**2,2),'MiB',flush=True)
    if args.publish:
        shutil.copytree(OUT/'corridor', REPO/'app/data/corridor', dirs_exist_ok=True)
        shutil.copyfile(OUT/'corridor.json', REPO/'app/data/corridor.json')
        print('Updated app/data/corridor and corridor.json', flush=True)


if __name__=='__main__': main()
