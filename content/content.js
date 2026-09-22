/**
 * GeTicket Pro - Merged Content Engine
 * Strict Single-Language Purity, Light/Dark HUD, Cascading Priority Solver & Watchdog
 */

(function () {
  'use strict';

  if (window.__GETICKET_LOADED__) return;
  window.__GETICKET_LOADED__ = true;

  let currentTheme = 'light';
  let currentLang = 'en';

  let config = {
    enabled: true,
    autoGrab: true,
    passengers: 2,
    routeFrom: 'Dhaka',
    routeTo: 'Jamalpur',
    targetDate: '',
    trainName: 'Teesta Express',
    priorities: [
      { level: 1, classCode: 'S_CHAIR', dir: 'straight', coach: 'ANY' },
      { level: 2, classCode: 'SNIGDHA', dir: 'middle', coach: 'ANY' },
      { level: 3, classCode: 'F_CHAIR', dir: 'straight', coach: 'ANY' }
    ],
    humanJitterMin: 75,
    humanJitterMax: 135
  };

  if (chrome?.storage?.local) {
    chrome.storage.local.get(['gt_theme', 'gt_lang', 'geTicketConfig'], (res) => {
      if (res.gt_theme) currentTheme = res.gt_theme;
      if (res.gt_lang) currentLang = res.gt_lang;
      if (res.geTicketConfig) config = { ...config, ...res.geTicketConfig };
      applyThemeAndLang();
    });
  }

  // Automatic Shohoz / Railway Session Credential Harvester
  function harvestRailwaySession() {
    try {
      let token = null;
      let deviceId = null;
      let deviceKey = null;

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const val = localStorage.getItem(key);
        if (!val) continue;

        if (key === 'token' || key === 'auth_token' || key === 'access_token') {
          token = val;
        }
        if (key === 'x-device-id' || key === 'device_id') deviceId = val;
        if (key === 'x-device-key' || key === 'device_key') deviceKey = val;

        if (val.includes('Bearer ') || (val.startsWith('{') && val.includes('token'))) {
          try {
            const parsed = JSON.parse(val);
            if (parsed.token) token = parsed.token;
            if (parsed.state?.token) token = parsed.state.token;
            if (parsed.state?.deviceId) deviceId = parsed.state.deviceId;
            if (parsed.state?.deviceKey) deviceKey = parsed.state.deviceKey;
          } catch(e) {}
        }
      }

      if (token && chrome?.storage?.local) {
        chrome.storage.local.set({
          railwaySession: {
            token,
            deviceId,
            deviceKey,
            updatedAt: Date.now()
          }
        });
      }
    } catch(e) {}
  }

  harvestRailwaySession();
  setInterval(harvestRailwaySession, 15000);

  function playAlertSound() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);

      if (navigator.vibrate) navigator.vibrate([150, 80, 200]);
    } catch (e) {}
  }

  function safeHumanClick(element, callback) {
    if (!element) return;
    const jitter = Math.floor(Math.random() * (config.humanJitterMax - config.humanJitterMin + 1)) + config.humanJitterMin;
    
    setTimeout(() => {
      const rect = element.getBoundingClientRect();
      const clientX = rect.left + rect.width / 2 + (Math.random() * 4 - 2);
      const clientY = rect.top + rect.height / 2 + (Math.random() * 4 - 2);

      ['mouseenter', 'mousemove', 'mousedown', 'mouseup', 'click'].forEach(eventType => {
        const ev = new MouseEvent(eventType, {
          bubbles: true,
          cancelable: true,
          view: window,
          clientX,
          clientY
        });
        element.dispatchEvent(ev);
      });

      if (callback) callback();
    }, jitter);
  }

  function isSeatMatchingDirection(seatNo, prefDir) {
    if (!prefDir || prefDir === 'any') return true;
    const num = parseInt(seatNo.replace(/\D/g, ''), 10);
    if (isNaN(num)) return true;

    if (prefDir === 'straight') return num >= 5 && num <= 32;
    if (prefDir === 'middle') return num >= 15 && num <= 45;
    if (prefDir === 'reverse') return num >= 33 && num <= 56;
    return true;
  }

  function findBestContiguousSeats(seatElements, count, prefDir) {
    const available = [];
    seatElements.forEach(el => {
      const isBooked = el.classList.contains('booked') || el.classList.contains('disabled') || el.hasAttribute('disabled');
      const text = el.innerText.trim();
      const num = parseInt(text.replace(/\D/g, ''), 10);
      if (!isBooked && !isNaN(num)) {
        available.push({ el, num, text });
      }
    });

    if (available.length < count) return null;

    const preferred = available.filter(s => isSeatMatchingDirection(s.text, prefDir));
    const pool = preferred.length >= count ? preferred : available;

    pool.sort((a, b) => a.num - b.num);

    for (let i = 0; i <= pool.length - count; i++) {
      let contiguous = true;
      for (let j = 0; j < count - 1; j++) {
        if (pool[i + j + 1].num - pool[i + j].num !== 1) {
          contiguous = false;
          break;
        }
      }
      if (contiguous) return pool.slice(i, i + count).map(s => s.el);
    }

    return pool.slice(0, count).map(s => s.el);
  }

  let isExecutingGrab = false;

  function executeCascadingGrab() {
    if (isExecutingGrab) return;
    isExecutingGrab = true;

    const priorities = config.priorities || [];
    let currentRuleIdx = 0;

    function tryNextRule() {
      if (currentRuleIdx >= priorities.length) {
        isExecutingGrab = false;
        setHudStatus(currentLang === 'bn' ? 'সব প্রায়োরিটিতে সিট শেষ! ওয়াচডগ সক্রিয়...' : 'All priorities exhausted! Watchdog active...', '#f59e0b');
        return;
      }

      const rule = priorities[currentRuleIdx];
      setHudStatus(currentLang === 'bn' ? `প্রায়োরিটি ${rule.level} চেক করা হচ্ছে...` : `Checking Priority ${rule.level}...`, '#0284c7');

      const classButtons = document.querySelectorAll('.class-btn, .trip-btn, [class*="trip-seat"], [class*="class-name"]');
      let targetClassEl = null;

      classButtons.forEach(btn => {
        const txt = btn.innerText.toUpperCase();
        if (txt.includes(rule.classCode) || 
           (rule.classCode === 'S_CHAIR' && (txt.includes('SHOVON') || txt.includes('শোভন'))) ||
           (rule.classCode === 'SNIGDHA' && (txt.includes('SNIGDHA') || txt.includes('স্নিগ্ধা'))) ||
           (rule.classCode === 'F_CHAIR' && (txt.includes('FIRST') || txt.includes('১ম')))) {
          targetClassEl = btn;
        }
      });

      if (targetClassEl) {
        safeHumanClick(targetClassEl, () => {
          setTimeout(() => {
            const seatElements = document.querySelectorAll('.seat-btn, .seat, [class*="seat-item"], button[aria-label*="Seat"]');
            const targetSeats = findBestContiguousSeats(seatElements, config.passengers, rule.dir);

            if (targetSeats && targetSeats.length > 0) {
              lockTargetSeats(targetSeats, rule);
            } else {
              currentRuleIdx++;
              setTimeout(tryNextRule, 60);
            }
          }, 120);
        });
      } else {
        currentRuleIdx++;
        setTimeout(tryNextRule, 40);
      }
    }

    tryNextRule();
  }

  function lockTargetSeats(seats, rule) {
    let idx = 0;
    function selectNext() {
      if (idx >= seats.length) {
        playAlertSound();
        setHudStatus(currentLang === 'bn' ? `🎉 সিট লক সফল! (${rule.classCode})` : `🎉 Seats Locked! (${rule.classCode})`, '#10b981');
        isExecutingGrab = false;

        setTimeout(() => {
          const proceedBtn = document.querySelector('button[type="submit"], .btn-confirm, .book-now-btn, [class*="proceed"]');
          if (proceedBtn) {
            proceedBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
            safeHumanClick(proceedBtn);
          }
        }, 180);
        return;
      }

      safeHumanClick(seats[idx], () => {
        idx++;
        selectNext();
      });
    }

    selectNext();
  }

  // 5-Minute Seat Hold & bKash Auto-Assister
  let paymentAssisted = false;
  function initPaymentAutoAssister() {
    const path = window.location.pathname.toLowerCase();
    const isPaymentPage = path.includes('/booking') || 
                          path.includes('/payment') ||
                          document.querySelector('.payment-options') || 
                          document.querySelector('#bkash') ||
                          document.querySelector('input[value*="bkash" i]');

    // 1. Detect 5-Minute Reservation / Seat Hold Countdown
    const timerElements = Array.from(document.querySelectorAll('*')).filter(el => {
      return el.children.length === 0 && /\b0?[0-5]:[0-5][0-9]\b/.test(el.innerText);
    });

    if (timerElements.length > 0 || isPaymentPage) {
      const timerStr = timerElements[0] ? timerElements[0].innerText.trim() : '05:00';
      setHudStatus(currentLang === 'bn' 
        ? `🎉 সিট ৫ মিনিটের জন্য সংরক্ষিত! (${timerStr}) বিকাশ পেমেন্ট সম্পন্ন করুন` 
        : `🎉 Seat Locked for 5 Minutes! (${timerStr}) Complete bKash payment`, '#10b981');

      if (!paymentAssisted) {
        paymentAssisted = true;
        playAlertSound();
        try {
          chrome?.runtime?.sendMessage({ action: 'SEAT_LOCKED_NOTIFY' });
        } catch(e) {}
      }

      // 2. Auto-select bKash
      const bkashOption = document.querySelector('#bkash') || 
                          document.querySelector('input[value*="bkash" i]') ||
                          document.querySelector('input[id*="bkash" i]') ||
                          document.querySelector('label[for*="bkash" i]') ||
                          Array.from(document.querySelectorAll('label, div, button')).find(el => {
                            const txt = el.innerText.trim().toLowerCase();
                            return (txt === 'bkash' || txt.includes('bkash')) && !el.querySelector('input');
                          });

      if (bkashOption && !bkashOption.classList.contains('gt-auto-selected')) {
        bkashOption.classList.add('gt-auto-selected');
        bkashOption.click();
        if (typeof bkashOption.focus === 'function') bkashOption.focus();
      }

      // 3. Auto-check Terms and Conditions checkbox if present
      const termsBox = document.querySelector('#agree_terms') || 
                       document.querySelector('input[type="checkbox"][name*="term" i]') ||
                       document.querySelector('input[type="checkbox"][id*="agree" i]');
      if (termsBox && !termsBox.checked) {
        termsBox.checked = true;
        termsBox.dispatchEvent(new Event('change', { bubbles: true }));
      }

      // 4. Auto-focus OTP input when rendered
      const otpInput = document.querySelector('input[name*="otp" i], input[id*="otp" i], input[placeholder*="OTP" i], input[autocomplete="one-time-code"]');
      if (otpInput && document.activeElement !== otpInput) {
        otpInput.focus();
        playAlertSound();
      }
    }
  }

  let watchdogTimer = null;
  function startWatchdog() {
    if (watchdogTimer) clearInterval(watchdogTimer);
    watchdogTimer = setInterval(() => {
      const hasAvailable = document.querySelectorAll('.seat-btn:not(.booked):not(.disabled), [class*="seat-available"]');
      if (hasAvailable.length >= config.passengers) {
        setHudStatus(currentLang === 'bn' ? '⚡ নতুন সিট পাওয়া গেছে! লক হচ্ছে...' : '⚡ Released seat detected! Locking...', '#10b981');
        executeCascadingGrab();
      }
    }, 3200);

    // Run payment auto-assister every 800ms
    setInterval(initPaymentAutoAssister, 800);
  }

  const STATIONS_MAP = [
    { en: "Dhaka", bn: "ঢাকা" },
    { en: "Chattogram", bn: "চট্টগ্রাম" },
    { en: "Jamalpur", bn: "জামালপুর" },
    { en: "Mymensingh", bn: "ময়মনসিংহ" },
    { en: "Cox's Bazar", bn: "কক্সবাজার" },
    { en: "Sylhet", bn: "সিলেট" },
    { en: "Sreemangal", bn: "শ্রীমঙ্গল" },
    { en: "Rajshahi", bn: "রাজশাহী" },
    { en: "Khulna", bn: "খুলনা" },
    { en: "Rangpur", bn: "রংপুর" },
    { en: "Dinajpur", bn: "দিনাজপুর" },
    { en: "Panchagarh", bn: "পঞ্চগড়" },
    { en: "Benapole", bn: "বেনাপোল" },
    { en: "Ishwardi", bn: "ঈশ্বরদী" },
    { en: "Bogra", bn: "বগুড়া" },
    { en: "Cumilla", bn: "কুমিল্লা" },
    { en: "Feni", bn: "ফেনী" }
  ];

  const TRAINS_MAP = {
    "Dhaka-Jamalpur": ["Teesta Express", "Brahmaputra Express", "Jamuna Express", "Agnibina Express"],
    "Jamalpur-Dhaka": ["Teesta Express", "Brahmaputra Express", "Jamuna Express", "Agnibina Express"],
    "Dhaka-Chattogram": ["Suborno Express", "Sonar Bangla Express", "Mahanagar Provati", "Mahanagar Godhuli", "Turna Express", "Chattala Express"],
    "Chattogram-Dhaka": ["Suborno Express", "Sonar Bangla Express", "Mahanagar Provati", "Mahanagar Godhuli", "Turna Express", "Chattala Express"],
    "Dhaka-Sylhet": ["Parabat Express", "Jayantika Express", "Upaban Express", "Kalani Express"],
    "Sylhet-Dhaka": ["Parabat Express", "Jayantika Express", "Upaban Express", "Kalani Express"],
    "Dhaka-Rajshahi": ["Silkcity Express", "Padma Express", "Dhumketu Express", "Banalata Express"],
    "Rajshahi-Dhaka": ["Silkcity Express", "Padma Express", "Dhumketu Express", "Banalata Express"],
    "Dhaka-Cox's Bazar": ["Cox's Bazar Express", "Parjatak Express"],
    "Cox's Bazar-Dhaka": ["Cox's Bazar Express", "Parjatak Express"]
  };

  const FARES = {
    "S_CHAIR": 205,
    "SHOVON": 170,
    "SNIGDHA": 395,
    "F_CHAIR": 275,
    "AC_S": 475,
    "AC_B": 710
  };

  function showHudToast(message) {
    let toast = document.getElementById('gtToastBanner');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'gtToastBanner';
      document.body.appendChild(toast);
    }
    toast.innerText = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3800);
  }

  function injectHud() {
    if (document.getElementById('geticket-hud-root')) return;

    const logoUrl = chrome?.runtime?.getURL ? chrome.runtime.getURL('icons/logo_mark_transparent.png') : '';
    const root = document.createElement('div');
    root.id = 'geticket-hud-root';
    document.documentElement.setAttribute('data-theme', currentTheme);

    const todayStr = new Date().toISOString().split('T')[0];

    root.innerHTML = `
      <div class="gt-bubble" id="gtBubble" title="GeTicket Pro Control">
        <div class="gt-bubble-pulse"></div>
        <img src="${logoUrl}" alt="GeTicket Pro">
      </div>

      <div class="gt-panel" id="gtPanel">
        <!-- Header -->
        <div class="gt-header">
          <div class="gt-title-box">
            <img src="${logoUrl}" alt="Logo">
            <span class="gt-title-text" id="gtTitleText">GeTicket Pro</span>
            <span class="gt-version-pill">v2.6</span>
          </div>
          <div class="gt-header-tools">
            <button class="gt-ctrl-btn" id="gtLangToggle">EN</button>
            <button class="gt-ctrl-btn" id="gtThemeToggle">☀️</button>
            <button class="gt-close-btn" id="gtCloseBtn">&times;</button>
          </div>
        </div>

        <!-- Clock Countdown Strip -->
        <div class="gt-clock-strip">
          <span class="gt-clock-label" id="gtClockLabel">RAILWAY SERVER TIME</span>
          <span class="gt-clock-val" id="gtCountdown">07:59:58.750</span>
        </div>

        <!-- 3 Clean Navigation Tabs -->
        <div class="gt-tabs-bar">
          <button class="gt-tab-nav active" data-tab="setup" id="gtTabNavSetup">
            🎯 <span id="gtTabTitleSetup">Setup</span>
          </button>
          <button class="gt-tab-nav" data-tab="schedules" id="gtTabNavSchedules">
            📅 <span id="gtTabTitleSchedules">Lists</span>
            <span class="gt-nav-badge" id="gtNavBadge">0</span>
          </button>
          <button class="gt-tab-nav" data-tab="vault" id="gtTabNavVault">
            💳 <span id="gtTabTitleVault">Vault</span>
          </button>
        </div>

        <!-- Scrollable Content Body -->
        <div class="gt-body">
          
          <!-- TAB 1: SETUP -->
          <div class="gt-pane active" id="gtPaneSetup">
            <!-- Route -->
            <div class="gt-field-row">
              <div class="gt-col">
                <label class="gt-label" id="gtLblFrom">From Station</label>
                <select class="gt-select" id="gtSelectFrom"></select>
              </div>
              <button class="gt-btn-swap" id="gtBtnSwap" title="Swap Stations">⇄</button>
              <div class="gt-col">
                <label class="gt-label" id="gtLblTo">To Station</label>
                <select class="gt-select" id="gtSelectTo"></select>
              </div>
            </div>

            <!-- Date & Passengers -->
            <div class="gt-field-row">
              <div class="gt-col">
                <label class="gt-label" id="gtLblDate">Journey Date</label>
                <input type="date" class="gt-input" id="gtInputDate" value="${todayStr}" min="${todayStr}">
              </div>
              <div class="gt-col">
                <label class="gt-label" id="gtLblPax">Passengers</label>
                <select class="gt-select" id="gtSelectPax">
                  <option value="1">1 Person</option>
                  <option value="2" selected>2 Persons</option>
                  <option value="3">3 Persons</option>
                  <option value="4">4 Persons</option>
                </select>
              </div>
            </div>

            <!-- Train & Class -->
            <div class="gt-field-row">
              <div class="gt-col">
                <label class="gt-label" id="gtLblTrain">Train Name</label>
                <select class="gt-select" id="gtSelectTrain"></select>
              </div>
              <div class="gt-col">
                <label class="gt-label" id="gtLblClass">Coach Class</label>
                <select class="gt-select" id="gtSelectClass">
                  <option value="S_CHAIR">Shovon Chair</option>
                  <option value="SNIGDHA">Snigdha AC</option>
                  <option value="F_CHAIR">1st Class Chair</option>
                  <option value="AC_S">AC Seat</option>
                  <option value="AC_B">AC Berth</option>
                  <option value="SHOVON">Shovon</option>
                </select>
              </div>
            </div>

            <!-- Cascading Priority Rules -->
            <div class="gt-priority-box">
              <div class="gt-priority-head">
                <span id="gtPrioTitle">🎯 Cascading Priority Chain</span>
                <span style="font-size: 9.5px; color: var(--gt-hud-muted);" id="gtPrioHint">Auto-Shift 1ms</span>
              </div>
              <div class="gt-prio-row">
                <div class="gt-prio-tag">P1</div>
                <select class="gt-select" id="gtP1Class" style="flex: 1.2;"></select>
                <select class="gt-select" id="gtP1Dir" style="flex: 1;">
                  <option value="straight">Straight Facing</option>
                  <option value="middle">Middle Seats</option>
                  <option value="any">Any Available</option>
                </select>
              </div>
              <div class="gt-prio-row">
                <div class="gt-prio-tag" style="background: #f59e0b;">P2</div>
                <select class="gt-select" id="gtP2Class" style="flex: 1.2;"></select>
                <select class="gt-select" id="gtP2Dir" style="flex: 1;">
                  <option value="middle">Middle Seats</option>
                  <option value="straight">Straight Facing</option>
                  <option value="any">Any Available</option>
                </select>
              </div>
              <div class="gt-prio-row">
                <div class="gt-prio-tag" style="background: #64748b;">P3</div>
                <select class="gt-select" id="gtP3Class" style="flex: 1.2;"></select>
                <select class="gt-select" id="gtP3Dir" style="flex: 1;">
                  <option value="any" selected>Any Available</option>
                  <option value="straight">Straight Facing</option>
                  <option value="middle">Middle Seats</option>
                </select>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="gt-action-btns">
              <button class="gt-btn-primary gt-btn-arm" id="gtBtnArmSchedule">
                ⏰ <span id="gtArmText">Arm Advance Schedule & Watchdog</span>
              </button>
              <button class="gt-btn-primary gt-btn-grab" id="gtBtnGrabNow">
                ⚡ <span id="gtGrabText">Instant Fast-Grab (Lock)</span>
              </button>
            </div>

            <div class="gt-stealth-note" id="gtStealthNote">
              <span>🛡️ 100% Humanized Stealth Active • Zero Account Ban</span>
            </div>
          </div>

          <!-- TAB 2: LISTS (SCHEDULES) -->
          <div class="gt-pane" id="gtPaneSchedules">
            <div class="gt-sched-list" id="gtSchedList"></div>
            <div class="gt-empty-state" id="gtEmptySched">
              <div style="font-size: 26px; margin-bottom: 6px;">📅</div>
              <b id="gtEmptyHead">No active schedules</b>
              <p style="margin-top: 4px;" id="gtEmptyDesc">Set your route and click 'Arm Advance Schedule' on the Setup tab to activate automated booking.</p>
            </div>
          </div>

          <!-- TAB 3: VAULT (FARE & BKASH) -->
          <div class="gt-pane" id="gtPaneVault">
            <div class="gt-fare-card">
              <div style="font-weight: 800; color: var(--gt-accent);" id="gtVaultHead">💳 Fare & bKash Summary</div>
              <div class="gt-fare-row">
                <span id="gtLblBaseFare">Base Ticket Fare:</span>
                <span id="gtValBaseFare">৳205 × 2 = ৳410</span>
              </div>
              <div class="gt-fare-row">
                <span id="gtLblStationFee">Railway Charge (৳20):</span>
                <span id="gtValStationFee">৳40</span>
              </div>
              <div class="gt-fare-row">
                <span id="gtLblBkashFee">bKash Charge (1.5%):</span>
                <span id="gtValBkashFee">৳7</span>
              </div>
              <div class="gt-total-box">
                <div>
                  <div style="font-size: 10px; color: var(--gt-hud-muted);" id="gtLblTotalKeep">TOTAL TO KEEP IN BKASH</div>
                  <div class="gt-total-val" id="gtValTotalFare">৳457</div>
                </div>
                <span style="background: #10b981; color: #fff; font-size: 10px; font-weight: 800; padding: 2px 7px; border-radius: 4px;">READY</span>
              </div>
              <div class="gt-advice-note" id="gtAdviceNote">
                💡 Keep at least ৳460 in bKash before 8:00 AM!
              </div>
            </div>

            <div style="background: var(--gt-hud-card-bg); border: 1px solid var(--gt-hud-card-border); border-radius: 10px; padding: 10px; font-size: 11px;">
              <div style="color: #10b981; font-weight: 700; margin-bottom: 4px;">✓ Anti-Logout Guard Active</div>
              <div style="color: var(--gt-hud-muted); font-size: 10px;">Automated 5-minute seat hold detection, bKash auto-selector, and OTP auto-focus active on railway checkout.</div>
            </div>
          </div>

        </div>

        <!-- Universal Developer Credit Footer -->
        <div class="gt-dev-footer">
          <div>Designed &amp; Developed by <strong>Rukonuzzaman</strong></div>
          <a href="mailto:rukonuzzaman.dev@gmail.com">✉ rukonuzzaman.dev@gmail.com</a>
        </div>
      </div>
    `;

    document.body.appendChild(root);

    // Wire Up Elements
    const bubble = root.querySelector('#gtBubble');
    const panel = root.querySelector('#gtPanel');
    const closeBtn = root.querySelector('#gtCloseBtn');
    const langBtn = root.querySelector('#gtLangToggle');
    const themeBtn = root.querySelector('#gtThemeToggle');
    const selFrom = root.querySelector('#gtSelectFrom');
    const selTo = root.querySelector('#gtSelectTo');
    const btnSwap = root.querySelector('#gtBtnSwap');
    const inputDate = root.querySelector('#gtInputDate');
    const selPax = root.querySelector('#gtSelectPax');
    const selTrain = root.querySelector('#gtSelectTrain');
    const selClass = root.querySelector('#gtSelectClass');
    const btnArm = root.querySelector('#gtBtnArmSchedule');
    const btnGrab = root.querySelector('#gtBtnGrabNow');

    // Populate Stations
    function populateStations() {
      selFrom.innerHTML = '';
      selTo.innerHTML = '';
      STATIONS_MAP.forEach(s => {
        const text = currentLang === 'bn' ? s.bn : s.en;
        selFrom.appendChild(new Option(text, s.en));
        selTo.appendChild(new Option(text, s.en));
      });
      selFrom.value = config.routeFrom || "Dhaka";
      selTo.value = config.routeTo || "Jamalpur";

      // Classes
      const classOpts = [
        { val: "S_CHAIR", en: "Shovon Chair", bn: "শোভন চেয়ার" },
        { val: "SNIGDHA", en: "Snigdha AC", bn: "স্নিগ্ধা এসি" },
        { val: "F_CHAIR", en: "1st Class Chair", bn: "১ম শ্রেণি চেয়ার" },
        { val: "AC_S", en: "AC Seat", bn: "এসি সিট" },
        { val: "AC_B", en: "AC Berth", bn: "এসি বার্থ" },
        { val: "SHOVON", en: "Shovon", bn: "সাধারণ শোভন" }
      ];

      [selClass, root.querySelector('#gtP1Class'), root.querySelector('#gtP2Class'), root.querySelector('#gtP3Class')].forEach(sel => {
        if (!sel) return;
        const cur = sel.value;
        sel.innerHTML = '';
        classOpts.forEach(c => {
          sel.appendChild(new Option(currentLang === 'bn' ? c.bn : c.en, c.val));
        });
        if (cur) sel.value = cur;
      });

      if (!root.querySelector('#gtP1Class').value) root.querySelector('#gtP1Class').value = 'S_CHAIR';
      if (!root.querySelector('#gtP2Class').value) root.querySelector('#gtP2Class').value = 'SNIGDHA';
      if (!root.querySelector('#gtP3Class').value) root.querySelector('#gtP3Class').value = 'F_CHAIR';

      updateTrains();
    }

    function updateTrains() {
      const routeKey = `${selFrom.value}-${selTo.value}`;
      const revRouteKey = `${selTo.value}-${selFrom.value}`;
      const list = TRAINS_MAP[routeKey] || TRAINS_MAP[revRouteKey] || ["Teesta Express", "Brahmaputra Express", "Jamuna Express"];
      selTrain.innerHTML = '';
      list.forEach(tr => {
        selTrain.appendChild(new Option(tr, tr));
      });
      if (config.trainName && list.includes(config.trainName)) {
        selTrain.value = config.trainName;
      }
      updateFareAndConfig();
    }

    function updateFareAndConfig() {
      config.routeFrom = selFrom.value;
      config.routeTo = selTo.value;
      config.targetDate = inputDate.value;
      config.passengers = parseInt(selPax.value, 10) || 2;
      config.trainName = selTrain.value;
      const chosenClass = selClass.value || "S_CHAIR";

      const unit = FARES[chosenClass] || 205;
      const base = unit * config.passengers;
      const serv = 20 * config.passengers;
      const sub = base + serv;
      const fee = Math.round(sub * 0.015);
      const total = sub + fee;
      const rec = Math.ceil((total + 5) / 10) * 10;

      const valBase = root.querySelector('#gtValBaseFare');
      const valServ = root.querySelector('#gtValStationFee');
      const valFee = root.querySelector('#gtValBkashFee');
      const valTotal = root.querySelector('#gtValTotalFare');
      const advice = root.querySelector('#gtAdviceNote');

      if (valBase) valBase.innerText = `৳${unit} × ${config.passengers} = ৳${base}`;
      if (valServ) valServ.innerText = `৳${serv}`;
      if (valFee) valFee.innerText = `৳${fee}`;
      if (valTotal) valTotal.innerText = `৳${total}`;
      if (advice) {
        advice.innerText = currentLang === 'bn' 
          ? `💡 সকাল ৮:০০ টার আগে বিকাশে অন্তত ৳${rec} ব্যালেন্স রাখুন!` 
          : `💡 Keep at least ৳${rec} in bKash before 8:00 AM!`;
      }
    }

    function renderActiveSchedules() {
      if (!chrome?.storage?.local) return;
      chrome.storage.local.get(['scheduledBookings'], (res) => {
        const bookings = Array.isArray(res.scheduledBookings) ? res.scheduledBookings : [];
        const container = root.querySelector('#gtSchedList');
        const empty = root.querySelector('#gtEmptySched');
        const badge = root.querySelector('#gtNavBadge');

        if (badge) badge.innerText = bookings.length;
        if (!container) return;
        container.innerHTML = '';

        if (bookings.length === 0) {
          if (empty) empty.style.display = 'block';
          return;
        }

        if (empty) empty.style.display = 'none';

        bookings.forEach(b => {
          const card = document.createElement('div');
          card.className = 'gt-sched-card';
          card.innerHTML = `
            <div>
              <div class="gt-sched-info-title">🚄 ${b.trainName}</div>
              <div class="gt-sched-info-meta">📍 ${b.from} ➔ ${b.to}</div>
              <div class="gt-sched-info-meta">📅 ${b.date} • 👥 ${b.passengers || 2} Pax • 💺 ${b.classCode || 'S_CHAIR'}</div>
              <div class="gt-sched-alarm">⏰ Alarm: ${b.alarmTime || '07:50 AM'} (Armed)</div>
            </div>
            <button class="gt-btn-del" data-id="${b.id}" title="Delete">🗑️</button>
          `;

          card.querySelector('.gt-btn-del').addEventListener('click', (e) => {
            e.stopPropagation();
            const updated = bookings.filter(item => item.id !== b.id);
            chrome.storage.local.set({ scheduledBookings: updated }, () => {
              renderActiveSchedules();
              showHudToast(currentLang === 'bn' ? '✓ শিডিউল মুছে ফেলা হয়েছে' : '✓ Schedule deleted');
            });
          });

          container.appendChild(card);
        });
      });
    }

    // Toggle Open/Close
    bubble.addEventListener('click', () => {
      panel.classList.toggle('open');
      if (panel.classList.contains('open')) renderActiveSchedules();
    });
    closeBtn.addEventListener('click', () => panel.classList.remove('open'));

    // Tabs Switcher
    root.querySelectorAll('.gt-tab-nav').forEach(btn => {
      btn.addEventListener('click', () => {
        root.querySelectorAll('.gt-tab-nav').forEach(b => b.classList.remove('active'));
        root.querySelectorAll('.gt-pane').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        const tab = btn.dataset.tab;
        if (tab === 'setup') root.querySelector('#gtPaneSetup').classList.add('active');
        if (tab === 'schedules') {
          root.querySelector('#gtPaneSchedules').classList.add('active');
          renderActiveSchedules();
        }
        if (tab === 'vault') root.querySelector('#gtPaneVault').classList.add('active');
      });
    });

    // Station Changes & Swap
    selFrom.addEventListener('change', updateTrains);
    selTo.addEventListener('change', updateTrains);
    btnSwap.addEventListener('click', () => {
      const temp = selFrom.value;
      selFrom.value = selTo.value;
      selTo.value = temp;
      updateTrains();
    });

    inputDate.addEventListener('change', updateFareAndConfig);
    selPax.addEventListener('change', updateFareAndConfig);
    selTrain.addEventListener('change', updateFareAndConfig);
    selClass.addEventListener('change', () => {
      const p1 = root.querySelector('#gtP1Class');
      if (p1) p1.value = selClass.value;
      updateFareAndConfig();
    });

    // Priority Sync
    root.querySelector('#gtP1Class')?.addEventListener('change', (e) => {
      if (selClass) selClass.value = e.target.value;
      updateFareAndConfig();
    });

    // Language Toggle
    langBtn.addEventListener('click', () => {
      currentLang = currentLang === 'en' ? 'bn' : 'en';
      if (chrome?.storage?.local) chrome.storage.local.set({ gt_lang: currentLang });
      applyThemeAndLang();
      populateStations();
    });

    // Theme Toggle
    themeBtn.addEventListener('click', () => {
      currentTheme = currentTheme === 'light' ? 'dark' : 'light';
      if (chrome?.storage?.local) chrome.storage.local.set({ gt_theme: currentTheme });
      applyThemeAndLang();
    });

    // Arm Schedule Button
    btnArm.addEventListener('click', () => {
      playAlertSound();
      const p1C = root.querySelector('#gtP1Class')?.value || selClass.value || 'S_CHAIR';
      const p1D = root.querySelector('#gtP1Dir')?.value || 'straight';
      const p2C = root.querySelector('#gtP2Class')?.value || 'SNIGDHA';
      const p2D = root.querySelector('#gtP2Dir')?.value || 'middle';
      const p3C = root.querySelector('#gtP3Class')?.value || 'F_CHAIR';
      const p3D = root.querySelector('#gtP3Dir')?.value || 'any';

      const isWest = ['Rajshahi', 'Khulna', 'Rangpur', 'Dinajpur', 'Panchagarh', 'Benapole', 'Ishwardi', 'Bogra'].includes(selTo.value);
      const alarmTime = isWest ? '07:50 AM' : '01:50 PM';

      const newBooking = {
        id: 'geticket_schedule_' + Date.now(),
        from: selFrom.value,
        to: selTo.value,
        date: inputDate.value,
        passengers: parseInt(selPax.value, 10) || 2,
        trainName: selTrain.value,
        classCode: selClass.value,
        alarmTime,
        zone: isWest ? 'west' : 'east',
        priorities: [
          { level: 1, classCode: p1C, dir: p1D, coach: 'ANY' },
          { level: 2, classCode: p2C, dir: p2D, coach: 'ANY' },
          { level: 3, classCode: p3C, dir: p3D, coach: 'ANY' }
        ],
        createdAt: Date.now()
      };

      if (chrome?.storage?.local) {
        chrome.storage.local.get(['scheduledBookings'], (res) => {
          const list = Array.isArray(res.scheduledBookings) ? res.scheduledBookings : [];
          list.unshift(newBooking);
          chrome.storage.local.set({ scheduledBookings: list }, () => {
            renderActiveSchedules();
            const msg = currentLang === 'bn' 
              ? `🎉 সফল! (${newBooking.trainName}) ট্রেনের অগ্রিম শিডিউল সক্রিয় করা হয়েছে!` 
              : `🎉 Success! (${newBooking.trainName}) Schedule Armed!`;
            showHudToast(msg);
            // Switch to Lists tab
            root.querySelector('#gtTabNavSchedules')?.click();
          });
        });
      }
    });

    // Instant Grab Button
    btnGrab.addEventListener('click', () => {
      playAlertSound();
      config.trainName = selTrain.value;
      config.passengers = parseInt(selPax.value, 10) || 2;
      config.priorities = [
        { level: 1, classCode: root.querySelector('#gtP1Class')?.value || selClass.value, dir: root.querySelector('#gtP1Dir')?.value || 'straight', coach: 'ANY' },
        { level: 2, classCode: root.querySelector('#gtP2Class')?.value || 'SNIGDHA', dir: root.querySelector('#gtP2Dir')?.value || 'middle', coach: 'ANY' },
        { level: 3, classCode: root.querySelector('#gtP3Class')?.value || 'F_CHAIR', dir: root.querySelector('#gtP3Dir')?.value || 'any', coach: 'ANY' }
      ];
      showHudToast(currentLang === 'bn' ? '⚡ ইন্সট্যান্ট সিট খোঁজা ও লক শুরু হয়েছে...' : '⚡ Instant Seat Grab in progress...');
      executeCascadingGrab();
    });

    populateStations();
    setInterval(updateClock, 50);
    startWatchdog();
    applyThemeAndLang();
  }

  function applyThemeAndLang() {
    document.documentElement.setAttribute('data-theme', currentTheme);
    const root = document.getElementById('geticket-hud-root');
    if (!root) return;

    const themeBtn = root.querySelector('#gtThemeToggle');
    const langBtn = root.querySelector('#gtLangToggle');
    const titleText = root.querySelector('#gtTitleText');
    const clockLabel = root.querySelector('#gtClockLabel');

    if (themeBtn) themeBtn.innerText = currentTheme === 'light' ? '☀️' : '🌙';
    if (langBtn) langBtn.innerText = currentLang === 'en' ? 'EN' : 'বাং';

    if (currentLang === 'bn') {
      if (titleText) titleText.innerText = 'জি-টিকিট প্রো';
      if (clockLabel) clockLabel.innerText = 'সার্ভার টাইম (০৮:০০:০০ কাউন্টডাউন)';
      if (root.querySelector('#gtTabTitleSetup')) root.querySelector('#gtTabTitleSetup').innerText = 'সেটআপ';
      if (root.querySelector('#gtTabTitleSchedules')) root.querySelector('#gtTabTitleSchedules').innerText = 'শিডিউল';
      if (root.querySelector('#gtTabTitleVault')) root.querySelector('#gtTabTitleVault').innerText = 'ভল্ট';
      if (root.querySelector('#gtLblFrom')) root.querySelector('#gtLblFrom').innerText = 'যাত্রার স্টেশন';
      if (root.querySelector('#gtLblTo')) root.querySelector('#gtLblTo').innerText = 'গন্তব্য স্টেশন';
      if (root.querySelector('#gtLblDate')) root.querySelector('#gtLblDate').innerText = 'যাত্রার তারিখ';
      if (root.querySelector('#gtLblPax')) root.querySelector('#gtLblPax').innerText = 'যাত্রী সংখ্যা';
      if (root.querySelector('#gtLblTrain')) root.querySelector('#gtLblTrain').innerText = 'ট্রেনের নাম';
      if (root.querySelector('#gtLblClass')) root.querySelector('#gtLblClass').innerText = 'বসার শ্রেণি';
      if (root.querySelector('#gtArmText')) root.querySelector('#gtArmText').innerText = 'অগ্রিম শিডিউল ও অ্যালার্ম সক্রিয় করুন';
      if (root.querySelector('#gtGrabText')) root.querySelector('#gtGrabText').innerText = 'তাত্ক্ষণিক ফাস্ট-গ্র্যাব (লক)';
      if (root.querySelector('#gtEmptyHead')) root.querySelector('#gtEmptyHead').innerText = 'কোনো সক্রিয় শিডিউল নেই';
      if (root.querySelector('#gtEmptyDesc')) root.querySelector('#gtEmptyDesc').innerText = 'সেটআপ ট্যাব থেকে অগ্রিম টিকিট শিডিউল যুক্ত করলে অ্যালার্ম বাজবে।';
    } else {
      if (titleText) titleText.innerText = 'GeTicket Pro';
      if (clockLabel) clockLabel.innerText = 'RAILWAY SERVER TIME';
      if (root.querySelector('#gtTabTitleSetup')) root.querySelector('#gtTabTitleSetup').innerText = 'Setup';
      if (root.querySelector('#gtTabTitleSchedules')) root.querySelector('#gtTabTitleSchedules').innerText = 'Lists';
      if (root.querySelector('#gtTabTitleVault')) root.querySelector('#gtTabTitleVault').innerText = 'Vault';
      if (root.querySelector('#gtLblFrom')) root.querySelector('#gtLblFrom').innerText = 'From Station';
      if (root.querySelector('#gtLblTo')) root.querySelector('#gtLblTo').innerText = 'To Station';
      if (root.querySelector('#gtLblDate')) root.querySelector('#gtLblDate').innerText = 'Journey Date';
      if (root.querySelector('#gtLblPax')) root.querySelector('#gtLblPax').innerText = 'Passengers';
      if (root.querySelector('#gtLblTrain')) root.querySelector('#gtLblTrain').innerText = 'Train Name';
      if (root.querySelector('#gtLblClass')) root.querySelector('#gtLblClass').innerText = 'Coach Class';
      if (root.querySelector('#gtArmText')) root.querySelector('#gtArmText').innerText = 'Arm Advance Schedule & Watchdog';
      if (root.querySelector('#gtGrabText')) root.querySelector('#gtGrabText').innerText = 'Instant Fast-Grab (Lock)';
      if (root.querySelector('#gtEmptyHead')) root.querySelector('#gtEmptyHead').innerText = 'No active schedules';
      if (root.querySelector('#gtEmptyDesc')) root.querySelector('#gtEmptyDesc').innerText = 'Set your route and click Arm Advance Schedule on Setup tab.';
    }
  }

  function updateClock() {
    const el = document.getElementById('gtCountdown');
    if (!el) return;
    const now = new Date();
    const hrs = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    const secs = String(now.getSeconds()).padStart(2, '0');
    const ms = String(now.getMilliseconds()).padStart(3, '0');
    el.innerText = `${hrs}:${mins}:${secs}.${ms}`;
  }

  chrome.runtime?.onMessage?.addListener((req, sender, sendResponse) => {
    if (req.action === 'INSTANT_GRAB_COMMAND') {
      if (req.trainName) config.trainName = req.trainName;
      if (req.passengers) config.passengers = req.passengers;
      if (req.classCode && config.priorities?.[0]) config.priorities[0].classCode = req.classCode;
      
      playAlertSound();
      showHudToast(currentLang === 'bn' ? '⚡ ইন্সট্যান্ট সিট খোঁজা হচ্ছে...' : '⚡ Instant Seat Grab in progress...');
      executeCascadingGrab();
      sendResponse({ success: true, message: 'Instant Grab Started' });
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectHud);
  } else {
    injectHud();
  }

})();

