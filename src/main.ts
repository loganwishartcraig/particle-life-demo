import "./style.css";

// Source: https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript
function splitmix32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x9e3779b9) | 0;
    let t = a ^ (a >>> 16);
    t = Math.imul(t, 0x21f0aaad);
    t = t ^ (t >>> 15);
    t = Math.imul(t, 0x735a2d97);
    return ((t = t ^ (t >>> 15)) >>> 0) / 4294967296;
  };
}

let currentSeed = Math.round(Date.now() * Math.random());

// Source: https://www.youtube.com/watch?v=scvuli-zcRc
function main(usedSeed: number) {
  let rng = splitmix32(usedSeed);
  console.log("source: https://www.youtube.com/watch?v=scvuli-zcRc");
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
  const m = Math.floor(7 * rng()) + 2;
  const matrix = Array.from({ length: m }, () =>
    Array.from({ length: m }, () => rng() * 2 - 1),
  );

  const frictionFactor = Math.pow(0.5, dt / fractionHalfLife);
  const forceFactor = 2;

  const colors = new Int32Array(n);
  const posX = new Float32Array(n);
  const posY = new Float32Array(n);
  const velX = new Float32Array(n);
  const velY = new Float32Array(n);
  const accX = new Float32Array(n);
  const accY = new Float32Array(n);

  const rows = Math.ceil(1 / rMax);
  const cols = Math.ceil(1 / rMax);
  const cells = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => new Set<number>()),
  );
  const binAdjustment = 1e-10;

  for (let i = 0; i < n; i++) {
    colors[i] = Math.floor(rng() * m);
    posX[i] = rng();
    posY[i] = rng();
    velX[i] = 0;
    velY[i] = 0;
    accX[i] = 0;
    accY[i] = 0;
    cells[Math.floor(posX[i] / rMax)][Math.floor(posY[i] / rMax)].add(i);
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

  function* neighbors(i: number) {
    const row = Math.floor(posX[i] / rMax);
    const col = Math.floor(posY[i] / rMax);

    for (let x = -1; x < 2; x++) {
      for (let y = -1; y < 2; y++) {
        const neighborRow = (row + x + rows) % rows;
        const neighborCol = (col + y + cols) % cols;

        for (const cell of cells[neighborRow][neighborCol]) {
          yield cell;
        }
      }
    }
  }

  function draw() {
    for (let i = 0; i < n; i++) {
      let totalForceX = 0;
      let totalForceY = 0;

      for (const j of neighbors(i)) {
        if (j === i) continue;
        const dx = posX[j] - posX[i];
        const dy = posY[j] - posY[i];

        const rx = Math.abs(dx) > 0.5 ? dx - (dx < 0 ? -1 : 1) : dx;
        const ry = Math.abs(dy) > 0.5 ? dy - (dy < 0 ? -1 : 1) : dy;

        const r = Math.hypot(rx, ry);
        if (r > 0 && r < rMax) {
          const f = force(r / rMax, matrix[colors[i]][colors[j]]);
          totalForceX += (rx / r) * f;
          totalForceY += (ry / r) * f;
        }
      }

      totalForceX *= rMax * forceFactor;
      totalForceY *= rMax * forceFactor;

      accX[i] = velX[i];
      accY[i] = velY[i];

      velX[i] *= frictionFactor;
      velY[i] *= frictionFactor;

      velX[i] += totalForceX * dt;
      velY[i] += totalForceY * dt;

      accX[i] = velX[i] - accX[i];
      accY[i] = velY[i] - accY[i];
    }

    for (let i = 0; i < n; i++) {
      cells[Math.floor(posX[i] / rMax - binAdjustment)][
        Math.floor(posY[i] / rMax - binAdjustment)
      ].delete(i);

      posX[i] = (((posX[i] + velX[i] * dt) % 1) + 1) % 1;
      posY[i] = (((posY[i] + velY[i] * dt) % 1) + 1) % 1;

      try {
        cells[Math.floor(posX[i] / rMax - binAdjustment)][
          Math.floor(posY[i] / rMax - binAdjustment)
        ].add(i);
      } catch (e) {
        console.warn(
          "failed to add ",
          i,
          posX[i],
          posY[i],
          Math.floor(posX[i] / rMax),
          Math.floor(posY[i] / rMax),
        );
        throw e;
      }
    }

    ctx!.fillStyle = "black";
    ctx!.fillRect(0, 0, canvas!.width, canvas!.height);

    const lightness = (i: number) => {
      const w = 0.013;
      const acc = Math.max(Math.min(Math.max(accY[i], accX[i]), w), -w);
      return (75 / (w * 2)) * (acc - w) + 100;
    };

    for (let i = 0; i < n; i++) {
      ctx!.beginPath();
      const screenX = posX[i] * canvas!.width;
      const screenY = posY[i] * canvas!.height;
      ctx!.arc(screenX, screenY, 1.25, 0, 2 * Math.PI);
      ctx!.fillStyle = `hsl(${(360 / m) * colors[i]}, 100%, ${lightness(i)}%)`;
      ctx!.fill();
    }

    if (usedSeed === currentSeed) {
      requestAnimationFrame(draw);
    } else {
      main(currentSeed);
    }
  }

  requestAnimationFrame(draw);
}

function handleResize() {
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

  ctx.canvas.width = window.innerWidth;
  ctx.canvas.height = window.innerHeight;
}

function debounce<Fn extends (...args: any[]) => any>(fn: Fn, wait: number) {
  let timerId: ReturnType<typeof setTimeout>;

  return function debounced(...args: Parameters<Fn>) {
    clearTimeout(timerId);
    timerId = setTimeout(() => {
      fn(...args);
    }, wait);
  };
}

window.addEventListener("resize", debounce(handleResize, 100));

const seedBtn = document.getElementById("seed-btn");

if (seedBtn) {
  seedBtn.innerText = currentSeed.toString();
  seedBtn.addEventListener("click", ({ target }) => {
    currentSeed = Math.round(Date.now() * Math.random());
    (target as HTMLButtonElement).innerText = currentSeed.toString();
  });
}

handleResize();
main(currentSeed);
