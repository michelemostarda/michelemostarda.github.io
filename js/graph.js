(function() {

  var width, height, inverseScrollDepth, largeHeader, canvas, ctx, points,
    target, animateHeader = true;

  // Main
  //initHeader();
  //initAnimation();
  //addListeners();

  function initHeader() {
    width = window.innerWidth;
    height = window.innerHeight;
    inverseScrollDepth = 1;
    target = {
      x: width / 2,
      y: height / 2
    };

    largeHeader = document.getElementById('large-header');
    largeHeader.style.height = height + 'px';

    canvas = document.getElementById('graph-canvas');
    canvas.width = width;
    canvas.height = height;
    ctx = canvas.getContext('2d');

    // create points
    SAMPLING_SIZE = 15;
    points = [];
    for (var x = 0; x < width; x = x + width / SAMPLING_SIZE) {
      for (var y = 0; y < height; y = y + height / SAMPLING_SIZE) {
        var px = x + Math.random() * width / SAMPLING_SIZE;
        var py = y + Math.random() * height / SAMPLING_SIZE;
        var p = {
          x: px,
          originX: px,
          y: py,
          originY: py
        };
        points.push(p);
      }
    }

    // for each point find the N closest points
    var N_CLOSEST = 3;
    for (var i = 0; i < points.length; i++) {
      var closest = [];
      var p1 = points[i];
      for (var j = 0; j < points.length; j++) {
        var p2 = points[j]
        if (!(p1 == p2)) {
          var placed = false;
          for (var k = 0; k < N_CLOSEST; k++) {
            if (!placed) {
              if (closest[k] == undefined) {
                closest[k] = p2;
                placed = true;
              }
            }
          }

          for (var k = 0; k < N_CLOSEST; k++) {
            if (!placed) {
              if (getDistance(p1, p2) < getDistance(p1, closest[k])) {
                closest[k] = p2;
                placed = true;
              }
            }
          }
        }
      }
      p1.closest = closest;
    }

    // assign a circle to each point
    for (var i in points) {
      var c = new Circle(points[i], 2 + Math.random() * 5,
        'rgba(255,255,255,1.0)');
      points[i].circle = c;
    }
  }

  // Event handling
  function addListeners() {
    if (!('ontouchstart' in window)) {
      window.addEventListener('mousemove', mouseMove);
    }
    window.addEventListener('scroll', scrollCheck);
    window.addEventListener('resize', resize);
  }

  function mouseMove(e) {
    var posx = posy = 0;
    if (e.pageX || e.pageY) {
      posx = e.pageX;
      posy = e.pageY;
    } else if (e.clientX || e.clientY) {
      posx = e.clientX; //+ document.body.scrollLeft + document.documentElement.scrollLeft;
      posy = e.clientY; //+ document.body.scrollTop + document.documentElement.scrollTop;
    }
    target.x = posx;
    target.y = posy;
  }

  function scrollCheck() {
    //if (document.body.scrollTop > height * 2) animateHeader = false;
    //else animateHeader = true;
    scrollTop = $(window).scrollTop();
    winHeight = $(window).height();
    docHeight = $(document).height();
    max = docHeight - winHeight;
    if(scrollTop > max) {
      scrollTop = max;
    }
    inverseScrollDepth = 1 - scrollTop/max;
    // console.log('inverseScrollDepth: ' + inverseScrollDepth);

  }

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    largeHeader.style.height = height + 'px';
    canvas.width = width;
    canvas.height = height;
  }

  // animation
  function initAnimation() {
    animate();
    for (var i in points) {
      shiftPoint(points[i]);
    }
  }

  function animate() {
    if (animateHeader) {
      ctx.clearRect(0, 0, width, height);
      for (var i in points) {
        // detect points in range
        //console.log('POINT DIST: ' + getDistance(target, points[i]));
        if (Math.abs(getDistance(target, points[i])) < 250) {
          points[i].active = 0.4 * inverseScrollDepth;
          points[i].circle.active = 0.7 * inverseScrollDepth;
        } else if (Math.abs(getDistance(target, points[i])) < 1700) {
          points[i].active = 0.3 * inverseScrollDepth;
          points[i].circle.active = 0.4 * inverseScrollDepth;
        } else if (Math.abs(getDistance(target, points[i])) < 2000) {
          points[i].active = 0.2 * inverseScrollDepth;
          points[i].circle.active = 0.1 * inverseScrollDepth;
        } else {
          points[i].active = 0;
          points[i].circle.active = 0;
        }

        drawLines(points[i]);
        points[i].circle.draw();
      }
    }
    requestAnimationFrame(animate);
  }

  function shiftPoint(p) {
    TweenLite.to(p, 1 + 1 * Math.random(), {
      x: p.originX - 50 + Math.random() * 100,
      y: p.originY - 50 + Math.random() * 100,
      ease: Circ.easeInOut,
      onComplete: function() {
        shiftPoint(p);
      }
    });
  }

  // Canvas manipulation
  function drawLines(p) {
    if (p.active <= 0) return;
    for (var i in p.closest) {
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.closest[i].x, p.closest[i].y);
      ctx.strokeStyle = 'rgba(156,217,249,' + p.active + ')';
      //ctx.strokeStyle = 'rgba(156,217,249,0.7)';
      ctx.stroke();
    }
  }

  function Circle(pos, rad, color) {
    var _this = this;

    // constructor
    (function() {
      _this.pos = pos || null;
      _this.radius = rad || null;
      _this.color = color || null;
      _this.is_rect = Math.random() <= .3;
    })();

    this.draw = function() {
      if (_this.active <= 0) return;
      ctx.beginPath();
      if (this.is_rect) {
        ctx.arc(_this.pos.x, _this.pos.y, _this.radius, 0, 2 * Math.PI,
          false);
      } else {
        ctx.rect(_this.pos.x - _this.radius, _this.pos.y - _this.radius,
          _this.radius, _this.radius);
      }
      ctx.fillStyle = 'rgba(156,217,249,' + _this.active + ')';
      ctx.fill();
    };
  }

  // Util
  function getDistance(p1, p2) {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
  }

})();
