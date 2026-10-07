/* Five authored, independent sets. Both 3D and the Canvas 2D floorplan use this data. */
'use strict';
(() => {
    const S = window.SW, PI = Math.PI;
    const palettes = {
        station: { wall: '#a6b2a7', tile: '#526e64', floor: '#65756a', accent: '#b7d9c2', fog: [.025, .043, .044], w: 12, d: 15 },
        ward: { wall: '#9aabb2', tile: '#4e6775', floor: '#5d737e', accent: '#89b9d4', fog: [.024, .037, .052], w: 12, d: 15 },
        archive: { wall: '#9b9580', tile: '#585748', floor: '#746b53', accent: '#ddc494', fog: [.042, .035, .025], w: 13, d: 15 },
        power: { wall: '#8b8d83', tile: '#565e59', floor: '#595f56', accent: '#d28769', fog: [.042, .025, .023], w: 13, d: 16 },
        exit: { wall: '#a1aca0', tile: '#527169', floor: '#647970', accent: '#a8dbc1', fog: [.023, .041, .036], w: 7.8, d: 24 },
    };
    S.sceneMeta = {
        station: { name: '护士站', en: 'NURSES’ STATION', subtitle: '那通无人接听的电话', short: '交班记录 / 日期机关', mood: '消毒水的气味还在。电话，似乎刚被放下。', index: '01', color: '#91b9a1' },
        ward: { name: '07号病房', en: 'WARD SEVEN', subtitle: '床上曾经睡着谁', short: '雨夜病房 / 图案机关', mood: '床单微微凹陷。你确定，这里没有人。', index: '02', color: '#8eb6ca' },
        archive: { name: '封存档案室', en: 'RESTRICTED ARCHIVE', subtitle: '他们擦掉了所有姓名', short: '遗失病历 / 排序机关', mood: '纸张被整齐归档。有些姓名，却被反复涂掉。', index: '03', color: '#c5ae7f' },
        power: { name: '地下配电室', en: 'EMERGENCY POWER', subtitle: '墙里有人在数数', short: '紧急供电 / 电路机关', mood: '墙里的电流声，听起来像第二个人的呼吸。', index: '04', color: '#cc937b' },
        exit: { name: '离院长廊', en: 'DISCHARGE CORRIDOR', subtitle: '这一次，不要回头', short: '最后一道门 / 离院认证', mood: '门的另一边，应该就是清晨。至少图纸上是这样写的。', index: '05', color: '#9dbda9' },
    };
    function textTexture(lines, { bg = '#233d36', fg = '#d9e3ce', small = 'INTERNAL / 0117', size = 58, paper = false } = {}) {
        const c = S.canvas(512, 256), g = c.getContext('2d');
        g.fillStyle = bg;
        g.fillRect(0, 0, 512, 256);
        if (paper) {
            const r = S.rng(28);
            for (let i = 0; i < 2000; i++) {
                g.fillStyle = `rgba(45,34,20,${r() * .09})`;
                g.fillRect(r() * 512, r() * 256, 1 + r() * 2, 1);
            }
        }
        g.strokeStyle = fg;
        g.globalAlpha = .33;
        g.lineWidth = 2;
        g.strokeRect(12, 12, 488, 232);
        g.globalAlpha = 1;
        g.fillStyle = fg;
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.font = `${size}px "Noto Serif CJK SC","Songti SC",serif`;
        if (typeof lines === 'string')
            lines = [lines];
        lines.forEach((line, i) => g.fillText(line, 256, 104 + (i - (lines.length - 1) / 2) * (size + 12), 458));
        g.font = '17px monospace';
        g.globalAlpha = .70;
        g.fillText(small, 256, 211, 465);
        return c;
    }
    function makeBase(id) {
        const b = new S.Builder(id), p = palettes[id];
        b.bounds = { w: p.w, d: p.d };
        b.fog = p.fog;
        b.accent = p.accent;
        b.exposure = id === 'power' ? 1.23 : 1.45;
        b.spawn = [0, 1.65, p.d / 2 - 2.4];
        b.preview = [p.w * .18, 1.8, p.d / 2 - 1.8];
        b.look = [-.5, 1.25, -p.d / 2 + 1.5];
        b.fogDensity = id === 'exit' ? .029 : .029;
        b.material('wall', '#ffffff', { texture: S.surface('wall', p.wall, 12) });
        b.material('tile', '#ffffff', { texture: S.surface('tile', p.tile, 15), roughness: .63 });
        b.material('floor', '#ffffff', { texture: S.surface('floor', p.floor, 31), roughness: .27 });
        b.material('ceiling', '#ffffff', { texture: S.surface('wall', '#555e58', 37) });
        b.material('metal', '#ffffff', { texture: S.surface('metal', '#708178', 55), roughness: .38 });
        b.material('darkMetal', '#ffffff', { texture: S.surface('metal', '#273331', 38), roughness: .38 });
        b.material('rust', '#ffffff', { texture: S.surface('metal', '#715e48', 79), roughness: .75 });
        b.material('wood', '#ffffff', { texture: S.surface('wood', '#645f4c', 52) });
        b.material('paper', '#ffffff', { texture: S.surface('paper', '#c0bea0', 8) });
        b.material('fabric', '#ffffff', { texture: S.surface('fabric', '#b2b9a7', 21), roughness: .98 });
        b.material('dark', '#162423');
        b.material('black', '#090f10');
        b.material('ivory', '#c3c9b7');
        b.material('lamp', p.accent, { emissive: 3.2, mode: 1 });
        b.material('red', '#ed795f', { emissive: 2.0, mode: 1 });
        b.material('beam', p.accent, { alpha: .06, mode: 2 });
        b.material('glass', '#93b7b2', { alpha: .16, roughness: .08 });
        b.material('water', '#7c9c91', { alpha: .16, roughness: .02 });
        b.material('shadow', '#071011', { alpha: .45, mode: 1 });
        b.material('ghost-coat', '#101d1c', { alpha: .94 });
        b.material('ghost-face', '#a8b6a9', { alpha: .82, emissive: .1 });
        b.material('ghost-hair', '#080d0e', { alpha: .96 });
        const w = p.w, d = p.d, H = 3.65;
        b.box(0, -.12, 0, w, .24, d, 'floor', 0, false, .7);
        b.box(0, H + .08, 0, w, .16, d, 'ceiling', 0, false, .4);
        b.box(-w / 2, H / 2, 0, .24, H, d, 'wall', 0, false, .32);
        b.box(w / 2, H / 2, 0, .24, H, d, 'wall', 0, false, .32);
        b.box(0, H / 2, -d / 2, w, H, .24, 'wall', 0, false, .32);
        b.box(0, H / 2, d / 2, w, H, .24, 'wall', 0, false, .32);
        for (const x of [-w / 2 + .135, w / 2 - .135]) {
            b.box(x, .72, 0, .04, 1.45, d, 'tile', 0, false, .68);
            b.box(x, 1.46, 0, .075, .075, d, 'metal');
            b.box(x, .08, 0, .09, .15, d, 'darkMetal');
            b.box(x, 3.38, 0, .1, .17, d, 'darkMetal');
        }
        for (const z of [-d / 2 + .135, d / 2 - .135]) {
            b.box(0, .72, z, w, 1.45, .04, 'tile', 0, false, .68);
            b.box(0, 1.46, z, w, .075, .075, 'metal');
            b.box(0, .08, z, w, .15, .09, 'darkMetal');
        }
        // Fine scattered papers and puddles break the repetition of the tiled floor.
        const r = S.rng(id.length * 133);
        for (let i = 0; i < 16; i++) {
            const x = (r() - .5) * (w - 2), z = (r() - .5) * (d - 2);
            b.box(x, .009, z, .13 + r() * .18, .006, .20 + r() * .18, 'paper', r() * 3, false, 0);
        }
        for (let i = 0; i < 5; i++) {
            let x = (r() - .5) * (w - 1), z = (r() - .5) * (d - 2);
            b.box(x, .012, z, .9 + r() * 2, .009, .4 + r() * .8, 'water', r(), false, 0);
        }
        b.light([0, 3.26, -1], p.accent, id === 'exit' ? 4.2 : 4.7);
        b.light([-w / 2 + 1.2, 2.3, -d / 2 + 2], id === 'ward' ? '#729ebf' : p.accent, 1.8);
        b.light([w / 2 - 1.4, 2.3, d / 2 - 2], p.accent, 1.7);
        b.light([0, 1.6, -d / 2 + .5], id === 'power' ? '#d65740' : '#668f78', 1.0);
        return b;
    }
    function sign(b, id, text, x, y, z, w, h, rot = 0, options = {}) { b.material(id, '#ffffff', { texture: textTexture(text, options), roughness: .8, emissive: options.glow ? .6 : 0, mode: options.glow ? 1 : 0 }); b.box(x, y, z, w, h, .025, id, rot, false, 0); }
    function ceilingLight(b, x, z, length = 2.4, beam = true) { b.box(x, 3.47, z, length, .10, .30, 'darkMetal'); b.box(x, 3.40, z, length - .18, .026, .15, 'lamp'); for (let o of [-length / 2 + .22, length / 2 - .22])
        b.tube([x + o, 3.51, z], [x + o, 3.64, z], .015, 'metal'); if (beam)
        b.cylinder(x, 1.83, z, 1.65, .14, 3.13, 'beam', 28); }
    function wallLamp(b, x, z, rot = 0) { b.box(x, 2.66, z, .38, .16, .10, 'darkMetal', rot); b.box(x, 2.65, z + .065, .27, .07, .04, 'lamp', rot); }
    function door(b, x, z, rot = 0, label = '封闭病区', number = 'RESTRICTED', locked = true) {
        // Local door coordinates are transformed for side-wall installation.
        const c = Math.cos(rot), s = Math.sin(rot), box = (xx, y, zz, w, h, d, m) => b.box(x + xx * c + zz * s, y, z - xx * s + zz * c, w, h, d, m, rot, false, 0);
        box(0, 1.42, 0, 1.62, 2.84, .18, 'darkMetal');
        box(0, 1.39, .102, 1.38, 2.64, .05, 'wood');
        box(0, 1.95, .142, .65, .56, .03, 'black');
        box(0, 1.94, .17, .59, .51, .009, 'glass');
        box(.48, 1.08, .21, .06, .25, .055, 'metal');
        box(0, .27, .151, 1.17, .27, .024, 'metal');
        const id = 'door-sign-' + Object.keys(b.materials).length;
        sign(b, id, [label], x + .18 * s, 3.05, z + .18 * c, 1.74, .36, rot, { small: number, size: 62, glow: false });
        for (let dx of [-.85, .85])
            box(dx, 1.45, .02, .09, 2.90, .26, 'metal');
        b.prop(x, z, 1.65, .20, label, 'door', rot);
    }
    function counter(b, x, z, w = 4, d = 1.1, rot = 0) { b.box(x, .61, z, w, 1.16, d, 'tile', rot, true, .7); b.box(x, 1.24, z, w + .12, .11, d + .14, 'wood', rot); b.box(x, .1, z, w + .04, .13, d + .04, 'darkMetal', rot); b.prop(x, z, w, d, '值班台', 'counter', rot); }
    function table(b, x, z, w = 1.8, d = .85, rot = 0) { b.box(x, .85, z, w, .10, d, 'wood', rot); const c = Math.cos(rot), s = Math.sin(rot); for (let xx of [-w / 2 + .08, w / 2 - .08])
        for (let zz of [-d / 2 + .08, d / 2 - .08])
            b.box(x + xx * c + zz * s, .43, z - xx * s + zz * c, .045, .82, .045, 'darkMetal'); b.colliders.push({ x, z, w: Math.abs(w * c) + Math.abs(d * s), d: Math.abs(d * c) + Math.abs(w * s) }); b.prop(x, z, w, d, '桌', 'table', rot); }
    function chair(b, x, z, rot = 0) { const c = Math.cos(rot), s = Math.sin(rot), bx = (xx, y, zz, w, h, d, m) => b.box(x + xx * c + zz * s, y, z - xx * s + zz * c, w, h, d, m, rot); bx(0, .47, 0, .56, .08, .58, 'darkMetal'); bx(0, .86, -.25, .57, .63, .08, 'darkMetal'); for (let xx of [-.22, .22])
        for (let zz of [-.23, .23])
            bx(xx, .23, zz, .035, .45, .035, 'metal'); b.prop(x, z, .65, .68, '椅', 'chair', rot); }
    function paper(b, id, text, x, y, z, rot = 0) { sign(b, id, text, x, y, z, .51, .67, rot, { paper: true, bg: '#c0b99b', fg: '#3a493b', small: 'SW–0117 / INTERNAL', size: 47 }); }
    function phone(b, x, y, z) { b.box(x, y, z, .47, .12, .29, 'black'); b.box(x - .17, y + .1, z - .055, .14, .12, .21, 'darkMetal'); b.box(x + .17, y + .1, z - .055, .14, .12, .21, 'darkMetal'); b.box(x, y + .15, z - .04, .36, .07, .085, 'darkMetal'); for (let j = 0; j < 3; j++)
        for (let i = 0; i < 3; i++)
            b.box(x - .075 + i * .06, y + .068, z + .02 + j * .05, .033, .008, .026, 'ivory'); for (let i = 0; i < 12; i++)
        b.tube([x + .26 + Math.sin(i * 2) * .03, y - .1 - i * .035, z], [x + .26 + Math.sin((i + 1) * 2) * .03, y - .1 - (i + 1) * .035, z], .008, 'black'); b.prop(x, z, .5, .3, '电话', 'phone'); }
    function clock(b, x, y, z, rot = 0) { const c = S.canvas(256), g = c.getContext('2d'); g.clearRect(0, 0, 256, 256); g.fillStyle = '#9da996'; g.beginPath(); g.arc(128, 128, 120, 0, PI * 2); g.fill(); g.strokeStyle = '#263d33'; g.lineWidth = 9; g.stroke(); for (let i = 0; i < 12; i++) {
        const a = i / 12 * 2 * PI;
        g.beginPath();
        g.moveTo(128 + Math.sin(a) * 97, 128 - Math.cos(a) * 97);
        g.lineTo(128 + Math.sin(a) * 109, 128 - Math.cos(a) * 109);
        g.lineWidth = 4;
        g.stroke();
    } g.beginPath(); g.moveTo(85, 66); g.lineTo(128, 128); g.lineTo(48, 154); g.lineWidth = 6; g.stroke(); b.material('clock', '#ffffff', { texture: c }); b.box(x, y, z, .63, .63, .04, 'clock', rot, false, 0); }
    function bed(b, x, z, rot = 0) { const c = Math.cos(rot), s = Math.sin(rot), bx = (xx, y, zz, w, h, d, m) => b.box(x + xx * c + zz * s, y, z - xx * s + zz * c, w, h, d, m, rot); bx(0, .44, 0, 1.25, .10, 2.3, 'darkMetal'); bx(0, .62, 0, 1.18, .24, 2.15, 'fabric'); bx(0, .78, -.74, .82, .16, .43, 'ivory'); bx(0, .762, .35, 1.19, .045, 1.25, 'fabric'); for (let dx of [-.63, .63])
        for (let dz of [-1.12, 1.12]) {
            bx(dx, .60, dz, .05, 1.02, .05, 'metal');
            bx(dx, .14, dz, .11, .10, .16, 'black');
        } for (let dz of [-1.12, 1.12]) {
        bx(0, 1.08, dz, 1.29, .05, .05, 'metal');
        for (let dx = -.48; dx < .55; dx += .24)
            bx(dx, .94, dz, .02, .25, .025, 'metal');
    } b.colliders.push({ x, z, w: Math.abs(1.35 * c) + Math.abs(2.4 * s), d: Math.abs(2.4 * c) + Math.abs(1.35 * s) }); b.prop(x, z, 1.35, 2.4, '病床', 'bed', rot); b.box(x, .012, z, 1.7, .007, 2.5, 'shadow', rot); }
    function ivStand(b, x, z) { b.tube([x, .12, z], [x, 2.05, z], .018, 'metal'); b.tube([x - .22, 1.93, z], [x + .22, 1.93, z], .013, 'metal'); for (let a of [0, 2.1, 4.2])
        b.tube([x, .14, z], [x + Math.cos(a) * .32, .10, z + Math.sin(a) * .32], .02, 'metal'); b.box(x + .15, 1.65, z, .16, .32, .07, 'glass'); b.tube([x + .15, 1.50, z], [x + .20, .85, z + .14], .009, 'ivory'); }
    function shelf(b, x, z, w = 2.5, rot = 0) { const c = Math.cos(rot), s = Math.sin(rot), bx = (xx, y, zz, ww, h, d, m) => b.box(x + xx * c + zz * s, y, z - xx * s + zz * c, ww, h, d, m, rot); for (let xx of [-w / 2, w / 2])
        bx(xx, 1.42, 0, .07, 2.84, .74, 'darkMetal'); for (let y of [.18, .82, 1.46, 2.10, 2.74])
        bx(0, y, 0, w, .06, .78, 'metal'); const r = S.rng(Math.round(x * 17 + z * 20 + 1000)); for (let y of [.49, 1.13, 1.77, 2.41])
        for (let xx = -w / 2 + .14; xx < w / 2 - .1; xx += .155) {
            const mat = ['book1', 'book2', 'book3', 'book4'][Math.floor(r() * 4)], h = .40 + r() * .12;
            bx(xx, y - .17 + h / 2, .035, .132, h, .54, mat);
            bx(xx, y - .09, .315, .075, .10, .005, 'paper');
        } b.colliders.push({ x, z, w: Math.abs(w * c) + Math.abs(.8 * s), d: Math.abs(.8 * c) + Math.abs(w * s) }); b.prop(x, z, w, .8, '病历架', 'shelf', rot); b.box(x, .009, z, w + .3, .005, 1.2, 'shadow', rot); }
    function locker(b, x, z, w = 1.1, h = 1.7, rot = 0) { b.box(x, h / 2, z, w, h, .64, 'darkMetal', rot, true); b.box(x, h / 2, z + .33, w - .09, h - .08, .025, 'metal', rot); for (let y = .55; y < h; y += .55) {
        b.box(x, y, z + .35, w - .1, .015, .01, 'darkMetal', rot);
        b.box(x + .27, y - .24, z + .39, .06, .17, .045, 'ivory', rot);
    } b.prop(x, z, w, .7, '柜', 'cabinet', rot); }
    function ghost(b, x, z) { b.ghost = [x, 0, z]; b.cylinder(x, .95, z, .35, .22, 1.50, 'ghost-coat', 20); b.sphere(x, 1.95, z, .20, .27, .19, 'ghost-face'); b.sphere(x, 2.04, z - .025, .22, .23, .20, 'ghost-hair'); b.box(x, 1.91, z + .176, .28, .20, .015, 'ghost-hair'); b.tube([x - .20, 1.63, z], [x - .35, .77, z + .07], .065, 'ghost-coat'); b.tube([x + .2, 1.63, z], [x + .34, .72, z + .08], .065, 'ghost-coat'); b.box(x - .12, .13, z, .11, .25, .22, 'ghost-hair'); b.box(x + .12, .13, z, .11, .25, .22, 'ghost-hair'); }
    function station() {
        const b = makeBase('station');
        ceilingLight(b, -.4, 0, 2.7);
        ceilingLight(b, 0, -5.5, 1.8);
        ceilingLight(b, 1.8, 5, 1.7, false);
        counter(b, -2, -2.6, 4.8, 1.05);
        counter(b, -4.35, -.9, 1.0, 2.45);
        chair(b, -2, -4.2);
        chair(b, -4, 2.8, .5);
        chair(b, -4.8, 2.7, -.15);
        sign(b, 'stationLarge', '护 士 站', -2, 2.9, -7.33, 3.7, .65, 0, { small: 'NURSES’ STATION / NIGHT DUTY', size: 70 });
        sign(b, 'notice', ['最 后 一 次 交 班', '月在前 · 日在后'], -4.9, 2, -7.31, 1.40, 1.11, 0, { paper: true, bg: '#b8b99a', fg: '#364a3d', small: 'NIGHT SHIFT / 0117', size: 43 });
        sign(b, 'calendar3', ['十一月', '03'], -2.75, 2.0, -7.30, .70, 1.0, 0, { paper: true, bg: '#d0c7a6', fg: '#6e4034', size: 61, small: '11 / 03 — 夜班' });
        clock(b, .4, 2.83, -7.28);
        door(b, 3.3, -7.3, 0, '07 号 病 房', 'WARD SEVEN');
        b.box(-1.1, .73, -2.045, 1.65, .59, .07, 'wood');
        b.box(-1.1, .88, -1.995, .35, .04, .09, 'metal');
        b.box(-.51, .76, -1.987, .17, .20, .03, 'darkMetal');
        phone(b, -.35, 1.35, -2.55);
        b.box(-2.8, 1.31, -2.7, .71, .025, .5, 'paper', .13, false, 0);
        b.box(-3.7, 1.47, -2.8, .40, .40, .10, 'darkMetal');
        b.box(-3.7, 1.45, -2.73, .34, .25, .015, 'glass');
        door(b, 5.83, -3.5, -PI / 2, '档 案 室', 'ARCHIVE');
        door(b, 5.83, 2, -PI / 2, '地 下 通 道', 'BASEMENT');
        b.tube([-5.8, 3.15, -7], [-5.8, 3.15, 7], .045, 'rust');
        b.tube([-5.8, 3.15, -4], [-5.8, .25, -4], .045, 'rust');
        b.hotspot('shift', '交班须知', [-4.9, 2.05, -7.15]);
        b.hotspot('calendar', '值班日历', [-2.75, 2.04, -7.12]);
        b.hotspot('drawer', '密码抽屉', [-1.1, .9, -1.86]);
        b.hotspot('phone', '旧电话', [-.35, 1.55, -2.55]);
        b.spawn = [.9, 1.65, 3.6];
        b.preview = [2.9, 1.8, 5.9];
        b.look = [-1.9, 1.55, -3.5];
        ghost(b, 3.2, -5.7);
        return b;
    }
    function ward() {
        const b = makeBase('ward');
        ceilingLight(b, -1.9, -1.2, 2.6);
        ceilingLight(b, 1.4, 4.7, 1.4, false);
        bed(b, -2.7, -1.9);
        bed(b, -2.7, -5.2);
        bed(b, 2.6, -5.2);
        bed(b, 2.6, -.9, .045);
        ivStand(b, -1.70, -2.7);
        ivStand(b, 3.6, -5.9);
        ivStand(b, 3.7, -1.6);
        // Window panes with deterministic rain streaks, not external photography.
        const c = S.canvas(), g = c.getContext('2d'), r = S.rng(392);
        g.fillStyle = '#233a4d';
        g.fillRect(0, 0, 512, 512);
        let gr = g.createLinearGradient(0, 0, 512, 512);
        gr.addColorStop(0, '#243a52');
        gr.addColorStop(.5, '#718a98');
        gr.addColorStop(1, '#172f41');
        g.fillStyle = gr;
        g.fillRect(0, 0, 512, 512);
        for (let i = 0; i < 500; i++) {
            let x = r() * 512, y = r() * 512;
            g.strokeStyle = `rgba(177,209,222,${r() * .25})`;
            g.lineWidth = r() * 1.5;
            g.beginPath();
            g.moveTo(x, y);
            g.lineTo(x - 2, y + 10 + r() * 40);
            g.stroke();
        }
        b.material('rain', '#ffffff', { texture: c, mode: 1, emissive: .12 });
        for (let z of [-4, 1.9]) {
            b.box(-5.83, 2.18, z, .05, 2.05, 2.5, 'darkMetal');
            b.box(-5.79, 2.18, z, .03, 1.85, 2.30, 'rain', 0, false, 0);
            b.box(-5.75, 2.18, z, .09, .065, 2.35, 'metal');
            b.box(-5.75, 2.18, z, .09, 1.90, .065, 'metal');
            b.box(-5.73, 1.18, z, .25, .08, 2.70, 'metal');
            for (let dz of [-1.6, 1.6]) {
                b.box(-5.70, 2.02, z + dz, .18, 2.3, .50, 'fabric');
                for (let q = 0; q < 5; q++)
                    b.box(-5.57, 2.02, z + dz - .20 + q * .1, .1, 2.3, .032, 'ivory');
            }
        }
        b.box(0, 3.2, -3.5, 10.8, .06, .04, 'metal');
        for (let x = -4.9; x < -4.2; x += .12)
            b.box(x, 2.12, -3.5, .07, 2.11, .055, 'fabric');
        sign(b, 'symbols', ['☾  2     ◉  4', '手  7     ☀  9'], 0, 2.09, -7.31, 2.3, 1.15, 0, { paper: true, bg: '#929e8e', fg: '#485449', small: '别擦掉。顺序在病历上。', size: 62 });
        sign(b, 'wardSign', '07 号 病 房', 0, 3.06, -7.30, 2.1, .39, 0, { small: 'OBSERVATION / DO NOT DISTURB', size: 60 });
        locker(b, 4.85, -4.85, .78, .9);
        b.box(4.85, .95, -4.85, .5, .02, .37, 'paper', .1, false, 0);
        paper(b, 'chartText', ['患 者 物 品', '月 · 眼 · 手 · 日'], 2.6, 1.02, -3.97);
        b.box(5.83, 2.04, 1, .055, 1.75, 1.12, 'metal');
        b.box(5.79, 2.04, 1, .012, 1.59, .96, 'glass');
        b.box(5.77, 2.08, 1, .008, 1.5, .92, 'darkMetal');
        // Pale cracks and a reflected shape make the mirror intentionally wrong.
        b.tube([5.747, 2.72, .59], [5.747, 2.18, 1.05], .007, 'ivory');
        b.tube([5.747, 2.18, 1.05], [5.747, 1.4, .73], .006, 'ivory');
        b.tube([5.747, 2.18, 1.05], [5.747, 2.3, 1.45], .004, 'ivory');
        door(b, 0, 7.3, PI, '护 士 站', 'RETURN / STATION');
        chair(b, .9, 2.8, -.5);
        b.box(4.5, .017, 3.5, .15, .025, .76, 'rust', .6);
        b.hotspot('symbols', '墙上涂画', [0, 2.05, -7.12]);
        b.hotspot('chart', '床尾记录', [2.6, 1.20, -3.78]);
        b.hotspot('locker', '床头柜锁', [4.85, .87, -4.43]);
        b.hotspot('mirror', '破裂的镜子', [5.60, 2.1, 1]);
        b.spawn = [.3, 1.65, 4.2];
        b.preview = [2, 1.78, 5.3];
        b.look = [-1.4, 1.25, -3.4];
        ghost(b, -2.7, -6.7);
        return b;
    }
    function archive() {
        const b = makeBase('archive');
        for (let [id, col] of [['book1', '#6a775c'], ['book2', '#937a52'], ['book3', '#4c6158'], ['book4', '#81786a']])
            b.material(id, '#ffffff', { texture: S.surface('paper', col, 19) });
        ceilingLight(b, 0, -.6, 1.9);
        ceilingLight(b, 0, -5.8, 1.25, false);
        for (let x of [-4.45, 4.45])
            for (let z of [-4.6, -.65, 3.25])
                shelf(b, x, z, 2.6, PI / 2);
        shelf(b, -1.8, -2.4, 2.35, PI / 2);
        shelf(b, 1.8, -2.4, 2.35, PI / 2);
        table(b, -1.75, 3.7, 2.2, 1.0);
        chair(b, -1.8, 5.0, PI);
        b.box(-1.8, .92, 3.7, .47, .07, .6, 'paper', -.13, false, 0);
        b.cylinder(-2.5, 1.30, 3.7, .06, .06, .68, 'darkMetal');
        b.cylinder(-2.5, 1.60, 3.7, .31, .10, .25, 'metal');
        b.cylinder(-2.5, 1.46, 3.7, .23, .23, .02, 'lamp');
        sign(b, 'rulesText', ['夜 间 归 档 须 知', '给药 → 采血 → 巡房 → 熄灯'], -2.05, 2.1, -7.31, 1.67, 1.13, 0, { paper: true, bg: '#c0b492', fg: '#544c34', size: 35, small: 'ARCHIVE / INTERNAL USE ONLY' });
        locker(b, 1.9, -6.79, 1.95, 2.4);
        b.box(1.90, 1.35, -6.41, .65, .61, .095, 'darkMetal');
        b.cylinder(1.90, 1.35, -6.30, .17, .17, .08, 'metal');
        sign(b, 'safeSign', '封 存 档 案', 1.9, 2.04, -6.4, 1.54, .31, 0, { bg: '#26392b', fg: '#b9c5a3', size: 52, small: 'SORT / CONFIRM' });
        sign(b, 'archiveTitle', '姓名已被涂去', -.2, 3.10, -7.28, 3.05, .45, 0, { bg: '#36382e', fg: '#b8af8e', small: 'RESTRICTED RECORDS / 1973', size: 62 });
        const c = S.canvas(512, 320), g = c.getContext('2d');
        g.fillStyle = '#918f72';
        g.fillRect(0, 0, 512, 320);
        g.fillStyle = '#414f43';
        g.fillRect(30, 25, 452, 260);
        g.fillStyle = '#768171';
        g.fillRect(37, 32, 438, 180);
        for (let i = 0; i < 7; i++) {
            let x = 64 + i * 62;
            g.fillStyle = '#283930';
            g.beginPath();
            g.arc(x, 128 + (i % 2) * 5, 18, 0, PI * 2);
            g.fill();
            g.fillRect(x - 18, 150, 36, 105);
        }
        g.fillStyle = '#a7aa8c';
        g.font = '20px serif';
        g.fillText('全 体 夜 班 人 员 · 合 影', 60, 306);
        b.material('photo', '#ffffff', { texture: c });
        b.box(-.95, 1.15, 3.53, .53, .40, .035, 'photo', -.12, false, 0);
        for (let x of [-5.75, 5.7])
            for (let z of [-5.8, 5.8]) {
                b.box(x, .3, z, .75, .59, .8, 'wood', 0, true);
                b.box(x, .61, z, .78, .06, .83, 'paper');
                b.prop(x, z, .8, .8, '封存箱', 'crate');
            }
        b.hotspot('rules', '归档须知', [-2.05, 2.12, -7.10]);
        b.hotspot('safe', '封存档案柜', [1.9, 1.48, -6.15]);
        b.hotspot('photo', '旧合影', [-.95, 1.37, 3.52]);
        b.spawn = [.45, 1.65, 5.0];
        b.preview = [.65, 1.85, 6.4];
        b.look = [0, 1.55, -4.8];
        ghost(b, 0, -6.4);
        return b;
    }
    function power() {
        const b = makeBase('power');
        b.lights[0].color = S.rgb('#c0b08e');
        b.lights[0].intensity = 4.7;
        b.lights[1].color = S.rgb('#dd6853');
        b.lights[1].intensity = 4.3;
        b.lights[2].color = S.rgb('#dc785b');
        b.lights[2].intensity = 2.7;
        ceilingLight(b, 0, .0, 2.0);
        ceilingLight(b, 0, 5.5, 1.3, false);
        for (let x of [-5.8, -5.4, -5.0]) {
            b.tube([x, 3.13, 7.5], [x, 3.13, -7.5], .09, 'rust', 14);
            b.tube([x, 3.13, -5.5], [x, .1, -5.5], .09, 'rust', 14);
            for (let z of [-6, -2, 2, 6])
                b.box(x, 3.15, z, .26, .29, .055, 'darkMetal');
        }
        for (let z of [-4.1, 0, 4.1]) {
            b.tube([5.8, .5, z], [5.8, 3.1, z], .20, 'rust', 18);
            b.tube([5.8, 2.8, z], [3.3, 2.8, z], .10, 'metal', 14);
        }
        // Four floor-standing switchgear units with louvers and pilot lamps.
        for (let x of [-2.7, -.95, .8, 2.55]) {
            b.box(x, 1.41, -6.92, 1.61, 2.82, .82, 'darkMetal', 0, true);
            b.box(x, 1.42, -6.495, 1.47, 2.65, .025, 'metal');
            for (let i = 0; i < 9; i++)
                b.box(x, 2.31 + i * .029, -6.472, 1.04, .012, .019, 'darkMetal');
            b.box(x + .55, 1.44, -6.44, .055, .28, .055, 'ivory');
            for (let i = 0; i < 3; i++)
                b.box(x - .39 + i * .29, 1.89, -6.444, .10, .10, .027, i ? 'lamp' : 'red');
            b.prop(x, -6.9, 1.6, .9, '配电柜', 'cabinet');
        }
        sign(b, 'mainPower', '应 急 配 电 系 统 · B', 0, 3.16, -7.7, 4.6, .45, 0, { small: 'EMERGENCY POWER / 220V', bg: '#343b30', fg: '#c4bd96', size: 58 });
        b.box(-1.0, 1.09, -6.43, .55, .6, .06, 'black');
        for (let i = 0; i < 3; i++) {
            b.box(-1, 1.27 - i * .15, -6.39, .37, .037, .045, 'ivory');
        }
        b.box(.85, 1.09, -6.43, 1.09, .77, .056, 'black');
        for (let r = 0; r < 3; r++)
            for (let c = 0; c < 3; c++) {
                const x = .51 + c * .34, y = 1.35 - r * .25;
                b.box(x, y, -6.38, .29, .20, .024, 'darkMetal');
                b.box(x, y, -6.36, .19, .025, .024, 'lamp');
                b.box(x + .08, y - .047, -6.36, .027, .11, .027, 'lamp');
            }
        sign(b, 'warningText', ['合 闸 须 知', '先装熔断器 · 再接通线路'], 4.73, 2.12, -7.74, 1.5, 1.22, 0, { paper: true, bg: '#b3a46d', fg: '#403c27', size: 38, small: 'WARNING / HIGH VOLTAGE' });
        // Generators, copper coils, wheel valves and rusted support cages.
        for (let z of [-2.9, 2.4]) {
            b.box(-4.15, .40, z, 2.12, .55, 2.0, 'darkMetal', 0, true);
            b.cylinder(-4.15, 1.16, z, .74, .74, 1.02, 'rust', 28);
            b.cylinder(-4.15, 1.73, z, .77, .77, .12, 'metal', 28);
            for (let i = 0; i < 12; i++) {
                let a = i / 12 * PI * 2;
                b.tube([-4.15 + Math.cos(a) * .76, .72, z + Math.sin(a) * .76], [-4.15 + Math.cos(a) * .76, 1.65, z + Math.sin(a) * .76], .025, 'metal');
            }
            b.prop(-4.15, z, 2.1, 2.0, '发电机', 'generator');
        }
        for (let z of [-3, 1, 5]) {
            b.box(4.4, .60, z, 1.45, 1.18, 1.8, 'darkMetal', 0, true);
            b.box(4.4, 1.22, z, 1.4, .045, 1.77, 'metal');
            b.prop(4.4, z, 1.5, 1.8, '设备', 'generator');
        }
        // Non-flashing red emergency fixtures.
        for (let z of [-4.8, 3.6]) {
            b.box(-6.31, 2.68, z, .10, .30, .28, 'darkMetal');
            b.box(-6.23, 2.68, z, .11, .16, .14, 'red');
        }
        for (let z of [-6.05, 5.8]) {
            for (let x = -5.5; x < 5.8; x += .75)
                b.box(x, .013, z, .45, .008, .14, 'paper', -.65);
        }
        b.hotspot('fuse', '熔断器槽', [-1, 1.25, -6.20]);
        b.hotspot('circuit', '线路面板', [.85, 1.3, -6.18]);
        b.hotspot('warning', '合闸须知', [4.73, 2.1, -7.52]);
        b.spawn = [0, 1.65, 4.8];
        b.preview = [1.4, 1.95, 6.15];
        b.look = [-.4, 1.42, -4.3];
        ghost(b, -2.1, -5.8);
        return b;
    }
    function exit() {
        const b = makeBase('exit');
        b.preview = [1.72, 1.72, 8.45];
        b.look = [-.15, 1.54, -10.8];
        b.spawn = [0, 1.65, 6.5];
        ceilingLight(b, 0, 6.8, 1.70);
        ceilingLight(b, 0, 1, 1.70);
        ceilingLight(b, 0, -4.8, 1.7);
        ceilingLight(b, 0, -10.1, 1.5, false);
        b.lights[0] = { pos: [0, 3.25, 0], color: S.rgb('#a2c6b1'), intensity: 4.6 };
        b.lights[1] = { pos: [0, 2.7, -8.8], color: S.rgb('#bce4b6'), intensity: 3.8 };
        b.lights[2] = { pos: [0, 2.7, 7.5], color: S.rgb('#97b9b5'), intensity: 3.0 };
        b.lights[3] = { pos: [0, 1.7, -11.3], color: S.rgb('#bbd9ad'), intensity: 1.6 };
        for (let z of [-7.5, -1, 5.5]) {
            door(b, -3.70, z, PI / 2, z === -1 ? '留 观 室' : '封 闭 病 区', z === -1 ? 'OBSERVATION' : 'NO ENTRY');
            door(b, 3.70, z, -PI / 2, z === -1 ? '更 衣 室' : '严 禁 入 内', 'AUTHORIZED ONLY');
        }
        // Structural frames make the corridor read as a real volume, not a single backdrop.
        for (let z of [-9, -3, 3, 9]) {
            for (let x of [-3.62, 3.62])
                b.box(x, 1.80, z, .19, 3.6, .23, 'metal');
            b.box(0, 3.50, z, 7.42, .16, .24, 'metal');
        }
        for (let x of [-3.73, 3.73])
            b.box(x, .96, 0, .14, .09, 23, 'wood');
        for (let x of [-.84, .84]) {
            b.box(x, 1.40, -11.69, 1.64, 2.79, .16, 'darkMetal');
            b.box(x, 1.39, -11.585, 1.48, 2.61, .05, 'metal');
            b.box(x, 1.94, -11.54, 1.15, .91, .035, 'black');
            b.box(x, 1.94, -11.50, 1.08, .84, .012, 'glass');
            b.box(x, .45, -11.54, 1.18, .41, .024, 'darkMetal');
            b.box(x + (x < 0 ? .51 : -.51), 1.07, -11.45, .045, .45, .09, 'ivory');
            b.box(x, 1.94, -11.47, .03, .91, .035, 'metal');
        }
        sign(b, 'exitSign', '安 全 出 口', 0, 3.02, -11.53, 2.0, .43, 0, { glow: true, bg: '#628565', fg: '#e7ecd1', small: 'EXIT / DISCHARGE', size: 61 });
        b.box(2.25, 1.60, -11.63, .49, .91, .17, 'darkMetal');
        b.box(2.25, 1.81, -11.524, .36, .19, .020, 'black');
        sign(b, 'screen', 'OFFLINE', 2.25, 1.82, -11.504, .34, .14, 0, { glow: true, bg: '#142d22', fg: '#b8c789', small: '', size: 70 });
        for (let r = 0; r < 4; r++)
            for (let c = 0; c < 3; c++)
                b.box(2.13 + c * .12, 1.59 - r * .12, -11.51, .08, .07, .03, 'metal');
        sign(b, 'map', ['疏 散 示 意', '护士站 → 病房 → 档案室', '配电室 → 离院大门'], -2.77, 1.99, -11.7, 1.20, 1.16, 0, { paper: true, bg: '#b6c1a3', fg: '#3b5641', small: 'EVACUATION PLAN', size: 35 });
        // Abandoned wheelchair, diagonally parked in the near corridor.
        const wx = -2.35, wz = 3.35;
        b.box(wx, .62, wz, .68, .10, .68, 'darkMetal');
        b.box(wx, 1.02, wz - .31, .68, .74, .08, 'fabric');
        for (let x of [wx - .45, wx + .45]) {
            b.tube([x, .5, wz - .24], [x, .5, wz + .24], .15, 'darkMetal');
            b.tube([x, 1.06, wz - .15], [x, 1.06, wz + .42], .03, 'metal');
            b.tube([x, .25, wz + .55], [x, .88, wz - .28], .025, 'metal');
        }
        b.colliders.push({ x: wx, z: wz, w: 1.04, d: 1.1 });
        b.prop(wx, wz, 1.1, 1.15, '轮椅', 'chair', .15);
        for (let z of [-10, -6, 0, 6, 10]) {
            b.box(-2.9, .013, z, .58, .009, .025, 'lamp');
            b.box(2.9, .013, z, .58, .009, .025, 'lamp');
        }
        b.hotspot('door', '离院大门', [0, 1.7, -11.26]);
        b.hotspot('gate', '门禁终端', [2.25, 1.74, -11.25]);
        b.hotspot('map', '疏散示意', [-2.77, 2.0, -11.48]);
        ghost(b, -.80, -8.3);
        return b;
    }
    const factories = { station, ward, archive, power, exit }, cache = {};
    S.getWorld = id => cache[id] || (cache[id] = factories[id]());
    S.worldIds = Object.keys(factories);
    S.getWorldCache = () => cache;
})();
