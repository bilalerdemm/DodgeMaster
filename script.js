(() => {
  'use strict';
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const area = document.getElementById('gameArea');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const livesEl = document.getElementById('lives');
  const overlay = document.getElementById('overlay');
  const label = document.getElementById('overlayLabel');
  const title = document.getElementById('overlayTitle');
  const message = document.getElementById('overlayText');
  const startButton = document.getElementById('startButton');
  const keys = { left: false, right: false };
  const touches = { left: new Set(), right: new Set() };
  function clearControls() {
    keys.left = keys.right = false;
    touches.left.clear(); touches.right.clear();
  }
  let width = 0, height = 0, player, obstacles = [], score = 0, best = 0;
  let running = false, lastTime = 0, spawnTimer = 0, elapsed = 0;
  let lives = 3, invulnerable = 0;
  try { best = Number(localStorage.getItem('dodgeMasterBest')) || 0; } catch (_) { /* Oyun depolama olmadan da çalışır. */ }
  const format = value => String(Math.floor(value)).padStart(4, '0');
  bestEl.textContent = format(best);

  function resize() {
    const rect = area.getBoundingClientRect();
    width = rect.width; height = rect.height;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    if (player) { player.x = Math.max(0, Math.min(width - player.w, player.x)); player.y = height - 55; }
    for (const obstacle of obstacles) obstacle.x = Math.max(0, Math.min(width - obstacle.w, obstacle.x));
    draw();
  }
  function updateLives() {
    livesEl.setAttribute('aria-label', `${lives} can kaldı`);
    livesEl.querySelector('strong').innerHTML = Array.from({ length: 3 }, (_, i) => `<span class="${i < lives ? 'alive' : 'lost'}">♥</span>`).join(' ');
  }
  function reset() {
    score = 0; elapsed = 0; spawnTimer = 0; obstacles = [];
    lives = 3; invulnerable = 0; updateLives();
    player = { x: width / 2 - 17, y: height - 55, w: 34, h: 24, speed: 340 };
    clearControls(); scoreEl.textContent = format(score);
  }
  function start() {
    reset(); overlay.hidden = true; running = true; lastTime = 0;
    requestAnimationFrame(loop);
  }
  function end() {
    running = false; clearControls();
    if (score > best) { best = score; bestEl.textContent = format(best); try { localStorage.setItem('dodgeMasterBest', String(best)); } catch (_) {} }
    label.textContent = 'OYUN BİTTİ'; title.innerHTML = 'GAME <em>OVER</em>';
    message.textContent = `Skorun: ${format(score)} · En iyi skor: ${format(best)}`;
    startButton.innerHTML = 'TEKRAR OYNA <span>↗</span>'; overlay.hidden = false;
    startButton.focus();
  }
  function update(dt) {
    elapsed += dt;
    invulnerable = Math.max(0, invulnerable - dt);
    player.x += (((keys.right || touches.right.size) ? 1 : 0) - ((keys.left || touches.left.size) ? 1 : 0)) * player.speed * dt;
    player.x = Math.max(0, Math.min(width - player.w, player.x));
    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      const size = 20 + Math.random() * 22;
      obstacles.push({ x: Math.random() * Math.max(0, width - size), y: -size, w: size, h: size, speed: 130 + Math.min(elapsed * 3, 240) + Math.random() * 65, hue: Math.random() > .5 ? 'purple' : 'pink' });
      spawnTimer = Math.max(.27, .9 - elapsed * .008) * (.75 + Math.random() * .5);
    }
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i]; o.y += o.speed * dt;
      if (invulnerable <= 0 && player.x + 4 < o.x + o.w - 3 && player.x + player.w - 4 > o.x + 3 && player.y + 3 < o.y + o.h - 3 && player.y + player.h - 3 > o.y + 3) {
        lives--; updateLives();
        obstacles.splice(i, 1);
        if (lives === 0) { end(); return; }
        invulnerable = 1.5;
        continue;
      }
      if (o.y > height) { obstacles.splice(i, 1); score += 10; scoreEl.textContent = format(score); }
    }
  }
  function draw() {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#0b0d1d'; ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = 'rgba(121, 112, 209, .08)'; ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke(); }
    for (let y = 0; y < height; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); }
    ctx.fillStyle = 'rgba(69, 230, 255, .07)'; ctx.fillRect(0, height - 24, width, 1);
    for (const o of obstacles) {
      const color = o.hue === 'purple' ? '#ac72ff' : '#f879d8';
      ctx.save(); ctx.shadowBlur = 17; ctx.shadowColor = color; ctx.strokeStyle = color; ctx.fillStyle = o.hue === 'purple' ? '#39265e' : '#57294f'; ctx.lineWidth = 2;
      ctx.translate(o.x + o.w / 2, o.y + o.h / 2); ctx.rotate(Math.PI / 4); const s = o.w * .69; ctx.fillRect(-s / 2, -s / 2, s, s); ctx.strokeRect(-s / 2, -s / 2, s, s); ctx.restore();
    }
    if (player) {
      ctx.save();
      if (invulnerable > 0 && Math.floor(invulnerable * 8) % 2 === 0) ctx.globalAlpha = .3;
      ctx.shadowBlur = 20; ctx.shadowColor = '#45e6ff'; ctx.fillStyle = '#45e6ff';
      ctx.beginPath(); ctx.moveTo(player.x + player.w / 2, player.y); ctx.lineTo(player.x + player.w, player.y + player.h); ctx.lineTo(player.x + player.w / 2, player.y + player.h - 6); ctx.lineTo(player.x, player.y + player.h); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#e7ffff'; ctx.fillRect(player.x + player.w / 2 - 2, player.y + 9, 4, 6); ctx.restore();
    }
  }
  function loop(time) {
    if (!running) return;
    const dt = lastTime ? Math.min((time - lastTime) / 1000, .05) : 0; lastTime = time;
    update(dt); draw(); if (running) requestAnimationFrame(loop);
  }
  window.addEventListener('keydown', e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); keys[e.key === 'ArrowLeft' ? 'left' : 'right'] = true; } });
  window.addEventListener('keyup', e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); keys[e.key === 'ArrowLeft' ? 'left' : 'right'] = false; } });
  window.addEventListener('blur', clearControls);
  document.addEventListener('visibilitychange', () => { if (document.hidden) { clearControls(); lastTime = 0; } });
  for (const [id, direction] of [['leftButton', 'left'], ['rightButton', 'right']]) {
    const button = document.getElementById(id);
    button.addEventListener('pointerdown', e => { e.preventDefault(); touches[direction].add(e.pointerId); button.setPointerCapture(e.pointerId); });
    for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) button.addEventListener(event, e => { touches[direction].delete(e.pointerId); });
  }
  startButton.addEventListener('click', start);
  window.addEventListener('resize', resize);
  resize(); reset(); draw();
})();
