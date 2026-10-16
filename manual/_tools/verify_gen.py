#!/usr/bin/env python3
"""비상발전기 v5.1.0 계산 엔진 독립 검증 — usage: python3 verify_gen.py <index.html> [--inject]
index.html 의 window.GENENG 를 node 로 실행해, 아래 파이썬 독립 구현(KDS 31 60 20:2021 식 4.1-1 · 설비별 유지시간)과 전수 대조한다.
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

def py_hold(fl, high, u50, tun):
    is50 = fl >= 50 or u50; isH = is50 or fl >= 30 or high
    t = lambda h50, hh, base: h50 if is50 else hh if isH else base
    oh = 60 if is50 else 40 if isH else 40 if tun else 20
    sp = t(60, 40, 20); rs = 60 if tun else 20; ba = t(60, 40, 20)
    el = 60 if tun or fl >= 11 else 20
    r = [oh, sp, rs, ba, el, 20, 30] + ([60 if is50 else 40] if isH else [])
    gen = max(oh, sp, rs, ba, (60 if is50 else 40) if isH else 20)
    return r, gen

motorsets = [[15,2.2,0,22,2.2,0,18.5,11,0],[7.5,0,0,0,0,0,0,0,0],[0]*9,[30,3.7,1.5,55,3.7,0,37,30,5.5],[11,11,0,11,0,0,0,0,0]]
cases = []
for ms, non, ef, a, c, k, pl in itertools.product(motorsets, [0,1.5,3,12.4], [0.85,0.72,1.0], [1.38,1.45], [6,2,1.5,3,3.9,4.8], [1.07,1.10,1.13], [0,22,200]):
    cases.append(('k', [ms, non, ef, a, c, k, pl]))
for fl, h, u, t in itertools.product([1,5,10,11,12,29,30,31,49,50,51,80], [False,True], [False,True], [False,True]):
    cases.append(('h', [fl, 0, h, u, t]))

def run(eng):
    js = eng + '\nconst C=' + json.dumps(cases) + ';\nconsole.log(JSON.stringify(C.map(([t,a])=>t==="k"?GENENG.kds(...a):GENENG.hold(...a))));'
    js = js.replace('window.GENENG', 'var GENENG', 1)
    with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as f: f.write(js); p = f.name
    try: return json.loads(subprocess.check_output(['node', p]))
    finally: os.unlink(p)

def compare(out):
    bad = 0; n = 0
    for (t, a), o in zip(cases, out):
        if t == 'k':
            e = py_kds(*a)
            for key in e:
                n += 1
                if abs(e[key] - o[key]) > 1e-9: bad += 1
        else:
            r, g = py_hold(a[0], a[2], a[3], a[4])
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
        'ΣP = kW × 효율역률(곱)': ('nonMotorKw / ef', 'nonMotorKw * ef'),
        '50층 경계 49층': ('floors >= 50 ||', 'floors >= 49 ||'),
    }
    res['inject'] = {}
    for name, (x, y) in inj.items():
        assert ENG.count(x) >= 1, name
        _, b = compare(run(ENG.replace(x, y, 1)))
        res['inject'][name] = {'mismatch': b, 'caught': b > 0}
print(json.dumps(res, ensure_ascii=False, indent=1))
ok = bad == 0 and all(v['caught'] for v in res.get('inject', {}).values())
sys.exit(0 if ok else 1)
