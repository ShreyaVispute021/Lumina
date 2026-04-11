// ── Socket ──
const socket = io();

let username = '';
let currentRoom = '';
let typingTimeout = null;

// ── Join Room ──
function joinRoom() {
    username = document.getElementById('username').value.trim();
    currentRoom = document.getElementById('room').value.trim();
    if (!username || !currentRoom) {
        shake(document.querySelector('.join-card'));
        return;
    }

    socket.emit('joinRoom', currentRoom);

    // Update UI
    document.getElementById('join-screen').style.display = 'none';
    const cs = document.getElementById('chat-screen');
    cs.style.display = 'flex';

    document.getElementById('header-room').textContent = currentRoom;
    document.getElementById('sidebar-room-name').textContent = currentRoom;
    document.getElementById('sidebar-username').textContent = username;
    document.getElementById('user-avatar').textContent = username[0].toUpperCase();

    document.getElementById('msg-input').focus();
}

// ── Send Message ──
function sendMessage() {
    const input = document.getElementById('msg-input');
    const text = input.value.trim();
    if (!text) return;

    socket.emit('sendMessage', { room: currentRoom, user: username, text });
    addMessage(username, text, true);
    input.value = '';
    input.focus();
    socket.emit('stopTyping', currentRoom);
}

// ── Typing ──
function handleTyping() {
    socket.emit('typing', { room: currentRoom, user: username });
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => socket.emit('stopTyping', currentRoom), 1800);
}

// ── Socket events ──
socket.on('message', ({ user, text, type }) => {
    if (type === 'system') {
        addSystemMessage(text);
    } else if (user !== username) {
        addMessage(user, text, false);
    }
});

socket.on('userCount', (count) => {
    const el = document.getElementById('online-count');
    if (el) el.textContent = `${count} online`;
});

socket.on('typing', ({ user: typer }) => {
    if (typer === username) return;
    const el = document.getElementById('typing-wrap');
    el.innerHTML = `<div class="typing-dots"><span></span><span></span><span></span></div><span>${escapeHTML(typer)} is typing…</span>`;
});

socket.on('stopTyping', () => {
    document.getElementById('typing-wrap').innerHTML = '';
});

// ── DOM helpers ──
function addMessage(user, text, isMine) {
    const msgs = document.getElementById('messages');
    const div = document.createElement('div');
    div.className = 'msg' + (isMine ? ' mine' : '');

    const initials = user[0].toUpperCase();
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    div.innerHTML = `
    <div class="msg-avatar">${initials}</div>
    <div class="msg-body">
      ${!isMine ? `<div class="msg-name">${escapeHTML(user)}</div>` : ''}
      <div class="msg-bubble">${escapeHTML(text)}</div>
      <div class="msg-time">${time}</div>
    </div>
  `;

    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
}

function addSystemMessage(text) {
    const msgs = document.getElementById('messages');
    const div = document.createElement('div');
    div.className = 'msg system';
    div.innerHTML = `<div class="msg-bubble">${escapeHTML(text)}</div>`;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
}

function escapeHTML(str) {
    const d = document.createElement('div');
    d.appendChild(document.createTextNode(str));
    return d.innerHTML;
}

function shake(el) {
    el.style.animation = 'none';
    el.offsetHeight;
    el.style.animation = 'shake 0.4s ease';
}

// ── Background particle canvas ──
(function () {
    const canvas = document.getElementById('bg-canvas');
    const ctx = canvas.getContext('2d');
    let W, H, particles = [];

    function resize() {
        W = canvas.width = window.innerWidth;
        H = canvas.height = window.innerHeight;
    }

    function Particle() {
        this.x = Math.random() * W;
        this.y = Math.random() * H;
        this.r = Math.random() * 1.5 + 0.3;
        this.vx = (Math.random() - 0.5) * 0.3;
        this.vy = (Math.random() - 0.5) * 0.3;
        this.alpha = Math.random() * 0.5 + 0.1;
        this.color = Math.random() > 0.5 ? '192,132,252' : '56,189,248';
    }

    Particle.prototype.update = function () {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0) this.x = W;
        if (this.x > W) this.x = 0;
        if (this.y < 0) this.y = H;
        if (this.y > H) this.y = 0;
    };

    Particle.prototype.draw = function () {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.color},${this.alpha})`;
        ctx.fill();
    };

    resize();
    for (let i = 0; i < 90; i++) particles.push(new Particle());
    window.addEventListener('resize', resize);

    function loop() {
        ctx.clearRect(0, 0, W, H);
        particles.forEach(p => { p.update(); p.draw(); });
        // Draw connecting lines between close particles
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 90) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(192,132,252,${0.06 * (1 - dist / 90)})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        }
        requestAnimationFrame(loop);
    }
    loop();
})();

// ── Shake keyframe (injected once) ──
const style = document.createElement('style');
style.textContent = `@keyframes shake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-8px)} 40%,80%{transform:translateX(8px)} }`;
document.head.appendChild(style);