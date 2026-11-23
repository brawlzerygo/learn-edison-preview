import math
STAR='<path d="M0 -1 L0.2245 -0.309 L0.951 -0.309 L0.363 0.118 L0.588 0.809 L0 0.382 L-0.588 0.809 L-0.363 0.118 L-0.951 -0.309 L-0.2245 -0.309 Z"/>'
def arrow(cx,cy,rx,ry,w,gap=28):
    """Standard rewind arrow: even stroke, flat-cut tail, solid triangle head. Runs counter-clockwise
    from the tail (just below the left gap) round the bottom, right and top to the head (just above the gap)."""
    a0=math.radians(180-gap); a1=math.radians(-180+gap); N=300; out=[]; inn=[]; P=[]
    for i in range(N+1):
        a=a0+(a1-a0)*i/N; x=cx+rx*math.cos(a); y=cy+ry*math.sin(a)
        nx=math.cos(a)/rx; ny=math.sin(a)/ry; l=math.hypot(nx,ny); nx/=l; ny/=l
        out.append((x+nx*w/2,y+ny*w/2)); inn.append((x-nx*w/2,y-ny*w/2)); P.append((x,y,nx,ny))
    x,y,nx,ny=P[-1]; px,py=P[-3][0],P[-3][1]; tx,ty=x-px,y-py; l=math.hypot(tx,ty); tx/=l; ty/=l
    hw=w*1.45; hl=w*1.7
    tip=(x+tx*hl,y+ty*hl); b1=(x+nx*hw,y+ny*hw); b2=(x-nx*hw,y-ny*hw)
    f=lambda p:f'{p[0]:.1f} {p[1]:.1f}'
    return 'M'+' L'.join(map(f,out))+' L'+f(b1)+' L'+f(tip)+' L'+f(b2)+' L'+' L'.join(map(f,reversed(inn)))+' Z'
def rw_svg(h):  # two white rewind triangles, touching, as inline svg sized to cap height
    w=h*1.15
    return (f'<svg width="{w:.0f}" height="{h:.0f}" viewBox="0 0 115 100" style="flex:none">'
            f'<polygon points="57,0 57,100 0,50" fill="#fff"/><polygon points="115,0 115,100 58,50" fill="#fff"/></svg>')
def pips(n,size):
    return '<div style="display:flex;gap:14px;justify-content:center">'+''.join(f'<svg width="{size}" height="{size}" viewBox="-1.1 -1.1 2.2 2.2" style="filter:drop-shadow(0 0 6px rgba(245,158,11,.45))"><circle r="1.05" fill="#c2410c"/><g transform="scale(.72)" fill="#f59e0b" stroke="#fcd34d" stroke-width=".08">{STAR}</g></svg>' for _ in range(n))+'</div>'
def mark(size,gapem=0.14):  # ◀◀ right next to the L, then LearnRetro
    return (f'<div style="display:flex;align-items:center;gap:{gapem}em;font-size:{size}px;font-weight:700;letter-spacing:-.01em;line-height:1">'
            f'{rw_svg(size*0.72)}<span>Learn<span style="color:#ff5b1f">Retro</span></span></div>')
def page(ring_d,inner,col='#e2602a'):
    return (f'<link rel="stylesheet" href="base.css"><body><svg width="1000" height="1000" style="position:absolute;left:0;top:0">'
            f'<path d="{ring_d}" fill="{col}"/></svg><div style="position:relative;display:flex;flex-direction:column;align-items:center;gap:26px">{inner}</div></body>')
cx,cy=500,500
pages=[
 page(arrow(cx,cy,440,175,40), mark(104)),
 page(arrow(cx,cy,440,205,40), mark(104)+pips(6,46)),
 page(arrow(cx,cy+8,300,300,64), '<div style="transform:translateY(8px)">'+rw_svg(300*0.72).replace('width="248"','width="248"')+'</div>'),
 page(arrow(cx,cy+8,330,330,64), mark(150,0.1).replace('Learn<span style="color:#ff5b1f">Retro</span>','L<span style="color:#ff5b1f">R</span>')),
]
for i,p in enumerate(pages,1): open(f'{i}.html','w').write(p)
