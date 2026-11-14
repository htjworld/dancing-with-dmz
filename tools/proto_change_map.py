"""시제품: 픽셀별 계절 변동 지도(11회 NISAR HH의 표준편차, 노랄수록 많이 변함)와 3시기 RGB 합성. 흰 선은 군사분계선.
입력은 app/data/layers 의 흑백 WebP(dB 를 0~255 로 편 값)를 dB 로 되돌린 것이라 원자료보다 거칠다.
출력: brainstorming/img/<지역>_change.jpg, <지역>_rgb.jpg
사용: python tools/proto_change_map.py
"""
import json, numpy as np
from pathlib import Path
from PIL import Image, ImageDraw
from scipy.ndimage import uniform_filter
ROOT=Path(__file__).resolve().parents[1]; L=ROOT/'app/data/layers'
meta=json.load(open(ROOT/'app/data/layers.json')); LO,HI=meta['scale_db']
dmz=json.load(open(ROOT/'app/data/dmz.geojson')); lines=[]
for f in dmz['features']:
    g=f['geometry']; cs=g['coordinates']
    lines += [cs] if g['type']=='LineString' else cs if g['type']=='MultiLineString' else []
def load(region,date):
    a=np.asarray(Image.open(L/region/f'{date}_hh.webp').convert('RGBA')).astype(float)
    db=LO+a[...,0]/255*(HI-LO); db[a[...,3]==0]=np.nan
    lin=10**(db/10); ok=np.isfinite(lin)
    n=uniform_filter(np.where(ok,lin,0),5); d=uniform_filter(ok*1.0,5)
    with np.errstate(all='ignore'): return np.where(ok&(d>0),10*np.log10(n/d),np.nan)
pick=('2026-06-23','2026-08-22','2026-10-09')
for region,r in meta['regions'].items():
    W,H=r['size']; (x0,y0),(x1,y1),_,(x3,y3)=r['corners']
    # affine lon/lat -> pixel using corners TL, TR, BL
    A=np.array([[x0,y0,1],[x1,y1,1],[x3,y3,1]]); px=np.linalg.solve(A,[0,W,0]); py=np.linalg.solve(A,[0,0,H])
    ch=[np.clip((load(region,p)+20)/16,0,1) for p in pick]
    rgb=np.nan_to_num(np.stack(ch,-1))
    stack=np.stack([load(region,d) for d in r['dates']]); sd=np.nanstd(stack,0); s=np.clip(sd/2.5,0,1)
    heat=np.stack([s,s**2.2,0.25*(1-s)],-1)*np.isfinite(sd)[...,None]
    for arr,tag in ((rgb**0.8,'rgb'),(heat,'change')):
        im=Image.fromarray((np.nan_to_num(arr)*255).astype('uint8')); dr=ImageDraw.Draw(im)
        for ln in lines:
            pts=[(px@[lo,la,1],py@[lo,la,1]) for lo,la in ln]
            dr.line(pts,fill=(255,255,255),width=3)
        sc=800/max(W,H); im.resize((int(W*sc),int(H*sc))).save(ROOT/'brainstorming/img'/f'{region}_{tag}.jpg',quality=85)
    print(region,W,H)
