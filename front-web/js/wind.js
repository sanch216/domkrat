export class WindSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.windSpeed = 2;
    this.windDirection = 45;
    this.count = 250;
    this.running = false;
  }

  init() {
    this.resize();
    this.particles = [];
    for (let i = 0; i < this.count; i++) {
      this.particles.push(this._create());
    }
    this.running = true;
    this._loop();
    window.addEventListener('resize', () => this.resize());
  }

  _create() {
    return {
      x: Math.random() * this.canvas.width,
      y: Math.random() * this.canvas.height,
      age: Math.random() * 80,
      maxAge: 40 + Math.random() * 120,
      speed: 0.3 + Math.random() * 1.8,
      prevX: 0,
      prevY: 0
    };
  }

  _loop() {
    if (!this.running) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const rad = (this.windDirection - 90) * Math.PI / 180;
    const baseSpeed = this.windSpeed * 0.6;
    const dx = Math.cos(rad) * baseSpeed;
    const dy = Math.sin(rad) * baseSpeed;

    for (const p of this.particles) {
      p.prevX = p.x;
      p.prevY = p.y;

      const turbX = (Math.random() - 0.5) * 0.3;
      const turbY = (Math.random() - 0.5) * 0.3;

      p.x += (dx + turbX) * p.speed;
      p.y += (dy + turbY) * p.speed;
      p.age++;

      if (p.age > p.maxAge || p.x < -10 || p.x > this.canvas.width + 10 || p.y < -10 || p.y > this.canvas.height + 10) {
        Object.assign(p, this._create());
        if (Math.random() > 0.5) {
          if (dx > 0) p.x = -5;
          else if (dx < 0) p.x = this.canvas.width + 5;
          if (dy > 0) p.y = -5;
          else if (dy < 0) p.y = this.canvas.height + 5;
        }
        p.prevX = p.x;
        p.prevY = p.y;
        continue;
      }

      const life = 1 - (p.age / p.maxAge);
      const alpha = life * 0.5 * Math.min(this.windSpeed / 5, 1);

      this.ctx.beginPath();
      this.ctx.moveTo(p.prevX, p.prevY);
      this.ctx.lineTo(p.x, p.y);
      this.ctx.strokeStyle = `rgba(171, 255, 132, ${alpha})`;
      this.ctx.lineWidth = 1 + life * 0.8;
      this.ctx.stroke();

      if (life > 0.7 && this.windSpeed > 3) {
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(10, 228, 72, ${alpha * 0.6})`;
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
    const parent = this.canvas.parentElement;
    if (!parent) return;
    this.canvas.width = parent.clientWidth;
    this.canvas.height = parent.clientHeight;
  }

  destroy() {
    this.running = false;
  }
}
