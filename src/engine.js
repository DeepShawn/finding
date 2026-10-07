/*
 * Silent Ward / tiny native WebGL 2 renderer.
 * No CDN, build step, runtime packages, external asset downloads or telemetry.
 * World coordinates use metres, +Y is up, the initial camera faces -Z.
 * Geometry is statically merged by material. One shadow map + one film pass.
 */
'use strict';
window.SW = window.SW || {};
(() => {
    const S = window.SW;
    const V = { add: (a, b) => a.map((v, i) => v + b[i]), sub: (a, b) => a.map((v, i) => v - b[i]), scale: (a, s) => a.map(v => v * s), dot: (a, b) => a.reduce((v, n, i) => v + n * b[i], 0), cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], norm: a => { const l = Math.hypot(...a) || 1; return a.map(v => v / l); } };
    const M = {
        identity: () => new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]),
        mul(a, b) { const m = new Float32Array(16); for (let c = 0; c < 4; c++)
            for (let r = 0; r < 4; r++)
                for (let k = 0; k < 4; k++)
                    m[c * 4 + r] += a[k * 4 + r] * b[c * 4 + k]; return m; },
        perspective(fovy, aspect, n, f) { const t = 1 / Math.tan(fovy / 2); return new Float32Array([t / aspect, 0, 0, 0, 0, t, 0, 0, 0, 0, (f + n) / (n - f), -1, 0, 0, 2 * f * n / (n - f), 0]); },
        lookAt(eye, target, up = [0, 1, 0]) { const z = V.norm(V.sub(eye, target)), x = V.norm(V.cross(up, z)), y = V.cross(z, x); return new Float32Array([x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -V.dot(x, eye), -V.dot(y, eye), -V.dot(z, eye), 1]); },
        project(p, m) { const x = m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12], y = m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13], z = m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14], w = m[3] * p[0] + m[7] * p[1] + m[11] * p[2] + m[15]; return { x: x / w, y: y / w, z: z / w, w }; },
    };
    S.V = V;
    S.M = M;
    S.rng = (seed = 17) => () => { seed = (Math.imul(seed, 1664525) + 1013904223) | 0; return (seed >>> 0) / 4294967296; };
    S.rgb = h => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];
    S.canvas = (w = 512, h = w) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
    /** Texture generation is deterministic. Nothing is loaded over the network. */
    S.surface = function (kind, base, seed = 12) {
        const c = S.canvas(), g = c.getContext('2d'), r = S.rng(seed);
        g.fillStyle = base;
        g.fillRect(0, 0, 512, 512);
        const tex = g.getImageData(0, 0, 512, 512);
        for (let i = 0; i < tex.data.length; i += 4) {
            let n = (r() - .5) * (kind === 'paper' ? 20 : 32);
            for (let j = 0; j < 3; j++)
                tex.data[i + j] = Math.max(0, Math.min(255, tex.data[i + j] + n));
        }
        g.putImageData(tex, 0, 0);
        // Broad damp patches read at a distance; fine scratches read in the flashlight.
        for (let i = 0; i < 34; i++) {
            let x = r() * 512, y = r() * 512, rad = 20 + r() * 120, gr = g.createRadialGradient(x, y, 0, x, y, rad);
            gr.addColorStop(0, `rgba(4,11,10,${r() * .20})`);
            gr.addColorStop(1, 'rgba(4,11,10,0)');
            g.fillStyle = gr;
            g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
        }
        if (kind === 'tile' || kind === 'floor') {
            for (let x = 0; x < 512; x += 128)
                for (let y = 0; y < 512; y += 128) {
                    g.fillStyle = ((x + y) / 128) % 2 ? '#0000000d' : '#dde4d20c';
                    g.fillRect(x + 2, y + 2, 125, 125);
                    g.strokeStyle = '#0b16168a';
                    g.lineWidth = 3;
                    g.strokeRect(x, y, 128, 128);
                    g.strokeStyle = '#e8efe61c';
                    g.lineWidth = 1;
                    g.strokeRect(x + 3, y + 3, 121, 121);
                }
            for (let i = 0; i < 6; i++) {
                let x = r() * 512, y = r() * 512;
                g.beginPath();
                g.moveTo(x, y);
                for (let j = 0; j < 4; j++) {
                    x += (r() - .4) * 20;
                    y += r() * 20;
                    g.lineTo(x, y);
                }
                g.strokeStyle = '#12212088';
                g.lineWidth = .8;
                g.stroke();
            }
        }
        if (kind === 'wall') {
            for (let i = 0; i < 28; i++) {
                let x = r() * 512, y = r() * 390;
                g.fillStyle = `rgba(22,25,16,${r() * .12})`;
                g.fillRect(x, y, 1 + r() * 18, 15 + r() * 140);
            }
            for (let i = 0; i < 16; i++) {
                let x = r() * 512, y = r() * 512;
                g.beginPath();
                g.moveTo(x, y);
                for (let j = 0; j < 5; j++) {
                    x += (r() - .5) * 26;
                    y += r() * 25;
                    g.lineTo(x, y);
                }
                g.strokeStyle = '#0f1b1638';
                g.lineWidth = .8;
                g.stroke();
            }
        }
        if (kind === 'metal') {
            for (let i = 0; i < 180; i++) {
                g.strokeStyle = i % 2 ? '#c2c1a810' : '#080e0e22';
                let y = r() * 512;
                g.beginPath();
                g.moveTo(r() * 512, y);
                g.lineTo(r() * 512, y + .5);
                g.stroke();
            }
            for (let x of [16, 496])
                for (let y of [16, 496]) {
                    g.fillStyle = '#0b1211';
                    g.beginPath();
                    g.arc(x, y, 4, 0, Math.PI * 2);
                    g.fill();
                    g.fillStyle = '#b5b8a8';
                    g.fillRect(x - 2, y - 1, 4, 1);
                }
        }
        if (kind === 'wood') {
            for (let i = 0; i < 180; i++) {
                g.beginPath();
                g.moveTo(0, i * 3);
                g.bezierCurveTo(160, i * 3 + (r() - .5) * 15, 400, i * 3 + (r() - .5) * 20, 512, i * 3);
                g.strokeStyle = i % 2 ? '#00000025' : '#ded4ab12';
                g.lineWidth = r() * 2;
                g.stroke();
            }
        }
        if (kind === 'fabric') {
            g.strokeStyle = '#1c282a15';
            g.lineWidth = 1;
            for (let i = 0; i < 512; i += 3) {
                g.beginPath();
                g.moveTo(i, 0);
                g.lineTo(i, 512);
                g.moveTo(0, i);
                g.lineTo(512, i);
                g.stroke();
            }
        }
        return c;
    };
    class Builder {
        constructor(id) { this.id = id; this.materials = {}; this.batches = {}; this.colliders = []; this.props = []; this.hotspots = []; this.lights = []; this.spawn = [0, 1.65, 4]; this.preview = [0, 1.65, 4]; this.look = [0, 1.5, -4]; this.bounds = { w: 10, d: 12 }; this.fog = [.022, .04, .041]; this.fogDensity = .037; this.exposure = 1.3; this.ghost = [0, 0, -4]; }
        material(id, color = '#ffffff', options = {}) { this.materials[id] = { color: S.rgb(color), texture: null, alpha: 1, emissive: 0, roughness: .8, mode: 0, ...options }; return id; }
        vertex(mat, p, n, uv) { (this.batches[mat] ??= []).push(...p, ...n, ...uv); }
        quad(mat, pts, n, uvs = [[0, 0], [1, 0], [1, 1], [0, 1]]) { for (let i of [0, 1, 2, 0, 2, 3])
            this.vertex(mat, pts[i], n, uvs[i]); }
        box(x, y, z, w, h, d, mat, rot = 0, solid = false, uvScale = 1) {
            const c = Math.cos(rot), s = Math.sin(rot), tr = p => [x + p[0] * c + p[2] * s, y + p[1], z - p[0] * s + p[2] * c], tn = p => [p[0] * c + p[2] * s, p[1], -p[0] * s + p[2] * c];
            w /= 2;
            h /= 2;
            d /= 2;
            const faces = [[[[-w, -h, d], [w, -h, d], [w, h, d], [-w, h, d]], [0, 0, 1], w * 2, h * 2], [[[w, -h, -d], [-w, -h, -d], [-w, h, -d], [w, h, -d]], [0, 0, -1], w * 2, h * 2], [[[w, -h, d], [w, -h, -d], [w, h, -d], [w, h, d]], [1, 0, 0], d * 2, h * 2], [[[-w, -h, -d], [-w, -h, d], [-w, h, d], [-w, h, -d]], [-1, 0, 0], d * 2, h * 2], [[[-w, h, d], [w, h, d], [w, h, -d], [-w, h, -d]], [0, 1, 0], w * 2, d * 2], [[[-w, -h, -d], [w, -h, -d], [w, -h, d], [-w, -h, d]], [0, -1, 0], w * 2, d * 2]];
            for (const [p, n, uw, uh] of faces) {
                const u = uvScale === 0 ? 1 : uw * uvScale, v = uvScale === 0 ? 1 : uh * uvScale;
                this.quad(mat, p.map(tr), tn(n), [[0, v], [u, v], [u, 0], [0, 0]]);
            }
            if (solid) {
                const rw = Math.abs(w * c) + Math.abs(d * s), rd = Math.abs(w * s) + Math.abs(d * c);
                this.colliders.push({ x, z, w: rw * 2, d: rd * 2 });
            }
        }
        cylinder(x, y, z, r1, r2, h, mat, segments = 16) {
            for (let i = 0; i < segments; i++) {
                const a = i / segments * Math.PI * 2, b = (i + 1) / segments * Math.PI * 2, sl = (r1 - r2) / h;
                const p = [[x + Math.cos(a) * r1, y - h / 2, z + Math.sin(a) * r1], [x + Math.cos(b) * r1, y - h / 2, z + Math.sin(b) * r1], [x + Math.cos(b) * r2, y + h / 2, z + Math.sin(b) * r2], [x + Math.cos(a) * r2, y + h / 2, z + Math.sin(a) * r2]];
                this.quad(mat, [p[1], p[0], p[3], p[2]], V.norm([Math.cos((a + b) / 2), sl, Math.sin((a + b) / 2)]), [[0, 1], [1, 1], [1, 0], [0, 0]]);
                for (let j of [0, 1, 2])
                    this.vertex(mat, [[x, y + h / 2, z], p[3], p[2]][j], [0, 1, 0], [.5, .5]);
                for (let j of [0, 1, 2])
                    this.vertex(mat, [[x, y - h / 2, z], p[1], p[0]][j], [0, -1, 0], [.5, .5]);
            }
        }
        tube(a, b, r, mat, segments = 10) { const d = V.sub(b, a), len = Math.hypot(...d), v = V.scale(d, 1 / len), u = V.norm(V.cross(v, Math.abs(v[1]) > .9 ? [1, 0, 0] : [0, 1, 0])), w = V.cross(v, u); for (let i = 0; i < segments; i++) {
            let pts = [], norm;
            for (let [j, t] of [[i, 0], [i + 1, 0], [i + 1, 1], [i, 1]]) {
                const theta = j / segments * Math.PI * 2, off = V.add(V.scale(u, Math.cos(theta) * r), V.scale(w, Math.sin(theta) * r));
                pts.push(V.add(V.add(a, V.scale(d, t)), off));
            }
            const m = (i + .5) / segments * Math.PI * 2;
            norm = V.add(V.scale(u, Math.cos(m)), V.scale(w, Math.sin(m)));
            this.quad(mat, pts, norm, [[0, 0], [1, 0], [1, len], [0, len]]);
        } }
        sphere(x, y, z, rx, ry, rz, mat, seg = 16, rings = 10) { const point = (a, b) => [x + rx * Math.sin(b) * Math.cos(a), y + ry * Math.cos(b), z + rz * Math.sin(b) * Math.sin(a)]; for (let j = 0; j < rings; j++)
            for (let i = 0; i < seg; i++) {
                const a = i / seg * Math.PI * 2, b = (i + 1) / seg * Math.PI * 2, c = j / rings * Math.PI, d = (j + 1) / rings * Math.PI;
                let p = [point(a, c), point(a, d), point(b, d), point(b, c)], n = V.norm([(p[0][0] - x) / rx, (p[0][1] - y) / ry, (p[0][2] - z) / rz]);
                this.quad(mat, [p[3], p[2], p[1], p[0]], n);
            } }
        light(pos, color, intensity = 3) { this.lights.push({ pos, color: S.rgb(color), intensity }); }
        hotspot(id, label, pos, options = {}) { this.hotspots.push({ id, label, pos, ...options }); }
        prop(x, z, w, d, label, kind, rot = 0) { this.props.push({ x, z, w, d, label, kind, rot }); }
    }
    S.Builder = Builder;
    const VS = `#version 300 es
precision highp float;
layout(location=0) in vec3 aPos;layout(location=1) in vec3 aNormal;layout(location=2) in vec2 aUv;
uniform mat4 uVP;uniform mat4 uLightVP;out vec3 vPos;out vec3 vNormal;out vec2 vUv;out vec4 vShadow;
void main(){vPos=aPos;vNormal=aNormal;vUv=aUv;vShadow=uLightVP*vec4(aPos,1.);gl_Position=uVP*vec4(aPos,1.);}`;
    const FS = `#version 300 es
precision highp float;
in vec3 vPos;in vec3 vNormal;in vec2 vUv;in vec4 vShadow;out vec4 frag;
uniform sampler2D uTex;uniform sampler2D uShadow;uniform vec3 uColor;uniform float uAlpha;uniform float uEmission;uniform float uRough;uniform int uMode;
uniform vec3 uEye;uniform vec3 uForward;uniform vec3 uLightPos[4];uniform vec3 uLightCol[4];uniform float uLightPower[4];uniform vec3 uFog;uniform float uFogDensity;uniform float uExposure;uniform float uFlash;uniform float uTime;uniform bool uShadows;
float shadow(vec3 n,vec3 ld){if(!uShadows)return 1.;vec3 p=vShadow.xyz/vShadow.w*.5+.5;if(p.x<0.||p.x>1.||p.y<0.||p.y>1.||p.z>1.||p.z<0.)return 1.;float bias=max(.0018*(1.-dot(n,ld)),.00065),s=0.;vec2 ts=1./vec2(textureSize(uShadow,0));for(int x=-1;x<=1;x++)for(int y=-1;y<=1;y++)s+=p.z-bias>texture(uShadow,p.xy+vec2(float(x),float(y))*ts).r?.30:1.;return s/9.;}
void main(){
 vec3 tex=texture(uTex,vUv).rgb,albedo=pow(max(tex*uColor,vec3(.001)),vec3(2.2));vec3 n=normalize(vNormal);if(!gl_FrontFacing)n=-n;vec3 view=normalize(uEye-vPos);float dist=length(uEye-vPos);
 vec3 lit=albedo*(vec3(.145,.173,.17)+max(0.,n.y)*.14);
 for(int i=0;i<4;i++){vec3 delta=uLightPos[i]-vPos;float d=length(delta);vec3 ld=delta/max(d,.001);float att=uLightPower[i]/(1.+d*d*.23);float sh=i==0?shadow(n,ld):1.;float diff=max(dot(n,ld),0.);float shine=pow(max(dot(n,normalize(ld+view)),0.),mix(90.,9.,uRough))*(1.-uRough)*.65;lit+=(albedo*diff+shine)*uLightCol[i]*att*sh;}
 vec3 fl=uEye+vec3(.12,-.16,0.)-vPos;float fd=length(fl);vec3 fld=fl/max(fd,.001);float cone=smoothstep(.73,.94,dot(-fld,uForward));cone*=.83+.17*cos(dot(-fld,uForward)*36.);float fa=uFlash*cone*4.6/(1.+fd*fd*.17);lit+=(albedo*max(dot(n,fld),0.)+pow(max(dot(n,normalize(fld+view)),0.),35.)*(1.-uRough)*.2)*vec3(.88,.95,.84)*fa;
 lit+=albedo*uEmission;
 float alpha=uAlpha;
 if(uMode==1){lit=albedo*(1.+uEmission);}
 if(uMode==2){lit=uColor*1.1;alpha*=pow(1.-abs(dot(n,view)),1.6)*pow(sin(clamp(vUv.y,0.,1.)*3.14159),.65);}
 float fog=1.-exp(-dist*uFogDensity);lit=mix(lit,uFog,fog);
 vec3 mapped=vec3(1.)-exp(-lit*uExposure);frag=vec4(pow(mapped,vec3(1./2.2)),alpha);
}`;
    const DVS = `#version 300 es
layout(location=0)in vec3 aPos;uniform mat4 uVP;void main(){gl_Position=uVP*vec4(aPos,1.);}`;
    const DFS = `#version 300 es
precision highp float;void main(){}`;
    const PVS = `#version 300 es
out vec2 vUv;void main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);vUv=p;gl_Position=vec4(p*2.-1.,0.,1.);}`;
    const PFS = `#version 300 es
precision highp float;in vec2 vUv;out vec4 frag;uniform sampler2D uImage;uniform vec2 uSize;uniform float uTime;uniform float uFX;uniform float uBrightness;uniform float uFear;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
void main(){vec2 uv=vUv,delta=(uv-.5);float edge=dot(delta,delta);vec2 ca=delta*edge*(.0025+.003*uFear)*uFX;vec3 col=vec3(texture(uImage,uv+ca).r,texture(uImage,uv).g,texture(uImage,uv-ca).b);
 vec3 bloom=vec3(0.);vec2 px=1./uSize;
 for(int i=0;i<8;i++){float a=float(i)*.785398;vec2 off=vec2(cos(a),sin(a))*px*(5.+float(i%3)*3.);bloom+=max(texture(uImage,uv+off).rgb-.67,0.);}
 col+=bloom*.10*uFX;col*=1.-smoothstep(.07,.65,edge)*.48*uFX;float grain=(hash(gl_FragCoord.xy+floor(uTime*12.))-.5)*.032;col+=grain*uFX;col*=1.+(uBrightness-1.)*.48;col=mix(col,col*vec3(.90,1.015,1.01),.30*uFX);frag=vec4(max(col,0.),1.);
}`;
    // Subtle depth-tested motes: visible in the torch, not a screen-space overlay.
    const DUST_VS = `#version 300 es
precision highp float;layout(location=0)in vec3 aPos;uniform mat4 uVP;uniform vec3 uBounds;uniform vec3 uEye;uniform vec3 uForward;uniform float uTime;uniform float uFlash;out float vAlpha;
void main(){vec3 p=aPos*uBounds-uBounds*vec3(.5,0.,.5);p.x+=sin(uTime*.11+aPos.z*17.)*.08;p.z+=sin(uTime*.09+aPos.x*27.)*.07;p.y=mod(p.y+uTime*.018+aPos.x*.13,uBounds.y);vec3 d=p-uEye;float dist=length(d);float cone=smoothstep(.72,.97,dot(normalize(d),uForward));vAlpha=(.09+cone*uFlash*.43)*clamp(1.-dist/16.,0.,1.);gl_Position=uVP*vec4(p,1.);gl_PointSize=clamp(8./max(gl_Position.w,.1),1.,3.);}`;
    const DUST_FS = `#version 300 es
precision highp float;in float vAlpha;out vec4 frag;void main(){float r=length(gl_PointCoord-.5)*2.;if(r>1.)discard;frag=vec4(.77,.83,.74,(1.-r*r)*vAlpha);}`;
    class Renderer {
        constructor(canvas) {
            this.canvas = canvas;
            const gl = canvas.getContext('webgl2', { alpha: false, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: false });
            if (!gl)
                throw new Error('WebGL 2 unavailable');
            this.gl = gl;
            this.quality = 'balanced';
            this.scale = .86;
            this.fx = 1;
            this.brightness = 1;
            this.shadows = true;
            this.fear = 0;
            this.cache = new Map();
            this.matCache = new WeakMap();
            this.stats = { drawCalls: 0, triangles: 0 };
            this.lastVP = M.identity();
            this.dustProgram = this.programFor(DUST_VS, DUST_FS);
            this.dustVAO = gl.createVertexArray();
            this.dustBuffer = gl.createBuffer();
            gl.bindVertexArray(this.dustVAO);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.dustBuffer);
            const random = S.rng(1707);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(Array.from({ length: 720 }, () => random())), gl.STATIC_DRAW);
            gl.enableVertexAttribArray(0);
            gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 12, 0);
            gl.bindVertexArray(null);
            this.program = this.programFor(VS, FS);
            this.depthProgram = this.programFor(DVS, DFS);
            this.postProgram = this.programFor(PVS, PFS);
            this.emptyVAO = gl.createVertexArray();
            const cc = S.canvas(1);
            cc.getContext('2d').fillStyle = '#fff';
            cc.getContext('2d').fillRect(0, 0, 1, 1);
            this.white = this.texture(cc);
            this.shadowTexture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, this.shadowTexture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT24, 1024, 1024, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
            for (let k of [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER])
                gl.texParameteri(gl.TEXTURE_2D, k, gl.NEAREST);
            for (let k of [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T])
                gl.texParameteri(gl.TEXTURE_2D, k, gl.CLAMP_TO_EDGE);
            this.shadowFBO = gl.createFramebuffer();
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.shadowFBO);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, this.shadowTexture, 0);
            gl.drawBuffers([gl.NONE]);
            gl.readBuffer(gl.NONE);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            this.frameFBO = gl.createFramebuffer();
            this.frameTexture = gl.createTexture();
            this.frameDepth = gl.createRenderbuffer();
            this.resize();
            gl.enable(gl.DEPTH_TEST);
            gl.enable(gl.CULL_FACE);
            gl.cullFace(gl.BACK);
            gl.clearColor(.02, .035, .035, 1);
            canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); this.lost = true; window.dispatchEvent(new CustomEvent('ward:renderlost')); });
            canvas.addEventListener('webglcontextrestored', () => location.reload());
        }
        programFor(v, f) { const gl = this.gl, p = gl.createProgram(); for (let [type, src] of [[gl.VERTEX_SHADER, v], [gl.FRAGMENT_SHADER, f]]) {
            const sh = gl.createShader(type);
            gl.shaderSource(sh, src);
            gl.compileShader(sh);
            if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS))
                throw new Error(gl.getShaderInfoLog(sh));
            gl.attachShader(p, sh);
        } gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS))
            throw new Error(gl.getProgramInfoLog(p)); p.loc = {}; return p; }
        loc(p, name) { return p.loc[name] ?? (p.loc[name] = this.gl.getUniformLocation(p, name)); }
        texture(c) { const gl = this.gl, t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c); gl.generateMipmap(gl.TEXTURE_2D); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT); return t; }
        resize() { const gl = this.gl, dpr = Math.min(window.devicePixelRatio || 1, 1.5), scale = this.quality === 'high' ? 1 : this.quality === 'low' ? .60 : .83; const w = Math.max(1, Math.round(innerWidth * dpr * scale)), h = Math.max(1, Math.round(innerHeight * dpr * scale)); if (this.canvas.width === w && this.canvas.height === h)
            return; this.canvas.width = w; this.canvas.height = h; gl.bindTexture(gl.TEXTURE_2D, this.frameTexture); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); gl.bindRenderbuffer(gl.RENDERBUFFER, this.frameDepth); gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, w, h); gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameFBO); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.frameTexture, 0); gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.frameDepth); gl.bindFramebuffer(gl.FRAMEBUFFER, null); }
        compile(world) { if (this.cache.has(world))
            return this.cache.get(world); const gl = this.gl, meshes = []; for (let [id, arr] of Object.entries(world.batches)) {
            const mat = world.materials[id], vao = gl.createVertexArray(), buf = gl.createBuffer();
            gl.bindVertexArray(vao);
            gl.bindBuffer(gl.ARRAY_BUFFER, buf);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(arr), gl.STATIC_DRAW);
            for (let [i, n, off] of [[0, 3, 0], [1, 3, 12], [2, 2, 24]]) {
                gl.enableVertexAttribArray(i);
                gl.vertexAttribPointer(i, n, gl.FLOAT, false, 32, off);
            }
            let tex = this.white;
            if (mat.texture) {
                if (!this.matCache.has(mat.texture))
                    this.matCache.set(mat.texture, this.texture(mat.texture));
                tex = this.matCache.get(mat.texture);
            }
            meshes.push({ id, vao, buf, count: arr.length / 8, mat, tex });
        } meshes.sort((a, b) => (a.mat.alpha < 1 ? 1 : 0) - (b.mat.alpha < 1 ? 1 : 0)); this.cache.set(world, meshes); gl.bindVertexArray(null); return meshes; }
        shadow(world, meshes) { const gl = this.gl, light = world.lights[0] || { pos: [0, 4, 0] }, target = [light.pos[0], 0, light.pos[2] - .01]; this.lightVP = M.mul(M.perspective(2.85, 1, .3, 35), M.lookAt(light.pos, target, [0, 0, -1])); gl.bindFramebuffer(gl.FRAMEBUFFER, this.shadowFBO); gl.viewport(0, 0, 1024, 1024); gl.clear(gl.DEPTH_BUFFER_BIT); gl.useProgram(this.depthProgram); gl.uniformMatrix4fv(this.loc(this.depthProgram, 'uVP'), false, this.lightVP); gl.disable(gl.BLEND); gl.enable(gl.DEPTH_TEST); gl.enable(gl.CULL_FACE); gl.cullFace(gl.FRONT); for (let m of meshes) {
            if (m.mat.alpha < 1 || m.mat.mode === 1 || m.id.startsWith('ghost'))
                continue;
            gl.bindVertexArray(m.vao);
            gl.drawArrays(gl.TRIANGLES, 0, m.count);
        } gl.cullFace(gl.BACK); gl.bindFramebuffer(gl.FRAMEBUFFER, null); this.shadowWorld = world; }
        render(world, camera, time, { flash = 1, ghost = 0, power = false } = {}) {
            if (this.lost)
                return;
            const gl = this.gl, meshes = this.compile(world);
            if (this.shadowWorld !== world)
                this.shadow(world, meshes);
            const dir = [Math.sin(camera.yaw) * Math.cos(camera.pitch), Math.sin(camera.pitch), -Math.cos(camera.yaw) * Math.cos(camera.pitch)], vp = M.mul(M.perspective((camera.fov || 68) * Math.PI / 180, this.canvas.width / this.canvas.height, .055, 70), M.lookAt(camera.pos, V.add(camera.pos, dir)));
            this.lastVP = vp;
            const p = this.program;
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameFBO);
            gl.viewport(0, 0, this.canvas.width, this.canvas.height);
            gl.clearColor(...world.fog, 1);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            gl.enable(gl.DEPTH_TEST);
            gl.enable(gl.CULL_FACE);
            gl.useProgram(p);
            gl.uniformMatrix4fv(this.loc(p, 'uVP'), false, vp);
            gl.uniformMatrix4fv(this.loc(p, 'uLightVP'), false, this.lightVP);
            gl.uniform3fv(this.loc(p, 'uEye'), camera.pos);
            gl.uniform3fv(this.loc(p, 'uForward'), dir);
            gl.uniform3fv(this.loc(p, 'uFog'), world.fog);
            gl.uniform1f(this.loc(p, 'uFogDensity'), world.fogDensity);
            gl.uniform1f(this.loc(p, 'uExposure'), world.exposure * (power ? 1.14 : 1));
            gl.uniform1f(this.loc(p, 'uFlash'), flash);
            gl.uniform1f(this.loc(p, 'uTime'), time);
            gl.uniform1i(this.loc(p, 'uShadows'), this.shadows && this.quality !== 'low');
            const lp = [], lc = [], li = [];
            for (let i = 0; i < 4; i++) {
                const l = world.lights[i] || { pos: [0, 3, 0], color: [0, 0, 0], intensity: 0 };
                lp.push(...l.pos);
                lc.push(...l.color);
                li.push(l.intensity * (1 + Math.sin(time * .67 + i * 1.7) * .025) * (power ? 1.15 : 1));
            }
            gl.uniform3fv(this.loc(p, 'uLightPos[0]'), lp);
            gl.uniform3fv(this.loc(p, 'uLightCol[0]'), lc);
            gl.uniform1fv(this.loc(p, 'uLightPower[0]'), li);
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, this.shadowTexture);
            gl.uniform1i(this.loc(p, 'uShadow'), 1);
            gl.activeTexture(gl.TEXTURE0);
            gl.uniform1i(this.loc(p, 'uTex'), 0);
            this.stats.drawCalls = 0;
            this.stats.triangles = 0;
            for (const m of meshes) {
                const mat = m.mat;
                let alpha = mat.alpha;
                if (m.id.startsWith('ghost'))
                    alpha *= ghost;
                if (alpha < .005)
                    continue;
                const transparent = alpha < .99 || mat.mode === 2;
                if (transparent) {
                    gl.enable(gl.BLEND);
                    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
                    gl.depthMask(false);
                    gl.disable(gl.CULL_FACE);
                }
                else {
                    gl.disable(gl.BLEND);
                    gl.depthMask(true);
                    gl.enable(gl.CULL_FACE);
                }
                gl.uniform3fv(this.loc(p, 'uColor'), mat.color);
                gl.uniform1f(this.loc(p, 'uAlpha'), alpha);
                gl.uniform1f(this.loc(p, 'uEmission'), mat.emissive);
                gl.uniform1f(this.loc(p, 'uRough'), mat.roughness);
                gl.uniform1i(this.loc(p, 'uMode'), mat.mode);
                gl.bindTexture(gl.TEXTURE_2D, m.tex);
                gl.bindVertexArray(m.vao);
                gl.drawArrays(gl.TRIANGLES, 0, m.count);
                this.stats.drawCalls++;
                this.stats.triangles += m.count / 3;
            }
            if (this.fx && this.quality !== 'low') {
                const dp = this.dustProgram;
                gl.useProgram(dp);
                gl.bindVertexArray(this.dustVAO);
                gl.uniformMatrix4fv(this.loc(dp, 'uVP'), false, vp);
                gl.uniform3f(this.loc(dp, 'uBounds'), world.bounds.w, 3.5, world.bounds.d);
                gl.uniform3fv(this.loc(dp, 'uEye'), camera.pos);
                gl.uniform3fv(this.loc(dp, 'uForward'), dir);
                gl.uniform1f(this.loc(dp, 'uTime'), this.reducedMotion ? 0 : time);
                gl.uniform1f(this.loc(dp, 'uFlash'), flash);
                gl.enable(gl.BLEND);
                gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
                gl.depthMask(false);
                gl.drawArrays(gl.POINTS, 0, 240);
                this.stats.drawCalls++;
            }
            gl.depthMask(true);
            gl.disable(gl.DEPTH_TEST);
            gl.disable(gl.BLEND);
            gl.disable(gl.CULL_FACE);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.viewport(0, 0, this.canvas.width, this.canvas.height);
            gl.useProgram(this.postProgram);
            gl.bindVertexArray(this.emptyVAO);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.frameTexture);
            gl.uniform1i(this.loc(this.postProgram, 'uImage'), 0);
            gl.uniform2f(this.loc(this.postProgram, 'uSize'), this.canvas.width, this.canvas.height);
            gl.uniform1f(this.loc(this.postProgram, 'uTime'), time);
            gl.uniform1f(this.loc(this.postProgram, 'uFX'), this.fx);
            gl.uniform1f(this.loc(this.postProgram, 'uBrightness'), this.brightness);
            gl.uniform1f(this.loc(this.postProgram, 'uFear'), this.fear);
            gl.drawArrays(gl.TRIANGLES, 0, 3);
        }
        dispose() { const gl = this.gl; for (const meshes of this.cache.values())
            for (const m of meshes) {
                gl.deleteBuffer(m.buf);
                gl.deleteVertexArray(m.vao);
            } this.cache.clear(); gl.deleteBuffer(this.dustBuffer); gl.deleteVertexArray(this.dustVAO); gl.deleteVertexArray(this.emptyVAO); for (const p of [this.program, this.depthProgram, this.postProgram, this.dustProgram])
            gl.deleteProgram(p); for (const t of [this.shadowTexture, this.frameTexture, this.white])
            gl.deleteTexture(t); gl.deleteFramebuffer(this.shadowFBO); gl.deleteFramebuffer(this.frameFBO); gl.deleteRenderbuffer(this.frameDepth); }
    }
    S.Renderer = Renderer;
})();
