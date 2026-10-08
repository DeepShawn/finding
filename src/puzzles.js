'use strict';
/* All art, audio, puzzles and storage are local. No requests or third-party code. */
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const ICONS = {
    cross: '<path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z"/>',
    sound: '<path d="M3 9h4l5-4v14l-5-4H3zM16 8q5 4 0 8M19 4q9 8 0 16"/>',
    muted: '<path d="M3 9h4l5-4v14l-5-4H3zM16 9l6 6m0-6-6 6"/>',
    pause: '<path d="M7 5h3v14H7zM15 5h3v14h-3z"/>',
    play: '<path d="M7 4l13 8-13 8z"/>',
    book: '<path d="M12 5Q7 2 2 5v15q5-3 10 0 5-3 10 0V5q-5-3-10 0zM12 5v15M5 8h4M15 8h4M5 12h4M15 12h4"/>',
    hint: '<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 1 1 4 2.8q-1 .6-1 2.2M12 17h.01"/>',
    flashlight: '<path d="M8 9h8l-1 12H9zM6 4h12v5H6zM9 1v1M15 1v1M4 1l1 2M20 1l-1 2M10 13h4"/>',
    arrow: '<path d="M4 12h16M14 6l6 6-6 6"/>',
    key: '<circle cx="7" cy="8" r="4"/><path d="m10 11 10 10m-5-5 3-3m0 6 3-3"/>',
    fuse: '<path d="M8 3h8v4H8zM8 17h8v4H8zM9 7h6v10H9zM12 8l-2 3 4 2-2 3"/>',
    paper: '<path d="M5 2h10l4 4v16H5zM14 2v5h5M8 11h8M8 15h8M8 18h5"/>',
    moon: '<path d="M18.5 16.5A9 9 0 0 1 8 3a9 9 0 1 0 10.5 13.5z"/>',
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    hand: '<path d="M8 12V5a1.5 1.5 0 0 1 3 0v5-7a1.5 1.5 0 0 1 3 0v7-5a1.5 1.5 0 0 1 3 0v6-3a1.5 1.5 0 0 1 3 0v7q0 7-7 7c-4 0-6-4-9-7-2-3 0-5 2-3l2 2z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 1v3m0 16v3M1 12h3m16 0h3M4.2 4.2l2.2 2.2m11.2 11.2 2.2 2.2M4.2 19.8l2.2-2.2M17.6 6.4l2.2-2.2"/>',
    lock: '<rect x="5" y="10" width="14" height="11" rx="1"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    quote: '<path d="M4 8h6v7H4v-4q0-6 5-7M14 8h6v7h-6v-4q0-6 5-7"/>',
    exit: '<path d="M13 3H4v18h9M10 12h12M17 7l5 5-5 5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>'
};
function icon(name, cls = 'icon') { return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ICONS.paper}</svg>`; }
function fillIcons(root = document) { $$('[data-icon]', root).forEach(e => { e.innerHTML = icon(e.dataset.icon); }); }
function svgSymbol(name, x, y, size = 24, color = '#b5c4a4') { return `<g transform="translate(${x},${y}) scale(${size / 24})" fill="none" stroke="${color}" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</g>`; }
/* Procedural, resolution-independent environmental illustrations. */
function makeScene(room, hero = false) {
    if (window.CampaignArt && window.CampaignArt.has(room)) return window.CampaignArt.scene(room);
    const p = (typeof state !== 'undefined' && state && state.solved.power) || false;
    const id = hero ? 'hero' : `scene-${room}`;
    let s = `<svg class="scene-svg" viewBox="0 0 1000 620" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="${id}-wall" x2="0" y2="1"><stop stop-color="#2b3d3b"/><stop offset="1" stop-color="#142727"/></linearGradient><linearGradient id="${id}-floor" x2="0" y2="1"><stop stop-color="#20312e"/><stop offset="1" stop-color="#0b1718"/></linearGradient><linearGradient id="${id}-door" x2="1" y2=".2"><stop stop-color="#1b302d"/><stop offset=".5" stop-color="#3c5249"/><stop offset="1" stop-color="#1b2d2c"/></linearGradient><radialGradient id="${id}-light"><stop stop-color="#b7c79c" stop-opacity="${p ? .25 : .14}"/><stop offset="1" stop-color="#a6b893" stop-opacity="0"/></radialGradient><radialGradient id="${id}-dark"><stop offset=".5" stop-color="#030908" stop-opacity="0"/><stop offset="1" stop-color="#030908" stop-opacity=".74"/></radialGradient><pattern id="${id}-tile" width="90" height="65" patternUnits="userSpaceOnUse"><rect width="90" height="65" fill="none" stroke="#668073" stroke-opacity=".13"/></pattern><filter id="${id}-blur"><feGaussianBlur stdDeviation="7"/></filter></defs>`;
    s += `<rect width="1000" height="620" fill="url(#${id}-wall)"/><path d="M0 0H1000L918 70H90Z" fill="#101c1d"/><path d="M0 66H1000M0 75H1000" stroke="#607064" stroke-opacity=".35"/><path d="M0 310H1000V448H0Z" fill="#2d4238"/><path d="M0 310H1000V448H0Z" fill="url(#${id}-tile)"/><path d="M0 309H1000M0 316H1000" stroke="#728170" stroke-opacity=".26"/><path d="M0 442H1000V620H0Z" fill="url(#${id}-floor)"/><path d="M0 447H1000" stroke="#06120f" stroke-width="9"/>`;
    for (let i = -4; i < 10; i++)
        s += `<path d="M${500 + (i - 3) * 52} 444L${500 + (i - 3) * 220} 620" stroke="#627461" stroke-opacity=".14"/>`;
    [471, 516, 579].forEach(y => s += `<path d="M0 ${y}H1000" stroke="#627461" stroke-opacity=".16"/>`);
    s += `<path d="M157 77l-9 52 20 31-7 48m8-48 16-5M741 78l10 18-9 13 12 40M91 315l16 15-5 38" fill="none" stroke="#0a1918" stroke-width="2"/><path d="M0 108q65 27 50 176v163H0Z" fill="#0c1c1b" opacity=".3"/><rect x="397" y="34" width="206" height="8" rx="2" fill="#b5c19b" opacity=".72"/><ellipse cx="501" cy="240" rx="355" ry="270" fill="url(#${id}-light)"/>`;
    if (room === 'station') {
        s += `<rect x="85" y="100" width="223" height="202" fill="#172421" stroke="#645f45" stroke-width="8"/><rect x="99" y="115" width="197" height="173" fill="#465044"/><g transform="rotate(-4 183 175)"><rect x="112" y="129" width="97" height="123" fill="#a8af93"/><path d="M126 150h66M126 160h62M126 170h48M126 189h61M126 200h52M126 211h66M126 231h31" stroke="#525f49" stroke-width="2"/><circle cx="160" cy="133" r="3" fill="#775e47"/></g><rect x="222" y="135" width="59" height="62" fill="#84947c" transform="rotate(6 230 150)"/><path d="M229 149h42m-42 10h30m-30 10h40" stroke="#4c604c" stroke-width="2"/><path d="M230 222l27-4 14 20-32 12Z" fill="#ab9c7a"/><rect x="383" y="101" width="130" height="165" fill="#b0b299"/><path d="M383 102h130v35H383Z" fill="#684f42"/><text x="448" y="126" fill="#d4ceb2" font-size="15" text-anchor="middle" font-family="serif">十一月</text><text x="448" y="207" fill="#394b3b" font-size="62" text-anchor="middle" font-family="serif">3</text><ellipse cx="448" cy="185" rx="39" ry="36" fill="none" stroke="#835340" stroke-width="3" transform="rotate(-12 448 185)"/><text x="448" y="247" fill="#64715a" font-size="12" text-anchor="middle">夜班</text><rect x="556" y="105" width="163" height="238" fill="#0c201e" stroke="#526757" stroke-width="7"/><rect x="575" y="124" width="125" height="163" fill="#1c3530"/><path d="M575 170h125m-125 55h125m-64-101v163" stroke="#586c59" stroke-width="3"/><text x="638" y="150" text-anchor="middle" fill="#79917a" font-size="16" letter-spacing="4">护士站</text><circle cx="825" cy="128" r="42" fill="#0d201c" stroke="#75836d" stroke-width="4"/><circle cx="825" cy="128" r="34" fill="#b4b79b"/><path d="M825 100v28l-17 16" stroke="#394837" stroke-width="3"/><circle cx="825" cy="128" r="3" fill="#3d4a34"/><rect x="267" y="371" width="659" height="164" fill="#243a32" stroke="#52634d" stroke-width="2"/><path d="M265 356h665v32H265Z" fill="#59664f"/><path d="M267 388h659" stroke="#0d1e18" stroke-width="7"/><path d="M293 407h207v105H293Z" fill="#304337" stroke="#637357"/><path d="M560 407h236v107H560Z" fill="#354636" stroke="#7e8866"/><rect x="647" y="439" width="62" height="9" rx="3" fill="#0f251b" stroke="#748365"/><rect x="723" y="451" width="34" height="29" fill="#182b21" stroke="#6d7e5e"/><g fill="#8f9c76">${[0, 1, 2, 3].map(i => `<circle cx="${730 + i * 6}" cy="464" r="1.5"/>`).join('')}</g><rect x="815" y="403" width="84" height="112" fill="#1e332c" stroke="#52644d"/><path d="M333 356l12-15h127l-10 15" fill="#a2ab8e"/><path d="M366 346h80" stroke="#556a52"/><path d="M795 354l11-28h80l16 28Z" fill="#112a24" stroke="#4a6350" stroke-width="2"/><path d="M807 326q-8-21 36-22 44-1 45 18l-20 8-4-8h-35l-1 10Z" fill="#182e25" stroke="#61745a" stroke-width="3"/><path d="M891 340q29-18 28 19t-17 27" fill="none" stroke="#0a1a16" stroke-width="3"/><path d="M177 476v80m-30-6h58M129 449v-70q0-18 48-18t48 18v70Z" fill="#172a24" stroke="#415b46" stroke-width="4"/><path d="M126 447h101v26H126Z" fill="#273b2f"/><path d="M951 88v355" stroke="#0a1817" stroke-width="13"/>`;
    }
    else if (room === 'ward') {
        s += `<rect x="70" y="115" width="165" height="264" fill="#11241f" stroke="#5c6b56" stroke-width="7"/><path d="M83 128h139v237H83Z" fill="#475f51"/><path d="M100 148l100 197m-85-219 89 175" stroke="#78917a" stroke-opacity=".15" stroke-width="9"/><path d="M165 145l-16 68 28 51-17 49m-11-100-31 15m59 36 29-10" fill="none" stroke="#b1b79c" stroke-opacity=".55"/><rect x="286" y="108" width="279" height="167" fill="#162d24" stroke="#697655" stroke-width="5"/><rect x="299" y="120" width="253" height="141" fill="#536a4f"/>`;
        [['moon', 2, 322], ['hand', 7, 383], ['sun', 9, 444], ['eye', 4, 505]].forEach(([n, d, x]) => { s += svgSymbol(n, x, 145, 30, '#b5bf91') + `<text x="${x + 15}" y="221" text-anchor="middle" fill="#c0c49d" font-size="25" font-family="serif">${d}</text>`; });
        s += `<text x="425" y="249" text-anchor="middle" fill="#b4be91" font-size="10" letter-spacing="6">记 住 它 们</text><path d="M641 95v302m-31 0h63M641 104h43v20" fill="none" stroke="#77866c" stroke-width="5"/><path d="M668 124h31v60q-15 16-31 0Z" fill="#94ad8d" fill-opacity=".33" stroke="#8b9d7c"/><path d="M684 191v122q0 28-50 54" fill="none" stroke="#9eaf89" stroke-opacity=".5" stroke-width="2"/><rect x="785" y="112" width="147" height="357" fill="#314637" stroke="#728066" stroke-width="3"/><rect x="797" y="128" width="124" height="324" fill="#2b4031" stroke="#617553"/><path d="M813 151h88m-88 9h88m-88 9h88M813 402h88m-88 9h88" stroke="#12271e" stroke-width="4"/><path d="M814 265v53" stroke="#95a17c" stroke-width="5"/><rect x="833" y="272" width="58" height="28" fill="#152c20" stroke="#75815c"/><text x="862" y="291" text-anchor="middle" fill="#879873" font-size="13" letter-spacing="4">····</text><path d="M241 418l151-68h283l74 68-47 44H267Z" fill="#a2aa8a"/><path d="M242 418l28 39h431l47-38-245-10Z" fill="#7b8d6e"/><path d="M363 371q134-45 289 2l62 49-258 5Z" fill="#a3ad8c"/><path d="M456 383q43 7 37 29m-14-30q39 9 49 32m-24-27 22 28M627 388l42 31" stroke="#6c8062" stroke-width="3" fill="none" opacity=".7"/><path d="M246 478V377q0-18 20-18h50v97M699 490V359q0-14 13-14h30v123M247 453h492M269 400v54M296 389v65M718 380v73" fill="none" stroke="#71856a" stroke-width="7"/><path d="M240 492h505" stroke="#0c1d17" stroke-width="9"/><rect x="664" y="313" width="87" height="118" fill="#253c2a" stroke="#637f53"/><rect x="678" y="304" width="61" height="76" fill="#aab494" transform="rotate(5 709 342)"/><path d="M688 320h35m-35 10h30m-30 10h36m-36 10h25" stroke="#687957"/><text x="114" y="102" fill="#95a788" font-size="19" letter-spacing="5">病房 07</text><path d="M96 502l25 14 15-9 17 7" stroke="#344a36" fill="none" stroke-width="4"/>`;
    }
    else if (room === 'archive') {
        s += `<rect x="63" y="104" width="498" height="346" fill="#101f1a" stroke="#4d6147" stroke-width="8"/>`;
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 20; c++) {
                let x = 77 + c * 23, y = 125 + r * 103, h = 69 + (c * 7 + r * 11) % 20;
                let colors = ['#3e5140', '#586345', '#665f42', '#334c3a', '#6b6e4f'];
                s += `<rect x="${x}" y="${y + 88 - h}" width="19" height="${h}" fill="${colors[(c + r) % 5]}"/><rect x="${x + 5}" y="${y + 92 - h}" width="9" height="13" fill="#9f9f79" opacity=".35"/><path d="M${x + 4} ${y + 70}h11" stroke="#9b9e75" stroke-opacity=".4"/>`;
            }
            s += `<rect x="66" y="${218 + r * 103}" width="490" height="9" fill="#59674a"/>`;
        }
        s += `<rect x="182" y="141" width="264" height="182" fill="#151f18" transform="rotate(-3 310 230)"/><rect x="171" y="129" width="264" height="182" fill="#aaa88a" transform="rotate(-3 303 220)"/><text x="301" y="167" fill="#47523a" font-size="21" font-family="serif" text-anchor="middle" letter-spacing="5">夜间归档须知</text><path d="M194 185h212m-203 17h183m-188 17h167m-171 17h198m-187 17h169m-177 17h186" stroke="#606d4c" stroke-width="2"/><rect x="642" y="174" width="291" height="316" fill="#283d2c" stroke="#738062" stroke-width="5"/><rect x="659" y="193" width="254" height="272" fill="#354831" stroke="#77835f" stroke-width="2"/><rect x="678" y="215" width="215" height="59" fill="#1a2e20" stroke="#596d45"/><text x="785" y="241" text-anchor="middle" fill="#afb68b" font-size="17" font-family="serif" letter-spacing="8">封存档案</text><text x="786" y="260" text-anchor="middle" fill="#728659" font-size="9" font-family="monospace" letter-spacing="3">SORT / CONFIRM</text><circle cx="809" cy="359" r="41" fill="#1d3321" stroke="#768764" stroke-width="6"/><circle cx="809" cy="359" r="24" fill="#536347" stroke="#899375" stroke-width="3"/><path d="M809 335v48m-24-24h48" stroke="#1f3320" stroke-width="6"/><path d="M688 333v63" stroke="#a5ad86" stroke-width="8"/><path d="M107 434h472v31H107Z" fill="#596248"/><path d="M122 465v109m437-109v109" stroke="#2b3d29" stroke-width="20"/><path d="M142 431l55-16 120 7-26 13" fill="#949e78"/><rect x="420" y="349" width="97" height="81" fill="#6f7054" stroke="#bbb895" stroke-width="5" transform="rotate(8 468 390)"/><rect x="433" y="359" width="69" height="53" fill="#8c9575"/><path d="M438 408v-20q6-17 12-1v21m4 0v-24q8-18 15 0v24m5 0v-20q7-17 14 0v20" fill="#3c513b"/><path d="M964 81v371" stroke="#0b1c16" stroke-width="10"/><path d="M43 82q10 95-12 205" fill="none" stroke="#173325" stroke-width="6"/>`;
    }
    else if (room === 'power') {
        s += `<path d="M53 77v316h90V80M915 77v344H728" fill="none" stroke="#10231a" stroke-width="17"/><path d="M54 77v316h90V80M915 77v344H728" fill="none" stroke="#526543" stroke-width="9"/><rect x="168" y="109" width="491" height="373" fill="#1a2b21" stroke="#768263" stroke-width="6"/><path d="M187 130h453v329H187Z" fill="#344631" stroke="#607451"/><rect x="204" y="146" width="418" height="37" fill="#172d1d"/><text x="410" y="171" text-anchor="middle" fill="#a8b690" font-size="17" letter-spacing="6">应急配电系统 · B</text><rect x="372" y="212" width="245" height="228" fill="#15291b" stroke="#778765" stroke-width="2"/>`;
        for (let r = 0; r < 3; r++)
            for (let c = 0; c < 3; c++) {
                let x = 385 + c * 75, y = 225 + r * 67;
                s += `<rect x="${x}" y="${y}" width="67" height="59" fill="${p ? '#3d5634' : '#293e28'}" stroke="#607552"/><path d="M${x + 5} ${y + 30}h28v${(c + r) % 2 ? '-' : '+'}20" fill="none" stroke="${p ? '#b8d69a' : '#748767'}" stroke-width="5"/>`;
            }
        s += `<rect x="221" y="222" width="107" height="67" fill="#142b1d" stroke="#617650"/><path d="M238 268a37 37 0 0 1 75 0" fill="none" stroke="#91a276" stroke-width="2"/><path d="M275 267l${p ? '21-25' : '-22-20'}" stroke="#c3bd8c" stroke-width="2"/><text x="276" y="282" text-anchor="middle" fill="#889d6c" font-size="10" font-family="monospace">${p ? '220 V' : '0 V'}</text><rect x="237" y="312" width="72" height="98" fill="#152a1a" stroke="#849169"/><path d="M254 326h37v13h-37zM254 383h37v13h-37z" fill="#9f9d75"/>`;
        if (state?.solved.fuse)
            s += `<rect x="260" y="339" width="25" height="44" fill="#91ac79" fill-opacity=".45" stroke="#a8b981"/><path d="M273 341l-7 13 13 13-6 13" stroke="#bdc68e" fill="none" stroke-width="2"/>`;
        else
            s += `<path d="M260 342l23 37m0-37-23 37" stroke="#725d43" stroke-width="2"/>`;
        s += `<text x="276" y="428" text-anchor="middle" fill="#adb68a" font-size="10">FUSE / 缺一不可</text><rect x="730" y="174" width="176" height="199" fill="#a2a17b" stroke="#606a43" stroke-width="3"/><path d="M817 199l34 56h-68Z" fill="none" stroke="#4e5935" stroke-width="4"/><path d="M820 213l-13 20h13l-9 17" fill="none" stroke="#4e5935" stroke-width="3"/><text x="818" y="281" text-anchor="middle" fill="#495632" font-size="20" font-family="serif" letter-spacing="4">合闸须知</text><path d="M748 302h140m-140 13h136m-132 13h129m-121 13h109" stroke="#646e46" stroke-width="2"/><rect x="395" y="91" width="35" height="9" fill="${p ? '#c0dc9b' : '#a98162'}"/><path d="M350 483v39h156v-39" fill="none" stroke="#5a6c44" stroke-width="10"/><path d="M91 443l102 66-19 14-91-69Z" fill="#625d37" opacity=".5"/>`;
    }
    else {
        s += `<path d="M0 0l303 93v362L0 620Z" fill="#223932"/><path d="M1000 0L697 93v362l303 165Z" fill="#21362e"/><path d="M0 0h1000L697 93H303Z" fill="#111f1c"/><path d="M0 316l303-30v169L0 620Z" fill="#2d4538"/><path d="M1000 316l-303-30v169l303 165Z" fill="#2c4133"/><path d="M0 315l303-29m697 29-303-29" stroke="#849075" stroke-opacity=".45" stroke-width="3"/><path d="M303 93h394v363H303Z" fill="#10241a" stroke="#5b7055" stroke-width="4"/><rect x="328" y="121" width="346" height="362" fill="url(#${id}-door)" stroke="#74815e" stroke-width="5"/><path d="M501 121v363" stroke="#0d2015" stroke-width="7"/><rect x="345" y="144" width="136" height="144" fill="#091d13" stroke="#607552" stroke-width="5"/><rect x="522" y="144" width="136" height="144" fill="#0b1e15" stroke="#607552" stroke-width="5"/><path d="M348 176h131m45 0h130M413 147v138m177-138v138" stroke="#304c30" stroke-width="4"/><path d="M354 164l77 109m-21-116 56 73M533 163l77 109m-20-114 56 68" stroke="#869977" stroke-opacity=".1" stroke-width="12"/><path d="M477 328v58m48-58v58" stroke="#9da886" stroke-width="8"/><path d="M342 425h143v28H342ZM518 425h143v28H518Z" fill="#213e26" stroke="#617756"/><rect x="433" y="79" width="134" height="26" rx="2" fill="${p ? '#8ca778' : '#4b6950'}"/><text x="500" y="98" fill="${p ? '#162c1d' : '#c1d1ac'}" font-size="14" letter-spacing="5" text-anchor="middle" font-family="sans-serif">安全出口</text><rect x="749" y="225" width="95" height="166" fill="#1a2d20" stroke="#687b57" stroke-width="4"/><rect x="761" y="239" width="71" height="31" fill="#091c13"/><text x="797" y="259" fill="${p ? '#bed09b' : '#825f4a'}" text-anchor="middle" font-family="monospace" font-size="10">${p ? (state?.solved.exit ? 'OPEN' : 'READY') : 'OFFLINE'}</text>`;
        for (let r = 0; r < 4; r++)
            for (let c = 0; c < 3; c++)
                s += `<rect x="${762 + c * 24}" y="${284 + r * 23}" width="17" height="16" fill="#5c6b4b"/>`;
        s += `<path d="M67 170l160 32v126L67 347Z" fill="#536e4b" stroke="#83916c" stroke-width="5"/><path d="M85 191l120 23v93L85 321Z" fill="#acb38c"/><path d="M103 216l54 6v71l30-5m-79-56 25 3v59m0-27 23-2" fill="none" stroke="#58744c" stroke-width="5"/><text x="144" y="208" fill="#59704a" font-size="10" transform="rotate(10 144 208)" text-anchor="middle">疏散示意</text><path d="M287 90v370m425-370v370" stroke="#06190f" stroke-width="8"/><path d="M198 65l17 3v363m567-366-15 3v363" stroke="#506b4d" stroke-width="4"/><path d="M0 546l327-117m673 117L673 429" fill="none" stroke="#78936a" stroke-opacity=".16" stroke-width="4"/><path d="M372 498l46-21h166l53 21-25 8H397Z" fill="${p ? '#87a17330' : '#88a17412'}"/><path d="M481 441h37v28h-37Z" fill="#111f15"/>`;
    }
    // Dust, wall scratches, static vignetting. Deliberately no flashing effects.
    for (let i = 0; i < 46; i++) {
        let x = (i * 137 + 31) % 990, y = (i * 79 + 54) % 555;
        s += `<circle cx="${x}" cy="${y}" r="${i % 3 === 0 ? 1.3 : .7}" fill="#c9cfb3" opacity="${.08 + (i % 4) * .025}"/>`;
    }
    s += `<ellipse cx="500" cy="235" rx="450" ry="300" fill="url(#${id}-light)"/><rect width="1000" height="620" fill="url(#${id}-dark)"/><path d="M0 616H1000" stroke="#788570" stroke-opacity=".12"/></svg>`;
    return s;
}
const STORAGE = 'silent-ward-active-v3';
const PREFS = 'silent-ward-prefs-v1';
let storageOK = true;
function readLocal(k) { try {
    return JSON.parse(localStorage.getItem(k) || 'null');
}
catch (e) {
    return null;
} }
function writeLocal(k, v) { try {
    localStorage.setItem(k, JSON.stringify(v));
    return true;
}
catch (e) {
    storageOK = false;
    return false;
} }
let preferences = { sound: true, scares: true, ...(readLocal(PREFS) || {}) };
let saved = readLocal(STORAGE) || readLocal('silent-ward-save-v1');
if (saved && (saved.version !== 1 || !saved.solved || !Array.isArray(saved.inventory) || !Number.isFinite(saved.remaining)))
    saved = null;
let state = null, phase = 'title', paused = false, selectedMode = 'challenge', flashlightOn = true;
let activeModal = null, modalReturnFocus = null, lastTick = performance.now(), lastSave = 0, lastTimerText = '', scareTimeout;
const ROOMS = {
    station: { name: '护士站', en: 'NURSES’ STATION', cam: '01', desc: '消毒水的气味还在。桌上的电话，似乎刚刚被人放下。', hotspots: [['shift', '交班须知', 20, 37], ['calendar', '值班日历', 45, 30], ['drawer', '密码抽屉', 65, 75], ['phone', '旧电话', 84, 52]] },
    ward: { name: '07号病房', en: 'WARD SEVEN', cam: '02', desc: '床单微微凹陷。可你确定，这里没有人。', hotspots: [['symbols', '墙上涂画', 43, 31], ['chart', '床尾记录', 66, 57], ['locker', '床头柜锁', 85, 52], ['mirror', '破裂的镜子', 16, 43]] },
    archive: { name: '档案室', en: 'RECORDS ARCHIVE', cam: '03', desc: '纸张被整齐归档。有些姓名，却被反复涂掉。', hotspots: [['rules', '归档须知', 30, 33], ['safe', '封存档案柜', 77, 59], ['photo', '旧合影', 45, 69]] },
    power: { name: '配电室', en: 'EMERGENCY POWER', cam: '04', desc: '电流声从墙里传来，像有人在低声数着什么。', hotspots: [['fuse', '熔断器槽', 27, 58], ['circuit', '线路面板', 51, 41], ['warning', '合闸须知', 82, 43]] },
    exit: { name: '正门', en: 'DISCHARGE EXIT', cam: '05', desc: '门的另一边，应该就是清晨。至少，图纸上是这样写的。', hotspots: [['door', '离院大门', 50, 58], ['gate', '门禁终端', 80, 49], ['map', '疏散示意', 16, 39]] }
};
const ITEM_DATA = {
    wardKey: { name: '病房钥匙', icon: 'key', desc: '标签上写着「07」。黄铜已经发黑，钥匙齿却没有灰尘。', room: 'ward' },
    archiveKey: { name: '档案室钥匙', icon: 'key', desc: '一把细长的铜钥匙。绑在上面的纸签只写了两个字：档案。', room: 'archive' },
    fuse: { name: '备用熔断器', icon: 'fuse', desc: '封存档案柜中的备用熔断器。能装入配电室的空槽，之后还需要接通线路。', room: 'power' },
    permit: { name: '离院凭证', icon: 'paper', desc: '一张没有姓名的离院凭证。背面排列着四个熟悉的符号。', room: 'exit' }
};
const NOTES = {
    shift: { title: '交班须知', location: '护士站', text: '交班抽屉按「当班日期」登记：月在前，日在后，各占两位。值班日期在墙上的日历。' },
    calendar: { title: '当班日期', location: '护士站', text: '日历停在 11 月 03 日。3 号被红笔圈起，下面写着「夜班」。' },
    symbols: { title: '涂画中的数字', location: '07号病房', text: '四个图案下各有一个数字：月亮 = 2，眼睛 = 4，手掌 = 7，太阳 = 9。' },
    chart: { title: '床尾记录', location: '07号病房', text: '床头柜的排列顺序：月亮 → 眼睛 → 手掌 → 太阳。将墙上对应的数字按这个顺序填入。' },
    rules: { title: '夜间归档规则', location: '档案室', text: '给药先于采血；采血之后才巡房；巡房结束方可熄灯。四份记录需要按先后顺序放入档案柜。' },
    permit: { title: '离院凭证 · 背面', location: '封存档案柜', text: '门禁顺序：眼睛 → 月亮 → 太阳 → 手掌。图案旁写着「答案仍在七号病房的墙上」。' },
    warning: { title: '应急供电说明', location: '配电室', text: '先安装备用熔断器，再旋转线路面板上的导线。绿色 IN 在左上角左侧，橙色 OUT 在右下角右侧；将它们连成完整线路，不能留下断开的接头。' },
    phone: { title: '证词 01 · 被抹去的姓名', location: '护士站 · 旧电话', text: '录音转写：「院长让我们擦掉他们的名字。可昨晚的查房单上，那些名字又出现了。有人必须把这件事带出去。」' },
    mirror: { title: '证词 02 · 镜框背后', location: '07号病房 · 镜子', text: '镜框后的一页病历：「他们不是自愿留下。离院申请被锁进了档案室。我要记住每个人的名字。」' },
    photo: { title: '证词 03 · 合影背面', location: '档案室 · 合影', text: '合影背面：「所有失踪者，都在这张照片里。带走三份证词，让这里不再只有沉默。」' }
};
const STAGES = [
    { key: 'drawer', title: '打开值班抽屉', desc: '检查护士站里的交班须知与日历，找到四位密码。', hints: ['抽屉需要四位数字。日期比墙上的时钟更有用。', '月份放前两位，日期放后两位；日历上的 3 号被圈了起来。', '直接答案：11 月 03 日 → 1103。'] },
    { key: 'locker', title: '解开病房柜锁', desc: '用钥匙进入 07 号病房，结合墙上图案与床尾记录。', hints: ['用抽屉里的钥匙打开 07 号病房。墙上的涂画和床尾记录是一组线索。', '先查图案对应的数字，再按「月亮、眼睛、手掌、太阳」排列。', '直接答案：月亮 2、眼睛 4、手掌 7、太阳 9 → 2479。'] },
    { key: 'safe', title: '整理封存档案', desc: '进入档案室，按夜班事件的先后顺序归档。', hints: ['病房柜里有档案室钥匙。进入后，先读墙上的归档须知。', '把三条先后关系接在一起：给药比采血早，巡房比采血晚，熄灯最后。', '直接答案：给药 → 采血 → 巡房 → 熄灯。'] },
    { key: 'power', title: '恢复门禁供电', desc: '装入备用熔断器，旋转导线接通 IN 与 OUT。', hints: ['将档案柜中的熔断器装入配电室的空槽，然后检查线路面板。', '导线要走蛇形：第一行向右，第二行向左，第三行再向右。', '初始状态下，编号 1、2、4、5、7、8、9 各旋转 1 次；3、6 各旋转 2 次。若已转动过，可先点「重置线路」。'] },
    { key: 'exit', title: '打开离院大门', desc: '读离院凭证上的新排列顺序，输入门禁密码。', hints: ['电源恢复后，正门终端才能工作。检查随身物品里的离院凭证。', '这次的顺序与病房柜不同：眼睛 → 月亮 → 太阳 → 手掌。', '直接答案：4、2、9、7 → 4297。认证通过后，推开大门离开。'] }
];
const INITIAL_ROT = [1, 1, 0, 0, 1, 1, 3, 1, 1];
const WIRE_TYPES = ['I', 'I', 'L', 'L', 'I', 'L', 'L', 'I', 'I'];
// Directions: N=0 E=1 S=2 W=3. A straight starts E/W, a corner N/E.
function newState(mode) { if (window.Campaign && Campaign.selected !== 'hospital') return Campaign.createState(mode); return { version: 1, chapter: 'hospital', mode, room: 'station', remaining: 720, elapsed: 0, inventory: [], notes: [], evidence: [], solved: { drawer: false, wardDoor: false, locker: false, archiveDoor: false, safe: false, fuse: false, power: false, exit: false }, circuits: [...INITIAL_ROT], archiveOrder: [], hintLevels: {}, stats: { wrong: 0, hints: 0 }, warned90: false }; }
function currentStage() { if (window.Depth?.enabled()) return Depth.objective(); if (window.Campaign && state?.chapter !== 'hospital' && STAGES.every(v => state.solved[v.key])) return Campaign.doneStage(); return STAGES.find(v => !state.solved[v.key]) || { key: 'done', title: '推开大门，离开这里', desc: '门禁已经解锁。收齐三份证词还能揭开另一种结局。', hints: ['点击正门场景中央的「离院大门」，推开门完成逃生。'] }; }
function completed() { return STAGES.filter(v => state.solved[v.key]).length; }
function has(id) { return !!state?.inventory.includes(id); }
function addItem(id) { if (!has(id)) {
    state.inventory.push(id);
    toast(`获得物品：${ITEM_DATA[id].name}`);
} }
function consume(id) { state.inventory = state.inventory.filter(x => x !== id); }
function addNote(id) { if (!state.notes.includes(id)) {
    state.notes.push(id);
    renderPanel();
    saveGame();
} }
function addEvidence(id) { addNote(id); if (!state.evidence.includes(id)) {
    state.evidence.push(id);
    audio.chime();
    toast(`找到遗失的证词（${state.evidence.length}/3）`);
    renderPanel();
    saveGame();
} }
function saveGame() { if (!state || phase !== 'playing')
    return; writeLocal(STORAGE, state); saved = JSON.parse(JSON.stringify(state)); window.Campaign?.save(state); $('#saveLabel').textContent = storageOK ? '进度已自动保存' : '本地存储不可用 · 请勿关闭页面'; }
function clearSave() { window.Campaign?.clearRun(); try {
    localStorage.removeItem(STORAGE);
}
catch (e) { } saved = null; }
function formatTime(seconds) { const n = Math.max(0, Math.ceil(seconds)); return `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`; }
function toast(text) { const node = document.createElement('div'); node.className = 'toast'; node.textContent = text; $('#toastRegion').append(node); setTimeout(() => { node.classList.add('out'); setTimeout(() => node.remove(), 300); }, 3100); if ($('#toastRegion').children.length > 3)
    $('#toastRegion').firstElementChild.remove(); }
/* Web Audio: low-volume ambience is created only after a user gesture. */
const audio = { ctx: null, master: null, ambience: null, ready: false,
    init() {
        if (this.ready) {
            this.resume();
            return;
        }
        try {
            const AC = window.AudioContext || window.webkitAudioContext;
            if (!AC)
                return;
            this.ctx = new AC();
            this.master = this.ctx.createGain();
            this.master.gain.value = 0;
            this.master.connect(this.ctx.destination);
            this.ambience = this.ctx.createGain();
            this.ambience.gain.value = .09;
            this.ambience.connect(this.master);
            const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 4, this.ctx.sampleRate), data = buffer.getChannelData(0);
            let b = 0;
            for (let i = 0; i < data.length; i++) {
                b = (b + (Math.random() * 2 - 1) * .018) / 1.025;
                data[i] = b;
            }
            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;
            noise.loop = true;
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 280;
            noise.connect(filter);
            filter.connect(this.ambience);
            noise.start();
            [43, 65].forEach((freq, i) => { const o = this.ctx.createOscillator(), g = this.ctx.createGain(); o.type = 'sine'; o.frequency.value = freq; g.gain.value = i ? .045 : .07; o.connect(g); g.connect(this.ambience); o.start(); });
            this.ready = true;
            this.resume();
        }
        catch (e) {
            this.ready = false;
        }
    },
    resume() { if (!this.ctx)
        return; this.ctx.resume().catch(() => { }); this.sync(); },
    sync() { if (!this.ctx)
        return; const on = preferences.sound && phase === 'playing' && !paused; this.master.gain.cancelScheduledValues(this.ctx.currentTime); this.master.gain.setTargetAtTime(on ? .65 : 0, this.ctx.currentTime, .15); },
    tone(f, d = .12, type = 'sine', vol = .025, end = null) { if (!this.ready || !preferences.sound || paused)
        return; try {
        const t = this.ctx.currentTime, o = this.ctx.createOscillator(), g = this.ctx.createGain();
        o.type = type;
        o.frequency.setValueAtTime(f, t);
        if (end)
            o.frequency.exponentialRampToValueAtTime(end, t + d);
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(vol, t + .015);
        g.gain.exponentialRampToValueAtTime(.0001, t + d);
        o.connect(g);
        g.connect(this.master);
        o.start(t);
        o.stop(t + d + .02);
    }
    catch (e) { } },
    click() { this.tone(510, .055, 'sine', .024, 330); }, chime() { this.tone(440, .4, 'sine', .037, 660); setTimeout(() => this.tone(660, .45, 'sine', .028, 880), 110); }, error() { this.tone(105, .3, 'triangle', .03, 70); }, scare() { this.tone(98, 1.6, 'sine', .075, 39); }
};
function syncPrefs() { ['Sound', 'Scares'].forEach(n => { const e = $('#start' + n); if (e)
    e.checked = preferences[n.toLowerCase()]; }); $$('[data-action="sound"]').forEach(b => { b.setAttribute('aria-pressed', String(preferences.sound)); b.setAttribute('aria-label', preferences.sound ? '关闭声音' : '开启声音'); const i = $('[data-icon]', b); if (i) {
    i.dataset.icon = preferences.sound ? 'sound' : 'muted';
    i.innerHTML = icon(i.dataset.icon);
} const l = $('.sound-label', b); if (l)
    l.textContent = preferences.sound ? '声音开' : '声音关'; }); audio.sync(); writeLocal(PREFS, preferences); }
function setPref(name, value) { preferences[name] = value; if (name === 'sound' && value && phase === 'playing')
    audio.init(); if (name === 'scares' && !value) {
    $('#apparition').classList.remove('visible');
    clearTimeout(scareTimeout);
} syncPrefs(); }
function scare(text) { window.dispatchEvent(new CustomEvent('ward:scare', { detail: text })); if (!preferences.scares || phase !== 'playing' || paused)
    return; $('#apparitionText').textContent = text; $('#apparition').classList.add('visible'); audio.scare(); clearTimeout(scareTimeout); scareTimeout = setTimeout(() => $('#apparition').classList.remove('visible'), 2100); }
function renderPanel() {
    if (!state)
        return;
    const stage = currentStage(), count = completed();
    $('#progressIndex').textContent = `${String(count).padStart(2, '0')} / 05`;
    $('#objectiveTitle').textContent = stage.title;
    $('#objectiveText').textContent = stage.desc;
    $('#mobileObjective').innerHTML = `<b>${String(count).padStart(2, '0')}/05</b> ${stage.title}`;
    $('#steps').innerHTML = STAGES.map((v, i) => `<div class="step ${state.solved[v.key] ? 'complete' : stage.key === v.key ? 'current' : ''}"><span class="step-num">${state.solved[v.key] ? '✓' : String(i + 1).padStart(2, '0')}</span><span>${v.title}</span></div>`).join('');
    $('#inventoryCount').textContent = `${String(state.inventory.length).padStart(2, '0')} ITEMS`;
    $('#inventory').innerHTML = state.inventory.map(id => `<button class="inventory-slot" data-action="item" data-id="${id}" aria-label="查看${ITEM_DATA[id].name}">${icon(ITEM_DATA[id].icon)}<span>${ITEM_DATA[id].name}</span></button>`).join('') + Array.from({ length: Math.max(0, 3 - state.inventory.length) }, () => '<div class="inventory-slot empty" aria-hidden="true">＋</div>').join('');
    $('#notebookCount').textContent = state.notes.length ? `已收录 ${String(state.notes.length).padStart(2, '0')} 条线索` : '尚未发现线索';
    $('#evidenceDots').innerHTML = [0, 1, 2].map(i => `<i class="${i < state.evidence.length ? 'found' : ''}"></i>`).join('');
    $('#evidenceDots').setAttribute('aria-label', `已找到${state.evidence.length}份证词，共3份`);
    $('#powerStatus').textContent = state.chapter && state.chapter !== 'hospital' ? `${window.Campaign?.current().name} · 已完成 ${count}/5` : state.solved.power ? '门禁供电已恢复' : '备用照明运行中';
}
function isSeen(id) { if (id.startsWith('cx_')) return window.Campaign?.seen(id) || false; const map = { drawer: 'drawer', locker: 'locker', safe: 'safe', fuse: 'fuse', circuit: 'power', gate: 'exit', door: 'exit' }; return map[id] ? state.solved[map[id]] : state.notes.includes(id); }
function renderScene() {
    const room = ROOMS[state.room];
    $('#roomTitle').textContent = room.name;
    $('#roomEyebrow').textContent = `${room.cam} / ${room.en}`;
    $('#camLabel').textContent = `CAM ${room.cam} / LIVE`;
    $('#roomDescription').textContent = room.desc;
    $('#roomNav').innerHTML = Object.entries(ROOMS).filter(([id]) => !window.Campaign || Campaign.roomIds().includes(id)).map(([id, r]) => `<button class="room-tab ${id === state.room ? 'active' : ''}" data-action="go" data-room="${id}" ${id === state.room ? 'aria-current="location"' : ''}><span class="n">${r.cam}</span><span>${r.name}</span>${((id === 'ward' && !state.solved.wardDoor) || (id === 'archive' && !state.solved.archiveDoor) || (window.Campaign && !Campaign.canEnter(id))) ? icon('lock', 'lock') : ''}</button>`).join('');
    $('#sceneArt').innerHTML = makeScene(state.room); document.body.dataset.chapter = state.chapter || 'hospital'; $('#sceneCoords').textContent = window.Campaign?.current().en || 'EAST WING — 1F';
    $('#hotspots').innerHTML = room.hotspots.map(([id, label, x, y]) => `<button class="hotspot ${isSeen(id) ? 'done' : ''}" data-action="inspect" data-id="${id}" style="left:${x}%;top:${y}%" aria-label="检查${label}"><span class="target">${isSeen(id) ? '✓' : '+'}</span><span>${label}</span></button>`).join('');
    renderPanel();
    fillIcons($('#gameScreen'));
    syncPrefs();
    updateTimer();
    window.dispatchEvent(new CustomEvent('ward:scene'));
}
function startGame(mode, resume = false) { window.Campaign?.prepare(resume); closeModal(true); state = resume ? JSON.parse(JSON.stringify(saved)) : newState(mode); if (!state)
    return; window.Depth?.prepareState(state, resume); phase = 'playing'; paused = false; lastTick = performance.now(); lastSave = lastTick; lastTimerText = ''; $('#startScreen').hidden = true; $('#endingScreen').hidden = true; $('#gameScreen').hidden = false; renderScene(); audio.init(); audio.sync(); saveGame(); window.scrollTo(0, 0); toast(resume ? '已载入值班记录。计时从离开处继续。' : (window.Campaign?.intro() || '值班开始。先检查护士站的日历与交班须知。')); }
function goRoom(id) {
    if (!ROOMS[id] || phase !== 'playing' || paused || (window.Campaign && !Campaign.roomIds().includes(id)))
        return;
    if (window.Depth?.enabled() && !Depth.canEnter(id)) { Depth.locked(id); return; }
    if (window.Campaign && !Campaign.canEnter(id)) { Campaign.locked(id); return; }
    if (id === 'ward' && !state.solved.wardDoor) {
        openLockedRoom('ward', 'wardKey', '07 号病房', 'wardDoor');
        return;
    }
    if (id === 'archive' && !state.solved.archiveDoor) {
        openLockedRoom('archive', 'archiveKey', '档案室', 'archiveDoor');
        return;
    }
    closeModal(true);
    state.room = id;
    renderScene();
    audio.click();
    saveGame();
}
function openLockedRoom(room, item, title, flag) { openModal(title, `<div class="item-hero">${icon('lock')}</div><p style="text-align:center">门锁仍然完好。${has(item) ? `你找到了能够打开它的${ITEM_DATA[item].name}。` : `需要${ITEM_DATA[item].name}。${room === 'ward' ? '先调查护士站的值班抽屉。' : '先解开 07 号病房的柜锁。'}`}</p>${has(item) ? `<button class="btn primary wide" data-action="unlock-room" data-room="${room}" data-item="${item}" data-flag="${flag}">使用钥匙开门 ${icon('arrow')}</button>` : '<button class="btn ghost wide" data-action="close">返回调查</button>'}`, 'LOCKED / 通道封闭'); }
function unlockRoom(room, item, flag) { if (!has(item))
    return; consume(item); state.solved[flag] = true; goRoom(room); audio.chime(); if (room === 'ward')
    setTimeout(() => scare('你确定，刚才没有人吗？'), 650); }
function openModal(title, body, eyebrow = 'CASE FILE / 0117', large = false, type = 'note') { if ($('#modalBackdrop').hidden) {
    modalReturnFocus = document.activeElement;
} window.dispatchEvent(new CustomEvent('ward:modal')); activeModal = type; $('#modalTitle').textContent = title; $('#modalEyebrow').textContent = eyebrow; $('#modalBody').innerHTML = body; $('#modal').classList.toggle('large', large); $('#modalBackdrop').hidden = false; document.body.style.overflow = 'hidden'; $('#modal').scrollTop = 0; requestAnimationFrame(() => $('.modal-close').focus({ preventScroll: true })); }
function closeModal(force = false) { if (activeModal === 'pause' && !force) {
    resumeGame();
    return;
} $('#modalBackdrop').hidden = true; document.body.style.overflow = ''; activeModal = null; if (modalReturnFocus?.isConnected)
    modalReturnFocus.focus({ preventScroll: true }); modalReturnFocus = null; }
function doc(title, content, tag = 'WARD / INTERNAL', bottom = 'SW–0117 · 本文件已加入线索本') { return `<article class="document"><div class="doc-top">${tag}</div><h3>${title}</h3>${content}<div class="doc-bottom">${bottom}</div></article>`; }
function noteFooter() { return `<p class="note-added">${icon('check')}线索已记入线索本，可随时回看。</p><button class="btn ghost wide" data-action="close">继续调查</button>`; }
function flow(names, paper = false) { return `<div class="symbol-flow ${paper ? 'paper-symbols' : ''}" aria-label="${names.map(n => ({ moon: '月亮', eye: '眼睛', hand: '手掌', sun: '太阳' }[n])).join('，')}">${names.map((n, i) => (i ? '<span>→</span>' : '') + icon(n)).join('')}</div>`; }
function inspect(id) {
    if (id.startsWith('cx_')) { window.Campaign?.inspect(id); return; }
    audio.click();
    switch (id) {
        case 'shift':
            addNote('shift');
            openModal('交班须知', doc('最后一次交班', '<p>一、交班抽屉按<strong>当班日期</strong>登记。<br>月在前，日在后，<strong>各占两位</strong>。</p><p>二、备用熔断器移交档案室保管。<br>断电后，先恢复供电，再核验离院凭证。</p><p class="handwritten">零点关院。不要等电话再响一次。</p><span class="stamp">内部留存</span>', 'NIGHT SHIFT / 交班须知') + noteFooter(), 'CLUE 01 / 护士站');
            break;
        case 'calendar':
            addNote('calendar');
            openModal('停在这一天', doc('当班日期', `<div class="calendar"><div class="calendar-head">11 <small>月</small></div><div class="calendar-grid">${Array.from({ length: 30 }, (_, i) => `<span class="${i === 2 ? 'circle' : ''}">${i + 1}</span>`).join('')}</div></div><p style="text-align:center">红笔标记：<strong>11 月 03 日 · 夜班</strong></p>`, 'DUTY CALENDAR / 当班日历') + noteFooter(), 'CLUE 02 / 护士站');
            break;
        case 'drawer':
            if (!state.solved.drawer)
                openKeypad('drawer');
            else
                openModal('已经打开的抽屉', '<p>抽屉已经空了。07 号病房的钥匙已被你取走。</p><button class="btn primary wide" data-action="go" data-room="ward">前往 07 号病房</button>', 'SEARCHED / 已调查');
            break;
        case 'phone':
            addEvidence('phone');
            openModal('没人接听的电话', doc('录音转写 · 01', '<p class="handwritten">「院长让我们擦掉他们的名字。可昨晚的查房单上，那些名字又出现了。」</p><p class="handwritten">「有人必须把这件事带出去。」</p><span class="stamp">证词 01 / 03</span>', 'RECOVERED TESTIMONY / 遗失的证词') + noteFooter(), 'HIDDEN FILE / 护士站');
            break;
        case 'symbols':
            addNote('symbols');
            openModal('墙上的涂画', `<p>不像孩子随手画的。每个图案下面，都刻着一个数字。</p><div class="symbol-row">${[['moon', 2, '月亮'], ['hand', 7, '手掌'], ['sun', 9, '太阳'], ['eye', 4, '眼睛']].map(([n, d, l]) => `<div class="symbol-tile">${icon(n)}<b>${d}</b><small>${l}</small></div>`).join('')}</div><p style="text-align:center" class="small">「顺序在病历上，答案在墙上。」</p>` + noteFooter(), 'CLUE 03 / 07 号病房');
            break;
        case 'chart':
            addNote('chart');
            openModal('床尾记录', doc('患者物品保管单', `<p>柜锁按以下图案的数字排列：</p>${flow(['moon', 'eye', 'hand', 'sun'], true)}<p style="text-align:center">月亮 → 眼睛 → 手掌 → 太阳</p><p class="handwritten">墙上那些画，不要擦掉。</p>`, 'WARD 07 / 床头柜密码提示') + noteFooter(), 'CLUE 04 / 07 号病房');
            break;
        case 'locker':
            if (!state.solved.locker)
                openKeypad('locker');
            else
                openModal('床头柜已打开', '<p>柜里只剩下一圈钥匙压出的灰印。档案室的钥匙已被你拿走。</p><button class="btn primary wide" data-action="go" data-room="archive">前往档案室</button>', 'SEARCHED / 已调查');
            break;
        case 'mirror':
            addEvidence('mirror');
            openModal('镜框背后的病历', doc('未寄出的离院申请', '<p class="handwritten">「他们不是自愿留下。离院申请被锁进了档案室。」</p><p class="handwritten">「我要记住每个人的名字。」</p><span class="stamp">证词 02 / 03</span>', 'RECOVERED TESTIMONY / 遗失的证词') + noteFooter(), 'HIDDEN FILE / 07 号病房');
            break;
        case 'rules':
            addNote('rules');
            openModal('夜间归档须知', doc('请按流程归档', '<p>① <strong>给药</strong>先于<strong>采血</strong>。<br>② <strong>采血</strong>之后才<strong>巡房</strong>。<br>③ <strong>巡房</strong>结束方可<strong>熄灯</strong>。</p><p>将四份记录按先后顺序放入柜中，再按「确认归档」。</p><span class="stamp">顺序不得颠倒</span>', 'ARCHIVE / 夜间操作规则') + noteFooter(), 'CLUE 05 / 档案室');
            break;
        case 'safe':
            if (!state.solved.safe)
                openArchive();
            else
                openModal('封存已解除', '<p>备用熔断器和离院凭证已经取出。离院凭证背面，写着门禁所需的顺序。</p><div class="btn-row"><button class="btn" data-action="item" data-id="permit">查看离院凭证</button><button class="btn primary" data-action="go" data-room="power">前往配电室</button></div>', 'SEARCHED / 已调查');
            break;
        case 'photo':
            addEvidence('photo');
            openModal('合影中的失踪者', doc('合影背面的字迹', '<p class="handwritten">「所有失踪者，都在这张照片里。」</p><p class="handwritten">「带走三份证词，让这里不再只有沉默。」</p><p>照片上的人穿着不同年代的衣服，却站在同一扇离院大门前。</p><span class="stamp">证词 03 / 03</span>', 'RECOVERED TESTIMONY / 遗失的证词') + noteFooter(), 'HIDDEN FILE / 档案室');
            break;
        case 'fuse':
            openFuse();
            break;
        case 'circuit':
            if (!state.solved.fuse)
                openModal('电路没有响应', '<p>熔断器槽是空的。先找到备用熔断器，装入面板左侧的空槽。</p><button class="btn primary wide" data-action="inspect" data-id="fuse">检查熔断器槽</button>', 'POWER / 缺少必要部件');
            else if (state.solved.power)
                openModal('供电稳定', '<p>电路已经接通。门禁终端恢复运行，离院通道就在正门。</p><button class="btn primary wide" data-action="go" data-room="exit">前往正门</button>', 'POWER RESTORED');
            else
                openCircuit();
            break;
        case 'warning':
            addNote('warning');
            openModal('合闸须知', doc('应急供电说明', '<p>一、安装合适的备用熔断器。</p><p>二、旋转导线，连接<strong>左上方 IN</strong> 与<strong>右下方 OUT</strong>。中途不可断开，不能留下悬空的接头。</p><p>三、检查无误后，按「合闸检测」。</p><span class="stamp">请勿带电拆卸</span>', 'ENGINEERING / 操作说明') + noteFooter(), 'CLUE / 配电室');
            break;
        case 'gate':
            if (!state.solved.power)
                openModal('门禁离线', `<div class="item-hero">${icon('lock')}</div><p style="text-align:center">屏幕显示：<span class="mono" style="color:var(--accent)">OFFLINE</span><br>门禁需要配电室恢复供电，才能读取离院编号。</p><button class="btn primary wide" data-action="go" data-room="power">前往配电室</button>`, 'EXIT / 无法认证');
            else if (!state.solved.exit)
                openKeypad('exit');
            else
                openExitDoor();
            break;
        case 'door':
            openExitDoor();
            break;
        case 'map':
            openModal('离院路线', doc('紧急疏散示意', '<p><strong>护士站 → 07 号病房 → 档案室</strong><br>寻找钥匙、备用熔断器和离院凭证。</p><p><strong>配电室 → 正门</strong><br>恢复门禁供电，使用离院编号开门。</p><p class="handwritten">你还可以带走三份证词。它们不会阻止你离开，却能改变被留下的故事。</p>', 'EVACUATION / 离院指引', 'SW–0117 · 路线仅供值班人员查阅') + '<button class="btn ghost wide" data-action="close">继续调查</button>', 'EXIT / 疏散示意');
            break;
    }
    renderPanel();
    saveGame();
}
const CODES = { drawer: { title: '值班抽屉', code: '1103', desc: '一把四位密码锁。旁边贴着褪色的字：「按当班日期登记」。', eyebrow: 'LOCK 01 / 日期机关' }, locker: { title: '病房柜锁', code: '2479', desc: '四个输入位。床尾记录上的图案，应该就是输入的顺序。', eyebrow: 'LOCK 02 / 图案机关' }, exit: { title: '离院门禁', code: '4297', desc: '电源稳定。请输入离院凭证所对应的四位数字。', eyebrow: 'LOCK 05 / 离院认证' } };
function openKeypad(type) { const cfg = CODES[type]; openModal(cfg.title, `<p class="puzzle-intro">${cfg.desc}</p><form id="codeForm" data-type="${type}"><div class="keypad-wrap"><label class="small muted" for="codeInput" style="display:block;margin-bottom:8px">四位数字密码</label><input class="code-display" id="codeInput" type="text" inputmode="numeric" autocomplete="off" autocapitalize="off" spellcheck="false" maxlength="4" pattern="[0-9]{4}" placeholder="----" aria-label="四位数字密码"><div class="keypad">${[1, 2, 3, 4, 5, 6, 7, 8, 9, '清空', 0, '⌫'].map(n => `<button type="button" class="${typeof n === 'string' ? 'utility' : ''}" data-action="digit" data-digit="${n}" aria-label="${n === '⌫' ? '删除一位' : n}">${n}</button>`).join('')}</div><button class="btn primary wide" type="submit">${type === 'exit' ? '确认离院编号' : '确认密码'} ${icon('arrow')}</button><div class="feedback" id="puzzleFeedback" role="status">${state.mode === 'challenge' ? `错误提交扣除 ${window.Depth?.wrongCost()||10} 秒；位数不足不扣时。` : '探索模式不扣时间，可以反复尝试。'}</div></div></form><div class="rule"></div><button class="btn ghost wide small" data-action="journal">查看线索本 ${icon('book')}</button>`, cfg.eyebrow, false, 'keypad'); }
function digit(value) { const input = $('#codeInput'); if (!input)
    return; if (value === '清空')
    input.value = '';
else if (value === '⌫')
    input.value = input.value.slice(0, -1);
else if (input.value.length < 4)
    input.value += value; audio.click(); }
function feedback(text, error = false) { const e = $('#puzzleFeedback'); if (!e)
    return; e.textContent = text; e.classList.toggle('error', error); if (error) {
    const m = $('#modal');
    m.classList.remove('shake');
    void m.offsetWidth;
    m.classList.add('shake');
} }
function penalty() { if (window.Depth?.enabled()) return Depth.penalty(); state.stats.wrong++; if (state.mode === 'challenge')
    state.remaining = Math.max(0, state.remaining - 10); audio.error(); updateTimer(); saveGame(); if (state.mode === 'challenge' && state.remaining <= 0) {
    finish(false);
    return false;
} return true; }
function submitCode(type) { if (window.Depth && !Depth.allowBase(type)) return;
    const value = $('#codeInput')?.value.replace(/\D/g, '') || '';
    if (value.length !== 4) {
        feedback('请输入完整的四位数字。', true);
        return;
    }
    if (value !== CODES[type].code) {
        if (penalty()) {
            feedback(`锁芯没有转动。顺序可能不对。${state.mode === 'challenge' ? ' −' + (window.Depth?.wrongCost() || 10) + ' 秒' : ''}`, true);
            $('#codeInput').value = '';
        }
        return;
    }
    state.solved[type] = true;
    audio.chime();
    if (type === 'drawer') {
        addItem('wardKey');
        openModal('抽屉打开了', `<div class="item-hero">${icon('key')}</div><p>抽屉里只有一把钥匙，纸签上写着「07 号病房」。<br>走廊深处，传来了一声床架的轻响。</p><button class="btn primary wide" data-action="go" data-room="ward">前往 07 号病房 ${icon('arrow')}</button>`, 'PUZZLE 01 / 05 · 已完成');
    }
    else if (type === 'locker') {
        addItem('archiveKey');
        openModal('一把通往过去的钥匙', `<div class="item-hero">${icon('key')}</div><p>一把细长的铜钥匙躺在柜里。纸签：「档案室」。<br>柜门背面刻着：<span style="color:var(--green)">他们的记录还在。</span></p><button class="btn primary wide" data-action="go" data-room="archive">前往档案室 ${icon('arrow')}</button>`, 'PUZZLE 02 / 05 · 已完成');
    }
    else {
        openModal('门禁认证通过', `<div class="item-hero">${icon('exit')}</div><p style="text-align:center">锁舌缩回。离院大门已经打开。<br>${state.evidence.length === 3 ? '三份证词都在你手里。该让真相离开这所病院了。' : `你找到了 ${state.evidence.length}/3 份证词。现在可以离开，也可以返回寻找剩余记录。`}</p><div class="btn-row"><button class="btn ghost" data-action="close">继续调查</button><button class="btn primary" data-action="escape">推开大门 ${icon('exit')}</button></div>`, 'PUZZLE 05 / 05 · 离院许可');
    }
    renderScene();
    saveGame();
}
function openItem(id) {
    if (!has(id)) {
        toast('这个物品已使用，或尚未找到。');
        return;
    }
    const item = ITEM_DATA[id];
    if (id === 'permit') {
        addNote('permit');
        openModal('离院凭证', doc('门禁认证顺序', `<p>请将下列图案转换成四位数字：</p>${flow(['eye', 'moon', 'sun', 'hand'], true)}<p style="text-align:center">眼睛 → 月亮 → 太阳 → 手掌</p><p class="handwritten">答案仍在七号病房的墙上。</p><span class="stamp">供电后生效</span>`, 'DISCHARGE PERMIT / 无姓名') + `<button class="btn primary wide" data-action="go" data-room="exit">前往正门 ${icon('arrow')}</button>`, 'INVENTORY / 离院凭证');
    }
    else
        openModal(item.name, `<div class="item-hero">${icon(item.icon)}</div><p>${item.desc}</p><button class="btn primary wide" data-action="go" data-room="${item.room}">前往${ROOMS[item.room].name} ${icon('arrow')}</button>`, 'INVENTORY / 随身物品');
}
const FILES = { blood: { label: '采血', id: 'B–17' }, lights: { label: '熄灯', id: 'D–09' }, medicine: { label: '给药', id: 'A–04' }, rounds: { label: '巡房', id: 'C–22' } };
const FILE_ORDER = ['medicine', 'blood', 'rounds', 'lights'];
function archiveBody() { return `<p>点击下方记录，按事件的先后顺序填入四个位置。点击已填的记录可撤回。</p><div class="file-slots">${[0, 1, 2, 3].map((_, i) => { const f = state.archiveOrder[i]; return `<button class="file-slot ${f ? 'filled' : ''}" data-action="remove-file" data-index="${i}" aria-label="${f ? '移除' + FILES[f].label : '第' + (i + 1) + '个位置'}"><small>0${i + 1}</small><span>${f ? FILES[f].label : '待归档'}</span></button>`; }).join('')}</div><div class="file-cards">${Object.entries(FILES).map(([id, f]) => `<button class="file-card ${state.archiveOrder.includes(id) ? 'used' : ''}" data-action="add-file" data-id="${id}" ${state.archiveOrder.includes(id) ? 'disabled' : ''}><small>RECORD</small><b>${f.label}</b><small>${f.id}</small></button>`).join('')}</div><button class="btn primary wide" data-action="check-archive">确认归档 ${icon('arrow')}</button><div class="feedback" id="puzzleFeedback" role="status">${state.mode === 'challenge' ? '顺序错误扣除 ' + (window.Depth?.wrongCost() || 10) + ' 秒。' : '选择错误不会扣除时间。'}</div><div class="btn-row"><button class="btn small ghost" data-action="reset-archive">清空排列</button><button class="btn small ghost" data-action="inspect" data-id="rules">查看归档须知</button></div>`; }
function openArchive() { openModal('封存档案柜', archiveBody(), 'LOCK 03 / 夜间归档', false, 'archive'); }
function renderArchive() { const focused = document.activeElement; const action = focused?.dataset.action, id = focused?.dataset.id; $('#modalBody').innerHTML = archiveBody(); if (action && id) {
    $(`[data-action="${action}"][data-id="${id}"]`)?.focus({ preventScroll: true });
} }
function addFile(id) { if (state.archiveOrder.length >= 4 || state.archiveOrder.includes(id) || !FILES[id])
    return; state.archiveOrder.push(id); audio.click(); renderArchive(); saveGame(); }
function removeFile(i) { state.archiveOrder.splice(i, 1); renderArchive(); saveGame(); }
function checkArchive() { if (window.Depth && !Depth.allowBase("safe")) return; if (state.archiveOrder.length < 4) {
    feedback('请先放入全部四份记录。', true);
    return;
} if (state.archiveOrder.join() !== FILE_ORDER.join()) {
    if (penalty())
        feedback(`归档顺序不正确。${state.mode === 'challenge' ? ' −' + (window.Depth?.wrongCost() || 10) + ' 秒' : ''}`, true);
    return;
} state.solved.safe = true; addItem('fuse'); addItem('permit'); addNote('permit'); audio.chime(); openModal('封存档案已开启', `<div style="display:flex;gap:15px;justify-content:center"><div class="item-hero" style="margin:4px 0 20px">${icon('fuse')}</div><div class="item-hero" style="margin:4px 0 20px">${icon('paper')}</div></div><p>档案柜里藏着一枚<strong>备用熔断器</strong>和一张<strong>离院凭证</strong>。<br>凭证背面，是一组新的图案顺序。它已记入线索本。</p><div class="btn-row"><button class="btn ghost" data-action="item" data-id="permit">查看凭证</button><button class="btn primary" data-action="go" data-room="power">前往配电室</button></div>`, 'PUZZLE 03 / 05 · 已完成'); renderScene(); saveGame(); }
function openFuse() { if (state.solved.fuse) {
    openModal('熔断器已就位', `<p>备用熔断器牢牢卡在槽里。${state.solved.power ? '供电已经恢复。' : '接下来，需要在右侧线路面板接通导线。'}</p><button class="btn primary wide" data-action="inspect" data-id="circuit">检查线路面板</button>`, 'POWER / 部件就绪');
    return;
} openModal('空的熔断器槽', `<div class="item-hero">${icon('fuse')}</div><p style="text-align:center">${has('fuse') ? '你身上的备用熔断器，与空槽正好吻合。' : '这里缺少一枚熔断器。交班须知提到，备用件已移交档案室保管。'}</p>${has('fuse') ? '<button class="btn primary wide" data-action="install-fuse">装入备用熔断器</button>' : '<button class="btn ghost wide" data-action="close">返回调查</button>'}`, 'POWER / 备用熔断器'); }
function installFuse() { if (!has('fuse') || state.solved.fuse)
    return; state.solved.fuse = true; consume('fuse'); audio.chime(); renderScene(); saveGame(); openModal('备用熔断器已装入', '<p>卡扣发出一声清脆的声响。电压表仍指向零。<br>旋转线路面板上的导线，接通输入端与输出端，然后合闸。</p><button class="btn primary wide" data-action="inspect" data-id="circuit">打开线路面板</button>', 'POWER / 下一步：修复线路'); }
function ports(i) { const base = WIRE_TYPES[i] === 'I' ? [1, 3] : [0, 1]; return base.map(v => (v + state.circuits[i]) % 4); }
function wireNetwork() { const connected = new Set(), queue = []; let broken = false, out = false; const all = Array.from({ length: 9 }, (_, i) => ports(i)); if (!all[0].includes(3))
    return { connected, success: false }; queue.push(0); connected.add(0); while (queue.length) {
    const i = queue.shift(), r = Math.floor(i / 3), c = i % 3;
    for (const d of all[i]) {
        if (i === 0 && d === 3)
            continue;
        if (i === 8 && d === 1) {
            out = true;
            continue;
        }
        const nr = r + [-1, 0, 1, 0][d], nc = c + [0, 1, 0, -1][d];
        if (nr < 0 || nr > 2 || nc < 0 || nc > 2) {
            broken = true;
            continue;
        }
        const j = nr * 3 + nc;
        if (!all[j].includes((d + 2) % 4)) {
            broken = true;
            continue;
        }
        if (!connected.has(j)) {
            connected.add(j);
            queue.push(j);
        }
    }
} return { connected, success: out && !broken && connected.size === 9 }; }
function wireSVG(i, on) { const d = WIRE_TYPES[i] === 'I' ? 'M0 50H100' : 'M50 0V50H100'; return `<svg viewBox="0 0 100 100" aria-hidden="true" style="transform:rotate(${state.circuits[i] * 90}deg)"><path d="${d}" stroke="#06130d" stroke-width="16" fill="none"/><path d="${d}" stroke="${on ? '#c0d99e' : '#778b68'}" stroke-width="7" fill="none"/><circle cx="50" cy="50" r="7" fill="${on ? '#d2e3aa' : '#849474'}"/><circle cx="50" cy="50" r="2" fill="#293d23"/></svg>`; }
function renderCircuit() { const network = wireNetwork(); $('#circuitGrid').innerHTML = state.circuits.map((rot, i) => `<button class="wire-cell ${network.connected.has(i) ? 'connected' : ''}" data-action="rotate" data-index="${i}" aria-label="导线 ${i + 1}，顺时针旋转九十度" data-index-label="${i + 1}">${wireSVG(i, network.connected.has(i))}<span style="position:absolute;left:6px;top:3px;font:9px var(--mono);color:#93a880">${i + 1}</span></button>`).join(''); }
function openCircuit() { openModal('修复应急线路', `<p>点击任一导线可顺时针旋转 90°。将左上角输入端接到右下角输出端，所有接头都要接上。</p><div class="circuit-shell"><div class="circuit-labels"><span>IN ↓ 左上输入</span><span>右下输出 ↓ OUT</span></div><div class="circuit-grid" id="circuitGrid"></div><p class="circuit-legend">浅绿色导线 = 已与输入端相连<br>从左侧进入 1 号格，最后从 9 号格右侧离开。</p></div><button class="btn primary wide" data-action="check-circuit">合闸检测 ${icon('arrow')}</button><div class="feedback" id="puzzleFeedback" role="status">${state.mode === 'challenge' ? '线路错误扣除 ' + (window.Depth?.wrongCost() || 10) + ' 秒。旋转导线不扣时。' : '连通后按「合闸检测」，可以反复尝试。'}</div><div class="btn-row"><button class="btn small ghost" data-action="reset-circuit">重置线路</button><button class="btn small ghost" data-action="hint">请求提示</button></div>`, 'LOCK 04 / 应急供电', false, 'circuit'); renderCircuit(); }
function rotateWire(i) { if (state.solved.power || i < 0 || i > 8)
    return; state.circuits[i] = (state.circuits[i] + 1) % 4; audio.click(); renderCircuit(); $(`[data-action="rotate"][data-index="${i}"]`)?.focus({ preventScroll: true }); saveGame(); }
function checkCircuit() { if (window.Depth && !Depth.allowBase("power")) return; if (!wireNetwork().success) {
    if (penalty())
        feedback(`仍有断开的接头，请检查线路。${state.mode === 'challenge' ? ' −' + (window.Depth?.wrongCost() || 10) + ' 秒' : ''}`, true);
    return;
} state.solved.power = true; audio.chime(); renderScene(); saveGame(); openModal('门禁电源已恢复', `<div class="item-hero">${icon('check')}</div><p>电压表的指针终于抬起。走廊尽头，「安全出口」的指示灯亮了。<br>离院凭证上的图案，应该能打开最后一道锁。</p><div class="btn-row"><button class="btn ghost" data-action="item" data-id="permit">查看凭证</button><button class="btn primary" data-action="go" data-room="exit">前往正门</button></div>`, 'PUZZLE 04 / 05 · 已完成'); setTimeout(() => scare('这一次，带他们一起离开。'), 800); }
function openExitDoor() { if (state.solved.exit) {
    openModal('门外就是清晨', `<p>门禁已经解锁。现在可以离开。<br>${state.evidence.length === 3 ? '三份证词齐全。那些被抹去的姓名，会有人记得。' : `你只带着 ${state.evidence.length}/3 份证词。还有故事留在病院里。`}</p><div class="btn-row"><button class="btn ghost" data-action="close">继续调查</button><button class="btn primary" data-action="escape">推开门，离开</button></div>`, 'EXIT / 离院通道');
}
else {
    openModal('门还锁着', `<div class="item-hero">${icon('lock')}</div><p style="text-align:center">${state.solved.power ? '供电已恢复。还需要在右侧门禁终端，输入正确的离院编号。' : '大门的电磁锁没有反应。先恢复配电室的供电，再完成门禁认证。'}</p><button class="btn primary wide" data-action="inspect" data-id="gate">检查门禁终端</button>`, 'EXIT / 尚未获得许可');
} }
function openJournal() { if (!state)
    return; openModal('夜班线索本', `<p>已自动记录 ${state.notes.length} 条线索。${state.mode === 'challenge' ? '查阅时倒计时仍会继续。' : '探索模式可以慢慢查阅。'}</p><div class="journal-list">${state.notes.length ? state.notes.map((id, i) => { const n = NOTES[id]; return `<article class="journal-entry"><div class="entry-id">${String(i + 1).padStart(2, '0')} / ${n.location}</div><h3>${n.title}</h3><p>${n.text}</p></article>`; }).join('') : '<article class="journal-entry"><h3>还没有线索</h3><p>点击场景中的标记调查物品，重要文字会自动收录到这里。</p></article>'}</div><div class="btn-row"><button class="btn ghost" data-action="close">返回调查</button><button class="btn primary" data-action="hint">当前机关提示</button></div>`, 'INVESTIGATION LOG / 按发现顺序', true, 'journal'); }
function openHint() { if (window.Depth?.enabled()) { Depth.openHint(); return; } const stage = currentStage(), level = state.hintLevels[stage.key] || 0; openModal('需要一点方向', `<p>当前目标：<strong>${stage.title}</strong></p><p class="hint-notice">提示逐级展开：方向 → 推理 → 直接答案。${state.mode === 'challenge' ? '每次展开新的提示扣除 20 秒；重读已展开的提示不扣时。' : '探索模式的提示不扣时间。'}</p>${stage.hints.slice(0, level).map((h, i) => `<div class="hint-box"><strong>HINT ${String(i + 1).padStart(2, '0')}</strong><p>${h}</p></div>`).join('')}${level === 0 ? '<div class="hint-box"><p>先确认已经检查了当前房间的所有标记。答案往往藏在两条线索之间。</p></div>' : ''}<div class="btn-row"><button class="btn ghost" data-action="close">再想一想</button>${level < stage.hints.length ? `<button class="btn primary" data-action="reveal-hint">展开提示 ${level + 1}${state.mode === 'challenge' ? '（−20 秒）' : ''}</button>` : '<button class="btn primary" data-action="close">返回解谜</button>'}</div>`, 'HELP / 不必盲目试错', false, 'hint'); }
function revealHint() { if (window.Depth?.enabled()) { Depth.revealHint(); return; } const stage = currentStage(), level = state.hintLevels[stage.key] || 0; if (level >= stage.hints.length)
    return; state.hintLevels[stage.key] = level + 1; state.stats.hints++; if (state.mode === 'challenge')
    state.remaining = Math.max(0, state.remaining - 20); updateTimer(); saveGame(); if (state.mode === 'challenge' && state.remaining <= 0) {
    finish(false);
    return;
} openHint(); }
function showHelp() { const inGame = phase === 'playing'; openModal('值班员操作手册', `<div class="journal-list"><article class="journal-entry"><h3>探索与物品</h3><p>点击场景中的「＋」标记检查物品，使用上方地点栏切换房间。钥匙、熔断器会自动放入随身物品；到目标位置后点击「使用」按钮。</p></article><article class="journal-entry"><h3>密码、归档与线路</h3><p>密码可以用屏幕数字键或键盘输入。新增章节另有声纹复现、信号灯翻转、称重、旋钮、联动表盘和路径规划；机关内都附有操作规则。档案记录按先后顺序点击排列；导线每次点击旋转 90°。重要线索会自动记入线索本。</p></article><article class="journal-entry"><h3>解谜强度与计时模式</h3><p>经典模式限时为 12 / 18 / 22 / 24 / 26 分钟，错误 −10 秒、提示 −20 秒。深渊时限为经典的 3 倍，错误 −25 秒、提示 −40 秒；噩梦时限为经典的 3.5 倍向上取整分钟，错误 −45 秒、提示 −60 秒。高难度每章有 15 个节点；噩梦每章最多 6 次新提示，不提供直接答案。普通线索及谜题弹窗不会暂停计时。沉浸探索没有时限。暂停和切到后台都会停止计时。</p></article><article class="journal-entry"><h3>证词与存档</h3><p>每章三份证词，五章共十五份。集齐一章的三份证词并撤离可记录完整证据；五章全部达成后，在战役档案查看总终章。各章存档互不覆盖。操作后会自动保存到本地浏览器；清理浏览器数据、换浏览器或移动本地文件后，存档可能不可用。</p></article><article class="journal-entry"><h3>键盘与舒适设置</h3><p>J：线索本；H：提示；F：手电；M：声音；Esc：关闭弹窗或暂停。手机直接点击对应按钮。声音和轻度人影惊吓均可关闭。</p></article></div><div class="btn-row"><button class="btn primary" data-action="close">${inGame ? '返回值班' : '知道了'}</button></div>`, 'HOW TO PLAY / 操作手册', true, 'help'); }
function showPause(auto = false) { if (phase !== 'playing')
    return; paused = true; saveGame(); audio.sync(); clearTimeout(scareTimeout); $('#apparition').classList.remove('visible'); openModal('值班暂停', `<p>${auto ? '页面切到后台，游戏已自动暂停。返回后点击继续。' : '计时已经停止。这里暂时是安全的。'}</p><div class="pause-stats"><span>${state.mode === 'challenge' ? '剩余 ' + formatTime(state.remaining) : '探索 ' + formatTime(state.elapsed)}</span><span>节点 ${window.Depth?.enabled() ? Depth.count()+"/15" : completed()+"/5"}</span></div><div class="pause-setting"><span>低沉环境音与操作音</span><label class="check"><input type="checkbox" data-pref="sound" ${preferences.sound ? 'checked' : ''}>环境音效</label></div><div class="pause-setting"><span>短暂人影，不含频闪</span><label class="check"><input type="checkbox" data-pref="scares" ${preferences.scares ? 'checked' : ''}>人影惊吓</label></div><div class="btn-row"><button class="btn ghost" data-action="title">保存并返回首页</button><button class="btn primary" data-action="resume">继续值班 ${icon('play')}</button></div>`, 'PAUSED / 计时已停止', false, 'pause'); }
function resumeGame() { if (phase !== 'playing')
    return; paused = false; lastTick = performance.now(); closeModal(true); audio.resume(); }
function returnTitle() { if (phase === 'playing')
    saveGame(); phase = 'title'; paused = false; closeModal(true); $('#gameScreen').hidden = true; $('#endingScreen').hidden = true; $('#startScreen').hidden = false; $('#continueBtn').hidden = !saved; $('#heroArt').innerHTML = makeScene('exit', true); audio.sync(); clearTimeout(scareTimeout); $('#apparition').classList.remove('visible'); syncPrefs(); window.scrollTo(0, 0); }
function updateTimer() { if (!state)
    return; const text = state.mode === 'challenge' ? formatTime(state.remaining) : formatTime(state.elapsed); if (text !== lastTimerText) {
    $('#timer').textContent = text;
    lastTimerText = text;
} $('#timer').classList.toggle('urgent', state.mode === 'challenge' && state.remaining <= 90); $('#timer').setAttribute('aria-label', (state.mode === 'challenge' ? '剩余时间 ' : '探索用时 ') + text); $('#timerCaption').innerHTML = state.mode === 'challenge' ? '本章倒计时<br>TIME REMAINING' : '无时限探索<br>EXPLORATION'; const duration = state.duration || (window.Campaign?.current().minutes || 12) * 60; const t = 86400 - duration + Math.floor(state.mode === 'challenge' ? duration - state.remaining : state.elapsed); const day = t % 86400; $('#sceneClock').textContent = [Math.floor(day / 3600), Math.floor(day % 3600 / 60), day % 60].map(x => String(x).padStart(2, '0')).join(':'); }
function tick() { const now = performance.now(), dt = (now - lastTick) / 1000; lastTick = now; if (phase !== 'playing' || paused || !state)
    return; state.elapsed += dt; if (state.mode === 'challenge')
    state.remaining = Math.max(0, state.remaining - dt); updateTimer(); if (state.mode === 'challenge' && state.remaining <= 0) {
    finish(false);
    return;
} if (state.mode === 'challenge' && state.remaining <= 90 && !state.warned90) {
    state.warned90 = true;
    toast('本章剩余不足 90 秒。检查当前目标与已经记录的线索。');
    audio.tone(220, .6, 'sine', .035, 110);
} if (now - lastSave > 5000) {
    saveGame();
    lastSave = now;
} }
function finish(escaped = true) {
    if (window.Campaign) { Campaign.finish(escaped); return; }
    if (phase !== 'playing' || (escaped && !state.solved.exit))
        return;
    phase = 'ending';
    paused = false;
    closeModal(true);
    audio.sync();
    clearSave();
    clearTimeout(scareTimeout);
    $('#apparition').classList.remove('visible');
    $('#gameScreen').hidden = true;
    $('#startScreen').hidden = true;
    $('#endingScreen').hidden = false;
    const truth = escaped && state.evidence.length === 3;
    const title = !escaped ? '午夜档案' : truth ? '让静默结束' : '逃出生天';
    const en = !escaped ? 'ENDING C / RECORD INTERRUPTED' : truth ? 'ENDING S / NO MORE SILENCE' : 'ENDING A / FIRST LIGHT';
    const text = !escaped ? '零点。门锁落下，广播开始重复你的名字。<br>天亮后的护士站，又多出了一份没有结尾的值班记录。' : truth ? '你带出了三份证词，也带出了那些被抹去的姓名。<br>走出大门的一刻，身后的电话终于不再响起。' : `你在最后一扇门关上前离开了病院。<br>但档案里，还有 ${3 - state.evidence.length} 份证词没有重见天日。`;
    $('#endingScreen').innerHTML = `<div class="ending-card"><div class="ending-mark">${icon(escaped ? 'exit' : 'clock')}</div><div class="eyebrow">${en}</div><h1>${title}</h1><p>${text}</p><div class="ending-stats"><div><b>${formatTime(state.elapsed)}</b><small>实际调查用时</small></div><div><b>${completed()} / 5</b><small>完成机关</small></div><div><b>${state.evidence.length} / 3</b><small>找回证词</small></div></div><p class="small">${state.mode === 'challenge' ? '限时挑战' : '沉浸探索'} · 错误提交 ${state.stats.wrong} 次 · 使用提示 ${state.stats.hints} 条</p><div class="ending-actions"><button class="btn primary" data-action="title">重新值班 ${icon('arrow')}</button><button class="btn ghost" data-action="walkthrough">查看完整路线</button></div><p class="ending-footer">THE SILENT WARD / CASE CLOSED</p></div>`;
    window.scrollTo(0, 0);
}
function walkthrough() { if (window.Campaign && Campaign.current().id !== 'hospital') { Campaign.walkthrough(); return; } openModal('完整解谜路线', `<div class="journal-list"><article class="journal-entry"><h3>01 · 护士站</h3><p>当班日期 11 月 03 日，按月、日各两位得到 1103。打开抽屉拿病房钥匙。检查旧电话，收集证词 01。</p></article><article class="journal-entry"><h3>02 · 07 号病房</h3><p>用钥匙开门。墙上对应：月亮 2、眼睛 4、手掌 7、太阳 9。按床尾记录得到柜锁密码 2479，拿档案室钥匙。检查镜子，收集证词 02。</p></article><article class="journal-entry"><h3>03 · 档案室</h3><p>用钥匙开门。依次归档：给药、采血、巡房、熄灯。获得备用熔断器和离院凭证。检查旧合影，收集证词 03。</p></article><article class="journal-entry"><h3>04 · 配电室</h3><p>安装熔断器。将线路排成蛇形：1 → 2 → 3 ↓ 6 ← 5 ← 4 ↓ 7 → 8 → 9。重置线路后，1、2、4、5、7、8、9 各点 1 次，3、6 各点 2 次，然后合闸。</p></article><article class="journal-entry"><h3>05 · 正门</h3><p>凭证顺序是眼睛、月亮、太阳、手掌，门禁码 4297。认证通过后推开大门。三份证词齐全为「让静默结束」，未齐为「逃出生天」；挑战模式超时为「午夜档案」。</p></article></div><div class="btn-row"><button class="btn primary" data-action="close">关闭路线</button></div>`, 'SPOILERS / 全部答案', true, 'walkthrough'); }
/* Central event delegation keeps controls usable after any scene redraw. */
document.addEventListener('click', e => {
    const b = e.target.closest('[data-action]');
    if (!b || b.disabled)
        return;
    const a = b.dataset.action;
    if (phase === 'playing' && paused && !['close', 'resume', 'title', 'sound'].includes(a))
        return;
    switch (a) {
        case 'mode':
            selectedMode = b.dataset.mode;
            $$('.mode-card').forEach(n => { n.classList.toggle('active', n === b); n.setAttribute('aria-pressed', String(n === b)); });
            break;
        case 'start':
            if (saved)
                openModal('开始新的值班？', '<p>新游戏会覆盖当前浏览器中的未完成进度。已经保存的值班记录将被替换。</p><div class="btn-row"><button class="btn ghost" data-action="continue">继续原有记录</button><button class="btn primary" data-action="new-confirm">开始新游戏</button></div>', 'NEW SHIFT / 覆盖存档');
            else
                startGame(selectedMode);
            break;
        case 'new-confirm':
            startGame(selectedMode);
            break;
        case 'continue':
            if (saved)
                startGame(saved.mode, true);
            break;
        case 'go':
            goRoom(b.dataset.room);
            break;
        case 'inspect':
            inspect(b.dataset.id);
            break;
        case 'unlock-room':
            unlockRoom(b.dataset.room, b.dataset.item, b.dataset.flag);
            break;
        case 'close':
            closeModal();
            break;
        case 'digit':
            digit(b.dataset.digit);
            break;
        case 'item':
            openItem(b.dataset.id);
            break;
        case 'add-file':
            addFile(b.dataset.id);
            break;
        case 'remove-file':
            removeFile(Number(b.dataset.index));
            break;
        case 'reset-archive':
            state.archiveOrder = [];
            renderArchive();
            saveGame();
            break;
        case 'check-archive':
            checkArchive();
            break;
        case 'install-fuse':
            installFuse();
            break;
        case 'rotate':
            rotateWire(Number(b.dataset.index));
            break;
        case 'reset-circuit':
            state.circuits = [...INITIAL_ROT];
            renderCircuit();
            feedback('线路已重置为初始状态。');
            saveGame();
            break;
        case 'check-circuit':
            checkCircuit();
            break;
        case 'journal':
            openJournal();
            break;
        case 'hint':
            openHint();
            break;
        case 'reveal-hint':
            revealHint();
            break;
        case 'help':
            showHelp();
            break;
        case 'pause':
            showPause();
            break;
        case 'resume':
            resumeGame();
            break;
        case 'sound':
            setPref('sound', !preferences.sound);
            break;
        case 'flashlight':
            flashlightOn = !flashlightOn;
            $('#flashlight').classList.toggle('off', !flashlightOn);
            $('#flashlightBtn').setAttribute('aria-pressed', String(flashlightOn));
            toast(flashlightOn ? '手电已开启。' : '手电已关闭；应急照明仍可供调查。');
            break;
        case 'title':
            returnTitle();
            break;
        case 'escape':
            finish(true);
            break;
        case 'walkthrough':
            walkthrough();
            break;
    }
});
document.addEventListener('change', e => { if (e.target.matches('[data-pref]'))
    setPref(e.target.dataset.pref, e.target.checked); });
document.addEventListener('input', e => { if (e.target.id === 'codeInput')
    e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 4); });
document.addEventListener('submit', e => { if (e.target.id === 'codeForm') {
    e.preventDefault();
    submitCode(e.target.dataset.type);
} });
document.addEventListener('keydown', e => {
    if (e.key === 'Tab' && !$('#modalBackdrop').hidden) {
        const focusable = $$('button:not(:disabled),input,a[href],[tabindex="0"]', $('#modal')).filter(el => el.offsetParent !== null);
        if (focusable.length) {
            const first = focusable[0], last = focusable[focusable.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            }
            else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        }
        return;
    }
    if (e.key === 'Escape') {
        e.preventDefault();
        if (!$('#modalBackdrop').hidden)
            closeModal();
        else if (phase === 'playing')
            showPause();
        return;
    }
    if (phase !== 'playing' || paused || e.ctrlKey || e.metaKey || e.altKey)
        return;
    if (activeModal === 'keypad' && e.key === 'Enter') {
        e.preventDefault();
        submitCode($('#codeForm').dataset.type);
        return;
    }
    if (e.target.matches('input,textarea'))
        return;
    const key = e.key.toLowerCase();
    if (activeModal === 'keypad' && /^[0-9]$/.test(key)) {
        e.preventDefault();
        digit(key);
        return;
    }
    if (activeModal === 'keypad' && key === 'backspace') {
        e.preventDefault();
        digit('⌫');
        return;
    }
    if (activeModal === 'keypad' && key === 'enter' && !e.target.matches('button')) {
        e.preventDefault();
        submitCode($('#codeForm').dataset.type);
        return;
    }
    if (key === 'j') {
        e.preventDefault();
        openJournal();
    }
    else if (key === 'h') {
        e.preventDefault();
        openHint();
    }
    else if (key === 'm') {
        e.preventDefault();
        setPref('sound', !preferences.sound);
    }
    else if (key === 'f') {
        e.preventDefault();
        $('#flashlightBtn').click();
    }
});
$('#viewport').addEventListener('pointermove', e => { if (e.pointerType === 'touch')
    return; const r = e.currentTarget.getBoundingClientRect(); $('#flashlight').style.setProperty('--x', `${(e.clientX - r.left) / r.width * 100}%`); $('#flashlight').style.setProperty('--y', `${(e.clientY - r.top) / r.height * 100}%`); });
$('#modalBackdrop').addEventListener('click', e => { if (e.target === e.currentTarget && activeModal !== 'pause')
    closeModal(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && phase === 'playing' && !paused)
    showPause(true); });
window.addEventListener('pagehide', saveGame);
window.addEventListener('beforeunload', saveGame);
fillIcons();
$('#heroArt').innerHTML = makeScene('exit', true);
$('#continueBtn').hidden = !saved;
syncPrefs();
setInterval(tick, 200);
/** Public bridge: presentation code never owns puzzle progress. */
window.Ward = {
    get state() { return state; }, get phase() { return phase; }, get paused() { return paused; },
    get modal() { return activeModal; }, get prefs() { return preferences; }, get flashlight() { return flashlightOn; },
    get selectedMode() { return selectedMode; }, get saved() { return saved; },
    rooms: ROOMS, items: ITEM_DATA, notes: NOTES, stages: STAGES,
    inspect, goRoom, startGame, saveGame, openModal, closeModal, showPause, resumeGame, returnTitle,
    setPref, toast, audio, icon, isSeen, renderScene, currentStage, makeScene,
    setMode(mode) { selectedMode = mode; },
};
