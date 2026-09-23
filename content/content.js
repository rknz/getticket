/**
 * GeTicket Pro - Content Automation Engine (v2.8)
 * 100% Real-Time Live Railway Integration for https://eticket.railway.gov.bd
 * - Real-Time Auth Bridge & Universal Token Harvester
 * - Universal Multi-Train Traversal & Contiguous Seat Solver
 * - Live DOM Seat Availability Scraper & Fallback Engine
 * - 5-Minute Seat Hold Countdown & bKash Assister (Strictly Payment Pages)
 * - Continuous Sold-Out Watchdog with 8-12s Natural Retry Loop
 */

(function () {
  'use strict';

  if (window.__GETICKET_LOADED__) return;
  window.__GETICKET_LOADED__ = true;

  // 1. Comprehensive Master Stations Database
  const STATIONS = {
    en: [
      { value: "Dhaka", text: "Dhaka" },
      { value: "Chattogram", text: "Chattogram" },
      { value: "Jamalpur", text: "Jamalpur" },
      { value: "Mymensingh", text: "Mymensingh" },
      { value: "Cox's Bazar", text: "Cox's Bazar" },
      { value: "Sylhet", text: "Sylhet" },
      { value: "Sreemangal", text: "Sreemangal" },
      { value: "Rajshahi", text: "Rajshahi" },
      { value: "Khulna", text: "Khulna" },
      { value: "Rangpur", text: "Rangpur" },
      { value: "Dinajpur", text: "Dinajpur" },
      { value: "Panchagarh", text: "Panchagarh" },
      { value: "Benapole", text: "Benapole" },
      { value: "Ishwardi", text: "Ishwardi" },
      { value: "Bogra", text: "Bogra" },
      { value: "Cumilla", text: "Cumilla" },
      { value: "Feni", text: "Feni" }
    ],
    bn: [
      { value: "Dhaka", text: "ঢাকা" },
      { value: "Chattogram", text: "চট্টগ্রাম" },
      { value: "Jamalpur", text: "জামালপুর" },
      { value: "Mymensingh", text: "ময়মনসিংহ" },
      { value: "Cox's Bazar", text: "কক্সবাজার" },
      { value: "Sylhet", text: "সিলেট" },
      { value: "Sreemangal", text: "শ্রীমঙ্গল" },
      { value: "Rajshahi", text: "রাজশাহী" },
      { value: "Khulna", text: "খুলনা" },
      { value: "Rangpur", text: "রংপুর" },
      { value: "Dinajpur", text: "দিনাজপুর" },
      { value: "Panchagarh", text: "পঞ্চগড়" },
      { value: "Benapole", text: "বেনাপোল" },
      { value: "Ishwardi", text: "ঈশ্বরদী" },
      { value: "Bogra", text: "বগুড়া" },
      { value: "Cumilla", text: "কুমিল্লা" },
      { value: "Feni", text: "ফেনী" }
    ]
  };

  const PASSENGERS_OPTS = {
    en: [
      { value: "1", text: "1 Person" },
      { value: "2", text: "2 Persons (Adjacent Pairs)" },
      { value: "3", text: "3 Persons" },
      { value: "4", text: "4 Persons (Cabin / Row)" }
    ],
    bn: [
      { value: "1", text: "১ জন" },
      { value: "2", text: "২ জন (পাশাপাশি জোড়া)" },
      { value: "3", text: "৩ জন" },
      { value: "4", text: "৪ জন (কেবিন / সারি)" }
    ]
  };

  const CLASSES_OPTS = {
    en: [
      { value: "ANY", text: "✨ Any Available Class" },
      { value: "S_CHAIR", text: "Shovon Chair" },
      { value: "SNIGDHA", text: "Snigdha AC" },
      { value: "F_CHAIR", text: "1st Class Chair" },
      { value: "AC_S", text: "AC Seat" },
      { value: "AC_B", text: "AC Berth" },
      { value: "SHOVON", text: "Shovon" }
    ],
    bn: [
      { value: "ANY", text: "✨ যেকোনো উপলব্ধ শ্রেণি" },
      { value: "S_CHAIR", text: "শোভন চেয়ার" },
      { value: "SNIGDHA", text: "স্নিগ্ধা এসি" },
      { value: "F_CHAIR", text: "১ম শ্রেণি চেয়ার" },
      { value: "AC_S", text: "এসি সিট" },
      { value: "AC_B", text: "এসি বার্থ" },
      { value: "SHOVON", text: "সাধারণ শোভন" }
    ]
  };

  const DIRECTIONS_OPTS = {
    en: [
      { value: "straight", text: "Forward Facing" },
      { value: "middle", text: "Middle Comfortable Seats" },
      { value: "any", text: "Any Available Seat" }
    ],
    bn: [
      { value: "straight", text: "ট্রেনের গতির মুখে সোজা সিট" },
      { value: "middle", text: "মাঝামাঝি আরামদায়ক সিট" },
      { value: "any", text: "যেকোনো খালি সিট" }
    ]
  };

  const ROUTE_TRAIN_MAP = {
    "Dhaka-Chattogram": [
      { nameEn: "Tourist Express", nameBn: "পর্যটক এক্সপ্রেস", code: "815", dep: "06:15 AM", arr: "11:50 AM" },
      { nameEn: "Sonar Bangla Express", nameBn: "সোনার বাংলা এক্সপ্রেস", code: "787", dep: "07:00 AM", arr: "12:15 PM" },
      { nameEn: "Mahanagar Provati", nameBn: "মহানগর প্রভাতী", code: "704", dep: "07:45 AM", arr: "02:00 PM" },
      { nameEn: "Chattala Express", nameBn: "চট্টলা এক্সপ্রেস", code: "802", dep: "01:45 PM", arr: "08:30 PM" },
      { nameEn: "Suborno Express", nameBn: "সুবর্ণ এক্সপ্রেস", code: "701", dep: "04:30 PM", arr: "09:50 PM" },
      { nameEn: "Mahanagar Express", nameBn: "মহানগর এক্সপ্রেস", code: "722", dep: "09:20 PM", arr: "03:50 AM" },
      { nameEn: "Cox's Bazar Express", nameBn: "কক্সবাজার এক্সপ্রেস", code: "813", dep: "10:30 PM", arr: "04:30 AM" },
      { nameEn: "Turna Express", nameBn: "তূর্ণা এক্সপ্রেস", code: "742", dep: "11:30 PM", arr: "06:00 AM" }
    ],
    "Chattogram-Dhaka": [
      { nameEn: "Suborno Express", nameBn: "সুবর্ণ এক্সপ্রেস", code: "702", dep: "07:00 AM", arr: "12:20 PM" },
      { nameEn: "Chattala Express", nameBn: "চট্টলা এক্সপ্রেস", code: "801", dep: "08:30 AM", arr: "03:30 PM" },
      { nameEn: "Mahanagar Express", nameBn: "মহানগর এক্সপ্রেস", code: "721", dep: "12:30 PM", arr: "07:10 PM" },
      { nameEn: "Mahanagar Godhuli", nameBn: "মহানগর গোধূলী", code: "703", dep: "03:00 PM", arr: "09:10 PM" },
      { nameEn: "Cox's Bazar Express", nameBn: "কক্সবাজার এক্সপ্রেস", code: "814", dep: "04:00 PM", arr: "09:30 PM" },
      { nameEn: "Sonar Bangla Express", nameBn: "সোনার বাংলা এক্সপ্রেস", code: "788", dep: "05:00 PM", arr: "10:10 PM" },
      { nameEn: "Turna Express", nameBn: "তূর্ণা এক্সপ্রেস", code: "741", dep: "11:00 PM", arr: "05:15 AM" },
      { nameEn: "Tourist Express", nameBn: "পর্যটক এক্সপ্রেস", code: "816", dep: "11:30 PM", arr: "05:00 AM" }
    ],
    "Dhaka-Rajshahi": [
      { nameEn: "Dhumketu Express", nameBn: "ধূমকেতু এক্সপ্রেস", code: "769", dep: "06:00 AM", arr: "11:40 AM" },
      { nameEn: "Bonolota Express", nameBn: "বনলতা এক্সপ্রেস", code: "791", dep: "01:30 PM", arr: "06:00 PM" },
      { nameEn: "Silkcity Express", nameBn: "সিল্কসিটি এক্সপ্রেস", code: "753", dep: "02:30 PM", arr: "08:20 PM" },
      { nameEn: "Madhumati Express", nameBn: "মধুমতী এক্সপ্রেস", code: "755", dep: "03:00 PM", arr: "08:00 PM" },
      { nameEn: "Padma Express", nameBn: "পদ্মা এক্সপ্রেস", code: "759", dep: "11:00 PM", arr: "04:40 AM" }
    ],
    "Rajshahi-Dhaka": [
      { nameEn: "Madhumati Express", nameBn: "মধুমতী এক্সপ্রেস", code: "756", dep: "06:40 AM", arr: "11:40 AM" },
      { nameEn: "Bonolota Express", nameBn: "বনলতা এক্সপ্রেস", code: "792", dep: "07:00 AM", arr: "11:30 AM" },
      { nameEn: "Silkcity Express", nameBn: "সিল্কসিটি এক্সপ্রেস", code: "754", dep: "07:40 AM", arr: "01:30 PM" },
      { nameEn: "Padma Express", nameBn: "পদ্মা এক্সপ্রেস", code: "760", dep: "04:00 PM", arr: "09:40 PM" },
      { nameEn: "Dhumketu Express", nameBn: "ধূমকেতু এক্সপ্রেস", code: "770", dep: "11:20 PM", arr: "04:50 AM" }
    ],
    "Dhaka-Jamalpur": [
      { nameEn: "Dewanganj Commuter", nameBn: "দেওয়ানগঞ্জ কমিউটার", code: "47", dep: "05:40 AM", arr: "11:15 AM" },
      { nameEn: "Teesta Express", nameBn: "তিস্তা এক্সপ্রেস", code: "707", dep: "07:30 AM", arr: "11:50 AM" },
      { nameEn: "Agnibeena Express", nameBn: "অগ্নিবীণা এক্সপ্রেস", code: "735", dep: "11:30 AM", arr: "03:45 PM" },
      { nameEn: "Jamuna Express", nameBn: "যমুনা এক্সপ্রেস", code: "745", dep: "04:45 PM", arr: "09:40 PM" },
      { nameEn: "Brahmaputra Express", nameBn: "ব্রহ্মপুত্র এক্সপ্রেস", code: "743", dep: "06:15 PM", arr: "11:20 PM" }
    ],
    "Jamalpur-Dhaka": [
      { nameEn: "Jamuna Express", nameBn: "যমুনা এক্সপ্রেস", code: "746", dep: "02:30 AM", arr: "07:40 AM" },
      { nameEn: "Brahmaputra Express", nameBn: "ব্রহ্মপুত্র এক্সপ্রেস", code: "744", dep: "06:40 AM", arr: "11:50 AM" },
      { nameEn: "Dewanganj Commuter", nameBn: "দেওয়ানগঞ্জ কমিউটার", code: "48", dep: "03:15 PM", arr: "08:45 PM" },
      { nameEn: "Teesta Express", nameBn: "তিস্তা এক্সপ্রেস", code: "708", dep: "03:30 PM", arr: "08:10 PM" },
      { nameEn: "Agnibeena Express", nameBn: "অগ্নিবীণা এক্সপ্রেস", code: "736", dep: "05:45 PM", arr: "10:30 PM" }
    ]
  };

  const FARE_RATES = {
    "Dhaka-Chattogram": { "S_CHAIR": 405, "SNIGDHA": 777, "F_CHAIR": 540, "AC_S": 932, "AC_B": 1398, "SHOVON": 340 },
    "Chattogram-Dhaka": { "S_CHAIR": 405, "SNIGDHA": 777, "F_CHAIR": 540, "AC_S": 932, "AC_B": 1398, "SHOVON": 340 },
    "Dhaka-Rajshahi": { "S_CHAIR": 375, "SNIGDHA": 719, "F_CHAIR": 500, "AC_S": 863, "AC_B": 1294, "SHOVON": 315 },
    "Rajshahi-Dhaka": { "S_CHAIR": 375, "SNIGDHA": 719, "F_CHAIR": 500, "AC_S": 863, "AC_B": 1294, "SHOVON": 315 },
    "Dhaka-Jamalpur": { "S_CHAIR": 205, "SNIGDHA": 391, "F_CHAIR": 270, "AC_S": 466, "AC_B": 699, "SHOVON": 170 },
    "Jamalpur-Dhaka": { "S_CHAIR": 205, "SNIGDHA": 391, "F_CHAIR": 270, "AC_S": 466, "AC_B": 699, "SHOVON": 170 }
  };

  const UI_TEXT = {
    en: {
      hdrTitle: "GeTicket Pro",
      tabSetup: "🎯 Setup",
      tabSchedules: "📅 Lists",
      tabVault: "💳 Vault",
      lblFrom: "From Station",
      lblTo: "To Station",
      lblDate: "Journey Date",
      lblPax: "Passengers",
      lblTrain: "Train Name",
      lblClass: "Coach Class",
      lblPrioTitle: "🎯 Cascading Priority Chain",
      lblPrioHint: "Auto-Shift 1ms",
      btnArm: "⏰ Arm Advance Schedule & Watchdog",
      btnGrab: "⚡ Instant Fast-Grab (Lock)",
      btnScan: "🔍 Scan Live Availability",
      lblSchedTitle: "Scheduled Bookings",
      lblNoSched: "No active schedules",
      lblNoSchedSub: "Set your route and click 'Arm Advance Schedule' on Setup tab.",
      lblVaultTitle: "Account Vault",
      lblVaultHint: "Encrypted",
      lblVaultPhone: "Railway Mobile",
      lblVaultPass: "Password",
      btnSaveVaultText: "Save to Vault",
      btnDirectLoginText: "Login Now",
      toastVaultSaved: "🔒 Railway Account Saved in Vault!",
      toastSchedSaved: "✓ Schedule Armed & Added to List!",
      liveAvail: "seats left",
      liveSold: "Sold Out",
      liveBookBtn: "⚡ Book Now",
      liveChkFailed: "Live check failed (Please login to Railway)",
      lblLiveEmpty: "No trains found for this route.",
      scanningLive: "Scanning live availability..."
    },
    bn: {
      hdrTitle: "জি-টিকিট প্রো",
      tabSetup: "🎯 সেটআপ",
      tabSchedules: "📅 শিডিউল",
      tabVault: "🔐 ভল্ট",
      lblFrom: "যাত্রার স্টেশন",
      lblTo: "গন্তব্য স্টেশন",
      lblDate: "যাত্রার তারিখ",
      lblPax: "যাত্রী সংখ্যা",
      lblTrain: "ট্রেনের নাম",
      lblClass: "বসার শ্রেণি",
      lblPrioTitle: "🎯 প্রায়োরিটি চেইন (স্বয়ংক্রিয়)",
      lblPrioHint: "১ম না পেলে ২য়",
      btnArm: "⏰ অগ্রিম টিকিট শিডিউল ও অ্যালার্ম",
      btnGrab: "⚡ ইনস্ট্যান্ট ফাস্ট-গ্র্যাব (লক)",
      btnScan: "🔍 লাইভ সিট স্ক্যান করুন",
      lblSchedTitle: "নির্ধারিত শিডিউল তালিকা",
      lblNoSched: "কোনো সক্রিয় শিডিউল নেই",
      lblNoSchedSub: "সেটআপ ট্যাব থেকে শিডিউল যুক্ত করলে সকাল ০৭:৫০ এ অ্যালার্ম ও অটো-বুকিং বাজবে।",
      lblVaultTitle: "সুরক্ষিত ভল্ট",
      lblVaultHint: "এনক্রিপ্টেড",
      lblVaultPhone: "রেলওয়ে মোবাইল নম্বর",
      lblVaultPass: "পাসওয়ার্ড",
      btnSaveVaultText: "ভল্টে সেভ করুন",
      btnDirectLoginText: "এখনই লগইন করুন",
      toastVaultSaved: "🔒 অ্যাকাউন্ট লোকাল ভল্টে সংরক্ষিত!",
      toastSchedSaved: "✓ শিডিউল ও অ্যালার্ম যুক্ত হয়েছে!",
      liveAvail: "টি আসন খালি",
      liveSold: "বুকড (০ টি)",
      liveBookBtn: "⚡ এখনই বুক করুন",
      liveChkFailed: "লাইভ চেক ব্যর্থ (অনুগ্রহ করে প্রথমে লগইন করুন)",
      lblLiveEmpty: "এই রুটে কোনো ট্রেনের তথ্য পাওয়া যায়নি।",
      scanningLive: "লাইভ সিট স্ক্যান হচ্ছে..."
    }
  };

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
    prefClass: 'ANY',
    priorities: [
      { level: 1, classCode: 'S_CHAIR', dir: 'any', coach: 'ANY' },
      { level: 2, classCode: 'F_CHAIR', dir: 'any', coach: 'ANY' },
      { level: 3, classCode: 'SNIGDHA', dir: 'any', coach: 'ANY' }
    ],
    humanJitterMin: 75,
    humanJitterMax: 135
  };

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

  // Helper: Convert railway date (DD-MMM-YYYY) to standard HTML date input format (YYYY-MM-DD)
  function parseRailwayDateToInputFormat(dateStr) {
    if (!dateStr) return '';
    const monthsMap = { jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06', jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12' };
    const parts = String(dateStr).split('-');
    if (parts.length === 3) {
      if (parts[0].length === 4) return dateStr; // already YYYY-MM-DD
      const day = parts[0].padStart(2, '0');
      const m = monthsMap[parts[1].toLowerCase()];
      const year = parts[2];
      if (m) return `${year}-${m}-${day}`;
    }
    return dateStr;
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

  // 2. Real-Time Storage & Auth State Harvester (100% CSP Compliant, 0 Inline Injections)
  window.addEventListener('storage', () => {
    harvestRailwaySession();
  });


  // Universal Real-Time Storage & Auth State Harvester
  function harvestRailwaySession() {
    try {
      let token = null;
      let userObj = null;
      let userName = '';
      let userMobile = '';
      let deviceId = localStorage.getItem('uudi') || localStorage.getItem('x-device-id') || '';
      let deviceKey = localStorage.getItem('udk') || localStorage.getItem('x-device-key') || '';

      const jwtRegex = /eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]*/;

      // A. Scan localStorage thoroughly
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        const val = localStorage.getItem(k);
        if (!val) continue;

        if (k === 'token' || k === 'auth_token' || k === 'access_token' || k === 'id_token' || k === 'jwt') {
          token = val;
        }

        if (!token) {
          const match = val.match(jwtRegex);
          if (match) token = match[0];
        }

        if (k === 'user' || k === 'currentUser' || k === 'profile' || k === 'userData' || k.includes('user')) {
          try {
            const parsed = JSON.parse(val);
            userObj = parsed;
            if (parsed.token) token = parsed.token;
            if (parsed.access_token) token = parsed.access_token;
            if (parsed.data && parsed.data.token) token = parsed.data.token;
            if (parsed.name || parsed.display_name || parsed.fullName) userName = parsed.name || parsed.display_name || parsed.fullName;
            if (parsed.mobile_number || parsed.phone || parsed.mobile) userMobile = parsed.mobile_number || parsed.phone || parsed.mobile;
          } catch (e) { }
        }
      }

      // B. Scan sessionStorage
      try {
        for (let i = 0; i < sessionStorage.length; i++) {
          const k = sessionStorage.key(i);
          const val = sessionStorage.getItem(k);
          if (!val) continue;
          if (k === 'token' || k === 'auth_token' || (val.startsWith('eyJ') && val.length > 40)) {
            if (!token) token = val;
          }
          if (!token) {
            const match = val.match(jwtRegex);
            if (match) token = match[0];
          }
        }
      } catch (e) { }

      // C. Check DOM Header for Logged-In User Name
      if (!userName) {
        const nameEl = document.querySelector('app-header .user-name, header .user-name, .user-profile-name, [class*="username"], [class*="profile"]');
        if (nameEl) {
          const t = nameEl.innerText.trim();
          if (t && !t.includes('Login') && !t.includes('লগইন') && !t.includes('Register')) {
            userName = t;
          }
        }
      }

      // If either token or logged in user name is detected, store session
      if (chrome?.storage?.local) {
        chrome.storage.local.get(['railwaySession'], (data) => {
          const prev = data?.railwaySession || {};
          const finalToken = token || prev.token || '';
          const finalUser = userObj || prev.user || (userName ? { name: userName } : null);
          const finalName = userName || prev.userName || userObj?.name || '';
          const finalMobile = userMobile || prev.userMobile || userObj?.mobile_number || '';
          const finalDeviceId = deviceId || prev.deviceId || 'gt_' + Math.random().toString(36).substring(2);
          const finalDeviceKey = deviceKey || prev.deviceKey || '';

          if ((finalToken && finalToken !== prev.token) || (finalName && finalName !== prev.userName) || !prev.updatedAt) {
            chrome.storage.local.set({
              railwaySession: {
                token: finalToken,
                user: finalUser,
                userName: finalName,
                userMobile: finalMobile,
                deviceId: finalDeviceId,
                deviceKey: finalDeviceKey,
                updatedAt: Date.now()
              }
            }, () => {
              updateAuthStatusStrip();
            });
          }
        });
      }
    } catch (e) { }
  }

  harvestRailwaySession();
  setInterval(harvestRailwaySession, 2500);

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

  // 3. 1-Click Vault Auto-Login Handler
  function checkAndHandleAutoLogin() {
    if (!chrome?.storage?.local) return;
    chrome.storage.local.get(['autoLoginTask', 'railwayVault'], (res) => {
      const task = res.autoLoginTask;
      const vault = res.railwayVault;
      const creds = task || vault;

      if (!creds || !creds.phone || !creds.pass) return;

      const path = window.location.pathname.toLowerCase();
      const isLoginPage = path.includes('/login') || path.includes('/auth/login') || path.includes('/sign-in') || Boolean(document.querySelector('app-login-modal'));

      if (!isLoginPage) return;

      const phoneInput = document.querySelector('input[formcontrolname="mobile_number"], input[name="mobile_number"], input[type="tel"], input[placeholder*="mobile" i], input[placeholder*="01" i]');
      const passInput = document.querySelector('input[formcontrolname="password"], input[name="password"], input[type="password"]');
      const submitBtn = document.querySelector('button[type="submit"], button.btn-login, button.login-btn, [class*="login-btn"]');

      if (phoneInput && passInput && submitBtn) {
        showHudToast(currentLang === 'bn' ? '🔑 ভল্ট থেকে স্বয়ংক্রিয় লগইন হচ্ছে...' : '🔑 Auto-logging in via Vault...');
        setAngularInput(phoneInput, creds.phone);
        setTimeout(() => {
          setAngularInput(passInput, creds.pass);
          setTimeout(() => {
            safeHumanClick(submitBtn, () => {
              chrome.storage.local.remove('autoLoginTask');
              showHudToast(currentLang === 'bn' ? '✅ লগইন সফল! সেশন সিঙ্ক হচ্ছে...' : '✅ Logged in! Syncing session...');
            });
          }, 300);
        }, 200);
      }
    });
  }

  // 4. Reliable Seat Count & Availability Extractor
  function extractSeatCount(elOrText) {
    const text = typeof elOrText === 'string' ? elOrText : (elOrText?.innerText || '');
    const clean = text.replace(/৳\s*[\d,]+/g, '').replace(/\bTK\.?\s*[\d,]+/gi, '');

    // 1. Direct match for "Available Tickets (Counter + Online) <NUM>" or "Available <NUM>"
    const mAvail = clean.match(/(?:Available\s*Tickets|Available|আসন|Seats?|Tickets?)[^\d]*(\d+)/i);
    if (mAvail) {
      return parseInt(mAvail[1], 10);
    }

    // 2. Explicit zero checks if no standard available pattern matched
    if (/০\s*(টি|আসন)/.test(clean) ||
      /\b0\s*seat/i.test(clean) ||
      /\b0\s*ticket/i.test(clean) ||
      clean.includes('0 SEATS') || clean.includes('0 TICKETS') || clean.includes('০ টি') || clean.includes('0 AVAILABLE') || clean.includes('SOLD OUT')) {
      return 0;
    }

    const m2 = clean.match(/(\d+)\s*(?:SEATS?|TICKETS?|টি|আসন)/i);
    if (m2) return parseInt(m2[1], 10);

    const m3 = clean.match(/\b([1-9]\d{0,2})\b/);
    if (m3) return parseInt(m3[1], 10);

    return 0;
  }

  // 5. Direction & Contiguous Seat Finder
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

  // 6. Universal Multi-Train Traversal & Availability Matcher
  // Helper to isolate individual seat class containers on Bangladesh Railway Angular DOM
  function findClassBoxes(card) {
    const knownClasses = ['S_CHAIR', 'SNIGDHA', 'AC_S', 'AC_B', 'F_CHAIR', 'SHOVON', 'F_SEAT', 'F_BERTH', 'AC_CHAIR', 'S_BERTH'];

    // 1. Primary: standard railway class container selectors (.single-seat-class, .seat-info-row, etc.)
    const primaryBoxes = Array.from(card.querySelectorAll('.single-seat-class, .seat-info-row, [class*="seat-item"], [class*="seat-class"], [class*="trip-seat"]'));
    if (primaryBoxes.length > 0) {
      const valid = primaryBoxes.filter(b => {
        const t = b.innerText.toUpperCase();
        const matched = knownClasses.filter(c => t.includes(c));
        return matched.length === 1;
      });
      if (valid.length > 0) return valid;
    }

    // 2. Fallback: Search all candidate containers
    const candidates = Array.from(card.querySelectorAll('div, section, article'));
    const result = [];
    candidates.forEach(el => {
      const t = el.innerText.toUpperCase();
      const matched = knownClasses.filter(c => t.includes(c));
      if (matched.length !== 1) return;

      const hasData = t.includes('AVAILABLE') || t.includes('TICKETS') || t.includes('৳') || t.includes('TK') || t.includes('VAT') || t.includes('BOOK NOW') || t.includes('আসন');
      if (!hasData) return;

      const pText = el.parentElement?.innerText?.toUpperCase() || '';
      const pMatched = knownClasses.filter(c => pText.includes(c));
      if (pMatched.length === 1 && (pText.includes('AVAILABLE') || pText.includes('৳') || pText.includes('TICKETS') || pText.includes('VAT'))) {
        return; // Parent is the complete card
      }
      result.push(el);
    });

    return result;
  }

  // Uses real DOM selectors from the Bangladesh Railway Angular app:
  //   Train cards:  app-single-trip > .single-trip-wrapper
  //   Seat classes: .single-seat-class > .seat-class-name + .seat-availability-box
  //   Book button:  button.book-now-btn (inside .book-now-btn-wrapper)
  function findAvailableTrainClassButton(targetTrain, targetClass, paxCount = 1) {
    // Primary: Angular component selector; Fallback: wrapper class
    let trainCards = Array.from(document.querySelectorAll('app-single-trip'));
    if (trainCards.length === 0) {
      trainCards = Array.from(document.querySelectorAll('.single-trip-wrapper, .trip-row, [class*="train-card"]'));
    }
    if (trainCards.length === 0) {
      trainCards = Array.from(document.querySelectorAll('.all-trip-boxes > div, .trip-item')).filter(Boolean);
    }
    if (trainCards.length === 0) return null;

    for (const card of trainCards) {
      const cardText = card.innerText.toUpperCase();
      const trainNameEl = card.querySelector('.trip-name, .trip-left-info, h1, h2, h3, h4, strong, b');
      const trainName = trainNameEl?.innerText?.trim() || '';

      // If targetTrain is specific and NOT ANY_TRAIN, filter by name
      if (targetTrain && targetTrain !== 'ANY_TRAIN') {
        const cleanTrain = targetTrain.toUpperCase().replace(/\s*\(.*?\)\s*/g, '').trim();
        if (!cardText.includes(cleanTrain)) continue;
      }

      // Find class boxes accurately
      const classBoxes = findClassBoxes(card);

      for (const box of classBoxes) {
        const boxText = box.innerText.toUpperCase();

        // Strict class matching
        const isClassMatch = (targetClass === 'ANY') ||
          boxText.includes(targetClass) ||
          (targetClass === 'S_CHAIR' && (boxText.includes('SHOVON CHAIR') || boxText.includes('শোভন চেয়ার'))) ||
          (targetClass === 'SNIGDHA' && (boxText.includes('SNIGDHA') || boxText.includes('স্নিগ্ধা'))) ||
          (targetClass === 'AC_S' && (boxText.includes('AC_S') || boxText.includes('AC SEAT') || boxText.includes('এসি সিট'))) ||
          (targetClass === 'AC_B' && (boxText.includes('AC_B') || boxText.includes('AC BERTH') || boxText.includes('এসি বার্থ'))) ||
          (targetClass === 'F_CHAIR' && (boxText.includes('F_CHAIR') || boxText.includes('FIRST') || boxText.includes('১ম'))) ||
          (targetClass === 'SHOVON' && (boxText.includes('SHOVON') && !boxText.includes('SHOVON CHAIR') && !boxText.includes('শোভন চেয়ার')));
        if (!isClassMatch) continue;

        const seatCount = extractSeatCount(box);

        if (seatCount > 0) {
          // Find the BOOK NOW button strictly inside or next to this specific class box
          const bookBtn =
            box.querySelector('button:not([disabled]), .book-now-btn:not([disabled]), a[role="button"]') ||
            box.parentElement?.querySelector('.book-now-btn:not([disabled])') ||
            card.querySelector('.book-now-btn:not([disabled])') ||
            card.querySelector('button[type="button"]:not([disabled])');

          if (!bookBtn) continue;

          // Before returning, click the seat class box to select it
          safeHumanClick(box);

          return {
            card,
            box,
            bookBtn,
            trainName: trainName || targetTrain,
            classCode: targetClass,
            seatCount
          };
        }
      }
    }

    return null;
  }

  // 7. Automated Fast-Grab Execution Engine
  function executeCascadingGrab() {
    if (isExecutingGrab || !isEngineRunning) return;
    isExecutingGrab = true;

    const priorities = config.priorities || [];
    let currentRuleIdx = 0;

    const root = document.getElementById('geticket-hud-root');
    if (root) saveHudConfig(root);

    const fromVal = config.routeFrom || 'Dhaka';
    const toVal = config.routeTo || 'Rajshahi';
    const dateVal = config.targetDate || root?.querySelector('#gtJourneyDate')?.value || new Date().toISOString().split('T')[0];
    const targetFormatted = formatRailwayDate(dateVal);

    const currentUrl = window.location.href;
    const urlParams = new URLSearchParams(window.location.search);
    const pageDoj = urlParams.get('doj') || '';
    const pageFrom = urlParams.get('fromcity') || '';
    const pageTo = urlParams.get('tocity') || '';

    const isSearchPage = window.location.pathname.includes('/booking/train/search');
    const matchesUrlDate = isSearchPage && pageDoj && (pageDoj.toLowerCase() === targetFormatted.toLowerCase());
    const matchesUrlRoute = isSearchPage &&
      pageFrom.toLowerCase().includes(fromVal.toLowerCase()) &&
      pageTo.toLowerCase().includes(toVal.toLowerCase());
    const hasSearchResults = isSearchPage && document.querySelectorAll('app-single-trip, .single-trip-wrapper, .trip-row').length > 0;

    // Strict Guard: If current page does NOT match target date & route, navigate immediately to the exact date
    if (!matchesUrlDate || !matchesUrlRoute || !hasSearchResults) {
      isExecutingGrab = false;
      showHudToast(currentLang === 'bn' 
        ? `🔍 (${targetFormatted}) তারিখের ট্রেনের পেজ লোড করা হচ্ছে...` 
        : `🔍 Navigating to search page for (${targetFormatted})...`);

      const targetSearchUrl = `${RAILWAY_URL}/booking/train/search?fromcity=${encodeURIComponent(fromVal)}&tocity=${encodeURIComponent(toVal)}&doj=${encodeURIComponent(targetFormatted)}&class=${encodeURIComponent(config.priorities?.[0]?.classCode || 'S_CHAIR')}`;

      const grabTask = {
        from: fromVal,
        to: toVal,
        date: targetFormatted,
        passengers: config.passengers || 1,
        trainName: config.trainName || 'ANY_TRAIN',
        classCode: config.priorities?.[0]?.classCode || 'S_CHAIR',
        priorities: config.priorities || [],
        timestamp: Date.now()
      };

      if (chrome?.storage?.local) {
        chrome.storage.local.set({ activeGrabTask: grabTask }, () => {
          window.location.href = targetSearchUrl;
        });
      } else {
        window.location.href = targetSearchUrl;
      }
      return;
    }

    function tryNextRule() {
      if (currentRuleIdx >= priorities.length) {
        isExecutingGrab = false;
        const trainLabel = (config.trainName === 'ANY_TRAIN' || !config.trainName)
          ? (currentLang === 'bn' ? 'যেকোনো ট্রেন' : 'Any Available Train')
          : config.trainName;

        const watchId = `geticket_watch_${fromVal}_${toVal}_${targetFormatted}`;
        const watchBooking = {
          id: watchId,
          type: 'instant_watchdog',
          status: 'watching',
          from: fromVal,
          to: toVal,
          date: targetFormatted,
          passengers: config.passengers || 1,
          trainName: config.trainName || 'ANY_TRAIN',
          classCode: config.priorities?.[0]?.classCode || 'S_CHAIR',
          priorities: config.priorities || [],
          lastChecked: Date.now(),
          createdAt: new Date().toISOString()
        };

        // Add to active schedules / lists
        if (chrome?.storage?.local) {
          chrome.storage.local.get(['scheduledBookings'], (res) => {
            const list = cleanExpiredSchedules(res?.scheduledBookings || []);
            const updated = [watchBooking, ...list.filter(b => b.id !== watchId)];
            chrome.storage.local.set({ scheduledBookings: updated }, () => {
              if (root) renderActiveSchedules(root);
              if (chrome?.runtime?.sendMessage) {
                chrome.runtime.sendMessage({ action: 'SCHEDULE_BOOKING', id: watchId, bookingInfo: watchBooking }).catch(() => {});
              }
            });
          });
        }

        const noSeatMsg = currentLang === 'bn'
          ? `⏳ (${targetFormatted} • ${trainLabel}) এই মুহূর্তে সিট নেই। শিডিউল তালিকায় যুক্ত হয়েছে।` +
            `\n🔄 ওয়াচডগ সক্রিয়: প্রতি ১০-১৫ সেকেন্ড পরপর স্বয়ংক্রিয়ভাবে রিফ্রেশ করে ক্যানসেল বা নতুন রিলিজ সিট আসামাত্রই লক করবে!`
          : `⏳ (${targetFormatted} • ${trainLabel}) Sold out right now. Added to active lists.` +
            `\n🔄 Watchdog Active: Auto re-checking every 10-15s for cancelled/released seats to grab instantly!`;

        showHudToast(noSeatMsg);
        startContinuousWatchdog();
        return;
      }

      const rule = priorities[currentRuleIdx];
      const targetClass = (rule.classCode || 'S_CHAIR').toUpperCase();
      showHudToast(currentLang === 'bn' ? `প্রায়োরিটি ${rule.level} (${targetClass}) চেক হচ্ছে...` : `Checking Priority ${rule.level} (${targetClass})...`);

      const match = findAvailableTrainClassButton(config.trainName, targetClass, config.passengers);

      if (match && match.bookBtn) {
        showHudToast(currentLang === 'bn' ? `⚡ সিট পাওয়া গেছে (${match.trainName})! বুকিং হচ্ছে...` : `⚡ Seats found (${match.trainName})! Booking now...`);
        safeHumanClick(match.bookBtn, () => {
          waitForSeatLayoutAndSelect(config.passengers, rule.dir, (targetSeats) => {
            lockTargetSeats(targetSeats);
          }, () => {
            currentRuleIdx++;
            setTimeout(tryNextRule, 100);
          });
        });
      } else {
        currentRuleIdx++;
        setTimeout(tryNextRule, 80);
      }
    }

    tryNextRule();
  }

  function waitForSeatLayoutAndSelect(paxCount, prefDir, onDone, onFail) {
    let attempts = 0;
    let coachSwitchIdx = 0;
    const poll = setInterval(() => {
      attempts++;

      // Real railway site selectors:
      //   Seat buttons: button.btn-seat with ngClass states
      //   Available:    .seat-available (not .seat-booked, .seat-hidden, .seat-disabled, .seat-in-progress)
      //   Sleeper:      .sleeper-available
      const allSeatBtns = Array.from(document.querySelectorAll(
        'button.btn-seat.seat-available:not(.seat-booked):not(.seat-hidden):not(.seat-disabled):not(.seat-in-progress),' +
        '.sleeper-available:not(.sleeper-booked)'
      )).filter(el => {
        if (el.closest('#geticket-hud-root') || el.closest('#gtToastBanner')) return false;
        return !el.hasAttribute('disabled');
      });

      // Fallback: try older/generic selectors if the real ones found nothing
      let seatPool = allSeatBtns;
      if (seatPool.length === 0) {
        seatPool = Array.from(document.querySelectorAll(
          '.seat-btn, .seat, button[aria-label*="Seat"], .single-seat, [class*="seat-item"]'
        )).filter(el => {
          if (el.closest('#geticket-hud-root') || el.closest('#gtToastBanner')) return false;
          const cl = (el.className || '').toLowerCase();
          return !el.hasAttribute('disabled') && !cl.includes('booked') && !cl.includes('disabled') && !cl.includes('sold') && !cl.includes('hidden');
        });
      }

      if (seatPool.length >= paxCount) {
        clearInterval(poll);
        const targetSeats = findBestContiguousSeats(seatPool, paxCount, prefDir);
        if (targetSeats && targetSeats.length > 0) {
          onDone(targetSeats);
        } else {
          onDone(seatPool.slice(0, paxCount));
        }
        return;
      }

      // Coach switching: the real site uses a <select> dropdown (coachSelection ViewChild)
      // Try switching coach via dropdown if not enough seats on current coach
      if (attempts % 8 === 0) {
        const coachSelect = document.querySelector('select#coachSelection, .seat-layout-view select, select[formcontrolname*="coach"], select');
        if (coachSelect && coachSelect.closest('.seat-layout-view, .modal-content-not-use, app-seat-layout')) {
          const options = Array.from(coachSelect.querySelectorAll('option'));
          if (options.length > 1) {
            coachSwitchIdx = (coachSwitchIdx + 1) % options.length;
            coachSelect.value = options[coachSwitchIdx].value;
            coachSelect.dispatchEvent(new Event('change', { bubbles: true }));
          }
        } else {
          // Fallback: try clicking tab-style coach buttons if they exist
          const coachBtns = Array.from(document.querySelectorAll('.coach-tab, .coach-item, [class*="coach-btn"]'));
          if (coachBtns.length > 1) {
            const nextCoach = coachBtns[coachSwitchIdx % coachBtns.length];
            coachSwitchIdx++;
            if (nextCoach) safeHumanClick(nextCoach);
          }
        }
      }

      if (attempts > 60) { // 6 seconds timeout (increased for Angular route transitions)
        clearInterval(poll);
        onFail();
      }
    }, 100);
  }

  function lockTargetSeats(seats) {
    let idx = 0;
    function selectNext() {
      if (idx >= seats.length) {
        playAlertSound();
        showHudToast(currentLang === 'bn' ? `🎉 সিট সিলেক্ট হয়েছে! ৫ মিনিটের জন্য লক করা হচ্ছে...` : `🎉 Seats Selected! Locking for 5 minutes...`);
        if (chrome?.runtime?.sendMessage) {
          chrome.runtime.sendMessage({ action: 'SEAT_LOCKED_NOTIFY' }).catch(() => {});
        }
        isExecutingGrab = false;

        // Poll for Continue Purchase / Proceed button to become enabled
        // Real site: form#Div3 with button[type="submit"], text from i18n key 'pages.search_result.continue_purchase'
        let proceedAttempts = 0;
        const proceedPoll = setInterval(() => {
          proceedAttempts++;

          // Priority 1: The real Continue Purchase button inside #Div3 form
          // Priority 2: Generic submit buttons in the seat layout
          // Priority 3: Text-based fallback matching
          const proceedBtn =
            document.querySelector('#Div3 button[type="submit"]:not([disabled])') ||
            document.querySelector('.seat-layout-view button[type="submit"]:not([disabled])') ||
            document.querySelector('app-seat-layout button[type="submit"]:not([disabled])') ||
            document.querySelector('.btn-booking-continue:not([disabled]), [class*="confirm-btn"]:not([disabled])') ||
            Array.from(document.querySelectorAll('button:not([disabled])')).find(b => {
              if (b.closest('#geticket-hud-root') || b.closest('#gtToastBanner')) return false;
              const t = b.innerText.trim().toLowerCase();
              return t.includes('continue purchase') || t.includes('continue') || t.includes('confirm') ||
                     t.includes('proceed') || t.includes('কেনাকাটা চালিয়ে যান') || t.includes('চালিয়ে যান') || t.includes('নিশ্চিত');
            });

          if (proceedBtn && !proceedBtn.disabled && !proceedBtn.classList.contains('disabled')) {
            clearInterval(proceedPoll);
            proceedBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
            safeHumanClick(proceedBtn, () => {
              playAlertSound();
              if (chrome?.storage?.local) {
                chrome.storage.local.get(['scheduledBookings'], (res) => {
                  const list = res?.scheduledBookings || [];
                  const journeyDate = formatRailwayDate(config.targetDate);
                  const updated = list.filter(b => !(b.type === 'instant_watchdog' && b.from === config.routeFrom && b.to === config.routeTo && (!journeyDate || b.date === journeyDate)));
                  chrome.storage.local.set({ scheduledBookings: updated }, () => {
                    const root = document.getElementById('geticket-hud-root');
                    if (root) renderActiveSchedules(root);
                  });
                });
                chrome.storage.local.remove('activeGrabTask');
              }
              if (chrome?.runtime?.sendMessage) {
                chrome.runtime.sendMessage({ action: 'SEAT_LOCKED_NOTIFY' }).catch(() => {});
              }
              showHudToast(currentLang === 'bn' 
                ? '🎉 সিট ৫ মিনিটের জন্য সফলভাবে লক হয়েছে! পেমেন্ট সম্পন্ন করুন...' 
                : '🎉 Seats successfully locked for 5 minutes! Complete payment...');
            });
          }

          if (proceedAttempts > 50) { // 5 seconds timeout (increased for form validation)
            clearInterval(proceedPoll);
            if (proceedBtn) safeHumanClick(proceedBtn);
          }
        }, 100);

        return;
      }

      safeHumanClick(seats[idx], () => {
        idx++;
        selectNext();
      });
    }

    selectNext();
  }

  // 8. Continuous Sold-Out Watchdog with 9-13s Retry Loop
  function startContinuousWatchdog() {
    if (watchdogRetryTimer) clearTimeout(watchdogRetryTimer);

    const isSearchPage = window.location.pathname.includes('/booking/train/search');
    if (!isSearchPage || !isEngineRunning) return;

    // Refresh active grab task timestamp so it stays alive across refreshes
    const urlParams = new URLSearchParams(window.location.search);
    const pageDoj = urlParams.get('doj') || formatRailwayDate(config.targetDate);
    if (chrome?.storage?.local) {
      chrome.storage.local.set({
        activeGrabTask: {
          from: config.routeFrom,
          to: config.routeTo,
          date: pageDoj,
          passengers: config.passengers,
          trainName: config.trainName,
          classCode: config.priorities?.[0]?.classCode || 'S_CHAIR',
          priorities: config.priorities,
          timestamp: Date.now()
        }
      });
    }

    const delay = Math.floor(Math.random() * 4000) + 9000;
    watchdogRetryTimer = setTimeout(() => {
      if (!isEngineRunning) return;
      showHudToast(currentLang === 'bn' 
        ? '🔄 ওয়াচডগ: বাতিল বা নতুন রিলিজ হওয়া সিট রিফ্রেশ করা হচ্ছে...' 
        : '🔄 Watchdog: Re-checking for cancelled/released seats...');

      const modifySearchBtn = document.querySelector('app-modify-search button[type="submit"], .btn-search, button[class*="search"]');
      if (modifySearchBtn) {
        safeHumanClick(modifySearchBtn, () => {
          setTimeout(executeCascadingGrab, 1500);
        });
      } else {
        window.location.reload();
      }
    }, delay);
  }

  // 9. 5-Minute Seat Hold Countdown & bKash Auto-Assister (Strictly Payment Pages)
  let paymentAssisted = false;
  let seatLockToastShown = false;
  function initPaymentAutoAssister() {
    const path = window.location.pathname.toLowerCase();
    const isSearchOrSeatPage = path.includes('/booking/train/search') || path.includes('/booking/train/seat-layout');
    const isPaymentPage = !isSearchOrSeatPage && (
      path.includes('/booking/payment') ||
      path.includes('/booking/checkout') ||
      path.includes('/payment') ||
      path.includes('/checkout') ||
      path.includes('/purchase') ||
      Boolean(document.querySelector('.payment-options')) ||
      Boolean(document.querySelector('#bkash')) ||
      Boolean(document.querySelector('input[value*="bkash" i]'))
    );

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
        showHudToast(currentLang === 'bn'
          ? `🎉 সিট ৫ মিনিটের জন্য লক হয়েছে! (${timerStr}) বিকাশ পেমেন্ট করুন`
          : `🎉 Seat Locked for 5 Minutes! (${timerStr}) Complete bKash payment`);
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

  // 10. Live DOM Scraper for Search Results Page
  function scrapeLiveDOMTrains() {
    let tripElements = Array.from(document.querySelectorAll('app-single-trip'));
    if (tripElements.length === 0) {
      const allEls = Array.from(document.querySelectorAll('.single-trip-wrapper, .trip-row, [class*="train-card"], [class*="trip-card"]'));
      tripElements = allEls.filter(el => !allEls.some(parent => parent !== el && parent.contains(el)));
    }
    if (tripElements.length === 0) return [];

    const list = [];
    const knownClasses = ['S_CHAIR', 'SNIGDHA', 'AC_S', 'AC_B', 'F_CHAIR', 'SHOVON', 'F_SEAT', 'F_BERTH', 'AC_CHAIR', 'S_BERTH'];

    tripElements.forEach(card => {
      const txt = card.innerText;
      const nameMatch = txt.match(/([A-Z\s]+(?:EXPRESS|COMMUTER|MAIL|INTERCITY)[^\n\(]*)/i);
      const codeMatch = txt.match(/\((\d{3})\)/);
      const timeMatches = txt.match(/(\d{1,2}:\d{2}\s*(?:AM|PM))/gi);

      const trainName = nameMatch ? nameMatch[1].trim() : (card.querySelector('h1, h2, h3, h4, strong, .trip-name')?.innerText?.trim() || 'Intercity Train');
      const code = codeMatch ? codeMatch[1] : '';
      const dep = timeMatches?.[0] || '';
      const arr = timeMatches?.[1] || '';

      const seatTypes = [];

      // Find class boxes accurately within the card
      const classBoxes = findClassBoxes(card);

      classBoxes.forEach(box => {
        const bTxt = box.innerText.toUpperCase();
        let sClass = null;
        if (bTxt.includes('S_CHAIR') || bTxt.includes('SHOVON CHAIR') || bTxt.includes('শোভন')) sClass = 'S_CHAIR';
        else if (bTxt.includes('SNIGDHA') || bTxt.includes('স্নিগ্ধা')) sClass = 'SNIGDHA';
        else if (bTxt.includes('AC_S') || bTxt.includes('AC SEAT')) sClass = 'AC_S';
        else if (bTxt.includes('AC_B') || bTxt.includes('AC BERTH')) sClass = 'AC_B';
        else if (bTxt.includes('F_CHAIR') || bTxt.includes('FIRST')) sClass = 'F_CHAIR';
        else if (bTxt.includes('F_SEAT')) sClass = 'F_SEAT';
        else if (bTxt.includes('F_BERTH')) sClass = 'F_BERTH';
        else if (bTxt.includes('SHOVON')) sClass = 'SHOVON';

        if (sClass && !seatTypes.find(st => st.type === sClass)) {
          const count = extractSeatCount(box);
          const fareMatch = box.innerText.match(/৳\s*([\d,]+)/) || box.innerText.match(/TK\.?\s*([\d,]+)/i);
          const fare = fareMatch ? fareMatch[1].replace(/,/g, '') : '';
          seatTypes.push({ type: sClass, remaining_seat: count, fare });
        }
      });

      if (seatTypes.length > 0 || trainName) {
        list.push({
          train_name: trainName,
          train_model: code,
          departure_time: dep,
          arrival_time: arr,
          seat_types: seatTypes
        });
      }
    });

    // Deduplicate trains
    const seen = new Set();
    const uniqueList = [];
    list.forEach(t => {
      const key = `${(t.train_name || '').toLowerCase()}_${t.train_model || t.departure_time}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueList.push(t);
      }
    });

    return uniqueList;
  }

  // 11. Floating Confirmation Toast Banner
  function showHudToast(message) {
    if (!message) return;
    let toast = document.getElementById('gtToastBanner');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'gtToastBanner';
      document.body.appendChild(toast);
    }
    toast.innerHTML = `
      <span style="flex: 1;">${message}</span>
      <button class="gt-toast-close" id="gtToastClose" title="Close">&times;</button>
    `;
    toast.querySelector('#gtToastClose')?.addEventListener('click', (e) => {
      e.stopPropagation();
      toast.classList.remove('show');
    });
    toast.classList.add('show');
    setTimeout(() => { toast.classList.remove('show'); }, 6000);
  }

  // 12. Inject Complete On-Page Floating Control Center (Bubble & Modal Panel)
  function injectHud() {
    if (document.getElementById('geticket-hud-root')) return;

    const logoUrl = chrome?.runtime?.getURL ? chrome.runtime.getURL('icons/icon48.png') : '';
    const root = document.createElement('div');
    root.id = 'geticket-hud-root';
    document.documentElement.setAttribute('data-theme', currentTheme);

    root.innerHTML = `
      <!-- Floating Bubble (Desktop & Mobile Trigger) -->
      <div class="gt-bubble" id="gtBubble" title="Open GeTicket Pro Control Center">
        <img src="${logoUrl}" alt="GeTicket Pro Logo">
        <div class="gt-bubble-pulse"></div>
      </div>

      <!-- Expandable Modal Panel -->
      <div class="gt-panel" id="gtPanel">
        
        <!-- Header Section -->
        <div class="gt-header">
          <div class="gt-title-box">
            <img src="${logoUrl}" alt="Logo">
            <span class="gt-title-text" id="gtTitleText">GeTicket Pro</span>
            <span class="gt-version-pill">v2.9</span>
          </div>
          <div class="gt-header-tools">
            <button class="gt-ctrl-btn gt-power-btn active" id="gtPowerBtn" title="Engine Toggle">🟢 Active</button>
            <button class="gt-ctrl-btn" id="gtLangToggle">EN</button>
            <button class="gt-ctrl-btn" id="gtThemeToggle">☀️</button>
            <button class="gt-close-btn" id="gtCloseBtn" title="Close Panel">&times;</button>
          </div>
        </div>

        <!-- Real-Time Server Clock -->
        <div class="gt-clock-strip">
          <span class="gt-clock-label" id="gtClockLabel">RAILWAY SERVER TIME</span>
          <span class="gt-clock-val" id="gtCountdown">00:00:00.000</span>
        </div>

        <!-- Real-Time Auth Status Strip -->
        <div class="gt-auth-strip" id="gtAuthStrip">
          <div class="gt-auth-info">
            <span id="gtAuthDot">🟡</span>
            <span class="gt-auth-text" id="gtAuthText">Checking Railway session...</span>
          </div>
          <button type="button" class="gt-btn-auth" id="gtBtnAutoLogin">⚡ Auto Login</button>
        </div>

        <!-- 3 Clean Navigation Tabs -->
        <div class="gt-tabs-bar">
          <button class="gt-tab-nav active" data-tab="setup" id="gtTabNavSetup">🎯 Setup</button>
          <button class="gt-tab-nav" data-tab="schedules" id="gtTabNavSchedules">
            📅 Lists <span class="gt-nav-badge" id="gtSchedCountBadge">0</span>
          </button>
          <button class="gt-tab-nav" data-tab="vault" id="gtTabNavVault">💳 Vault</button>
        </div>

        <!-- Scrollable Modal Body -->
        <div class="gt-body">
          
          <!-- TAB 1: SETUP -->
          <div class="gt-pane active" id="gtPaneSetup">
            
            <!-- From & To Stations -->
            <div class="gt-field-row">
              <div class="gt-col">
                <label class="gt-label" id="gtLblFrom">From Station</label>
                <select class="gt-select" id="gtRouteFrom"></select>
              </div>
              <button type="button" class="gt-btn-swap" id="gtBtnSwap" title="Swap From ⇄ To">⇄</button>
              <div class="gt-col">
                <label class="gt-label" id="gtLblTo">To Station</label>
                <select class="gt-select" id="gtRouteTo"></select>
              </div>
            </div>

            <!-- Date & Passengers -->
            <div class="gt-field-row">
              <div class="gt-col">
                <label class="gt-label" id="gtLblDate">Journey Date</label>
                <input type="date" class="gt-input" id="gtJourneyDate">
              </div>
              <div class="gt-col">
                <label class="gt-label" id="gtLblPax">Passengers</label>
                <select class="gt-select" id="gtPassengerCount"></select>
              </div>
            </div>

            <!-- Train & Preferred Class -->
            <div class="gt-field-row">
              <div class="gt-col">
                <label class="gt-label" id="gtLblTrain">Train Name</label>
                <select class="gt-select" id="gtTrainName"></select>
              </div>
              <div class="gt-col">
                <label class="gt-label" id="gtLblClass">Coach Class</label>
                <select class="gt-select" id="gtPrefClass"></select>
              </div>
            </div>

            <!-- Cascading Priority Chain -->
            <div class="gt-priority-box">
              <div class="gt-priority-head">
                <span id="gtLblPrioTitle">🎯 Cascading Priority Chain</span>
                <span id="gtLblPrioHint">Auto-Shift 1ms</span>
              </div>
              <div class="gt-prio-row">
                <span class="gt-prio-tag">P1</span>
                <select class="gt-select" id="gtP1Class" style="flex: 1.3;"></select>
                <select class="gt-select" id="gtP1Dir" style="flex: 1;"></select>
              </div>
              <div class="gt-prio-row">
                <span class="gt-prio-tag" style="background: #f59e0b;">P2</span>
                <select class="gt-select" id="gtP2Class" style="flex: 1.3;"></select>
                <select class="gt-select" id="gtP2Dir" style="flex: 1;"></select>
              </div>
              <div class="gt-prio-row">
                <span class="gt-prio-tag" style="background: #64748b;">P3</span>
                <select class="gt-select" id="gtP3Class" style="flex: 1.3;"></select>
                <select class="gt-select" id="gtP3Dir" style="flex: 1;"></select>
              </div>
            </div>

            <!-- Primary Core Action Buttons -->
            <div class="gt-action-btns">
              <button type="button" class="gt-btn-primary gt-btn-grab" id="gtBtnGrabNow">
                ⚡ <span id="gtBtnGrabText">Instant Fast-Grab (Lock)</span>
              </button>
              <button type="button" class="gt-btn-primary gt-btn-arm" id="gtBtnArmSchedule">
                ⏰ <span id="gtBtnArmText">Arm Advance Schedule & Watchdog</span>
              </button>
            </div>

            <div class="gt-stealth-note" id="gtStealthNote">
              <span>🛡️ Stealth Anti-Ban Engine Active • 08:00 AM / 02:00 PM Sharp</span>
            </div>
          </div>

          <!-- TAB 2: SCHEDULES / LISTS -->
          <div class="gt-pane" id="gtPaneSchedules">
            <div class="gt-sched-list" id="gtSchedList">
              <div class="gt-empty-state" id="gtEmptySchedState">
                <div style="font-size: 24px; margin-bottom: 6px;">📅</div>
                <strong id="gtLblNoSched">No active schedules</strong>
                <p id="gtLblNoSchedSub" style="margin-top: 4px; font-size: 10.5px;">Set your route and click 'Arm Advance Schedule' on Setup tab.</p>
              </div>
            </div>
          </div>

          <!-- TAB 3: VAULT -->
          <div class="gt-pane" id="gtPaneVault">
            <div class="gt-vault-box">
              <label class="gt-label" id="gtLblVaultPhone">Railway Mobile</label>
              <input type="tel" class="gt-input" id="gtVaultPhone" placeholder="01XXXXXXXXX">
              
              <label class="gt-label" id="gtLblVaultPass" style="margin-top: 6px;">Password</label>
              <input type="password" class="gt-input" id="gtVaultPass" placeholder="••••••••">

              <div style="display: flex; gap: 6px; margin-top: 8px;">
                <button type="button" class="gt-btn-primary gt-btn-arm" id="gtBtnSaveVault" style="flex: 1; padding: 7px; font-size: 11px;">
                  🔒 <span id="gtBtnSaveVaultText">Save to Vault</span>
                </button>
                <button type="button" class="gt-btn-primary gt-btn-grab" id="gtBtnDirectLogin" style="flex: 1; padding: 7px; font-size: 11px;">
                  ⚡ <span id="gtBtnDirectLoginText">Login Now</span>
                </button>
              </div>
            </div>

            <!-- Fare Estimator -->
            <div class="gt-fare-card">
              <div class="gt-fare-row">
                <span id="gtLblBaseFare">Base Ticket Price:</span>
                <strong id="gtValBase">৳375</strong>
              </div>
              <div class="gt-fare-row">
                <span id="gtLblBkashFee">Shohoz & Gateway Fee:</span>
                <strong id="gtValFee">৳20</strong>
              </div>
              <div class="gt-total-box">
                <span style="font-weight: 800; font-size: 11.5px;" id="gtLblTotalAmt">TOTAL EST. FARE:</span>
                <span class="gt-total-val" id="gtValTotal">৳395</span>
              </div>
              <div class="gt-advice-note" id="gtAdviceNote">
                💡 Keep sufficient balance in your bKash before booking!
              </div>
            </div>
          </div>

        </div>

        <!-- Footer Developer Credit -->
        <div class="gt-dev-footer">
          Developed with ❤️ by <strong>Rukonuzzaman</strong>
          <a href="https://github.com/rknz/getticket" target="_blank">github.com/rknz/getticket</a>
        </div>
      </div>
    `;

    document.body.appendChild(root);

    // Bind UI interactions
    bindHudEvents(root);
    populateHudDropdowns(root);
    updateAuthStatusStrip();
    renderActiveSchedules(root);
    applyThemeAndLang(root);
  }

  // 13. Bind Event Listeners for On-Page HUD
  function bindHudEvents(root) {
    const bubble = root.querySelector('#gtBubble');
    const panel = root.querySelector('#gtPanel');
    const closeBtn = root.querySelector('#gtCloseBtn');
    const powerBtn = root.querySelector('#gtPowerBtn');
    const langBtn = root.querySelector('#gtLangToggle');
    const themeBtn = root.querySelector('#gtThemeToggle');

    // Toggle Modal
    bubble?.addEventListener('click', () => {
      panel?.classList.toggle('open');
    });

    closeBtn?.addEventListener('click', () => {
      panel?.classList.remove('open');
    });

    // Tab Navigation
    root.querySelectorAll('.gt-tab-nav').forEach(tab => {
      tab.addEventListener('click', () => {
        root.querySelectorAll('.gt-tab-nav').forEach(t => t.classList.remove('active'));
        root.querySelectorAll('.gt-pane').forEach(p => p.classList.remove('active'));

        tab.classList.add('active');
        const targetPane = root.querySelector(`#gtPane${tab.dataset.tab.charAt(0).toUpperCase() + tab.dataset.tab.slice(1)}`);
        targetPane?.classList.add('active');
      });
    });

    // Power Engine Toggle
    powerBtn?.addEventListener('click', () => {
      isEngineRunning = !isEngineRunning;
      if (isEngineRunning) {
        powerBtn.className = 'gt-ctrl-btn gt-power-btn active';
        powerBtn.innerText = '🟢 Active';
        showHudToast(currentLang === 'bn' ? '⚡ ইঞ্জিন সক্রিয়' : '⚡ Automation Engine Active');
      } else {
        powerBtn.className = 'gt-ctrl-btn gt-power-btn paused';
        powerBtn.innerText = '🔴 Paused';
        showHudToast(currentLang === 'bn' ? '⏸️ ইঞ্জিন সাময়িক বন্ধ' : '⏸️ Automation Engine Paused');
        if (watchdogRetryTimer) clearTimeout(watchdogRetryTimer);
      }
    });

    // Language Toggle
    langBtn?.addEventListener('click', () => {
      currentLang = currentLang === 'en' ? 'bn' : 'en';
      if (chrome?.storage?.local) chrome.storage.local.set({ gt_lang: currentLang });
      applyThemeAndLang(root);
      populateHudDropdowns(root);
      renderActiveSchedules(root);
    });

    // Theme Toggle
    themeBtn?.addEventListener('click', () => {
      currentTheme = currentTheme === 'light' ? 'dark' : 'light';
      if (chrome?.storage?.local) chrome.storage.local.set({ gt_theme: currentTheme });
      applyThemeAndLang(root);
    });

    // Swap Stations
    root.querySelector('#gtBtnSwap')?.addEventListener('click', () => {
      const fromSel = root.querySelector('#gtRouteFrom');
      const toSel = root.querySelector('#gtRouteTo');
      if (fromSel && toSel) {
        const temp = fromSel.value;
        fromSel.value = toSel.value;
        toSel.value = temp;
        onRouteChanged(root);
        showHudToast(currentLang === 'bn' ? '⇄ স্টেশন অদলবদল করা হয়েছে' : '⇄ Stations Swapped!');
      }
    });

    root.querySelector('#gtRouteFrom')?.addEventListener('change', () => onRouteChanged(root));
    root.querySelector('#gtRouteTo')?.addEventListener('change', () => onRouteChanged(root));
    root.querySelector('#gtJourneyDate')?.addEventListener('change', () => saveHudConfig(root));
    root.querySelector('#gtJourneyDate')?.addEventListener('input', () => saveHudConfig(root));
    root.querySelector('#gtTrainName')?.addEventListener('change', () => updateCalculations(root));
    root.querySelector('#gtPrefClass')?.addEventListener('change', () => updateCalculations(root));
    root.querySelector('#gtPassengerCount')?.addEventListener('change', () => updateCalculations(root));

    // Instant Grab Button
    root.querySelector('#gtBtnGrabNow')?.addEventListener('click', () => {
      saveHudConfig(root);
      playAlertSound();
      showHudToast(currentLang === 'bn' ? '⚡ তাৎক্ষণিক সিট লকিং শুরু হচ্ছে...' : '⚡ Instant Grab Started!');
      executeCascadingGrab();
    });

    // Arm Schedule Button
    root.querySelector('#gtBtnArmSchedule')?.addEventListener('click', () => {
      handleArmSchedule(root);
    });

    // Auto Login Button
    root.querySelector('#gtBtnAutoLogin')?.addEventListener('click', () => {
      if (chrome?.runtime?.sendMessage) {
        chrome.runtime.sendMessage({ action: 'TRIGGER_AUTO_LOGIN' });
        showHudToast(currentLang === 'bn' ? '🔑 লগইন পেজ খোলা হচ্ছে...' : '🔑 Opening login page...');
      }
    });

    // Save Vault Button
    root.querySelector('#gtBtnSaveVault')?.addEventListener('click', () => {
      const phone = root.querySelector('#gtVaultPhone')?.value?.trim() || '';
      const pass = root.querySelector('#gtVaultPass')?.value?.trim() || '';
      if (chrome?.storage?.local) {
        chrome.storage.local.set({ railwayVault: { phone, pass } }, () => {
          playAlertSound();
          showHudToast(UI_TEXT[currentLang].toastVaultSaved);
        });
      }
    });

    // Direct Login from Vault
    root.querySelector('#gtBtnDirectLogin')?.addEventListener('click', () => {
      const phone = root.querySelector('#gtVaultPhone')?.value?.trim() || '';
      const pass = root.querySelector('#gtVaultPass')?.value?.trim() || '';
      if (chrome?.storage?.local) {
        chrome.storage.local.set({ railwayVault: { phone, pass } }, () => {
          chrome.runtime.sendMessage({ action: 'TRIGGER_AUTO_LOGIN' });
          showHudToast(currentLang === 'bn' ? '🔑 লগইন পেজ খোলা হচ্ছে...' : '🔑 Opening login page...');
        });
      }
    });

    // Server Clock Updater
    setInterval(() => {
      const clockEl = root.querySelector('#gtCountdown');
      if (!clockEl) return;
      const now = new Date();
      const hrs = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      const secs = String(now.getSeconds()).padStart(2, '0');
      const ms = String(now.getMilliseconds()).padStart(3, '0');
      clockEl.innerText = `${hrs}:${mins}:${secs}.${ms}`;
    }, 50);
  }

  // 14. Populate HUD Dropdowns & Inputs
  function populateHudDropdowns(root) {
    const fromSel = root.querySelector('#gtRouteFrom');
    const toSel = root.querySelector('#gtRouteTo');
    const paxSel = root.querySelector('#gtPassengerCount');
    const prefClass = root.querySelector('#gtPrefClass');
    const p1Class = root.querySelector('#gtP1Class');
    const p2Class = root.querySelector('#gtP2Class');
    const p3Class = root.querySelector('#gtP3Class');
    const p1Dir = root.querySelector('#gtP1Dir');
    const p2Dir = root.querySelector('#gtP2Dir');
    const p3Dir = root.querySelector('#gtP3Dir');
    const dateInput = root.querySelector('#gtJourneyDate');

    const stList = STATIONS[currentLang] || STATIONS.en;
    const curFrom = fromSel?.value || config.routeFrom || 'Dhaka';
    const curTo = toSel?.value || config.routeTo || 'Rajshahi';

    if (fromSel) {
      fromSel.innerHTML = stList.map(s => `<option value="${s.value}" ${s.value === curFrom ? 'selected' : ''}>${s.text}</option>`).join('');
    }
    if (toSel) {
      toSel.innerHTML = stList.map(s => `<option value="${s.value}" ${s.value === curTo ? 'selected' : ''}>${s.text}</option>`).join('');
    }

    const paxOpts = PASSENGERS_OPTS[currentLang] || PASSENGERS_OPTS.en;
    if (paxSel) {
      paxSel.innerHTML = paxOpts.map(p => `<option value="${p.value}" ${parseInt(p.value, 10) === config.passengers ? 'selected' : ''}>${p.text}</option>`).join('');
    }

    const classOpts = CLASSES_OPTS[currentLang] || CLASSES_OPTS.en;
    [prefClass, p1Class, p2Class, p3Class].forEach((sel, i) => {
      if (sel) {
        const defaultClass = i === 0 ? 'ANY' : (i === 1 ? 'S_CHAIR' : (i === 2 ? 'F_CHAIR' : 'SNIGDHA'));
        const curVal = (i === 0 ? (config.prefClass || 'ANY') : (config.priorities?.[i - 1]?.classCode)) || defaultClass;
        sel.innerHTML = classOpts.map(c => `<option value="${c.value}" ${c.value === curVal ? 'selected' : ''}>${c.text}</option>`).join('');
      }
    });

    const dirOpts = DIRECTIONS_OPTS[currentLang] || DIRECTIONS_OPTS.en;
    [p1Dir, p2Dir, p3Dir].forEach((sel, i) => {
      if (sel) {
        const defaultDir = 'any';
        const curDir = config.priorities?.[i]?.dir || defaultDir;
        sel.innerHTML = dirOpts.map(d => `<option value="${d.value}" ${d.value === curDir ? 'selected' : ''}>${d.text}</option>`).join('');
      }
    });

    if (dateInput) {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      dateInput.min = todayStr;
      if (!dateInput.value || dateInput.value < todayStr) {
        dateInput.value = config.targetDate || todayStr;
      }
    }

    onRouteChanged(root);
  }

  function onRouteChanged(root) {
    const fromVal = root.querySelector('#gtRouteFrom')?.value || 'Dhaka';
    const toVal = root.querySelector('#gtRouteTo')?.value || 'Rajshahi';
    const trainSel = root.querySelector('#gtTrainName');
    if (!trainSel) return;

    const routeKey = `${fromVal}-${toVal}`;
    const reverseKey = `${toVal}-${fromVal}`;
    const trains = ROUTE_TRAIN_MAP[routeKey] || ROUTE_TRAIN_MAP[reverseKey] || [];

    const curTrain = config.trainName || 'ANY_TRAIN';
    const anyLabel = currentLang === 'bn' ? '✨ যেকোনো উপলব্ধ ট্রেন' : '✨ Any Available Train';
    let html = `<option value="ANY_TRAIN" ${curTrain === 'ANY_TRAIN' ? 'selected' : ''}>${anyLabel}</option>`;

    trains.forEach(t => {
      const name = currentLang === 'bn' ? t.nameBn : t.nameEn;
      html += `<option value="${t.nameEn}" ${curTrain === t.nameEn ? 'selected' : ''}>${name} (${t.code}) - ${t.dep}</option>`;
    });

    trainSel.innerHTML = html;
    updateCalculations(root);
  }

  function updateCalculations(root) {
    const fromVal = root.querySelector('#gtRouteFrom')?.value || 'Dhaka';
    const toVal = root.querySelector('#gtRouteTo')?.value || 'Rajshahi';
    const paxCount = parseInt(root.querySelector('#gtPassengerCount')?.value, 10) || 1;
    const coachClass = root.querySelector('#gtPrefClass')?.value || 'S_CHAIR';

    const routeKey = `${fromVal}-${toVal}`;
    const reverseKey = `${toVal}-${fromVal}`;
    const rates = FARE_RATES[routeKey] || FARE_RATES[reverseKey] || { "S_CHAIR": 375, "SNIGDHA": 719, "F_CHAIR": 500 };
    const baseUnit = rates[coachClass] || rates["S_CHAIR"] || 375;

    const baseFare = baseUnit * paxCount;
    const fee = 20 * paxCount;
    const total = baseFare + fee;

    const valBase = root.querySelector('#gtValBase');
    const valFee = root.querySelector('#gtValFee');
    const valTotal = root.querySelector('#gtValTotal');
    const advice = root.querySelector('#gtAdviceNote');

    if (valBase) valBase.innerText = `৳${baseFare}`;
    if (valFee) valFee.innerText = `৳${fee}`;
    if (valTotal) valTotal.innerText = `৳${total}`;
    if (advice) {
      advice.innerText = currentLang === 'bn'
        ? `💡 সকাল ৮:০০ টার টিকিট কাটার জন্য বিকাশে অন্তত ৳${total + 50} ব্যালেন্স রাখুন!`
        : `💡 Keep at least ৳${total + 50} in bKash before 8:00 AM!`;
    }
  }

  function saveHudConfig(root) {
    config.routeFrom = root.querySelector('#gtRouteFrom')?.value || config.routeFrom;
    config.routeTo = root.querySelector('#gtRouteTo')?.value || config.routeTo;
    config.targetDate = root.querySelector('#gtJourneyDate')?.value || config.targetDate;
    config.passengers = parseInt(root.querySelector('#gtPassengerCount')?.value, 10) || config.passengers;
    config.trainName = root.querySelector('#gtTrainName')?.value || config.trainName || 'ANY_TRAIN';
    config.prefClass = root.querySelector('#gtPrefClass')?.value || config.prefClass || 'ANY';

    const p1Class = root.querySelector('#gtP1Class')?.value || 'S_CHAIR';
    const p1Dir = root.querySelector('#gtP1Dir')?.value || 'any';
    const p2Class = root.querySelector('#gtP2Class')?.value || 'F_CHAIR';
    const p2Dir = root.querySelector('#gtP2Dir')?.value || 'any';
    const p3Class = root.querySelector('#gtP3Class')?.value || 'SNIGDHA';
    const p3Dir = root.querySelector('#gtP3Dir')?.value || 'any';

    config.priorities = [
      { level: 1, classCode: p1Class, dir: p1Dir, coach: 'ANY' },
      { level: 2, classCode: p2Class, dir: p2Dir, coach: 'ANY' },
      { level: 3, classCode: p3Class, dir: p3Dir, coach: 'ANY' }
    ];

    if (chrome?.storage?.local) {
      chrome.storage.local.set({ geTicketConfig: config });
    }
  }

  function updateAuthStatusStrip() {
    const root = document.getElementById('geticket-hud-root');
    if (!root) return;

    const dot = root.querySelector('#gtAuthDot');
    const text = root.querySelector('#gtAuthText');
    const btn = root.querySelector('#gtBtnAutoLogin');

    if (chrome?.storage?.local) {
      chrome.storage.local.get(['railwaySession'], (res) => {
        const session = res.railwaySession;
        if (session && (session.token || session.userName)) {
          const name = session.userName || session.userMobile || 'Session Active';
          if (dot) dot.innerText = '🟢';
          if (text) {
            text.innerText = currentLang === 'bn' ? `লগইন সক্রিয়: ${name}` : `Logged In: ${name}`;
            text.style.color = '#10b981';
          }
          if (btn) btn.style.display = 'none';
        } else {
          if (dot) dot.innerText = '🔴';
          if (text) {
            text.innerText = currentLang === 'bn' ? 'রেলওয়েতে লগইন নেই' : 'Not Logged In to Railway';
            text.style.color = '#ef4444';
          }
          if (btn) {
            btn.style.display = 'inline-block';
            btn.innerText = currentLang === 'bn' ? '⚡ অটো লগইন' : '⚡ Auto Login';
          }
        }
      });
    }
  }

  function renderActiveSchedules(root) {
    if (!chrome?.storage?.local) return;
    chrome.storage.local.get(['scheduledBookings'], (res) => {
      const raw = res.scheduledBookings || [];
      const list = cleanExpiredSchedules(raw);
      if (list.length !== raw.length) {
        chrome.storage.local.set({ scheduledBookings: list });
      }
      const badge = root.querySelector('#gtSchedCountBadge');
      const listContainer = root.querySelector('#gtSchedList');
      const emptyState = root.querySelector('#gtEmptySchedState');

      if (badge) badge.innerText = list.length;
      if (!listContainer) return;

      if (list.length === 0) {
        if (emptyState) emptyState.style.display = 'block';
        return;
      }

      if (emptyState) emptyState.style.display = 'none';
      listContainer.innerHTML = '';

      list.forEach(item => {
        const card = document.createElement('div');
        card.className = 'gt-sched-card';
        card.innerHTML = `
          <div class="gt-sched-info">
            <div class="gt-sched-info-title">🚄 ${item.trainName || 'Any Train'} (${item.classCode || 'S_CHAIR'})</div>
            <div class="gt-sched-info-meta">📍 ${item.from} ➔ ${item.to} • 📅 ${item.date} • 👥 ${item.passengers} pax</div>
            <div class="gt-sched-alarm">⏰ ${item.type === 'instant' || item.type === 'instant_watchdog' ? '⚡ Instant Grab Active' : '⏰ Alarm & Watchdog Active'}</div>
          </div>
          <button class="gt-btn-del" title="Remove">&times;</button>
        `;

        card.querySelector('.gt-btn-del')?.addEventListener('click', () => {
          const updated = list.filter(b => b.id !== item.id);
          chrome.storage.local.set({ scheduledBookings: updated }, () => {
            if (chrome?.runtime?.sendMessage) {
              chrome.runtime.sendMessage({ action: 'CANCEL_SCHEDULE', id: item.id }).catch(() => {});
            }
            renderActiveSchedules(root);
            showHudToast(currentLang === 'bn' ? '✓ শিডিউল মুছে ফেলা হয়েছে' : '✓ Schedule Removed');
          });
        });

        listContainer.appendChild(card);
      });
    });
  }

  function handleArmSchedule(root) {
    saveHudConfig(root);
    const dateVal = root.querySelector('#gtJourneyDate')?.value || '';
    if (!dateVal) {
      showHudToast(currentLang === 'bn' ? '⚠️ যাত্রার তারিখ নির্বাচন করুন!' : '⚠️ Select journey date!');
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateVal);
    target.setHours(0, 0, 0, 0);
    const diffDays = Math.round((target - today) / (1000 * 60 * 60 * 24));
    const isWithin10Days = diffDays <= 10;

    // West Zone: Rajshahi, Khulna, Rangpur, Dinajpur, Panchagarh, Benapole, Ishwardi, Bogra -> 08:00 AM (Alarm at 07:50 AM)
    // East Zone: Chattogram, Sylhet, Cox's Bazar, Jamalpur, Mymensingh, Cumilla, Feni -> 02:00 PM (Alarm at 01:50 PM)
    const westStations = ['rajshahi', 'khulna', 'rangpur', 'dinajpur', 'panchagarh', 'benapole', 'ishwardi', 'bogra'];
    const isWest = westStations.includes((config.routeTo || '').toLowerCase()) || westStations.includes((config.routeFrom || '').toLowerCase());
    const releaseHour = isWest ? 8 : 14;

    const alarmDate = new Date(target);
    alarmDate.setDate(alarmDate.getDate() - 10);
    alarmDate.setHours(releaseHour - 1, 50, 0, 0); // 10 minutes prior
    const targetTimestamp = alarmDate.getTime();

    const scheduleId = `geticket_sched_${Date.now()}`;
    const newBooking = {
      id: scheduleId,
      type: isWithin10Days ? 'instant' : 'advance',
      from: config.routeFrom,
      to: config.routeTo,
      date: dateVal,
      passengers: config.passengers,
      trainName: config.trainName,
      classCode: config.priorities[0].classCode,
      isWestZone: isWest,
      targetTimestamp,
      alarmTime: isWithin10Days ? '⚡ Instant Grab Active' : (isWest ? '07:50 AM' : '01:50 PM'),
      priorities: config.priorities,
      createdAt: new Date().toISOString()
    };

    if (chrome?.storage?.local) {
      chrome.storage.local.get(['scheduledBookings'], (res) => {
        const list = res.scheduledBookings || [];
        const updated = [newBooking, ...list.filter(b => b.id !== scheduleId)];
        chrome.storage.local.set({ scheduledBookings: updated }, () => {
          renderActiveSchedules(root);
          playAlertSound();

          // Dispatch alarm to background service worker
          if (chrome?.runtime?.sendMessage) {
            chrome.runtime.sendMessage({
              action: isWithin10Days ? 'TRIGGER_INSTANT_GRAB' : 'SCHEDULE_BOOKING',
              id: scheduleId,
              targetTimestamp,
              bookingInfo: newBooking,
              from: config.routeFrom,
              to: config.routeTo,
              date: dateVal,
              passengers: config.passengers,
              trainName: config.trainName,
              classCode: config.priorities[0].classCode,
              priorities: config.priorities
            }).catch(() => { });
          }

          const msg = isWithin10Days
            ? (currentLang === 'bn' ? '⚡ ১০ দিনের মধ্যে যাত্রা: তাৎক্ষণিক টিকিট লক শুরু হচ্ছে!' : '⚡ Within 10-day window: Instant grab initiated!')
            : (currentLang === 'bn' ? `✓ অগ্রিম শিডিউল যুক্ত হয়েছে! (অ্যালার্ম: ${isWest ? '০৭:৫০ AM' : '০১:৫০ PM'})` : `✓ Advance schedule armed! (Alarm: ${isWest ? '07:50 AM' : '01:50 PM'})`);

          showHudToast(msg);
          root.querySelector('#gtTabNavSchedules')?.click();
        });
      });
    }
  }



  function applyThemeAndLang(root) {
    if (!root) return;
    root.setAttribute('data-theme', currentTheme);
    document.documentElement.setAttribute('data-theme', currentTheme);

    const langBtn = root.querySelector('#gtLangToggle');
    const themeBtn = root.querySelector('#gtThemeToggle');
    const titleText = root.querySelector('#gtTitleText');
    const clockLabel = root.querySelector('#gtClockLabel');

    if (langBtn) langBtn.innerText = currentLang === 'en' ? 'EN' : 'বাং';
    if (themeBtn) themeBtn.innerText = currentTheme === 'light' ? '☀️' : '🌙';
    if (titleText) titleText.innerText = currentLang === 'bn' ? 'জি-টিকিট প্রো' : 'GeTicket Pro';
    if (clockLabel) clockLabel.innerText = currentLang === 'bn' ? 'রেলওয়ে সার্ভার টাইম:' : 'RAILWAY SERVER TIME:';

    const t = UI_TEXT[currentLang];
    const setText = (id, txt) => { const el = root.querySelector(id); if (el) el.innerText = txt; };

    setText('#gtTabNavSetup', t.tabSetup);
    setText('#gtTabNavSchedules', t.tabSchedules);
    setText('#gtTabNavVault', t.tabVault);
    setText('#gtLblFrom', t.lblFrom);
    setText('#gtLblTo', t.lblTo);
    setText('#gtLblDate', t.lblDate);
    setText('#gtLblPax', t.lblPax);
    setText('#gtLblTrain', t.lblTrain);
    setText('#gtLblClass', t.lblClass);
    setText('#gtLblPrioTitle', t.lblPrioTitle);
    setText('#gtLblPrioHint', t.lblPrioHint);
    setText('#gtBtnGrabText', t.btnGrab);
    setText('#gtBtnArmText', t.btnArm);
    setText('#gtBtnScanText', t.btnScan);
    setText('#gtLblNoSched', t.lblNoSched);
    setText('#gtLblNoSchedSub', t.lblNoSchedSub);
    setText('#gtLblVaultPhone', t.lblVaultPhone);
    setText('#gtLblVaultPass', t.lblVaultPass);
    setText('#gtBtnSaveVaultText', t.btnSaveVaultText);
    setText('#gtBtnDirectLoginText', t.btnDirectLoginText);
  }

  // 15. Runtime Message Listeners
  chrome.runtime?.onMessage?.addListener((req, sender, sendResponse) => {
    if (req.action === 'INSTANT_GRAB_COMMAND') {
      if (req.trainName) config.trainName = req.trainName;
      if (req.passengers) config.passengers = parseInt(req.passengers, 10) || 1;
      if (req.classCode && config.priorities?.[0]) config.priorities[0].classCode = req.classCode;
      if (req.priorities) config.priorities = req.priorities;

      playAlertSound();
      showHudToast(currentLang === 'bn' ? '⚡ ইন্সট্যান্ট সিট খোঁজা ও বুকিং হচ্ছে...' : '⚡ Instant Seat Grab in progress...');
      executeCascadingGrab();
      sendResponse({ success: true });
    }

    if (req.action === 'PAUSE_ENGINE') {
      isEngineRunning = false;
      if (watchdogRetryTimer) clearTimeout(watchdogRetryTimer);
      const btn = document.querySelector('#gtPowerBtn');
      if (btn) {
        btn.className = 'gt-ctrl-btn gt-power-btn paused';
        btn.innerText = '🔴 Paused';
      }
      showHudToast(currentLang === 'bn' ? '⏸️ পপআপ থেকে ইঞ্জিন বন্ধ' : '⏸️ Engine paused from popup');
      sendResponse({ success: true });
    }

    if (req.action === 'SESSION_PING') {
      fetch('/api/v1/user/me', { method: 'GET', credentials: 'include' }).catch(() => { });
      sendResponse({ success: true });
    }

    if (req.action === 'SCRAPE_LIVE_DOM') {
      const currentUrl = window.location.href;
      if (req.date) {
        const fmtDate = formatRailwayDate(req.date);
        const matchesDate = currentUrl.includes(encodeURIComponent(fmtDate)) || currentUrl.includes(fmtDate) || currentUrl.includes(req.date);
        const matchesRoute = (!req.from || currentUrl.toLowerCase().includes(req.from.toLowerCase())) &&
                             (!req.to || currentUrl.toLowerCase().includes(req.to.toLowerCase()));
        if (!matchesDate || !matchesRoute) {
          sendResponse({ success: false, trains: [], reason: 'MISMATCH_PAGE' });
          return;
        }
      }
      const domTrains = scrapeLiveDOMTrains();
      sendResponse({ success: true, trains: domTrains });
    }
  });

  // 16. Page Initializer
  function init() {
    if (chrome?.storage?.local) {
      chrome.storage.local.get(['gt_theme', 'gt_lang', 'geTicketConfig', 'railwayVault', 'scheduledBookings', 'activeGrabTask', 'railwaySession', 'engineActive'], (res) => {
        if (res.gt_theme) currentTheme = res.gt_theme;
        if (res.gt_lang) currentLang = res.gt_lang;
        if (res.geTicketConfig) config = { ...config, ...res.geTicketConfig };
        if (res.engineActive !== undefined) isEngineRunning = res.engineActive;

        // Clean expired schedules
        if (res.scheduledBookings) {
          const cleaned = cleanExpiredSchedules(res.scheduledBookings);
          if (cleaned.length !== res.scheduledBookings.length) {
            chrome.storage.local.set({ scheduledBookings: cleaned });
          }
        }

        const isSearchPage = window.location.pathname.includes('/booking/train/search');
        if (isSearchPage) {
          const urlParams = new URLSearchParams(window.location.search);
          const dojParam = urlParams.get('doj');
          const fromParam = urlParams.get('fromcity');
          const toParam = urlParams.get('tocity');

          const grabTask = res.activeGrabTask;
          // If activeGrabTask is waiting for a DIFFERENT date than current page, navigate immediately
          if (grabTask && grabTask.date && dojParam && grabTask.date.toLowerCase() !== dojParam.toLowerCase() && (Date.now() - grabTask.timestamp) < 180000) {
            const redirectUrl = `${RAILWAY_URL}/booking/train/search?fromcity=${encodeURIComponent(grabTask.from || fromParam || config.routeFrom)}&tocity=${encodeURIComponent(grabTask.to || toParam || config.routeTo)}&doj=${encodeURIComponent(grabTask.date)}&class=${encodeURIComponent(grabTask.classCode || 'S_CHAIR')}`;
            window.location.href = redirectUrl;
            return;
          }

          // Sync config with current page's real DOJ and route so HUD inputs strictly reflect the page
          if (dojParam) {
            config.targetDate = parseRailwayDateToInputFormat(dojParam);
          }
          if (fromParam) config.routeFrom = fromParam;
          if (toParam) config.routeTo = toParam;
        }

        injectHud();
        checkAndHandleAutoLogin();

        const grabTask = res.activeGrabTask;
        if (grabTask && (Date.now() - grabTask.timestamp) < 180000) {
          config.routeFrom = grabTask.from || config.routeFrom;
          config.routeTo = grabTask.to || config.routeTo;
          config.targetDate = grabTask.date || config.targetDate;
          config.passengers = grabTask.passengers || config.passengers;
          config.trainName = grabTask.trainName || config.trainName;
          if (grabTask.priorities && grabTask.priorities.length > 0) {
            config.priorities = grabTask.priorities;
          }

          if (isSearchPage) {
            showHudToast(currentLang === 'bn' ? `⚡ (${config.trainName}) সিট লকিং শুরু হচ্ছে...` : `⚡ (${config.trainName}) Locking seats...`);
            setTimeout(executeCascadingGrab, 800);
          }
        }
      });
    } else {
      injectHud();
    }

    paymentAssisterTimer = setInterval(initPaymentAutoAssister, 1000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
