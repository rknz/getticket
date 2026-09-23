/**
 * GeTicket Pro - Background Service Worker (v2.8)
 * Handles Real-Time Railway Auth Bridge, Live Shohoz API Proxy,
 * Instant Fast-Grab Task Scheduler, 10-Day Advance Release Alarms & Anti-Logout Keep-Alive.
 */

const RAILWAY_URL = 'https://eticket.railway.gov.bd';

// Helper: Format date into Bangladesh Railway standard DD-MMM-YYYY (e.g. 25-Sep-2026)
function formatRailwayDate(dateStr) {
  if (!dateStr) return '';
  // If already in DD-MMM-YYYY format
  if (/^\d{1,2}-[A-Za-z]{3}-\d{4}$/.test(dateStr)) return dateStr;
  
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = String(d.getDate()).padStart(2, '0');
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

// Sync badge count on the extension icon
function syncExtensionBadge(count) {
  if (chrome?.action?.setBadgeText) {
    const text = count > 0 ? String(count) : '';
    chrome.action.setBadgeText({ text });
    chrome.action.setBadgeBackgroundColor({ color: '#0284c7' });
  }
}

// Initialize badge count from storage
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['scheduledBookings'], (data) => {
    const bookings = data.scheduledBookings || [];
    syncExtensionBadge(bookings.length);
  });
});

chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.get(['scheduledBookings'], (data) => {
    const bookings = data.scheduledBookings || [];
    syncExtensionBadge(bookings.length);
  });
});

// 1. Alarm Listener for Advance Bookings & Session Keep-Alive
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name.startsWith('geticket_sched_') || alarm.name.startsWith('geticket_schedule_')) {
    chrome.storage.local.get(['scheduledBookings', 'gt_lang', 'railwaySession', 'railwayVault'], (data) => {
      const bookings = data.scheduledBookings || [];
      const current = bookings.find(b => b.id === alarm.name);
      const isBn = data.gt_lang === 'bn';

      const routeText = current ? `${current.from} ➔ ${current.to} (${current.date})` : 'Train Ticket Booking';

      // Send System Notification
      if (chrome.notifications) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon128.png',
          title: isBn ? '🚄 GeTicket: অগ্রিম টিকিট রিলিজ অ্যালার্ট!' : '🚄 GeTicket: Advance Ticket Release Alert!',
          message: isBn 
            ? `আর ১০ মিনিট পর (${routeText}) টিকিট বুকিং শুরু হবে। রেলওয়ে পোর্টাল প্রস্তুত করা হচ্ছে!` 
            : `10 minutes until booking opens for (${routeText}). Preparing Railway Portal!`,
          priority: 2
        });
      }

      // Auto Open Railway Tab & Prepare Grab Task
      const formattedDate = current ? formatRailwayDate(current.date) : '';
      const searchUrl = current 
        ? `${RAILWAY_URL}/booking/train/search?fromcity=${encodeURIComponent(current.from)}&tocity=${encodeURIComponent(current.to)}&doj=${encodeURIComponent(formattedDate)}&class=${encodeURIComponent(current.classCode || 'S_CHAIR')}`
        : `${RAILWAY_URL}/`;

      if (current) {
        chrome.storage.local.set({
          activeGrabTask: {
            from: current.from,
            to: current.to,
            date: formattedDate,
            passengers: current.passengers || 1,
            trainName: current.trainName || 'ANY_TRAIN',
            classCode: current.classCode || 'S_CHAIR',
            priorities: current.priorities || [],
            timestamp: Date.now()
          }
        });
      }

      if (chrome?.tabs?.create) {
        chrome.tabs.create({ url: searchUrl, active: true });
      }
    });
  } else if (alarm.name === 'geticket_session_keepalive') {
    // Keep-alive ping from the content script context (carries cookies & credentials)
    chrome.tabs.query({ url: '*://eticket.railway.gov.bd/*' }, (tabs) => {
      if (tabs && tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'SESSION_PING' }).catch(() => {});
      }
    });
  }
});

// 2. Runtime Message Handler
chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {

  // A. AUTH STATUS CHECK: Checks if user has a valid active token
  if (req.action === 'CHECK_AUTH_STATUS') {
    chrome.storage.local.get(['railwaySession', 'railwayVault'], (data) => {
      const session = data.railwaySession;
      const vault = data.railwayVault;
      const isLoggedIn = !!(session && session.token);
      sendResponse({
        isLoggedIn,
        user: session?.user || null,
        token: session?.token || null,
        hasVault: !!(vault && vault.phone && vault.pass),
        updatedAt: session?.updatedAt || null
      });
    });
    return true;
  }

  // B. TRIGGER AUTO LOGIN: Opens login page & sends vault credentials
  if (req.action === 'TRIGGER_AUTO_LOGIN') {
    chrome.storage.local.get(['railwayVault'], (data) => {
      const vault = data.railwayVault || {};
      if (!vault.phone || !vault.pass) {
        sendResponse({ success: false, error: 'NO_VAULT_CREDENTIALS' });
        return;
      }

      chrome.storage.local.set({
        autoLoginTask: {
          phone: vault.phone,
          pass: vault.pass,
          timestamp: Date.now()
        }
      });

      const loginUrl = `${RAILWAY_URL}/login`;
      chrome.tabs.query({ url: '*://eticket.railway.gov.bd/*' }, (tabs) => {
        if (tabs && tabs.length > 0) {
          const targetTab = tabs[0];
          chrome.tabs.update(targetTab.id, { url: loginUrl, active: true });
          sendResponse({ success: true, tabId: targetTab.id, action: 'navigated' });
        } else {
          chrome.tabs.create({ url: loginUrl, active: true }, (newTab) => {
            sendResponse({ success: true, tabId: newTab.id, action: 'created' });
          });
        }
      });
    });
    return true;
  }

  // C. LIVE RAILWAY API PROXY: Queries Shohoz with Bearer token & Device Headers
  if (req.action === 'FETCH_RAILWAY_LIVE_API') {
    const { from, to, date, classCode } = req;
    const formattedDate = formatRailwayDate(date);
    
    chrome.storage.local.get(['railwaySession'], (storageData) => {
      const session = storageData.railwaySession || {};
      const headers = {
        'Accept': 'application/json, text/plain, */*',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'X-Requested-With': 'XMLHttpRequest',
        'Origin': 'https://eticket.railway.gov.bd',
        'Referer': 'https://eticket.railway.gov.bd/'
      };

      if (session.token) {
        headers['Authorization'] = session.token.startsWith('Bearer ') ? session.token : `Bearer ${session.token}`;
      }
      headers['X-Device-Id'] = session.deviceId || 'gt_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
      if (session.deviceKey) headers['X-Device-Key'] = session.deviceKey;

      const apiUrl = `https://railspaapi.shohoz.com/v1.0/web/bookings/search-trips-v2?from_city=${encodeURIComponent(from)}&to_city=${encodeURIComponent(to)}&date_of_journey=${encodeURIComponent(formattedDate)}&seat_class=${encodeURIComponent(classCode || 'S_CHAIR')}`;

      fetch(apiUrl, {
        method: 'GET',
        headers
      })
        .then(async res => {
          if (res.status === 401) {
            // Token expired or not given
            return { unauthorized: true, status: 401 };
          }
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then(json => {
          if (json.unauthorized) {
            sendResponse({ success: false, live: false, unauthorized: true, error: 'TOKEN_NOT_GIVEN' });
            return;
          }
          const trains = json.data?.trains || json.data?.trips || json.trains;
          if (trains && trains.length > 0) {
            sendResponse({ success: true, live: true, data: { ...json.data, trains } });
          } else {
            sendResponse({ success: false, live: false, error: 'EMPTY_RESULTS', data: json.data || json });
          }
        })
        .catch(err => {
          sendResponse({ success: false, live: false, error: err.message });
        });
    });
    return true;
  }

  // D. INSTANT TICKET GRAB TRIGGER: Navigates to Railway Search and primes Grab Engine
  if (req.action === 'TRIGGER_INSTANT_GRAB') {
    const { from, to, date, passengers, trainName, classCode, priorities } = req;
    const formattedDate = formatRailwayDate(date);
    const searchUrl = `${RAILWAY_URL}/booking/train/search?fromcity=${encodeURIComponent(from)}&tocity=${encodeURIComponent(to)}&doj=${encodeURIComponent(formattedDate)}&class=${encodeURIComponent(classCode || 'S_CHAIR')}`;
    
    // Store active grab task in storage so content.js automatically executes it on page load
    const grabTask = {
      from,
      to,
      date: formattedDate,
      passengers: parseInt(passengers, 10) || 1,
      trainName: trainName || 'ANY_TRAIN',
      classCode: classCode || 'S_CHAIR',
      priorities: priorities || [],
      timestamp: Date.now()
    };

    chrome.storage.local.set({ activeGrabTask: grabTask }, () => {
      chrome.tabs.query({ url: '*://eticket.railway.gov.bd/*' }, (tabs) => {
        if (tabs && tabs.length > 0) {
          const targetTab = tabs[0];
          chrome.tabs.update(targetTab.id, { url: searchUrl, active: true }, () => {
            sendResponse({ success: true, tabId: targetTab.id, action: 'navigated' });
          });
        } else {
          chrome.tabs.create({ url: searchUrl, active: true }, (newTab) => {
            sendResponse({ success: true, tabId: newTab.id, action: 'created' });
          });
        }
      });
    });
    return true;
  }

  // E. SCHEDULE BOOKING: Advance bookings
  if (req.action === 'SCHEDULE_BOOKING') {
    const { id, targetTimestamp, bookingInfo } = req;
    
    chrome.storage.local.get(['scheduledBookings'], (data) => {
      const bookings = data.scheduledBookings || [];
      const existingIdx = bookings.findIndex(b => b.id === id);
      if (existingIdx >= 0) {
        bookings[existingIdx] = { id, ...bookingInfo };
      } else {
        bookings.push({ id, ...bookingInfo });
      }

      chrome.storage.local.set({ scheduledBookings: bookings }, () => {
        syncExtensionBadge(bookings.length);
        sendResponse({ success: true, count: bookings.length });
      });
    });

    if (targetTimestamp && targetTimestamp > Date.now()) {
      chrome.alarms.create(id, { when: targetTimestamp });
    }
    return true;
  }

  // F. CANCEL SCHEDULE
  if (req.action === 'CANCEL_SCHEDULE') {
    const { id } = req;
    chrome.storage.local.get(['scheduledBookings'], (data) => {
      const bookings = (data.scheduledBookings || []).filter(b => b.id !== id);
      chrome.storage.local.set({ scheduledBookings: bookings }, () => {
        syncExtensionBadge(bookings.length);
        sendResponse({ success: true, count: bookings.length });
      });
    });
    chrome.alarms.clear(id);
    return true;
  }

  // G. GET ALL SCHEDULES
  if (req.action === 'GET_SCHEDULES') {
    chrome.storage.local.get(['scheduledBookings'], (data) => {
      const bookings = data.scheduledBookings || [];
      syncExtensionBadge(bookings.length);
      sendResponse({ schedules: bookings, count: bookings.length });
    });
    return true;
  }

  // H. ANTI-LOGOUT SESSION GUARD
  if (req.action === 'START_SESSION_GUARD') {
    chrome.alarms.create('geticket_session_keepalive', { periodInMinutes: 4 });
    sendResponse({ success: true });
  }

  // I. SEAT LOCKED NOTIFICATION
  if (req.action === 'SEAT_LOCKED_NOTIFY') {
    chrome.storage.local.get(['gt_lang'], (data) => {
      const isBn = data.gt_lang === 'bn';
      if (chrome.notifications) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon128.png',
          title: isBn ? '🎉 সিট ৫ মিনিটের জন্য লক হয়েছে!' : '🎉 Seats Locked for 5 Minutes!',
          message: isBn 
            ? 'বিকাশ পেমেন্ট গেটওয়ে সক্রিয় করা হয়েছে। ৫ মিনিটের মধ্যে পেমেন্ট সম্পন্ন করুন।' 
            : 'bKash payment gateway active. Complete payment before 5-minute timeout!',
          priority: 2
        });
      }
    });
    sendResponse({ success: true });
  }
});
