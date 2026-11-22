"""Build Learn Edison's data files from edisonformat.net and the mikaRulings repo.

Sources (downloaded into build/raw/ and build/rulings/ first, see README in this folder):
  raw/EdisonCards.json   https://edisonformat.net/data/json/EdisonCards.json  (cards, stats, banlist)
  raw/decks.json         https://edisonformat.net/data/json/decks.json        (starter deck names and tiers)
  raw/ydk/<name>.ydk     https://edisonformat.net/data/ydk/structure/<name>.ydk
  rulings/cards/<id>.json  git clone --depth 1 https://github.com/MikaMikaDE/mikaRulings
                           (Edison-accurate card text "PSCT.Edison", Edison rulings, general rulings)

Writes (loaded by index.html with <script> tags, so the page also works opened as a local file):
  ../data/cards.js   window.EDISON_CARDS = [...]
  ../data/decks.js   window.EDISON_DECKS = [...]
  ../data/meta.js    window.EDISON_META = {...}   (sources and build date)

With --images it also downloads card art for every card in a starter deck or a lesson into ../img/<id>.webp,
paced and skipping files already there. Other cards load their art from img.edisonformat.net when viewed.
"""
import json, os, re, sys, time, glob, datetime, urllib.request, urllib.parse

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
UA = {'User-Agent': 'Mozilla/5.0 (personal study tool)'}
ALIAS = {83011277: 83011278}  # alt-art passcode in two starter decks -> Mystic Tomato

def clean(s, empty_prefixes):
    if not s:
        return ''
    s = s.replace('\\n', '\n').strip()
    if any(s.startswith(p) for p in empty_prefixes):
        return ''
    return s

def main():
    cards = json.load(open(os.path.join(HERE, 'raw/EdisonCards.json')))
    out = []
    for c in cards:
        if c.get('Banlist') == 'Illegal':
            continue
        rec = {'id': c['id'], 'n': c['Name'], 'tx': c.get('Text', '')}
        attr = c.get('Attribute')
        if attr in ('SPELL', 'TRAP'):
            rec['k'] = attr.lower()
            rec['sub'] = c.get('Type') or 'Normal'
        else:
            extra = c.get('Extra') or 'Normal'
            rec['k'] = 'synchro' if 'Synchro' in extra and extra != 'non-Synchro' else 'fusion' if 'Fusion' in extra else 'ritual' if 'Ritual' in extra else 'normal' if extra.startswith('Normal') else 'effect'
            rec['ab'] = extra            # e.g. "Effect Tuner", "Flip Effect", "Synchro"
            rec['a'] = attr
            rec['r'] = c.get('Type')     # race
            rec['lv'] = c.get('Level')
            rec['atk'] = c.get('Atk')
            rec['def'] = c.get('Def')
            if 'Tuner' in extra:
                rec['tu'] = 1
        b = {'Forbidden': 'F', 'Limited': 'L', 'Semi-Limited': 'S'}.get(c.get('Banlist'))
        if b:
            rec['b'] = b
        p = os.path.join(HERE, 'rulings/cards/%d.json' % c['id'])
        if os.path.exists(p):
            d = json.load(open(p))
            ps = clean(d.get('PSCT', {}).get('Edison'), ['No updated text'])
            ru = clean(d.get('Rulings', {}).get('Edison'), ['No rulings found'])
            rb = clean(d.get('Rulings', {}).get('Base'), ['No rulings found'])
            if ps: rec['ps'] = ps
            if ru: rec['ru'] = re.sub(r'(?<!\n)●', '\n●', ru).strip()
            if rb: rec['rb'] = rb
        out.append(rec)
    ids = {r['id'] for r in out}

    tiers = json.load(open(os.path.join(HERE, 'raw/decks.json')))
    decks = []
    for t in tiers:
        f = os.path.join(HERE, 'raw/ydk', t['Name'] + '.ydk')
        if not os.path.exists(f):
            print('missing deck file', t['Name'])
            continue
        sec = None
        dk = {'name': t['Name'], 'tier': t['Tags'], 'main': [], 'extra': [], 'side': []}
        for line in open(f, encoding='utf-8', errors='replace'):
            line = line.strip()
            if line == '#main': sec = 'main'
            elif line == '#extra': sec = 'extra'
            elif line == '!side': sec = 'side'
            elif line.isdigit() and sec:
                i = ALIAS.get(int(line), int(line))
                if i in ids:
                    dk[sec].append(i)
                else:
                    print('unknown card', i, 'in', t['Name'])
        decks.append(dk)

    os.makedirs(os.path.join(ROOT, 'data'), exist_ok=True)
    with open(os.path.join(ROOT, 'data/cards.js'), 'w') as fh:
        fh.write('window.EDISON_CARDS=' + json.dumps(out, ensure_ascii=False, separators=(',', ':')) + ';\n')
    with open(os.path.join(ROOT, 'data/decks.js'), 'w') as fh:
        fh.write('window.EDISON_DECKS=' + json.dumps(decks, ensure_ascii=False, separators=(',', ':')) + ';\n')
    # Errata list (raw/errata.json from https://edisonformat.net/rules/errata.json): cards that work
    # differently in Edison, each with the change (Desc) and the Edison text (Text).
    ep = os.path.join(HERE, 'raw/errata.json')
    if os.path.exists(ep):
        byname = {r['n']: r['id'] for r in out}
        errata = [{'n': e['Name'], 'id': byname.get(e['Name']), 'what': e.get('Desc', '').replace('\\n', '\n'),
                   'text': e.get('Text', '').replace('\\n', '\n')} for e in json.load(open(ep))]
        with open(os.path.join(ROOT, 'data/errata.js'), 'w') as fh:
            fh.write('window.EDISON_ERRATA=' + json.dumps(errata, ensure_ascii=False, separators=(',', ':')) + ';\n')
        print('errata', len(errata), 'unmatched', [e['n'] for e in errata if not e['id']])

    meta = {'built': datetime.date.today().isoformat(), 'cards': len(out), 'decks': len(decks),
            'sources': ['https://edisonformat.net', 'https://github.com/MikaMikaDE/mikaRulings']}
    with open(os.path.join(ROOT, 'data/meta.js'), 'w') as fh:
        fh.write('window.EDISON_META=' + json.dumps(meta) + ';\n')
    print('cards', len(out), 'decks', len(decks))

    if '--images' in sys.argv or '--all-images' in sys.argv:
        want = set(r['id'] for r in out) if '--all-images' in sys.argv else set()
        for d in decks:
            want.update(d['main'] + d['extra'] + d['side'])
        lesson = os.path.join(HERE, 'lesson_cards.txt')   # card names the lessons use, one per line
        byname = {r['n']: r['id'] for r in out}
        if os.path.exists(lesson):
            for n in open(lesson):
                n = n.strip()
                if n in byname: want.add(byname[n])
                elif n: print('lesson card not found:', n)
        name = {r['id']: r['n'] for r in out}
        os.makedirs(os.path.join(ROOT, 'img'), exist_ok=True)
        todo = [i for i in sorted(want) if not os.path.exists(os.path.join(ROOT, 'img/%d.webp' % i))]
        print('images wanted', len(want), 'to download', len(todo))
        fails = []
        for n, i in enumerate(todo, 1):
            url = 'https://img.edisonformat.net/large/' + urllib.parse.quote(name[i]) + '.webp'
            try:
                data = urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30).read()
                if data[:4] != b'RIFF':
                    raise ValueError('not a webp')
                open(os.path.join(ROOT, 'img/%d.webp' % i), 'wb').write(data)
            except Exception as e:
                fails.append((name[i], str(e)))
            if n % 50 == 0:
                print('images', n, 'of', len(todo), flush=True)
            time.sleep(0.35)
        print('image failures', fails)

    # Cards edisonformat.net has no art for: take YGOPRODeck's image (by passcode, cached once, paced well
    # under its 20 requests a second) and convert it to WebP with cwebp so every card is img/<id>.webp.
    if '--fill-missing' in sys.argv:
        import subprocess, tempfile
        name = {r['id']: r['n'] for r in out}
        missing = [i for i in sorted(name) if not os.path.exists(os.path.join(ROOT, 'img/%d.webp' % i))]
        print('missing art', len(missing))
        fails = []
        for i in missing:
            url = 'https://images.ygoprodeck.com/images/cards/%d.jpg' % i
            try:
                data = urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30).read()
                if data[:2] != b'\xff\xd8':
                    raise ValueError('not a jpg')
                with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as tf:
                    tf.write(data)
                subprocess.run(['cwebp', '-quiet', '-q', '88', '-resize', '421', '614', tf.name, '-o', os.path.join(ROOT, 'img/%d.webp' % i)], check=True)
                os.unlink(tf.name)
            except Exception as e:
                fails.append((name[i], str(e)))
            time.sleep(0.25)
        print('YGOPRODeck art failures', fails)

    # Which cards have local art: the page uses img/<id>.webp for these and img.edisonformat.net for the rest.
    local = sorted(int(os.path.basename(f)[:-5]) for f in glob.glob(os.path.join(ROOT, 'img/*.webp')))
    with open(os.path.join(ROOT, 'data/localimg.js'), 'w') as fh:
        fh.write('window.EDISON_LOCALIMG=' + json.dumps(local, separators=(',', ':')) + ';\n')
    print('local images', len(local))

if __name__ == '__main__':
    main()
