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
        n.x = Math.random() * this.canvas.width;
        n.y = Math.random() * this.canvas.height;
        n.px = n.x;
        n.py = n.y;
        Object.assign(p, n);
        continue;
      }

      var life = 1 - p.age / p.maxAge;
      var alpha = life * 0.65 * Math.min(this.windSpeed / 3, 1);
      var fadeIn = Math.min(p.age / 8, 1);
      alpha *= fadeIn;

      var angle = Math.atan2(p.y - p.py, p.x - p.px);
      var headLen = p.size * 3.5;

      this.ctx.beginPath();
      // Линия (тело стрелки)
      this.ctx.moveTo(p.px, p.py);
      this.ctx.lineTo(p.x, p.y);
      // Наконечник стрелки
      this.ctx.lineTo(p.x - headLen * Math.cos(angle - Math.PI / 6), p.y - headLen * Math.sin(angle - Math.PI / 6));
      this.ctx.moveTo(p.x, p.y);
      this.ctx.lineTo(p.x - headLen * Math.cos(angle + Math.PI / 6), p.y - headLen * Math.sin(angle + Math.PI / 6));

      this.ctx.strokeStyle = 'rgba(0, 229, 255, ' + alpha + ')';
      this.ctx.lineWidth = p.size;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
      this.ctx.stroke();
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
