export class WindSystem {
  constructor(canvas, map) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.map = map;
    this.particles = [];
    this.windSpeed = 2;
    this.windDirection = 45;
    this.count = 500;
    this.running = false;
  }

  init() {
    this.resize();
    this.particles = [];
    for (var i = 0; i < this.count; i++) {
      this.particles.push(this._spawn(true));
    }
    this.running = true;
    this._loop();
    var self = this;
    window.addEventListener('resize', function() { self.resize(); });
    if (this.map) {
      this.map.on('move', function() { self.resize(); });
      this.map.on('moveend', function() { self.resize(); });
    }
  }

  _spawn(randomAge) {
    var lng = 74.59; var lat = 42.87;
    var w = 0.2; var h = 0.2;
    if (this.map) {
      var b = this.map.getBounds();
      w = b.getEast() - b.getWest();
      h = b.getNorth() - b.getSouth();
      // Spawn slightly outside the screen to allow them to flow in
      lng = b.getWest() - w * 0.2 + Math.random() * w * 1.4;
      lat = b.getSouth() - h * 0.2 + Math.random() * h * 1.4;
    }
    
    return {
      lng: lng,
      lat: lat,
      age: randomAge ? Math.random() * 120 : 0,
      maxAge: 40 + Math.random() * 160,
      speedMult: 0.3 + Math.random() * 2.5,
      plng: lng,
      plat: lat,
      size: 0.8 + Math.random() * 1.8
    };
  }

  _loop() {
    if (!this.running) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Wind direction is meteorological (where wind comes FROM).
    // Angle to move TO in math radians:
    var rad = (270 - this.windDirection) * Math.PI / 180;
    
    // Convert speed to approximate degrees per frame (very small number)
    var baseSpd = this.windSpeed * 0.000008; 
    var dlat = Math.sin(rad) * baseSpd;
    var dlng = (Math.cos(rad) * baseSpd) / 0.733; // 0.733 is approx cos(42.8 deg)

    var bounds = this.map ? this.map.getBounds() : null;

    for (var i = 0; i < this.particles.length; i++) {
      var p = this.particles[i];
      p.plng = p.lng;
      p.plat = p.lat;
      
      // Add slight turbulence
      p.lng += (dlng + (Math.random() - 0.5) * 0.000002) * p.speedMult;
      p.lat += (dlat + (Math.random() - 0.5) * 0.000002) * p.speedMult;
      p.age++;

      // Check if out of bounds
      var outOfBounds = false;
      if (bounds) {
        if (p.lng < bounds.getWest() - 0.1 || p.lng > bounds.getEast() + 0.1 ||
            p.lat < bounds.getSouth() - 0.1 || p.lat > bounds.getNorth() + 0.1) {
            outOfBounds = true;
        }
      }

      if (p.age > p.maxAge || outOfBounds) {
        var n = this._spawn(false);
        Object.assign(p, n);
        continue;
      }

      if (!this.map) continue;

      var pos = this.map.project([p.lng, p.lat]);
      var prevPos = this.map.project([p.plng, p.plat]);

      // If behind camera, project might return huge negative/positive numbers
      if (Math.abs(pos.x) > 10000 || Math.abs(pos.y) > 10000) continue;

      var life = 1 - p.age / p.maxAge;
      var alpha = life * 0.65 * Math.min(this.windSpeed / 3, 1);
      var fadeIn = Math.min(p.age / 8, 1);
      alpha *= fadeIn;

      var angle = Math.atan2(pos.y - prevPos.y, pos.x - prevPos.x);
      var headLen = p.size * 3.5;

      this.ctx.beginPath();
      // Линия (тело стрелки)
      this.ctx.moveTo(prevPos.x, prevPos.y);
      this.ctx.lineTo(pos.x, pos.y);
      // Наконечник
      this.ctx.lineTo(pos.x - headLen * Math.cos(angle - Math.PI / 6), pos.y - headLen * Math.sin(angle - Math.PI / 6));
      this.ctx.moveTo(pos.x, pos.y);
      this.ctx.lineTo(pos.x - headLen * Math.cos(angle + Math.PI / 6), pos.y - headLen * Math.sin(angle + Math.PI / 6));

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
    if (this.canvas.width !== p.clientWidth || this.canvas.height !== p.clientHeight) {
      this.canvas.width = p.clientWidth;
      this.canvas.height = p.clientHeight;
    }
  }

  destroy() { 
    this.running = false; 
    this.particles = [];
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}
