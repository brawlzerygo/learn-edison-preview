import math
STAR='<path d="M0 -1 L0.2245 -0.309 L0.951 -0.309 L0.363 0.118 L0.588 0.809 L0 0.382 L-0.588 0.809 L-0.363 0.118 L-0.951 -0.309 L-0.2245 -0.309 Z"/>'
GAP=34
def ring(cx,cy,rx,ry,gap=GAP,w0=8,w1=40):
    a0=math.radians(180-gap); a1=math.radians(-180+gap)
    N=240; outer=[]; inner=[]; pts=[]
    for i in range(N+1):
        t=i/N; a=a0+(a1-a0)*t
        x=cx+rx*math.cos(a); y=cy+ry*math.sin(a)
        nx=math.cos(a)/rx; ny=math.sin(a)/ry; l=math.hypot(nx,ny); nx/=l; ny/=l
        w=(w0+(w1-w0)*(t**0.8))/2
        outer.append((x+nx*w,y+ny*w)); inner.append((x-nx*w,y-ny*w)); pts.append((x,y,nx,ny))
    x,y,nx,ny=pts[-1]; px,py=pts[-4][0],pts[-4][1]; tx,ty=x-px,y-py; l=math.hypot(tx,ty); tx/=l; ty/=l
    hw=w1*0.95; hl=w1*1.35
    tip=(x+tx*hl,y+ty*hl); b1=(x+nx*hw,y+ny*hw); b2=(x-nx*hw,y-ny*hw)
    return 'M'+' L'.join(f'{a:.1f} {b:.1f}' for a,b in outer)+f' L{b1[0]:.1f} {b1[1]:.1f} L{tip[0]:.1f} {tip[1]:.1f} L{b2[0]:.1f} {b2[1]:.1f} L'+' L'.join(f'{a:.1f} {b:.1f}' for a,b in reversed(inner))+' Z'
def rw(x,y,h):
    w=h*0.6
    return (f'<g fill="#fff" style="filter:drop-shadow(0 0 10px rgba(255,255,255,.35))">'
            f'<polygon points="{x-w*0.1:.0f},{y-h/2:.0f} {x-w*0.1:.0f},{y+h/2:.0f} {x-w*1.1:.0f},{y:.0f}"/>'
            f'<polygon points="{x+w*0.9:.0f},{y-h/2:.0f} {x+w*0.9:.0f},{y+h/2:.0f} {x-w*0.1:.0f},{y:.0f}"/></g>')
defs='''<defs><linearGradient id="g" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#a8320b"/><stop offset=".55" stop-color="#e2602a"/><stop offset="1" stop-color="#ff8a4a"/></linearGradient>
<filter id="sh"><feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000" flood-opacity=".45"/></filter></defs>'''
def pips(cx,y,n,r,gap):
    s=''; x0=cx-(n-1)*gap/2
    for i in range(n):
        x=x0+i*gap; s+=f'<circle cx="{x}" cy="{y}" r="{r}" fill="#c2410c"/><g transform="translate({x} {y}) scale({r*.72})" fill="#f59e0b" stroke="#fcd34d" stroke-width=".08">{STAR}</g>'
    return s
def word(x,y,size):
    return f'<text x="{x}" y="{y}" text-anchor="middle" font-family="Atkinson Hyperlegible" font-weight="700" font-size="{size}" letter-spacing="-2" fill="#f6eee6">Learn<tspan fill="#ff5b1f">Retro</tspan></text>'
page=lambda body: f'<link rel="stylesheet" href="base.css"><body><svg width="1000" height="1000" viewBox="0 0 1000 1000">{defs}{body}</svg></body>'
cx,cy=500,500
rx=410
v1=page(f'<path d="{ring(cx,cy,rx,190)}" fill="url(#g)" filter="url(#sh)"/>{rw(cx-rx+6,cy,66)}{word(cx+40,cy+38,116)}')
v2=page(f'<path d="{ring(cx,cy,rx,215)}" fill="url(#g)" filter="url(#sh)"/>{rw(cx-rx+6,cy,66)}{word(cx+40,cy+10,116)}{pips(cx+40,cy+85,6,22,58)}')
R=330
v3=page(f'<path d="{ring(cx,cy,R,R,gap=28,w1=44)}" fill="url(#g)" filter="url(#sh)"/>{rw(cx-R+6,cy,74)}'
        f'<text x="{cx+30}" y="{cy-20}" text-anchor="middle" font-family="Atkinson Hyperlegible" font-weight="700" font-size="150" letter-spacing="-3" fill="#f6eee6">Learn</text>'
        f'<text x="{cx+30}" y="{cy+115}" text-anchor="middle" font-family="Atkinson Hyperlegible" font-weight="700" font-size="150" letter-spacing="-3" fill="#ff5b1f">Retro</text>{pips(cx+30,cy+185,5,18,48)}')
R=360
v4=page(f'<path d="{ring(cx,cy,R,R,gap=28,w1=56,w0=12)}" fill="url(#g)" filter="url(#sh)"/>{rw(cx-R+8,cy,90)}'
        f'<text x="{cx+40}" y="{cy+95}" text-anchor="middle" font-family="Atkinson Hyperlegible" font-weight="700" font-size="300" letter-spacing="-8" fill="#f6eee6">L<tspan fill="#ff5b1f">R</tspan></text>')
for i,v in enumerate([v1,v2,v3,v4],1): open(f'{i}.html','w').write(v)
