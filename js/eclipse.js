const Fn=!1,O=Math.PI*2,I=Math.PI/180,Y=1200,Ce=24,qt=2,Ue=.35,ln=Math.PI/3,kt=[{name:"react",accent:"#61dafb"},{name:"next.js",accent:"#e9ebef"},{name:"typescript",accent:"#3178c6"},{name:"javascript",accent:"#f7df1e"},{name:"tailwind",accent:"#5fbfe9"},{name:"git",accent:"#f05032"}],N=(e,n,a)=>Math.min(a,Math.max(n,e)),et=(e,n,a)=>e+(n-e)*a,nt=(e,n,a)=>{const r=N((a-e)/(n-e),0,1);return r*r*(3-2*r)},ze=e=>1-Math.pow(1-N(e,0,1),3),Oe=e=>e>=1?1:1-Math.pow(2,-10*Math.max(0,e)),ae=e=>Math.atan2(Math.sin(e),Math.cos(e)),wt=(e,n,a,r)=>n+(e-n)*Math.exp(-a*r);function pt(e){const n=parseInt(e.slice(1),16);return[n>>16&255,n>>8&255,n&255].map(a=>(a/=255,a<=.04045?a/12.92:Math.pow((a+.055)/1.055,2.4)))}const H=()=>new Float32Array(16);function Yt(e){return e.fill(0),e[0]=e[5]=e[10]=e[15]=1,e}function ht(e,n,a){for(let r=0;r<4;r++)for(let f=0;f<4;f++)e[r*4+f]=n[f]*a[r*4]+n[4+f]*a[r*4+1]+n[8+f]*a[r*4+2]+n[12+f]*a[r*4+3];return e}function Ne(e,n){Yt(e);const a=Math.cos(n),r=Math.sin(n);return e[5]=a,e[6]=r,e[9]=-r,e[10]=a,e}function ie(e,n){Yt(e);const a=Math.cos(n),r=Math.sin(n);return e[0]=a,e[2]=-r,e[8]=r,e[10]=a,e}function Wt(e,n){Yt(e);const a=Math.cos(n),r=Math.sin(n);return e[0]=a,e[1]=r,e[4]=-r,e[5]=a,e}function Xt(e,n,a,r,f){return f[0]=e[0]*n+e[4]*a+e[8]*r+e[12],f[1]=e[1]*n+e[5]*a+e[9]*r+e[13],f[2]=e[2]*n+e[6]*a+e[10]*r+e[14],f}function un(e,n,a,r,f,p,h){return e.fill(0),e[0]=2*p/(a-n),e[5]=2*p/(f-r),e[8]=(a+n)/(a-n),e[9]=(f+r)/(f-r),e[10]=-(h+p)/(h-p),e[11]=-1,e[14]=-2*h*p/(h-p),e}const Ge=(e,n)=>[e[0]-n[0],e[1]-n[1],e[2]-n[2]],qe=(e,n)=>e[0]*n[0]+e[1]*n[1]+e[2]*n[2],Bt=(e,n)=>[e[1]*n[2]-e[2]*n[1],e[2]*n[0]-e[0]*n[2],e[0]*n[1]-e[1]*n[0]],it=e=>{const n=Math.hypot(e[0],e[1],e[2])||1;return[e[0]/n,e[1]/n,e[2]/n]};function fn(e,n,a){const r=Math.cos(a),f=Math.sin(a),p=Bt(n,e),h=qe(n,e)*(1-r);return[e[0]*r+p[0]*f+n[0]*h,e[1]*r+p[1]*f+n[1]*h,e[2]*r+p[2]*f+n[2]*h]}function dn(e,n){let a=e+n*Math.sin(e);for(let r=0;r<5;r++)a-=(a-n*Math.sin(a)-e)/(1-n*Math.cos(a));return a}function pn(e,n,a,r){const f=dn(e,a),p=n/(1-a*a);return r[0]=p*(Math.cos(f)-a),r[1]=-p*Math.sqrt(1-a*a)*Math.sin(f),r[2]=0,Math.atan2(r[1],r[0])}const At=H(),Ht=H(),Ye=H();function re(e,n,a,r,f){return ie(At,n.incl),Wt(Ht,n.apo-Math.PI+f),ht(Ye,Ht,At),ie(At,r),ht(Ht,At,Ye),Ne(At,a),ht(e,At,Ht)}class ut{constructor(){this.v=[],this.i=[]}get count(){return this.v.length/10}push(n,a,r,f,p,h){this.v.push(n[0],n[1],n[2],a[0],a[1],a[2],r,f,p,h)}lattice(n,a,r){for(let f=0;f<a;f++)for(let p=0;p<n;p++){const h=r+f*(n+1)+p,T=h+1,x=h+n+1,E=x+1;this.i.push(h,T,x,T,E,x)}}append(n,a){const r=this.count,f=[0,0,0];for(let p=0;p<n.v.length;p+=10){const h=n.v;if(a){Xt(a,h[p],h[p+1],h[p+2],f);const T=it([a[0]*h[p+3]+a[4]*h[p+4]+a[8]*h[p+5],a[1]*h[p+3]+a[5]*h[p+4]+a[9]*h[p+5],a[2]*h[p+3]+a[6]*h[p+4]+a[10]*h[p+5]]);this.push(f,T,h[p+6],h[p+7],h[p+8],h[p+9])}else this.v.push(...h.slice(p,p+10))}for(const p of n.i)this.i.push(p+r)}}function ce(e,n,a,r,f,p,h,T,x=1){const E=[],y=[];for(let i=0;i<=a;i++)E.push(n(i/a));for(let i=0;i<=a;i++){const R=E[i===0?p?a-1:0:i-1],t=E[i===a?p?1:a:i+1];y.push(it(Ge(t,R)))}let d=it(Math.abs(y[0][2])<.9?Bt(y[0],[0,0,1]):Bt(y[0],[1,0,0]));const v=e.count;for(let i=0;i<=a;i++){if(i>0){const c=Bt(y[i-1],y[i]),P=Math.hypot(c[0],c[1],c[2]);P>1e-6&&(d=fn(d,[c[0]/P,c[1]/P,c[2]/P],Math.acos(N(qe(y[i-1],y[i]),-1,1))))}const R=Bt(y[i],d),t=typeof r=="function"?r(i/a):r;for(let c=0;c<=f;c++){const P=c/f*O,D=Math.cos(P),C=Math.sin(P),U=[d[0]*D+R[0]*C,d[1]*D+R[1]*C,d[2]*D+R[2]*C],V=it([U[0],U[1],U[2]/x]);e.push([E[i][0]+U[0]*t,E[i][1]+U[1]*t,E[i][2]+U[2]*t*x],V,-1,-1,h,T)}}e.lattice(f,a,v)}function We(e,n,a,r,f,p,h){const T=e.count;for(let x=0;x<=f;x++)for(let E=0;E<=r;E++){const y=E/r*O,d=x/f*Math.PI,v=[Math.sin(d)*Math.cos(y),Math.cos(d),Math.sin(d)*Math.sin(y)];e.push([n[0]+v[0]*a,n[1]+v[1]*a,n[2]+v[2]*a],v,-1,-1,p,h)}e.lattice(r,f,T)}function Xe(e,n,a){const r=[];for(let f=a;f>=1;f--)r.push(-(e-n)-n*Math.tan(f/a*Math.PI/4));for(let f=-4;f<=4;f++)r.push((e-n)*f/4);for(let f=1;f<=a;f++)r.push(e-n+n*Math.tan(f/a*Math.PI/4));return r}function He(e,n,a,r,f,p=0){for(let h=0;h<3;h++)for(const T of[1,-1]){const x=(h+1)%3,E=(h+2)%3,y=Xe(n[x],a,r),d=Xe(n[E],a,r),v=e.count;for(let i=0;i<d.length;i++)for(let R=0;R<y.length;R++){const t=[0,0,0];t[h]=T*n[h],t[x]=y[R],t[E]=d[i];const c=t.map((Q,j)=>N(Q,-(n[j]-a),n[j]-a));let P=it(Ge(t,c));const D=[c[0]+P[0]*a,c[1]+P[1]*a,c[2]+P[2]*a];if(p&&h===2&&T===1){const Q=n[0]-a,j=n[1]-a,rt=D[0]*D[0]/(Q*Q)+D[1]*D[1]/(j*j);rt<1&&(D[2]-=p*(1-rt),P=it([P[0]-2*p*D[0]/(Q*Q),P[1]-2*p*D[1]/(j*j),P[2]]))}const[C,U,V,st]=f(D,P);e.push(D,P,C,U,V,st)}e.lattice(y.length-1,d.length-1,v)}}function hn(e,n,a){for(const[r,f,p,h,T,x]of n){const E=it([-(h-f),0,p-r]),y=e.count;for(let d=0;d<=1;d++)for(let v=0;v<=a;v++){const i=v/a*O,R=Math.cos(i),t=Math.sin(i),c=d?p:r;e.push([c*R,c*t,d?h:f],[E[0]*R,E[0]*t,E[2]],-1,-1,T,x)}e.lattice(a,1,y)}}function le(e,n,a,r,f,p){const h=new ut;for(let x=0;x<3;x++)for(const E of[1,-1]){const y=(x+1)%3,d=(x+2)%3,v=[0,0,0];v[x]=E;const i=h.count;for(const[R,t]of[[-1,-1],[1,-1],[-1,1],[1,1]]){const c=[0,0,0];c[x]=E*a[x],c[y]=R*a[y],c[d]=t*a[d],h.push(c,v,-1,-1,f,p)}h.lattice(1,1,i)}const T=Wt(H(),r);T[12]=n[0],T[13]=n[1],T[14]=n[2],e.append(h,T)}function kn(e,n,a,r,f,p,h){const T=[],x=[],E=[];for(let i=0;i<=f;i++)T.push(n(i/f));for(let i=0;i<=f;i++){const R=T[Math.max(0,i-1)],t=T[Math.min(f,i+1)],c=it([t[0]-R[0],t[1]-R[1],0]);x.push([-c[1],c[0]]),E.push(a(i/f)/2)}const y=r/2,d=(i,R,t)=>[T[i][0]+x[i][0]*E[i]*R,T[i][1]+x[i][1]*E[i]*R,t*y],v=(i,R,t)=>{const c=e.count;for(let P=0;P<=f;P++)e.push(i(P),t(P),-1,-1,p,h),e.push(R(P),t(P),-1,-1,p,h);e.lattice(1,f,c)};v(i=>d(i,1,1),i=>d(i,-1,1),()=>[0,0,1]),v(i=>d(i,-1,-1),i=>d(i,1,-1),()=>[0,0,-1]),v(i=>d(i,1,-1),i=>d(i,1,1),i=>[x[i][0],x[i][1],0]),v(i=>d(i,-1,1),i=>d(i,-1,-1),i=>[-x[i][0],-x[i][1],0]);for(const[i,R]of[[0,-1],[f,1]]){const t=it([(T[Math.min(f,i+1)][0]-T[Math.max(0,i-1)][0])*R,(T[Math.min(f,i+1)][1]-T[Math.max(0,i-1)][1])*R,0]),c=e.count;for(const[P,D]of[[1,1],[-1,1],[1,-1],[-1,-1]])e.push(d(i,P,D),t,-1,-1,p,h);e.lattice(1,1,c)}}function mn(){const e=[];let n=new ut;for(let v=0;v<3;v++){const i=v*Math.PI/3,R=Math.cos(i),t=Math.sin(i);ce(n,c=>{const P=.47*Math.cos(c*O),D=.18*Math.sin(c*O);return[P*R-D*t,P*t+D*R,0]},72,.04,8,!0,.75,0)}We(n,[0,0,0],.105,16,12,1,0),e.push(n),n=new ut;const a=.44,r=.06,f=.028;hn(n,[[0,r,a-f,r,0,0],[a-f,r,a,r-f,1,0],[a,r-f,a,-(r-f),1,0],[a,-(r-f),a-f,-r,1,0],[a-f,-r,0,-r,0,0]],56);const p=r+.018;le(n,[-.15,0,p],[.036,.19,.02],0,0,1),le(n,[.15,.06,p],[.036,.13,.02],0,0,1),le(n,[0,0,p],[.036,Math.hypot(.3,.38)/2,.02],Math.atan2(.3,.38),0,1),e.push(n);for(const v of[0,1]){n=new ut;const i=[.36,.36,.2];He(n,i,.1,5,(R,t)=>[N(R[0]/(2*i[0])+.5,0,1)*.5+v*.5,N(.5-R[1]/(2*i[1]),0,1),nt(.55,.92,t[2]),0],.028),e.push(n)}n=new ut;for(const[v,i]of[[-.09,.115],[.09,-.115]])ce(n,R=>[-.36+.72*R+v,.075*Math.sin(O*R)+i,0],40,R=>.016+.062*Math.pow(Math.sin(Math.PI*R),.8),10,!1,1,0,.55);e.push(n),n=new ut;const h=new ut;He(h,[.3,.3,.055],.05,4,()=>[-1,-1,1,0]),n.append(h,Wt(H(),Math.PI/4));const T=.085,x=[[-.07,-.17,T],[-.07,.15,T],[.15,.03,T]];for(const v of x)We(n,v,.058,12,8,0,1);const E=(v,i)=>ce(n,R=>[et(v[0],i[0],R),et(v[1],i[1],R),et(v[2],i[2],R)],1,.03,8,!1,0,1);E(x[0],x[1]),E([-.07,-.05,T],x[2]),e.push(n);const y=new ut,d=[];for(const v of e){const i=y.i.length;y.append(v),d.push({start:i,count:y.i.length-i})}return{verts:new Float32Array(y.v),index:new Uint16Array(y.i),ranges:d}}function xn(){const e=document.createElement("canvas");e.width=256,e.height=128;const n=e.getContext("2d");return n.fillStyle="#000",n.fillRect(0,0,256,128),n.fillStyle="#fff",n.textAlign="center",n.textBaseline="middle",n.font='500 62px "Geist Mono", ui-monospace, monospace',n.fillText("ts",64,66),n.fillText("js",192,66),e}const vn=`#version 300 es
layout(location=0) in vec3 aPos;
layout(location=1) in vec3 aNrm;
layout(location=2) in vec2 aUv;
layout(location=3) in vec2 aMG;
uniform mat4 uPV, uModel;
uniform mat3 uRot;
out vec3 vPos; out vec3 vNrm; out vec2 vUv; out vec2 vMG;
void main() {
  vec4 wp = uModel * vec4(aPos, 1.0);
  vPos = wp.xyz;
  vNrm = uRot * aNrm;
  vUv = aUv;
  vMG = aMG;
  gl_Position = uPV * wp;
}`,yn=`#version 300 es
precision highp float;
in vec3 vPos; in vec3 vNrm; in vec2 vUv; in vec2 vMG;
uniform vec3 uCam, uBase, uGlyph, uAccent, uRimColor;
uniform vec2 uSunDir;
uniform float uAccentAmt, uEmissive, uRim, uExposure;
uniform sampler2D uLegend;
out vec4 frag;
float panel(vec3 R, vec3 d, vec2 h, float soft) {
  float z = dot(R, d);
  if (z <= 0.0) return 0.0;
  vec3 ux = normalize(cross(vec3(0.0, 1.0, 0.0), d));
  vec3 uy = cross(d, ux);
  vec2 q = abs(vec2(dot(R, ux), dot(R, uy)) / z);
  vec2 e = smoothstep(h + soft, h - soft, q);
  return e.x * e.y;
}
vec3 studio(vec3 R, float rough) {
  float soft = 0.05 + rough * 0.9;
  float key = panel(R, normalize(vec3(0.45, 0.62, 0.64)), vec2(0.55, 0.3), soft);
  float strip = panel(R, normalize(vec3(-0.86, 0.12, 0.5)), vec2(0.07, 0.9), soft * 0.7);
  float sky = mix(0.012, 0.08, smoothstep(-0.4, 0.8, R.y));
  return vec3(1.0, 0.97, 0.93) * key * 3.4 + vec3(0.62, 0.7, 1.0) * strip * 1.4 + vec3(sky);
}
vec3 aces(vec3 x) { return clamp(x * (2.51 * x + 0.03) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
void main() {
  vec3 N = normalize(vNrm);
  vec3 V = normalize(uCam - vPos);
  float NdV = clamp(dot(N, V), 0.0, 1.0);
  vec3 R = reflect(-V, N);
  float legend = vUv.x >= 0.0 ? texture(uLegend, vUv).r : 1.0;
  float acc = clamp(vMG.x * legend, 0.0, 1.0);
  vec3 albedo = mix(mix(uBase, uAccent, acc * uAccentAmt), uGlyph, vMG.y);
  float F = 0.04 + 0.96 * pow(1.0 - NdV, 5.0);
  vec3 key = normalize(vec3(0.4, 0.6, 0.7));
  vec3 col = albedo * (0.3 + 0.95 * max(dot(N, key), 0.0)) * (1.0 - F);
  col += studio(R, 0.34) * F + studio(R, 0.07) * F * 0.85;
  vec2 nxy = N.xy + vec2(1e-4);
  col += uRimColor * pow(1.0 - NdV, 3.0) * clamp(dot(normalize(nxy), uSunDir), 0.0, 1.0) * uRim;
  col += uAccent * acc * uEmissive;
  col = aces(col * uExposure);
  frag = vec4(pow(col, vec3(1.0 / 2.2)), 1.0);
}`,gn=`#version 300 es
layout(location=0) in vec3 aPos;
uniform mat4 uMVP;
void main() { gl_Position = uMVP * vec4(aPos, 1.0); }`,Mn=`#version 300 es
precision mediump float;
uniform vec4 uColor;
out vec4 frag;
void main() { frag = uColor; }`,bn=`#version 300 es
layout(location=0) in vec2 aP;
uniform mat4 uPV;
out vec2 vP;
void main() { vP = aP; gl_Position = uPV * vec4(aP, 0.5, 1.0); }`,wn=`#version 300 es
precision highp float;
in vec2 vP;
uniform float uR, uSun, uStarLen, uStarAmp, uCorona, uArc, uMaskHalf, uGuard, uTime, uLight, uBloom, uPulse;
uniform vec2 uGrow;
uniform vec4 uRect; // stage edges in plane units: x0, x1, y0, y1
uniform vec4 uBeads[4];
out vec4 frag;
const float PI = 3.14159265;
float adiff(float a, float b) { return mod(a - b + PI, 2.0 * PI) - PI; }
float star(vec2 q, float len) {
  float s = exp(-dot(q, q) / 9.7) * 1.4;
  float k = 3.0 / max(len, 1.0);
  vec2 ax0 = vec2(0.0, 1.0), ax1 = vec2(0.8660254, 0.5), ax2 = vec2(-0.8660254, 0.5);
  s += 0.65 * exp(-abs(dot(q, vec2(-ax0.y, ax0.x))) * 3.2) * exp(-abs(dot(q, ax0)) * k);
  s += 0.65 * exp(-abs(dot(q, vec2(-ax1.y, ax1.x))) * 3.2) * exp(-abs(dot(q, ax1)) * k);
  s += 0.65 * exp(-abs(dot(q, vec2(-ax2.y, ax2.x))) * 3.2) * exp(-abs(dot(q, ax2)) * k);
  s += 0.13 * exp(-abs(q.y) * 3.2) * exp(-abs(q.x) * k * 1.6);
  return s;
}
void main() {
  float d = length(vP);
  float th = atan(vP.y, vP.x);
  float o = d - uR;
  float mask = 1.0 - smoothstep(uMaskHalf - 0.17, uMaskHalf + 0.17, abs(th));
  float grow = 1.0 - smoothstep(uGrow.y - 0.2, uGrow.y + 0.02, abs(adiff(th, uGrow.x)));
  float sw = (cos(th - uSun) + 1.0) * 0.5;
  float sunW = sw * sw;
  float n = 0.6 + 0.4 * (0.5 * sin(3.0 * th + uTime * 0.3) + 0.3 * sin(7.0 * th - uTime * 0.21 + 1.3) + 0.2 * sin(13.0 * th + uTime * 0.47 + 2.1));
  float cw = 18.0 + 12.0 * uBloom;
  float corona = o > 0.0 ? exp(-o / (6.0 + 4.0 * uBloom)) * (1.0 - smoothstep(cw - 6.0, cw, o)) : 0.0;
  corona *= n * (0.3 + 0.7 * sunW) * 0.2 * uCorona * mask * grow;
  float band = smoothstep(-2.2, -1.2, o) * (1.0 - smoothstep(-0.2, 0.8, o));
  float chromo = 0.9 * pow(max(cos(th - uSun), 0.0), 16.0) + uArc * mask;
  float beadArc = 0.0, beadStar = 0.0;
  for (int i = 0; i < 4; i++) {
    vec4 b = uBeads[i];
    if (b.y < 0.002) continue;
    float da = adiff(th, b.x);
    float bm = 1.0 - smoothstep(uMaskHalf - 0.17, uMaskHalf + 0.17, abs(adiff(b.x, 0.0)));
    beadArc += b.y * bm * exp(-da * da / 0.0123);
    beadStar += b.y * bm * star(vP - uR * vec2(cos(b.x), sin(b.x)), 10.0 * b.z);
  }
  chromo = (chromo + beadArc * 1.3) * band * grow;
  float inner = smoothstep(-14.0, 0.0, o); // spikes fade out before they cross the photo
  beadStar *= inner;
  float st = star(vP - uR * vec2(cos(uSun), sin(uSun)), uStarLen) * uStarAmp * inner;
  // totality: one ring of light ripples out from the rim and fades
  float pulse = 0.0;
  if (uPulse >= 0.0 && uPulse < 1.0) {
    float pr = uR + 62.0 * (1.0 - pow(1.0 - uPulse, 3.0));
    pulse = exp(-(d - pr) * (d - pr) / 2.6) * pow(1.0 - uPulse, 2.0) * mask * 0.9;
  }
  float guard = 1.0;
  if (uGuard > 0.5) guard = max(step(abs(vP.y), 0.55 * uR), smoothstep(-uR - 8.0, -uR + 4.0, vP.x));
  // nothing may end in a hard line: fade toward the stage edges and the annulus bounds
  float edge = min(min(vP.x - uRect.x, uRect.y - vP.x), min(vP.y - uRect.z, uRect.w - vP.y));
  guard *= smoothstep(0.0, 12.0, edge) * smoothstep(uR - 46.0, uR - 30.0, d) * (1.0 - smoothstep(uR + 54.0, uR + 70.0, d));
  if (uLight < 0.5) {
    vec3 L = (corona * mix(vec3(0.95, 0.96, 1.0), vec3(0.79, 0.82, 1.0), clamp(o / cw, 0.0, 1.0)) + vec3(chromo + st + beadStar) + pulse * vec3(0.86, 0.9, 1.0)) * guard;
    vec3 c = 1.0 - exp(-L);
    frag = vec4(c, max(c.r, max(c.g, c.b)));
  } else {
    float I = (corona * 0.32 + chromo * 0.5 + (st + beadStar) * 0.85 + pulse * 0.6) * guard;
    float a = 1.0 - exp(-I);
    frag = vec4(vec3(0.043, 0.051, 0.063) * a, a);
  }
}`,An=`#version 300 es
layout(location=0) in vec4 aA;
layout(location=1) in vec4 aB;
uniform mat4 uPV, uOrbit;
uniform float uTau, uPeriod, uDpr, uDust;
uniform vec3 uSun;
uniform vec4 uRect;
out float vA; out float vKind; out float vSize;
float kep(float M, float e) {
  float E = M + e * sin(M);
  for (int i = 0; i < 4; i++) E -= (E - e * sin(E) - M) / (1.0 - e * cos(E));
  return E;
}
void main() {
  vKind = aB.w;
  vec3 wp;
  float px, a;
  if (aB.w < 0.5) {
    float p = aA.x, e = aA.y;
    float M = 6.2831853 * fract(uTau / (uPeriod * aA.w) + aA.z);
    float E = kep(M, e);
    float sa = p / (1.0 - e * e);
    vec2 pf = vec2(sa * (cos(E) - e), -sa * sqrt(1.0 - e * e) * sin(E));
    wp = (uOrbit * vec4(pf, (fract(aB.y * 13.7) - 0.5) * 8.0, 1.0)).xyz;
    vec3 L = normalize(wp - uSun);
    float hg = pow(0.28 / sqrt(1.5184 - 1.44 * L.z), 3.0);
    float tw = 0.55 + 0.45 * sin(uTau * aB.z + aB.y * 40.0);
    a = (0.03 + 0.9 * hg * tw) * uDust;
    px = aB.x;
  } else {
    wp = aA.xyz;
    px = aA.w;
    a = aB.x;
  }
  gl_Position = uPV * vec4(wp, 1.0);
  vec2 sp = wp.xy * (${Y.toFixed(1)} / (${Y.toFixed(1)} - wp.z));
  a *= smoothstep(0.0, 10.0, min(min(sp.x - uRect.x, uRect.y - sp.x), min(sp.y - uRect.z, uRect.w - sp.y)));
  float s = px * uDpr * (${Y.toFixed(1)} / (${Y.toFixed(1)} - wp.z));
  gl_PointSize = max(2.0, s);
  vSize = gl_PointSize;
  vA = a * min(1.0, s * s / 4.0);
}`,Rn=`#version 300 es
precision highp float;
in float vA; in float vKind; in float vSize;
uniform float uLight, uDpr;
out vec4 frag;
void main() {
  vec2 q = (gl_PointCoord - 0.5) * vSize;
  float a;
  if (vKind < 0.5) {
    a = exp(-dot(q, q) / (vSize * vSize * 0.08)) * vA;
  } else {
    float w = 3.2 / uDpr, k = 6.0 / vSize;
    float s = exp(-dot(q, q) / (2.0 * uDpr * uDpr)) * 1.2;
    s += 0.7 * exp(-abs(q.x) * w) * exp(-abs(q.y) * k);
    s += 0.7 * exp(-abs(dot(q, vec2(0.5, -0.8660254))) * w) * exp(-abs(dot(q, vec2(0.8660254, 0.5))) * k);
    s += 0.7 * exp(-abs(dot(q, vec2(0.5, 0.8660254))) * w) * exp(-abs(dot(q, vec2(-0.8660254, 0.5))) * k);
    a = clamp(s, 0.0, 1.0) * vA;
  }
  if (uLight < 0.5) frag = vec4(vec3(0.95, 0.97, 1.0) * a, a);
  else frag = vec4(vec3(0.043, 0.051, 0.063) * a * 0.8, a * 0.8);
}`,En=5.5*I,Tn=4*I,je=8*I;function $e(e,n){const a=[[0,0,0]];for(const r of[-1,0,1])for(const f of[-1,0,1])for(const p of e?[-1,0,1]:[0])(r||f||p)&&a.push([r*En*n,f*Tn*n,p*je*n]);return a}function Pn(e){const{r:n,side:a}=e,r=a?[22,20,18,16,14]:n>110?[20,18,16]:[18,16],f=a?[-40,-30,-50,-20,-60,-10,-70,0,-80,10,-90]:[-90],p=a?[.3,.24,.36,.18,.1]:[.04,0],h=a?[34,30,38,42,26]:[46,42,50,38,54];for(const T of a?[100*I,Math.PI]:[Math.PI])for(const x of r)for(const E of[1,.5,.25]){const y=$e(a,E);for(const d of f)for(const v of p)for(const i of h)for(const R of[0,8,16,28]){const t={s:x,apo:d*I,e:v,incl:i*I,dp:R,emerge:T},c=Ke(t,e,y);if(c)return Object.assign(c,{amp:E,c:t})}}return null}const _n=(e,n,a,r)=>Math.abs(e)-a<.62*r&&n+a>-.5*r;let jt="";function Ke(e,n,a){const{r,side:f,env:p}=n,h=r+1,T=.5*e.s*1.1*1.16,x={p:h+T*1.12+4+e.dp,e:e.e,incl:e.incl,apo:e.apo,s:e.s},E=H(),y=[0,0,0],d={x0:1e9,x1:-1e9,y0:1e9,y1:-1e9};for(const[v,i,R]of a){re(E,x,v,i,R);for(let t=0;t<120;t++){const c=t/120*O,P=x.p/(1+x.e*Math.cos(c));Xt(E,P*Math.cos(c),P*Math.sin(c),0,y);const D=Y/(Y-y[2]),C=y[0]*D,U=y[1]*D,V=T*D,st=Math.hypot(C,U);if(t===0&&!(y[2]<-T&&st+V<h-2))return jt="periapsis visible",null;if(st<h+V){if(y[2]<-(T+2)){if(st+V<h)continue}else if(f||y[2]<=T+2||_n(C,U,V,r))return jt=f?"front overlap":"slice/face",null}if(C-V<p.xMin||C+V>p.xMax||U+V>p.yMax||U-V<p.yMin)return jt=C-V<p.xMin?"left":C+V>p.xMax?"right":U+V>p.yMax?"top":"bottom",null;d.x0=Math.min(d.x0,C-V),d.x1=Math.max(d.x1,C+V),d.y0=Math.min(d.y0,U-V),d.y1=Math.max(d.y1,U+V)}}if(e.emerge<Math.PI){re(E,x,0,0,0);for(let v=1;v<120;v++){const i=v/120*O,R=x.p/(1+x.e*Math.cos(i));Xt(E,R*Math.cos(i),-R*Math.sin(i),0,y);const t=Y/(Y-y[2]),c=y[0]*t,P=y[1]*t;if(!(y[2]<0&&Math.hypot(c,P)+T*t<h)){if(Math.abs(Math.atan2(P,c))>e.emerge)return jt="emerges on the text side",null;break}}}return x.bounds=d,x}function Bn(e){if(!e||e.dataset.eclipseOn)return;e.dataset.eclipseOn="1";const n=e.firstElementChild,a=e.parentElement,r=e.closest("section")||a,f=[...a.children].find(s=>s!==e),p=document.documentElement,h=matchMedia("(prefers-reduced-motion: reduce)"),T=matchMedia("(hover: none)").matches&&!0,x=document.createElement("canvas");x.className="eclipse-stage",x.setAttribute("aria-hidden","true");const E=document.createElement("span");E.className="eclipse-label",E.setAttribute("aria-hidden","true");let y=null,d=null,v=null,i=1,R=0,t=null,c=null,P=!1,D=0,C=!1,U=!1,V=!1,st=0,Q=0,j=0,rt=h.matches,$=p.classList.contains("light");const o={t:0,tau:0,ts:1,ent:0,sun:40*I,sunV:0,starLen:0,starAmp:1,total:0,totalHold:0,totalRose:-99,sweepT:-1,waveT:-99,pulseT:-1,ax:0,ay:0,scroll:0,scrollY,capture:-1,captureUntil:0,present:0,presentAt:14,ptr:{on:!1,x:0,y:0,last:-99},nextTwinkle:4},Z=Array.from({length:qt},(s,u)=>({k:u,logo:u,hidden:!0,beadFired:!1,swap:!1,glint:9,w:[0,0,0],sx:0,sy:0,rb:0,nu:0,cap:0,wave:0}));let Dt=qt;const Rt=[0,1,2,3].map(()=>({a:0,age:9,scale:1})),Et=[0,1,2,3].map(()=>({w:[0,0,0],size:0,age:9,life:.5,amp:0}));let Tt=-1,ue="",mt=0,fe=11;const Vt=H(),xt=H(),de=H(),$t=H(),vt=H(),pe=H(),yt=H(),Pt=H(),he=new Float32Array(9);Yt($t),$t[14]=-Y;function Je(){const s=n.getBoundingClientRect(),u=r.getBoundingClientRect(),l=f?f.getBoundingClientRect():null,M=p.clientWidth,A=Math.round(s.width/2),m=getComputedStyle(a).flexDirection.startsWith("row");let g;if(m){const L=l?s.left-l.right:64;g={xMin:-(A+N(L-12,0,8)),xMax:A+M-s.right-6,yMax:A+N(s.top-u.top-8,0,90),yMin:-(A+N(u.bottom-s.bottom-12,0,200))}}else{const L=l?l.top-s.bottom:40;g={xMin:-(A+s.left-6),xMax:A+M-s.right-6,yMax:A+N(s.top-u.top-6,0,90),yMin:-(A+N(L-12,0,120))}}return{r:A,side:m,cw:M,env:g}}function Qe(){const{r:s,env:u}=y,l=s+70;let M=-l,A=l,m=-l,g=l;return d&&(M=Math.min(M,d.bounds.x0-4),A=Math.max(A,d.bounds.x1+4),m=Math.min(m,d.bounds.y0-4),g=Math.max(g,d.bounds.y1+4)),M=Math.floor(Math.max(M,u.xMin)),A=Math.ceil(Math.min(A,u.xMax)),m=Math.floor(Math.max(m,u.yMin)),g=Math.ceil(Math.min(g,u.yMax)),{x0:M,x1:A,y0:m,y1:g,w:A-M,h:g-m}}const me=(s,u)=>s&&u&&s.r===u.r&&s.side===u.side&&["xMin","xMax","yMax","yMin"].every(l=>Math.abs(s.env[l]-u.env[l])<1);let xe=null,Kt=0,ft=!1;function ve(){const s=d;return d=Pn(y),xe=d?null:y,s!==d}function Ze(s){if(s)return void ve();let u=!1;if(d){const l=Ke(d.c,y,$e(y.side,d.amp));l&&(d=Object.assign(l,{amp:d.amp,c:d.c}),u=!0)}if(ft=!u,!u&&me(xe,y))return void(ft=!1);clearTimeout(Kt),Kt=setTimeout(()=>{const l=d&&JSON.stringify(d.c);ft=!1,ve(),ye(),c&&Qt(),!u||(d&&JSON.stringify(d.c))!==l?ke():gt()},160)}function Jt(s){const u=Je(),l=!me(u,y);y=u,l&&Ze(s),ye(),c&&Qt()}function ye(){v=Qe();const{r:s}=y;i=Math.min(devicePixelRatio||1,y.side?2:1.75)*(R>=1?.7:1),i=Math.max(1,i),Object.assign(x.style,{left:`${s+v.x0}px`,top:`${s-v.y1}px`,width:`${v.w}px`,height:`${v.h}px`});const u=Math.round(v.w*i),l=Math.round(v.h*i);x.width!==u&&(x.width=u),x.height!==l&&(x.height=l);const M=Y-500,A=Y+500,m=M/Y;un(de,v.x0*m,v.x1*m,v.y0*m,v.y1*m,M,A),ht(xt,de,$t)}function It(s,u){const l=t.createProgram();for(const[M,A]of[[t.VERTEX_SHADER,s],[t.FRAGMENT_SHADER,u]]){const m=t.createShader(M);t.shaderSource(m,A),t.compileShader(m),t.attachShader(l,m)}return t.linkProgram(l),l}function Ct(s,u){const l={};for(const M of u)l[M]=t.getUniformLocation(s,M);return l}let _t=null,ge=null;async function tn(){const s=x.getContext("webgl2",{alpha:!0,premultipliedAlpha:!0,antialias:(devicePixelRatio||1)<1.5,depth:!0,stencil:!1,powerPreference:"low-power",failIfMajorPerformanceCaveat:!0});if(!s)return!1;t=s;const u=t.getExtension("KHR_parallel_shader_compile"),l={body:It(vn,yn),flat:It(gn,Mn),glow:It(bn,wn),pts:It(An,Rn)};if(await new Promise(m=>setTimeout(m,0)),t.isContextLost())return!1;if(u)for(let m=0;m<120&&!Object.values(l).every(g=>t.getProgramParameter(g,u.COMPLETION_STATUS_KHR));m++)await new Promise(g=>requestAnimationFrame(g));for(const[m,g]of Object.entries(l))if(!t.getProgramParameter(g,t.LINK_STATUS))return!1;if(t.isContextLost())return!1;_t=_t||mn(),c={progs:l},c.u={body:Ct(l.body,["uPV","uModel","uRot","uCam","uBase","uGlyph","uAccent","uRimColor","uSunDir","uAccentAmt","uEmissive","uRim","uExposure","uLegend"]),flat:Ct(l.flat,["uMVP","uColor"]),glow:Ct(l.glow,["uPV","uR","uSun","uStarLen","uStarAmp","uCorona","uArc","uMaskHalf","uGuard","uTime","uLight","uGrow","uBeads[0]","uBloom","uPulse","uRect"]),pts:Ct(l.pts,["uPV","uOrbit","uTau","uPeriod","uDpr","uDust","uSun","uLight","uRect"])},c.bodyVao=t.createVertexArray(),t.bindVertexArray(c.bodyVao);const M=t.createBuffer();t.bindBuffer(t.ARRAY_BUFFER,M),t.bufferData(t.ARRAY_BUFFER,_t.verts,t.STATIC_DRAW);const A=t.createBuffer();t.bindBuffer(t.ELEMENT_ARRAY_BUFFER,A),t.bufferData(t.ELEMENT_ARRAY_BUFFER,_t.index,t.STATIC_DRAW);for(const[m,g,L]of[[0,3,0],[1,3,12],[2,2,24],[3,2,32]])t.enableVertexAttribArray(m),t.vertexAttribPointer(m,g,t.FLOAT,!1,40,L);for(const m of["disc","trace","ring"])c[m+"Vao"]=t.createVertexArray(),t.bindVertexArray(c[m+"Vao"]),c[m+"Buf"]=t.createBuffer(),t.bindBuffer(t.ARRAY_BUFFER,c[m+"Buf"]),t.enableVertexAttribArray(0),t.vertexAttribPointer(0,m==="ring"?2:3,t.FLOAT,!1,0,0);c.dustVao=t.createVertexArray(),t.bindVertexArray(c.dustVao),c.dustBuf=t.createBuffer(),t.bindBuffer(t.ARRAY_BUFFER,c.dustBuf);for(const[m,g]of[[0,0],[1,16]])t.enableVertexAttribArray(m),t.vertexAttribPointer(m,4,t.FLOAT,!1,32,g);c.glintVao=t.createVertexArray(),t.bindVertexArray(c.glintVao),c.glintBuf=t.createBuffer(),t.bindBuffer(t.ARRAY_BUFFER,c.glintBuf),c.glintData=new Float32Array(32),t.bufferData(t.ARRAY_BUFFER,c.glintData,t.DYNAMIC_DRAW);for(const[m,g]of[[0,0],[1,16]])t.enableVertexAttribArray(m),t.vertexAttribPointer(m,4,t.FLOAT,!1,32,g);return t.bindVertexArray(null),c.legend=t.createTexture(),Me(),c.maxPoint=t.getParameter(t.ALIASED_POINT_SIZE_RANGE)[1]||64,Qt(),!0}function Me(){t.bindTexture(t.TEXTURE_2D,c.legend),t.texImage2D(t.TEXTURE_2D,0,t.RGBA,t.RGBA,t.UNSIGNED_BYTE,xn()),t.generateMipmap(t.TEXTURE_2D),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MIN_FILTER,t.LINEAR_MIPMAP_LINEAR),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MAG_FILTER,t.LINEAR),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_S,t.CLAMP_TO_EDGE),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_T,t.CLAMP_TO_EDGE)}function Qt(){const s=y.r+1,u=[];for(let m=0;m<96;m++){const g=m/96*O,L=(m+1)/96*O;u.push(0,0,0,s*Math.cos(g),s*Math.sin(g),0,s*Math.cos(L),s*Math.sin(L),0)}c.discCount=u.length/3,t.bindBuffer(t.ARRAY_BUFFER,c.discBuf),t.bufferData(t.ARRAY_BUFFER,new Float32Array(u),t.STATIC_DRAW);const l=[],M=Math.max(0,s-46),A=s+70;for(let m=0;m<=128;m++){const g=m/128*O,L=Math.cos(g),B=Math.sin(g);l.push(M*L,M*B,A*L,A*B)}if(c.ringCount=l.length/2,t.bindBuffer(t.ARRAY_BUFFER,c.ringBuf),t.bufferData(t.ARRAY_BUFFER,new Float32Array(l),t.STATIC_DRAW),d){const m=[];for(let S=0;S<=160;S++){const z=S/160*O,_=d.p/(1+d.e*Math.cos(z));m.push(_*Math.cos(z),_*Math.sin(z),0)}c.traceCount=m.length/3,t.bindBuffer(t.ARRAY_BUFFER,c.traceBuf),t.bufferData(t.ARRAY_BUFFER,new Float32Array(m),t.STATIC_DRAW);const g=y.side?36:28,L=new Float32Array(g*8);let B=7;const w=()=>(B=B*16807%2147483647)/2147483647;for(let S=0;S<g;S++)L.set([d.p*(.92+.08*w()),N(d.e-.08*w(),0,d.e),w(),.8+.5*w(),1+w(),w(),.6+1.2*w(),0],S*8);ge={n:g},t.bindBuffer(t.ARRAY_BUFFER,c.dustBuf),t.bufferData(t.ARRAY_BUFFER,L,t.STATIC_DRAW)}}function be(s,u){const l=O*(u/Ce+s.k/qt)+ln;return o.ent>=3?l:l*ze((o.ent-.6-.28*s.k)/1.8)}const Ut=[0,0,0],ct=[0,0,0];function we(s,u,l){const M=pn(u,d.p,d.e,Ut);Xt(Vt,Ut[0],Ut[1],Ut[2],ct);const A=Y/(Y-ct[2]);l.w[0]=ct[0],l.w[1]=ct[1],l.w[2]=ct[2],l.sx=ct[0]*A,l.sy=ct[1]*A,l.rb=.5*d.s*1.1*(1+.16*s.cap)*A,l.nu=M;const m=Math.hypot(l.sx,l.sy);return l.hidden=ct[2]<0&&m+l.rb<y.r+1,l}const zt={w:[0,0,0]};function Zt(s,u,l){let M=s[0];for(const A of s)A.age>M.age&&(M=A);return M.a=u,M.age=0,M.scale=l,M}function Ae(s){o.t+=s,o.ent+=s;const{r:u,side:l}=y,M=u+1,A=n.getBoundingClientRect(),m=A.left+A.width/2,g=A.top+A.height/2,L=o.ptr;let B=0,w=0,S=0;L.on&&!T&&(w=L.x-m,S=g-L.y,(!l||w>-(u+40))&&(B=nt(2.6*u,1*u,Math.hypot(w,S))));const _=L.on&&!T&&Math.hypot(w,S)<u||o.t<o.totalHold?1:0,ot=o.total;o.total=wt(o.total,_,_?4:.85,s),ot<.5&&o.total>=.5&&o.t-o.totalRose>4&&(o.totalRose=o.t,o.sweepT=0,o.waveT=o.t,o.pulseT=0),o.pulseT>=0&&(o.pulseT=o.pulseT+s>1.1?-1:o.pulseT+s);let F;B>.02?F=Math.atan2(S,w):l?F=95*I*Math.sin(O*o.t/26):F=o.sun+s*(O/40),l&&(F=N(F,-125*I,125*I));const K=l?F-o.sun:ae(F-o.sun);o.sunV+=(120*K-22*o.sunV)*s,o.sun+=o.sunV*s,l&&(o.sun=N(o.sun,-125*I,125*I));const q=o.ent-.45;let J=24;if(q<0)J=0;else if(q<.45)J=40*Oe(q/.45);else if(q<1.65)J=et(40,24,nt(.45,1.65,q));else{const b=o.t%11;J=24+16*(b<.38?Oe(b/.38):1-nt(.38,1.78,b))}o.starLen=et(J,54,o.total),o.starAmp=(1+.08*Math.sin(O*.3*o.t))*(1+.25*o.total);const bt=Z.some(b=>b.cap>.5);let W=et(1,.3,B);bt&&(W=Math.min(W,.3)),W=et(W,.15,o.total)+.5*o.scroll,o.ts=wt(o.ts,W,W<o.ts?3.3:.85,s),o.ent>3&&(o.tau+=s*o.ts),o.scroll=wt(o.scroll,0,2.5,s);const dt=d?d.amp:1,Gt=L.on&&!T?-4*I*dt*N(S/(3*u),-1,1):0,Ft=L.on&&!T?4*I*dt*N(w/(3*u),-1,1):0;o.ax=wt(o.ax,Gt+1.5*I*dt*o.scroll,1.7,s),o.ay=wt(o.ay,Ft,1.7,s);for(const b of Rt)b.age+=s;for(const b of Et)b.age+=s;if(o.sweepT>=0){o.sweepT+=s;const b=l?125*I:Math.PI,k=Rt[3];k.a=l?et(b,-b,nt(0,.6,o.sweepT)):o.sun-nt(0,.6,o.sweepT)*O,k.age=.13,k.scale=.8,o.sweepT>.6&&(o.sweepT=-1)}if(d){if(re(Vt,d,o.ax,o.ay,l?je*d.amp*Math.sin(O*o.t/70):0),!(o.t<=o.captureUntil))if(T){if(o.capture=-1,o.present<3&&o.t>o.presentAt&&o.ent>4){let b=-1,k=.9;for(const G of Z){const X=Math.abs(ae(G.nu-Math.PI));!G.hidden&&X<k&&(b=G.k,k=X)}o.presentAt=o.t+14,b>=0&&(o.present++,o.capture=b,o.captureUntil=o.t+1.8)}}else{let b=-1,k=36;if(L.on)for(const G of Z){if(G.hidden)continue;const X=Math.hypot(G.sx-w,G.sy-S);(X<k||G.k===o.capture&&X<56)&&(b=G.k,k=X)}o.capture=b}for(const b of Z){b.cap=wt(b.cap,b.k===o.capture?1:0,b.k===o.capture?4:1.7,s);const k=b.hidden;if(we(b,be(b,o.tau),b),b.hidden&&!b.beadFired){const X=o.ent>3?o.tau+Ue*Math.max(o.ts,.15):o.tau,lt=o.ent;o.ent<=3&&(o.ent+=Ue),we(b,be(b,X),zt),o.ent=lt,zt.hidden||(Zt(Rt.slice(0,qt),Math.atan2(zt.sy,zt.sx),1),b.beadFired=!0)}if(k&&!b.hidden){b.glint=0;const X=Math.atan2(b.sy,b.sx);if(!l||Math.abs(X)<125*I){const lt=Zt(Et,0,0);lt.w=[M*Math.cos(X),M*Math.sin(X),1],lt.size=22,lt.life=.55,lt.amp=1}}if(!k&&b.hidden&&(b.beadFired=!1,b.swap=!0),b.hidden&&b.swap){const X=Z.map(lt=>lt.logo);for(;X.includes(Dt%kt.length);)Dt++;b.logo=Dt%kt.length,Dt++,b.swap=!1}b.glint+=s;const G=o.t-o.waveT-.08*b.k;b.wave=G>0&&G<1?Math.sin(Math.PI*nt(0,1,G)):0}if(o.t>o.nextTwinkle){o.nextTwinkle=o.t+4+3*Math.random();const b=Z.filter(k=>!k.hidden&&k.w[2]>0);if(b.length){const k=b[Math.random()*b.length|0],G=Zt(Et,0,0);G.w=[k.w[0]+.2*k.rb,k.w[1]+.25*k.rb,k.w[2]+k.rb],G.size=15,G.life=.4,G.amp=.85}}}}const Ln={},Sn=!1,Re={dark:{base:pt("#2b2f37"),glyph:pt("#dfe3ea"),rimc:pt("#f4f6ff"),exposure:1,accent:.5,emissive:.04,rim:1.4,dust:1},light:{base:pt("#30343b"),glyph:pt("#f3f5f8"),rimc:pt("#ffffff"),exposure:1.05,accent:.72,emissive:.03,rim:.5,dust:.6}},Ee=kt.map(s=>pt(s.accent)),en=Ee.map(s=>s.map(u=>u*.64));function nn(s){const u=s.age;return u<.12?1-(1-u/.12)**2:Math.max(0,1-(u-.12)/.5)**2}const Lt=new Float32Array(16);function te(){if(!c||t.isContextLost())return;const{r:s,side:u}=y,l=s+1,M=$?Re.light:Re.dark;t.viewport(0,0,x.width,x.height),t.clearColor(0,0,0,0),t.clearDepth(1),t.depthMask(!0),t.clear(t.COLOR_BUFFER_BIT|t.DEPTH_BUFFER_BIT),t.enable(t.DEPTH_TEST),t.disable(t.CULL_FACE),t.disable(t.BLEND),t.useProgram(c.progs.flat),t.uniformMatrix4fv(c.u.flat.uMVP,!1,xt),t.colorMask(!1,!1,!1,!1),t.depthFunc(t.LESS),t.bindVertexArray(c.discVao),t.drawArrays(t.TRIANGLES,0,c.discCount),t.colorMask(!0,!0,!0,!0);const A=[l*Math.cos(o.sun),l*Math.sin(o.sun),-.6*s];if(d&&!ft){const w=c.u.body;t.useProgram(c.progs.body),t.uniformMatrix4fv(w.uPV,!1,xt),t.uniform3f(w.uCam,0,0,Y),t.uniform3fv(w.uBase,M.base),t.uniform3fv(w.uGlyph,M.glyph),t.uniform3fv(w.uRimColor,M.rimc),t.uniform1f(w.uExposure,M.exposure),t.uniform1i(w.uLegend,0),t.activeTexture(t.TEXTURE0),t.bindTexture(t.TEXTURE_2D,c.legend),t.bindVertexArray(c.bodyVao);const S=Z,z=d.s;for(const _ of S){if(_.hidden)continue;const ot=Math.max(nt(.7,.3,Math.abs(ae(_.nu-Math.PI))),_.cap),F=_.k*2.1,K=22*I*Math.sin(O*o.t/7.3+F)*(1-ot),q=8*I*Math.sin(O*o.t/8.1+F*1.7)*(1-ot),J=_.logo===0?.4*o.t:0;Wt(yt,J),ie(Pt,K),ht(pe,Pt,yt),Ne(yt,q),ht(Pt,yt,pe);for(let b=0;b<3;b++)for(let k=0;k<3;k++)he[b*3+k]=Pt[b*4+k];const bt=z*(1+.16*_.cap)*(_.logo===0?1.08:1);vt.set(Pt);for(let b=0;b<12;b++)b%4!==3&&(vt[b]*=bt);vt[12]=_.w[0],vt[13]=_.w[1],vt[14]=_.w[2],t.uniformMatrix4fv(w.uModel,!1,vt),t.uniformMatrix3fv(w.uRot,!1,he);const W=[A[0]-_.w[0],A[1]-_.w[1]],dt=Math.hypot(W[0],W[1])||1;t.uniform2f(w.uSunDir,W[0]/dt,W[1]/dt);const Gt=_.glint<.12?_.glint/.12:Math.max(0,1-(_.glint-.12)/.7);t.uniform1f(w.uRim,M.rim*(1+2.2*Gt)*(.85+.3*o.total)),t.uniform3fv(w.uAccent,($?en:Ee)[_.logo]),t.uniform1f(w.uAccentAmt,Math.min(1,et(M.accent,1,_.cap)+.35*_.wave)),t.uniform1f(w.uEmissive,et(M.emissive,$?.1:.9,_.cap)+($?.1:.55)*_.wave);const Ft=_t.ranges[_.logo];t.drawElements(t.TRIANGLES,Ft.count,t.UNSIGNED_SHORT,Ft.start*2)}}t.enable(t.BLEND),t.blendFunc(t.ONE,t.ONE_MINUS_SRC_ALPHA),t.depthMask(!1),t.depthFunc(t.LEQUAL);const m=Math.max(...Z.map(w=>w.cap));if(d&&!ft&&m>.01){t.useProgram(c.progs.flat),ht(yt,xt,Vt),t.uniformMatrix4fv(c.u.flat.uMVP,!1,yt);const w=($?.1:.12)*m;t.uniform4f(c.u.flat.uColor,$?0:w,$?0:w,$?0:w,w),t.bindVertexArray(c.traceVao),t.drawArrays(t.LINE_STRIP,0,c.traceCount)}const g=c.u.glow;t.useProgram(c.progs.glow),t.uniformMatrix4fv(g.uPV,!1,xt),t.uniform1f(g.uR,l),t.uniform1f(g.uSun,o.sun),t.uniform1f(g.uStarLen,o.starLen),t.uniform1f(g.uStarAmp,o.starAmp);const L=o.ent;t.uniform1f(g.uCorona,ze((L-.25)/.9)*(1+1.2*o.total)),t.uniform1f(g.uBloom,o.total),t.uniform4f(g.uRect,v.x0,v.x1,v.y0,v.y1),t.uniform1f(g.uPulse,o.pulseT>=0?o.pulseT/1.1:-1),t.uniform1f(g.uArc,et(.06,.45,o.total)),t.uniform1f(g.uMaskHalf,u?125*I:Math.PI+1),t.uniform1f(g.uGuard,u?1:0),t.uniform1f(g.uTime,o.t),t.uniform1f(g.uLight,$?1:0);const B=N(L/.7,0,1);if(t.uniform2f(g.uGrow,u?40*I:90*I,(B<.5?4*B**3:1-(-2*B+2)**3/2)*(Math.PI+.3)),Rt.forEach((w,S)=>{Lt[S*4]=w.a,Lt[S*4+1]=nn(w)*(S===3?.9:1),Lt[S*4+2]=w.scale,Lt[S*4+3]=0}),t.uniform4fv(g["uBeads[0]"],Lt),t.bindVertexArray(c.ringVao),t.drawArrays(t.TRIANGLE_STRIP,0,c.ringCount),d&&!ft){const w=c.u.pts;t.useProgram(c.progs.pts),t.uniformMatrix4fv(w.uPV,!1,xt),t.uniformMatrix4fv(w.uOrbit,!1,Vt),t.uniform1f(w.uTau,o.tau+3*nt(0,3,o.ent)),t.uniform1f(w.uPeriod,Ce),t.uniform1f(w.uDpr,i),t.uniform1f(w.uDust,M.dust*nt(.8,2.4,L)*(1+.6*o.total)),t.uniform3f(w.uSun,A[0],A[1],A[2]),t.uniform1f(w.uLight,$?1:0),t.uniform4f(w.uRect,v.x0,v.x1,v.y0,v.y1),t.bindVertexArray(c.dustVao),t.drawArrays(t.POINTS,0,$?10:ge.n);let S=0;for(const z of Et){if(z.age>=z.life)continue;const _=z.age/z.life,ot=_<.2?_/.2:1-nt(.2,1,_);c.glintData.set([z.w[0],z.w[1],z.w[2],Math.min(z.size,c.maxPoint/i),z.amp*ot,0,0,1],S*8),S++}S&&(t.bindVertexArray(c.glintVao),t.bindBuffer(t.ARRAY_BUFFER,c.glintBuf),t.bufferSubData(t.ARRAY_BUFFER,0,c.glintData.subarray(0,S*8)),t.drawArrays(t.POINTS,0,S))}t.bindVertexArray(null),t.depthMask(!0),on()}function on(){const s=Z.find(l=>l.k===o.capture),u=s&&!s.hidden&&!ft&&s.cap>=.35?sn(s):null;if(!u){Tt!==-1&&(E.classList.remove("is-on"),Tt=-1);return}E.classList.toggle("is-left",u.lead==="right"),E.classList.toggle("is-plain",u.lead==="none"),E.style.transform=`translate3d(${Math.round(u.x)}px, ${Math.round(u.y)}px, 0)`,Tt!==s.k&&(E.classList.add("is-on"),Tt=s.k)}function sn(s){const u=`${kt[s.logo].name} \xB7 ${String(s.logo+1).padStart(2,"0")}/${String(kt.length).padStart(2,"0")}`;u!==ue&&(E.textContent=u,ue=u,E.classList.add("is-plain"),mt=E.offsetWidth,fe=E.offsetHeight||11);const{r:l,cw:M,env:A}=y,m=l+1,g=s.rb+12,L=18,B=fe,w=n.getBoundingClientRect().left,S=s.sx>=0,z=F=>{const K=mt+L;return{x0:F?s.sx+g:s.sx-g-K,w:K,yc:s.sy,lead:F?"left":"right"}},_=F=>({x0:s.sx-mt/2,w:mt,yc:s.sy+(F?1:-1)*(g+B/2),lead:"none"}),ot=[z(S),z(!S),_(s.sy>=0),_(s.sy<0)];for(const F of ot){const K=F.x0+F.w,q=F.yc-B/2,J=F.yc+B/2;if(l+F.x0+w<8||l+K+w>M-8||F.x0<A.xMin||K>A.xMax||q<A.yMin||J>A.yMax)continue;const bt=N(0,F.x0,K),W=N(0,q,J);if(!(Math.hypot(bt,W)<m+3))return{x:l+F.x0,y:l-J,lead:F.lead}}if(!y.side){const F=-A.yMin-m,K=-(m+Math.min(14,F/2)),q=-mt/2;if(F>=B+4&&l+q+w>=8&&l+q+mt+w<=M-8)return{x:l+q,y:l-(K+B/2),lead:"none"}}return null}let Ot=0,ee=0,at=[];const Te=()=>(Ot=0,ee=0,at=[]);function an(s){if(at.push(s),at.length<30)return!1;if(!Ot)return Ot=at.slice().sort((l,M)=>l-M)[15],at=[],!1;if(at.length<120)return!1;const u=at.reduce((l,M)=>l+M,0)/at.length;return at=[],u>Ot*1.4&&u>20?++ee<2||R>=2?!1:(R++,Te(),R===1?(Jt(),!0):!1):(ee=0,!1)}function Pe(s){st=requestAnimationFrame(Pe);const u=Q?Math.min(s-Q,250):16.7;Q=s;const l=an(u);j+=u;const M=o.t-o.ptr.last>12&&o.ent>12&&o.t>o.captureUntil+1;if(!l&&(M||R>=2)&&j<33)return;const A=Math.min(j/1e3,.05);j=0,Ae(A),te()}function Nt(){V||!P||C||rt||!U||document.hidden||(V=!0,Q=0,j=0,Te(),st=requestAnimationFrame(Pe))}function St(){V=!1,cancelAnimationFrame(st)}function rn(){Object.assign(o,{ent:99,tau:4.5,sun:35*I,sunV:0,total:0,totalHold:0,pulseT:-1,sweepT:-1,capture:-1,captureUntil:0});for(const u of Z)u.cap=0;const s=o.ptr.on;o.ptr.on=!1,Ae(0),o.ptr.on=s;for(const u of Rt)u.age=9;for(const u of Et)u.age=9;te()}function gt(){P&&(rt?rn():te())}function cn(){x.classList.add("is-on")}let ne=!1;async function _e(){if(P||C||ne||t&&t.isContextLost())return;ne=!0;const s=document.fonts?Promise.race([document.fonts.load('500 62px "Geist Mono"'),new Promise(l=>setTimeout(l,1500))]):Promise.resolve();let u=!1;try{u=await tn()}finally{ne=!1}if(!u)return t&&t.isContextLost()?void 0:Fe();s.then(()=>{c&&!t.isContextLost()&&(Me(),gt())}),P=!0,gt(),requestAnimationFrame(cn),Nt()}const Le=new AbortController,tt=Le.signal,Se=[];function Fe(){C=!0,St(),clearTimeout(Kt),Le.abort();for(const s of Se)s.disconnect();t&&!t.isContextLost()&&t.getExtension("WEBGL_lose_context")?.loseContext(),t=c=null,x.remove(),E.remove()}function ke(){P&&(x.style.transition="none",x.classList.remove("is-on"),gt(),requestAnimationFrame(()=>{x.style.transition="",P&&x.classList.add("is-on")}))}const Be=new MutationObserver(()=>{const s=p.classList.contains("light");s!==$&&($=s,ke())});let oe=!1;function se(){oe||C||(oe=!0,requestAnimationFrame(()=>{oe=!1,!C&&(Jt(),gt())}))}Jt(!0),e.append(x,E);const De=new ResizeObserver(se);De.observe(e);const Ve=new IntersectionObserver(s=>{if(U=s[s.length-1].isIntersecting,!U)return St();P?Nt():_e()},{rootMargin:"80px"});Ve.observe(e),Be.observe(p,{attributes:!0,attributeFilter:["class"]}),Se.push(De,Ve,Be),addEventListener("resize",se,{passive:!0,signal:tt});const Ie=()=>matchMedia(`(resolution: ${devicePixelRatio||1}dppx)`).addEventListener("change",()=>{se(),Ie()},{once:!0,signal:tt});Ie(),document.addEventListener("visibilitychange",()=>document.hidden?St():Nt(),{signal:tt}),h.addEventListener("change",s=>{rt=s.matches,rt?(St(),gt()):Nt()},{signal:tt}),x.addEventListener("webglcontextlost",s=>{s.preventDefault(),St(),P=!1,c=null,x.classList.remove("is-on"),E.classList.remove("is-on"),Tt=-1,++D>1&&Fe()},{signal:tt}),x.addEventListener("webglcontextrestored",()=>{C||_e()},{signal:tt}),r.addEventListener("pointermove",s=>{s.pointerType!=="touch"&&(o.ptr.on=!0,o.ptr.x=s.clientX,o.ptr.y=s.clientY,o.ptr.last=o.t)},{passive:!0,signal:tt}),r.addEventListener("pointerleave",()=>{o.ptr.on=!1},{passive:!0,signal:tt});let Mt=null;r.addEventListener("pointerdown",s=>{(s.pointerType==="touch"||T)&&(Mt={x:s.clientX,y:s.clientY,t:performance.now()})},{passive:!0,signal:tt}),r.addEventListener("pointerup",s=>{if(!Mt||!d||rt)return;const u=Math.hypot(s.clientX-Mt.x,s.clientY-Mt.y),l=performance.now()-Mt.t;if(Mt=null,u>10||l>300)return;const M=n.getBoundingClientRect(),A=s.clientX-(M.left+M.width/2),m=M.top+M.height/2-s.clientY;o.ptr.last=o.t;let g=-1,L=44;for(const B of Z){if(B.hidden)continue;const w=Math.hypot(B.sx-A,B.sy-m);w<L&&(L=w,g=B.k)}g>=0?(o.capture=g,o.captureUntil=o.t+2.4):Math.hypot(A,m)<y.r&&(o.t<o.totalHold?o.totalHold=0:(o.totalHold=o.t+2.6,o.sun=Math.atan2(m,A),o.sunV=0))},{passive:!0,signal:tt}),addEventListener("scroll",()=>{const s=scrollY,u=Math.abs(s-o.scrollY);o.scrollY=s,V&&(o.scroll=Math.max(o.scroll,N(u/48,0,1)))},{passive:!0,signal:tt})}export{Bn as mount};
