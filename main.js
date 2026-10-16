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
    button.addEventListener("click", function () {
      var code = button.getAttribute("data-copy-code") || "BFCM2026";
      var status = document.getElementById(button.getAttribute("data-copy-status") || "copy-status");
      copyText(code, function (ok) {
        var message = ok ? "Copied" : "Select BFCM2026 and copy it manually.";
        if (status) status.textContent = inline ? message : (ok ? "Code copied." : message);
        if (!inline) button.textContent = ok ? "Copied" : label;
      });
    });
  });

  var stats = document.querySelector("#numbers .stats");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var statRollCss = [
    ":host{position:relative;display:block}",
    ".stat-roll{position:absolute;top:0;left:0;display:inline-flex;align-items:flex-end;height:1.15em;white-space:nowrap;pointer-events:none;user-select:none}",
    ".stat-digit{position:relative;flex:0 0 auto;width:1ch;height:1.15em;overflow:clip;line-height:1.15}",
    ".stat-digit-strip{position:absolute;top:0;left:0;display:flex;flex-direction:column;width:100%;margin:0;transform:translateY(0);transition:transform 1400ms cubic-bezier(0.16,0.55,0.24,1);transition-delay:calc(var(--stat-i,0)*90ms + var(--digit-i,0)*45ms)}",
    ".stat-digit-strip>span{display:block;height:1.15em;line-height:1.15;flex:0 0 1.15em}",
    ".stat-mark,.stat-suffix{height:1.15em;line-height:1.15;flex:0 0 auto}",
    ".stat-suffix{white-space:pre}",
    ":host-context(.stats.is-in) .stat-digit-strip{transform:translateY(calc(var(--roll) / (var(--roll) + 1) * -100%))}",
    "@media (prefers-reduced-motion:reduce){.stat-digit-strip{transition:none;transform:translateY(calc(var(--roll) / (var(--roll) + 1) * -100%))}}"
  ].join("");

  function mountStatRolls(list) {
    var values = list.querySelectorAll(".stat-value");
    Array.prototype.forEach.call(values, function (el) {
      var raw = (el.textContent || "").replace(/\s+/g, " ").trim();
      var match = raw.match(/^(\d+(?:\.\d+)?)(.*)$/);
      if (!match || el.shadowRoot) return;
      var figure = match[1];
      var suffix = match[2];
      var item = el.closest("li");
      var statIndex = item ? Array.prototype.indexOf.call(list.children, item) : 0;
      var roll = document.createElement("span");
      var digitIndex = 0;
      roll.className = "stat-roll";
      roll.setAttribute("aria-hidden", "true");

      for (var i = 0; i < figure.length; i++) {
        var ch = figure.charAt(i);
        if (ch < "0" || ch > "9") {
          var mark = document.createElement("span");
          mark.className = "stat-mark";
          mark.setAttribute("aria-hidden", "true");
          mark.textContent = ch;
          roll.appendChild(mark);
          continue;
        }
        var steps = 10 + (ch.charCodeAt(0) - 48);
        var cell = document.createElement("span");
        var strip = document.createElement("span");
        cell.className = "stat-digit";
        cell.setAttribute("aria-hidden", "true");
        strip.className = "stat-digit-strip";
        strip.setAttribute("aria-hidden", "true");
        strip.style.setProperty("--roll", String(steps));
        strip.style.setProperty("--digit-i", String(digitIndex));
        strip.style.setProperty("--stat-i", String(statIndex));
        digitIndex += 1;
        for (var step = 0; step <= steps; step++) {
          var glyph = document.createElement("span");
          glyph.textContent = String(step % 10);
          glyph.setAttribute("aria-hidden", "true");
          strip.appendChild(glyph);
        }
        cell.appendChild(strip);
        roll.appendChild(cell);
      }

      if (suffix) {
        var tail = document.createElement("span");
        tail.className = "stat-suffix";
        tail.setAttribute("aria-hidden", "true");
        tail.textContent = suffix;
        roll.appendChild(tail);
      }

      var finalText = document.createElement("span");
      finalText.className = "stat-final";
      finalText.textContent = raw;
      el.textContent = "";
      el.appendChild(finalText);
      var shadow = el.attachShadow({ mode: "open" });
      var style = document.createElement("style");
      var slot = document.createElement("slot");
      style.textContent = statRollCss;
      shadow.append(style, roll, slot);
      el.classList.add("has-roll");
    });
  }

  if (stats && "IntersectionObserver" in window && !reduceMotion) {
    mountStatRolls(stats);
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
    var indicator = document.getElementById("plans-indicator");
    var tabs = document.querySelector(".price-tabs-track");
    if (!stage || !tabs) return;

    var shopify = "https://apps.shopify.com/17track?utm_source=www.17track.com&utm_medium=pricing&utm_campaign=button";
    var returnsHref = "https://www.17returns.com?utm_source=www.17track.com&utm_medium=pricing&utm_campaign=button";
    var apiHref = "https://www.17track.net/en/api?utm_source=www.17track.com&utm_medium=pricing&utm_campaign=button";
    var contact = "https://www.17track.com/en/contact-us";
    var returnsBasics = [
      "Green return",
      "Unfulfilled order cancellation",
      "Basic workflows",
      "Rule configuration and process automation",
      "AI rule builder",
      "AI multi-language localization"
    ];
    var apiFeatures = [
      "3,500+ carriers supported",
      "Batch tracking and automatic updates",
      "Shipment dashboard and management",
      "Carrier identification and auto-matching",
      "HTTP protocol, compatible with all systems",
      "SLA commitment to 99.9% high availability"
    ];

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
      },
      returns: {
        href: returnsHref,
        cta: "Start Free Trial",
        quotaLabel: "Returns / Month",
        periodMode: "month",
        keepQuota: true,
        saveText: "Save ~18%",
        cards: [
          {
            name: "Free",
            free: true,
            desc: "Ideal for no-return refunds and basic after-sales automation, reducing return costs",
            quotaMonth: "10 returns per month",
            quotaYear: "10 returns per year",
            featureTitle: "Free plan benefits",
            features: returnsBasics
          },
          {
            name: "Basic",
            desc: "Ideal for no-return refunds and basic after-sales automation, reducing return costs",
            featureTitle: "Basic plan benefits",
            overage: "Additional Returns: $0.20 each",
            month: [[20, 5], [60, 12], [100, 18], [200, 32], [400, 59]],
            year: [[20, 4], [60, 10], [100, 15], [200, 27], [400, 48]],
            features: returnsBasics
          },
          {
            name: "Pro",
            desc: "Automate returns and exchanges with a branded self-service experience.",
            featureTitle: "24 Core Features",
            overage: "Additional Returns: $0.50 each",
            month: [[20, 11], [60, 29], [100, 44], [200, 79], [400, 139]],
            year: [[20, 9], [60, 24], [100, 36], [200, 65], [400, 115]],
            features: [
              "Branded Portal · Self-Service Returns · Tracking · Embedded Center",
              "Refunds · Exchanges · Keep-It Refunds · Cancellations",
              "AI Rules · Workflows · Smart Queues · AI Assistant",
              "Store Credit Refunds · Fees · Price Difference Settlement",
              "Shipping Rate Comparison · Aggregated/Own Carriers · Labels · QR Codes",
              "Branded Emails · Shopify · Multi-Store · Multi-Language"
            ]
          },
          {
            name: "Max",
            popular: true,
            desc: "Turn returns into a new revenue stream.",
            featureTitle: "Everything in Pro, plus:",
            overage: "Additional Returns: $1.20 each",
            month: [[20, 29], [60, 79], [100, 119], [200, 209], [400, 369]],
            year: [[20, 24], [60, 65], [100, 99], [200, 169], [400, 299]],
            features: [
              "Advanced Workflows (Amount / Country / Delivery Time)",
              "Compensation-Based Retention",
              "Store Credit Retention",
              "Exchange-Based Retention",
              "Revenue Recovery Dashboard",
              "Open API Access"
            ]
          }
        ],
        custom: {
          title: "Enterprise Plan",
          desc: "Tailored for Enterprise Merchants with Custom Return Capacity and Deep Integrations",
          featureTitle: "Includes everything in Max, plus:",
          features: [
            "Enterprise Benefits",
            "Custom Return Volume",
            "Dedicated Customer Success Manager",
            "SLA & Priority Support",
            "Custom Integrations",
            "Data Migration Service",
            "Multi-Brand / Multi-Region Deployment"
          ],
          cta: "Get a Quote",
          href: contact
        }
      },
      api: {
        href: apiHref,
        cta: "Get Started",
        cards: [
          { name: "Basic", api: true, unit: "0.0238", line: "5,000 quota / $ 119", featureTitle: "What's in Basic", features: apiFeatures },
          { name: "Advanced", api: true, unit: "0.0228", line: "25,000 quota / $ 569", featureTitle: "What's in Advanced", features: apiFeatures },
          { name: "Pro", api: true, unit: "0.0191", line: "150,000 quota / $ 2,869", featureTitle: "What's in Pro", features: apiFeatures },
          { name: "Flagship", api: true, popular: true, unit: "0.0186", line: "500,000 quota / $ 9,299", featureTitle: "What's in Flagship", features: apiFeatures }
        ],
        custom: {
          title: "Custom",
          desc: "For customized services, please scan the QR code to contact our sales team.",
          cta: "Contact Us",
          href: contact
        }
      }
    };

    var order = ["tracking", "returns", "api"];
    var yearly = { tracking: false, returns: false };

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

    function cardHead(card, plain) {
      var head = el("div", "price-card-head" + (plain ? " is-plain" : ""));
      var heading = el("h3");
      var name = el("span");
      name.textContent = card.name;
      heading.appendChild(name);
      if (card.popular) {
        var chip = el("span", "price-pop");
        chip.textContent = "Popular";
        heading.appendChild(chip);
      }
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
      var spacer = el("div", "price-bill");
      spacer.setAttribute("aria-hidden", "true");
      offer.appendChild(spacer);
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
      var bill = el("div", "price-bill");
      var label = el("label");
      var input = el("input");
      input.type = "checkbox";
      input.id = "bill-" + product.id + "-" + card.name.toLowerCase();
      input.setAttribute("data-yearly", "");
      input.setAttribute("data-product", product.id);
      var toggle = el("span", "price-switch");
      toggle.setAttribute("aria-hidden", "true");
      var caption = el("span");
      caption.textContent = "Billed yearly";
      label.appendChild(input);
      label.appendChild(toggle);
      label.appendChild(caption);
      bill.appendChild(label);
      if (product.saveText) {
        var save = el("span", "price-save");
        save.textContent = product.saveText;
        save.hidden = true;
        bill.appendChild(save);
      }
      offer.appendChild(bill);
      var amount = el("p", "price-amount");
      amount.appendChild(el("span", "price-figure"));
      var period = el("span", "price-period");
      period.textContent = "/month";
      amount.appendChild(period);
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
      return article;
    }

    function apiCard(product, card) {
      var article = el("article", "price-card" + (card.popular ? " is-popular" : ""));
      article.appendChild(cardHead(card, true));
      var offer = el("div", "price-offer is-api");
      var unit = el("div");
      var label = el("p", "price-unit-label");
      label.textContent = "Unit Price";
      var figure = el("p", "price-unit-figure");
      figure.textContent = "$ " + card.unit;
      unit.appendChild(label);
      unit.appendChild(figure);
      var line = el("p", "price-unit-line");
      line.textContent = card.line;
      offer.appendChild(unit);
      offer.appendChild(line);
      article.appendChild(offer);
      article.appendChild(outbound(product.href, product.cta, "price-cta" + (card.popular ? " is-filled" : "")));
      article.appendChild(featureBlock(card.featureTitle, card.features));
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
      cardEl.querySelector(".price-figure").textContent = "US $" + selected.getAttribute("data-price");
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
      panel.querySelectorAll("[data-yearly]").forEach(function (box) {
        box.checked = isYear;
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

    function show(productId) {
      order.forEach(function (id, index) {
        var on = id === productId;
        var tab = document.getElementById("plans-tab-" + id);
        var panel = document.getElementById("plans-panel-" + id);
        tab.setAttribute("aria-selected", on ? "true" : "false");
        tab.tabIndex = on ? 0 : -1;
        panel.hidden = !on;
        if (on && indicator) indicator.style.setProperty("--i", String(index));
      });
    }

    stage.replaceChildren();
    order.forEach(function (id) {
      var product = catalog[id];
      product.id = id;
      var panel = el("div", "price-panel");
      panel.id = "plans-panel-" + id;
      panel.setAttribute("role", "tabpanel");
      panel.setAttribute("aria-labelledby", "plans-tab-" + id);
      panel.hidden = id !== "tracking";
      var grid = el("div", "price-cards");
      product.cards.forEach(function (card) {
        if (card.api) grid.appendChild(apiCard(product, card));
        else if (card.free) grid.appendChild(freeCard(product, card));
        else grid.appendChild(paidCard(product, card));
      });
      panel.appendChild(grid);
      if (product.custom) panel.appendChild(customBar(product.custom));
      stage.appendChild(panel);
      if (product.cards.some(function (card) { return card.month || card.free; })) syncProduct(id, false);
    });

    tabs.addEventListener("click", function (event) {
      var tab = event.target.closest("[data-plan-tab]");
      if (!tab) return;
      show(tab.getAttribute("data-plan-tab"));
    });

    tabs.addEventListener("keydown", function (event) {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
      var buttons = Array.prototype.slice.call(tabs.querySelectorAll("[data-plan-tab]"));
      var current = 0;
      buttons.forEach(function (button, index) {
        if (button.getAttribute("aria-selected") === "true") current = index;
      });
      var next = event.key === "ArrowRight"
        ? (current + 1) % buttons.length
        : (current - 1 + buttons.length) % buttons.length;
      event.preventDefault();
      show(buttons[next].getAttribute("data-plan-tab"));
      buttons[next].focus();
    });

    stage.addEventListener("change", function (event) {
      var target = event.target;
      if (target.matches("[data-yearly]")) {
        var productId = target.getAttribute("data-product");
        yearly[productId] = target.checked;
        syncProduct(productId, catalog[productId].keepQuota);
        return;
      }
      if (target.matches("[data-quota]")) {
        var cardEl = target.closest(".price-card");
        var selected = target.options[target.selectedIndex];
        cardEl.querySelector(".price-figure").textContent = "US $" + selected.getAttribute("data-price");
      }
    });

    show("tracking");
  }
})();
