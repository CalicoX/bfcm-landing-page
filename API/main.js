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
        if (!window.matchMedia("(hover: hover) and (min-width: 1025px)").matches) return;
        openMenu(button);
      });
      item.addEventListener("mouseleave", function () {
        if (!window.matchMedia("(hover: hover) and (min-width: 1025px)").matches) return;
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
    if (!event.target.closest(".nav-item-wrap")) closeMenus();
    if (!event.target.closest("[data-lang]")) closeLang();
  });

  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") return;
    closeMenus();
    closeLang();
    setMenuOpen(false);
  });

  var faqButtons = document.querySelectorAll(".faq button");

  function faqReduce() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function faqPanel(button) {
    var id = button.getAttribute("aria-controls");
    return id ? document.getElementById(id) : null;
  }

  function faqClear(panel) {
    if (!panel) return;
    if (panel._faqTimer) window.clearTimeout(panel._faqTimer);
    panel._faqTimer = 0;
    if (panel._faqOnEnd) panel.removeEventListener("transitionend", panel._faqOnEnd);
    panel._faqOnEnd = null;
  }

  function faqSettle(panel, open) {
    faqClear(panel);
    if (open) {
      if (panel.classList.contains("is-open")) panel.classList.add("is-settled");
      return;
    }
    if (!panel.classList.contains("is-open")) panel.hidden = true;
  }

  function faqWatch(panel, open) {
    faqClear(panel);
    panel._faqOnEnd = function (event) {
      if (event.target !== panel || event.propertyName !== "grid-template-rows") return;
      faqSettle(panel, open);
    };
    panel.addEventListener("transitionend", panel._faqOnEnd);
    panel._faqTimer = window.setTimeout(function () {
      faqSettle(panel, open);
    }, 500);
  }

  function faqClose(button) {
    var panel = faqPanel(button);
    if (!panel || button.getAttribute("aria-expanded") !== "true") return;
    faqClear(panel);
    button.setAttribute("aria-expanded", "false");
    panel.setAttribute("aria-hidden", "true");
    panel.classList.remove("is-settled");
    panel.classList.remove("is-open");
    if (faqReduce()) {
      panel.hidden = true;
      return;
    }
    faqWatch(panel, false);
  }

  function faqOpen(button) {
    var panel = faqPanel(button);
    if (!panel || button.getAttribute("aria-expanded") === "true") return;
    faqButtons.forEach(function (other) {
      if (other !== button) faqClose(other);
    });
    faqClear(panel);
    panel.hidden = false;
    panel.removeAttribute("aria-hidden");
    if (faqReduce()) {
      button.setAttribute("aria-expanded", "true");
      panel.classList.add("is-open");
      panel.classList.add("is-settled");
      return;
    }
    panel.classList.remove("is-settled");
    void panel.offsetHeight;
    button.setAttribute("aria-expanded", "true");
    panel.classList.add("is-open");
    faqWatch(panel, true);
  }

  faqButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      if (button.getAttribute("aria-expanded") === "true") faqClose(button);
      else faqOpen(button);
    });
  });

  mountOfficialPricing();

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
    if (!form || !separateEl || !bundleEl || !saveEl) return;
    var returns = form.querySelector('input[name="returns"]:checked');
    var tracking = form.querySelector('input[name="tracking"]:checked');
    if (!returns || !tracking) return;
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

  function copyText(code, done) {
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
      done(ok);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code).then(function () {
        done(true);
      }).catch(fallbackCopy);
    } else {
      fallbackCopy();
    }
  }

  document.querySelectorAll("[data-copy]").forEach(function (button) {
    var label = button.textContent;
    var inline = button.hasAttribute("data-copy-inline");
    var codeLine = button.closest(".code-line");
    var codeEl = codeLine ? codeLine.querySelector(".code") : null;
    var restoreTimer = 0;
    button.addEventListener("click", function () {
      var code = button.getAttribute("data-copy-code") || "BFCM2026";
      var status = document.getElementById(button.getAttribute("data-copy-status") || "copy-status");
      if (codeEl) {
        codeEl.textContent = "Copied";
        if (status) status.textContent = "";
        window.clearTimeout(restoreTimer);
        restoreTimer = window.setTimeout(function () {
          codeEl.textContent = code;
        }, 2000);
      }
      copyText(code, function (ok) {
        if (codeEl) {
          if (!ok) {
            window.clearTimeout(restoreTimer);
            codeEl.textContent = code;
            if (status) status.textContent = "Select BFCM2026 and copy it manually.";
          }
          return;
        }
        var message = ok ? "Copied" : "Select BFCM2026 and copy it manually.";
        if (status) status.textContent = inline ? message : (ok ? "Code copied." : message);
        if (!inline) button.textContent = ok ? "Copied" : label;
      });
    });
  });

  var stats = document.querySelector(".stats-band .stats");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (stats && "IntersectionObserver" in window && !reduceMotion) {
    var statsSeen = false;
    var statsObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting || statsSeen) return;
        statsSeen = true;
        statsObserver.disconnect();
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            stats.classList.add("is-in");
            stats.classList.remove("is-pending");
          });
        });
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

  function mountOfficialPricing() {
    var stage = document.getElementById("plans-stage");
    if (!stage) return;

    var shopify = "https://apps.shopify.com/17track?utm_source=www.17track.com&utm_medium=pricing&utm_campaign=button";
    var contact = "https://www.17track.com/en/contact-us";

    var catalog = {
      tracking: {
        href: shopify,
        cta: "Get Started",
        quotaLabel: "shipments",
        periodMode: "annual",
        keepQuota: false,
        cards: [
          {
            name: "Free",
            free: true,
            desc: "Basics for starting a new business",
            quotaMonth: "50 shipments per month",
            quotaYear: "50 shipments per month",
            note: "Auto-transitions to Free after trial ends",
            featureTitle: "What's in Free Plan",
            features: [
              "3,500+ carrier integrations",
              "Customize tracking page",
              "Tracking number redirection",
              "PayPal integration"
            ]
          },
          {
            name: "Basic",
            desc: "Key features for order tracking",
            featureTitle: "What's in Basic",
            month: [[200, 9], [300, 14], [500, 21], [1000, 39], [2000, 69], [3000, 99], [5000, 159], [7000, 209], [10000, 259], [15000, 279], [20000, 329], [25000, 389], [30000, 439], [35000, 489], [40000, 549], [45000, 599], [50000, 659]],
            year: [[2400, 86], [3600, 134], [6000, 202], [12000, 374], [24000, 662], [36000, 950], [60000, 1526], [84000, 2006], [120000, 2486], [180000, 2678], [240000, 3158], [300000, 3734], [360000, 4214], [420000, 4694], [480000, 5270], [540000, 5750], [600000, 6326]],
            features: [
              "3,500+ carrier integrations",
              "Email notifications",
              "Basic analytics",
              "Customize tracking page",
              "Tracking number redirection",
              "PayPal integration"
            ]
          },
          {
            name: "Pro",
            popular: true,
            desc: "Enhanced after-sales and tracking experience",
            featureTitle: "Everything in Basic, plus:",
            month: [[500, 29], [1000, 49], [2000, 79], [3000, 118], [5000, 189], [7000, 259], [10000, 359], [15000, 519], [20000, 659], [25000, 789], [30000, 946]],
            year: [[6000, 278], [12000, 470], [24000, 758], [36000, 1133], [48000, 1478], [60000, 1814], [84000, 2486], [120000, 3446], [180000, 4982], [240000, 6326], [300000, 7574], [360000, 9082]],
            features: [
              "Seller notifications",
              "Shipments export",
              "Product recommendations",
              "Remove 17TRACK branding",
              "Multilingual tracking pages",
              "Estimated Delivery Date (EDD)",
              "Multilingual email notification",
              "Apple Wallet Order Tracking",
              "Trustpilot Integration"
            ]
          },
          {
            name: "Premium",
            desc: "Advanced data analysis and refined operations",
            featureTitle: "Everything in Pro, plus:",
            month: [[1000, 89], [2000, 159], [3000, 239], [5000, 389], [7000, 529], [10000, 749], [15000, 1099], [20000, 1439], [25000, 1759], [30000, 2069], [35000, 2359], [40000, 2639], [45000, 2899], [50000, 3199], [60000, 3749], [70000, 4279], [80000, 4789], [90000, 5259], [100000, 5719]],
            year: [[12000, 854], [24000, 1526], [36000, 2294], [60000, 3734], [84000, 5078], [120000, 7190], [180000, 10550], [240000, 13814], [300000, 16886], [360000, 19862], [420000, 22646], [480000, 25334], [540000, 27830], [600000, 30710]],
            features: [
              "Customize email triggers",
              "Transit time analysis",
              "On-time delivery analysis",
              "Exception orders analysis",
              "Predictive estimated delivery dates and analysis",
              "Split order email notifications (API required)"
            ]
          }
        ],
        custom: {
          title: "Custom",
          desc: "Tailored tracking solutions",
          featureTitle: "Everything in Premium, plus:",
          features: [
            "Custom platform integrations",
            "Custom inquiry frequency",
            "Dedicated carriers support",
            "24/7 live chat support"
          ],
          cta: "Contact Us",
          href: contact
        }
      }
    };

    var yearly = { tracking: false };

    function el(tag, className) {
      var node = document.createElement(tag);
      if (className) node.className = className;
      return node;
    }

    function outbound(href, text, className) {
      var anchor = el("a", className);
      anchor.href = href;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      anchor.textContent = text;
      return anchor;
    }

    function featureList(items) {
      var list = el("ul");
      items.forEach(function (item) {
        var li = el("li");
        li.textContent = item;
        list.appendChild(li);
      });
      return list;
    }

    function featureBlock(title, items, className) {
      var block = el("div", className || "price-features");
      var heading = el("h4");
      heading.textContent = title;
      block.appendChild(heading);
      block.appendChild(featureList(items));
      return block;
    }

    function bfMark() {
      var mark = el("span", "price-bf");
      mark.textContent = "Black Friday";
      return mark;
    }

    function formatUsd(amount) {
      var n = Math.round(Number(amount) * 100) / 100;
      var body = Math.abs(n - Math.round(n)) < 0.001 ? String(Math.round(n)) : n.toFixed(2);
      return "US $" + body;
    }

    function paintFigures(cardEl, original) {
      cardEl.querySelector(".price-figure").textContent = formatUsd(Number(original) / 2);
      var was = cardEl.querySelector(".price-was");
      if (was) was.textContent = formatUsd(original);
    }

    function cardHead(card) {
      var head = el("div", "price-card-head");
      var heading = el("h3");
      heading.textContent = card.name;
      head.appendChild(heading);
      if (card.desc) {
        var desc = el("p");
        desc.textContent = card.desc;
        head.appendChild(desc);
      }
      return head;
    }

    function freeCard(product, card) {
      var article = el("article", "price-card");
      article.setAttribute("data-card", card.name);
      article.appendChild(cardHead(card));
      var offer = el("div", "price-offer");
      var amount = el("p", "price-amount");
      var figure = el("span", "price-figure");
      figure.textContent = "US $0";
      var period = el("span", "price-period");
      period.textContent = "/month";
      amount.appendChild(figure);
      amount.appendChild(period);
      offer.appendChild(amount);
      var quota = el("p", "price-quota-line");
      quota.setAttribute("data-free-quota", "");
      quota.setAttribute("data-month-text", card.quotaMonth);
      quota.setAttribute("data-year-text", card.quotaYear);
      quota.textContent = card.quotaMonth;
      offer.appendChild(quota);
      if (card.note) {
        var note = el("p", "price-over");
        note.textContent = card.note;
        offer.appendChild(note);
      }
      article.appendChild(offer);
      article.appendChild(outbound(product.href, product.cta, "price-cta"));
      article.appendChild(featureBlock(card.featureTitle, card.features));
      return article;
    }

    function paidCard(product, card) {
      var article = el("article", "price-card" + (card.popular ? " is-popular" : ""));
      article.setAttribute("data-card", card.name);
      article.setAttribute("data-product", product.id);
      article.appendChild(cardHead(card));
      var offer = el("div", "price-offer");
      var amount = el("p", "price-amount is-offer");
      amount.appendChild(el("s", "price-was"));
      var sale = el("span", "price-sale");
      sale.appendChild(el("span", "price-figure"));
      var period = el("span", "price-period");
      period.textContent = "/month";
      sale.appendChild(period);
      var off = el("span", "price-off");
      off.textContent = "35% off";
      sale.appendChild(off);
      amount.appendChild(sale);
      offer.appendChild(amount);
      var quota = el("div", "price-quota");
      var select = el("select");
      select.setAttribute("data-quota", "");
      select.setAttribute("aria-label", product.quotaLabel);
      quota.appendChild(select);
      var quotaText = el("span");
      quotaText.textContent = product.quotaLabel;
      quota.appendChild(quotaText);
      offer.appendChild(quota);
      if (card.overage) {
        var over = el("p", "price-over");
        over.textContent = card.overage;
        offer.appendChild(over);
      }
      article.appendChild(offer);
      article.appendChild(outbound(product.href, product.cta, "price-cta" + (card.popular ? " is-filled" : "")));
      article.appendChild(featureBlock(card.featureTitle, card.features));
      article.appendChild(bfMark());
      if (card.popular) article.insertBefore(el("div", "price-ribbon"), article.firstChild).textContent = "Popular";
      return article;
    }

    function customBar(custom) {
      var bar = el("div", "price-custom");
      var copy = el("div", "price-custom-copy");
      var heading = el("h3");
      heading.textContent = custom.title;
      var desc = el("p");
      desc.textContent = custom.desc;
      copy.appendChild(heading);
      copy.appendChild(desc);
      bar.appendChild(copy);
      if (custom.features) bar.appendChild(featureBlock(custom.featureTitle, custom.features, "price-custom-features"));
      bar.appendChild(outbound(custom.href, custom.cta, "price-custom-cta"));
      return bar;
    }

    function findCard(productId, name) {
      var cards = catalog[productId].cards;
      for (var i = 0; i < cards.length; i++) {
        if (cards[i].name === name) return cards[i];
      }
      return null;
    }

    function fillSelect(select, tiers, keep) {
      var prev = keep ? select.value : "";
      select.replaceChildren();
      tiers.forEach(function (tier) {
        var option = document.createElement("option");
        option.value = String(tier[0]);
        option.textContent = String(tier[0]);
        option.setAttribute("data-price", String(tier[1]));
        select.appendChild(option);
      });
      if (!prev) return;
      for (var i = 0; i < select.options.length; i++) {
        if (select.options[i].value === prev) {
          select.value = prev;
          return;
        }
      }
    }

    function paintPaid(cardEl, card, isYear, keepQuota) {
      var select = cardEl.querySelector("[data-quota]");
      fillSelect(select, isYear ? card.year : card.month, keepQuota);
      var selected = select.options[select.selectedIndex];
      paintFigures(cardEl, selected.getAttribute("data-price"));
      var annual = catalog[cardEl.getAttribute("data-product")].periodMode === "annual";
      cardEl.querySelector(".price-period").textContent = annual && isYear ? "/year" : "/month";
      var over = cardEl.querySelector(".price-over");
      if (over) over.hidden = !!isYear;
      var save = cardEl.querySelector(".price-save");
      if (save) save.hidden = !isYear;
    }

    function syncProduct(productId, keepQuota) {
      var panel = document.getElementById("plans-panel-" + productId);
      var isYear = yearly[productId];
      document.querySelectorAll(".bill-tabs [data-bill]").forEach(function (tab) {
        var selected = (tab.getAttribute("data-bill") === "year") === !!isYear;
        tab.setAttribute("aria-selected", selected ? "true" : "false");
      });
      panel.querySelectorAll("[data-card]").forEach(function (cardEl) {
        var card = findCard(productId, cardEl.getAttribute("data-card"));
        if (!card) return;
        if (card.free) {
          var quota = cardEl.querySelector("[data-free-quota]");
          if (quota) quota.textContent = isYear ? quota.getAttribute("data-year-text") : quota.getAttribute("data-month-text");
          return;
        }
        if (card.month) paintPaid(cardEl, card, isYear, keepQuota);
      });
    }

    var head = document.getElementById("plans-lead") || document.getElementById("plans-title");
    if (head && !head.parentElement.querySelector(".bill-tabs")) {
      var tabs = el("div", "bill-tabs");
      tabs.setAttribute("role", "tablist");
      tabs.setAttribute("aria-label", "Billing period");
      [["month", "Monthly"], ["year", "Yearly"]].forEach(function (item) {
        var tab = el("button", "bill-tab");
        tab.type = "button";
        tab.setAttribute("role", "tab");
        tab.setAttribute("data-bill", item[0]);
        tab.setAttribute("aria-selected", item[0] === "month" ? "true" : "false");
        tab.textContent = item[1];
        if (item[0] === "year") {
          var mark = el("span", "bill-bf");
          mark.textContent = "Black Friday";
          tab.appendChild(mark);
        }
        tabs.appendChild(tab);
      });
      head.insertAdjacentElement("afterend", tabs);
      tabs.addEventListener("click", function (event) {
        var tab = event.target.closest("[data-bill]");
        if (!tab) return;
        yearly.tracking = tab.getAttribute("data-bill") === "year";
        syncProduct("tracking", catalog.tracking.keepQuota);
      });
    }

    stage.replaceChildren();
    var product = catalog.tracking;
    product.id = "tracking";
    var panel = el("div", "price-panel");
    panel.id = "plans-panel-tracking";
    var grid = el("div", "price-cards");
    product.cards.forEach(function (card) {
      grid.appendChild(card.free ? freeCard(product, card) : paidCard(product, card));
    });
    panel.appendChild(grid);
    if (product.custom) panel.appendChild(customBar(product.custom));
    stage.appendChild(panel);
    syncProduct("tracking", false);

    stage.addEventListener("change", function (event) {
      var target = event.target;
      if (target.matches("[data-quota]")) {
        var cardEl = target.closest(".price-card");
        var selected = target.options[target.selectedIndex];
        paintFigures(cardEl, selected.getAttribute("data-price"));
      }
    });
  }
})();
