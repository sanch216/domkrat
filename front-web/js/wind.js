export class WindSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.windSpeed = 2;
    this.windDirection = 45;
    this.count = 500;
    this.running = false;
  }

  init() {
    this.resize();
    this.particles = [];
    for (var i = 0; i < this.count; i++) this.particles.push(this._spawn(true));
    this.running = true;
    this._loop();
    var self = this;
    window.addEventListener('resize', function() { self.resize(); });
  }

  _spawn(randomAge) {
    return {
      x: Math.random() * this.canvas.width,
      y: Math.random() * this.canvas.height,
      age: randomAge ? Math.random() * 120 : 0,
      maxAge: 40 + Math.random() * 160,
      speed: 0.3 + Math.random() * 2.5,
      px: 0,
      py: 0,
      size: 0.8 + Math.random() * 1.8
    };
  }

  _loop() {
    if (!this.running) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    var rad = (this.windDirection - 90) * Math.PI / 180;
    var spd = this.windSpeed * 0.6;
    var dx = Math.cos(rad) * spd;
    var dy = Math.sin(rad) * spd;

    for (var i = 0; i < this.particles.length; i++) {
      var p = this.particles[i];
      p.px = p.x;
      p.py = p.y;
      p.x += (dx + (Math.random() - 0.5) * 0.3) * p.speed;
      p.y += (dy + (Math.random() - 0.5) * 0.3) * p.speed;
      p.age++;

      if (p.age > p.maxAge || p.x < -30 || p.x > this.canvas.width + 30 || p.y < -30 || p.y > this.canvas.height + 30) {
        var n = this._spawn(false);
        if (dx > 0) n.x = -15; else if (dx < 0) n.x = this.canvas.width + 15;
        if (dy > 0) n.y = -15; else if (dy < 0) n.y = this.canvas.height + 15;
        if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) {
          n.x = Math.random() * this.canvas.width;
          n.y = Math.random() * this.canvas.height;
        }
        n.px = n.x;
        n.py = n.y;
        Object.assign(p, n);
        continue;
      }

      var life = 1 - p.age / p.maxAge;
      var alpha = life * 0.65 * Math.min(this.windSpeed / 3, 1);
      var fadeIn = Math.min(p.age / 8, 1);
      alpha *= fadeIn;

      this.ctx.beginPath();
      this.ctx.moveTo(p.px, p.py);
      this.ctx.lineTo(p.x, p.y);
      this.ctx.strokeStyle = 'rgba(0, 229, 255, ' + alpha + ')';
      this.ctx.lineWidth = p.size;
      this.ctx.lineCap = 'round';
      this.ctx.stroke();

      if (life > 0.4 && this.windSpeed > 1.5) {
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size * 0.9, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(0, 229, 255, ' + (alpha * 0.6) + ')';
        this.ctx.fill();
      }

      if (life > 0.7 && p.speed > 1.8) {
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(0, 229, 255, ' + (alpha * 0.12) + ')';
        this.ctx.fill();
      }
    }

    var self = this;
    requestAnimationFrame(function() { self._loop(); });
  }

  update(speed, direction) {
    this.windSpeed = speed;
    this.windDirection = direction;
  }

  resize() {
    var p = this.canvas.parentElement;
    if (!p) return;
    this.canvas.width = p.clientWidth;
    this.canvas.height = p.clientHeight;
  }

  destroy() { this.running = false; }
}
