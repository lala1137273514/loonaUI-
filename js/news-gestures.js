/* ============================================================
   news-gestures.js — Immersive track interaction (vanilla IIFE, no deps)
   - Click-drag horizontal scroll on .nfi-track
   - Vertical wheel → horizontal scroll on .nfi-track
   Event delegation on document so it works for dynamically-rendered tracks.
   ============================================================ */
(function () {
  'use strict';

  /* ---- helpers ---- */
  function getTrack(el) {
    if (!el) return null;
    return el.closest('.nfi-track') || null;
  }

  /* ---- drag state ---- */
  var drag = {
    active: false,
    track: null,
    startX: 0,
    scrollStart: 0
  };

  /* ---- pointerdown: begin drag ---- */
  document.addEventListener('pointerdown', function (e) {
    try {
      var track = getTrack(e.target);
      if (!track) return;

      drag.active = true;
      drag.track = track;
      drag.startX = e.clientX;
      drag.scrollStart = track.scrollLeft;

      track.classList.add('dragging');
      track.setPointerCapture(e.pointerId);

      /* prevent text selection during drag */
      e.preventDefault();
    } catch (err) { /* defensive */ }
  });

  /* ---- pointermove: update scrollLeft ---- */
  document.addEventListener('pointermove', function (e) {
    if (!drag.active || !drag.track) return;
    try {
      var dx = e.clientX - drag.startX;
      drag.track.scrollLeft = drag.scrollStart - dx;
    } catch (err) { /* defensive */ }
  });

  /* ---- pointerup / pointercancel: end drag ---- */
  function endDrag() {
    if (!drag.active) return;
    try {
      if (drag.track) {
        drag.track.classList.remove('dragging');
      }
    } catch (err) { /* defensive */ }
    drag.active = false;
    drag.track = null;
  }
  document.addEventListener('pointerup', endDrag);
  document.addEventListener('pointercancel', endDrag);

  /* ---- wheel: map vertical wheel to horizontal scroll ---- */
  document.addEventListener('wheel', function (e) {
    try {
      var track = getTrack(e.target);
      if (!track) return;

      /* only intercept when the track itself hasn't already scrolled horizontally
         (i.e., don't hijack two-finger horizontal swipe already handled by browser) */
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;

      track.scrollLeft += e.deltaY;
      e.preventDefault();
    } catch (err) { /* defensive */ }
  }, { passive: false });

})();
