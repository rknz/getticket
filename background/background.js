/**
 * GeTicket Pro - Background Service Worker (v2.8)
 * Handles Real-Time Railway Auth Bridge, Live Shohoz API Proxy,
 * Instant Fast-Grab Task Scheduler, 10-Day Advance Release Alarms & Anti-Logout Keep-Alive.
 */

const RAILWAY_URL = 'https://eticket.railway.gov.bd';

// Helper: Format date into Bangladesh Railway standard DD-MMM-YYYY (e.g. 25-Sep-2026)
function formatRailwayDate(dateStr) {
  if (!dateStr) return '';
  if (/^\d{1,2}-[A-Za-z]{3}-\d{4}$/.test(dateStr)) return dateStr;
  
  const parts = String(dateStr).split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    const year = parts[0];
    const monthIdx = parseInt(parts[1], 10) - 1;
    const day = String(parseInt(parts[2], 10)).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    if (monthIdx >= 0 && monthIdx < 12) {
      return `${day}-${months[monthIdx]}-${year}`;
    }
  }

  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = String(d.getDate()).padStart(2, '0');
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

// Clean up schedules whose journey date has passed
function cleanExpiredSchedules(bookings) {
  if (!Array.isArray(bookings)) return [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const monthsMap = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };

  return bookings.filter(item => {
    if (!item.date) return false;
    let itemDate = null;
    const parts = String(item.date).split('-');
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        itemDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      } else if (parts[2].length === 4) {
        const m = monthsMap[parts[1].toLowerCase()];
        if (m !== undefined) {
          itemDate = new Date(parseInt(parts[2], 10), m, parseInt(parts[0], 10));
        }
      }
    }
    if (!itemDate || isNaN(itemDate.getTime())) {
      itemDate = new Date(item.date);
    }
    if (isNaN(itemDate.getTime())) return true;
    itemDate.setHours(23, 59, 59, 999);
    return itemDate.getTime() >= today.getTime();
  });
}

// Sync badge count on the extension icon
function syncExtensionBadge(count) {
  if (chrome?.action?.setBadgeText) {
    const text = count > 0 ? String(count) : '';
    chrome.action.setBadgeText({ text });
    chrome.action.setBadgeBackgroundColor({ color: '#0284c7' });
  }
}

// Initialize badge count from storage & prune expired schedules
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['scheduledBookings'], (data) => {
    const cleaned = cleanExpiredSchedules(data.scheduledBookings || []);
    chrome.storage.local.set({ scheduledBookings: cleaned }, () => {
      syncExtensionBadge(cleaned.length);
    });
  });
});

chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.get(['scheduledBookings'], (data) => {
    const cleaned = cleanExpiredSchedules(data.scheduledBookings || []);
    chrome.storage.local.set({ scheduledBookings: cleaned }, () => {
      syncExtensionBadge(cleaned.length);
    });
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
        try {
          const icon = chrome.runtime?.getURL ? chrome.runtime.getURL('icons/icon128.png') : 'icons/icon128.png';
          chrome.notifications.create({
            type: 'basic',
            iconUrl: icon,
            title: isBn ? '🚄 GeTicket: অগ্রিম টিকিট রিলিজ অ্যালার্ট!' : '🚄 GeTicket: Advance Ticket Release Alert!',
            message: isBn 
              ? `আর ১০ মিনিট পর (${routeText}) টিকিট বুকিং শুরু হবে। রেলওয়ে পোর্টাল প্রস্তুত করা হচ্ছে!` 
              : `10 minutes until booking opens for (${routeText}). Preparing Railway Portal!`,
            priority: 2
          }, () => {
            if (chrome.runtime?.lastError) { /* ignore */ }
          });
        } catch (e) { }
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
    chrome.storage.local.get(['railwaySession', 'railwayVault'], async (data) => {
      let session = data.railwaySession || {};
      const vault = data.railwayVault;

      // Also check cookies for eticket.railway.gov.bd
      try {
        if (!session.token && chrome.cookies) {
          const cookies = await chrome.cookies.getAll({ url: 'https://eticket.railway.gov.bd' });
          const authCookie = cookies.find(c => c.name === 'token' || c.name === 'auth_token' || c.name.includes('remember'));
          if (authCookie && authCookie.value) {
            session.token = authCookie.value;
          }
        }
      } catch (e) { }

      const isLoggedIn = !!(session && (session.token || session.userName));
      sendResponse({
        isLoggedIn,
        user: session?.user || (session?.userName ? { name: session.userName } : null),
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
    const { from, to, date, classCode, token: directToken } = req;
    const formattedDate = formatRailwayDate(date);
    
    chrome.storage.local.get(['railwaySession'], async (storageData) => {
      const session = storageData.railwaySession || {};
      let activeToken = directToken || session.token;

      // If token not present in storage, check all relevant cookies
      if (!activeToken && chrome.cookies) {
        try {
          const cookies = await chrome.cookies.getAll({ url: 'https://eticket.railway.gov.bd' });
          let authCookie = cookies.find(c => c.name === 'token' || c.name === 'auth_token' || c.name === '_token' || c.name.includes('token') || c.name.includes('jwt'));
          if (authCookie) activeToken = authCookie.value;

          if (!activeToken) {
            const domainCookies = await chrome.cookies.getAll({ domain: 'railway.gov.bd' });
            authCookie = domainCookies.find(c => c.name === 'token' || c.name === 'auth_token' || c.name === '_token' || c.name.includes('token') || c.name.includes('jwt'));
            if (authCookie) activeToken = authCookie.value;
          }

          if (!activeToken) {
            const shohozCookies = await chrome.cookies.getAll({ domain: 'shohoz.com' });
            authCookie = shohozCookies.find(c => c.name === 'token' || c.name === 'auth_token' || c.name.includes('token'));
            if (authCookie) activeToken = authCookie.value;
          }
        } catch (e) { }
      }

      const headers = {
        'Accept': 'application/json, text/plain, */*',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'X-Requested-With': 'XMLHttpRequest',
        'Origin': 'https://eticket.railway.gov.bd',
        'Referer': 'https://eticket.railway.gov.bd/'
      };

      if (activeToken) {
        headers['Authorization'] = activeToken.startsWith('Bearer ') ? activeToken : `Bearer ${activeToken}`;
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
      const cleaned = cleanExpiredSchedules(data.scheduledBookings || []);
      chrome.storage.local.set({ scheduledBookings: cleaned }, () => {
        syncExtensionBadge(cleaned.length);
        sendResponse({ schedules: cleaned, count: cleaned.length });
      });
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
        try {
          const icon = chrome.runtime?.getURL ? chrome.runtime.getURL('icons/icon128.png') : 'icons/icon128.png';
          chrome.notifications.create({
            type: 'basic',
            iconUrl: icon,
            title: isBn ? '🎉 সিট ৫ মিনিটের জন্য লক হয়েছে!' : '🎉 Seats Locked for 5 Minutes!',
            message: isBn 
              ? 'বিকাশ পেমেন্ট গেটওয়ে সক্রিয় করা হয়েছে। ৫ মিনিটের মধ্যে পেমেন্ট সম্পন্ন করুন।' 
              : 'bKash payment gateway active. Complete payment before 5-minute timeout!',
            priority: 2
          }, () => {
            if (chrome.runtime?.lastError) { /* ignore */ }
          });
        } catch (e) { }
      }
    });
    sendResponse({ success: true });
  }
});
