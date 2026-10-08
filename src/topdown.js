/* Native Canvas 2D exploration. Not an orthographic camera pretending to be a new mode. */
'use strict';
(() => {
    const S = window.SW;
    class Topdown {
        constructor(canvas) { this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.transform = { s: 1, cx: 0, cy: 0 }; this.route = []; this.cache = new Map(); }
        resize() { const dpr = Math.min(devicePixelRatio || 1, 1.5); if (this.canvas.width !== Math.round(innerWidth * dpr) || this.canvas.height !== Math.round(innerHeight * dpr)) {
            this.canvas.width = Math.round(innerWidth * dpr);
            this.canvas.height = Math.round(innerHeight * dpr);
        } }
        setup(world) { this.resize(); const w = this.canvas.width, h = this.canvas.height, dpr = this.canvas.width / innerWidth; const availableW = innerWidth < 800 ? innerWidth - 30 : innerWidth - 390, availableH = innerHeight - (innerWidth < 800 ? 265 : 180); const s = Math.min(availableW / world.bounds.w, Math.max(180, availableH) / world.bounds.d) * dpr; this.transform = { s, cx: w / 2, cy: h / 2 + (innerWidth < 800 ? 10 : 0) }; }
        project(pos) { const { s, cx, cy } = this.transform, ratio = innerWidth / this.canvas.width; return { x: (cx + pos[0] * s) * ratio, y: (cy + pos[2] * s) * ratio }; }
        unproject(x, y) { const { s, cx, cy } = this.transform, ratio = this.canvas.width / innerWidth; return [(x * ratio - cx) / s, (y * ratio - cy) / s]; }
        staticMap(world) {
            if (this.cache.has(world))
                return this.cache.get(world);
            const pixels = 70, pad = 35, c = S.canvas(Math.ceil(world.bounds.w * pixels + pad * 2), Math.ceil(world.bounds.d * pixels + pad * 2)), g = c.getContext('2d'), { w, d } = world.bounds;
            g.translate(c.width / 2, c.height / 2);
            g.scale(pixels, pixels);
            g.fillStyle = '#1e302f';
            g.shadowColor = '#000';
            g.shadowBlur = 22;
            g.fillRect(-w / 2 - .12, -d / 2 - .12, w + .24, d + .24);
            g.shadowBlur = 0;
            const pattern = g.createPattern(world.materials.floor.texture, 'repeat');
            const trans = new DOMMatrix().scale(3.4 / 512);
            pattern.setTransform(trans);
            g.fillStyle = pattern;
            g.fillRect(-w / 2, -d / 2, w, d);
            const gr = g.createRadialGradient(0, -2, .2, 0, 0, d * .8);
            gr.addColorStop(0, '#14242011');
            gr.addColorStop(1, '#041014aa');
            g.fillStyle = gr;
            g.fillRect(-w / 2, -d / 2, w, d);
            const rnd = S.rng(world.id.length * 111);
            for (let i = 0; i < 12; i++) {
                g.fillStyle = '#b2b49755';
                g.save();
                g.translate((rnd() - .5) * (w - 1), (rnd() - .5) * (d - 1));
                g.rotate(rnd() * 3);
                g.fillRect(-.12, -.16, .24, .32);
                g.strokeStyle = '#31473666';
                g.lineWidth = .007;
                for (let j = 0; j < 4; j++) {
                    g.beginPath();
                    g.moveTo(-.08, -.08 + j * .042);
                    g.lineTo(.08, -.08 + j * .042);
                    g.stroke();
                }
                g.restore();
            }
            g.fillStyle = '#8a9d85';
            g.fillRect(-w / 2 - .13, -d / 2 - .13, w + .26, .22);
            g.fillRect(-w / 2 - .13, d / 2 - .09, w + .26, .22);
            g.fillRect(-w / 2 - .13, -d / 2, .22, d);
            g.fillRect(w / 2 - .09, -d / 2, .22, d);
            g.strokeStyle = '#e0e9c630';
            g.lineWidth = .017;
            g.strokeRect(-w / 2 + .11, -d / 2 + .11, w - .22, d - .22);
            for (const p of world.props)
                this.prop(g, p, world);
            // Archival labels, surveillance calibration and ceiling light spills.
            g.fillStyle = '#b9c8a439';
            g.font = '.13px monospace';
            g.textAlign = 'center';
            g.fillText(S.sceneMeta[world.id].en, 0, d / 2 - .45);
            for (const l of world.lights) {
                const glow = g.createRadialGradient(l.pos[0], l.pos[2], 0, l.pos[0], l.pos[2], 3.2);
                const rgb = l.color.map(v => Math.round(v * 255));
                glow.addColorStop(0, `rgba(${rgb},.16)`);
                glow.addColorStop(.4, `rgba(${rgb},.055)`);
                glow.addColorStop(1, `rgba(${rgb},0)`);
                g.fillStyle = glow;
                g.fillRect(l.pos[0] - 3.2, l.pos[2] - 3.2, 6.4, 6.4);
            }
            this.cache.set(world, c);
            return c;
        }
        prop(g, p, world) {
            const { x, z, w, d, kind, rot } = p;
            g.save();
            g.translate(x, z);
            g.rotate(rot || 0);
            g.shadowColor = '#0009';
            g.shadowBlur = 9;
            g.shadowOffsetX = 4;
            g.shadowOffsetY = 5;
            g.fillStyle = { bed: '#9cab9b', counter: '#536c60', table: '#6b6a50', cabinet: '#576e62', shelf: '#5b624d', generator: '#67705d', crate: '#736848', chair: '#516657', phone: '#142725', door: '#3b5149' }[kind] || '#465c4d';
            g.fillRect(-w / 2, -d / 2, w, d);
            g.shadowBlur = 0;
            g.shadowOffsetX = g.shadowOffsetY = 0;
            g.lineWidth = .035;
            g.strokeStyle = '#b9c4a151';
            g.strokeRect(-w / 2, -d / 2, w, d);
            if (['tank','orb','bell','telescope','clock','bench','track','gate'].includes(kind)) {
                g.fillStyle=world.accent+'45';
                if(['tank','orb','bell'].includes(kind)){g.beginPath();g.ellipse(0,0,w*.43,d*.43,0,0,Math.PI*2);g.fill();g.stroke();g.beginPath();g.ellipse(0,0,w*.28,d*.28,0,0,Math.PI*2);g.stroke();}
                else if(kind==='telescope'){g.rotate(-.4);g.fillRect(-.23,-d*.43,.46,d*.86);g.strokeRect(-.23,-d*.43,.46,d*.86);}
                else if(kind==='track'){g.strokeStyle=world.accent+'99';for(const x of [-.43,.43]){g.beginPath();g.moveTo(x,-d/2);g.lineTo(x,d/2);g.stroke();}}
                else if(kind==='bench'){g.fillRect(-w/2+.07,-d/2+.07,w-.14,d*.5);g.strokeRect(-w/2,-d/2,w,.12);}
                else {g.fillRect(-w*.3,-d*.3,w*.6,d*.6);}
            }
            else if (kind === 'bed') {
                g.fillStyle = '#b8c3ac';
                g.fillRect(-w / 2 + .10, -d / 2 + .1, w - .2, d - .23);
                g.fillStyle = '#d2d5bd';
                g.fillRect(-w * .30, -d / 2 + .19, w * .60, .40);
                const sheet = g.createLinearGradient(0, -d / 2 + .80, 0, d / 2);
                sheet.addColorStop(0, '#aabda5');
                sheet.addColorStop(1, '#6a8570');
                g.fillStyle = sheet;
                g.fillRect(-w / 2 + .12, -d / 2 + .82, w - .24, d - .97);
                g.lineWidth = .022;
                g.strokeStyle = '#465f4b77';
                for (let y = 0; y < d / 2 - .2; y += .12) {
                    g.beginPath();
                    g.moveTo(-w / 2 + .13, y);
                    g.lineTo(w / 2 - .13, y + .06);
                    g.stroke();
                }
                g.fillStyle = '#bac2a0';
                g.fillRect(-w / 2 - .045, -d / 2, .045, d);
                g.fillRect(w / 2, -d / 2, .045, d);
            }
            else if (kind === 'shelf') {
                g.fillStyle = '#2a3d30';
                g.fillRect(-w / 2 + .04, -d / 2 + .06, w - .08, d - .12);
                const r = S.rng(Math.round(x * 22 + z * 15 + 500));
                for (let i = -w / 2 + .08; i < w / 2 - .08; i += .14) {
                    g.fillStyle = ['#8b906c', '#aa956b', '#728a68', '#9c9c7c'][Math.floor(r() * 4)];
                    g.fillRect(i, -d / 2 + .10, .10, d - .22);
                    g.fillStyle = '#d6cdaa77';
                    g.fillRect(i + .015, d / 2 - .20, .065, .035);
                }
            }
            else if (kind === 'generator') {
                g.fillStyle = '#2d4235';
                g.fillRect(-w / 2 + .15, -d / 2 + .12, w - .30, d - .24);
                g.strokeStyle = '#c0b08050';
                g.lineWidth = .04;
                for (let q = -w / 2 + .22; q < w / 2 - .17; q += .12) {
                    g.beginPath();
                    g.moveTo(q, -d / 2 + .2);
                    g.lineTo(q, d / 2 - .2);
                    g.stroke();
                }
                g.fillStyle = '#d48e60';
                g.beginPath();
                g.arc(w / 2 - .24, -d / 2 + .25, .07, 0, 6.29);
                g.fill();
            }
            else if (kind === 'cabinet') {
                g.strokeStyle = '#c1c9a077';
                g.lineWidth = .025;
                g.strokeRect(-w / 2 + .08, -d / 2 + .08, w - .16, d - .16);
                g.fillStyle = '#1c3424';
                g.fillRect(w / 2 - .20, -.12, .04, .24);
            }
            else if (kind === 'counter' || kind === 'table') {
                g.strokeStyle = '#bfc2a34d';
                g.lineWidth = .019;
                for (let q = -d / 2 + .12; q < d / 2; q += .07) {
                    g.beginPath();
                    g.moveTo(-w / 2 + .02, q);
                    g.lineTo(w / 2 - .02, q + .008);
                    g.stroke();
                }
                g.fillStyle = '#c0c4a488';
                g.fillRect(-w * .2, -.12, .32, .4);
                g.fillStyle = '#294434';
                g.fillRect(w * .21, -.16, .26, .22);
            }
            else if (kind === 'chair') {
                g.fillStyle = '#263e2b';
                g.fillRect(-w / 2 + .09, -d / 2 + .10, w - .18, d - .2);
                g.fillStyle = '#a1af8866';
                g.fillRect(-w / 2, -d / 2, w, .10);
            }
            else if (kind === 'crate') {
                g.strokeStyle = '#283d2a';
                g.lineWidth = .05;
                g.beginPath();
                g.moveTo(-w / 2, -d / 2);
                g.lineTo(w / 2, d / 2);
                g.moveTo(w / 2, -d / 2);
                g.lineTo(-w / 2, d / 2);
                g.stroke();
            }
            g.restore();
        }
        render(world, player, time, { flash = true, ghost = 0, route = [], reduced = false } = {}) {
            this.setup(world);
            const g = this.ctx, { s, cx, cy } = this.transform, W = this.canvas.width, H = this.canvas.height;
            g.setTransform(1, 0, 0, 1, 0, 0);
            g.fillStyle = '#071113';
            g.fillRect(0, 0, W, H);
            // Faint drafting grid outside the lit map.
            g.strokeStyle = '#75928010';
            g.lineWidth = 1;
            for (let x = cx % 36; x < W; x += 36) {
                g.beginPath();
                g.moveTo(x, 0);
                g.lineTo(x, H);
                g.stroke();
            }
            for (let y = cy % 36; y < H; y += 36) {
                g.beginPath();
                g.moveTo(0, y);
                g.lineTo(W, y);
                g.stroke();
            }
            const map = this.staticMap(world), ww = world.bounds.w + .99, dd = world.bounds.d + .99;
            g.drawImage(map, cx - ww * s / 2, cy - dd * s / 2, ww * s, dd * s);
            g.save();
            g.translate(cx, cy);
            g.scale(s, s);
            if (route.length) {
                g.strokeStyle = '#bfd6a860';
                g.lineWidth = .04;
                g.setLineDash([.08, .12]);
                g.beginPath();
                g.moveTo(player.pos[0], player.pos[2]);
                for (let p of route)
                    g.lineTo(p[0], p[1]);
                g.stroke();
                g.setLineDash([]);
                const last = route[route.length - 1];
                g.strokeStyle = '#b9c697';
                g.beginPath();
                g.arc(last[0], last[1], .14, 0, 6.29);
                g.stroke();
            }
            const x = player.pos[0], z = player.pos[2];
            if (flash) {
                g.save();
                g.translate(x, z);
                g.rotate(player.yaw);
                const beam = g.createRadialGradient(0, 0, .1, 0, 0, 5.5);
                beam.addColorStop(0, '#e7eac732');
                beam.addColorStop(.5, '#d5e3b717');
                beam.addColorStop(1, '#d5e3b700');
                g.fillStyle = beam;
                g.beginPath();
                g.moveTo(0, 0);
                g.arc(0, 0, 5.5, -Math.PI / 2 - .50, -Math.PI / 2 + .50);
                g.closePath();
                g.fill();
                g.restore();
            }
            if (ghost > .01) {
                g.globalAlpha = ghost * .75;
                g.fillStyle = '#111a18';
                g.beginPath();
                g.ellipse(world.ghost[0], world.ghost[2], .22, .39, 0, 0, 6.29);
                g.fill();
                g.fillStyle = '#a5b19a';
                g.beginPath();
                g.arc(world.ghost[0], world.ghost[2] - .22, .13, 0, 6.29);
                g.fill();
                g.globalAlpha = 1;
            }
            const glow = g.createRadialGradient(x, z, 0, x, z, 1.0);
            glow.addColorStop(0, '#b8ce9866');
            glow.addColorStop(1, '#b8ce9800');
            g.fillStyle = glow;
            g.fillRect(x - 1, z - 1, 2, 2);
            g.save();
            g.translate(x, z);
            g.rotate(player.yaw);
            g.fillStyle = '#4e624b';
            g.strokeStyle = '#e2e7c4';
            g.lineWidth = .029;
            g.beginPath();
            g.ellipse(0, 0, .20, .14, 0, 0, 6.29);
            g.fill();
            g.stroke();
            g.fillStyle = '#dce3b8';
            g.beginPath();
            g.arc(0, -.065, .10, 0, 6.29);
            g.fill();
            g.strokeStyle = '#d2deb0';
            g.beginPath();
            g.moveTo(0, -.2);
            g.lineTo(0, -.46);
            g.stroke();
            g.restore();
            if (!reduced) {
                for (let i = 0; i < 28; i++) {
                    let px = Math.sin(i * 44.1) * world.bounds.w * .49, pz = ((i * 1.45 + time * .017) % world.bounds.d) - world.bounds.d / 2;
                    g.fillStyle = `rgba(189,210,177,${.10 + .09 * Math.sin(time * .4 + i)})`;
                    g.beginPath();
                    g.arc(px, pz, .014, 0, 6.29);
                    g.fill();
                }
            }
            g.restore();
            const edge = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .25, W / 2, H / 2, Math.max(W, H) * .7);
            edge.addColorStop(0, '#020b0d00');
            edge.addColorStop(1, '#020b0dcc');
            g.fillStyle = edge;
            g.fillRect(0, 0, W, H);
        }
        drawMini(canvas, world, player) { const g = canvas.getContext('2d'), W = canvas.width, H = canvas.height, scale = Math.min((W - 14) / world.bounds.w, (H - 14) / world.bounds.d); g.clearRect(0, 0, W, H); g.save(); g.translate(W / 2, H / 2); g.scale(scale, scale); g.fillStyle = '#263d3022'; g.strokeStyle = '#aac38c77'; g.lineWidth = .07; g.fillRect(-world.bounds.w / 2, -world.bounds.d / 2, world.bounds.w, world.bounds.d); g.strokeRect(-world.bounds.w / 2, -world.bounds.d / 2, world.bounds.w, world.bounds.d); for (let p of world.props) {
            g.save();
            g.translate(p.x, p.z);
            g.rotate(p.rot || 0);
            g.fillStyle = '#92b17940';
            g.fillRect(-p.w / 2, -p.d / 2, p.w, p.d);
            g.restore();
        } for (let h of world.hotspots) {
            g.fillStyle = '#b7d391';
            g.beginPath();
            g.arc(h.pos[0], h.pos[2], .12, 0, 6.29);
            g.fill();
        } g.translate(player.pos[0], player.pos[2]); g.rotate(player.yaw); g.fillStyle = '#e2e8b2'; g.beginPath(); g.moveTo(0, -.42); g.lineTo(-.21, .20); g.lineTo(.21, .20); g.closePath(); g.fill(); g.restore(); }
    }
    S.Topdown = Topdown;
})();
