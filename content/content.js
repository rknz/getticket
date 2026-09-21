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

  function injectHud() {
    if (document.getElementById('geticket-hud-root')) return;

    const logoUrl = chrome?.runtime?.getURL ? chrome.runtime.getURL('icons/icon48.png') : '';
    const root = document.createElement('div');
    root.id = 'geticket-hud-root';
    document.documentElement.setAttribute('data-theme', currentTheme);

    root.innerHTML = `
      <div class="gt-bubble" id="gtBubble" title="GeTicket Pro">
        <img src="${logoUrl}" alt="GeTicket Pro" style="width: 32px; height: 32px; object-fit: contain; pointer-events: none; display: block;">
      </div>
      <div class="gt-panel" id="gtPanel">
        <div class="gt-header">
          <div class="gt-title" style="display: flex; align-items: center; gap: 7px;">
            <img src="${logoUrl}" alt="GeTicket Pro" style="width: 20px; height: 20px; object-fit: contain; display: block;">
            <span id="gtMainTitle">GeTicket Pro</span>
          </div>
          <div class="gt-ctrl-btns">
            <button class="gt-icon-btn" id="gtLangToggle">EN</button>
            <button class="gt-icon-btn" id="gtThemeToggle">☀️</button>
            <button class="gt-icon-btn" id="gtCloseBtn">&times;</button>
          </div>
        </div>

        <div class="gt-clock">
          <div class="gt-clock-label" id="gtClockLabel">RAILWAY SERVER TIME (COUNTDOWN)</div>
          <div class="gt-clock-time" id="gtCountdown">07:59:58.750</div>
        </div>

        <div class="gt-target">
          <div class="gt-target-title">
            <span id="gtTargetTitle">🎯 Target Armed</span>
            <span style="color: #10b981;" id="gtPax">${config.passengers} Seats</span>
          </div>
          <div style="color: var(--gt-hud-muted); font-size: 11px;" id="gtTargetDesc">
            ${config.routeFrom} ➔ ${config.routeTo} | ${config.trainName || 'Teesta'}
          </div>
        </div>

        <div class="gt-watchdog">
          <span style="font-size: 16px;">📡</span>
          <div>
            <div style="color: #f59e0b; font-weight: 600;" id="gtWatchdogTitle">Continuous Seat Watchdog</div>
            <div style="color: var(--gt-hud-muted); font-size: 10px;" id="gtWatchdogDesc">Monitoring 1-5m & 15m released seats...</div>
          </div>
        </div>

        <button class="gt-btn gt-btn-grab" id="gtGrabBtn">
          ⚡ <span id="gtGrabText">Instant Fast-Grab (Lock)</span>
        </button>

        <div class="gt-badge-stealth" id="gtStealthBadge">
          <span>🛡️ 100% Humanized Stealth Active</span>
        </div>
      </div>
    `;

    document.body.appendChild(root);

    const bubble = root.querySelector('#gtBubble');
    const panel = root.querySelector('#gtPanel');
    const closeBtn = root.querySelector('#gtCloseBtn');
    const grabBtn = root.querySelector('#gtGrabBtn');
    const langBtn = root.querySelector('#gtLangToggle');
    const themeBtn = root.querySelector('#gtThemeToggle');

    bubble.addEventListener('click', () => panel.classList.toggle('open'));
    closeBtn.addEventListener('click', () => panel.classList.remove('open'));
    grabBtn.addEventListener('click', () => executeCascadingGrab());

    langBtn.addEventListener('click', () => {
      currentLang = currentLang === 'en' ? 'bn' : 'en';
      if (chrome?.storage?.local) chrome.storage.local.set({ gt_lang: currentLang });
      applyThemeAndLang();
    });

    themeBtn.addEventListener('click', () => {
      currentTheme = currentTheme === 'light' ? 'dark' : 'light';
      if (chrome?.storage?.local) chrome.storage.local.set({ gt_theme: currentTheme });
      applyThemeAndLang();
    });

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
    const mainTitle = root.querySelector('#gtMainTitle');
    const clockLabel = root.querySelector('#gtClockLabel');
    const targetTitle = root.querySelector('#gtTargetTitle');
    const grabText = root.querySelector('#gtGrabText');
    const watchdogTitle = root.querySelector('#gtWatchdogTitle');
    const watchdogDesc = root.querySelector('#gtWatchdogDesc');
    const stealthBadge = root.querySelector('#gtStealthBadge');

    if (themeBtn) themeBtn.innerText = currentTheme === 'light' ? '☀️' : '🌙';
    if (langBtn) langBtn.innerText = currentLang === 'en' ? 'EN' : 'বাং';

    if (currentLang === 'bn') {
      if (mainTitle) mainTitle.innerText = 'জি-টিকিট প্রো';
      if (clockLabel) clockLabel.innerText = 'সার্ভার টাইম (০৮:০০:০০ কাউন্টডাউন)';
      if (targetTitle) targetTitle.innerText = '🎯 টার্গেট প্রস্তুত';
      if (grabText) grabText.innerText = 'তাত্ক্ষণিক ফাস্ট-গ্র্যাব (লক)';
      if (watchdogTitle) watchdogTitle.innerText = 'কন্টিনিউয়াস সিট ওয়াচডগ';
      if (watchdogDesc) watchdogDesc.innerText = '১-৫ মিনিট ও ১৫ মিনিটের রিলিজ সিটের অপেক্ষায়...';
      if (stealthBadge) stealthBadge.innerHTML = '<span>🛡️ ১০০% হিউম্যানাইজড শিল্ড সক্রিয়</span>';
    } else {
      if (mainTitle) mainTitle.innerText = 'GeTicket Pro';
      if (clockLabel) clockLabel.innerText = 'RAILWAY SERVER TIME (COUNTDOWN)';
      if (targetTitle) targetTitle.innerText = '🎯 Target Armed';
      if (grabText) grabText.innerText = 'Instant Fast-Grab (Lock)';
      if (watchdogTitle) watchdogTitle.innerText = 'Continuous Seat Watchdog';
      if (watchdogDesc) watchdogDesc.innerText = 'Monitoring 1-5m & 15m released seats...';
      if (stealthBadge) stealthBadge.innerHTML = '<span>🛡️ 100% Humanized Stealth Active</span>';
    }
  }

  function setHudStatus(msg, color) {
    const el = document.getElementById('gtWatchdogTitle');
    if (el) {
      el.innerText = msg;
      if (color) el.style.color = color;
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
      setHudStatus(currentLang === 'bn' ? '⚡ ইন্সট্যান্ট সিট খোঁজা হচ্ছে...' : '⚡ Instant Seat Grab in progress...', '#0284c7');
      attemptCascadingGrab();
      sendResponse({ success: true, message: 'Instant Grab Started' });
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectHud);
  } else {
    injectHud();
  }

})();
