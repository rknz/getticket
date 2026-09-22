/**
 * GeTicket Pro - Background Service Worker
 * Handles 4-10 Day Advance Alarms, Wakeup Notifications, Anti-Logout Keep-Alive,
 * Live Railway Server API Fetch & Instant Ticket Auto-Grabber.
 */

const RAILWAY_URL = 'https://eticket.railway.gov.bd';

// Helper to sync badge count on the extension icon in browser toolbar
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

// 1. Alarm Listener for Advance Bookings (4-10 days in advance)
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name.startsWith('geticket_sched_') || alarm.name.startsWith('geticket_schedule_')) {
    chrome.storage.local.get(['scheduledBookings', 'gt_lang'], (data) => {
      const bookings = data.scheduledBookings || [];
      const current = bookings.find(b => b.id === alarm.name);
      const isBn = data.gt_lang === 'bn';

      const routeText = current ? `${current.from} ➔ ${current.to} (${current.date})` : 'Train Ticket Booking';

      // Send System Notification
      if (chrome.notifications) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon128.png',
          title: isBn ? '🚄 GeTicket: অগ্রিম টিকিট বুকিং অ্যালার্ট!' : '🚄 GeTicket: Advance Ticket Booking Alert!',
          message: isBn 
            ? `আর ১০ মিনিট পর (${routeText}) টিকিট বুকিং শুরু হবে। বুকিং পোর্টাল প্রস্তুত!` 
            : `10 minutes until booking opens for (${routeText}). Booking portal is ready!`,
          priority: 2
        });
      }

      // Auto Open Railway Tab at 7:50 AM
      if (chrome?.tabs?.create) {
        chrome.tabs.create({ url: `${RAILWAY_URL}/booking/train-search`, active: true });
      }
    });
  } else if (alarm.name === 'geticket_session_keepalive') {
    // Ping to keep session warm
    fetch(`${RAILWAY_URL}/api/v1/user/me`, { method: 'GET', credentials: 'include' })
      .catch(() => {});
  }
});

// 2. Schedule Wakeup Handler, Live Railway API Fetcher & Instant Grabber
chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {

  // LIVE RAILWAY API PROXY: Queries the official Shohoz / Bangladesh Railway backend
  if (req.action === 'FETCH_RAILWAY_LIVE_API') {
    const { from, to, date, classCode } = req;
    
    chrome.storage.local.get(['railwaySession'], (storageData) => {
      const session = storageData.railwaySession || {};
      const headers = {
        'Accept': 'application/json, text/plain, */*',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      };

      if (session.token) {
        headers['Authorization'] = session.token.startsWith('Bearer ') ? session.token : `Bearer ${session.token}`;
      }
      if (session.deviceId) headers['x-device-id'] = session.deviceId;
      if (session.deviceKey) headers['x-device-key'] = session.deviceKey;

      const apiUrl = `https://railspaapi.shohoz.com/v1.0/web/bookings/search-trips-v2?from_city=${encodeURIComponent(from)}&to_city=${encodeURIComponent(to)}&date_of_journey=${encodeURIComponent(date)}&seat_class=${encodeURIComponent(classCode || 'S_CHAIR')}`;

      fetch(apiUrl, {
        method: 'GET',
        headers
      })
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then(json => {
          if (json && (json.data?.trains || json.data?.trips || json.trains)) {
            sendResponse({ success: true, live: true, data: json.data || json });
          } else {
            sendResponse({ success: false, live: false, error: 'Empty train trips' });
          }
        })
        .catch(err => {
          sendResponse({ success: false, live: false, error: err.message });
        });
    });
    return true; // Keep open for async response
  }

  // INSTANT TICKET GRAB TRIGGER: Immediately executes booking on live railway tab
  if (req.action === 'TRIGGER_INSTANT_GRAB') {
    const { from, to, date, passengers, trainName, classCode } = req;
    const searchUrl = `${RAILWAY_URL}/booking/train-search?from_station=${encodeURIComponent(from)}&to_station=${encodeURIComponent(to)}&journey_date=${encodeURIComponent(date)}&select_class=${encodeURIComponent(classCode || 'S_CHAIR')}`;
    
    chrome.tabs.query({ url: '*://eticket.railway.gov.bd/*' }, (tabs) => {
      if (tabs && tabs.length > 0) {
        const targetTab = tabs[0];
        chrome.tabs.update(targetTab.id, { active: true });
        chrome.tabs.sendMessage(targetTab.id, { action: 'INSTANT_GRAB_COMMAND', ...req }, () => {
          sendResponse({ success: true, tabId: targetTab.id, tabExisted: true });
        });
      } else {
        chrome.tabs.create({ url: searchUrl, active: true }, (newTab) => {
          sendResponse({ success: true, tabId: newTab.id, tabExisted: false });
        });
      }
    });
    return true;
  }

  // SCHEDULE BOOKING: Advance bookings (10+ days or 08:00 AM release)
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

  // CANCEL SCHEDULE
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

  // GET ALL SCHEDULES
  if (req.action === 'GET_SCHEDULES') {
    chrome.storage.local.get(['scheduledBookings'], (data) => {
      const bookings = data.scheduledBookings || [];
      syncExtensionBadge(bookings.length);
      sendResponse({ schedules: bookings, count: bookings.length });
    });
    return true;
  }

  // SYNC BADGE
  if (req.action === 'SYNC_BADGE') {
    syncExtensionBadge(req.count || 0);
    sendResponse({ success: true });
  }

  // ANTI-LOGOUT SESSION GUARD
  if (req.action === 'START_SESSION_GUARD') {
    chrome.alarms.create('geticket_session_keepalive', { periodInMinutes: 4 });
    sendResponse({ success: true });
  }

  // SEAT LOCKED POPUP NOTIFICATION & VIBRATION (FOR PC & MOBILE)
  if (req.action === 'SEAT_LOCKED_NOTIFY') {
    chrome.storage.local.get(['gt_lang'], (data) => {
      const isBn = data.gt_lang === 'bn';
      if (chrome.notifications) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon128.png',
          title: isBn ? '🎉 সিট ৫ মিনিটের জন্য লক হয়েছে!' : '🎉 Seats Locked for 5 Minutes!',
          message: isBn 
            ? 'বিকাশ পেমেন্ট গেটওয়ে সক্রিয় করা হয়েছে। দ্রুত পেমেন্ট সম্পন্ন করুন।' 
            : 'bKash payment gateway active. Complete payment before timeout!',
          priority: 2
        });
      }
    });
    sendResponse({ success: true });
  }
});
