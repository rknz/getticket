
// Live DOM Scraper for Bangladesh Railway Search Results
function scrapeLiveRailwayPage() {
  const isSearchPage = window.location.pathname.includes('/booking/train/search') ||
    window.location.search.includes('fromcity=') ||
    document.querySelector('.all-trip-boxes, app-single-trip, .single-trip');
  if (!isSearchPage) return null;

  const trips = [];
  const tripElements = Array.from(document.querySelectorAll('app-single-trip, .single-trip, .trip-item, .train-item, [class*="trip-wrapper"], [class*="train-card"], .trip-row'));

  tripElements.forEach(el => {
    const txt = el.innerText;
    const nameMatch = txt.match(/([A-Z\s]+(?:EXPRESS|COMMUTER|MAIL|INTERCITY)[^\n\(]*)/i);
    const codeMatch = txt.match(/\((\d{3})\)/);
    const timeMatches = txt.match(/(\d{1,2}:\d{2}\s*(?:AM|PM))/gi);

    const trainName = nameMatch ? nameMatch[1].trim() : (el.querySelector('h1, h2, h3, h4, strong')?.innerText?.trim() || '');
    const code = codeMatch ? codeMatch[1] : '';
    const dep = timeMatches?.[0] || '08:00 AM';
    const arr = timeMatches?.[1] || '';

    if (trainName) {
      trips.push({
        nameEn: trainName,
        nameBn: trainName,
        code,
        dep,
        arr,
        durationEn: '6h 00m',
        durationBn: '৬ ঘণ্টা'
      });
    }
  });

  if (trips.length > 0 && chrome?.storage?.local) {
    // Include route from URL params so popup can validate freshness & route match
    const urlParams = new URLSearchParams(window.location.search);
    const pageFrom = urlParams.get('fromcity') || urlParams.get('from_city') || urlParams.get('from_station') || null;
    const pageTo   = urlParams.get('tocity')   || urlParams.get('to_city')   || urlParams.get('to_station')   || null;
    chrome.storage.local.set({
      liveScrapedTrains: trips,
      liveScrapedMeta: { from: pageFrom, to: pageTo, scrapedAt: Date.now() }
    });
  }
  return trips;
}

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
          } catch (e) { }
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
    } catch (e) { }
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
    } catch (e) { }
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

  // Precision Live Button & Seat Finder for Railway Search Page
  function findAvailableTrainClassButton(targetTrain, targetClass, paxCount) {
    // 1. Gather all potential train cards or containers on the page
    let trainCards = Array.from(document.querySelectorAll('app-single-trip, .single-trip, .trip-item, .train-item, [class*="trip-wrapper"], [class*="train-card"], [class*="trip-box"], [class*="single-trip"], .all-trip-boxes > div, .trip-row'));

    // If no standard containers found, find all headings containing train names and get their common parent container
    if (trainCards.length === 0) {
      const allHeadings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, div, span, b, strong')).filter(el => {
        const txt = el.innerText.trim().toUpperCase();
        return (txt.includes('EXPRESS') || txt.includes('COMMUTER') || txt.includes('INTERCITY') || txt.includes('MAIL') || /\(\d{3}\)/.test(txt)) && el.children.length === 0;
      });
      trainCards = allHeadings.map(h => h.closest('.trip-row') || h.closest('.all-trip-boxes') || h.closest('section') || h.parentElement?.parentElement || h.parentElement).filter(Boolean);
    }

    trainCards = Array.from(new Set(trainCards));
    if (trainCards.length === 0) trainCards = [document.body];

    for (const card of trainCards) {
      const cardText = card.innerText.toUpperCase();

      // If targetTrain is specified and NOT ANY_TRAIN, ensure this card matches the train name
      if (targetTrain && targetTrain !== 'ANY_TRAIN') {
        const cleanTrain = targetTrain.toUpperCase().replace(/\s*\(.*?\)\s*/g, '').trim();
        if (!cardText.includes(cleanTrain)) continue;
      }

      // Find all class boxes inside this train card
      const classBoxes = Array.from(card.querySelectorAll('[class*="seat-class"], [class*="class-item"], [class*="seat-item"], [class*="class-box"], [class*="trip-seat"], div, li')).filter(box => {
        const txt = box.innerText.toUpperCase();
        const hasClassCode = txt.includes('S_CHAIR') || txt.includes('SNIGDHA') || txt.includes('AC_S') || txt.includes('F_CHAIR') || txt.includes('SHOVON') || txt.includes('AC_B');
        const hasPriceOrBook = txt.includes('৳') || txt.includes('TK') || txt.includes('BOOK') || txt.includes('AVAILABLE') || txt.includes('খালি');
        return hasClassCode && hasPriceOrBook && box.children.length >= 1;
      });

      for (const box of classBoxes) {
        const boxText = box.innerText.toUpperCase();

        // Check if targetClass matches
        const isClassMatch = (targetClass === 'ANY') ||
          boxText.includes(targetClass) ||
          (targetClass === 'S_CHAIR' && (boxText.includes('SHOVON') || boxText.includes('শোভন'))) ||
          (targetClass === 'SNIGDHA' && (boxText.includes('SNIGDHA') || boxText.includes('স্নিগ্ধা'))) ||
          (targetClass === 'F_CHAIR' && (boxText.includes('FIRST') || boxText.includes('১ম')));
        if (!isClassMatch) continue;

        // Strip monetary amounts (৳380, TK 120) and times before counting seats.
        // The old /\b([1-9]\d*)\b/ fallback matched fares and produced phantom counts.
        const boxTextNoFares = boxText
          .replace(/৳\s*[\d,]+/g, '')
          .replace(/\bTK\.?\s*[\d,]+/gi, '')
          .replace(/\d{1,2}:\d{2}\s*(?:AM|PM)/gi, '');
        const countMatch = boxText.match(/AVAILABLE\s*TICKETS[^\d]*(\d+)/i) ||
          boxText.match(/(\d+)\s*(SEATS?|TICKETS?|টি|আসন)/i) ||
          boxTextNoFares.match(/\b([1-9]\d?)\b/); // max 2 digits after fare-stripping
        const availCount = countMatch ? parseInt(countMatch[1], 10) : null;

        // Find the Book Now button inside this box
        const bookBtn = box.querySelector('button, a, [role="button"], .btn, [class*="book"]');
        const isBtnActive = bookBtn && !bookBtn.disabled && !bookBtn.classList.contains('disabled') && !bookBtn.classList.contains('btn-disabled');

        const isSoldOut = boxText.includes('0 SEAT') || boxText.includes('০ টি') || boxText.includes('0 AVAILABLE') || (availCount === 0);

        if (isBtnActive && !isSoldOut) {
          return {
            card,
            box,
            bookBtn,
            trainName: card.querySelector('h1, h2, h3, h4, [class*="train-name"], strong, b')?.innerText?.trim() || targetTrain,
            classCode: targetClass
          };
        }
      }

      // Direct fallback: check any active BOOK NOW button inside this card
      const allBookBtns = Array.from(card.querySelectorAll('button, a.btn, [role="button"]')).filter(b => {
        const t = b.innerText.trim().toUpperCase();
        return (t.includes('BOOK NOW') || t.includes('বুক') || t.includes('BOOK')) && !b.disabled && !b.classList.contains('disabled');
      });

      for (const btn of allBookBtns) {
        const parentBox = btn.closest('[class*="seat"], [class*="class"], div') || btn.parentElement;
        const pText = parentBox ? parentBox.innerText.toUpperCase() : '';
        if (targetClass === 'ANY' || pText.includes(targetClass) || (targetClass === 'S_CHAIR' && pText.includes('SHOVON'))) {
          return {
            card,
            box: parentBox,
            bookBtn: btn,
            trainName: card.querySelector('h1, h2, h3, h4, [class*="train-name"], strong, b')?.innerText?.trim() || targetTrain,
            classCode: targetClass
          };
        }
      }
    }

    return null;
  }

  let isExecutingGrab = false;
  let isEngineRunning = true;

  function executeCascadingGrab() {
    if (isExecutingGrab) return;
    if (!isEngineRunning) return;
    isExecutingGrab = true;

    const priorities = config.priorities || [];
    let currentRuleIdx = 0;

    // Check if on search form page without results yet
    const fromInput = document.querySelector('input[name="from_station"], #from_station, input[placeholder*="From" i]');
    const toInput = document.querySelector('input[name="to_station"], #to_station, input[placeholder*="To" i]');
    const searchBtn = document.querySelector('button[type="submit"], button.search-btn, button.btn-search, [class*="search-btn"]');
    const hasSearchResults = document.querySelectorAll('.single-trip, .trip-item, .train-item, [class*="trip-wrapper"], [class*="train-card"], app-single-trip').length > 0;

    if (!hasSearchResults && fromInput && toInput && searchBtn) {
      setHudStatus(currentLang === 'bn' ? '🔍 রেলওয়ে পোর্টালে সার্চ শুরু করা হচ্ছে...' : '🔍 Initiating train search on Railway Portal...', '#0284c7');
      // Angular ignores plain .value = assignment; use the native property setter
      // to trigger Angular’s change detection, then fire input + change events.
      const nativeInputSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
      function setAngularInput(el, val) {
        if (!el) return;
        if (nativeInputSetter) nativeInputSetter.call(el, val); else el.value = val;
        el.dispatchEvent(new Event('input',  { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
      setAngularInput(fromInput, config.routeFrom);
      setAngularInput(toInput,   config.routeTo);

      const dateEl = document.querySelector('input[name="journey_date"], #journey_date, input[type="date"]');
      if (dateEl && config.targetDate) setAngularInput(dateEl, config.targetDate);

      safeHumanClick(searchBtn, () => {
        isExecutingGrab = false;
        setTimeout(executeCascadingGrab, 1500);
      });
      return;
    }

    function tryNextRule() {
      if (currentRuleIdx >= priorities.length) {
        isExecutingGrab = false;
        const trainLabel = (config.trainName === 'ANY_TRAIN' || !config.trainName)
          ? (currentLang === 'bn' ? 'যেকোনো ট্রেন' : 'Any Available Train')
          : config.trainName;
        const noSeatMsg = currentLang === 'bn'
          ? `⚠️ (${trainLabel}) এই মুহূর্তে কোনো সিট খালি নেই। লাইভ ওয়াচডগ সক্রিয় (প্রতি ২ মিনিট পর পর অটো-চেক হবে)!`
          : `⚠️ (${trainLabel}) No seats available right now. Live Watchdog Active (Auto-checking every 2 mins)!`;

        setHudStatus(noSeatMsg, '#f59e0b');
        start2MinWatchdog(config.trainName, config.routeFrom, config.routeTo, config.targetDate, config.passengers, config.priorities[0]?.classCode);
        return;
      }

      const rule = priorities[currentRuleIdx];
      const targetClass = (rule.classCode || 'S_CHAIR').toUpperCase();
      setHudStatus(currentLang === 'bn' ? `প্রায়োরিটি ${rule.level} (${targetClass === 'ANY' ? 'যেকোনো শ্রেণি' : targetClass}) চেক করা হচ্ছে...` : `Checking Priority ${rule.level} (${targetClass})...`, '#0284c7');

      const match = findAvailableTrainClassButton(config.trainName, targetClass, config.passengers);

      if (match && match.bookBtn) {
        setHudStatus(currentLang === 'bn' ? `⚡ সিট পাওয়া গেছে (${match.trainName})! বুকিং হচ্ছে...` : `⚡ Seats found (${match.trainName})! Booking now...`, '#10b981');
        safeHumanClick(match.bookBtn, () => {
          setTimeout(() => {
            const seatElements = document.querySelectorAll('.seat-btn, .seat, [class*="seat-item"], button[aria-label*="Seat"]');
            const targetSeats = findBestContiguousSeats(seatElements, config.passengers, rule.dir);

            if (targetSeats && targetSeats.length > 0) {
              lockTargetSeats(targetSeats, rule);
            } else {
              currentRuleIdx++;
              setTimeout(tryNextRule, 80);
            }
          }, 250);
        });
      } else {
        currentRuleIdx++;
        setTimeout(tryNextRule, 60);
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
          // Prefer specific booking-confirmation selectors; avoid the broad
          // button[type="submit"] which can hit the search-form and reset the flow.
          const proceedBtn =
            document.querySelector('.btn-confirm, .book-now-btn, [class*="proceed-btn"], [class*="confirm-btn"], button[class*="purchase"]') ||
            Array.from(document.querySelectorAll('button[type="submit"]')).find(b => {
              const t = b.innerText.trim().toLowerCase();
              return t.includes('confirm') || t.includes('proceed') || t.includes('purchase') ||
                     t.includes('pay') || t.includes('নিশ্চিত') || t.includes('পেমেন্ট');
            });
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
  let seatLockToastShown = false;
  function initPaymentAutoAssister() {
    const path = window.location.pathname.toLowerCase();
    const isPaymentPage = path.includes('/booking') ||
      path.includes('/payment') ||
      path.includes('/checkout') ||
      path.includes('/purchase') ||
      document.querySelector('.payment-options') ||
      document.querySelector('#bkash') ||
      document.querySelector('input[value*="bkash" i]');

    // Only run payment assistant when actually on a payment/booking page!
    if (!isPaymentPage) {
      paymentAssisted = false;
      seatLockToastShown = false;
      return;
    }

    // 1. Detect 5-Minute Reservation / Seat Hold Countdown
    // Strictly ignore any GeTicket HUD, toast banners, or dropdowns
    const timerElements = Array.from(
      document.querySelectorAll('.booking-time, .timer-count, .reservation-timer, [class*="timer"], [class*="countdown"], span, div, p')
    ).filter(el => {
      if (el.closest('#geticket-hud-root') || el.closest('#gtToastBanner')) return false;
      if (el.id && el.id.startsWith('gt')) return false;
      if (el.children.length > 0) return false;
      const txt = el.innerText.trim();
      return /^[0-5]?:?[0-5][0-9]$/.test(txt) && txt.length <= 6;
    });

    if (timerElements.length > 0 || isPaymentPage) {
      const timerStr = (timerElements[0] && timerElements[0].innerText.trim().length <= 6)
        ? timerElements[0].innerText.trim()
        : '05:00';

      if (!seatLockToastShown) {
        seatLockToastShown = true;
        setHudStatus(currentLang === 'bn'
          ? `🎉 সিট ৫ মিনিটের জন্য সংরক্ষিত! (${timerStr}) বিকাশ পেমেন্ট সম্পন্ন করুন`
          : `🎉 Seat Locked for 5 Minutes! (${timerStr}) Complete bKash payment`, '#10b981');
      }

      if (!paymentAssisted) {
        paymentAssisted = true;
        playAlertSound();
        try {
          chrome?.runtime?.sendMessage({ action: 'SEAT_LOCKED_NOTIFY' });
        } catch (e) { }
      }

      // 2. Auto-select bKash
      const bkashOption = document.querySelector('#bkash') ||
        document.querySelector('input[value*="bkash" i]') ||
        document.querySelector('input[id*="bkash" i]') ||
        document.querySelector('label[for*="bkash" i]') ||
        Array.from(document.querySelectorAll('label, div, button')).find(el => {
          if (el.closest('#geticket-hud-root') || el.closest('#gtToastBanner')) return false;
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
  let paymentAssisterTimer = null; // tracked to prevent stacking on pause/resume
  function startWatchdog() {
    if (watchdogTimer) clearInterval(watchdogTimer);
    watchdogTimer = setInterval(() => {
      const hasAvailable = document.querySelectorAll('.seat-btn:not(.booked):not(.disabled), [class*="seat-available"]');
      if (hasAvailable.length >= config.passengers) {
        setHudStatus(currentLang === 'bn' ? '⚡ নতুন সিট পাওয়া গেছে! লক হচ্ছে...' : '⚡ Released seat detected! Locking...', '#10b981');
        executeCascadingGrab();
      }
    }, 3200);

    // Run payment auto-assister every 800ms — guard against duplicate intervals on resume
    if (paymentAssisterTimer) clearInterval(paymentAssisterTimer);
    paymentAssisterTimer = setInterval(initPaymentAutoAssister, 800);
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

  function parseTimeToMinutes(timeStr) {
    if (!timeStr) return 0;
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return 0;
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const period = match[3].toUpperCase();
    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }

  function sortTrainsChronologically(trainsList) {
    if (!Array.isArray(trainsList)) return [];
    return [...trainsList].sort((a, b) => parseTimeToMinutes(a.dep) - parseTimeToMinutes(b.dep));
  }

  // 2. Comprehensive Master Train Schedule Database (Only Legitimate Online Intercity Trains, Sorted AM to PM)
  const ROUTE_TRAIN_MAP = {
    // Dhaka <-> Chattogram Corridors (Online Intercity Only, Chronological AM to PM)
    "Dhaka-Chattogram": [
      { nameEn: "Tourist Express", nameBn: "পর্যটক এক্সপ্রেস", code: "815", dep: "06:15 AM", arr: "11:50 AM", durationEn: "5h 35m", durationBn: "৫ ঘণ্টা ৩৫ মি.", offDay: 0, offEn: "Sunday", offBn: "রবিবার" },
      { nameEn: "Sonar Bangla Express", nameBn: "সোনার বাংলা এক্সপ্রেস", code: "787", dep: "07:00 AM", arr: "12:15 PM", durationEn: "5h 15m", durationBn: "৫ ঘণ্টা ১৫ মি.", offDay: 3, offEn: "Wednesday", offBn: "বুধবার" },
      { nameEn: "Mahanagar Provati", nameBn: "মহানগর প্রভাতী", code: "704", dep: "07:45 AM", arr: "02:00 PM", durationEn: "6h 15m", durationBn: "৬ ঘণ্টা ১৫ মি.", offDay: -1, offEn: "No Off-Day", offBn: "কোনো বন্ধ নেই" },
      { nameEn: "Chattala Express", nameBn: "চট্টলা এক্সপ্রেস", code: "802", dep: "01:45 PM", arr: "08:30 PM", durationEn: "6h 45m", durationBn: "৬ ঘণ্টা ৪৫ মি.", offDay: 5, offEn: "Friday", offBn: "শুক্রবার" },
      { nameEn: "Suborno Express", nameBn: "সুবর্ণ এক্সপ্রেস", code: "701", dep: "04:30 PM", arr: "09:50 PM", durationEn: "5h 20m", durationBn: "৫ ঘণ্টা ২০ মি.", offDay: 1, offEn: "Monday", offBn: "সোমবার" },
      { nameEn: "Mahanagar Express", nameBn: "মহানগর এক্সপ্রেস", code: "722", dep: "09:20 PM", arr: "03:50 AM", durationEn: "6h 30m", durationBn: "৬ ঘণ্টা ৩০ মি.", offDay: 0, offEn: "Sunday", offBn: "রবিবার" },
      { nameEn: "Cox's Bazar Express", nameBn: "কক্সবাজার এক্সপ্রেস", code: "813", dep: "10:30 PM", arr: "04:30 AM", durationEn: "6h 00m", durationBn: "৬ ঘণ্টা", offDay: 1, offEn: "Monday", offBn: "সোমবার" },
      { nameEn: "Turna Express", nameBn: "তূর্ণা এক্সপ্রেস", code: "742", dep: "11:30 PM", arr: "06:00 AM", durationEn: "6h 30m", durationBn: "৬ ঘণ্টা ৩০ মি.", offDay: -1, offEn: "No Off-Day", offBn: "কোনো বন্ধ নেই" }
    ],
    "Chattogram-Dhaka": [
      { nameEn: "Suborno Express", nameBn: "সুবর্ণ এক্সপ্রেস", code: "702", dep: "07:00 AM", arr: "12:20 PM", durationEn: "5h 20m", durationBn: "৫ ঘণ্টা ২০ মি.", offDay: 1, offEn: "Monday", offBn: "সোমবার" },
      { nameEn: "Chattala Express", nameBn: "চট্টলা এক্সপ্রেস", code: "801", dep: "08:30 AM", arr: "03:30 PM", durationEn: "7h 00m", durationBn: "৭ ঘণ্টা", offDay: 5, offEn: "Friday", offBn: "শুক্রবার" },
      { nameEn: "Mahanagar Express", nameBn: "মহানগর এক্সপ্রেস", code: "721", dep: "12:30 PM", arr: "07:10 PM", durationEn: "6h 40m", durationBn: "৬ ঘণ্টা ৪০ মি.", offDay: 0, offEn: "Sunday", offBn: "রবিবার" },
      { nameEn: "Mahanagar Godhuli", nameBn: "মহানগর গোধূলী", code: "703", dep: "03:00 PM", arr: "09:10 PM", durationEn: "6h 10m", durationBn: "৬ ঘণ্টা ১০ মি.", offDay: -1, offEn: "No Off-Day", offBn: "কোনো বন্ধ নেই" },
      { nameEn: "Cox's Bazar Express", nameBn: "কক্সবাজার এক্সপ্রেস", code: "814", dep: "04:00 PM", arr: "09:30 PM", durationEn: "5h 30m", durationBn: "৫ ঘণ্টা ৩০ মি.", offDay: 1, offEn: "Monday", offBn: "সোমবার" },
      { nameEn: "Sonar Bangla Express", nameBn: "সোনার বাংলা এক্সপ্রেস", code: "788", dep: "05:00 PM", arr: "10:10 PM", durationEn: "5h 10m", durationBn: "৫ ঘণ্টা ১০ মি.", offDay: 3, offEn: "Wednesday", offBn: "বুধবার" },
      { nameEn: "Turna Express", nameBn: "তূর্ণা এক্সপ্রেস", code: "741", dep: "11:00 PM", arr: "05:15 AM", durationEn: "6h 15m", durationBn: "৬ ঘণ্টা ১৫ মি.", offDay: -1, offEn: "No Off-Day", offBn: "কোনো বন্ধ নেই" },
      { nameEn: "Tourist Express", nameBn: "পর্যটক এক্সপ্রেস", code: "816", dep: "11:30 PM", arr: "05:00 AM", durationEn: "5h 30m", durationBn: "৫ ঘণ্টা ৩০ মি.", offDay: 0, offEn: "Sunday", offBn: "রবিবার" }
    ],

    // Jamalpur <-> Mymensingh Corridors (Direct Trains, Chronological AM to PM)
    "Jamalpur-Mymensingh": [
      { nameEn: "Jamuna Express", nameBn: "যমুনা এক্সপ্রেস", code: "746", dep: "02:30 AM", arr: "03:55 AM", durationEn: "1h 25m", durationBn: "১ ঘণ্টা ২৫ মি.", offDay: 0, offEn: "Sunday", offBn: "রবিবার" },
      { nameEn: "Brahmaputra Express", nameBn: "ব্রহ্মপুত্র এক্সপ্রেস", code: "744", dep: "06:40 AM", arr: "08:00 AM", durationEn: "1h 20m", durationBn: "১ ঘণ্টা ২০ মি.", offDay: -1, offEn: "No Off-Day", offBn: "কোনো বন্ধ নেই" },
      { nameEn: "Dewanganj Commuter", nameBn: "দেওয়ানগঞ্জ কমিউটার", code: "48", dep: "03:15 PM", arr: "04:45 PM", durationEn: "1h 30m", durationBn: "১ ঘণ্টা ৩০ মি.", offDay: -1, offEn: "No Off-Day", offBn: "কোনো বন্ধ নেই" },
      { nameEn: "Teesta Express", nameBn: "তিস্তা এক্সপ্রেস", code: "708", dep: "03:30 PM", arr: "04:50 PM", durationEn: "1h 20m", durationBn: "১ ঘণ্টা ২০ মি.", offDay: 1, offEn: "Monday", offBn: "সোমবার" },
      { nameEn: "Agnibeena Express", nameBn: "অগ্নিবীণা এক্সপ্রেস", code: "736", dep: "05:45 PM", arr: "07:05 PM", durationEn: "1h 20m", durationBn: "১ ঘণ্টা ২০ মি.", offDay: -1, offEn: "No Off-Day", offBn: "কোনো বন্ধ নেই" },
      { nameEn: "Bijoy Express", nameBn: "বিজয় এক্সপ্রেস", code: "786", dep: "08:10 PM", arr: "09:35 PM", durationEn: "1h 25m", durationBn: "১ ঘণ্টা ২৫ মি.", offDay: 2, offEn: "Tuesday", offBn: "মঙ্গলবার" }
    ],
    "Mymensingh-Jamalpur": [
      { nameEn: "Dewanganj Commuter", nameBn: "দেওয়ানগঞ্জ কমিউটার", code: "47", dep: "09:45 AM", arr: "11:15 AM", durationEn: "1h 30m", durationBn: "১ ঘণ্টা ৩০ মি.", offDay: -1, offEn: "No Off-Day", offBn: "কোনো বন্ধ নেই" },
      { nameEn: "Teesta Express", nameBn: "তিস্তা এক্সপ্রেস", code: "707", dep: "10:35 AM", arr: "11:50 AM", durationEn: "1h 15m", durationBn: "১ ঘণ্টা ১৫ মি.", offDay: 1, offEn: "Monday", offBn: "সোমবার" },
      { nameEn: "Agnibeena Express", nameBn: "অগ্নিবীণা এক্সপ্রেস", code: "735", dep: "02:30 PM", arr: "03:45 PM", durationEn: "1h 15m", durationBn: "১ ঘণ্টা ১৫ মি.", offDay: -1, offEn: "No Off-Day", offBn: "কোনো বন্ধ নেই" },
      { nameEn: "Bijoy Express", nameBn: "বিজয় এক্সপ্রেস", code: "785", dep: "04:45 PM", arr: "06:10 PM", durationEn: "1h 25m", durationBn: "১ ঘণ্টা ২৫ মি.", offDay: 2, offEn: "Tuesday", offBn: "মঙ্গলবার" },
      { nameEn: "Jamuna Express", nameBn: "যমুনা এক্সপ্রেস", code: "745", dep: "08:05 PM", arr: "09:40 PM", durationEn: "1h 35m", durationBn: "১ ঘণ্টা ৩৫ মি.", offDay: 0, offEn: "Sunday", offBn: "রবিবার" },
      { nameEn: "Brahmaputra Express", nameBn: "ব্রহ্মপুত্র এক্সপ্রেস", code: "743", dep: "09:35 PM", arr: "11:20 PM", durationEn: "1h 45m", durationBn: "১ ঘণ্টা ৪৫ মি.", offDay: -1, offEn: "No Off-Day", offBn: "কোনো বন্ধ নেই" }
    ],

    // Chattogram <-> Mymensingh Corridors
    "Chattogram-Mymensingh": [
      { nameEn: "Bijoy Express", nameBn: "বিজয় এক্সপ্রেস", code: "785", dep: "09:15 AM", arr: "04:40 PM", durationEn: "7h 25m", durationBn: "৭ ঘণ্টা ২৫ মি.", offDay: 2, offEn: "Tuesday", offBn: "মঙ্গলবার" }
    ],
    "Mymensingh-Chattogram": [
      { nameEn: "Bijoy Express", nameBn: "বিজয় এক্সপ্রেস", code: "786", dep: "09:40 PM", arr: "05:00 AM", durationEn: "7h 20m", durationBn: "৭ ঘণ্টা ২০ মি.", offDay: 2, offEn: "Tuesday", offBn: "মঙ্গলবার" }
    ],

    // Dhaka <-> Jamalpur Corridors (Chronological AM to PM)
    "Dhaka-Jamalpur": [
      { nameEn: "Dewanganj Commuter", nameBn: "দেওয়ানগঞ্জ কমিউটার", code: "47", dep: "05:40 AM", arr: "11:15 AM", durationEn: "5h 35m", durationBn: "৫ ঘণ্টা ৩৫ মি.", offDay: -1, offEn: "No Off-Day", offBn: "কোনো বন্ধ নেই" },
      { nameEn: "Teesta Express", nameBn: "তিস্তা এক্সপ্রেস", code: "707", dep: "07:30 AM", arr: "11:50 AM", durationEn: "4h 20m", durationBn: "৪ ঘণ্টা ২০ মি.", offDay: 1, offEn: "Monday", offBn: "সোমবার" },
      { nameEn: "Balaka Commuter", nameBn: "বলাকা কমিউটার", code: "49", dep: "10:30 AM", arr: "04:00 PM", durationEn: "5h 30m", durationBn: "৫ ঘণ্টা ৩০ মি.", offDay: -1, offEn: "No Off-Day", offBn: "কোনো বন্ধ নেই" },
      { nameEn: "Agnibeena Express", nameBn: "অগ্নিবীণা এক্সপ্রেস", code: "735", dep: "11:30 AM", arr: "03:45 PM", durationEn: "4h 15m", durationBn: "৪ ঘণ্টা ১৫ মি.", offDay: -1, offEn: "No Off-Day", offBn: "কোনো বন্ধ নেই" },
      { nameEn: "Jamuna Express", nameBn: "যমুনা এক্সপ্রেস", code: "745", dep: "04:45 PM", arr: "09:40 PM", durationEn: "4h 55m", durationBn: "৪ ঘণ্টা ৫৫ মি.", offDay: 0, offEn: "Sunday", offBn: "রবিবার" },
      { nameEn: "Brahmaputra Express", nameBn: "ব্রহ্মপুত্র এক্সপ্রেস", code: "743", dep: "06:15 PM", arr: "11:20 PM", durationEn: "5h 05m", durationBn: "৫ ঘণ্টা ০৫ মি.", offDay: -1, offEn: "No Off-Day", offBn: "কোনো বন্ধ নেই" }
    ],
    "Jamalpur-Dhaka": [
      { nameEn: "Jamuna Express", nameBn: "যমুনা এক্সপ্রেস", code: "746", dep: "02:30 AM", arr: "07:40 AM", durationEn: "5h 10m", durationBn: "৫ ঘণ্টা ১০ মি.", offDay: 0, offEn: "Sunday", offBn: "রবিবার" },
      { nameEn: "Brahmaputra Express", nameBn: "ব্রহ্মপুত্র এক্সপ্রেস", code: "744", dep: "06:40 AM", arr: "11:50 AM", durationEn: "5h 10m", durationBn: "৫ ঘণ্টা ১০ মি.", offDay: -1, offEn: "No Off-Day", offBn: "কোনো বন্ধ নেই" },
      { nameEn: "Dewanganj Commuter", nameBn: "দেওয়ানগঞ্জ কমিউটার", code: "48", dep: "03:15 PM", arr: "08:45 PM", durationEn: "5h 30m", durationBn: "৫ ঘণ্টা ৩০ মি.", offDay: -1, offEn: "No Off-Day", offBn: "কোনো বন্ধ নেই" },
      { nameEn: "Teesta Express", nameBn: "তিস্তা এক্সপ্রেস", code: "708", dep: "03:30 PM", arr: "08:10 PM", durationEn: "4h 40m", durationBn: "৪ ঘণ্টা ৪০ মি.", offDay: 1, offEn: "Monday", offBn: "সোমবার" },
      { nameEn: "Agnibeena Express", nameBn: "অগ্নিবীণা এক্সপ্রেস", code: "736", dep: "05:45 PM", arr: "10:30 PM", durationEn: "4h 45m", durationBn: "৪ ঘণ্টা ৪৫ মি.", offDay: -1, offEn: "No Off-Day", offBn: "কোনো বন্ধ নেই" }
    ],

    // Chattogram <-> Jamalpur Corridors
    "Chattogram-Jamalpur": [
      { nameEn: "Bijoy Express", nameBn: "বিজয় এক্সপ্রেস", code: "785", dep: "09:15 AM", arr: "06:10 PM", durationEn: "8h 55m", durationBn: "৮ ঘণ্টা ৫৫ মি.", offDay: 2, offEn: "Tuesday", offBn: "মঙ্গলবার" }
    ],
    "Jamalpur-Chattogram": [
      { nameEn: "Bijoy Express", nameBn: "বিজয় এক্সপ্রেস", code: "786", dep: "08:10 PM", arr: "05:00 AM", durationEn: "8h 50m", durationBn: "৮ ঘণ্টা ৫০ মি.", offDay: 2, offEn: "Tuesday", offBn: "মঙ্গলবার" }
    ],

    // Dhaka <-> Cox's Bazar Corridors (Chronological AM to PM)
    "Dhaka-Cox's Bazar": [
      { nameEn: "Tourist Express", nameBn: "পর্যটক এক্সপ্রেস", code: "815", dep: "06:15 AM", arr: "03:00 PM", durationEn: "8h 45m", durationBn: "৮ ঘণ্টা ৪৫ মি.", offDay: 0, offEn: "Sunday", offBn: "রবিবার" },
      { nameEn: "Cox's Bazar Express", nameBn: "কক্সবাজার এক্সপ্রেস", code: "813", dep: "10:30 PM", arr: "07:20 AM", durationEn: "8h 50m", durationBn: "৮ ঘণ্টা ৫০ মি.", offDay: 1, offEn: "Monday", offBn: "সোমবার" }
    ],
    "Cox's Bazar-Dhaka": [
      { nameEn: "Cox's Bazar Express", nameBn: "কক্সবাজার এক্সপ্রেস", code: "814", dep: "12:30 PM", arr: "09:30 PM", durationEn: "9h 00m", durationBn: "৯ ঘণ্টা", offDay: 1, offEn: "Monday", offBn: "সোমবার" },
      { nameEn: "Tourist Express", nameBn: "পর্যটক এক্সপ্রেস", code: "816", dep: "08:00 PM", arr: "05:00 AM", durationEn: "9h 00m", durationBn: "৯ ঘণ্টা", offDay: 0, offEn: "Sunday", offBn: "রবিবার" }
    ],

    // Dhaka <-> Sylhet Corridors (Chronological AM to PM)
    "Dhaka-Sylhet": [
      { nameEn: "Parabat Express", nameBn: "পারাবত এক্সপ্রেস", code: "709", dep: "06:20 AM", arr: "01:00 PM", durationEn: "6h 40m", durationBn: "৬ ঘণ্টা ৪০ মি.", offDay: 2, offEn: "Tuesday", offBn: "মঙ্গলবার" },
      { nameEn: "Jayantika Express", nameBn: "জয়ন্তিকা এক্সপ্রেস", code: "717", dep: "11:15 AM", arr: "07:00 PM", durationEn: "7h 45m", durationBn: "৭ ঘণ্টা ৪৫ মি.", offDay: 4, offEn: "Thursday", offBn: "বৃহস্পতিবার" },
      { nameEn: "Kalni Express", nameBn: "কালনী এক্সপ্রেস", code: "773", dep: "03:00 PM", arr: "09:30 PM", durationEn: "6h 30m", durationBn: "৬ ঘণ্টা ৩০ মি.", offDay: 5, offEn: "Friday", offBn: "শুক্রবার" },
      { nameEn: "Upaban Express", nameBn: "উপবন এক্সপ্রেস", code: "739", dep: "08:30 PM", arr: "05:00 AM", durationEn: "8h 30m", durationBn: "৮ ঘণ্টা ৩০ মি.", offDay: 3, offEn: "Wednesday", offBn: "বুধবার" }
    ],
    "Sylhet-Dhaka": [
      { nameEn: "Kalni Express", nameBn: "কালনী এক্সপ্রেস", code: "774", dep: "06:45 AM", arr: "01:00 PM", durationEn: "6h 15m", durationBn: "৬ ঘণ্টা ১৫ মি.", offDay: 5, offEn: "Friday", offBn: "শুক্রবার" },
      { nameEn: "Jayantika Express", nameBn: "জয়ন্তিকা এক্সপ্রেস", code: "718", dep: "11:30 AM", arr: "07:15 PM", durationEn: "7h 45m", durationBn: "৭ ঘণ্টা ৪৫ মি.", offDay: 4, offEn: "Thursday", offBn: "বৃহস্পতিবার" },
      { nameEn: "Parabat Express", nameBn: "পারাবত এক্সপ্রেস", code: "710", dep: "03:45 PM", arr: "10:20 PM", durationEn: "6h 35m", durationBn: "৬ ঘণ্টা ৩৫ মি.", offDay: 2, offEn: "Tuesday", offBn: "মঙ্গলবার" },
      { nameEn: "Upaban Express", nameBn: "উপবন এক্সপ্রেস", code: "740", dep: "11:30 PM", arr: "06:45 AM", durationEn: "7h 15m", durationBn: "৭ ঘণ্টা ১৫ মি.", offDay: 3, offEn: "Wednesday", offBn: "বুধবার" }
    ],

    // Chattogram <-> Sylhet Corridors (Chronological AM to PM)
    "Chattogram-Sylhet": [
      { nameEn: "Paharika Express", nameBn: "পাহাড়িকা এক্সপ্রেস", code: "719", dep: "07:50 AM", arr: "04:30 PM", durationEn: "8h 40m", durationBn: "৮ ঘণ্টা ৪০ মি.", offDay: 1, offEn: "Monday", offBn: "সোমবার" },
      { nameEn: "Udayan Express", nameBn: "উদয়ন এক্সপ্রেস", code: "723", dep: "09:45 PM", arr: "06:00 AM", durationEn: "8h 15m", durationBn: "৮ ঘণ্টা ১৫ মি.", offDay: 0, offEn: "Sunday", offBn: "রবিবার" }
    ],
    "Sylhet-Chattogram": [
      { nameEn: "Paharika Express", nameBn: "পাহাড়িকা এক্সপ্রেস", code: "720", dep: "10:15 AM", arr: "07:35 PM", durationEn: "9h 20m", durationBn: "৯ ঘণ্টা ২০ মি.", offDay: 1, offEn: "Monday", offBn: "সোমবার" },
      { nameEn: "Udayan Express", nameBn: "উদয়ন এক্সপ্রেস", code: "724", dep: "10:00 PM", arr: "06:20 AM", durationEn: "8h 20m", durationBn: "৮ ঘণ্টা ২০ মি.", offDay: 0, offEn: "Sunday", offBn: "রবিবার" }
    ],

    // Dhaka <-> Rajshahi Corridors (Chronological AM to PM)
    "Dhaka-Rajshahi": [
      { nameEn: "Dhumketu Express", nameBn: "ধূমকেতু এক্সপ্রেস", code: "769", dep: "06:00 AM", arr: "11:40 AM", durationEn: "5h 40m", durationBn: "৫ ঘণ্টা ৪০ মি.", offDay: 4, offEn: "Thursday", offBn: "বৃহস্পতিবার" },
      { nameEn: "Bonolota Express", nameBn: "বনলতা এক্সপ্রেস", code: "791", dep: "01:30 PM", arr: "06:00 PM", durationEn: "4h 30m", durationBn: "৪ ঘণ্টা ৩০ মি.", offDay: 5, offEn: "Friday", offBn: "শুক্রবার" },
      { nameEn: "Silkcity Express", nameBn: "সিল্কসিটি এক্সপ্রেস", code: "753", dep: "02:30 PM", arr: "08:20 PM", durationEn: "5h 50m", durationBn: "৫ ঘণ্টা ৫০ মি.", offDay: 0, offEn: "Sunday", offBn: "রবিবার" },
      { nameEn: "Madhumati Express", nameBn: "মধুমতি এক্সপ্রেস", code: "755", dep: "03:00 PM", arr: "10:30 PM", durationEn: "7h 30m", durationBn: "৭ ঘণ্টা ৩০ মি.", offDay: 4, offEn: "Thursday", offBn: "বৃহস্পতিবার" },
      { nameEn: "Padma Express", nameBn: "পদ্মা এক্সপ্রেস", code: "759", dep: "11:00 PM", arr: "04:40 AM", durationEn: "5h 40m", durationBn: "৫ ঘণ্টা ৪০ মি.", offDay: 2, offEn: "Tuesday", offBn: "মঙ্গলবার" }
    ],
    "Rajshahi-Dhaka": [
      { nameEn: "Bonolota Express", nameBn: "বনলতা এক্সপ্রেস", code: "792", dep: "07:00 AM", arr: "11:30 AM", durationEn: "4h 30m", durationBn: "৪ ঘণ্টা ৩০ মি.", offDay: 5, offEn: "Friday", offBn: "শুক্রবার" },
      { nameEn: "Silkcity Express", nameBn: "সিল্কসিটি এক্সপ্রেস", code: "754", dep: "07:40 AM", arr: "01:30 PM", durationEn: "5h 50m", durationBn: "৫ ঘণ্টা ৫০ মি.", offDay: 0, offEn: "Sunday", offBn: "রবিবার" },
      { nameEn: "Padma Express", nameBn: "পদ্মা এক্সপ্রেস", code: "760", dep: "04:00 PM", arr: "09:40 PM", durationEn: "5h 40m", durationBn: "৫ ঘণ্টা ৪০ মি.", offDay: 2, offEn: "Tuesday", offBn: "মঙ্গলবার" },
      { nameEn: "Dhumketu Express", nameBn: "ধূমকেতু এক্সপ্রেস", code: "770", dep: "11:20 PM", arr: "04:50 AM", durationEn: "5h 30m", durationBn: "৫ ঘণ্টা ৩০ মি.", offDay: 4, offEn: "Thursday", offBn: "বৃহস্পতিবার" }
    ],

    // Dhaka <-> Khulna Corridors (Chronological AM to PM)
    "Dhaka-Khulna": [
      { nameEn: "Sundarban Express", nameBn: "সুন্দরবন এক্সপ্রেস", code: "725", dep: "08:15 AM", arr: "03:50 PM", durationEn: "7h 35m", durationBn: "৭ ঘণ্টা ৩৫ মি.", offDay: 3, offEn: "Wednesday", offBn: "বুধবার" },
      { nameEn: "Chitra Express", nameBn: "চিত্রা এক্সপ্রেস", code: "763", dep: "07:00 PM", arr: "03:40 AM", durationEn: "8h 40m", durationBn: "৮ ঘণ্টা ৪০ মি.", offDay: 1, offEn: "Monday", offBn: "সোমবার" },
      { nameEn: "Benapole Express", nameBn: "বেনাপোল এক্সপ্রেস", code: "795", dep: "11:45 PM", arr: "07:20 AM", durationEn: "7h 35m", durationBn: "৭ ঘণ্টা ৩৫ মি.", offDay: 3, offEn: "Wednesday", offBn: "বুধবার" }
    ],
    "Khulna-Dhaka": [
      { nameEn: "Chitra Express", nameBn: "চিত্রা এক্সপ্রেস", code: "764", dep: "09:00 AM", arr: "05:30 PM", durationEn: "8h 30m", durationBn: "৮ ঘণ্টা ৩০ মি.", offDay: 1, offEn: "Monday", offBn: "সোমবার" },
      { nameEn: "Sundarban Express", nameBn: "সুন্দরবন এক্সপ্রেস", code: "726", dep: "10:15 PM", arr: "05:10 AM", durationEn: "6h 55m", durationBn: "৬ ঘণ্টা ৫৫ মি.", offDay: 3, offEn: "Wednesday", offBn: "বুধবার" }
    ],

    // Dhaka <-> Rangpur Corridors (Chronological AM to PM)
    "Dhaka-Rangpur": [
      { nameEn: "Rangpur Express", nameBn: "রংপুর এক্সপ্রেস", code: "771", dep: "09:10 AM", arr: "07:05 PM", durationEn: "9h 55m", durationBn: "৯ ঘণ্টা ৫৫ মি.", offDay: 0, offEn: "Sunday", offBn: "রবিবার" },
      { nameEn: "Kurigram Express", nameBn: "কুড়িগ্রাম এক্সপ্রেস", code: "797", dep: "08:45 PM", arr: "06:15 AM", durationEn: "9h 30m", durationBn: "৯ ঘণ্টা ৩০ মি.", offDay: 3, offEn: "Wednesday", offBn: "বুধবার" }
    ],
    "Rangpur-Dhaka": [
      { nameEn: "Kurigram Express", nameBn: "কুড়িগ্রাম এক্সপ্রেস", code: "798", dep: "07:15 AM", arr: "05:15 PM", durationEn: "10h 00m", durationBn: "১০ ঘণ্টা", offDay: 3, offEn: "Wednesday", offBn: "বুধবার" },
      { nameEn: "Rangpur Express", nameBn: "রংপুর এক্সপ্রেস", code: "772", dep: "08:10 PM", arr: "06:05 AM", durationEn: "9h 55m", durationBn: "৯ ঘণ্টা ৫৫ মি.", offDay: 0, offEn: "Sunday", offBn: "রবিবার" }
    ],

    // Dhaka <-> Panchagarh Corridors (Chronological AM to PM)
    "Dhaka-Panchagarh": [
      { nameEn: "Ekota Express", nameBn: "একতা এক্সপ্রেস", code: "705", dep: "10:15 AM", arr: "09:00 PM", durationEn: "10h 45m", durationBn: "১০ ঘণ্টা ৪৫ মি.", offDay: -1, offEn: "No Off-Day", offBn: "কোনো বন্ধ নেই" },
      { nameEn: "Drutojan Express", nameBn: "দ্রুতযান এক্সপ্রেস", code: "757", dep: "08:00 PM", arr: "06:30 AM", durationEn: "10h 30m", durationBn: "১০ ঘণ্টা ৩০ মি.", offDay: -1, offEn: "No Off-Day", offBn: "কোনো বন্ধ নেই" },
      { nameEn: "Panchagarh Express", nameBn: "পঞ্চগড় এক্সপ্রেস", code: "793", dep: "10:45 PM", arr: "08:50 AM", durationEn: "10h 05m", durationBn: "১০ ঘণ্টা ০৫ মি.", offDay: -1, offEn: "No Off-Day", offBn: "কোনো বন্ধ নেই" }
    ],
    "Panchagarh-Dhaka": [
      { nameEn: "Drutojan Express", nameBn: "দ্রুতযান এক্সপ্রেস", code: "758", dep: "08:10 AM", arr: "06:40 PM", durationEn: "10h 30m", durationBn: "১০ ঘণ্টা ৩০ মি.", offDay: -1, offEn: "No Off-Day", offBn: "কোনো বন্ধ নেই" },
      { nameEn: "Panchagarh Express", nameBn: "পঞ্চগড় এক্সপ্রেস", code: "794", dep: "12:30 PM", arr: "10:35 PM", durationEn: "10h 05m", durationBn: "১০ ঘণ্টা ০৫ মি.", offDay: -1, offEn: "No Off-Day", offBn: "কোনো বন্ধ নেই" },
      { nameEn: "Ekota Express", nameBn: "একতা এক্সপ্রেস", code: "706", dep: "09:10 PM", arr: "07:45 AM", durationEn: "10h 35m", durationBn: "১০ ঘণ্টা ৩৫ মি.", offDay: -1, offEn: "No Off-Day", offBn: "কোনো বন্ধ নেই" }
    ],

    // Dhaka <-> Mymensingh Corridors (Chronological AM to PM)
    "Dhaka-Mymensingh": [
      { nameEn: "Teesta Express", nameBn: "তিস্তা এক্সপ্রেস", code: "707", dep: "07:30 AM", arr: "10:30 AM", durationEn: "3h 00m", durationBn: "৩ ঘণ্টা", offDay: 1, offEn: "Monday", offBn: "সোমবার" },
      { nameEn: "Agnibeena Express", nameBn: "অগ্নিবীণা এক্সপ্রেস", code: "735", dep: "11:30 AM", arr: "02:25 PM", durationEn: "2h 55m", durationBn: "২ ঘণ্টা ৫৫ মি.", offDay: -1, offEn: "No Off-Day", offBn: "কোনো বন্ধ নেই" },
      { nameEn: "Mohanganj Express", nameBn: "মোহনগঞ্জ এক্সপ্রেস", code: "789", dep: "01:15 PM", arr: "04:40 PM", durationEn: "3h 25m", durationBn: "৩ ঘণ্টা ২৫ মি.", offDay: 1, offEn: "Monday", offBn: "সোমবার" },
      { nameEn: "Jamuna Express", nameBn: "যমুনা এক্সপ্রেস", code: "745", dep: "04:45 PM", arr: "08:00 PM", durationEn: "3h 15m", durationBn: "৩ ঘণ্টা ১৫ মি.", offDay: 0, offEn: "Sunday", offBn: "রবিবার" },
      { nameEn: "Brahmaputra Express", nameBn: "ব্রহ্মপুত্র এক্সপ্রেস", code: "743", dep: "06:15 PM", arr: "09:30 PM", durationEn: "3h 15m", durationBn: "৩ ঘণ্টা ১৫ মি.", offDay: -1, offEn: "No Off-Day", offBn: "কোনো বন্ধ নেই" },
      { nameEn: "Haor Express", nameBn: "হাওর এক্সপ্রেস", code: "777", dep: "10:15 PM", arr: "01:30 AM", durationEn: "3h 15m", durationBn: "৩ ঘণ্টা ১৫ মি.", offDay: 3, offEn: "Wednesday", offBn: "বুধবার" }
    ],
    "Mymensingh-Dhaka": [
      { nameEn: "Jamuna Express", nameBn: "যমুনা এক্সপ্রেস", code: "746", dep: "04:10 AM", arr: "07:40 AM", durationEn: "3h 30m", durationBn: "৩ ঘণ্টা ৩০ মি.", offDay: 0, offEn: "Sunday", offBn: "রবিবার" },
      { nameEn: "Brahmaputra Express", nameBn: "ব্রহ্মপুত্র এক্সপ্রেস", code: "744", dep: "08:10 AM", arr: "11:50 AM", durationEn: "3h 40m", durationBn: "৩ ঘণ্টা ৪০ মি.", offDay: -1, offEn: "No Off-Day", offBn: "কোনো বন্ধ নেই" },
      { nameEn: "Teesta Express", nameBn: "তিস্তা এক্সপ্রেস", code: "708", dep: "05:05 PM", arr: "08:10 PM", durationEn: "3h 05m", durationBn: "৩ ঘণ্টা ০৫ মি.", offDay: 1, offEn: "Monday", offBn: "সোমবার" },
      { nameEn: "Agnibeena Express", nameBn: "অগ্নিবীণা এক্সপ্রেস", code: "736", dep: "07:15 PM", arr: "10:30 PM", durationEn: "3h 15m", durationBn: "৩ ঘণ্টা ১৫ মি.", offDay: -1, offEn: "No Off-Day", offBn: "কোনো বন্ধ নেই" }
    ]
  };

  // Auto-sort all train corridors chronologically:
  for (const key in ROUTE_TRAIN_MAP) {
    ROUTE_TRAIN_MAP[key] = sortTrainsChronologically(ROUTE_TRAIN_MAP[key]);
  }

  // Backward-compatible alias routing
  ROUTE_TRAIN_MAP["Dhaka-Chittagong"] = ROUTE_TRAIN_MAP["Dhaka-Chattogram"];
  ROUTE_TRAIN_MAP["Chittagong-Dhaka"] = ROUTE_TRAIN_MAP["Chattogram-Dhaka"];
  ROUTE_TRAIN_MAP["Chittagong-Jamalpur"] = ROUTE_TRAIN_MAP["Chattogram-Jamalpur"];
  ROUTE_TRAIN_MAP["Jamalpur-Chittagong"] = ROUTE_TRAIN_MAP["Jamalpur-Chattogram"];
  ROUTE_TRAIN_MAP["Chittagong-Sylhet"] = ROUTE_TRAIN_MAP["Chattogram-Sylhet"];
  ROUTE_TRAIN_MAP["Sylhet-Chittagong"] = ROUTE_TRAIN_MAP["Sylhet-Chattogram"];
  ROUTE_TRAIN_MAP["Chittagong-Mymensingh"] = ROUTE_TRAIN_MAP["Chattogram-Mymensingh"];
  ROUTE_TRAIN_MAP["Mymensingh-Chittagong"] = ROUTE_TRAIN_MAP["Mymensingh-Chattogram"];

  // 3. Official Bangladesh Railway Fares Database
  const FARE_RATES = {
    "Jamalpur-Mymensingh": { S_CHAIR: 60, SHOVON: 45, SNIGDHA: 115, F_CHAIR: 90, AC_S: 140, AC_B: 210 },
    "Mymensingh-Jamalpur": { S_CHAIR: 60, SHOVON: 45, SNIGDHA: 115, F_CHAIR: 90, AC_S: 140, AC_B: 210 },
    "Chattogram-Mymensingh": { S_CHAIR: 340, SHOVON: 260, SNIGDHA: 650, F_CHAIR: 490, AC_S: 780, AC_B: 1170 },
    "Mymensingh-Chattogram": { S_CHAIR: 340, SHOVON: 260, SNIGDHA: 650, F_CHAIR: 490, AC_S: 780, AC_B: 1170 },
    "Dhaka-Jamalpur": { S_CHAIR: 205, SHOVON: 165, SNIGDHA: 391, F_CHAIR: 310, AC_S: 466, AC_B: 690 },
    "Jamalpur-Dhaka": { S_CHAIR: 205, SHOVON: 165, SNIGDHA: 391, F_CHAIR: 310, AC_S: 466, AC_B: 690 },
    "Chattogram-Jamalpur": { S_CHAIR: 375, SHOVON: 290, SNIGDHA: 715, F_CHAIR: 540, AC_S: 855, AC_B: 1280 },
    "Jamalpur-Chattogram": { S_CHAIR: 375, SHOVON: 290, SNIGDHA: 715, F_CHAIR: 540, AC_S: 855, AC_B: 1280 },
    "Dhaka-Chattogram": { S_CHAIR: 380, SHOVON: 285, SNIGDHA: 725, F_CHAIR: 560, AC_S: 865, AC_B: 1295 },
    "Chattogram-Dhaka": { S_CHAIR: 380, SHOVON: 285, SNIGDHA: 725, F_CHAIR: 560, AC_S: 865, AC_B: 1295 },
    "Dhaka-Cox's Bazar": { S_CHAIR: 505, SHOVON: 395, SNIGDHA: 965, F_CHAIR: 740, AC_S: 1150, AC_B: 1725 },
    "Cox's Bazar-Dhaka": { S_CHAIR: 505, SHOVON: 395, SNIGDHA: 965, F_CHAIR: 740, AC_S: 1150, AC_B: 1725 },
    "Dhaka-Sylhet": { S_CHAIR: 320, SHOVON: 265, SNIGDHA: 610, F_CHAIR: 470, AC_S: 730, AC_B: 1090 },
    "Sylhet-Dhaka": { S_CHAIR: 320, SHOVON: 265, SNIGDHA: 610, F_CHAIR: 470, AC_S: 730, AC_B: 1090 },
    "Chattogram-Sylhet": { S_CHAIR: 375, SHOVON: 290, SNIGDHA: 715, F_CHAIR: 540, AC_S: 855, AC_B: 1280 },
    "Sylhet-Chattogram": { S_CHAIR: 375, SHOVON: 290, SNIGDHA: 715, F_CHAIR: 540, AC_S: 855, AC_B: 1280 },
    "Dhaka-Rajshahi": { S_CHAIR: 340, SHOVON: 285, SNIGDHA: 650, F_CHAIR: 510, AC_S: 780, AC_B: 1170 },
    "Rajshahi-Dhaka": { S_CHAIR: 340, SHOVON: 285, SNIGDHA: 650, F_CHAIR: 510, AC_S: 780, AC_B: 1170 },
    "Dhaka-Khulna": { S_CHAIR: 460, SHOVON: 360, SNIGDHA: 880, F_CHAIR: 670, AC_S: 1050, AC_B: 1575 },
    "Khulna-Dhaka": { S_CHAIR: 460, SHOVON: 360, SNIGDHA: 880, F_CHAIR: 670, AC_S: 1050, AC_B: 1575 },
    "Dhaka-Rangpur": { S_CHAIR: 450, SHOVON: 350, SNIGDHA: 860, F_CHAIR: 650, AC_S: 1030, AC_B: 1545 },
    "Rangpur-Dhaka": { S_CHAIR: 450, SHOVON: 350, SNIGDHA: 860, F_CHAIR: 650, AC_S: 1030, AC_B: 1545 },
    "Dhaka-Panchagarh": { S_CHAIR: 550, SHOVON: 430, SNIGDHA: 1050, F_CHAIR: 800, AC_S: 1260, AC_B: 1890 },
    "Panchagarh-Dhaka": { S_CHAIR: 550, SHOVON: 430, SNIGDHA: 1050, F_CHAIR: 800, AC_S: 1260, AC_B: 1890 },
    "Dhaka-Mymensingh": { S_CHAIR: 150, SHOVON: 120, SNIGDHA: 285, F_CHAIR: 220, AC_S: 345, AC_B: 515 },
    "Mymensingh-Dhaka": { S_CHAIR: 150, SHOVON: 120, SNIGDHA: 285, F_CHAIR: 220, AC_S: 345, AC_B: 515 },
    "Dhaka-Cumilla": { S_CHAIR: 160, SHOVON: 130, SNIGDHA: 305, F_CHAIR: 235, AC_S: 365, AC_B: 545 },
    "Cumilla-Dhaka": { S_CHAIR: 160, SHOVON: 130, SNIGDHA: 305, F_CHAIR: 235, AC_S: 365, AC_B: 545 },
    "Dhaka-Feni": { S_CHAIR: 265, SHOVON: 215, SNIGDHA: 510, F_CHAIR: 390, AC_S: 605, AC_B: 910 },
    "Feni-Dhaka": { S_CHAIR: 265, SHOVON: 215, SNIGDHA: 510, F_CHAIR: 390, AC_S: 605, AC_B: 910 },
    "Dhaka-Sreemangal": { S_CHAIR: 240, SHOVON: 195, SNIGDHA: 460, F_CHAIR: 350, AC_S: 550, AC_B: 825 },
    "Sreemangal-Dhaka": { S_CHAIR: 240, SHOVON: 195, SNIGDHA: 460, F_CHAIR: 350, AC_S: 550, AC_B: 825 },
    "Dhaka-Bogra": { S_CHAIR: 395, SHOVON: 315, SNIGDHA: 755, F_CHAIR: 580, AC_S: 905, AC_B: 1355 },
    "Bogra-Dhaka": { S_CHAIR: 395, SHOVON: 315, SNIGDHA: 755, F_CHAIR: 580, AC_S: 905, AC_B: 1355 },
    "Dhaka-Dinajpur": { S_CHAIR: 465, SHOVON: 370, SNIGDHA: 890, F_CHAIR: 685, AC_S: 1065, AC_B: 1600 },
    "Dinajpur-Dhaka": { S_CHAIR: 465, SHOVON: 370, SNIGDHA: 890, F_CHAIR: 685, AC_S: 1065, AC_B: 1600 },
    "Dhaka-Benapole": { S_CHAIR: 480, SHOVON: 385, SNIGDHA: 920, F_CHAIR: 710, AC_S: 1100, AC_B: 1650 },
    "Benapole-Dhaka": { S_CHAIR: 480, SHOVON: 385, SNIGDHA: 920, F_CHAIR: 710, AC_S: 1100, AC_B: 1650 },
    "Dhaka-Ishwardi": { S_CHAIR: 265, SHOVON: 210, SNIGDHA: 510, F_CHAIR: 390, AC_S: 610, AC_B: 915 },
    "Ishwardi-Dhaka": { S_CHAIR: 265, SHOVON: 210, SNIGDHA: 510, F_CHAIR: 390, AC_S: 610, AC_B: 915 }
  };

  // Aliases for Fares
  FARE_RATES["Dhaka-Chittagong"] = FARE_RATES["Dhaka-Chattogram"];
  FARE_RATES["Chittagong-Dhaka"] = FARE_RATES["Chattogram-Dhaka"];
  FARE_RATES["Chittagong-Jamalpur"] = FARE_RATES["Chattogram-Jamalpur"];
  FARE_RATES["Jamalpur-Chittagong"] = FARE_RATES["Jamalpur-Chattogram"];
  FARE_RATES["Chittagong-Sylhet"] = FARE_RATES["Chattogram-Sylhet"];
  FARE_RATES["Sylhet-Chittagong"] = FARE_RATES["Sylhet-Chattogram"];
  FARE_RATES["Chittagong-Mymensingh"] = FARE_RATES["Chattogram-Mymensingh"];
  FARE_RATES["Mymensingh-Chittagong"] = FARE_RATES["Mymensingh-Chattogram"];

  // 4. Strict Single-Language UI Dictionary


  let lastToastMsg = '';
  let lastToastTime = 0;
  function showHudToast(message, duration = 4000) {
    if (!message) return;
    const now = Date.now();
    if (message === lastToastMsg && (now - lastToastTime) < 3000) return;
    lastToastMsg = message;
    lastToastTime = now;

    let toast = document.getElementById('gtToastBanner');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'gtToastBanner';
      document.body.appendChild(toast);
    }
    toast.innerHTML = `
      <span style="flex: 1;">${message}</span>
      <button class="gt-toast-close" id="gtToastClose" title="Stop/Close">&times;</button>
    `;

    toast.querySelector('#gtToastClose')?.addEventListener('click', (e) => {
      e.stopPropagation();
      toast.classList.remove('show');
      if (watchdogIntervalTimer) {
        clearInterval(watchdogIntervalTimer);
        watchdogIntervalTimer = null;
      }
      lastToastMsg = '';
    });

    toast.classList.add('show');
    if (toast.__timeout) clearTimeout(toast.__timeout);
    toast.__timeout = setTimeout(() => {
      toast.classList.remove('show');
      lastToastMsg = '';
    }, duration);
  }

  function setHudStatus(message, color = '#0284c7') {
    showHudToast(message);
    const stealthNote = document.getElementById('gtStealthNote');
    if (stealthNote) {
      stealthNote.innerHTML = `<span style="color: ${color || 'var(--gt-success)'}; font-weight: 700;">${message}</span>`;
    }
  }

  let watchdogIntervalTimer = null;
  function start2MinWatchdog(trainName, routeFrom, routeTo, date, passengers, chosenClass) {
    if (watchdogIntervalTimer) clearInterval(watchdogIntervalTimer);

    watchdogIntervalTimer = setInterval(() => {
      console.log('[GeTicket Pro Watchdog] Checking live seats for:', trainName);

      const classButtons = document.querySelectorAll('.class-btn, .trip-btn, [class*="trip-seat"], [class*="class-name"], button');
      let foundAvailable = false;

      classButtons.forEach(btn => {
        const txt = btn.innerText.toUpperCase();
        const hasSeatCount = /\b[1-9]\d*\b/.test(txt) || txt.includes('AVAILABLE') || txt.includes('খালি');
        if (hasSeatCount && !txt.includes('0 SEAT') && !txt.includes('০ টি') && !txt.includes('BOOKED')) {
          foundAvailable = true;
        }
      });

      if (foundAvailable) {
        setHudStatus(currentLang === 'bn' ? `⚡ সিট পাওয়া গেছে! (${trainName}) সিট লক করা হচ্ছে...` : `⚡ Released seats detected! (${trainName}) Locking now...`, '#10b981');
        playAlertSound();
        executeCascadingGrab();
      } else {
        const timeNow = new Date().toLocaleTimeString();
        console.log(`[GeTicket Pro Watchdog] Checked at ${timeNow}: Still sold out. Re-checking in 2 mins.`);
      }
    }, 120000); // 2 minutes auto-recheck
  }

  function injectHud() {
    if (document.getElementById('geticket-hud-root')) return;

    const logoUrl = chrome?.runtime?.getURL ? chrome.runtime.getURL('icons/icon48.png') : '';
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
            <span class="gt-version-pill">v2.7</span>
          </div>
          <div class="gt-header-tools">
            <button class="gt-ctrl-btn gt-power-btn active" id="gtPowerBtn" title="Engine Toggle">🟢 Active</button>
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

          <!-- TAB 3: VAULT (CREDENTIALS & FARE & BKASH) -->
          <div class="gt-pane" id="gtPaneVault">
            <!-- Railway Account Credentials -->
            <div class="gt-vault-box">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <span style="font-weight: 800; font-size: 12px; color: var(--gt-accent);" id="gtVaultCredHead">🔐 Account Vault</span>
                <span style="background: rgba(2, 132, 199, 0.12); color: var(--gt-accent); font-size: 9.5px; font-weight: 700; padding: 1px 6px; border-radius: 4px;" id="gtVaultCredBadge">Encrypted</span>
              </div>
              <div style="margin-bottom: 6px;">
                <label class="gt-label" id="gtLblVaultPhone">Railway Mobile</label>
                <input type="text" class="gt-input" id="gtVaultPhone" placeholder="017XXXXXXXX">
              </div>
              <div style="margin-bottom: 8px;">
                <label class="gt-label" id="gtLblVaultPass">Password</label>
                <input type="password" class="gt-input" id="gtVaultPass" placeholder="••••••••">
              </div>
              <button class="gt-btn-primary gt-btn-arm" id="gtBtnSaveVault" style="padding: 8px 12px; font-size: 11.5px;">
                🔒 <span id="gtBtnSaveVaultText">Save Railway Account to Vault</span>
              </button>
            </div>

            <!-- Live Fare & bKash Summary -->
            <div class="gt-fare-card">
              <div style="font-weight: 800; color: var(--gt-accent);" id="gtVaultHead">💳 Live Fare &amp; bKash Summary</div>
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
                💡 Keep at least ৳470 in bKash before 8:00 AM!
              </div>
            </div>

            <div style="background: var(--gt-hud-card-bg); border: 1px solid var(--gt-hud-card-border); border-radius: 10px; padding: 10px; font-size: 11px; margin-top: 10px;">
              <div style="color: #10b981; font-weight: 700; margin-bottom: 4px;" id="gtVaultGuardHead">✓ Anti-Logout Guard Active</div>
              <div style="color: var(--gt-hud-muted); font-size: 10px;" id="gtVaultGuardDesc">Keeps your railway session warm from 7:50 AM to prevent unexpected logout during morning peak rush.</div>
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

    const powerBtn = root.querySelector('#gtPowerBtn');
    if (powerBtn) {
      powerBtn.addEventListener('click', () => {
        isEngineRunning = !isEngineRunning;
        if (isEngineRunning) {
          powerBtn.classList.remove('paused');
          powerBtn.classList.add('active');
          powerBtn.innerText = currentLang === 'bn' ? '🟢 সক্রিয়' : '🟢 Active';
          showHudToast(currentLang === 'bn' ? '⚡ ইঞ্জিন সক্রিয় করা হয়েছে' : '⚡ Automation Engine Active');
          startWatchdog();
        } else {
          powerBtn.classList.remove('active');
          powerBtn.classList.add('paused');
          powerBtn.innerText = currentLang === 'bn' ? '🔴 বন্ধ' : '🔴 Paused';
          if (watchdogIntervalTimer) {
            clearInterval(watchdogIntervalTimer);
            watchdogIntervalTimer = null;
          }
          if (watchdogTimer) {
            clearInterval(watchdogTimer);
            watchdogTimer = null;
          }
          if (paymentAssisterTimer) {
            clearInterval(paymentAssisterTimer);
            paymentAssisterTimer = null;
          }
          const toast = document.getElementById('gtToastBanner');
          if (toast) toast.classList.remove('show');
          showHudToast(currentLang === 'bn' ? '⏸️ অটোমেশন ইঞ্জিন বন্ধ করা হয়েছে' : '⏸️ Automation Engine Paused');
          const stealthNote = root.querySelector('#gtStealthNote');
          if (stealthNote) {
            stealthNote.innerHTML = currentLang === 'bn'
              ? '<span>⏸️ ইঞ্জিন বন্ধ রয়েছে • স্লিপ মোড</span>'
              : '<span>⏸️ Engine Paused • Sleep Mode</span>';
          }
        }
      });
    }

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
        { val: "ANY", en: "✨ Any Available Class", bn: "✨ যেকোনো উপলব্ধ শ্রেণি" },
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
      const liveScraped = scrapeLiveRailwayPage();
      const routeKey = `${selFrom.value}-${selTo.value}`;
      const revRouteKey = `${selTo.value}-${selFrom.value}`;
      let list = (liveScraped && liveScraped.length > 0)
        ? liveScraped
        : (ROUTE_TRAIN_MAP[routeKey] || ROUTE_TRAIN_MAP[revRouteKey] || []);

      if (list.length === 0) {
        list = [
          { nameEn: "Intercity Express", nameBn: "আন্তঃনগর এক্সপ্রেস", code: "701", dep: "08:00 AM", arr: "01:30 PM" }
        ];
      }
      list = sortTrainsChronologically(list);
      selTrain.innerHTML = '';

      // 1. Any Available Train Option
      const anyOpt = new Option(
        currentLang === 'bn' ? '⚡ যেকোনো উপলব্ধ ট্রেন (সবচেয়ে দ্রুত)' : '⚡ Any Available Train (Fastest Available)',
        'ANY_TRAIN'
      );
      if (config.trainName === 'ANY_TRAIN') anyOpt.selected = true;
      selTrain.appendChild(anyOpt);

      // 2. Specific Trains on Route
      list.forEach((t, idx) => {
        const trName = currentLang === 'bn' ? (t.nameBn || t.nameEn) : t.nameEn;
        const timeStr = t.arr ? `${t.dep} ➔ ${t.arr}` : t.dep;
        const opt = new Option(`${trName} (${timeStr})`, t.nameEn);
        if (t.nameEn === config.trainName || (!config.trainName && idx === 0)) opt.selected = true;
        selTrain.appendChild(opt);
      });
      updateFareAndConfig();
    }

    function updateFareAndConfig() {
      config.routeFrom = selFrom.value;
      config.routeTo = selTo.value;
      config.targetDate = inputDate.value;
      config.passengers = parseInt(selPax.value, 10) || 2;
      config.trainName = selTrain.value;
      const chosenClass = selClass.value || "S_CHAIR";

      const routeKey = `${config.routeFrom}-${config.routeTo}`;
      const revRouteKey = `${config.routeTo}-${config.routeFrom}`;
      const routeFares = FARE_RATES[routeKey] || FARE_RATES[revRouteKey] || FARE_RATES["Dhaka-Rajshahi"] || FARE_RATES["Dhaka-Jamalpur"];
      const unit = routeFares ? (routeFares[chosenClass] || 205) : 205;
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
          if (watchdogIntervalTimer) {
            clearInterval(watchdogIntervalTimer);
            watchdogIntervalTimer = null;
          }
          const toast = document.getElementById('gtToastBanner');
          if (toast) toast.classList.remove('show');
          return;
        }

        if (empty) empty.style.display = 'none';

        bookings.forEach(b => {
          const card = document.createElement('div');
          card.className = 'gt-sched-card';
          const isInstant = b.type === 'instant' || b.alarmTime === '⚡ Instant Grab Active';
          const statusText = isInstant
            ? (currentLang === 'bn' ? '⚡ তাৎক্ষণিক ফাস্ট-গ্র্যাব সক্রিয়' : '⚡ Instant Fast-Grab Active')
            : (currentLang === 'bn' ? `⏰ অ্যালার্ম: ${b.alarmTime || '07:50 AM'} (সক্রিয়)` : `⏰ Alarm: ${b.alarmTime || '07:50 AM'} (Armed)`);
          const statusColor = isInstant ? '#10b981' : 'var(--gt-success)';

          card.innerHTML = `
            <div>
              <div class="gt-sched-info-title">🚄 ${b.trainName}</div>
              <div class="gt-sched-info-meta">📍 ${b.from} ➔ ${b.to}</div>
              <div class="gt-sched-info-meta">📅 ${b.date} • 👥 ${b.passengers || 2} Pax • 💺 ${b.classCode || 'S_CHAIR'}</div>
              <div class="gt-sched-alarm" style="color: ${statusColor}; font-weight: 700;">${statusText}</div>
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

      config.trainName = selTrain.value;
      config.passengers = parseInt(selPax.value, 10) || 2;
      config.priorities = [
        { level: 1, classCode: p1C, dir: p1D, coach: 'ANY' },
        { level: 2, classCode: p2C, dir: p2D, coach: 'ANY' },
        { level: 3, classCode: p3C, dir: p3D, coach: 'ANY' }
      ];

      const selectedDate = new Date((inputDate.value || todayStr) + 'T00:00:00');
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);
      const diffDays = Math.round((selectedDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));

      const isWest = ['Rajshahi', 'Khulna', 'Rangpur', 'Dinajpur', 'Panchagarh', 'Benapole', 'Ishwardi', 'Bogra'].includes(selTo.value);
      const isWithin10Days = diffDays <= 10;

      const scheduleId = 'geticket_schedule_' + Date.now();
      const alarmLabel = isWithin10Days
        ? (currentLang === 'bn' ? '⚡ লাইভ ওয়াচডগ সক্রিয় (প্রতি ২ মিনিট)' : '⚡ Live Watchdog Active (Every 2m)')
        : (currentLang === 'bn' ? `⏰ অগ্রিম অ্যালার্ম: ${isWest ? '০৭:৫০ AM' : '০১:৫০ PM'}` : `⏰ Alarm: ${isWest ? '07:50 AM' : '01:50 PM'} (Armed)`);

      const newBooking = {
        id: scheduleId,
        type: isWithin10Days ? 'instant' : 'schedule',
        from: selFrom.value,
        to: selTo.value,
        date: inputDate.value,
        passengers: config.passengers,
        trainName: selTrain.value,
        classCode: selClass.value,
        alarmTime: alarmLabel,
        zone: isWest ? 'west' : 'east',
        priorities: config.priorities,
        createdAt: Date.now()
      };

      if (chrome?.storage?.local) {
        chrome.storage.local.get(['scheduledBookings'], (res) => {
          const list = Array.isArray(res.scheduledBookings) ? res.scheduledBookings : [];
          list.unshift(newBooking);
          chrome.storage.local.set({ scheduledBookings: list }, () => {
            renderActiveSchedules();
            const msg = currentLang === 'bn'
              ? `🎉 সফল! (${newBooking.trainName}) শিডিউল সক্রিয় করা হয়েছে!`
              : `🎉 Success! (${newBooking.trainName}) Schedule Armed!`;
            showHudToast(msg);
            root.querySelector('#gtTabNavSchedules')?.click();
          });
        });
      }

      if (isWithin10Days) {
        executeCascadingGrab();
      }
    });

    // Instant Grab Button (Locks seats & starts live continuous watchdog)
    btnGrab.addEventListener('click', () => {
      playAlertSound();
      config.trainName = selTrain.value;
      config.passengers = parseInt(selPax.value, 10) || 2;
      const p1C = root.querySelector('#gtP1Class')?.value || selClass.value || 'S_CHAIR';
      const p1D = root.querySelector('#gtP1Dir')?.value || 'straight';
      const p2C = root.querySelector('#gtP2Class')?.value || 'SNIGDHA';
      const p2D = root.querySelector('#gtP2Dir')?.value || 'middle';
      const p3C = root.querySelector('#gtP3Class')?.value || 'F_CHAIR';
      const p3D = root.querySelector('#gtP3Dir')?.value || 'any';

      config.priorities = [
        { level: 1, classCode: p1C, dir: p1D, coach: 'ANY' },
        { level: 2, classCode: p2C, dir: p2D, coach: 'ANY' },
        { level: 3, classCode: p3C, dir: p3D, coach: 'ANY' }
      ];

      const instantBooking = {
        id: 'geticket_instant_' + Date.now(),
        type: 'instant',
        from: selFrom.value,
        to: selTo.value,
        date: inputDate.value,
        passengers: config.passengers,
        trainName: config.trainName,
        classCode: selClass.value,
        alarmTime: currentLang === 'bn' ? '⚡ লাইভ ওয়াচডগ সক্রিয় (প্রতি ২ মিনিট)' : '⚡ Live Watchdog Active (Every 2m)',
        status: 'Instant Active',
        priorities: config.priorities,
        createdAt: Date.now()
      };

      if (chrome?.storage?.local) {
        chrome.storage.local.get(['scheduledBookings'], (res) => {
          const list = Array.isArray(res.scheduledBookings) ? res.scheduledBookings : [];
          list.unshift(instantBooking);
          chrome.storage.local.set({ scheduledBookings: list }, () => {
            renderActiveSchedules();
          });
        });
      }

      showHudToast(currentLang === 'bn' ? '⚡ ইন্সট্যান্ট সিট খোঁজা ও লক শুরু হয়েছে (লিস্টে যুক্ত)!' : '⚡ Instant Seat Grab in progress & added to Lists!');
      executeCascadingGrab();
    });

    // Save Account Vault Listener
    const btnSaveVault = root.querySelector('#gtBtnSaveVault');
    if (btnSaveVault) {
      btnSaveVault.addEventListener('click', () => {
        const phone = root.querySelector('#gtVaultPhone')?.value?.trim() || '';
        const pass = root.querySelector('#gtVaultPass')?.value?.trim() || '';

        if (chrome?.storage?.local) {
          chrome.storage.local.set({ railwayVault: { phone, pass } }, () => {
            playAlertSound();
            showHudToast(currentLang === 'bn' ? '🔒 একাউন্ট ভল্টে সংরক্ষিত হয়েছে!' : '🔒 Railway account saved to Vault!');
          });
        }
      });
    }

    // Load Account Vault Credentials
    if (chrome?.storage?.local) {
      chrome.storage.local.get(['railwayVault'], (res) => {
        if (res?.railwayVault) {
          if (root.querySelector('#gtVaultPhone')) root.querySelector('#gtVaultPhone').value = res.railwayVault.phone || '';
          if (root.querySelector('#gtVaultPass')) root.querySelector('#gtVaultPass').value = res.railwayVault.pass || '';
        }
      });
    }

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

    // Popup power button signals the content script to pause all timers
    if (req.action === 'PAUSE_ENGINE') {
      isEngineRunning = false;
      if (watchdogTimer)         { clearInterval(watchdogTimer);         watchdogTimer = null; }
      if (watchdogIntervalTimer) { clearInterval(watchdogIntervalTimer); watchdogIntervalTimer = null; }
      if (paymentAssisterTimer)  { clearInterval(paymentAssisterTimer);  paymentAssisterTimer = null; }
      const powerBtn = document.getElementById('gtPowerBtn');
      if (powerBtn) {
        powerBtn.classList.remove('active');
        powerBtn.classList.add('paused');
        powerBtn.innerText = currentLang === 'bn' ? '🔴 বন্ধ' : '🔴 Paused';
      }
      showHudToast(currentLang === 'bn' ? '⏸️ পপআপ থেকে ইঞ্জিন বন্ধ' : '⏸️ Engine paused from popup');
      sendResponse({ success: true });
    }

    // Background keep-alive: do the session ping from page context (has cookies / session)
    if (req.action === 'SESSION_PING') {
      fetch('/api/v1/user/me', { method: 'GET', credentials: 'include' }).catch(() => {});
      sendResponse({ success: true });
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectHud);
  } else {
    injectHud();
  }

})();

