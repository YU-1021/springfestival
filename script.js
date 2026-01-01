document.addEventListener('DOMContentLoaded', () => {
    // === 配置 ===
    // 2026年春节时间 (北京时间)
    const TARGET_DATE = new Date('2026-02-17T00:00:00+08:00').getTime();
    
    // === 1. 倒计时逻辑 ===
    const daysEl = document.getElementById('days');
    const hoursEl = document.getElementById('hours');
    const minsEl = document.getElementById('minutes');
    const secsEl = document.getElementById('seconds');
    const overlay = document.getElementById('celebrationOverlay');
    let isCelebrating = false;

    function updateCountdown() {
        const now = new Date().getTime();
        const distance = TARGET_DATE - now;

        if (distance < 0) {
            // 倒计时结束
            clearInterval(timerInterval);
            daysEl.innerText = "00";
            hoursEl.innerText = "00";
            minsEl.innerText = "00";
            secsEl.innerText = "00";
            startCelebration();
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        daysEl.innerText = days < 10 ? '0' + days : days;
        hoursEl.innerText = hours < 10 ? '0' + hours : hours;
        minsEl.innerText = minutes < 10 ? '0' + minutes : minutes;
        secsEl.innerText = seconds < 10 ? '0' + seconds : seconds;
    }

    const timerInterval = setInterval(updateCountdown, 1000);
    updateCountdown();

    // === 2. 视差效果 ===
    const layers = document.querySelectorAll('.layer');
    const container = document.getElementById('parallaxContainer');

    container.addEventListener('mousemove', (e) => {
        const x = (window.innerWidth - e.pageX * 2) / 100;
        const y = (window.innerHeight - e.pageY * 2) / 100;

        layers.forEach(layer => {
            const speed = layer.getAttribute('data-speed');
            const xOffset = x * speed * 100;
            const yOffset = y * speed * 100;
            layer.style.transform = `translate(${xOffset}px, ${yOffset}px)`;
        });
    });

    // === 3. 烟花系统 (Canvas) ===
    const canvas = document.getElementById('fireworksCanvas');
    const ctx = canvas.getContext('2d');
    const boomSound = document.getElementById('boomSound');
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });

    let particles = [];
    
    // 烟花粒子类
    class Particle {
        constructor(x, y, color) {
            this.x = x;
            this.y = y;
            this.color = color;
            // 爆炸扩散速度
            const angle = Math.random() * Math.PI * 2;
            const velocity = Math.random() * 6 + 2; 
            this.vx = Math.cos(angle) * velocity;
            this.vy = Math.sin(angle) * velocity;
            this.alpha = 1; // 透明度
            this.friction = 0.96; // 阻力
            this.gravity = 0.05;  // 重力
        }

        draw() {
            ctx.save();
            ctx.globalAlpha = this.alpha;
            ctx.beginPath();
            ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
            ctx.restore();
        }

        update() {
            this.vx *= this.friction;
            this.vy *= this.friction;
            this.vy += this.gravity;
            this.x += this.vx;
            this.y += this.vy;
            this.alpha -= 0.015; // 渐隐
        }
    }

    function createFirework(x, y) {
        const colors = ['#D9381E', '#F2A900', '#FFD700', '#FF00FF', '#00FF00'];
        const particleCount = 50; 
        
        // 播放音效 (克隆节点以支持并发播放)
        const soundClone = boomSound.cloneNode();
        // 只有用户交互过后才能播放声音
        soundClone.volume = 0.5;
        soundClone.play().catch(() => {}); 

        for (let i = 0; i < particleCount; i++) {
            const color = colors[Math.floor(Math.random() * colors.length)];
            particles.push(new Particle(x, y, color));
        }
    }

    function animate() {
        // 使用半透明填充实现拖尾效果
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 清除画布 (如果不需要拖尾，使用 clearRect)
        // ctx.clearRect(0, 0, canvas.width, canvas.height);

        particles.forEach((particle, index) => {
            if (particle.alpha > 0) {
                particle.update();
                particle.draw();
            } else {
                particles.splice(index, 1);
            }
        });

        requestAnimationFrame(animate);
    }

    animate();

    // 点击交互
    document.addEventListener('click', (e) => {
        // 只有点击非交互区域才放烟花
        if(e.target.tagName !== 'BUTTON' && e.target.closest('.audio-control') === null) {
            createFirework(e.clientX, e.clientY);
        }
    });

    // === 4. 自动庆祝逻辑 ===
    function startCelebration() {
        if (isCelebrating) return;
        isCelebrating = true;
        
        // 显示祝福语
        overlay.classList.remove('hidden');

        // 自动放烟花循环
        const autoFirework = setInterval(() => {
            const x = Math.random() * canvas.width;
            const y = Math.random() * (canvas.height / 2); // 上半部分
            createFirework(x, y);
        }, 500);

        // 15秒后停止密集烟花
        setTimeout(() => {
            clearInterval(autoFirework);
            overlay.classList.add('hidden'); // 隐藏祝福语
            isCelebrating = false;
        }, 15000);
    }

    // === 5. 背景音乐逻辑 ===
    const bgm = document.getElementById('bgm');
    const audioBtn = document.getElementById('audioBtn');
    let isPlaying = false;

    audioBtn.addEventListener('click', () => {
        if (isPlaying) {
            bgm.pause();
            audioBtn.innerHTML = "<span>🎵 开启音乐</span>";
        } else {
            bgm.play().then(() => {
                audioBtn.innerHTML = "<span>🔇 暂停音乐</span>";
            }).catch(e => console.log("Audio play failed:", e));
        }
        isPlaying = !isPlaying;
    });
});