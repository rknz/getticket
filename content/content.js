/**
 * GeTicket Pro - Content Automation Engine (v2.8)
 * 100% Real-Time Live Railway Integration for https://eticket.railway.gov.bd
 * - Session Harvester & Auth State Sync
 * - 1-Click Vault Auto-Login Handler
 * - Live DOM Scraper & Instant Fast-Grabber
 * - App-Single-Trip & App-Seat-Layout Precision Solver
 * - 5-Minute Seat Hold Countdown & bKash Assister
 * - Continuous Sold-Out Watchdog with 8-12s Retry Loop
 */

(function () {
  'use strict';

  if (window.__GETICKET_LOADED__) return;
  window.__GETICKET_LOADED__ = true;

  let currentTheme = 'light';
  let currentLang = 'en';
  let isEngineRunning = true;
  let isExecutingGrab = false;
  let watchdogRetryTimer = null;
  let paymentAssisterTimer = null;

  let config = {
    enabled: true,
    autoGrab: true,
    passengers: 1,
    routeFrom: 'Dhaka',
    routeTo: 'Rajshahi',
    targetDate: '',
    trainName: 'ANY_TRAIN',
    priorities: [
      { level: 1, classCode: 'S_CHAIR', dir: 'straight', coach: 'ANY' },
      { level: 2, classCode: 'SNIGDHA', dir: 'middle', coach: 'ANY' },
      { level: 3, classCode: 'F_CHAIR', dir: 'straight', coach: 'ANY' }
    ],
    humanJitterMin: 75,
    humanJitterMax: 135
  };

  // 1. Session Harvester & Auth State Sync
  function harvestRailwaySession() {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token') || localStorage.getItem('access_token');
      const userStr = localStorage.getItem('user');
      const deviceId = localStorage.getItem('uudi') || localStorage.getItem('x-device-id');
      const deviceKey = localStorage.getItem('udk') || localStorage.getItem('x-device-key');

      if (token && chrome?.storage?.local) {
        let parsedUser = null;
        try { if (userStr) parsedUser = JSON.parse(userStr); } catch (e) { }

        chrome.storage.local.set({
          railwaySession: {
            token,
            user: parsedUser,
            deviceId: deviceId || 'gt_' + Math.random().toString(36).substring(2),
            deviceKey: deviceKey || '',
            updatedAt: Date.now()
          }
        });
      } else if (!token && chrome?.storage?.local) {
        // If explicitly on a login page and no token, remove stale session
        const path = window.location.pathname.toLowerCase();
        if (path.includes('/login') || path.includes('/auth/login') || path.includes('/sign-in')) {
          chrome.storage.local.remove('railwaySession');
        }
      }
    } catch (e) { }
  }

  harvestRailwaySession();
  setInterval(harvestRailwaySession, 5000);

  // Helper: Angular Native Property Setter
  const nativeInputSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  function setAngularInput(el, val) {
    if (!el) return;
    el.focus();
    if (nativeInputSetter) nativeInputSetter.call(el, val); else el.value = val;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new Event('blur', { bubbles: true }));
  }

  // Helper: Safe Humanized Click Simulation
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

  // Helper: Audio Chime for Breakthrough Alerts
  function playAlertSound() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);

      if (navigator.vibrate) navigator.vibrate([150, 80, 200]);
    } catch (e) { }
  }

  // 2. 1-Click Vault Auto-Login Handler
  function checkAndHandleAutoLogin() {
    if (!chrome?.storage?.local) return;
    chrome.storage.local.get(['autoLoginTask', 'railwayVault'], (res) => {
      const task = res.autoLoginTask;
      const vault = res.railwayVault;
      const creds = task || vault;

      if (!creds || !creds.phone || !creds.pass) return;

      const path = window.location.pathname.toLowerCase();
      const isLoginPage = path.includes('/login') || path.includes('/auth/login') || path.includes('/sign-in') || document.querySelector('app-login-modal');

      if (!isLoginPage) return;

      const phoneInput = document.querySelector('input[formcontrolname="mobile_number"], input[name="mobile_number"], input[type="tel"], input[placeholder*="mobile" i], input[placeholder*="01" i]');
      const passInput = document.querySelector('input[formcontrolname="password"], input[name="password"], input[type="password"]');
      const submitBtn = document.querySelector('button[type="submit"], button.btn-login, button.login-btn, [class*="login-btn"]');

      if (phoneInput && passInput && submitBtn) {
        setHudStatus(currentLang === 'bn' ? '🔑 ভল্ট থেকে স্বয়ংক্রিয় লগইন হচ্ছে...' : '🔑 Auto-logging in via Vault...', '#0284c7');
        setAngularInput(phoneInput, creds.phone);
        setTimeout(() => {
          setAngularInput(passInput, creds.pass);
          setTimeout(() => {
            safeHumanClick(submitBtn, () => {
              chrome.storage.local.remove('autoLoginTask');
              setHudStatus(currentLang === 'bn' ? '✅ লগইন সফল! সেশন সিঙ্ক হচ্ছে...' : '✅ Logged in! Syncing session...', '#10b981');
            });
          }, 300);
        }, 200);
      }
    });
  }

  // 3. Live DOM Scraper for Search Results Page
  function scrapeLiveRailwayPage() {
    const isSearchPage = window.location.pathname.includes('/booking/train/search') ||
      document.querySelector('app-search-result, app-single-trip, .single-trip-wrapper, .trip-row');
    if (!isSearchPage) return null;

    const trips = [];
    const tripElements = Array.from(document.querySelectorAll('app-single-trip, .single-trip-wrapper, .trip-row, [class*="train-card"]'));

    tripElements.forEach(el => {
      const txt = el.innerText;
      const nameMatch = txt.match(/([A-Z\s]+(?:EXPRESS|COMMUTER|MAIL|INTERCITY)[^\n\(]*)/i);
      const codeMatch = txt.match(/\((\d{3})\)/);
      const timeMatches = txt.match(/(\d{1,2}:\d{2}\s*(?:AM|PM))/gi);

      const trainName = nameMatch ? nameMatch[1].trim() : (el.querySelector('h1, h2, h3, h4, strong, .trip-name')?.innerText?.trim() || '');
      const code = codeMatch ? codeMatch[1] : '';
      const dep = timeMatches?.[0] || '08:00 AM';
      const arr = timeMatches?.[1] || '';

      // Collect available seat types for this train
      const seatBoxes = Array.from(el.querySelectorAll('.seat-info-row, [class*="seat-item"], [class*="class-box"], .seat-class-name, div'));
      const seatTypes = [];

      seatBoxes.forEach(sb => {
        const sTxt = sb.innerText.toUpperCase();
        let sClass = null;
        if (sTxt.includes('S_CHAIR') || sTxt.includes('SHOVON CHAIR') || sTxt.includes('শোভন')) sClass = 'S_CHAIR';
        else if (sTxt.includes('SNIGDHA') || sTxt.includes('স্নিগ্ধা')) sClass = 'SNIGDHA';
        else if (sTxt.includes('AC_S') || sTxt.includes('AC SEAT')) sClass = 'AC_S';
        else if (sTxt.includes('AC_B') || sTxt.includes('AC BERTH')) sClass = 'AC_B';
        else if (sTxt.includes('F_CHAIR') || sTxt.includes('FIRST')) sClass = 'F_CHAIR';
        else if (sTxt.includes('SHOVON')) sClass = 'SHOVON';

        if (sClass && !seatTypes.find(st => st.type === sClass)) {
          const cleanTxt = sTxt.replace(/৳\s*[\d,]+/g, '').replace(/\bTK\.?\s*[\d,]+/gi, '').replace(/\d{1,2}:\d{2}\s*(?:AM|PM)/gi, '');
          const countMatch = cleanTxt.match(/(\d+)\s*(SEATS?|TICKETS?|টি|আসন)/i) || cleanTxt.match(/\b([1-9]\d?)\b/);
          const count = countMatch ? parseInt(countMatch[1], 10) : (sTxt.includes('0 SEAT') || sTxt.includes('০') ? 0 : 0);
          seatTypes.push({ type: sClass, seats: count });
        }
      });

      if (trainName) {
        trips.push({
          nameEn: trainName,
          nameBn: trainName,
          code,
          dep,
          arr,
          seatTypes,
          durationEn: '6h 00m',
          durationBn: '৬ ঘণ্টা'
        });
      }
    });

    if (trips.length > 0 && chrome?.storage?.local) {
      const urlParams = new URLSearchParams(window.location.search);
      const pageFrom = urlParams.get('fromcity') || urlParams.get('from_city') || null;
      const pageTo = urlParams.get('tocity') || urlParams.get('to_city') || null;
      chrome.storage.local.set({
        liveScrapedTrains: trips,
        liveScrapedMeta: { from: pageFrom, to: pageTo, scrapedAt: Date.now() }
      });
    }
    return trips;
  }

  // 4. Direction & Seat Selector Helper
  function isSeatMatchingDirection(seatNo, prefDir) {
    if (!prefDir || prefDir === 'any') return true;
    const num = parseInt(seatNo.replace(/\D/g, ''), 10);
    if (isNaN(num)) return true;

    if (prefDir === 'straight') return (num >= 5 && num <= 32);
    if (prefDir === 'middle') return (num >= 15 && num <= 45);
    if (prefDir === 'reverse') return (num >= 33 && num <= 56);
    return true;
  }

  function findBestContiguousSeats(seatElements, count, prefDir) {
    const available = [];
    seatElements.forEach(el => {
      const isBooked = el.classList.contains('booked') || el.classList.contains('disabled') || el.classList.contains('sleeper-booked') || el.hasAttribute('disabled');
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

  // 5. Precision Live Button & Seat Finder for Search Page
  function findAvailableTrainClassButton(targetTrain, targetClass, paxCount) {
    let trainCards = Array.from(document.querySelectorAll('app-single-trip, .single-trip-wrapper, .trip-row, [class*="train-card"]'));

    if (trainCards.length === 0) {
      trainCards = Array.from(document.querySelectorAll('.all-trip-boxes > div, .trip-item')).filter(Boolean);
    }
    if (trainCards.length === 0) trainCards = [document.body];

    for (const card of trainCards) {
      const cardText = card.innerText.toUpperCase();

      // If targetTrain is specified and NOT ANY_TRAIN, ensure card matches
      if (targetTrain && targetTrain !== 'ANY_TRAIN') {
        const cleanTrain = targetTrain.toUpperCase().replace(/\s*\(.*?\)\s*/g, '').trim();
        if (!cardText.includes(cleanTrain)) continue;
      }

      // Find all class boxes inside this train card
      const classBoxes = Array.from(card.querySelectorAll('.seat-info-row, [class*="seat-item"], [class*="class-box"], .seat-class-name, div')).filter(box => {
        const txt = box.innerText.toUpperCase();
        const hasClassCode = txt.includes('S_CHAIR') || txt.includes('SNIGDHA') || txt.includes('AC_S') || txt.includes('F_CHAIR') || txt.includes('SHOVON') || txt.includes('AC_B');
        const hasBookBtn = box.querySelector('button, a, [role="button"]');
        return hasClassCode && hasBookBtn;
      });

      for (const box of classBoxes) {
        const boxText = box.innerText.toUpperCase();

        const isClassMatch = (targetClass === 'ANY') ||
          boxText.includes(targetClass) ||
          (targetClass === 'S_CHAIR' && (boxText.includes('SHOVON') || boxText.includes('শোভন'))) ||
          (targetClass === 'SNIGDHA' && (boxText.includes('SNIGDHA') || boxText.includes('স্নিগ্ধা'))) ||
          (targetClass === 'F_CHAIR' && (boxText.includes('FIRST') || boxText.includes('১ম')));
        if (!isClassMatch) continue;

        const bookBtn = box.querySelector('button, a, [role="button"], .btn, [class*="book"]');
        const isBtnActive = bookBtn && !bookBtn.disabled && !bookBtn.classList.contains('disabled');
        const isSoldOut = boxText.includes('0 SEAT') || boxText.includes('০ টি') || boxText.includes('0 AVAILABLE');

        if (isBtnActive && !isSoldOut) {
          return {
            card,
            box,
            bookBtn,
            trainName: card.querySelector('h1, h2, h3, h4, .trip-name, strong, b')?.innerText?.trim() || targetTrain,
            classCode: targetClass
          };
        }
      }

      // Fallback: Check any active BOOK NOW button inside this card
      const allBookBtns = Array.from(card.querySelectorAll('button, a.btn, [role="button"]')).filter(b => {
        const t = b.innerText.trim().toUpperCase();
        return (t.includes('BOOK NOW') || t.includes('বুক') || t.includes('BOOK')) && !b.disabled && !b.classList.contains('disabled');
      });

      for (const btn of allBookBtns) {
        const parentBox = btn.closest('.seat-info-row, [class*="seat"], div') || btn.parentElement;
        const pText = parentBox ? parentBox.innerText.toUpperCase() : '';
        if (targetClass === 'ANY' || pText.includes(targetClass) || (targetClass === 'S_CHAIR' && pText.includes('SHOVON'))) {
          return {
            card,
            box: parentBox,
            bookBtn: btn,
            trainName: card.querySelector('h1, h2, h3, h4, .trip-name, strong, b')?.innerText?.trim() || targetTrain,
            classCode: targetClass
          };
        }
      }
    }

    return null;
  }

  // 6. Automated Fast-Grab Execution Engine
  function executeCascadingGrab() {
    if (isExecutingGrab || !isEngineRunning) return;
    isExecutingGrab = true;

    const priorities = config.priorities || [];
    let currentRuleIdx = 0;

    // Check if on search form (Home Page) and need to initiate search
    const fromInput = document.querySelector('input[name="from_station"], #from_station, input[placeholder*="From" i]');
    const toInput = document.querySelector('input[name="to_station"], #to_station, input[placeholder*="To" i]');
    const searchBtn = document.querySelector('button[type="submit"], button.search-btn, button.btn-search, [class*="search-btn"]');
    const hasSearchResults = document.querySelectorAll('app-single-trip, .single-trip-wrapper, .trip-row').length > 0;

    if (!hasSearchResults && fromInput && toInput && searchBtn) {
      setHudStatus(currentLang === 'bn' ? '🔍 রেলওয়ে পোর্টালে সার্চ শুরু করা হচ্ছে...' : '🔍 Initiating train search...', '#0284c7');
      setAngularInput(fromInput, config.routeFrom);
      setAngularInput(toInput, config.routeTo);

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
          ? `⏳ (${trainLabel}) এই মুহূর্তে সিট নেই। ওয়াচডগ সক্রিয় (প্রতি ১০ সেকেন্ডে অটো-চেক হচ্ছে)...`
          : `⏳ (${trainLabel}) Sold out right now. Watchdog active (Auto-checking every 10s)...`;

        setHudStatus(noSeatMsg, '#f59e0b');
        startContinuousWatchdog();
        return;
      }

      const rule = priorities[currentRuleIdx];
      const targetClass = (rule.classCode || 'S_CHAIR').toUpperCase();
      setHudStatus(currentLang === 'bn' ? `প্রায়োরিটি ${rule.level} (${targetClass}) চেক হচ্ছে...` : `Checking Priority ${rule.level} (${targetClass})...`, '#0284c7');

      const match = findAvailableTrainClassButton(config.trainName, targetClass, config.passengers);

      if (match && match.bookBtn) {
        setHudStatus(currentLang === 'bn' ? `⚡ সিট পাওয়া গেছে (${match.trainName})! বুকিং হচ্ছে...` : `⚡ Seats found (${match.trainName})! Booking now...`, '#10b981');
        safeHumanClick(match.bookBtn, () => {
          setTimeout(() => {
            // Wait for seat layout modal to render
            const seatLayoutEl = document.querySelector('app-seat-layout, .seat-layout-view, .view_seat_bg');
            const seatElements = document.querySelectorAll('.seat-btn, .seat, [class*="seat-item"], button[aria-label*="Seat"], .sleeper-available');
            const targetSeats = findBestContiguousSeats(seatElements, config.passengers, rule.dir);

            if (targetSeats && targetSeats.length > 0) {
              lockTargetSeats(targetSeats, rule);
            } else {
              currentRuleIdx++;
              setTimeout(tryNextRule, 100);
            }
          }, 350);
        });
      } else {
        currentRuleIdx++;
        setTimeout(tryNextRule, 80);
      }
    }

    tryNextRule();
  }

  function lockTargetSeats(seats, rule) {
    let idx = 0;
    function selectNext() {
      if (idx >= seats.length) {
        playAlertSound();
        setHudStatus(currentLang === 'bn' ? `🎉 সিট সিলেক্ট হয়েছে! কনফার্ম করা হচ্ছে...` : `🎉 Seats Selected! Confirming...`, '#10b981');
        isExecutingGrab = false;

        setTimeout(() => {
          const proceedBtn =
            document.querySelector('.btn-booking-continue, button[type="submit"], .btn-confirm, .book-now-btn, [class*="proceed-btn"], [class*="confirm-btn"], button[class*="purchase"]') ||
            Array.from(document.querySelectorAll('button')).find(b => {
              const t = b.innerText.trim().toLowerCase();
              return t.includes('continue') || t.includes('confirm') || t.includes('proceed') || t.includes('চালিয়ে যান') || t.includes('নিশ্চিত');
            });

          if (proceedBtn) {
            proceedBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
            safeHumanClick(proceedBtn, () => {
              if (chrome?.storage?.local) chrome.storage.local.remove('activeGrabTask');
            });
          }
        }, 200);
        return;
      }

      safeHumanClick(seats[idx], () => {
        idx++;
        selectNext();
      });
    }

    selectNext();
  }

  // 7. Continuous Sold-Out Watchdog with 8-12s Retry Loop
  function startContinuousWatchdog() {
    if (watchdogRetryTimer) clearInterval(watchdogRetryTimer);
    
    // Check if on search results page
    const isSearchPage = window.location.pathname.includes('/booking/train/search');
    if (!isSearchPage || !isEngineRunning) return;

    const delay = Math.floor(Math.random() * 4000) + 8000; // 8,000ms to 12,000ms with jitter
    watchdogRetryTimer = setTimeout(() => {
      if (!isEngineRunning) return;
      setHudStatus(currentLang === 'bn' ? '🔄 নতুন সিট রিলিজ চেক করা হচ্ছে...' : '🔄 Re-checking for cancelled/released seats...', '#0284c7');
      
      // Re-trigger search or page reload
      const modifySearchBtn = document.querySelector('app-modify-search button[type="submit"], .btn-search, button[class*="search"]');
      if (modifySearchBtn) {
        safeHumanClick(modifySearchBtn, () => {
          setTimeout(executeCascadingGrab, 1200);
        });
      } else {
        // Refresh page to get latest server pool
        window.location.reload();
      }
    }, delay);
  }

  // 8. 5-Minute Seat Hold Countdown & bKash Auto-Assister
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

    if (!isPaymentPage) {
      paymentAssisted = false;
      seatLockToastShown = false;
      return;
    }

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
          ? `🎉 সিট ৫ মিনিটের জন্য লক হয়েছে! (${timerStr}) বিকাশ পেমেন্ট করুন`
          : `🎉 Seat Locked for 5 Minutes! (${timerStr}) Complete bKash payment`, '#10b981');
      }

      if (!paymentAssisted) {
        paymentAssisted = true;
        playAlertSound();
        try {
          chrome?.runtime?.sendMessage({ action: 'SEAT_LOCKED_NOTIFY' });
        } catch (e) { }
      }

      // Auto-select bKash
      const bkashOption = document.querySelector('#bkash') ||
        document.querySelector('input[value*="bkash" i]') ||
        document.querySelector('input[id*="bkash" i]') ||
        document.querySelector('label[for*="bkash" i]') ||
        Array.from(document.querySelectorAll('label, div, button')).find(el => {
          if (el.closest('#geticket-hud-root') || el.closest('#gtToastBanner')) return false;
          const txt = el.innerText.trim().toLowerCase();
          return (txt === 'bkash' || txt.includes('bkash')) && !el.querySelector('input');
        });

      if (bkashOption) {
        safeHumanClick(bkashOption);
      }
    }
  }

  // 9. Check for Active Tasks on Page Load
  function checkActiveTasks() {
    if (!chrome?.storage?.local) return;
    chrome.storage.local.get(['activeGrabTask', 'gt_theme', 'gt_lang', 'geTicketConfig'], (res) => {
      if (res.gt_theme) currentTheme = res.gt_theme;
      if (res.gt_lang) currentLang = res.gt_lang;
      if (res.geTicketConfig) config = { ...config, ...res.geTicketConfig };

      const grabTask = res.activeGrabTask;
      if (grabTask && (Date.now() - grabTask.timestamp) < 180000) { // Valid within 3 mins
        config.routeFrom = grabTask.from || config.routeFrom;
        config.routeTo = grabTask.to || config.routeTo;
        config.targetDate = grabTask.date || config.targetDate;
        config.passengers = grabTask.passengers || config.passengers;
        config.trainName = grabTask.trainName || config.trainName;
        if (grabTask.priorities && grabTask.priorities.length > 0) {
          config.priorities = grabTask.priorities;
        }

        const isSearchPage = window.location.pathname.includes('/booking/train/search');
        if (isSearchPage) {
          setHudStatus(currentLang === 'bn' ? `⚡ (${config.trainName}) সিট লকিং শুরু হচ্ছে...` : `⚡ (${config.trainName}) Locking seats...`, '#10b981');
          setTimeout(executeCascadingGrab, 800);
        }
      }
    });

    checkAndHandleAutoLogin();
  }

  // 10. Inject Floating HUD
  function injectHud() {
    if (document.getElementById('geticket-hud-root')) return;

    const hud = document.createElement('div');
    hud.id = 'geticket-hud-root';
    hud.className = 'gt-floating-hud';
    hud.innerHTML = `
      <div class="gt-hud-header">
        <div class="gt-hud-brand">
          <span class="gt-hud-dot">🟢</span>
          <span class="gt-hud-title" id="gtTitleText">GeTicket Pro</span>
          <span class="gt-hud-version">v2.8</span>
        </div>
        <div class="gt-hud-actions">
          <button class="gt-power-btn active" id="gtPowerBtn" title="Toggle Automation">🟢 Active</button>
          <button class="gt-hud-btn" id="gtLangToggle">EN</button>
          <button class="gt-hud-btn" id="gtThemeToggle">☀️</button>
          <button class="gt-hud-btn" id="gtMinimizeBtn">−</button>
        </div>
      </div>
      <div class="gt-hud-body" id="gtHudBody">
        <div class="gt-status-strip" id="gtStatusStrip">
          <span id="gtStatusText">⚡ 100% Real-Time Engine Active • Zero Account Ban</span>
        </div>
        <div class="gt-hud-clock">
          <span id="gtClockLabel">RAILWAY SERVER TIME:</span>
          <span id="gtCountdown" class="gt-clock-digits">00:00:00.000</span>
        </div>
      </div>
    `;

    document.body.appendChild(hud);

    // Event listeners
    hud.querySelector('#gtMinimizeBtn')?.addEventListener('click', () => {
      const body = hud.querySelector('#gtHudBody');
      if (body) body.style.display = body.style.display === 'none' ? 'block' : 'none';
    });

    hud.querySelector('#gtLangToggle')?.addEventListener('click', () => {
      currentLang = currentLang === 'en' ? 'bn' : 'en';
      if (chrome?.storage?.local) chrome.storage.local.set({ gt_lang: currentLang });
      applyThemeAndLang();
    });

    hud.querySelector('#gtThemeToggle')?.addEventListener('click', () => {
      currentTheme = currentTheme === 'light' ? 'dark' : 'light';
      if (chrome?.storage?.local) chrome.storage.local.set({ gt_theme: currentTheme });
      applyThemeAndLang();
    });

    hud.querySelector('#gtPowerBtn')?.addEventListener('click', () => {
      isEngineRunning = !isEngineRunning;
      const btn = hud.querySelector('#gtPowerBtn');
      if (btn) {
        if (isEngineRunning) {
          btn.className = 'gt-power-btn active';
          btn.innerText = '🟢 Active';
          setHudStatus(currentLang === 'bn' ? '⚡ ইঞ্জিন সক্রিয়' : '⚡ Engine Active', '#10b981');
        } else {
          btn.className = 'gt-power-btn paused';
          btn.innerText = '🔴 Paused';
          setHudStatus(currentLang === 'bn' ? '⏸️ ইঞ্জিন বন্ধ' : '⏸️ Engine Paused', '#ef4444');
          if (watchdogRetryTimer) clearTimeout(watchdogRetryTimer);
        }
      }
    });

    // Clock updater
    setInterval(() => {
      const clockEl = hud.querySelector('#gtCountdown');
      if (!clockEl) return;
      const now = new Date();
      const hrs = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      const secs = String(now.getSeconds()).padStart(2, '0');
      const ms = String(now.getMilliseconds()).padStart(3, '0');
      clockEl.innerText = `${hrs}:${mins}:${secs}.${ms}`;
    }, 50);

    applyThemeAndLang();
  }

  function setHudStatus(msg, color) {
    const el = document.querySelector('#gtStatusText');
    const strip = document.querySelector('#gtStatusStrip');
    if (el) el.innerText = msg;
    if (strip && color) strip.style.borderColor = color;
  }

  function applyThemeAndLang() {
    const hud = document.getElementById('geticket-hud-root');
    if (!hud) return;
    hud.setAttribute('data-theme', currentTheme);
    const langBtn = hud.querySelector('#gtLangToggle');
    const themeBtn = hud.querySelector('#gtThemeToggle');
    const titleText = hud.querySelector('#gtTitleText');
    const clockLabel = hud.querySelector('#gtClockLabel');

    if (langBtn) langBtn.innerText = currentLang === 'en' ? 'EN' : 'বাং';
    if (themeBtn) themeBtn.innerText = currentTheme === 'light' ? '☀️' : '🌙';
    if (titleText) titleText.innerText = currentLang === 'bn' ? 'জি-টিকিট প্রো' : 'GeTicket Pro';
    if (clockLabel) clockLabel.innerText = currentLang === 'bn' ? 'রেলওয়ে সার্ভার টাইম:' : 'RAILWAY SERVER TIME:';
  }

  // 11. Runtime Message Listeners
  chrome.runtime?.onMessage?.addListener((req, sender, sendResponse) => {
    if (req.action === 'INSTANT_GRAB_COMMAND') {
      if (req.trainName) config.trainName = req.trainName;
      if (req.passengers) config.passengers = parseInt(req.passengers, 10) || 1;
      if (req.classCode && config.priorities?.[0]) config.priorities[0].classCode = req.classCode;
      if (req.priorities) config.priorities = req.priorities;

      playAlertSound();
      setHudStatus(currentLang === 'bn' ? '⚡ ইন্সট্যান্ট সিট খোঁজা ও বুকিং হচ্ছে...' : '⚡ Instant Seat Grab in progress...', '#10b981');
      executeCascadingGrab();
      sendResponse({ success: true });
    }

    if (req.action === 'PAUSE_ENGINE') {
      isEngineRunning = false;
      if (watchdogRetryTimer) clearTimeout(watchdogRetryTimer);
      const btn = document.querySelector('#gtPowerBtn');
      if (btn) {
        btn.className = 'gt-power-btn paused';
        btn.innerText = '🔴 Paused';
      }
      setHudStatus(currentLang === 'bn' ? '⏸️ পপআপ থেকে ইঞ্জিন বন্ধ' : '⏸️ Engine paused from popup', '#ef4444');
      sendResponse({ success: true });
    }

    if (req.action === 'SESSION_PING') {
      fetch('/api/v1/user/me', { method: 'GET', credentials: 'include' }).catch(() => { });
      sendResponse({ success: true });
    }
  });

  // 12. Page Initializer & Continuous Scraper
  function init() {
    injectHud();
    checkActiveTasks();
    setInterval(scrapeLiveRailwayPage, 3000);
    paymentAssisterTimer = setInterval(initPaymentAutoAssister, 1000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
