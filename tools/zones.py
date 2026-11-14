"""구역 정의. 팀이 레이더 미리보기(tools/preview_regions.py)에서 고른 사각형이다.

bounds = (서, 남, 동, 북) 경위도. 이름의 '논·경작지·숲'은 영상에서 그렇게 보인다는 뜻이며,
토지피복 자료나 현장 조사로 확인한 것이 아니다. 'DMZ 안'은 군사분계선에서 약 2 km 이내를 뜻한다.
role: main = 그 지역의 주 구역, ref = 같은 지역의 숲 기준, 나머지는 비교용.
"""
ZONES = {
    # 파주 장단: 분계선이 남북으로 지나고, 동쪽이 남측이다
    "paju-dmz_farm":   dict(region="paju", role="main", name="DMZ 안 경작지", bounds=(126.682, 37.928, 126.705, 37.952)),
    "paju-north_farm": dict(region="paju", role="cmp",  name="분계선 서쪽 경작지로 보이는 곳", bounds=(126.645, 37.925, 126.665, 37.955)),
    "paju-dmz_wild":   dict(region="paju", role="cmp",  name="DMZ 안 미경작지", bounds=(126.712, 37.932, 126.740, 37.950)),
    "paju-forest":     dict(region="paju", role="ref",  name="남쪽 숲", bounds=(126.690, 37.905, 126.712, 37.922)),
    # 연천 임진강: 강이 분계선을 넘어 남쪽으로 굽이친다
    "yeoncheon-bend":   dict(region="yeoncheon", role="main", name="임진강 굽이 안쪽 땅", bounds=(126.968, 38.100, 126.995, 38.116)),
    "yeoncheon-dmz":    dict(region="yeoncheon", role="cmp",  name="DMZ 안", bounds=(126.940, 38.100, 126.960, 38.115)),
    "yeoncheon-north":  dict(region="yeoncheon", role="cmp",  name="분계선 북쪽", bounds=(126.900, 38.140, 126.930, 38.160)),
    "yeoncheon-forest": dict(region="yeoncheon", role="ref",  name="동쪽 숲", bounds=(127.030, 38.120, 127.060, 38.140)),
    # 철원 평야
    "cheorwon-paddy":  dict(region="cheorwon", role="main", name="민통선 논", bounds=(127.190, 38.250, 127.260, 38.290)),
    "cheorwon-dmz":    dict(region="cheorwon", role="cmp",  name="DMZ 안 저지대", bounds=(127.220, 38.312, 127.270, 38.325)),
    "cheorwon-north":  dict(region="cheorwon", role="cmp",  name="DMZ 북쪽 경작지로 보이는 곳", bounds=(127.200, 38.370, 127.270, 38.400)),
    "cheorwon-forest": dict(region="cheorwon", role="ref",  name="남동쪽 숲", bounds=(127.400, 38.190, 127.460, 38.220)),
    # 화천 백암산 일대
    "hwacheon-dmz":    dict(region="hwacheon", role="main", name="DMZ 안 숲", bounds=(127.700, 38.318, 127.750, 38.332)),
    "hwacheon-north":  dict(region="hwacheon", role="cmp",  name="북쪽 평지로 보이는 곳", bounds=(127.655, 38.350, 127.690, 38.375)),
    "hwacheon-forest": dict(region="hwacheon", role="ref",  name="남쪽 숲", bounds=(127.720, 38.230, 127.770, 38.260)),
    # 양구 해안분지(펀치볼)
    "yanggu-basin":    dict(region="yanggu", role="main", name="분지 경작지", bounds=(128.105, 38.265, 128.155, 38.305)),
    "yanggu-dmz":      dict(region="yanggu", role="cmp",  name="DMZ 안 숲", bounds=(128.115, 38.328, 128.155, 38.342)),
    "yanggu-forest":   dict(region="yanggu", role="ref",  name="분지 서쪽 숲", bounds=(128.060, 38.240, 128.090, 38.270)),
}
