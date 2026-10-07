/* Input, viewpoints, UI, ambient direction. Puzzle ownership stays in puzzles.js. */
'use strict';
(() => {
    const S = window.SW, G = window.Ward, $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
    const CONFIG_KEY = 'silent-ward-presentation-v2';
    const defaults = { view: '3d', quality: 'balanced', brightness: 1, sensitivity: 1, fx: true, reduceMotion: matchMedia('(prefers-reduced-motion: reduce)').matches, spatial: true };
    let prefs = { ...defaults };
    try {
        prefs = { ...defaults, ...JSON.parse(localStorage.getItem(CONFIG_KEY) || '{}') };
    }
    catch { }
    if (!['3d', '2d', 'investigate'].includes(prefs.view))
        prefs.view = '3d';
    if (!['high', 'balanced', 'low'].includes(prefs.quality))
        prefs.quality = 'balanced';
    prefs.brightness = Math.max(.7, Math.min(1.7, Number(prefs.brightness) || 1));
    prefs.sensitivity = Math.max(.4, Math.min(1.8, Number(prefs.sensitivity) || 1));
    let renderer = null, renderError = null;
    try {
        renderer = new S.Renderer($('#worldCanvas'));
    }
    catch (e) {
        renderError = e;
        console.warn('3D renderer unavailable; 2D and investigation remain playable.', e);
    }
    const topdown = new S.Topdown($('#mapCanvas'));
    let view = prefs.view, currentRoom = 'exit', world = S.getWorld('exit'), previewRoom = 'exit', lastPhase = 'title', lastState = null;
    const player = { pos: [0, 1.65, 4], yaw: 0, pitch: 0, fov: 68 };
    let keys = new Set(), stick = { x: 0, y: 0 }, drag = null, hasDrag = false, walkTime = 0, lastStep = 0, transitionUntil = 0, route = [], routeAction = null, nearby = null, frame = 0, lastTime = performance.now(), uiTime = 0;
    let scareAt = 0, scareDuration = 0, nextScare = 33, ghostAmount = 0, lastRoomEvent = '', lastSavePosition = 0, phaseChangedAt = performance.now();
    let pointerUnlockExpected = false, activeTouch = null, settingsOpen = false;
    function storePrefs() { try {
        localStorage.setItem(CONFIG_KEY, JSON.stringify(prefs));
    }
    catch { } applyPrefs(); }
    function applyPrefs() { document.body.classList.toggle('reduce-motion', prefs.reduceMotion); $('#filmGrain').style.opacity = prefs.fx ? (prefs.reduceMotion ? '.016' : '.031') : '0'; if (renderer) {
        renderer.quality = prefs.quality;
        renderer.brightness = prefs.brightness;
        renderer.fx = prefs.fx ? 1 : 0;
        renderer.reducedMotion = prefs.reduceMotion;
        renderer.resize();
    } G.setPref('scares', G.prefs.scares); }
    function cameraToLook(pos, target) { player.pos = [...pos]; player.yaw = Math.atan2(target[0] - pos[0], -(target[2] - pos[2])); player.pitch = Math.atan2(target[1] - pos[1], Math.hypot(target[0] - pos[0], target[2] - pos[2])); }
    function preview(id) { if (G.phase !== 'title')
        return; previewRoom = id; world = S.getWorld(id); currentRoom = id; const m = S.sceneMeta[id]; cameraToLook(world.preview, world.look); $('#previewName').textContent = `${m.index} / ${m.name}`; $('#previewCamera').textContent = `CAM ${m.index}`; $('#previewDescription').textContent = m.subtitle + '。'; $$('.sector-card').forEach(b => b.classList.toggle('selected', b.dataset.room === id)); if (!renderer)
        $('#worldHost').style.backgroundImage = `linear-gradient(#08111266,#081112aa),url("assets/${id}.webp")`; }
    function renderCards() {
        $('#sectorCards').innerHTML = S.worldIds.map(id => { const m = S.sceneMeta[id]; return `<button class="sector-card ${id === previewRoom ? 'selected' : ''}" data-shell="preview" data-room="${id}" aria-label="预览${m.name}"><span class="sector-art">${G.makeScene(id)}</span><span class="sector-index">${m.index}</span><span class="sector-lock">↗</span><strong>${m.name}</strong><small>${m.short}</small></button>`; }).join('');
        // Actual locally supplied captures are optional; SVG fallback is always present.
        for (const card of $$('.sector-card')) {
            const img = new Image();
            img.alt = '';
            img.src = `assets/${card.dataset.room}.webp`;
            img.onload = () => { card.querySelector('.sector-art').replaceChildren(img); };
            img.onerror = () => { };
        }
    }
    function setView(next, announce = true) {
        if (next === '3d' && !renderer) {
            G.toast('此设备无法启用 WebGL 2，已切换为 2D 俯视。');
            next = '2d';
        }
        if (!['3d', '2d', 'investigate'].includes(next))
            return;
        exitPointer();
        route = [];
        routeAction = null;
        keys.clear();
        stick.x = stick.y = 0;
        view = next;
        prefs.view = next;
        storePrefs();
        document.body.dataset.view = view;
        $$('.entry-view,.view-switch button').forEach(b => { const a = b.dataset.view === view; b.classList.toggle('active', a); b.setAttribute('aria-pressed', String(a)); });
        if (G.state && G.phase === 'playing') {
            G.state.viewMode = view;
            savePosition();
            G.saveGame();
            if (announce)
                G.toast({ '3d': '第一人称：WASD 移动，拖动环顾；走近光点按 E。', '2d': '俯视探索：点击地面移动；点击线索会自动走近调查。', investigate: '经典调查：点击标记解谜。物品与进度完全保留。' }[view]);
        }
        syncLayers();
        updateMarkers(true);
        if (renderer)
            renderer.resize();
    }
    function syncLayers() {
        const playing = G.phase === 'playing';
        document.body.dataset.phase = G.phase;
        document.body.dataset.view = view;
        const show3D = G.phase === 'title' || G.phase === 'ending' || (playing && view === '3d');
        $('#worldCanvas').hidden = !show3D;
        $('#mapCanvas').hidden = !(playing && view === '2d');
        $('#worldOverlay').hidden = !(playing && view !== 'investigate');
        $('#worldHost').style.display = playing && view === 'investigate' ? 'none' : 'block';
        if (playing) {
            $('#worldHelp').innerHTML = view === '2d' ? '<span>点击</span> 选择路线 <b>·</b> WASD 移动 <b>·</b> E 调查 <b>·</b> 1 / 2 / 3 切换视角' : '<span>W A S D</span> 移动 <b>·</b> 拖动 / 点击锁定鼠标 <b>·</b> E 调查';
        }
    }
    function savePosition() { if (G.phase !== 'playing' || !G.state)
        return; G.state.worldPositions ??= {}; G.state.worldPositions[currentRoom] = { x: player.pos[0], z: player.pos[2], yaw: player.yaw, pitch: player.pitch }; G.state.viewMode = view; }
    function restorePosition(id) { const p = G.state?.worldPositions?.[id]; if (p && [p.x, p.z, p.yaw, p.pitch].every(Number.isFinite) && canStand(p.x, p.z, world)) {
        player.pos = [p.x, 1.65, p.z];
        player.yaw = p.yaw;
        player.pitch = Math.max(-1.15, Math.min(1.15, p.pitch));
    }
    else {
        player.pos = [...world.spawn];
        player.yaw = 0;
        player.pitch = -.01;
    } }
    function roomTransition() { const m = S.sceneMeta[currentRoom]; $('#transitionNumber').textContent = `SECTOR ${m.index} / ${m.en}`; $('#transitionTitle').textContent = m.name; $('#transitionText').textContent = m.subtitle + '。'; $('#transitionCurtain').classList.add('active'); transitionUntil = performance.now() + (prefs.reduceMotion ? 180 : 760); setTimeout(() => $('#transitionCurtain').classList.remove('active'), prefs.reduceMotion ? 100 : 390); }
    function enterRoom(id, { fresh = false } = {}) {
        if (!S.worldIds.includes(id))
            return;
        const changed = currentRoom !== id || fresh;
        if (!fresh && G.phase === 'playing' && G.state && currentRoom !== id)
            savePosition();
        currentRoom = id;
        world = S.getWorld(id);
        if (changed) {
            restorePosition(id);
            keys.clear();
            route = [];
            routeAction = null;
            exitPointer();
            roomTransition();
            ambient.room(id);
            scareAt = 0;
            lastRoomEvent = '';
        }
        const m = S.sceneMeta[id];
        $('#worldSector').textContent = `${m.index} / ${m.en}`;
        $('#worldName').textContent = m.name;
        $('#worldMood').textContent = m.mood;
        $('#worldMarkers').innerHTML = world.hotspots.map(h => `<button class="world-marker" data-world="${h.id}" aria-label="检查${h.label}" hidden><span class="marker-ring">＋</span><span class="marker-label">${h.label}</span></button>`).join('');
        updateObjective();
        updateMarkers(true);
        syncLayers();
    }
    function updateObjective() { if (!G.state)
        return; const stage = G.currentStage(); $('#worldObjective').textContent = stage.title; $('#worldSubtext').textContent = stage.desc; $('#worldProgress').style.width = `${G.stages.filter(s => G.state.solved[s.key]).length / 5 * 100}%`; }
    function syncPhase() {
        if (lastState !== G.state && G.phase === 'playing') {
            lastState = G.state;
            view = ['3d', '2d', 'investigate'].includes(G.state.viewMode) ? G.state.viewMode : prefs.view;
            enterRoom(G.state.room, { fresh: true });
            setView(view, false);
            nextScare = G.state.elapsed + 33;
            scareAt = 0;
            lastSavePosition = 0;
            ambient.init();
            ambient.room(G.state.room);
        }
        if (lastPhase !== G.phase) {
            lastPhase = G.phase;
            phaseChangedAt = performance.now();
            keys.clear();
            route = [];
            routeAction = null;
            exitPointer();
            if (G.phase === 'title') {
                preview(previewRoom);
                $('#engineStatus').textContent = renderer ? '原生 3D 监控信号已接入' : '2D / 调查模式可用';
            }
            if (G.phase === 'ending') {
                ghostAmount = 0;
            }
            syncLayers();
        }
        if (G.phase === 'playing' && G.state.room !== currentRoom)
            enterRoom(G.state.room);
    }
    function canStand(x, z, w = world) { const r = .235, { w: width, d: depth } = w.bounds; if (x < -width / 2 + .35 || x > width / 2 - .35 || z < -depth / 2 + .35 || z > depth / 2 - .35)
        return false; for (const b of w.colliders) {
        const dx = Math.max(Math.abs(x - b.x) - b.w / 2, 0), dz = Math.max(Math.abs(z - b.z) - b.d / 2, 0);
        if (dx * dx + dz * dz < r * r)
            return false;
    } return true; }
    function move(dx, dz) { let moved = false; if (canStand(player.pos[0] + dx, player.pos[2])) {
        player.pos[0] += dx;
        moved = moved || Math.abs(dx) > 1e-5;
    } if (canStand(player.pos[0], player.pos[2] + dz)) {
        player.pos[2] += dz;
        moved = moved || Math.abs(dz) > 1e-5;
    } return moved; }
    /** A* on a 0.30 m grid. Interactive targets choose a reachable approach cell. */
    function pathTo(tx, tz, interactive = false) {
        const step = .30, { w, d } = world.bounds, N = Math.ceil(w / step), H = Math.ceil(d / step), toCell = (x, z) => [Math.round((x + w / 2) / step), Math.round((z + d / 2) / step)], toPos = (i, j) => [i * step - w / 2, j * step - d / 2], idx = (i, j) => j * N + i;
        const [sx, sz] = toCell(player.pos[0], player.pos[2]), start = idx(sx, sz);
        const valid = (i, j) => i >= 0 && j >= 0 && i < N && j < H && canStand(...toPos(i, j));
        let goals = [];
        const [gx, gz] = toCell(tx, tz);
        const range = interactive ? Math.ceil(1.95 / step) : 4;
        for (let di = -range; di <= range; di++)
            for (let dj = -range; dj <= range; dj++) {
                let i = gx + di, j = gz + dj;
                if (!valid(i, j))
                    continue;
                let p = toPos(i, j), dist = Math.hypot(p[0] - tx, p[1] - tz);
                if (dist <= (interactive ? 1.9 : .95) && (!interactive || lineVisible({ pos: [tx, 1.5, tz] }, [p[0], 1.65, p[1]])))
                    goals.push({ i, j, dist, score: dist + (interactive ? .12 * Math.hypot(p[0] - player.pos[0], p[1] - player.pos[2]) : 0) });
            }
        goals.sort((a, b) => a.score - b.score);
        if (!goals.length)
            return [];
        // Search to a set of valid nearby approach cells; stop at the first minimum-cost goal.
        const goalSet = new Set((interactive ? goals : goals.slice(0, 1)).map(g => idx(g.i, g.j))), open = [{ i: sx, j: sz, g: 0, f: 0 }], cost = new Map([[start, 0]]), came = new Map(), closed = new Set();
        let result = null, iterations = 0;
        while (open.length && iterations++ < 6500) {
            open.sort((a, b) => b.f - a.f);
            const cur = open.pop(), ci = idx(cur.i, cur.j);
            if (closed.has(ci))
                continue;
            if (goalSet.has(ci)) {
                result = ci;
                break;
            }
            closed.add(ci);
            for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) {
                const i = cur.i + di, j = cur.j + dj, ni = idx(i, j);
                if (!valid(i, j) || closed.has(ni))
                    continue;
                if (di && dj && (!valid(cur.i + di, cur.j) || !valid(cur.i, cur.j + dj)))
                    continue;
                const ng = cur.g + (di && dj ? 1.414 : 1);
                if (ng >= (cost.get(ni) ?? Infinity))
                    continue;
                cost.set(ni, ng);
                came.set(ni, ci);
                const h = Math.max(0, Math.hypot(i - gx, j - gz) - (interactive ? 1.9 / step : 0));
                open.push({ i, j, g: ng, f: ng + h });
            }
        }
        if (result === null)
            return [];
        let out = [], c = result;
        while (c !== start) {
            out.push(toPos(c % N, Math.floor(c / N)));
            c = came.get(c);
            if (c === undefined)
                return [];
        }
        out.reverse();
        return out;
    }
    function navigate(x, z, id = null) { const h = id ? world.hotspots.find(h => h.id === id) : null; if (h && Math.hypot(h.pos[0] - player.pos[0], h.pos[2] - player.pos[2]) < 2.2 && lineVisible(h)) {
        interact(id);
        return;
    } route = pathTo(x, z, !!id); routeAction = id; if (!route.length) {
        routeAction = null;
        G.toast('这条路线被挡住了。请选择空地，或从另一侧靠近。');
    } }
    function lineVisible(h, origin = player.pos) {
        const ax = origin[0], az = origin[2], bx = h.pos[0], bz = h.pos[2], dist = Math.hypot(bx - ax, bz - az);
        if (dist < .3)
            return true;
        // Stop before the target surface itself. Countertop objects remain usable over their own support.
        for (const c of world.colliders) {
            if (Math.abs(bx - c.x) < c.w / 2 + .18 && Math.abs(bz - c.z) < c.d / 2 + .18)
                continue;
            for (let t = .15; t < .93; t += .1) {
                const x = ax + (bx - ax) * t, z = az + (bz - az) * t;
                if (Math.abs(x - c.x) < c.w / 2 && Math.abs(z - c.z) < c.d / 2)
                    return false;
            }
        }
        return true;
    }
    function updateMarkers(force = false) {
        if (G.phase !== 'playing' || view === 'investigate') {
            nearby = null;
            return;
        }
        let best = null, bestScore = Infinity;
        for (const h of world.hotspots) {
            const node = $(`[data-world="${h.id}"]`);
            if (!node)
                continue;
            const dist = Math.hypot(player.pos[0] - h.pos[0], player.pos[2] - h.pos[2]), accessible = dist < 2.65 && lineVisible(h), seen = G.isSeen(h.id);
            let x, y, visible;
            if (view === '3d' && renderer) {
                const p = S.M.project(h.pos, renderer.lastVP);
                x = (p.x * .5 + .5) * innerWidth;
                y = (-p.y * .5 + .5) * innerHeight;
                visible = p.w > 0 && p.z < 1 && x > 22 && x < innerWidth - 22 && y > 70 && y < innerHeight - 80 && (dist < 13 || accessible) && lineVisible(h);
                const score = Math.hypot(p.x, p.y) * 4 + dist;
                if (accessible && visible && score < bestScore && Math.abs(p.x) < .65 && Math.abs(p.y) < .75) {
                    best = h;
                    bestScore = score;
                }
            }
            else {
                const p = topdown.project(h.pos);
                x = p.x;
                y = p.y;
                visible = x > 10 && x < innerWidth - 10 && y > 100 && y < innerHeight - 110;
                if (accessible && dist < bestScore) {
                    best = h;
                    bestScore = dist;
                }
            }
            node.hidden = !visible;
            node.style.left = `${x}px`;
            node.style.top = `${y}px`;
            node.classList.toggle('far', view === '3d' && !accessible);
            node.classList.toggle('near', accessible);
            node.classList.toggle('done', seen);
            node.querySelector('.marker-ring').textContent = seen ? '✓' : '＋';
        }
        nearby = best;
        const prompt = $('#interactionPrompt');
        prompt.classList.toggle('ready', !!best);
        prompt.querySelector('span').textContent = best ? `${best.label} · ${view === '3d' ? '按 E 或点击光点' : '按 E / 点击调查'}` : view === '2d' ? '点击空地移动 · 点击线索自动走近' : '走近光点 · 按 E 调查';
    }
    function interact(id = null) { if (G.phase !== 'playing' || G.paused || G.modal || performance.now() < transitionUntil)
        return; const h = id ? world.hotspots.find(h => h.id === id) : nearby; if (!h) {
        G.toast('靠近线索光点，再按 E 或点击调查。');
        return;
    } const dist = Math.hypot(h.pos[0] - player.pos[0], h.pos[2] - player.pos[2]); if (dist > 2.75 || !lineVisible(h)) {
        if (view === '2d')
            navigate(h.pos[0], h.pos[2], h.id);
        else
            G.toast('距离太远。请再靠近一些。');
        return;
    } exitPointer(); route = []; routeAction = null; keys.clear(); G.inspect(h.id); updateMarkers(true); updateObjective(); }
    function exitPointer() { if (document.pointerLockElement) {
        pointerUnlockExpected = true;
        document.exitPointerLock?.();
        setTimeout(() => pointerUnlockExpected = false, 200);
    } document.body.classList.remove('pointer-locked'); }
    function lockPointer() { if (view !== '3d' || G.modal || G.paused || G.phase !== 'playing')
        return; try {
        const p = $('#worldCanvas').requestPointerLock?.();
        p?.catch?.(() => { });
    }
    catch { } }
    function resetPosition() { player.pos = [...world.spawn]; player.yaw = 0; player.pitch = 0; route = []; routeAction = null; keys.clear(); savePosition(); G.saveGame(); G.toast('已回到当前场景入口，解谜进度没有变化。'); }
    function showBag() { if (!G.state)
        return; exitPointer(); const content = G.state.inventory.length ? G.state.inventory.map(id => { const i = G.items[id]; return `<button class="notebook-btn" data-action="item" data-id="${id}" style="width:100%;margin:10px 0"><span><strong>${i.name}</strong><small>${i.desc}</small></span>${G.icon(i.icon)}</button>`; }).join('') : '<p>尚未收集物品。先从护士站的值班抽屉开始。</p>'; G.openModal('随身物品', content + '<button class="btn ghost wide" data-action="close">返回调查</button>', 'INVENTORY / 全视角共享', false, 'inventory'); }
    function settings() {
        settingsOpen = true;
        const inGame = G.phase === 'playing';
        if (inGame && !G.paused)
            G.showPause();
        exitPointer();
        G.openModal('信号与感官', `<div class="setting-row"><div><strong>画面质量</strong><small>高画质优先细节；低画质适合旧设备。</small></div><select data-setting="quality" aria-label="画面质量"><option value="high" ${prefs.quality === 'high' ? 'selected' : ''}>高画质</option><option value="balanced" ${prefs.quality === 'balanced' ? 'selected' : ''}>均衡</option><option value="low" ${prefs.quality === 'low' ? 'selected' : ''}>性能优先</option></select></div>
 <div class="setting-row"><div><strong>暗部亮度</strong><small>提高亮度不会改变谜题难度。</small></div><input aria-label="暗部亮度" data-setting="brightness" type="range" min=".7" max="1.7" step=".05" value="${prefs.brightness}"></div>
 <div class="setting-row"><div><strong>视角灵敏度</strong><small>控制鼠标与触摸拖动的转向速度。</small></div><input aria-label="视角灵敏度" data-setting="sensitivity" type="range" min=".4" max="1.8" step=".1" value="${prefs.sensitivity}"></div>
 <div class="setting-row"><div><strong>胶片与镜头效果</strong><small>颗粒、暗角、灯光辉光、轻微色散。</small></div><input data-setting="fx" type="checkbox" aria-label="胶片效果" ${prefs.fx ? 'checked' : ''}></div>
 <div class="setting-row"><div><strong>减少镜头运动</strong><small>关闭行走晃动、呼吸起伏及背景镜头漂移。</small></div><input data-setting="reduceMotion" type="checkbox" aria-label="减少镜头运动" ${prefs.reduceMotion ? 'checked' : ''}></div>
 <div class="setting-row"><div><strong>环境声音</strong><small>雨声、脚步、设备轰鸣与远处回声。</small></div><input data-pref="sound" type="checkbox" aria-label="环境声音" ${G.prefs.sound ? 'checked' : ''}></div>
 <div class="setting-row"><div><strong>人影与意外声响</strong><small>关闭后保留静态恐怖场景，无突发惊吓。</small></div><input data-pref="scares" type="checkbox" aria-label="人影惊吓" ${G.prefs.scares ? 'checked' : ''}></div>
 <p class="settings-note">不使用快速频闪。建议先以较低设备音量游玩；感到不适时暂停。3D 模式需要支持 WebGL 2 的浏览器，失败时可用 2D 或经典调查。</p>
 <div class="btn-row">${inGame ? '<button class="btn ghost" data-shell="reset-position">重置当前位置</button>' : '<button class="btn ghost" data-shell="credits">制作档案</button>'}<button class="btn primary" data-action="${inGame ? 'resume' : 'close'}">${inGame ? '继续值班' : '保存设置'}</button></div>`, 'SETTINGS / 画面与舒适选项', false, inGame ? 'pause' : 'settings');
    }
    function help() { G.openModal('夜班员操作手册', `<div class="journal-list"><article class="journal-entry"><h3>三种方式，同一段调查</h3><p>1：3D 第一人称；2：2D 俯视探索；3：经典调查。随时切换，物品、密码、机关与证词不会重置。</p></article><article class="journal-entry"><h3>3D 第一人称</h3><p>WASD 移动，Shift 加快脚步。按住鼠标拖动环顾，或点击场景锁定鼠标。走近光点后按 E、点击标记或触摸「调查」。Esc 释放鼠标并暂停。方向键也可前后行走、左右转向。</p></article><article class="journal-entry"><h3>2D 俯视探索</h3><p>点击空地自动寻路；点击线索，会自动走近并调查。也可使用 WASD 或手机摇杆移动。手动移动会取消自动路线。上方视角按钮随时切回经典调查，避免晕动。</p></article><article class="journal-entry"><h3>手机触屏</h3><p>左下摇杆移动，空白画面拖动环顾，右下按钮调查。2D 模式点击空地移动。横屏能看见更多环境，竖屏也可完成游戏。</p></article><article class="journal-entry"><h3>五大区域与机关</h3><p>底部地点栏可切换地点；病房与档案室需要先取得钥匙。每个房间有独立布局，门牌与光点指向可调查物品。所有重要文字都能在解谜弹窗中清晰阅读。</p></article><article class="journal-entry"><h3>计时、声音与存档</h3><p>午夜挑战为 12 分钟；错误提交扣 10 秒，新提示扣 20 秒。普通调查弹窗仍会计时，设置和暂停停止计时；切到后台自动暂停。沉浸探索不限时。存档仅保存在当前浏览器、当前站点。</p></article><article class="journal-entry"><h3>快捷键</h3><p>E 调查，J 线索本，B 物品，H 提示，F 手电，M 声音，Esc 暂停 / 关闭弹窗。设置内可调画质、亮度、灵敏度、人影惊吓和镜头晃动。门禁供电恢复后，仍需离院编号。</p></article></div><button class="btn primary wide" data-action="close">返回调查</button>`, 'FIELD MANUAL / 操作手册', true, 'help'); }
    function credits() { G.openModal('禁区重构 · 制作档案', `<p style="letter-spacing:1px;line-height:2">静默病院不是一段等待播放的影像。<br>每一盏灯、每一扇门，都在你的浏览器中实时绘制。</p><div class="credits-grid"><div><strong>05</strong><small>独立环境 / 独立平面布局</small></div><div><strong>03</strong><small>共享进度的探索视角</small></div><div><strong>00</strong><small>外部运行依赖 / 跟踪请求</small></div><div><strong>03</strong><small>证词与不同结局</small></div></div><p class="settings-note">三维：原生 WebGL 2、合批几何、阴影贴图、程序化材质、雾效与胶片后处理。俯视：独立 Canvas 2D 绘制与 A* 寻路。调查：保留原版 SVG 场景与谜题系统。音效由 Web Audio 合成。源码可作为纯静态网站部署。</p><button class="btn primary wide" data-action="close">关闭档案</button>`, 'THE SILENT WARD / VERSION 2.0', false, 'credits'); }
    const ambient = { ready: false, ctx: null, noise: null, filter: null, mix: null, hum: null, lastRoom: null,
        init() { if (this.ready || !G.audio.ready)
            return; try {
            this.ctx = G.audio.ctx;
            const c = this.ctx;
            this.mix = c.createGain();
            this.mix.gain.value = .22;
            this.mix.connect(G.audio.master);
            const buffer = c.createBuffer(1, c.sampleRate * 4, c.sampleRate), data = buffer.getChannelData(0), r = S.rng(101);
            let brown = 0;
            for (let i = 0; i < data.length; i++) {
                brown = (brown + (r() * 2 - 1) * .05) / 1.04;
                data[i] = brown;
            }
            this.noise = c.createBufferSource();
            this.noise.buffer = buffer;
            this.noise.loop = true;
            this.filter = c.createBiquadFilter();
            this.filter.type = 'lowpass';
            this.filter.frequency.value = 500;
            this.noise.connect(this.filter);
            this.filter.connect(this.mix);
            this.noise.start();
            const osc = c.createOscillator(), gain = c.createGain();
            osc.type = 'sine';
            osc.frequency.value = 48;
            gain.gain.value = .021;
            osc.connect(gain);
            gain.connect(this.mix);
            osc.start();
            this.hum = osc;
            this.ready = true;
            this.room(currentRoom);
        }
        catch (e) {
            console.warn('Ambient audio unavailable', e);
        } },
        room(id) { if (!this.ready)
            return; this.lastRoom = id; const config = { station: [380, 57, .20], ward: [1500, 42, .27], archive: [620, 39, .18], power: [190, 50, .44], exit: [780, 47, .22] }[id], t = this.ctx.currentTime; this.filter.frequency.setTargetAtTime(config[0], t, 1); this.hum.frequency.setTargetAtTime(config[1], t, .6); this.mix.gain.setTargetAtTime(config[2], t, .7); },
        event(kind = 'step', pan = 0) { if (!this.ready || !G.prefs.sound || G.paused)
            return; try {
            const c = this.ctx, t = c.currentTime, g = c.createGain(), filter = c.createBiquadFilter(), p = c.createStereoPanner();
            p.pan.value = Math.max(-1, Math.min(1, pan));
            filter.type = 'lowpass';
            filter.frequency.value = kind === 'step' ? 180 : kind === 'rustle' ? 1200 : 330;
            const source = c.createBufferSource(), duration = kind === 'step' ? .15 : kind === 'rustle' ? 1.1 : 2.0, buffer = c.createBuffer(1, Math.floor(c.sampleRate * duration), c.sampleRate), data = buffer.getChannelData(0);
            let b = 0;
            for (let i = 0; i < data.length; i++) {
                b = (b + (Math.random() * 2 - 1) * .1) / 1.1;
                data[i] = b;
            }
            source.buffer = buffer;
            g.gain.setValueAtTime(.0001, t);
            g.gain.exponentialRampToValueAtTime(kind === 'step' ? .23 : .18, t + .025);
            g.gain.exponentialRampToValueAtTime(.0001, t + duration);
            source.connect(filter);
            filter.connect(g);
            g.connect(p);
            p.connect(G.audio.master);
            source.start(t);
            source.onended = () => { source.disconnect(); filter.disconnect(); g.disconnect(); p.disconnect(); };
            if (kind !== 'step')
                G.audio.tone(kind === 'whisper' ? 73 : 105, 1.8, 'sine', .036, 36);
        }
        catch { } },
    };
    function triggerScare(text, duration = 3.9) { if (!G.prefs.scares || G.phase !== 'playing' || G.paused)
        return; scareAt = performance.now(); scareDuration = duration * 1000; $('#footstepLabel').textContent = text; ambient.event('whisper', Math.random() > .5 ? -.8 : .8); setTimeout(() => { if (G.phase === 'playing')
        $('#footstepLabel').textContent = S.sceneMeta[currentRoom].subtitle + '。'; }, 6500); }
    const frightLines = { station: ['电话响过以后，身后多了一次呼吸。', '交班表上，刚才有你的名字吗？'], ward: ['不要数床上的人。', '镜子里的动作，慢了半拍。'], archive: ['有人把档案推回了原处。', '书架另一侧，纸张自己翻了一页。'], power: ['电机停顿时，脚步没有停。', '墙里的声音，已经数到你了。'], exit: ['你停下了。脚步却又响了一次。', '不要回头。门就在前面。'] };
    function update(dt, time) {
        const now = performance.now();
        syncPhase();
        if (G.phase === 'title') {
            if (!prefs.reduceMotion) {
                const base = world.preview, target = world.look, pos = [base[0] + Math.sin(time * .10) * .10, base[1] + Math.sin(time * .19) * .025, base[2] + Math.sin(time * .08) * .06];
                cameraToLook(pos, target);
            }
            return;
        }
        if (G.phase !== 'playing' || G.paused || G.modal || now < transitionUntil) {
            keys.clear();
            stick.x = stick.y = 0;
            return;
        }
        let forward = (keys.has('w') || keys.has('arrowup') ? 1 : 0) - (keys.has('s') || keys.has('arrowdown') ? 1 : 0) - stick.y, right = (keys.has('d') ? 1 : 0) - (keys.has('a') ? 1 : 0) + stick.x;
        if (view === '3d') {
            if (keys.has('arrowleft'))
                player.yaw -= dt * 1.5;
            if (keys.has('arrowright'))
                player.yaw += dt * 1.5;
        }
        else if (view === '2d') {
            right += (keys.has('arrowright') ? 1 : 0) - (keys.has('arrowleft') ? 1 : 0);
        }
        let dx = 0, dz = 0, manual = Math.hypot(forward, right) > .08, moving = false, speed = keys.has('shift') ? 3.45 : 2.20;
        if (view !== 'investigate') {
            if (manual) {
                route = [];
                routeAction = null;
                const len = Math.max(1, Math.hypot(forward, right));
                forward /= len;
                right /= len;
                if (view === '3d') {
                    dx = (Math.sin(player.yaw) * forward + Math.cos(player.yaw) * right) * dt * speed;
                    dz = (-Math.cos(player.yaw) * forward + Math.sin(player.yaw) * right) * dt * speed;
                }
                else {
                    dx = right * dt * speed;
                    dz = -forward * dt * speed;
                    if (Math.hypot(dx, dz) > .001)
                        player.yaw = Math.atan2(dx, -dz);
                }
                moving = move(dx, dz);
            }
            else if (route.length) {
                const next = route[0], x = next[0] - player.pos[0], z = next[1] - player.pos[2], distance = Math.hypot(x, z);
                if (distance < .075) {
                    route.shift();
                }
                else {
                    const step = Math.min(distance, dt * speed);
                    dx = x / distance * step;
                    dz = z / distance * step;
                    player.yaw = Math.atan2(x, -z);
                    moving = move(dx, dz);
                    if (!moving) {
                        route = [];
                        routeAction = null;
                        G.toast('前方被挡住了，请选择另一条路线。');
                    }
                }
                if (!route.length && routeAction) {
                    const id = routeAction;
                    routeAction = null;
                    interact(id);
                }
            }
        }
        if (moving) {
            walkTime += dt * speed;
            if (time - lastStep > (speed > 3 ? .40 : .56)) {
                lastStep = time;
                ambient.event('step', Math.sin(walkTime * 3) * .15);
            }
        }
        player.pos[1] = 1.65 + (prefs.reduceMotion ? 0 : Math.sin(time * 1.45) * .007 + (moving ? Math.sin(walkTime * 8) * .025 : 0));
        if (G.prefs.scares && G.state.elapsed > nextScare) {
            nextScare = G.state.elapsed + 38 + Math.random() * 28;
            const lines = frightLines[currentRoom];
            triggerScare(lines[Math.floor(Math.random() * lines.length)]);
        }
        if (now - lastSavePosition > 3500) {
            savePosition();
            lastSavePosition = now;
        }
    }
    function frameLoop(now) {
        requestAnimationFrame(frameLoop);
        if (document.hidden) {
            lastTime = now;
            return;
        }
        const dt = Math.min((now - lastTime) / 1000, .05);
        lastTime = now;
        const time = now / 1000;
        update(dt, time);
        const playing = G.phase === 'playing';
        if (!G.prefs.scares || G.paused || G.phase === 'ending')
            ghostAmount = 0;
        else if (scareAt && now - scareAt < scareDuration) {
            const t = (now - scareAt) / scareDuration;
            ghostAmount = Math.sin(t * Math.PI) * .96;
        }
        else
            ghostAmount = 0;
        // The opening silhouette is small and static; it disappears with the scare setting.
        if (G.phase === 'title')
            ghostAmount = G.prefs.scares ? .74 : 0;
        if (renderer && (G.phase !== 'playing' || view === '3d')) {
            renderer.fear = ghostAmount;
            renderer.render(world, player, time, { flash: G.phase === 'title' ? 0 : G.flashlight ? 1 : 0, ghost: ghostAmount, power: !!G.state?.solved.power });
        }
        else if (playing && view === '2d')
            topdown.render(world, player, time, { flash: G.flashlight, ghost: ghostAmount, route, reduced: prefs.reduceMotion });
        if (playing && view !== 'investigate' && now - uiTime > 70) {
            updateMarkers();
            updateObjective();
            if (view === '3d' && innerWidth > 800)
                topdown.drawMini($('#miniMap'), world, player);
            uiTime = now;
        }
        frame++;
    }
    // Intercept only the added UI. Original puzzle delegation is unchanged.
    document.addEventListener('click', e => {
        const helpButton = e.target.closest('[data-action="help"]');
        if (helpButton) {
            e.preventDefault();
            e.stopImmediatePropagation();
            help();
            return;
        }
        const w = e.target.closest('[data-world]');
        if (w) {
            e.preventDefault();
            if (view === '2d') {
                const h = world.hotspots.find(h => h.id === w.dataset.world);
                if (h)
                    navigate(h.pos[0], h.pos[2], h.id);
            }
            else
                interact(w.dataset.world);
            return;
        }
        const b = e.target.closest('[data-shell]');
        if (!b)
            return;
        e.preventDefault();
        switch (b.dataset.shell) {
            case 'view':
                setView(b.dataset.view);
                break;
            case 'preview':
                preview(b.dataset.room);
                break;
            case 'settings':
                settings();
                break;
            case 'credits':
                credits();
                break;
            case 'interact':
                interact();
                break;
            case 'bag':
                showBag();
                break;
            case 'reset-position':
                resetPosition();
                break;
            case 'fullscreen':
                if (!document.fullscreenElement)
                    document.documentElement.requestFullscreen?.().catch(() => G.toast('浏览器未允许全屏；普通窗口仍可完整游玩。'));
                else
                    document.exitFullscreen?.();
                break;
        }
    }, true);
    document.addEventListener('change', e => { if (e.target.matches('[data-setting]')) {
        const n = e.target.dataset.setting;
        prefs[n] = e.target.type === 'checkbox' ? e.target.checked : e.target.type === 'range' ? Number(e.target.value) : e.target.value;
        storePrefs();
    } });
    document.addEventListener('input', e => { if (e.target.matches('input[type="range"][data-setting]')) {
        prefs[e.target.dataset.setting] = Number(e.target.value);
        storePrefs();
    } });
    document.addEventListener('keydown', e => {
        if (e.target.matches('input,textarea,select') || e.ctrlKey || e.metaKey || e.altKey)
            return;
        const k = e.key.toLowerCase();
        if (G.phase !== 'playing' || G.paused || G.modal)
            return;
        if (['1', '2', '3'].includes(k)) {
            e.preventDefault();
            e.stopImmediatePropagation();
            setView({ '1': '3d', '2': '2d', '3': 'investigate' }[k]);
            return;
        }
        if (k === 'e') {
            e.preventDefault();
            if (!e.repeat)
                interact();
            return;
        }
        if (k === 'b') {
            e.preventDefault();
            showBag();
            return;
        }
        if (['w', 'a', 's', 'd', 'shift', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k) && view !== 'investigate') {
            e.preventDefault();
            keys.add(k);
        }
    }, true);
    document.addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
    window.addEventListener('blur', () => { keys.clear(); stick.x = stick.y = 0; route = []; routeAction = null; });
    document.addEventListener('pointerlockchange', () => { const locked = document.pointerLockElement === $('#worldCanvas'); document.body.classList.toggle('pointer-locked', locked); if (!locked) {
        keys.clear();
        if (!pointerUnlockExpected && G.phase === 'playing' && !G.paused && !G.modal)
            G.showPause();
    } });
    document.addEventListener('pointerlockerror', () => { });
    document.addEventListener('mousemove', e => { if (document.pointerLockElement === $('#worldCanvas') && !G.modal && !G.paused && view === '3d') {
        player.yaw += e.movementX * .0024 * prefs.sensitivity;
        player.pitch = Math.max(-1.10, Math.min(1.10, player.pitch - e.movementY * .0024 * prefs.sensitivity));
    } });
    for (const canvas of [$('#worldCanvas'), $('#mapCanvas')]) {
        canvas.addEventListener('pointerdown', e => { if (G.phase !== 'playing' || G.modal || G.paused || document.pointerLockElement)
            return; if (e.pointerType === 'mouse' && e.button !== 0)
            return; drag = { id: e.pointerId, x: e.clientX, y: e.clientY, startX: e.clientX, startY: e.clientY, type: e.pointerType }; hasDrag = false; canvas.setPointerCapture(e.pointerId); });
        canvas.addEventListener('pointermove', e => { if (!drag || drag.id !== e.pointerId)
            return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) > 4)
            hasDrag = true; if (view === '3d') {
            const factor = (e.pointerType === 'touch' ? .0044 : .003) * prefs.sensitivity;
            player.yaw += dx * factor;
            player.pitch = Math.max(-1.1, Math.min(1.1, player.pitch - dy * factor));
        } drag.x = e.clientX; drag.y = e.clientY; });
        canvas.addEventListener('pointerup', e => { if (!drag || drag.id !== e.pointerId)
            return; const wasDragged = hasDrag, type = drag.type; drag = null; if (!wasDragged) {
            if (view === '2d') {
                const [x, z] = topdown.unproject(e.clientX, e.clientY);
                navigate(x, z);
            }
            else if (type === 'mouse')
                lockPointer();
        } canvas.releasePointerCapture?.(e.pointerId); });
        canvas.addEventListener('pointercancel', () => { drag = null; });
    }
    const joystick = $('#joystick');
    joystick.addEventListener('pointerdown', e => { if (G.modal || G.paused)
        return; e.preventDefault(); activeTouch = e.pointerId; joystick.setPointerCapture(e.pointerId); updateStick(e); });
    joystick.addEventListener('pointermove', e => { if (e.pointerId === activeTouch)
        updateStick(e); });
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture'])
        joystick.addEventListener(type, () => { activeTouch = null; stick.x = stick.y = 0; $('#joystickKnob').style.transform = 'translate(0,0)'; });
    function updateStick(e) { const r = joystick.getBoundingClientRect(), x = (e.clientX - r.left - r.width / 2) / (r.width * .33), y = (e.clientY - r.top - r.height / 2) / (r.height * .33), len = Math.max(1, Math.hypot(x, y)); stick.x = x / len; stick.y = y / len; $('#joystickKnob').style.transform = `translate(${stick.x * 24}px,${stick.y * 24}px)`; }
    window.addEventListener('ward:scene', () => { if (G.phase === 'playing') {
        if (G.state !== lastState)
            return;
        enterRoom(G.state.room);
    } });
    window.addEventListener('ward:modal', () => { exitPointer(); keys.clear(); route = []; routeAction = null; stick.x = stick.y = 0; savePosition(); });
    window.addEventListener('ward:scare', e => { if (G.prefs.scares)
        triggerScare(e.detail, 3.5); });
    window.addEventListener('ward:renderlost', () => { renderer = null; setView('2d', false); G.toast('3D 图形上下文丢失，已保留进度并切换为 2D。'); });
    window.addEventListener('resize', () => { renderer?.resize(); topdown.resize(); });
    window.addEventListener('pagehide', savePosition);
    window.addEventListener('beforeunload', () => { savePosition(); G.saveGame(); });
    $('#gameScreen .tools').insertAdjacentHTML('beforeend', '<button class="icon-btn" data-shell="bag" title="B：随身物品">' + G.icon('key') + '<span>物品</span></button>');
    renderCards();
    applyPrefs();
    preview('exit');
    setView(view, false);
    $('#engineStatus').textContent = renderer ? '原生 3D 监控信号已接入' : '2D / 调查模式可用';
    requestAnimationFrame(frameLoop);
    /** Read-only diagnostics plus normal public controls; useful to contributors and smoke tests. */
    S.app = { get view() { return view; }, get room() { return currentRoom; }, get player() { return player; }, get world() { return world; }, get renderer() { return renderer; }, get frame() { return frame; }, get route() { return route; }, get renderError() { return renderError; }, setView, preview, resetPosition, canStand, pathTo, interact, savePosition, enterRoom, triggerScare, get prefs() { return prefs; }, get topdown() { return topdown; } };
})();
