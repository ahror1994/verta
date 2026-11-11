/* =========================================================
   ВЕРТА — интерактив и анимации
   ========================================================= */
(function () {
  "use strict";

  var doc = document.documentElement;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var header = $("#header");

  /* ---------- Intro ---------- */
  function start() { requestAnimationFrame(function () { doc.classList.add("is-loaded"); }); }
  var heroImg = $(".hero__bg img");
  if (reduce || !heroImg || heroImg.complete) { start(); }
  else {
    heroImg.addEventListener("load", start, { once: true });
    heroImg.addEventListener("error", start, { once: true });
  }

  /* ---------- Split words ---------- */
  $$("[data-split]").forEach(function (el) {
    var i = 0;
    (function walk(node) {
      $$("*", node).length; // noop for older engines
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var parts = child.textContent.split(/(\s+)/);
          var frag = document.createDocumentFragment();
          parts.forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(" ")); return; }
            var w = document.createElement("span"); w.className = "w";
            var inner = document.createElement("span"); inner.className = "w__i";
            inner.style.setProperty("--i", i++);
            inner.textContent = p; w.appendChild(inner); frag.appendChild(w);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1 && child.tagName !== "BR") { walk(child); }
      });
    })(el);
  });

  /* ---------- Reveal on scroll ---------- */
  var revealEls = $$("[data-reveal], [data-split]");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "100px 0px 50px 0px", threshold: 0.01 });
    revealEls.forEach(function (el) { io.observe(el); });
    window.addEventListener("load", function () {
      setTimeout(function () {
        revealEls.forEach(function (el) { el.classList.add("is-in"); });
      }, 500);
    });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ---------- Count up ---------- */
  var counters = $$("[data-count]");
  function runCounter(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var suffix = el.getAttribute("data-suffix") || "";
    if (reduce) { el.textContent = target + suffix; return; }
    var t0 = null, dur = 1700;
    function tick(t) {
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    el.textContent = "0" + suffix;
    requestAnimationFrame(tick);
  }
  if ("IntersectionObserver" in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { runCounter(e.target); cio.unobserve(e.target); } });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { cio.observe(c); });
  }

  /* ---------- Scroll: progress, sticky, parallax, to-top ---------- */
  var progress = $(".progress span");
  var toTop = $(".to-top");
  var parY = $$("[data-parallax]");
  var parX = $$("[data-parallax-x]");
  var ticking = false;

  function onScroll() {
    var y = window.pageYOffset;
    var vh = window.innerHeight;
    var max = document.documentElement.scrollHeight - vh;
    if (progress) progress.style.transform = "scaleX(" + (max > 0 ? y / max : 0) + ")";
    if (header) header.classList.toggle("is-stuck", y > 72);
    if (toTop) toTop.classList.toggle("is-visible", y > 700);
    if (!reduce) {
      parY.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        var k = parseFloat(el.getAttribute("data-parallax")) || 0;
        var center = r.top + r.height / 2 - vh / 2;
        el.style.transform = "translate3d(0," + (-center * k).toFixed(1) + "px,0)";
      });
      parX.forEach(function (el) {
        var host = el.parentElement.getBoundingClientRect();
        if (host.bottom < 0 || host.top > vh) return;
        var k = parseFloat(el.getAttribute("data-parallax-x")) || 0;
        var center = host.top + host.height / 2 - vh / 2;
        el.style.transform = "translate3d(calc(-50% + " + (center * k).toFixed(1) + "px),0,0)";
      });
    }
    ticking = false;
  }
  window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();
  if (toTop) toTop.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }); });

  /* ---------- Scrollspy ---------- */
  var spyLinks = $$('.nav__link[href^="#"]').filter(function (a) { return a.getAttribute("href").length > 1; });
  var spyTargets = spyLinks.map(function (a) { return $(a.getAttribute("href")); });
  if ("IntersectionObserver" in window) {
    var sio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        spyLinks.forEach(function (a, i) {
          var on = spyTargets[i] === e.target;
          a.classList.toggle("is-active", on);
          if (on) a.setAttribute("aria-current", "location"); else a.removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    spyTargets.forEach(function (t) { if (t) sio.observe(t); });
  }

  /* ---------- Catalog dropdown ---------- */
  var dd = $(".has-dropdown");
  var ddBtn = dd && $(".nav__catalog", dd);
  function setDD(open) {
    if (!dd) return;
    dd.classList.toggle("is-open", open);
    ddBtn.setAttribute("aria-expanded", String(open));
  }
  if (dd) {
    ddBtn.addEventListener("click", function (e) { e.stopPropagation(); setDD(!dd.classList.contains("is-open")); });
    dd.addEventListener("mouseenter", function () { ddBtn.setAttribute("aria-expanded", "true"); });
    dd.addEventListener("mouseleave", function () { setDD(false); });
    document.addEventListener("click", function (e) { if (!dd.contains(e.target)) setDD(false); });
    dd.addEventListener("keydown", function (e) { if (e.key === "Escape") { setDD(false); ddBtn.focus(); } });
  }

  /* ---------- Mobile menu ---------- */
  var mm = $("#mmenu");
  var burger = $(".burger");
  function setMM(open) {
    if (!mm) return;
    mm.classList.toggle("is-open", open);
    mm.setAttribute("aria-hidden", String(!open));
    burger.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("is-locked", open);
    if (open) setTimeout(function () { var c = $(".mmenu__close", mm); c && c.focus(); }, 300);
    else burger.focus({ preventScroll: true });
  }
  if (burger && mm) {
    burger.addEventListener("click", function () { setMM(!mm.classList.contains("is-open")); });
    $$("[data-close]", mm).forEach(function (el) { el.addEventListener("click", function () { setMM(false); }); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && mm.classList.contains("is-open")) setMM(false); });
    $$(".mmenu__acc", mm).forEach(function (btn) {
      btn.addEventListener("click", function () {
        var open = btn.getAttribute("aria-expanded") !== "true";
        btn.setAttribute("aria-expanded", String(open));
        var panel = document.getElementById(btn.getAttribute("aria-controls"));
        if (panel) panel.classList.toggle("is-open", open);
      });
    });
    window.addEventListener("resize", function () { if (window.innerWidth >= 1200 && mm.classList.contains("is-open")) setMM(false); });
  }

  /* ---------- Smooth scroll to form ---------- */
  $$("[data-scroll-to]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var target = $(btn.getAttribute("data-scroll-to"));
      if (!target) return;
      target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      var input = $("#f-name");
      if (input && target.id === "contact") setTimeout(function () { input.focus({ preventScroll: true }); }, reduce ? 0 : 900);
    });
  });

  /* ---------- Magnetic buttons ---------- */
  if (finePointer && !reduce) {
    $$("[data-magnetic]").forEach(function (el) {
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2);
        var dy = e.clientY - (r.top + r.height / 2);
        el.style.transform = "translate(" + (dx * 0.18).toFixed(1) + "px," + (dy * 0.3 - 3).toFixed(1) + "px)";
      });
      el.addEventListener("pointerleave", function () { el.style.transform = ""; });
    });
  }

  /* ---------- Slider (бесконечный, свайп, автоплей) ---------- */
  $$("[data-slider]").forEach(function (root) {
    var viewport = $(".slider__viewport", root);
    var track = $(".slider__track", root);
    var originals = $$(".slide", track);
    var n = originals.length;
    if (!n) return;
    // клоны слева и справа
    originals.forEach(function (s) { var c = s.cloneNode(true); c.setAttribute("aria-hidden", "true"); c.classList.add("is-clone"); track.appendChild(c); });
    originals.slice().reverse().forEach(function (s) { var c = s.cloneNode(true); c.setAttribute("aria-hidden", "true"); c.classList.add("is-clone"); track.insertBefore(c, track.firstChild); });
    $$(".slide img", track).forEach(function (img) { img.loading = "eager"; });
    var slides = $$(".slide", track);
    var index = n; // первый оригинал
    var current = $("[data-current]", root);
    var total = $("[data-total]", root);
    var bar = $(".slider__progress span", root);
    var AUTOPLAY = 6000;
    var timer = null, paused = false, busy = false;
    if (total) total.textContent = pad(n);
    root.style.setProperty("--autoplay", AUTOPLAY + "ms");

    function pad(v) { return (v < 10 ? "0" : "") + v; }
    function step() { var s = slides[0]; return s.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap || 0); }
    function offsetFor(i) { var w = slides[0].getBoundingClientRect().width; return root.clientWidth / 2 - w / 2 - i * step(); }
    function render(animate, extra) {
      track.classList.toggle("is-animating", !!animate);
      track.style.transform = "translate3d(" + (offsetFor(index) + (extra || 0)).toFixed(1) + "px,0,0)";
      slides.forEach(function (s, i) { s.classList.toggle("is-active", i === index); });
      if (current) current.textContent = pad(((index - n) % n + n) % n + 1);
    }
    function restartBar() {
      if (!bar) return;
      bar.classList.remove("is-running"); void bar.offsetWidth;
      if (!reduce) bar.classList.add("is-running");
    }
    function go(dir) {
      if (busy) return;
      busy = true; index += dir; render(!reduce); restartBar(); schedule();
      if (reduce) normalize();
    }
    function normalize() {
      busy = false;
      if (index >= n * 2) { index -= n; render(false); }
      else if (index < n) { index += n; render(false); }
    }
    track.addEventListener("transitionend", function (e) { if (e.target === track) normalize(); });
    function schedule() {
      clearTimeout(timer);
      if (reduce) return;
      timer = setTimeout(function () { if (!paused && !document.hidden) go(1); else schedule(); }, AUTOPLAY);
    }
    $(".slider__btn--prev", root).addEventListener("click", function () { go(-1); });
    $(".slider__btn--next", root).addEventListener("click", function () { go(1); });
    root.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
      if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
    });
    root.addEventListener("mouseenter", function () { paused = true; });
    root.addEventListener("mouseleave", function () { paused = false; });
    root.addEventListener("focusin", function () { paused = true; });
    root.addEventListener("focusout", function () { paused = false; });

    // drag / swipe
    var sx = 0, sy = 0, dx = 0, dragging = false, locked = null;
    viewport.addEventListener("pointerdown", function (e) {
      if (busy || e.button !== 0) return;
      dragging = true; locked = null; sx = e.clientX; sy = e.clientY; dx = 0;
      viewport.setPointerCapture && viewport.setPointerCapture(e.pointerId);
    });
    viewport.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      dx = e.clientX - sx;
      var dy = e.clientY - sy;
      if (locked === null && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) locked = Math.abs(dx) > Math.abs(dy);
      if (locked) { viewport.classList.add("is-dragging"); render(false, dx); }
    });
    function endDrag() {
      if (!dragging) return;
      dragging = false; viewport.classList.remove("is-dragging");
      if (locked && Math.abs(dx) > Math.min(120, step() * 0.15)) go(dx < 0 ? 1 : -1);
      else render(true);
    }
    viewport.addEventListener("pointerup", endDrag);
    viewport.addEventListener("pointercancel", endDrag);
    viewport.addEventListener("lostpointercapture", endDrag);

    window.addEventListener("resize", function () { render(false); });
    render(false);
    if ("IntersectionObserver" in window) {
      var vio = new IntersectionObserver(function (en) {
        en.forEach(function (e) { if (e.isIntersecting) { restartBar(); schedule(); vio.disconnect(); } });
      }, { threshold: 0.4 });
      vio.observe(root);
    } else { schedule(); }
  });

  /* ---------- Phone mask ---------- */
  var phone = $("#f-phone");
  function formatPhone(v) {
    var d = v.replace(/\D/g, "");
    if (!d) return "";
    if (d[0] === "8") d = "7" + d.slice(1);
    if (d[0] !== "7") d = "7" + d;
    d = d.slice(0, 11);
    var out = "+7";
    if (d.length > 1) out += " (" + d.slice(1, 4);
    if (d.length >= 4) out += ")";
    if (d.length > 4) out += " " + d.slice(4, 7);
    if (d.length > 7) out += "-" + d.slice(7, 9);
    if (d.length > 9) out += "-" + d.slice(9, 11);
    return out;
  }
  if (phone) {
    phone.addEventListener("input", function () { phone.value = formatPhone(phone.value); });
    phone.addEventListener("focus", function () { if (!phone.value) phone.value = "+7 ("; });
    phone.addEventListener("blur", function () { if (phone.value.replace(/\D/g, "").length <= 1) phone.value = ""; });
  }

  /* ---------- Form ---------- */
  var form = $("#lead-form");
  if (form) {
    var nameF = $("#f-name", form), consent = $("#f-consent", form);
    var btn = $("button[type=submit]", form);
    function mark(input, bad) {
      var wrap = input.closest(".field, .consent");
      if (!wrap) return;
      wrap.classList.remove("is-invalid");
      if (bad) { void wrap.offsetWidth; wrap.classList.add("is-invalid"); }
      input.setAttribute("aria-invalid", String(bad));
    }
    function validate() {
      var okName = nameF.value.trim().length >= 2;
      var okPhone = phone.value.replace(/\D/g, "").length === 11;
      var okConsent = consent.checked;
      mark(nameF, !okName); mark(phone, !okPhone); mark(consent, !okConsent);
      var first = !okName ? nameF : !okPhone ? phone : !okConsent ? consent : null;
      if (first) first.focus();
      return !first;
    }
    [nameF, phone].forEach(function (inp) {
      inp.addEventListener("input", function () { var w = inp.closest(".field"); if (w && w.classList.contains("is-invalid")) mark(inp, false); });
    });
    consent.addEventListener("change", function () { if (consent.checked) mark(consent, false); });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validate()) return;
      btn.classList.add("is-loading"); btn.disabled = true;
      var data = new FormData(form);
      var endpoint = form.getAttribute("data-endpoint");
      var req = endpoint
        ? fetch(endpoint, { method: "POST", body: data, headers: { Accept: "application/json" } }).then(function (r) { if (!r.ok) throw new Error(r.status); })
        : new Promise(function (res) { setTimeout(res, 900); });
      req.then(function () {
        form.classList.add("is-sent");
        $(".form__success", form).classList.add("is-visible");
      }).catch(function () {
        var subject = encodeURIComponent("Заявка с сайта: " + data.get("request"));
        var body = encodeURIComponent("Имя: " + data.get("name") + "\nТелефон: " + data.get("phone"));
        window.location.href = "mailto:" + form.getAttribute("data-mail") + "?subject=" + subject + "&body=" + body;
      }).then(function () { btn.classList.remove("is-loading"); btn.disabled = false; });
    });
  }

  /* ---------- Year ---------- */
  var y = $("[data-year]");
  if (y) y.textContent = new Date().getFullYear() + "\u00a0г.";
})();
