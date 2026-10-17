// Raspadita de la fecha (la misma de la invitación de Alma Jazmín): una capa plateada
// tapa la fecha, se borra deslizando el dedo y frena el scroll hasta descubrirla.
(() => {
  const dateSection = document.querySelector(".date-panel");
  const dateReveal = document.getElementById("dateReveal");
  const dateRevealCanvas = document.getElementById("dateRevealCanvas");
  const dateRevealButton = document.getElementById("dateRevealButton");
  const dateMagic = document.getElementById("dateMagic");
  if (!dateSection || !dateReveal) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const dateRevealStorageKey = "juan-cruz-date-revealed-v1";
  let dateWasRevealed = false;

  try {
    dateWasRevealed = sessionStorage.getItem(dateRevealStorageKey) === "true";
  } catch {
    dateWasRevealed = false;
  }

  let dateScrollUnlocked = dateWasRevealed;
  let isClampingDateScroll = false;
  let touchStartY = null;

  const getDateGateTop = () => Math.round(dateSection.getBoundingClientRect().top + window.scrollY);
  const isAtDateGate = () => window.scrollY >= getDateGateTop() - 2;

  function clampDateScroll() {
    if (dateScrollUnlocked || isClampingDateScroll) return;
    const dateGateTop = getDateGateTop();
    if (window.scrollY <= dateGateTop) return;
    isClampingDateScroll = true;
    window.scrollTo(0, dateGateTop);
    requestAnimationFrame(() => {
      isClampingDateScroll = false;
    });
  }

  window.addEventListener("scroll", clampDateScroll, { passive: true });
  window.addEventListener("wheel", event => {
    if (!dateScrollUnlocked && event.deltaY > 0 && isAtDateGate()) {
      event.preventDefault();
      clampDateScroll();
    }
  }, { passive: false });
  window.addEventListener("touchstart", event => {
    touchStartY = event.touches[0]?.clientY ?? null;
  }, { passive: true });
  window.addEventListener("touchmove", event => {
    const currentY = event.touches[0]?.clientY;
    if (!dateScrollUnlocked && touchStartY !== null && currentY !== undefined && currentY < touchStartY && isAtDateGate()) {
      event.preventDefault();
      clampDateScroll();
    }
    touchStartY = currentY ?? touchStartY;
  }, { passive: false });
  window.addEventListener("touchend", () => {
    touchStartY = null;
  });
  window.addEventListener("keydown", event => {
    if (!dateScrollUnlocked && ["ArrowDown", "PageDown", "End", " "].includes(event.key) && isAtDateGate()) {
      event.preventDefault();
      clampDateScroll();
    }
  });
  window.addEventListener("pageshow", clampDateScroll);

  if (dateWasRevealed) {
    dateReveal.hidden = true;
    return;
  }

  const context = dateRevealCanvas.getContext("2d", { alpha: true });
  let activePointer = null;
  let previousPoint = null;
  let horizontalTravel = 0;
  let revealProgress = 0;

  // Capa plateada metálica con destellos, como una tarjeta para raspar.
  function paintSilver(width, height) {
    const base = context.createLinearGradient(0, 0, width, height);
    base.addColorStop(0, "#8d939e");
    base.addColorStop(.22, "#e9ecf1");
    base.addColorStop(.45, "#a6acb7");
    base.addColorStop(.62, "#f4f5f8");
    base.addColorStop(.82, "#9aa1ad");
    base.addColorStop(1, "#d9dce2");
    context.fillStyle = base;
    context.fillRect(0, 0, width, height);

    const glow = context.createRadialGradient(width * .5, height * .48, 0, width * .5, height * .48, Math.max(width, height) * .6);
    glow.addColorStop(0, "rgb(255 255 255 / .55)");
    glow.addColorStop(1, "rgb(255 255 255 / 0)");
    context.fillStyle = glow;
    context.fillRect(0, 0, width, height);

    context.strokeStyle = "rgb(255 255 255 / .16)";
    context.lineWidth = 1;
    for (let x = -height; x < width; x += 7) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x + height, height);
      context.stroke();
    }

    for (let i = 0; i < width * height / 900; i++) {
      context.fillStyle = Math.random() > .5 ? "rgb(255 255 255 / .55)" : "rgb(40 48 64 / .14)";
      context.fillRect(Math.random() * width, Math.random() * height, 1.4, 1.4);
    }
  }

  function sizeDateRevealCanvas() {
    if (horizontalTravel > 0) return;
    const bounds = dateReveal.getBoundingClientRect();
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    dateRevealCanvas.width = Math.max(1, Math.round(bounds.width * pixelRatio));
    dateRevealCanvas.height = Math.max(1, Math.round(bounds.height * pixelRatio));
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    context.globalCompositeOperation = "source-over";
    paintSilver(bounds.width, bounds.height);
    dateReveal.classList.add("is-initialized");
  }

  function eraseBetween(from, to) {
    const bounds = dateReveal.getBoundingClientRect();
    const brush = Math.min(46, Math.max(24, bounds.width * .075));
    context.globalCompositeOperation = "destination-out";
    context.strokeStyle = "#000";
    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineWidth = brush * 2;
    context.beginPath();
    context.moveTo(from.x, from.y);
    context.lineTo(to.x, to.y);
    context.stroke();
  }

  function completeDateReveal() {
    if (dateReveal.classList.contains("is-finishing")) return;
    dateReveal.classList.add("is-finishing");
    dateSection.classList.add("is-revealed");
    if (!reducedMotion) dateMagic.classList.add("is-active");
    try {
      sessionStorage.setItem(dateRevealStorageKey, "true");
    } catch {
      // La raspadita igual funciona aunque el almacenamiento esté bloqueado.
    }
    window.setTimeout(() => {
      dateReveal.hidden = true;
      dateScrollUnlocked = true;
    }, reducedMotion ? 280 : 430);
  }

  sizeDateRevealCanvas();
  if ("ResizeObserver" in window) new ResizeObserver(sizeDateRevealCanvas).observe(dateReveal);

  dateReveal.addEventListener("pointerdown", event => {
    if (event.target === dateRevealButton) return;
    activePointer = event.pointerId;
    previousPoint = { x: event.offsetX, y: event.offsetY };
    dateReveal.classList.add("has-interacted");
    dateReveal.setPointerCapture(event.pointerId);
  });

  dateReveal.addEventListener("pointermove", event => {
    if (event.pointerId !== activePointer || !previousPoint) return;
    const nextPoint = { x: event.offsetX, y: event.offsetY };
    const deltaX = nextPoint.x - previousPoint.x;
    const deltaY = nextPoint.y - previousPoint.y;
    if (Math.abs(deltaX) > Math.abs(deltaY) * 1.15) {
      eraseBetween(previousPoint, nextPoint);
      horizontalTravel += Math.abs(deltaX);
      revealProgress = horizontalTravel / (dateReveal.clientWidth * 4.6);
      dateReveal.classList.toggle("is-scratching", revealProgress > .05);
      if (revealProgress >= 1) completeDateReveal();
    }
    previousPoint = nextPoint;
  });

  const releaseDatePointer = event => {
    if (event.pointerId === activePointer) {
      activePointer = null;
      previousPoint = null;
    }
  };
  dateReveal.addEventListener("pointerup", releaseDatePointer);
  dateReveal.addEventListener("pointercancel", releaseDatePointer);
  dateRevealButton.addEventListener("click", completeDateReveal);
})();
