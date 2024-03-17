import "./style.css";

function main() {
  const canvas = document.getElementById("canvas") as HTMLCanvasElement | null;
  if (!canvas) {
    console.error("No canvas found");
    return;
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    console.error("Unable to get ctx");
    return;
  }

  const n = 1200;
  const dt = 0.02;
  const fractionHalfLife = 0.04;
  const rMax = 0.1;
  const m = 6;
  const matrix = Array.from({ length: m }, () =>
    Array.from({ length: m }, () => Math.random() * 2 - 1),
  );

  const frictionFactor = Math.pow(0.5, dt / fractionHalfLife);
  const forceFactor = 10;

  const colors = new Int32Array(n);
  const posX = new Float32Array(n);
  const posY = new Float32Array(n);
  const velX = new Float32Array(n);
  const velY = new Float32Array(n);

  for (let i = 0; i < n; i++) {
    colors[i] = Math.floor(Math.random() * m);
    posX[i] = Math.random();
    posY[i] = Math.random();
    velX[i] = 0;
    velY[i] = 0;
  }

  function force(r: number, a: number) {
    const beta = 0.3;
    if (r < beta) {
      return r / beta - 1;
    } else if (beta < r && r < 1) {
      return a * (1 - Math.abs(2 * r - 1 - beta) / (1 - beta));
    }

    return 0;
  }

  function draw() {
    for (let i = 0; i < n; i++) {
      let totalForceX = 0;
      let totalForceY = 0;

      for (let j = 0; j < n; j++) {
        if (j === i) continue;
        const rx = posX[j] - posX[i];
        const ry = posY[j] - posY[i];
        const r = Math.hypot(rx, ry);
        if (r > 0 && r < rMax) {
          const f = force(r / rMax, matrix[colors[i]][colors[j]]);
          totalForceX += (rx / r) * f;
          totalForceY += (ry / r) * f;
        }
      }

      totalForceX *= rMax * forceFactor;
      totalForceY *= rMax * forceFactor;

      velX[i] *= frictionFactor;
      velY[i] *= frictionFactor;

      velX[i] += totalForceX * dt;
      velY[i] += totalForceY * dt;
    }

    for (let i = 0; i < n; i++) {
      posX[i] += velX[i] * dt;
      posY[i] += velY[i] * dt;
    }

    ctx!.fillStyle = "black";
    ctx!.fillRect(0, 0, canvas!.width, canvas!.height);

    for (let i = 0; i < n; i++) {
      ctx!.beginPath();
      const screenX = posX[i] * canvas!.width;
      const screenY = posY[i] * canvas!.height;
      ctx!.arc(screenX, screenY, 1, 0, 2 * Math.PI);
      ctx!.fillStyle = `hsl(${360 * (colors[i] / m)}, 100%, 50%)`;
      ctx!.fill();
    }

    requestAnimationFrame(draw);
  }

  requestAnimationFrame(draw);
}

main();
