document.addEventListener('DOMContentLoaded', () => {
    // === 配置 ===
    // 2026年春节时间 (北京时间 2026-02-17)
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
            if(daysEl) daysEl.innerText = "00";
            if(hoursEl) hoursEl.innerText = "00";
            if(minsEl) minsEl.innerText = "00";
            if(secsEl) secsEl.innerText = "00";
            startCelebration();
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        if(daysEl) daysEl.innerText = days < 10 ? '0' + days : days;
        if(hoursEl) hoursEl.innerText = hours < 10 ? '0' + hours : hours;
        if(minsEl) minsEl.innerText = minutes < 10 ? '0' + minutes : minutes;
        if(secsEl) secsEl.innerText = seconds < 10 ? '0' + seconds : seconds;
    }

    const timerInterval = setInterval(updateCountdown, 1000);
    updateCountdown();

    // === 2. 视差效果 ===
    const layers = document.querySelectorAll('.layer');
    const container = document.getElementById('parallaxContainer');

    if (container) {
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
    }

    // === 3. 烟花系统 (Canvas) ===
    const canvas = document.getElementById('fireworksCanvas');
    const ctx = canvas.getContext('2d');
    const boomSound = document.getElementById('boomSound');
    
    // 初始化 Canvas 尺寸
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

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
        const colors = ['#D9381E', '#F2A900', '#FFD700', '#FF00FF', '#00FF00', '#ffffff'];
        const particleCount = 40; 
        
        // 播放音效
        if (boomSound) {
            const soundClone = boomSound.cloneNode();
            soundClone.volume = 0.5;
            soundClone.play().catch(() => {}); 
        }

        for (let i = 0; i < particleCount; i++) {
            const color = colors[Math.floor(Math.random() * colors.length)];
            particles.push(new Particle(x, y, color));
        }
    }

    function animate() {
        // 使用 destination-out 模式，让上一帧的内容变透明，而不是涂黑
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 恢复正常混合模式绘制新粒子
        ctx.globalCompositeOperation = 'source-over';

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

    // 点击交互 (因为没有控制按钮了，点击任意处都生成烟花)
    document.addEventListener('click', (e) => {
        createFirework(e.clientX, e.clientY);
    });

    // === 4. 自动庆祝逻辑 ===
    function startCelebration() {
        if (isCelebrating) return;
        isCelebrating = true;
        
        if(overlay) overlay.classList.remove('hidden');

        const autoFirework = setInterval(() => {
            const x = Math.random() * canvas.width;
            const y = Math.random() * (canvas.height / 2); 
            createFirework(x, y);
        }, 500);

        setTimeout(() => {
            clearInterval(autoFirework);
            if(overlay) overlay.classList.add('hidden');
            isCelebrating = false;
        }, 15000);
    }
});