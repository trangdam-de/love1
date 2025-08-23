window.requestAnimationFrame =
window.__requestAnimationFrame ||
window.requestAnimationFrame ||
window.webkitRequestAnimationFrame ||
window.mozRequestAnimationFrame ||
window.oRequestAnimationFrame ||
window.msRequestAnimationFrame ||
(function () {
  return function (callback, element) {
    let lastTime = element.__lastTime;
    if (lastTime === undefined) {
      lastTime = 0;
    }
    let currTime = Date.now();
    let timeToCall = Math.max(1, 33 - (currTime - lastTime));
    window.setTimeout(callback, timeToCall);
    element.__lastTime = currTime + timeToCall;
  };
})();
window.isDevice = (/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(((navigator.userAgent || navigator.vendor || window.opera)).toLowerCase()));
let loaded = false;
let sparkleCountBase = window.isDevice ? 220 : 500; // Rất nhiều hạt lung linh
let init = function () {
if (loaded) return;
loaded = true;
let mobile = window.isDevice;
let koef = mobile ? 0.5 : 1;
let canvas = document.getElementById('heart');
let ctx = canvas.getContext('2d');
let width = canvas.width = koef * innerWidth;
let height = canvas.height = koef * innerHeight;
let rand = Math.random;
ctx.fillStyle = "rgba(0,0,0,1)";
ctx.fillRect(0, 0, width, height);

let heartPosition = function (rad) {
  //return [Math.sin(rad), Math.cos(rad)];
  // Tối ưu: lưu giá trị sin/cos vào biến tạm
  let sin = Math.sin(rad);
  let cos1 = Math.cos(rad);
  let cos2 = Math.cos(2 * rad);
  let cos3 = Math.cos(3 * rad);
  let cos4 = Math.cos(4 * rad);
  return [Math.pow(sin, 3), -(15 * cos1 - 5 * cos2 - 2 * cos3 - cos4)];
};
let scaleAndTranslate = function (pos, sx, sy, dx, dy) {
  return [dx + pos[0] * sx, dy + pos[1] * sy];
};

window.addEventListener('resize', function () {
  width = canvas.width = koef * innerWidth;
  height = canvas.height = koef * innerHeight;
  ctx.fillStyle = "rgba(0,0,0,1)";
  ctx.fillRect(0, 0, width, height);
});

let traceCount = mobile ? 90 : 190; // Trace dài hơn
let pointsOrigin = [];
let i;
let dr = mobile ? 0.3 : 0.1;
for (i = 0; i < Math.PI * 2; i += dr) pointsOrigin.push(scaleAndTranslate(heartPosition(i), 210, 13, 0, 0));
for (i = 0; i < Math.PI * 2; i += dr) pointsOrigin.push(scaleAndTranslate(heartPosition(i), 150, 9, 0, 0));
for (i = 0; i < Math.PI * 2; i += dr) pointsOrigin.push(scaleAndTranslate(heartPosition(i), 90, 5, 0, 0));
let heartPointsCount = pointsOrigin.length;

let targetPoints = [];
let pulse = function (kx, ky) {
  for (i = 0; i < pointsOrigin.length; i++) {
    targetPoints[i] = [];
    targetPoints[i][0] = kx * pointsOrigin[i][0] + width / 2;
    targetPoints[i][1] = ky * pointsOrigin[i][1] + height / 2;
  }
};

let e = [];
for (i = 0; i < heartPointsCount; i++) {
  let x = rand() * width;
  let y = rand() * height;
  e[i] = {
    vx: 0,
    vy: 0,
    R: 2,
    speed: rand() + 5,
    q: ~~(rand() * heartPointsCount),
    D: 2 * (i % 2) - 1,
    force: 0.2 * rand() + 0.7,
    f: "hsla(0," + ~~(40 * rand() + 60) + "%," + ~~(60 * rand() + 20) + "%,.3)",
    trace: []
  };
  for (let k = 0; k < traceCount; k++) e[i].trace[k] = { x: x, y: y };
}
let config = {
  traceK: 0.4,
  timeDelta: 0.01
};

// Thêm các hạt lấp lánh
let sparkles = [];
let sparkleCount = sparkleCountBase;
let heartTarget = { x: width/2, y: height/2 };
let explosion = false;
let explosionTime = 0;
let heartFormed = false;
let heartFormTime = 0;
let afterFlash = false;
let flashTime = 0;
let flashAlpha = 0;
let secondGathering = false;
let secondGatherStart = 0;
let connectors = [];
let morphToText = false;
let morphTextPointsI = [];
let morphTextPointsU = [];
let morphStartTime = 0;
const morphDuration = 1800; // ms
function resetSparkles() {
  sparkles = [];
  for (let i = 0; i < sparkleCount; i++) {
    let color = `hsla(${~~(360 * rand())},100%,85%,.95)`;
    sparkles.push({
      x: rand() * width,
      y: rand() * height,
      r: rand() * 2.2 + 1.2,
      dx: (rand() - 0.5) * 1.7,
      dy: (rand() - 0.5) * 1.7,
      color,
      targetX: heartTarget.x,
      targetY: heartTarget.y,
      arrived: false
    });
  }
}
resetSparkles();

let mouse = { x: width/2, y: height/2, active: false };
canvas.addEventListener('mousemove', function(e) {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
  mouse.active = true;
  // Tương tác chuột nâng cao: spawn pháo hoa khi rê chuột vào trái tim
  let dx = mouse.x - width/2;
  let dy = mouse.y - height/2;
  if (dx*dx + dy*dy < 180*180) {
    spawnFirework(mouse.x, mouse.y);
  }
});
canvas.addEventListener('mouseleave', function() {
  mouse.active = false;
});

let phase = "normal";
let phaseTime = 0;
let textPoints = [];
let weddingPoints = [];
function getTextPoints(text, fontSize, offsetX, offsetY) {
  // Tối ưu: chỉ tạo canvas phụ một lần
  if (!window._tempCanvas) {
    window._tempCanvas = document.createElement('canvas');
    window._tempCanvas.width = width;
    window._tempCanvas.height = height;
    window._tempCtx = window._tempCanvas.getContext('2d');
  }
  let tempCanvas = window._tempCanvas;
  let tempCtx = window._tempCtx;
  tempCtx.clearRect(0,0,width,height);
  tempCtx.font = `bold ${fontSize}px Arial`;
  tempCtx.textAlign = 'center';
  tempCtx.textBaseline = 'middle';
  tempCtx.fillText(text, width/2+offsetX, height/2+offsetY);
  let points = [];
  let imgData = tempCtx.getImageData(0,0,width,height).data;
  for (let y = 0; y < height; y += 6) {
    for (let x = 0; x < width; x += 6) {
      let idx = (y*width + x)*4;
      if (imgData[idx+3] > 128) points.push({x, y});
    }
  }
  return points;
}
function getWeddingPoints() {
  // Tạo hình cưới đơn giản: hai vòng tròn lồng vào nhau
  let points = [];
  let cx1 = width/2-60, cy1 = height/2;
  let cx2 = width/2+60, cy2 = height/2;
  let r = 50;
  for (let t = 0; t < Math.PI*2; t += 0.08) {
  let cost = Math.cos(t), sint = Math.sin(t);
  points.push({x: cx1 + cost*r, y: cy1 + sint*r});
  points.push({x: cx2 + cost*r, y: cy2 + sint*r});
  }
  // Thêm điểm trái tim nhỏ ở giữa
  for (let t = 0; t < Math.PI*2; t += 0.08) {
  let sint = Math.sin(t);
  let cos1 = Math.cos(t);
  let cos2 = Math.cos(2*t);
  let cos3 = Math.cos(3*t);
  let cos4 = Math.cos(4*t);
  let x = width/2 + Math.pow(sint,3)*30;
  let y = height/2 - (15*cos1-5*cos2-2*cos3-cos4);
    points.push({x, y});
  }
  return points;
}
  function getMorphTextPoints(text, fontSize = 60, offsetX = 0, offsetY = 0) {
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 400;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = `bold ${fontSize}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ff69b4';
  ctx.fillText(text, canvas.width / 2 + offsetX, canvas.height / 2 + offsetY);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const points = [];
  for (let y = 0; y < canvas.height; y += 4) {
    for (let x = 0; x < canvas.width; x += 4) {
      const idx = (y * canvas.width + x) * 4;
      if (imageData.data[idx + 3] > 128) {
        points.push({ x: x, y: y });
      }
    }
  }
  return points;
  }

let iPoints = [];
let uPoints = [];
function getCharPoints(char, fontSize, offsetX, offsetY) {
  return getTextPoints(char, fontSize, offsetX, offsetY);
}

// Đã bỏ chức năng click, không còn event mousedown và các hiệu ứng liên quan

// Hiệu ứng sao băng
let shootingStars = [];
function spawnShootingStar() {
  let angle = Math.random() * Math.PI * 2;
  let speed = 6 + Math.random() * 4;
  let x = Math.random() * width;
  let y = Math.random() * height * 0.5;
  shootingStars.push({x, y, dx: Math.cos(angle)*speed, dy: Math.sin(angle)*speed, life: 0});
}

// Hiệu ứng pháo hoa mini
let fireworks = [];
function spawnFirework(x, y) {
  for (let i = 0; i < 18; i++) {
    let angle = (i/18)*Math.PI*2;
    let speed = 2 + Math.random()*2;
    fireworks.push({x, y, dx: Math.cos(angle)*speed, dy: Math.sin(angle)*speed, life: 0, color: `hsla(${~~(Math.random()*360)},100%,70%,1)`});
  }
}

// Nâng cấp hiệu ứng sóng vụ nổ nhỏ hơn, lan tỏa vừa phải
let waves = [];
function spawnWave(centerX, centerY, color, maxR, speed, alpha) {
  // Thêm kiểu sóng xung kích nghệ thuật: hình trái tim, ellipse, polygon
  const waveShapes = ['heart', 'ellipse', 'polygon'];
  let shape = waveShapes[Math.floor(Math.random()*waveShapes.length)];
  waves.push({x: centerX, y: centerY, r: 30, color, maxR: Math.min(maxR, 120+Math.random()*40), speed: Math.max(1, speed*0.6), alpha: Math.min(alpha, 0.35+Math.random()*0.15), shape, disappear: false});
}
let showTime = 0;
let showDuration = 60; // 1 phút
let showPhase = 0;

let time = 0;
let loop = function () {
  let n = -Math.cos(time);
  pulse((1 + n) * .5, (1 + n) * .5);
  time += ((Math.sin(time)) < 0 ? 9 : (n > 0.8) ? .2 : 1) * config.timeDelta;
  showTime += config.timeDelta;
  // Vẽ nền vũ trụ lấp lánh
  ctx.fillStyle = "#0a0a1a";
  ctx.fillRect(0, 0, width, height);
  // Khôi phục lại nhiều ngôi sao nền lung linh, dùng shadowBlur nhẹ cho cả ngôi sao nhỏ
  for (let i = 0; i < 220; i++) { // Tăng số lượng sao nền
    let starX = rand() * width;
    let starY = rand() * height;
    let starR = rand() * 1.2 + 0.3;
    let starAlpha = rand() * 0.5 + 0.3;
    let starColor = `hsla(${~~(rand()*60+200)}, 60%, ${~~(rand()*30+50)}%, ${starAlpha})`;
    ctx.save();
    ctx.shadowColor = starColor;
    ctx.shadowBlur = starR > 1.2 ? 8 : 3;
    ctx.beginPath();
    ctx.arc(starX, starY, starR, 0, 2 * Math.PI);
    ctx.fillStyle = starColor;
    ctx.fill();
    ctx.restore();
  }
  // Gradient nền động tối màu vũ trụ
  let grad = ctx.createRadialGradient(width/2, height/2, 50, width/2, height/2, width/1.2);
  grad.addColorStop(0, `hsla(${(time*40)%360}, 60%, 20%, 0.5)`);
  grad.addColorStop(1, `hsla(${(time*40+120)%360}, 80%, 8%, 0.8)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Sao băng: thỉnh thoảng xuất hiện
  if (Math.random() < 0.01) spawnShootingStar();
  for (let i = shootingStars.length-1; i >= 0; i--) {
    let s = shootingStars[i];
    ctx.save();
    ctx.globalAlpha = 0.7 - s.life*0.07;
    ctx.strokeStyle = 'white';
    ctx.shadowColor = 'white';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(s.x-s.dx*8, s.y-s.dy*8);
    ctx.stroke();
    ctx.restore();
    s.x += s.dx;
    s.y += s.dy;
    s.life++;
    if (s.life > 20) shootingStars.splice(i,1);
  }

  // Pháo hoa mini: khi nổ trái tim
  for (let i = fireworks.length-1; i >= 0; i--) {
    let f = fireworks[i];
    ctx.save();
    ctx.globalAlpha = 0.8 - f.life*0.05;
    ctx.shadowColor = f.color;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(f.x, f.y, 2, 0, 2*Math.PI);
    ctx.fillStyle = f.color;
    ctx.fill();
    ctx.restore();
    f.x += f.dx;
    f.y += f.dy;
    f.life++;
    if (f.life > 18) fireworks.splice(i,1);
  }

  // Sóng ánh sáng quanh trái tim nâng cấp
  if (showTime < showDuration) {
    if (Math.random() < 0.03) {
      let hue = (time*60)%360;
      spawnWave(width/2, height/2, `hsla(${hue},100%,80%,0.3)`, 80+Math.random()*30, 1.2+Math.random()*0.5, 0.22+Math.random()*0.12);
    }
    // Tạo thêm sóng ở vị trí pháo hoa khi nổ
    if (explosion && Math.random()<0.1) {
      let hue = (time*60+120)%360;
      spawnWave(heartTarget.x, heartTarget.y, `hsla(${hue},100%,70%,0.25)`, 90, 1.5, 0.28);
    }
  }
  for (let i = waves.length-1; i >= 0; i--) {
    let w = waves[i];
    ctx.save();
    ctx.globalAlpha = w.alpha * (1-w.r/w.maxR);
    let grad = ctx.createRadialGradient(w.x, w.y, w.r*0.7, w.x, w.y, w.r);
    grad.addColorStop(0, 'rgba(255,255,255,0.18)');
    grad.addColorStop(0.5, w.color);
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.strokeStyle = grad;
    ctx.lineWidth = 2.2 + Math.sin(time*2+w.r*0.08)*1.2;
    ctx.shadowColor = w.color;
    ctx.shadowBlur = 18;
    // Vẽ sóng xung kích theo hình nghệ thuật
    if (w.shape === 'heart') {
      ctx.beginPath();
      for (let t = 0; t < Math.PI*2; t += 0.08) {
        let sint = Math.sin(t);
        let cos1 = Math.cos(t);
        let cos2 = Math.cos(2*t);
        let cos3 = Math.cos(3*t);
        let cos4 = Math.cos(4*t);
        let x = w.x + Math.pow(sint,3)*w.r;
        let y = w.y - (15*cos1-5*cos2-2*cos3-cos4)*w.r/60;
        if (t === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    } else if (w.shape === 'ellipse') {
      ctx.beginPath();
      for (let t = 0; t < Math.PI*2; t += 0.08) {
        let x = w.x + Math.cos(t)*w.r*1.1;
        let y = w.y + Math.sin(t)*w.r*0.7;
        if (t === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    } else if (w.shape === 'polygon') {
      ctx.beginPath();
      let sides = 6;
      for (let t = 0; t < Math.PI*2; t += Math.PI*2/sides) {
        let x = w.x + Math.cos(t)*w.r;
        let y = w.y + Math.sin(t)*w.r;
        if (t === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    }
    ctx.restore();
    w.r += w.speed;
    // Đợt sóng xung kích sẽ biến mất khi lan tỏa hết
    if (w.r > w.maxR) waves.splice(i,1);
  }

  // Kiểm tra tất cả các hạt đã quy tụ chưa
  let allArrived = true;
  for (let s of sparkles) {
    // Nếu chuột đang hoạt động, các hạt sẽ né chuột
    if (mouse.active) {
      let dxm = s.x - mouse.x;
      let dym = s.y - mouse.y;
      let dist2 = dxm*dxm + dym*dym;
      if (dist2 < 6400) {
        let dist = Math.sqrt(dist2);
        let angle = Math.atan2(dym, dxm);
        let force = (80 - dist) * 0.13;
        s.dx += Math.cos(angle) * force;
        s.dy += Math.sin(angle) * force;
      }
    }
    if (!s.arrived) {
    // Tăng tốc độ quy tụ, chuyển động mềm mại
    s.dx += (s.targetX - s.x) * 0.00135; // tăng gấp 3 lần
    s.dy += (s.targetY - s.y) * 0.00135;
    s.dx *= 0.87;
    s.dy *= 0.87;
    s.x += s.dx;
    s.y += s.dy;
    if (Math.abs(s.x - s.targetX) < 2 && Math.abs(s.y - s.targetY) < 2) {
      s.arrived = true;
    } else {
      allArrived = false;
    }
  }
  ctx.save();
  ctx.globalAlpha = 0.88 + Math.sin(time*2+s.x*0.01)*0.12;
  ctx.shadowColor = s.color;
  ctx.shadowBlur = s.r > 2.5 ? 13 : 6;
  ctx.beginPath();
  ctx.arc(s.x, s.y, s.r, 0, 2 * Math.PI);
  ctx.fillStyle = s.color;
  ctx.fill();
  ctx.restore();
  }

  // Khi tất cả các hạt đã quy tụ, bùng nổ hình trái tim
  if (allArrived && !explosion) {
    explosion = true;
    explosionTime = time;
    spawnFirework(heartTarget.x, heartTarget.y);
    // Vụ nổ xung kích trái tim lớn, gradient màu, nhiều vòng sóng
    for (let w = 0; w < 10; w++) {
      let hue = (time*60 + w*36)%360;
      spawnWave(
        heartTarget.x,
        heartTarget.y,
        `hsla(${hue},100%,90%,${0.38-w*0.03})`,
        200+w*32,
        4.2+w*0.9,
        0.48-w*0.03
      );
    }
  }
  if (explosion) {
    let t = time - explosionTime;
    // Trái tim co bóp phát sáng nghệ thuật
    let pulse = Math.sin(t * 4.5) * 0.18;
    let scale = 1 + Math.max(0, 1.3 - t*0.32) + pulse;
    ctx.save();
    ctx.globalAlpha = 0.85 - Math.min(t*0.13, 0.72);
    ctx.shadowColor = 'rgba(255,60,120,0.85)'; // shadow hồng đỏ
    ctx.shadowBlur = 38;
    for (let i = 0; i < pointsOrigin.length; i++) {
      let p = pointsOrigin[i];
      let px = heartTarget.x + p[0]*scale;
      let py = heartTarget.y + p[1]*scale;
      ctx.beginPath();
      ctx.arc(px, py, 4.5 + Math.max(0, 5.5 - t*1.3), 0, 2*Math.PI);
      // Gradient hồng đỏ động theo vị trí và thời gian
      let r = 255;
      let g = 60 + Math.floor(40*Math.sin(i+t*1.2));
      let b = 120 + Math.floor(30*Math.cos(i+t*0.8));
      ctx.fillStyle = `rgba(${r},${g},${b},0.92)`;
      ctx.fill();
    }
    ctx.restore();
    if (t > 6.5) {
      explosion = false;
      heartFormed = true;
      heartFormTime = time;
      for (let i = 0; i < sparkles.length; i++) {
        let idx = i % pointsOrigin.length;
        let p = pointsOrigin[idx];
        sparkles[i].targetX = heartTarget.x + p[0];
        sparkles[i].targetY = p[1] + heartTarget.y;
        sparkles[i].arrived = false;
      }
      // Chuẩn bị cho lần quy tụ thứ 2
      setTimeout(() => {
        secondGathering = true;
        secondGatherStart = time;
        connectors = [];
        for (let i = 0; i < sparkles.length; i++) {
          let s = sparkles[i];
          let angle = Math.random() * Math.PI * 2;
          let dist = 300 + Math.random()*200;
          let fromX = heartTarget.x + Math.cos(angle)*dist;
          let fromY = heartTarget.y + Math.sin(angle)*dist;
          connectors.push({fromX, fromY, toX: s.x, toY: s.y, progress: 0});
          s.x = fromX;
          s.y = fromY;
          s.targetX = heartTarget.x + pointsOrigin[i % pointsOrigin.length][0];
          s.targetY = heartTarget.y + pointsOrigin[i % pointsOrigin.length][1];
          s.arrived = false;
          s.dx = 0;
          s.dy = 0;
        }
      }, 1200);
    }
  }

  if (secondGathering) {
    let t2 = time - secondGatherStart;
    let allArrived2 = true;
    for (let i = 0; i < sparkles.length; i++) {
      let s = sparkles[i];
      s.dx += (s.targetX - s.x) * 0.00054; // tăng gấp 3 lần
      s.dy += (s.targetY - s.y) * 0.00054;
      s.dx *= 0.93;
      s.dy *= 0.93;
      s.x += s.dx;
      s.y += s.dy;
      if (Math.abs(s.x - s.targetX) < 2 && Math.abs(s.y - s.targetY) < 2) {
        s.arrived = true;
      } else {
        allArrived2 = false;
      }
      ctx.save();
      ctx.globalAlpha = 0.93;
      ctx.shadowColor = s.color;
      ctx.shadowBlur = s.r > 2.5 ? 10 : 5;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, 2 * Math.PI);
      ctx.fillStyle = s.color;
      ctx.fill();
      ctx.restore();
    }
    // Vẽ các đường nối tinh tú nghệ thuật
  // Bỏ connectors, không vẽ nữa
    // Khi tất cả đã quy tụ lần 2, bom flash trắng màn hình
    if (allArrived2 && t2 > 2.5 && !afterFlash) {
      // Bổ sung trace cho trái tim core để làm đầy trái tim trace
      let newTraceCount = mobile ? 90 : 190;
      for (let i = 0; i < e.length; i++) {
        let lastTrace = e[i].trace[e[i].trace.length-1];
        for (let k = e[i].trace.length; k < newTraceCount; k++) {
          // Bổ sung trace tại vị trí cuối cùng
          e[i].trace.push({x: lastTrace.x, y: lastTrace.y});
        }
      }
      afterFlash = true;
      flashTime = time;
      flashAlpha = 1.2;
    }
  }

  if (afterFlash) {
    let tf = time - flashTime;
  // Bom flash màu trắng đơn giản
  ctx.save();
  ctx.globalAlpha = Math.max(0, flashAlpha - tf*0.5); // 2s
  ctx.fillStyle = '#fff';
  ctx.fillRect(0,0,width,height);
  ctx.restore();
  // Hiện chữ 'Gửi Thanh Anh' fade in phía trên trái tim trace, font đẹp hiện đại lãng mạn, tăng khoảng cách
  let textAlpha = Math.min(1, tf/2);
  ctx.save();
  ctx.globalAlpha = textAlpha;
  ctx.font = `900 120px "Dancing Script", "Segoe Script", "Pacifico", "Arial"`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ff69b4';
  ctx.shadowColor = '#fff';
  ctx.shadowBlur = 22;
  ctx.fillText('Gửi Thanh Anh', width/2, heartTarget.y - 260); // tăng khoảng cách phía trên trái tim
  ctx.restore();
    if (flashAlpha - tf*0.5 <= 0.01 && !(morphTextPointsI.length && morphTextPointsU.length)) {
        afterFlash = false;
        heartFormed = false;
        morphStartTime = time;
        // Tính vị trí trái tim trace
        let heartLeft = heartTarget.x - 320;
        let heartRight = heartTarget.x + 320;
        let heartY = heartTarget.y;
        // Chữ I và U rõ hơn: font lớn, mật độ điểm cao
        morphTextPointsI = getMorphTextPoints("I", 260, -80, 0).map(pt => ({x: pt.x + heartLeft - 200, y: pt.y + heartY - 200}));
        morphTextPointsU = getMorphTextPoints("U", 260, 40, 0).map(pt => ({x: pt.x + heartRight - 200, y: pt.y + heartY - 200}));
        // Shuffle cho hiệu ứng lung linh
        for (let arr of [morphTextPointsI, morphTextPointsU]) {
          for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
          }
        }
      }
  }
  if (morphTextPointsI.length && morphTextPointsU.length) {
    // Morph sparkle vào chữ I và U theo vị trí trái/phải
    let elapsed = time - morphStartTime;
    let t = Math.min(1, elapsed * 1000 / morphDuration);
    let leftArr = [];
    let rightArr = [];
    for (let i = 0; i < sparkles.length; i++) {
        if (sparkles[i].x < heartTarget.x) leftArr.push(i);
        else rightArr.push(i);
    }
    for (let idx = 0; idx < leftArr.length && idx < morphTextPointsI.length; idx++) {
        let i = leftArr[idx];
        let target = morphTextPointsI[idx];
        sparkles[i].x += (target.x - sparkles[i].x) * 0.08 * t;
        sparkles[i].y += (target.y - sparkles[i].y) * 0.08 * t;
        sparkles[i].r = 2.5 + Math.sin(time * 12 + i) * 1.2;
        sparkles[i].color = '#ff69b4';
        ctx.save();
        ctx.globalAlpha = 0.92 + Math.sin(time*2+sparkles[i].x*0.01)*0.12;
        ctx.shadowColor = sparkles[i].color;
        ctx.shadowBlur = sparkles[i].r > 2.5 ? 13 : 6;
        ctx.beginPath();
        ctx.arc(sparkles[i].x, sparkles[i].y, sparkles[i].r, 0, 2 * Math.PI);
        ctx.fillStyle = sparkles[i].color;
        ctx.fill();
        ctx.restore();
    }
    for (let idx = 0; idx < rightArr.length && idx < morphTextPointsU.length; idx++) {
        let i = rightArr[idx];
        let target = morphTextPointsU[idx];
        sparkles[i].x += (target.x - sparkles[i].x) * 0.08 * t;
        sparkles[i].y += (target.y - sparkles[i].y) * 0.08 * t;
        sparkles[i].r = 2.5 + Math.sin(time * 12 + i) * 1.2;
        sparkles[i].color = '#ff69b4';
        ctx.save();
        ctx.globalAlpha = 0.92 + Math.sin(time*2+sparkles[i].x*0.01)*0.12;
        ctx.shadowColor = sparkles[i].color;
        ctx.shadowBlur = sparkles[i].r > 2.5 ? 13 : 6;
        ctx.beginPath();
        ctx.arc(sparkles[i].x, sparkles[i].y, sparkles[i].r, 0, 2 * Math.PI);
        ctx.fillStyle = sparkles[i].color;
        ctx.fill();
        ctx.restore();
    }
    // Khi morph xong, giữ nguyên vị trí và dừng hiệu ứng sau 10 giây
    if (t >= 1) {
      if (!window._morphEndTime) window._morphEndTime = time;
      if (time - window._morphEndTime > 10) {
        morphTextPointsI = [];
        morphTextPointsU = [];
        window._morphEndTime = undefined;
        return;
      }
    }
  }
  function showFinalHeart() {
    ctx.save();
    let grad = ctx.createRadialGradient(width/2, height/2, 60, width/2, height/2, width/2.1);
    grad.addColorStop(0, 'rgba(255,255,255,0.7)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,width,height);
    ctx.shadowColor = 'rgba(255,255,255,1)';
    ctx.shadowBlur = 38;
    for (let i = 0; i < pointsOrigin.length; i++) {
      let p = pointsOrigin[i];
      let px = heartTarget.x + p[0];
      let py = heartTarget.y + p[1];
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, 2*Math.PI);
      ctx.fillStyle = 'rgba(255,60,120,0.92)'; // hồng đỏ
      ctx.fill();
    }
    ctx.restore();
  }

  for (i = e.length; i--;) {
    var u = e[i];
    var q = targetPoints[u.q];
    var dx = u.trace[0].x - q[0];
    var dy = u.trace[0].y - q[1];
    var length = Math.sqrt(dx * dx + dy * dy);
    if (10 > length) {
      if (0.95 < rand()) {
        u.q = ~~(rand() * heartPointsCount);
      } else {
        if (0.99 < rand()) {
          u.D *= -1;
        }
        u.q += u.D;
        u.q %= heartPointsCount;
        if (0 > u.q) {
          u.q += heartPointsCount;
        }
      }
    }
    u.vx += -dx / length * u.speed;
    u.vy += -dy / length * u.speed;
    u.trace[0].x += u.vx;
    u.trace[0].y += u.vy;
    u.vx *= u.force;
    u.vy *= u.force;
    for (k = 0; k < u.trace.length - 1;) {
      let T = u.trace[k];
      let N = u.trace[++k];
      N.x -= config.traceK * (N.x - T.x);
      N.y -= config.traceK * (N.y - T.y);
    }
    // Hiệu ứng glow và đổi màu động cho trái tim
    // Batch vẽ các điểm nhỏ không dùng shadowBlur
    // Gradient hồng và xanh dương xen kẽ cho trace trái tim core
    for (k = 0; k < u.trace.length; k++) {
      let ratio = k / u.trace.length;
      // Chuyển dần từ hồng sang xanh dương
      let r = Math.round(255 * (1 - ratio) + 60 * ratio);
      let g = Math.round(60 * (1 - ratio) + 120 * ratio);
      let b = Math.round(180 * (1 - ratio) + 255 * ratio);
      ctx.fillStyle = `rgba(${r},${g},${b},0.8)`;
      ctx.fillRect(u.trace[k].x, u.trace[k].y, 2, 2);
    }
  }
  // Vẽ các điểm trái tim với glow trắng
  // Batch vẽ các điểm trái tim không dùng shadowBlur
  ctx.fillStyle = "rgba(255,255,255,1)";
  for (i = 0; i < targetPoints.length; i++) ctx.fillRect(targetPoints[i][0], targetPoints[i][1], 2, 2);

  // Hiệu ứng điện tâm đồ động
let ecgLines = [];
function spawnECG(centerY, amplitude, length, speed, color, thickness) {
  ecgLines.push({centerY, amplitude, length, speed, color, thickness, offset: 0, life: 0});
}
// Trong loop animation, sau nền vũ trụ:
// Vẽ điện tâm đồ động, biên độ và độ dày tăng dần theo thời gian
let ecgAmp = 22 + Math.min(time*2, 60);
let ecgThick = 2.2 + Math.min(time*0.2, 6);
if (Math.random() < 0.008) spawnECG(height/2 + Math.random()*80-40, ecgAmp, width+120, 6+Math.random()*2, '#3cf', ecgThick);
for (let i = ecgLines.length-1; i >= 0; i--) {
  let ecg = ecgLines[i];
  ctx.save();
  ctx.globalAlpha = 0.7 - ecg.life*0.04;
  ctx.strokeStyle = ecg.color;
  ctx.shadowColor = ecg.color;
  ctx.shadowBlur = 10;
  ctx.lineWidth = ecg.thickness;
  ctx.beginPath();
  let step = 7;
  let x0 = -ecg.offset;
  for (let x = x0; x < ecg.length; x += step) {
    let t = (x+ecg.offset)*0.018;
    let y = ecg.centerY + Math.sin(t)*ecg.amplitude + Math.sin(t*0.5)*ecg.amplitude*0.18;
    // Nhịp tim mạnh
    if (Math.abs((x+ecg.offset)%180-90)<12) y -= ecg.amplitude*1.2*Math.exp(-Math.abs((x+ecg.offset)%180-90)/8);
    if (x === x0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.restore();
  ecg.offset += ecg.speed;
  ecg.life++;
  if (ecg.offset > ecg.length+60 || ecg.life > 60) ecgLines.splice(i,1);
}

// Khi bom flash sáng, vẽ điện tâm đồ lớn đi qua giữa màn hình
if (afterFlash) {
  let tf = time - flashTime;
  if (tf < 1.8) {
    ctx.save();
    ctx.globalAlpha = 0.97;
    ctx.strokeStyle = '#ff69b4';
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 32;
    ctx.lineWidth = 14;
    ctx.beginPath();
    let step = 10;
    let centerY = height/2;
    let amplitude = 120;
    let length = width+120;
    let offset = tf*32;
    for (let x = -offset; x < length; x += step) {
      let t = (x+offset)*0.018;
      let y = centerY + Math.sin(t)*amplitude + Math.sin(t*0.5)*amplitude*0.18;
      if (Math.abs((x+offset)%180-90)<16) y -= amplitude*1.3*Math.exp(-Math.abs((x+offset)%180-90)/8);
      if (x === -offset) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
  }
}

  window.requestAnimationFrame(loop, canvas);
};
loop();
};

let s = document.readyState;
if (s === 'complete' || s === 'loaded' || s === 'interactive') init();
else document.addEventListener('DOMContentLoaded', init, false);