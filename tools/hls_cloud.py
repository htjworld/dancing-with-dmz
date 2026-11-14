"""DMZ 다섯 지역 중심점의 HLS v2.0(S30+L30) 장면 구름량을 NASA CMR에서 조회해 월별 맑은 날과 NISAR 통과일 주변 맑은 광학 영상 유무를 출력한다.

구름량은 HLS 타일(약 110 km) 단위 값이다. 맑음 = 20% 이하, 흐림 = 80% 이상. 인증 불필요(메타데이터 검색).
사용: python3 tools/hls_cloud.py
"""
import json, subprocess, collections, datetime as dt
pts={'paju':(126.70,37.94),'yeoncheon':(126.97,38.11),'cheorwon':(127.23,38.30),'hwacheon':(127.72,38.33),'yanggu':(128.13,38.30)}
passes=['2026-06-23','2026-07-05','2026-07-17','2026-07-29','2026-08-10','2026-08-22','2026-09-03','2026-09-15','2026-09-27','2026-10-09','2026-10-21','2026-11-02']
def grans(sn,lon,lat):
    out=[];page=1
    while True:
        u=f'https://cmr.earthdata.nasa.gov/search/granules.umm_json?short_name={sn}&version=2.0&point={lon},{lat}&temporal=2026-06-01T00:00:00Z,2026-11-14T00:00:00Z&page_size=2000&page_num={page}'
        r=json.loads(subprocess.run(['curl','-s',u],capture_output=True,text=True).stdout)
        items=r.get('items',[])
        for it in items:
            m=it['umm']; d=m['TemporalExtent']['RangeDateTime']['BeginningDateTime'][:10]
            cc=m.get('CloudCover')
            if cc is None:
                cc=next((float(a['Values'][0]) for a in m.get('AdditionalAttributes',[]) if a['Name']=='CLOUD_COVERAGE'),None)
            out.append((d,cc,sn))
        if len(items)<2000: return out
        page+=1
for name,(lon,lat) in pts.items():
    g=grans('HLSS30',lon,lat)+grans('HLSL30',lon,lat)
    # per date: min cloud across granules
    byd={}
    for d,cc,_ in g:
        if cc is not None: byd[d]=min(cc,byd.get(d,101))
    mon=collections.defaultdict(lambda:[0,0,0])
    for d,cc in byd.items():
        m=d[:7]; mon[m][0]+=1; mon[m][1]+= cc<=20; mon[m][2]+= cc>=80
    # for each NISAR pass, clear optical (<=20%) within +-6 days?
    cov=[]
    for p in passes:
        P=dt.date.fromisoformat(p)
        ok=[d for d,cc in byd.items() if cc<=20 and abs((dt.date.fromisoformat(d)-P).days)<=6]
        cov.append(p[5:]+('O' if ok else 'X'))
    print('##',name,'dates',len(byd))
    for m in sorted(mon): print('  ',m,'관측일',mon[m][0],'맑음(<=20%)',mon[m][1],'흐림(>=80%)',mon[m][2])
    print('   NISAR 통과 ±6일 내 맑은 광학:',' '.join(cov))
