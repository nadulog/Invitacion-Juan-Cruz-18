const EVENT_DATE = new Date('2026-11-21T22:00:00-03:00');
const ADDRESS = 'Casa Paradiso, Maipú, Ruta 9 km 1305 — https://www.google.com/maps/search/Casa%20Paradiso/@-26.73605594,-65.23405788,17z?hl=es';

const countdownParts = {
  days: document.querySelector('#days'),
  hours: document.querySelector('#hours'),
  minutes: document.querySelector('#minutes'),
  seconds: document.querySelector('#seconds')
};

function updateCountdown() {
  const distance = Math.max(0, EVENT_DATE.getTime() - Date.now());
  const day = 86_400_000;
  const hour = 3_600_000;
  const minute = 60_000;
  const values = {
    days: Math.floor(distance / day),
    hours: Math.floor((distance % day) / hour),
    minutes: Math.floor((distance % hour) / minute),
    seconds: Math.floor((distance % minute) / 1000)
  };

  Object.entries(values).forEach(([key, value]) => {
    const text = String(value).padStart(2, '0');
    countdownParts[key].textContent = text;
    countdownParts[key].dataset.text = text;
  });
}

updateCountdown();
setInterval(updateCountdown, 1000);

// Destellos sobre la bola de espejos de la portada
const discoSparkles = document.querySelector('.disco-sparkles');
if (discoSparkles) {
  [[72, 4, 14, 0], [84, 12, 10, .7], [93, 6, 16, 1.3], [78, 20, 9, 1.9], [66, 12, 11, .4], [90, 22, 12, 2.2], [60, 3, 8, 1.6]]
    .forEach(([left, top, size, delay]) => {
      const sparkle = document.createElement('span');
      sparkle.className = 'disco-sparkle';
      sparkle.style.cssText = `--left:${left}%;--top:${top}%;--size:${size}px;--delay:${delay}s`;
      discoSparkles.appendChild(sparkle);
    });
}

document.querySelectorAll('[data-open]').forEach((button) => {
  button.addEventListener('click', () => document.querySelector(`#${button.dataset.open}`).showModal());
});

document.querySelectorAll('[data-close]').forEach((button) => {
  button.addEventListener('click', () => button.closest('dialog').close());
});

// Tocar fuera de la tarjeta cierra el modal
document.querySelectorAll('dialog').forEach((dialog) => {
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
});

function showToast(element, text) {
  element.textContent = text;
  element.classList.add('is-visible');
  clearTimeout(element.hideTimer);
  element.hideTimer = setTimeout(() => element.classList.remove('is-visible'), 2200);
}

async function copyText(text, statusElement) {
  try {
    await navigator.clipboard.writeText(text);
    showToast(statusElement, 'Copiado ✓');
  } catch {
    showToast(statusElement, text);
  }
}

document.querySelector('#copyAddress').addEventListener('click', () => {
  copyText(ADDRESS, document.querySelector('#copyStatus'));
});

document.querySelector('#copyGift').addEventListener('click', () => {
  copyText('juaaan.mpp', document.querySelector('#giftStatus'));
});

// Galería: cuando se carguen las fotos, cada polaroid con data-gallery se amplía al tocarla
const galleryItems = document.querySelectorAll('.polaroid[data-gallery]');
if (galleryItems.length) {
  const lightbox = document.createElement('dialog');
  lightbox.className = 'image-modal photo-modal';
  lightbox.innerHTML = '<div class="image-modal__sheet"><img alt=""></div>';
  document.body.appendChild(lightbox);
  lightbox.addEventListener('click', () => lightbox.close());
  galleryItems.forEach((item) => {
    item.addEventListener('click', () => {
      lightbox.querySelector('img').src = item.dataset.gallery;
      lightbox.showModal();
    });
  });
}

document.querySelector('#calendarButton').addEventListener('click', () => {
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//BloomDate//Mis 18 Juan Cruz//ES',
    'BEGIN:VEVENT',
    'UID:juan-cruz-18-20261121@bloomdate',
    'DTSTAMP:20261017T120000Z',
    'DTSTART:20261122T010000Z',
    'DTEND:20261122T080000Z',
    'SUMMARY:Mis 18 Juan Cruz',
    'LOCATION:Casa Paradiso\\, Maipú\\, Ruta 9 km 1305',
    'DESCRIPTION:¡Te espero para celebrar mis 18!',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'Mis-18-Juan-Cruz.ics';
  link.click();
  URL.revokeObjectURL(url);
});

// Música: arranca sola al abrir; si el navegador la bloquea, arranca con el primer toque en cualquier parte
const invitationAudio = document.querySelector('#invitationAudio');
const audioToggle = document.querySelector('#audioToggle');

if (invitationAudio && audioToggle) {
  const unlockEvents = ['pointerdown', 'touchend', 'click', 'keydown'];
  let pausedByUser = false;
  let resumeWhenVisible = false;

  const updateAudioButton = () => {
    const isPlaying = !invitationAudio.paused;
    audioToggle.classList.toggle('is-playing', isPlaying);
    audioToggle.setAttribute('aria-pressed', String(isPlaying));
    audioToggle.setAttribute('aria-label', isPlaying ? 'Pausar música' : 'Reproducir música');
    audioToggle.title = isPlaying ? 'Pausar música' : 'Reproducir música';
  };

  const stopListeningForUnlock = () => {
    unlockEvents.forEach((type) => document.removeEventListener(type, unlockAudio, true));
  };

  function unlockAudio(event) {
    if (pausedByUser || audioToggle.contains(event.target)) return;
    invitationAudio.play().then(stopListeningForUnlock).catch(() => {});
  }

  invitationAudio.volume = 0.85;
  invitationAudio.play().then(stopListeningForUnlock).catch(() => {
    unlockEvents.forEach((type) => document.addEventListener(type, unlockAudio, true));
  });

  audioToggle.addEventListener('click', () => {
    if (invitationAudio.paused) {
      pausedByUser = false;
      invitationAudio.play().then(stopListeningForUnlock).catch(() => {});
    } else {
      pausedByUser = true;
      invitationAudio.pause();
    }
  });

  invitationAudio.addEventListener('play', updateAudioButton);
  invitationAudio.addEventListener('pause', updateAudioButton);

  // Se pausa al salir de la pestaña o bloquear el celular, y sigue al volver
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      resumeWhenVisible = !invitationAudio.paused;
      invitationAudio.pause();
    } else if (resumeWhenVisible) {
      invitationAudio.play().catch(() => {});
    }
  });
}
