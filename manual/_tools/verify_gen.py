#!/usr/bin/env python3
"""비상발전기 v5.1.0 계산 엔진 독립 검증(v6.1.7 높이 · 유지시간 opt 대조 추가) — usage: python3 verify_gen.py <index.html> [--inject]
index.html 의 window.GENENG 를 node 로 실행해, 아래 파이썬 독립 구현(KDS 32 20 20:2024 식 4.1-1 — v6.1.2 opt 인자(인버터 · 고조파) 없는 호출은 종전과 같음 · v6.1.4 opt 전체(인버터 4.1-4 · 고조파 4.1-5 · UPS 4.1-3) 독립 구현 대조 · 설비별 유지시간)과 전수 대조한다.
--inject : 엔진에 오류 4종을 주입해 검증기가 잡아내는지 확인(잡지 못하면 실패)."""
import sys, re, json, subprocess, itertools, tempfile, os
src = open(sys.argv[1], encoding='utf-8').read()
m = re.search(r'window\.GENENG = \{.*?\n\};', src, re.S); assert m, 'GENENG 없음'
ENG = m.group(0)

def py_kds(motors, non, ef, a, c, k, pl):
    sPm = sum(motors); auto = max(motors) if motors else 0
    PL = min(pl, sPm) if pl > 0 else auto
    sP = non / ef if ef > 0 else 0
    return dict(sumPm=sPm, PL=PL, sumP=sP, GP=(sP + (sPm - PL) * a + PL * a * c) * k)

def py_kds_opt(motors, non, ef, a, c, k, pl, o):
    vf = o.get('vf', []); lam = o['lam'] if o.get('lam', 0) > 0 else 2.5
    harm = min(max(o.get('harmKw', 0), 0), non)
    dm = [v for i, v in enumerate(motors) if not (i < len(vf) and vf[i])]
    vfKw = sum(v for i, v in enumerate(motors) if i < len(vf) and vf[i])
    sPm = sum(dm); auto = max(dm) if dm else 0
    PL = min(pl, sPm) if pl > 0 else auto
    u = max(o.get('upsKva', 0), 0); ue = o['upsEff'] if o.get('upsEff', 0) > 0 else 0.9; uc = o['upsChg'] if o.get('upsChg', -1) >= 0 else 10
    pU = u / ue * lam + u * uc / 100 if u > 0 else 0
    sP = ((non - harm) / ef + harm / ef * lam if ef > 0 else 0) + vfKw * a * lam + pU
    return dict(sumPm=sPm, PL=PL, sumP=sP, GP=(sP + (sPm - PL) * a + PL * a * c) * k, pUps=pU)

def py_hold(fl, high, u50, tun, ht=0, o=None):
    o = o or {}
    is50 = fl >= 50 or u50; isH = is50 or fl >= 30 or ht >= 120 or high
    t = lambda h50, hh, base: h50 if is50 else hh if isH else base
    oh = 60 if is50 else 40 if isH else 40 if tun else 20
    sp = t(60, 40, 20); rs = 60 if tun else 20; ba = t(60, 40, 20)
    el = 60 if tun or fl >= 11 or o.get('light5') else 20
    r = [oh, sp, rs, ba, el, 20, 30] + ([60 if is50 else 40] if isH else [])
    gen = max(oh, sp, rs, ba, (60 if is50 else 40) if isH else 20, *( [el, 30] if o.get('genLW') else [] ))
    return r, gen

motorsets = [[15,2.2,0,22,2.2,0,18.5,11,0],[7.5,0,0,0,0,0,0,0,0],[0]*9,[30,3.7,1.5,55,3.7,0,37,30,5.5],[11,11,0,11,0,0,0,0,0]]
cases = []
for ms, non, ef, a, c, k, pl in itertools.product(motorsets, [0,1.5,3,12.4], [0.85,0.72,1.0], [1.38,1.45], [6,2,1.5,3,3.9,4.8], [1.07,1.10,1.13], [0,22,200]):
    cases.append(('k', [ms, non, ef, a, c, k, pl]))
for ms, non, ups, ue, uc, lam, vfm, hk in itertools.product(motorsets[:2] + motorsets[3:4], [0, 3, 12.4], [0, 5, 20, 100], [0.9, 0.95], [6, 10], [2.5, 1.5], [0, 1], [0, 1.5]):
    o = {'vf': [bool(vfm) and i == 0 for i in range(9)], 'harmKw': hk, 'lam': lam, 'upsKva': ups, 'upsEff': ue, 'upsChg': uc}
    cases.append(('o', [ms, non, 0.85, 1.45, 2, 1.10, 0, o]))
for fl, h, u, t in itertools.product([1,5,10,11,12,29,30,31,49,50,51,80], [False,True], [False,True], [False,True]):
    cases.append(('h', [fl, 0, h, u, t]))
# v6.1.7 — 높이(120 m) · opt(light5 비상조명 5용도 · genLW 발전기로 공급)
for fl, ht, t, l5, lw in itertools.product([1,5,11,29,30,50], [0,119.9,120,200], [False,True], [False,True], [False,True]):
    cases.append(('h', [fl, ht, False, False, t, {'light5': l5, 'genLW': lw}]))

def run(eng):
    js = eng + '\nconst C=' + json.dumps(cases) + ';\nconsole.log(JSON.stringify(C.map(([t,a])=>t==="h"?GENENG.hold(...a):GENENG.kds(...a))));'
    js = js.replace('window.GENENG', 'var GENENG', 1)
    with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as f: f.write(js); p = f.name
    try: return json.loads(subprocess.check_output(['node', p]))
    finally: os.unlink(p)

def compare(out):
    bad = 0; n = 0
    for (t, a), o in zip(cases, out):
        if t in ('k', 'o'):
            e = py_kds(*a) if t == 'k' else py_kds_opt(*a)
            for key in e:
                n += 1
                if abs(e[key] - o[key]) > 1e-9: bad += 1
        else:
            r, g = py_hold(a[0], a[2], a[3], a[4], a[1], a[5] if len(a) > 5 else None)
            got = [x[1] for x in o['rows']]
            n += len(r) + 1
            bad += sum(1 for x, y in itertools.zip_longest(r, got) if x != y) + (g != o['gen'])
            if not all(isinstance(x[2], str) and x[2] for x in o['rows']): bad += 1
    return n, bad

n, bad = compare(run(ENG))
res = {'cases': len(cases), 'checks': n, 'mismatch': bad}
if '--inject' in sys.argv:
    inj = {
        'a·c 순서 오류(PL × c 만)': ('PL * a * c', 'PL * c'),
        'PL 자동값 = ΣPm': ('var PL = plIn > 0 ? Math.min(plIn, sumPm) : plAuto;', 'var PL = plIn > 0 ? Math.min(plIn, sumPm) : sumPm;'),
        'ΣP = kW × 효율역률(곱)': ('(nonMotorKw - harmKw) / ef', '(nonMotorKw - harmKw) * ef'),
        '50층 경계 49층': ('floors >= 50 ||', 'floors >= 49 ||'),
        'UPS 충전용량 누락': ('+ upsKva * upsChg / 100 : 0', ': 0'),
        'UPS λ 누락': ('upsKva / upsEff * lam', 'upsKva / upsEff'),
        '발전기로 공급 시 비상조명 누락': ('opt.genLW ? rows[4][1] : 0', '0'),
        '비상조명 5용도 누락': ('(floors >= 11 || opt.light5) ? 60', '(floors >= 11) ? 60'),
    }
    res['inject'] = {}
    for name, (x, y) in inj.items():
        assert ENG.count(x) >= 1, name
        _, b = compare(run(ENG.replace(x, y, 1)))
        res['inject'][name] = {'mismatch': b, 'caught': b > 0}
print(json.dumps(res, ensure_ascii=False, indent=1))
ok = bad == 0 and all(v['caught'] for v in res.get('inject', {}).values())
sys.exit(0 if ok else 1)
