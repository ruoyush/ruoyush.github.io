(function () {
  // === GPU Particle Animation ===
  var canvas = document.getElementById('particle-canvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');

  var CELL = 28;
  var BLOCK = 4;
  var cols, rows;
  var time = 0;
  var mouse = { x: null, y: null };
  var dataStreams = [];

  var palette = [
    { r: 0, g: 229, b: 255 },
    { r: 79, g: 195, b: 247 },
    { r: 100, g: 255, b: 218 }
  ];

  function rgba(ci, a) {
    var c = palette[ci] || palette[0];
    return 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + a + ')';
  }

  function resize() {
    canvas.width = canvas.parentElement.offsetWidth;
    canvas.height = canvas.parentElement.offsetHeight;
    cols = Math.ceil(canvas.width / CELL) + 1;
    rows = Math.ceil(canvas.height / CELL) + 1;
    initStreams();
  }

  function initStreams() {
    dataStreams = [];
    var laneGap = CELL * 2;
    var numLanes = Math.floor(canvas.height / laneGap);
    for (var lane = 0; lane < numLanes; lane++) {
      var y = lane * laneGap + CELL;
      var speed = 0.8 + (lane % 4) * 0.35;
      var ci = lane % 3;
      var count = 4 + Math.floor(Math.random() * 5);
      for (var i = 0; i < count; i++) {
        dataStreams.push({
          x: Math.random() * (canvas.width + 200) - 100,
          y: y, speed: speed, size: 2 + Math.random() * 1.2,
          ci: ci, trail: 14 + Math.random() * 10
        });
      }
    }
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    time += 0.008;

    for (var c = 0; c < cols; c++) {
      for (var r = 0; r < rows; r++) {
        var x = c * CELL, y = r * CELL;
        var bx = Math.floor(c / BLOCK), by = Math.floor(r / BLOCK);
        var ci = (bx + by) % 3;
        var phase = bx * 0.55 + by * 0.35;
        var wave = Math.sin(time * 3 - phase);
        var act = Math.max(0, (wave - 0.4) / 0.6);
        var mBoost = 0;
        if (mouse.x !== null) {
          var dx = x - mouse.x, dy = y - mouse.y;
          var d = Math.sqrt(dx * dx + dy * dy);
          if (d < 130) mBoost = (1 - d / 130) * 0.7;
        }
        var total = Math.min(1, act * 0.45 + mBoost);
        var alpha = 0.06 + total * 0.55;
        var dot = 1.2 + total * 1.2;
        ctx.fillStyle = rgba(ci, alpha);
        ctx.fillRect(x - dot, y - dot, dot * 2, dot * 2);
        if (total > 0.18) {
          var la = total * 0.18;
          ctx.strokeStyle = rgba(ci, la);
          ctx.lineWidth = 0.6;
          if (c % BLOCK !== BLOCK - 1 && c + 1 < cols) {
            ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + CELL, y); ctx.stroke();
          }
          if (r % BLOCK !== BLOCK - 1 && r + 1 < rows) {
            ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + CELL); ctx.stroke();
          }
        }
      }
    }

    ctx.setLineDash([3, 5]);
    ctx.lineWidth = 0.4;
    var blockW = BLOCK * CELL;
    for (var bx = 1; bx < Math.ceil(cols / BLOCK); bx++) {
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.beginPath(); ctx.moveTo(bx * blockW, 0); ctx.lineTo(bx * blockW, canvas.height); ctx.stroke();
    }
    for (var by = 1; by < Math.ceil(rows / BLOCK); by++) {
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.beginPath(); ctx.moveTo(0, by * blockW); ctx.lineTo(canvas.width, by * blockW); ctx.stroke();
    }
    ctx.setLineDash([]);

    for (var i = 0; i < dataStreams.length; i++) {
      var p = dataStreams[i];
      p.x += p.speed;
      if (p.x > canvas.width + 60) p.x = -60;
      ctx.strokeStyle = rgba(p.ci, 0.18);
      ctx.lineWidth = p.size * 0.5;
      ctx.beginPath(); ctx.moveTo(p.x - p.trail, p.y); ctx.lineTo(p.x, p.y); ctx.stroke();
      ctx.fillStyle = rgba(p.ci, 0.1);
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = rgba(p.ci, 0.75);
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size * 0.9, 0, Math.PI * 2); ctx.fill();
      if (mouse.x !== null) {
        var dx = p.x - mouse.x, dy = p.y - mouse.y;
        var d = Math.sqrt(dx * dx + dy * dy);
        if (d < 120) {
          ctx.strokeStyle = rgba(p.ci, 0.12 * (1 - d / 120));
          ctx.lineWidth = 0.5;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        }
      }
    }
    requestAnimationFrame(animate);
  }

  canvas.addEventListener('mousemove', function (e) {
    var rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });
  canvas.addEventListener('mouseleave', function () { mouse.x = null; mouse.y = null; });
  window.addEventListener('resize', function () { resize(); });
  resize();
  animate();

  // === Section Card Wrapping ===
  var wrapper = document.querySelector('.content-wrapper');
  if (!wrapper) return;
  var children = Array.prototype.slice.call(wrapper.children);
  var fragment = document.createDocumentFragment();
  var bioCard = document.createElement('div');
  bioCard.className = 'bio-card';
  bioCard.id = 'about';
  var currentCard = null;
  var hitH2 = false;
  var sectionIds = ['news', 'publications', 'teaching', 'education', 'experience'];
  var sectionIdx = 0;

  children.forEach(function (child) {
    if (child.tagName === 'H2') {
      if (!hitH2) {
        fragment.appendChild(bioCard);
        hitH2 = true;
      }
      currentCard = document.createElement('div');
      currentCard.className = 'section-card';
      if (sectionIdx < sectionIds.length) {
        currentCard.id = sectionIds[sectionIdx++];
      }
      currentCard.appendChild(child);
      fragment.appendChild(currentCard);
    } else if (currentCard) {
      currentCard.appendChild(child);
    } else {
      bioCard.appendChild(child);
    }
  });

  if (!hitH2) fragment.appendChild(bioCard);
  wrapper.innerHTML = '';
  wrapper.appendChild(fragment);

  // === Side Nav: Visibility + Scroll Spy ===
  var sideNav = document.getElementById('side-nav');
  var hero = document.querySelector('.hero');
  if (!sideNav || !hero) return;

  var navLinks = sideNav.querySelectorAll('a[href^="#"]');
  var sections = [];
  navLinks.forEach(function (link) {
    var id = link.getAttribute('href').substring(1);
    var el = document.getElementById(id);
    if (el) sections.push({ el: el, link: link });
  });

  function updateNav() {
    var heroBottom = hero.getBoundingClientRect().bottom;
    if (heroBottom < 80) {
      sideNav.classList.add('visible');
    } else {
      sideNav.classList.remove('visible');
    }

    var current = null;
    var offset = window.innerHeight * 0.35;
    sections.forEach(function (s) {
      var rect = s.el.getBoundingClientRect();
      if (rect.top < offset) current = s;
    });
    navLinks.forEach(function (l) { l.classList.remove('active'); });
    if (current) current.link.classList.add('active');
  }

  window.addEventListener('scroll', updateNav, { passive: true });
  updateNav();

  navLinks.forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      var id = this.getAttribute('href').substring(1);
      var target = document.getElementById(id);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
})();
