(function () {
  var top = document.querySelector("[data-top]");
  var toggle = document.querySelector("[data-nav-toggle]");
  var nav = document.querySelector("[data-nav]");

  function onScroll() {
    if (!top) return;
    top.classList.toggle("is-stuck", window.scrollY > 8);
  }

  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  function syncChrome() {
    if (!top) return;
    document.documentElement.style.setProperty("--chrome", top.offsetHeight + "px");
  }

  function setMenuOpen(open) {
    if (!toggle || !top) return;
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    top.classList.toggle("is-open", open);
    document.body.classList.toggle("nav-lock", open);
    syncChrome();
  }

  syncChrome();
  window.addEventListener("resize", syncChrome);

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      setMenuOpen(toggle.getAttribute("aria-expanded") !== "true");
    });
    nav.addEventListener("click", function (event) {
      if (event.target.closest("a")) setMenuOpen(false);
    });
  }

  var promo = document.querySelector("[data-promo]");
  var promoItems = promo ? promo.querySelectorAll("[data-promo-item]") : [];
  var promoIndex = 0;
  var promoTimer = 0;

  function showPromo(index) {
    promoItems.forEach(function (item, itemIndex) {
      item.hidden = itemIndex !== index;
    });
  }

  if (promoItems.length > 1 && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    promoTimer = window.setInterval(function () {
      promoIndex = (promoIndex + 1) % promoItems.length;
      showPromo(promoIndex);
    }, 5000);
  }

  var promoClose = document.querySelector("[data-promo-close]");
  if (promo && promoClose) {
    promoClose.addEventListener("click", function () {
      promo.hidden = true;
      document.documentElement.style.setProperty("--banner", "0px");
      syncChrome();
      if (promoTimer) window.clearInterval(promoTimer);
    });
  }

  var menuButtons = document.querySelectorAll("[data-menu-button]");

  function closeMenus(except) {
    menuButtons.forEach(function (button) {
      if (button === except) return;
      button.setAttribute("aria-expanded", "false");
      var panel = document.getElementById(button.getAttribute("aria-controls"));
      if (panel) panel.hidden = true;
    });
  }

  function openMenu(button) {
    closeMenus(button);
    button.setAttribute("aria-expanded", "true");
    var panel = document.getElementById(button.getAttribute("aria-controls"));
    if (panel) panel.hidden = false;
  }

  menuButtons.forEach(function (button) {
    var item = button.parentElement;
    button.addEventListener("click", function () {
      var open = button.getAttribute("aria-expanded") === "true";
      if (open) closeMenus();
      else openMenu(button);
    });
    if (item) {
      item.addEventListener("mouseenter", function () {
        if (!window.matchMedia("(hover: hover) and (min-width: 1200px)").matches) return;
        openMenu(button);
      });
      item.addEventListener("mouseleave", function () {
        if (!window.matchMedia("(hover: hover) and (min-width: 1200px)").matches) return;
        closeMenus();
      });
    }
  });

  var langButton = document.querySelector("[data-lang-button]");
  var langMenu = document.getElementById("lang-menu");

  function closeLang() {
    if (!langButton || !langMenu) return;
    langButton.setAttribute("aria-expanded", "false");
    langMenu.hidden = true;
  }

  if (langButton && langMenu) {
    langButton.addEventListener("click", function () {
      var open = langButton.getAttribute("aria-expanded") === "true";
      langButton.setAttribute("aria-expanded", open ? "false" : "true");
      langMenu.hidden = open;
    });
  }

  var join = document.querySelector("[data-join]");
  var joinDialog = document.getElementById("join-dialog");
  var joinClose = document.querySelector("[data-join-close]");
  if (join && joinDialog && typeof joinDialog.showModal === "function") {
    join.addEventListener("click", function () { joinDialog.showModal(); });
  }
  if (joinClose && joinDialog) {
    joinClose.addEventListener("click", function () { joinDialog.close(); });
  }

  document.addEventListener("click", function (event) {
    if (!event.target.closest(".nav-item")) closeMenus();
    if (!event.target.closest("[data-lang]")) closeLang();
  });

  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") return;
    closeMenus();
    closeLang();
    setMenuOpen(false);
  });

  document.querySelectorAll(".faq button").forEach(function (button) {
    button.addEventListener("click", function () {
      var panel = document.getElementById(button.getAttribute("aria-controls"));
      var open = button.getAttribute("aria-expanded") === "true";
      button.setAttribute("aria-expanded", open ? "false" : "true");
      if (panel) panel.hidden = open;
    });
  });

  var billingStatus = document.getElementById("billing-status");
  document.querySelectorAll('input[name="billing"]').forEach(function (input) {
    input.addEventListener("change", function () {
      var yearly = input.value === "year";
      var plans = document.querySelector(".plans");
      if (plans) plans.classList.toggle("is-monthly", !yearly);
      document.querySelectorAll("[data-plan]").forEach(function (plan) {
        var now = plan.querySelector(".price-now");
        var was = plan.querySelector(".price-was");
        var note = plan.querySelector(".price-note");
        if (now) now.textContent = yearly ? now.getAttribute("data-year") : now.getAttribute("data-month");
        if (was) was.classList.toggle("is-hidden", !yearly);
        if (note) note.textContent = yearly ? note.getAttribute("data-year-note") : note.getAttribute("data-month-note");
      });
      if (billingStatus) {
        billingStatus.textContent = yearly
          ? "Yearly billing. Prices are the Black Friday rate, per month."
          : "Monthly billing. The Black Friday rate applies to yearly plans.";
      }
    });
  });

  var form = document.getElementById("bundle-form");
  var separateEl = document.querySelector("[data-separate]");
  var bundleEl = document.querySelector("[data-bundle]");
  var saveEl = document.querySelector("[data-save]");

  function money(cents) {
    return "US$" + (cents / 100).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function updateBundle() {
    if (!form || !separateEl) return;
    var returns = form.querySelector('input[name="returns"]:checked');
    var tracking = form.querySelector('input[name="tracking"]:checked');
    var monthly = Number(returns.value) + Number(tracking.value);
    var annual = monthly * 12 * 100;
    var bundle = Math.round(annual * 0.95);
    separateEl.textContent = money(annual);
    bundleEl.textContent = money(bundle);
    saveEl.textContent = money(annual - bundle);
  }

  if (form) {
    form.addEventListener("change", updateBundle);
    updateBundle();
  }

  var copyButton = document.querySelector("[data-copy]");
  var copyStatus = document.getElementById("copy-status");
  if (copyButton && copyStatus) {
    copyButton.addEventListener("click", function () {
      var code = "BFCM2026";
      function done(message) {
        copyStatus.textContent = message;
        copyButton.textContent = message === "Code copied." ? "Copied" : "Copy code";
      }
      function fallbackCopy() {
        var area = document.createElement("textarea");
        area.value = code;
        area.setAttribute("readonly", "");
        area.style.position = "fixed";
        area.style.left = "-9999px";
        document.body.appendChild(area);
        area.select();
        var ok = false;
        try { ok = document.execCommand("copy"); } catch (err) { ok = false; }
        area.remove();
        done(ok ? "Code copied." : "Select BFCM2026 and copy it manually.");
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code).then(function () {
          done("Code copied.");
        }).catch(fallbackCopy);
      } else {
        fallbackCopy();
      }
    });
  }

  var stats = document.querySelector("#numbers .stats");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (stats && "IntersectionObserver" in window && !reduceMotion) {
    var statsSeen = false;
    var statsObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting || statsSeen) return;
        statsSeen = true;
        stats.classList.add("is-in");
        stats.classList.remove("is-pending");
        statsObserver.disconnect();
      });
    }, { threshold: 0.35 });
    stats.classList.add("is-pending");
    statsObserver.observe(stats);
  }

  var countdown = document.querySelector("[data-countdown]");
  var grid = document.querySelector("[data-countdown-grid]");
  if (countdown && grid) {
    var end = Date.parse(countdown.getAttribute("data-countdown"));
    var days = countdown.querySelector("[data-days]");
    var hours = countdown.querySelector("[data-hours]");
    var minutes = countdown.querySelector("[data-minutes]");
    var seconds = countdown.querySelector("[data-seconds]");
    var caption = countdown.querySelector(".countdown-caption");

    function pad(n) { return String(n).padStart(2, "0"); }

    function paint(el, value) {
      var text = pad(value);
      el.textContent = text;
      var cell = el.parentElement;
      if (cell) cell.setAttribute("aria-label", text + " " + cell.getAttribute("data-unit"));
    }

    function tick() {
      var left = end - Date.now();
      if (left <= 0) {
        grid.hidden = true;
        if (caption) caption.textContent = "This offer ended on November 30, 2026.";
        return;
      }
      grid.hidden = false;
      var total = Math.floor(left / 1000);
      paint(days, Math.floor(total / 86400));
      paint(hours, Math.floor((total % 86400) / 3600));
      paint(minutes, Math.floor((total % 3600) / 60));
      paint(seconds, total % 60);
    }

    tick();
    window.setInterval(tick, 1000);
  }
})();
