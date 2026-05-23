export class WindSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.windSpeed = 2;
    this.windDirection = 45;
    this.count = 300;
    this.running = false;
  }

  init() {
    this.resize();
    this.particles = [];
    for (let i = 0; i < this.count; i++) this.particles.push(this._spawn(true));
    this.running = true;
    this._loop();
    window.addEventListener('resize', () => this.resize());
  }

  _spawn(randomAge) {
    return {
      x: Math.random() * this.canvas.width,
      y: Math.random() * this.canvas.height,
      age: randomAge ? Math.random() * 100 : 0,
      maxAge: 30 + Math.random() * 140,
      speed: 0.2 + Math.random() * 2,
      px: 0, py: 0
    };
  }

  _loop() {
    if (!this.running) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const rad = (this.windDirection - 90) * Math.PI / 180;
    const spd = this.windSpeed * 0.55;
    const dx = Math.cos(rad) * spd;
    const dy = Math.sin(rad) * spd;

    for (const p of this.particles) {
      p.px = p.x;
      p.py = p.y;
      p.x += (dx + (Math.random() - 0.5) * 0.25) * p.speed;
      p.y += (dy + (Math.random() - 0.5) * 0.25) * p.speed;
      p.age++;

      if (p.age > p.maxAge || p.x < -20 || p.x > this.canvas.width + 20 || p.y < -20 || p.y > this.canvas.height + 20) {
        const n = this._spawn(false);
        if (dx > 0) n.x = -10; else if (dx < 0) n.x = this.canvas.width + 10;
        if (dy > 0) n.y = -10; else if (dy < 0) n.y = this.canvas.height + 10;
        if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) { n.x = Math.random() * this.canvas.width; n.y = Math.random() * this.canvas.height; }
        n.px = n.x; n.py = n.y;
        Object.assign(p, n);
        continue;
      }

      const life = 1 - p.age / p.maxAge;
      const alpha = life * 0.45 * Math.min(this.windSpeed / 4, 1);

      this.ctx.beginPath();
      this.ctx.moveTo(p.px, p.py);
      this.ctx.lineTo(p.x, p.y);
      this.ctx.strokeStyle = `rgba(141, 214, 255, ${alpha})`;
      this.ctx.lineWidth = 0.8 + life * 0.7;
      this.ctx.stroke();

      if (life > 0.75 && this.windSpeed > 3) {
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, 1.2, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(141, 214, 255, ${alpha * 0.5})`;
        this.ctx.fill();
      }
    }

    requestAnimationFrame(() => this._loop());
  }

  update(speed, direction) {
    this.windSpeed = speed;
    this.windDirection = direction;
  }

  resize() {
    const p = this.canvas.parentElement;
    if (!p) return;
    this.canvas.width = p.clientWidth;
    this.canvas.height = p.clientHeight;
  }

  destroy() { this.running = false; }
}
