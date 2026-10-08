# Low-level Excalidraw element builders.
# Conventions: text #1e1e1e (Excalidraw inverts it to white in dark mode), arrows straight when
# they go straight and gently curved where they bend, hachure fill only, minimum font 20.
import random, string, time
NOW=int(time.time()*1000)
K=1.0
FMIN=20
def rid(): return ''.join(random.choice(string.ascii_letters+string.digits+'_-') for _ in range(21))
def base(t,x,y,w,h,**k):
    bg=k.get('bg','transparent')
    return dict(id=rid(),type=t,x=x,y=y,width=w,height=h,angle=0,strokeColor=k.get('stroke','#1e1e1e'),
      backgroundColor=bg,fillStyle='hachure' if bg!='transparent' else 'solid',strokeWidth=k.get('sw',2),
      strokeStyle=k.get('style','solid'),roughness=1,opacity=100,groupIds=[],frameId=None,index=None,
      roundness=k.get('round',{'type':3}),seed=random.randint(1,2**31),version=1,versionNonce=random.randint(1,2**31),
      isDeleted=False,boundElements=[],updated=NOW,link=None,locked=False)
CW=0.56
def tsize(txt,fs):
    L=txt.split('\n');return max(len(l) for l in L)*fs*CW, len(L)*fs*1.25
def _text(x,y,txt,fs,cid=None,align='left',valign='top'):
    w,h=tsize(txt,fs); e=base('text',x,y,w,h,round=None)
    e.update(text=txt,fontSize=fs,fontFamily=5,textAlign=align,verticalAlign=valign,containerId=cid,originalText=txt,autoResize=True,lineHeight=1.25)
    return e
def right(b,g=0): return b['x']+b['width']+g
def below(b,g=0): return b['y']+b['height']+g
def cx(b): return b['x']+b['width']/2
def cyv(b): return b['y']+b['height']/2
class D:
    """a diagram: a list of elements plus helpers"""
    def __init__(s): s.els=[]
    def text(s,x,y,txt,fs=FMIN,color=None,raw=False):
        fs=max(fs,FMIN) if fs<30 else fs
        e=_text(x if raw else x*K,y if raw else y*K,txt,fs); s.els.append(e); return e
    def box(s,x,y,w,h,label='',t='rectangle',fs=FMIN,stroke='#1e1e1e',bg='transparent',style='solid',tcolor=None,raw=False):
        fs=max(fs,FMIN); X,Y=(x,y) if raw else (x*K,y*K)
        if label:
            tw,th=tsize(label,fs); pad=(1.6 if t!='rectangle' else 1)
            w=max(w,tw*pad+40); h=max(h,th*pad+30)
        e=base(t,X,Y,w,h,stroke=stroke,bg=bg,style=style,round=({'type':3} if t=='rectangle' else {'type':2}))
        s.els.append(e)
        if label:
            tw,th=tsize(label,fs); te=_text(X+(w-tw)/2,Y+(h-th)/2,label,fs,e['id'],'center','middle')
            e['boundElements'].append({'type':'text','id':te['id']}); s.els.append(te)
        return e
    def zone(s,x,y,w,h,title,color='#1971c2'):
        e=base('rectangle',x*K,y*K,w*K,h*K,stroke=color,style='dashed'); s.els.append(e)
        s.text(x*K+16,y*K+12,title,24,raw=True); return e
    def fit(s,z,els,pad=50):
        """grow a zone to fit the elements"""
        from_=[e for e in els]; x0,y0,x1,y1=bbox(from_)
        nx=min(z['x'],x0-pad); ny=min(z['y'],y0-pad-40)
        z['width']=max(z['x']+z['width'],x1+pad)-nx; z['height']=max(z['y']+z['height'],y1+pad)-ny
    def _mk(s,a,b,pts,label,color,style,both=False):
        # A straight arrow stays two points. Where it bends, each elbow is pulled inward by 15% of each leg
        # (the short leg weighs less), and Excalidraw draws a smooth curve through the points, like a hand-bent arrow.
        pts=[tuple(p) for p in pts]; route=list(pts)
        if len(pts)>2:
            def L(p,q): return ((q[0]-p[0])**2+(q[1]-p[1])**2)**.5 or 1
            out=[pts[0]]
            for i in range(1,len(pts)-1):
                p,c,n=pts[i-1],pts[i],pts[i+1]; li,lo=L(p,c),L(c,n); M=max(li,lo)
                out.append((c[0]+0.15/M*((p[0]-c[0])*li+(n[0]-c[0])*lo),c[1]+0.15/M*((p[1]-c[1])*li+(n[1]-c[1])*lo)))
            out.append(pts[-1]); pts=out
        x1,y1=pts[0]; P=[[px-x1,py-y1] for px,py in pts]
        xs=[p[0] for p in P];ys=[p[1] for p in P]
        e=base('arrow',x1,y1,max(xs)-min(xs),max(ys)-min(ys),stroke=color,style=style,round={'type':2})
        e.update(points=P,lastCommittedPoint=None,startBinding={'elementId':a['id'],'focus':0,'gap':6},endBinding={'elementId':b['id'],'focus':0,'gap':6},
                 startArrowhead='arrow' if both else None,endArrowhead='arrow',elbowed=False)
        a['boundElements'].append({'type':'arrow','id':e['id']}); b['boundElements'].append({'type':'arrow','id':e['id']})
        s.els.append(e)
        if label:
            segs=[(abs(route[i+1][0]-route[i][0])+abs(route[i+1][1]-route[i][1]),i) for i in range(len(route)-1)]
            _,i=max(segs); mx=(route[i][0]+route[i+1][0])/2; my=(route[i][1]+route[i+1][1])/2
            fs=18; tw,th=tsize(label,fs); te=_text(mx-tw/2,my-th/2,label,fs,e['id'],'center','middle')
            e['boundElements'].append({'type':'text','id':te['id']}); s.els.append(te)
        return e
    def legend(s,x,y,items,color='#f08c00',title='Legend'):
        """legend for diagrams with two arrow styles; items = [(strokeStyle, text)]; absolute x,y"""
        fs=20; tw=max(tsize(t,fs)[0] for _,t in items); W=190+tw+40; row=80
        H=60+row*len(items)+10
        r=base('rectangle',x,y,W,H,stroke=color); s.els.append(r)
        s.els.append(_text(x+18,y+12,title,28))
        for i,(st,t) in enumerate(items):
            yy=y+60+row*i
            ln=base('line',x,yy,W,0,stroke=color,round={'type':2}); ln.update(points=[[0,0],[W,0]],lastCommittedPoint=None,startBinding=None,endBinding=None,startArrowhead=None,endArrowhead=None); s.els.append(ln)
            ar=base('arrow',x+20,yy+row/2,150,0,style=st,round={'type':2}); ar.update(points=[[0,0],[150,0]],lastCommittedPoint=None,startBinding=None,endBinding=None,startArrowhead=None,endArrowhead='arrow',elbowed=False); s.els.append(ar)
            th=tsize(t,fs)[1]; s.els.append(_text(x+190,yy+row/2-th/2,t,fs))
        return r
    def arrow(s,a,b,label='',color='#1e1e1e',style='solid',route='direct',both=False,**_):
        """orthogonal arrow: straight when boxes overlap on an axis, else L (hv/vh) or Z (hvh/vhv)"""
        G=6
        if route=='direct':
            dx=cx(b)-cx(a); dy=cyv(b)-cyv(a)
            if _.get('side')=='h' or (_.get('side')!='v' and abs(dx)>=abs(dy)*0.6):
                pts=[(right(a,G),cyv(a)),(b['x']-G,cyv(b))] if dx>0 else [(a['x']-G,cyv(a)),(right(b,G),cyv(b))]
            else:
                pts=[(cx(a),below(a,G)),(cx(b),b['y']-G)] if dy>0 else [(cx(a),a['y']-G),(cx(b),below(b,G))]
            return s._mk(a,b,pts,label,color,style,both)
        oy=(max(a['y'],b['y']),min(below(a),below(b)))
        ox=(max(a['x'],b['x']),min(right(a),right(b)))
        if oy[1]-oy[0]>20 and route in('hv','vh','hvh'):
            y=(oy[0]+oy[1])/2
            pts=[(right(a,G),y),(b['x']-G,y)] if cx(b)>cx(a) else [(a['x']-G,y),(right(b,G),y)]
        elif ox[1]-ox[0]>20 and route in('hv','vh','vhv'):
            x=(ox[0]+ox[1])/2
            pts=[(x,below(a,G)),(x,b['y']-G)] if cyv(b)>cyv(a) else [(x,a['y']-G),(x,below(b,G))]
        elif route=='hv':
            sx=right(a,G) if cx(b)>cx(a) else a['x']-G; ey=b['y']-G if cyv(b)>cyv(a) else below(b,G)
            pts=[(sx,cyv(a)),(cx(b),cyv(a)),(cx(b),ey)]
        elif route=='vh':
            sy=below(a,G) if cyv(b)>cyv(a) else a['y']-G; ex=b['x']-G if cx(b)>cx(a) else right(b,G)
            pts=[(cx(a),sy),(cx(a),cyv(b)),(ex,cyv(b))]
        elif route=='hvh':
            sx=right(a,G) if cx(b)>cx(a) else a['x']-G; ex=b['x']-G if cx(b)>cx(a) else right(b,G); mx=(sx+ex)/2
            pts=[(sx,cyv(a)),(mx,cyv(a)),(mx,cyv(b)),(ex,cyv(b))]
        else:  # vhv
            sy=below(a,G) if cyv(b)>cyv(a) else a['y']-G; ey=b['y']-G if cyv(b)>cyv(a) else below(b,G); my=(sy+ey)/2
            pts=[(cx(a),sy),(cx(a),my),(cx(b),my),(cx(b),ey)]
        return s._mk(a,b,pts,label,color,style,both)
    def path(s,a,b,pts,label='',color='#1e1e1e',style='solid'):
        """absolute points already computed from the boxes"""
        return s._mk(a,b,pts,label,color,style)
def bbox(els):
    xs=[];ys=[]
    for e in els:
        if 'points' in e:
            xs+= [e['x']+p[0] for p in e['points']]; ys+=[e['y']+p[1] for p in e['points']]
        else: xs+=[e['x'],e['x']+e['width']]; ys+=[e['y'],e['y']+e['height']]
    return min(xs),min(ys),max(xs),max(ys)
def move(els,dx,dy):
    for e in els: e['x']+=dx; e['y']+=dy
