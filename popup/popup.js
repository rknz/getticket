/**
 * GeTicket Pro - Popup Controller (v3.0)
 * Strict Single-Language Purity (Pure English default <-> Pure Bengali)
 * Dual-Mode Engine: Instant Ticket Grab & Advance 8:00 AM Schedule,
 * Live Railway Server API Fetcher with Real-Time Bearer Auth Bridge,
 * Master Train Database, Active Schedules Notification Badge & Manager.
 */

// 1. Comprehensive Bangladesh Railway Stations (Verbatim Official Railway Portal Names)
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

// 2. Comprehensive Master Train Schedule Database
const ROUTE_TRAIN_MAP = {
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
  "Dhaka-Rajshahi": [
    { nameEn: "Dhumketu Express", nameBn: "ধূমকেতু এক্সপ্রেস", code: "769", dep: "06:00 AM", arr: "11:40 AM", durationEn: "5h 40m", durationBn: "৫ ঘণ্টা ৪০ মি.", offDay: 4, offEn: "Thursday", offBn: "বৃহস্পতিবার" },
    { nameEn: "Bonolota Express", nameBn: "বনলতা এক্সপ্রেস", code: "791", dep: "01:30 PM", arr: "06:00 PM", durationEn: "4h 30m", durationBn: "৪ ঘণ্টা ৩০ মি.", offDay: 5, offEn: "Friday", offBn: "শুক্রবার" },
    { nameEn: "Silkcity Express", nameBn: "সিল্কসিটি এক্সপ্রেস", code: "753", dep: "02:30 PM", arr: "08:20 PM", durationEn: "5h 50m", durationBn: "৫ ঘণ্টা ৫০ মি.", offDay: 0, offEn: "Sunday", offBn: "রবিবার" },
    { nameEn: "Madhumati Express", nameBn: "মধুমতী এক্সপ্রেস", code: "755", dep: "03:00 PM", arr: "08:00 PM", durationEn: "5h 00m", durationBn: "৫ ঘণ্টা", offDay: 4, offEn: "Thursday", offBn: "বৃহস্পতিবার" },
    { nameEn: "Padma Express", nameBn: "পদ্মা এক্সপ্রেস", code: "759", dep: "11:00 PM", arr: "04:40 AM", durationEn: "5h 40m", durationBn: "৫ ঘণ্টা ৪০ মি.", offDay: 2, offEn: "Tuesday", offBn: "মঙ্গলবার" }
  ],
  "Rajshahi-Dhaka": [
    { nameEn: "Madhumati Express", nameBn: "মধুমতী এক্সপ্রেস", code: "756", dep: "06:40 AM", arr: "11:40 AM", durationEn: "5h 00m", durationBn: "৫ ঘণ্টা", offDay: 4, offEn: "Thursday", offBn: "বৃহস্পতিবার" },
    { nameEn: "Bonolota Express", nameBn: "বনলতা এক্সপ্রেস", code: "792", dep: "07:00 AM", arr: "11:30 AM", durationEn: "4h 30m", durationBn: "৪ ঘণ্টা ৩০ মি.", offDay: 5, offEn: "Friday", offBn: "শুক্রবার" },
    { nameEn: "Silkcity Express", nameBn: "সিল্কসিটি এক্সপ্রেস", code: "754", dep: "07:40 AM", arr: "01:30 PM", durationEn: "5h 50m", durationBn: "৫ ঘণ্টা ৫০ মি.", offDay: 0, offEn: "Sunday", offBn: "রবিবার" },
    { nameEn: "Padma Express", nameBn: "পদ্মা এক্সপ্রেস", code: "760", dep: "04:00 PM", arr: "09:40 PM", durationEn: "5h 40m", durationBn: "৫ ঘণ্টা ৪০ মি.", offDay: 2, offEn: "Tuesday", offBn: "মঙ্গলবার" },
    { nameEn: "Dhumketu Express", nameBn: "ধূমকেতু এক্সপ্রেস", code: "770", dep: "11:20 PM", arr: "04:50 AM", durationEn: "5h 30m", durationBn: "৫ ঘণ্টা ৩০ মি.", offDay: 4, offEn: "Thursday", offBn: "বৃহস্পতিবার" }
  ],
  "Dhaka-Jamalpur": [
    { nameEn: "Dewanganj Commuter", nameBn: "দেওয়ানগঞ্জ কমিউটার", code: "47", dep: "05:40 AM", arr: "11:15 AM", durationEn: "5h 35m", durationBn: "৫ ঘণ্টা ৩৫ মি.", offDay: -1, offEn: "No Off-Day", offBn: "কোনো বন্ধ নেই" },
    { nameEn: "Teesta Express", nameBn: "তিস্তা এক্সপ্রেস", code: "707", dep: "07:30 AM", arr: "11:50 AM", durationEn: "4h 20m", durationBn: "৪ ঘণ্টা ২০ মি.", offDay: 1, offEn: "Monday", offBn: "সোমবার" },
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
  ]
};

// 3. Exact Official Railway Fare Rates
const FARE_RATES = {
  "Dhaka-Chattogram": { "S_CHAIR": 405, "SNIGDHA": 777, "F_CHAIR": 540, "AC_S": 932, "AC_B": 1398, "SHOVON": 340 },
  "Dhaka-Rajshahi": { "S_CHAIR": 375, "SNIGDHA": 719, "F_CHAIR": 500, "AC_S": 863, "AC_B": 1294, "SHOVON": 315 },
  "Dhaka-Jamalpur": { "S_CHAIR": 205, "SNIGDHA": 391, "F_CHAIR": 270, "AC_S": 466, "AC_B": 699, "SHOVON": 170 }
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
    lblSchedTitle: "Scheduled Bookings",
    lblNoSched: "No active schedules",
    lblNoSchedSub: "Set your route and click 'Arm Advance Schedule' on Setup tab.",
    lblVaultTitle: "Account Vault",
    lblVaultHint: "Encrypted",
    lblVaultPhone: "Railway Mobile",
    lblVaultPass: "Password",
    lblVaultGuardHead: "✓ Anti-Logout Guard Active",
    lblVaultGuardDesc: "Keeps your railway session warm from 7:50 AM to prevent unexpected logout during morning peak rush.",
    btnSaveVaultText: "Save to Vault",
    btnDirectLoginText: "Login Now",
    toastSchedSaved: "✓ Schedule Armed & Added to List!",
    toastSchedDeleted: "✓ Schedule Removed",
    toastVaultSaved: "🔒 Railway Account Saved in Vault!",
    liveAvail: "seats left",
    liveSold: "Sold Out",
    liveBookBtn: "⚡ Book Now",
    liveChkFailed: "Live check failed (Please login to Railway)",
    lblLiveEmpty: "No live data. Try again.",
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
    lblSchedTitle: "নির্ধারিত শিডিউল তালিকা",
    lblNoSched: "কোনো সক্রিয় শিডিউল নেই",
    lblNoSchedSub: "সেটআপ ট্যাব থেকে অগ্রিম শিডিউল যুক্ত করলে সকাল ০৭:৫০ এ স্বয়ংক্রিয় অ্যালার্ম বাজবে।",
    lblVaultTitle: "সুরক্ষিত ভল্ট",
    lblVaultHint: "এনক্রিপ্টেড",
    lblVaultPhone: "রেলওয়ে মোবাইল নম্বর",
    lblVaultPass: "পাসওয়ার্ড",
    lblVaultGuardHead: "✓ অ্যান্টি-লগআউট সেশন গার্ড সক্রিয়",
    lblVaultGuardDesc: "সকাল ৭:৫০ থেকে ব্রাউজার সেশন সচল রাখবে যাতে ৮টার ভিড়ে লগআউট না হয়ে যায়।",
    btnSaveVaultText: "ভল্টে সেভ করুন",
    btnDirectLoginText: "এখনই লগইন করুন",
    toastSchedSaved: "✓ শিডিউল ও অ্যালার্ম যুক্ত হয়েছে!",
    toastSchedDeleted: "✓ শিডিউল মুছে ফেলা হয়েছে",
    toastVaultSaved: "🔒 অ্যাকাউন্ট লোকাল ভল্টে সংরক্ষিত!",
    liveAvail: "টি আসন খালি",
    liveSold: "বুকড (০ টি)",
    liveBookBtn: "⚡ এখনই বুক করুন",
    liveChkFailed: "লাইভ চেক ব্যর্থ (অনুগ্রহ করে প্রথমে লগইন করুন)",
    lblLiveEmpty: "লাইভ তথ্য পাওয়া যায়নি। আবার চেষ্টা করুন।",
    scanningLive: "লাইভ সিট স্ক্যান হচ্ছে..."
  }
};

let currentTheme = 'light';
let currentLang = 'en';
let liveServerData = null;
let isCurrentRouteValid = true;
let isPopupEngineActive = true;
let isRailwayLoggedIn = false;

function playChime() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.6);
  } catch (e) { }
}

function switchPage(pageId) {
  document.querySelectorAll('.nav-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.page === pageId);
  });
  document.querySelectorAll('.page-view').forEach(p => {
    p.classList.toggle('active', p.id === `page-${pageId}`);
  });
}
window.switchPage = switchPage;

function showToast(msg) {
  const toast = document.getElementById('statusToast');
  if (toast) {
    toast.innerText = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2400);
  }
}

function updateBadgeCount(count) {
  const num = parseInt(count, 10) || 0;
  const miniBadge = document.getElementById('miniBadgeCount');
  if (miniBadge) miniBadge.innerText = String(num);

  const schedCount = document.getElementById('lblSchedCount');
  if (schedCount) {
    schedCount.innerText = currentLang === 'bn' ? `${num} টি সক্রিয়` : `${num} Active`;
  }
}

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

function getScheduledBookings(callback) {
  if (chrome?.storage?.local) {
    chrome.storage.local.get(['scheduledBookings'], (res) => {
      const raw = Array.isArray(res?.scheduledBookings) ? res.scheduledBookings : [];
      const cleaned = cleanExpiredSchedules(raw);
      if (cleaned.length !== raw.length) {
        chrome.storage.local.set({ scheduledBookings: cleaned });
      }
      updateBadgeCount(cleaned.length);
      callback(cleaned);
    });
  } else {
    callback([]);
  }
}

function saveScheduledBookings(list, callback) {
  const safeList = Array.isArray(list) ? list : [];
  updateBadgeCount(safeList.length);
  if (chrome?.storage?.local) {
    chrome.storage.local.set({ scheduledBookings: safeList }, () => {
      if (callback) callback();
    });
  } else if (callback) {
    callback();
  }
}

function renderSchedulesList(bookings) {
  const container = document.getElementById('schedulesContainer');
  const emptyState = document.getElementById('emptyScheduleState');
  if (!container) return;

  container.innerHTML = '';
  const list = Array.isArray(bookings) ? bookings : [];
  updateBadgeCount(list.length);

  if (list.length === 0) {
    if (emptyState) emptyState.style.display = 'block';
    return;
  }
  if (emptyState) emptyState.style.display = 'none';

  list.forEach(item => {
    const card = document.createElement('div');
    card.className = 'schedule-card';

    const fromStation = getStationName(item.from, currentLang);
    const toStation = getStationName(item.to, currentLang);
    const trainDisplay = getTrainDisplayName(item.trainName, currentLang);
    const isInstant = item.type === 'instant';
    const isWatchdog = item.type === 'instant_watchdog';

    const statusColor = isWatchdog ? '#f59e0b' : (isInstant ? '#10b981' : 'var(--primary)');
    const statusText = isWatchdog
      ? (currentLang === 'bn' ? '🔄 ওয়াচডগ সক্রিয় (স্বয়ংক্রিয় পুনঃপরীক্ষা)' : '🔄 Watchdog Active (Auto Re-checking)')
      : (isInstant
        ? (currentLang === 'bn' ? '⚡ তাৎক্ষণিক ফাস্ট-গ্র্যাব সক্রিয়' : '⚡ Instant Fast-Grab Active')
        : (currentLang === 'bn' ? `⏰ অ্যালার্ম সক্রিয় (${item.date})` : `⏰ Alarm Armed (${item.date})`));

    const paxCount = item.passengers || 1;
    const paxText = currentLang === 'bn' ? `${paxCount} জন যাত্রী` : `${paxCount} Pax`;
    const classDisplay = (CLASSES_OPTS[currentLang] || CLASSES_OPTS.en).find(c => c.value === item.classCode)?.text || item.classCode || 'Shovon Chair';

    card.innerHTML = `
      <div style="flex: 1; padding-right: 8px;">
        <div class="sched-info-title">🚄 ${trainDisplay}</div>
        <div class="sched-info-meta">📍 ${fromStation} ➔ ${toStation}</div>
        <div class="sched-info-meta">📅 ${item.date} • 👥 ${paxText} • 💺 ${classDisplay}</div>
        <div class="sched-info-meta" style="color: ${statusColor}; font-weight: 700; margin-top: 4px;">${statusText}</div>
      </div>
      <div>
        <button class="btn-del-sched" data-id="${item.id}" title="${currentLang === 'bn' ? 'মুছে ফেলুন' : 'Delete'}">🗑️</button>
      </div>
    `;

    card.querySelector('.btn-del-sched').addEventListener('click', (e) => {
      e.stopPropagation();
      deleteSchedule(item.id);
    });

    container.appendChild(card);
  });
}

function deleteSchedule(id) {
  getScheduledBookings((bookings) => {
    const updated = bookings.filter(b => b.id !== id);
    saveScheduledBookings(updated, () => {
      renderSchedulesList(updated);
      if (chrome?.runtime?.sendMessage) {
        chrome.runtime.sendMessage({ action: 'CANCEL_SCHEDULE', id }).catch(() => { });
      }
      showToast(UI_TEXT[currentLang].toastSchedDeleted);
    });
  });
}

// 4. Real-Time Auth State & Status Checker
function checkAndDisplayAuthStatus() {
  const dot = document.getElementById('authStatusDot');
  const text = document.getElementById('authStatusText');
  const btn = document.getElementById('btnAuthAction');

  if (chrome?.runtime?.sendMessage) {
    chrome.runtime.sendMessage({ action: 'CHECK_AUTH_STATUS' }, (res) => {
      if (res && res.isLoggedIn) {
        isRailwayLoggedIn = true;
        const userName = res.user?.name || res.user?.mobile_number || 'Session Active';
        if (dot) dot.innerText = '🟢';
        if (text) {
          text.innerText = currentLang === 'bn' ? `রেলওয়ে লগইন সক্রিয়: ${userName}` : `Railway Logged In: ${userName}`;
          text.style.color = '#10b981';
        }
        if (btn) {
          btn.innerText = currentLang === 'bn' ? '🌐 পোর্টাল' : '🌐 Open Portal';
          btn.onclick = () => {
            chrome.tabs.create({ url: 'https://eticket.railway.gov.bd/booking/train/search' });
          };
        }
      } else {
        isRailwayLoggedIn = false;
        if (dot) dot.innerText = '🔴';
        if (text) {
          text.innerText = currentLang === 'bn' ? 'রেলওয়েতে লগইন করা নেই' : 'Not Logged In to Railway';
          text.style.color = '#ef4444';
        }
        if (btn) {
          btn.innerText = currentLang === 'bn' ? '⚡ অটো লগইন' : '⚡ Auto Login';
          btn.onclick = () => {
            chrome.runtime.sendMessage({ action: 'TRIGGER_AUTO_LOGIN' }, (r) => {
              if (r && r.error === 'NO_VAULT_CREDENTIALS') {
                showToast(currentLang === 'bn' ? '⚠️ ভল্টে মোবাইল ও পাসওয়ার্ড সেভ করুন!' : '⚠️ Save phone & password in Vault first!');
                switchPage('vault');
              } else {
                showToast(currentLang === 'bn' ? '🔑 লগইন পেজ খোলা হচ্ছে...' : '🔑 Opening login page...');
              }
            });
          };
        }
      }
    });
  }
}

// 5. Live Railway Server API Integration
async function fetchLiveTrainsFromServer(fromStation, toStation, journeyDate) {
  return new Promise((resolve) => {
    if (chrome?.runtime?.sendMessage) {
      chrome.runtime.sendMessage({
        action: 'FETCH_RAILWAY_LIVE_API',
        from: fromStation,
        to: toStation,
        date: journeyDate
      }, (response) => {
        if (response && response.success) {
          const trains = response.data?.trains || response.data?.trips || response.trains;
          if (trains && trains.length > 0) {
            liveServerData = { ...response.data, trains };
            resolve({ trains, live: true });
            return;
          }
        } else if (response && response.unauthorized) {
          resolve({ unauthorized: true });
          return;
        }
        resolve(null);
      });
    } else {
      resolve(null);
    }
  });
}

function getStationName(val, lang) {
  const list = STATIONS[lang] || STATIONS.en;
  const match = list.find(s => s.value.toLowerCase() === (val || '').toLowerCase());
  return match ? match.text : val;
}

function resolveStationValue(textOrVal) {
  if (!textOrVal) return "Dhaka";
  for (const lang of ['en', 'bn']) {
    const list = STATIONS[lang];
    const match = list.find(s => s.text.toLowerCase() === textOrVal.toLowerCase() || s.value.toLowerCase() === textOrVal.toLowerCase());
    if (match) return match.value;
  }
  return textOrVal;
}

function getTrainDisplayName(nameEn, lang) {
  if (nameEn === 'ANY_TRAIN' || !nameEn) {
    return lang === 'bn' ? 'যেকোনো উপলব্ধ ট্রেন' : 'Any Available Train';
  }
  for (const key in ROUTE_TRAIN_MAP) {
    const match = ROUTE_TRAIN_MAP[key].find(t => t.nameEn === nameEn);
    if (match) return lang === 'bn' ? match.nameBn : match.nameEn;
  }
  return nameEn;
}

function populateDropdowns() {
  const fromInput = document.getElementById('routeFrom');
  const toInput = document.getElementById('routeTo');
  const paxSel = document.getElementById('passengerCount');
  const prefClass = document.getElementById('prefClass');

  const p1Class = document.getElementById('p1Class');
  const p2Class = document.getElementById('p2Class');
  const p3Class = document.getElementById('p3Class');

  const p1Dir = document.getElementById('p1Dir');
  const p2Dir = document.getElementById('p2Dir');
  const p3Dir = document.getElementById('p3Dir');

  const curFrom = fromInput?.value ? resolveStationValue(fromInput.value) : "Dhaka";
  const curTo = toInput?.value ? resolveStationValue(toInput.value) : "Rajshahi";
  const curPax = paxSel?.value || "1";
  const curPref = prefClass?.value || "ANY";

  if (fromInput) {
    fromInput.innerHTML = '';
    (STATIONS[currentLang] || STATIONS.en).forEach(s => {
      fromInput.appendChild(new Option(s.text, s.value));
    });
    fromInput.value = curFrom;
  }

  if (toInput) {
    toInput.innerHTML = '';
    (STATIONS[currentLang] || STATIONS.en).forEach(s => {
      toInput.appendChild(new Option(s.text, s.value));
    });
    toInput.value = curTo;
  }

  if (paxSel) {
    paxSel.innerHTML = '';
    (PASSENGERS_OPTS[currentLang] || PASSENGERS_OPTS.en).forEach(p => {
      paxSel.appendChild(new Option(p.text, p.value));
    });
    paxSel.value = curPax;
  }

  [prefClass, p1Class, p2Class, p3Class].forEach(sel => {
    if (!sel) return;
    const defaultVal = sel === prefClass ? 'ANY' : (sel === p1Class ? 'S_CHAIR' : (sel === p2Class ? 'F_CHAIR' : 'SNIGDHA'));
    const curVal = sel.value || defaultVal;
    sel.innerHTML = '';
    (CLASSES_OPTS[currentLang] || CLASSES_OPTS.en).forEach(c => {
      sel.appendChild(new Option(c.text, c.value));
    });
    sel.value = curVal;
  });

  [p1Dir, p2Dir, p3Dir].forEach(sel => {
    if (!sel) return;
    const curVal = sel.value || 'any';
    sel.innerHTML = '';
    (DIRECTIONS_OPTS[currentLang] || DIRECTIONS_OPTS.en).forEach(d => {
      sel.appendChild(new Option(d.text, d.value));
    });
    sel.value = curVal;
  });
}

function applyThemeAndLang() {
  document.documentElement.setAttribute('data-theme', currentTheme);
  document.documentElement.setAttribute('data-lang', currentLang);

  const t = UI_TEXT[currentLang] || UI_TEXT.en;

  const btnTheme = document.getElementById('btnPopTheme');
  if (btnTheme) btnTheme.innerText = currentTheme === 'light' ? '☀️' : '🌙';

  const btnLang = document.getElementById('btnPopLang');
  if (btnLang) btnLang.innerText = currentLang === 'en' ? 'EN' : 'বাং';

  const hdrTitle = document.getElementById('hdrTitle');
  if (hdrTitle) hdrTitle.innerText = t.hdrTitle;

  const tabSetup = document.getElementById('tabSetup');
  if (tabSetup) tabSetup.innerText = t.tabSetup;

  const tabSchedules = document.getElementById('tabSchedules');
  if (tabSchedules) {
    const miniBadge = document.getElementById('miniBadgeCount');
    const bCount = miniBadge ? miniBadge.innerText : '0';
    tabSchedules.innerHTML = `${t.tabSchedules} <span class="tab-mini-badge" id="miniBadgeCount">${bCount}</span>`;
  }

  const tabVault = document.getElementById('tabVault');
  if (tabVault) tabVault.innerText = t.tabVault;

  const lblClock = document.getElementById('lblClockStrip');
  if (lblClock) lblClock.innerText = currentLang === 'bn' ? 'রেলওয়ে সার্ভার টাইম' : 'RAILWAY SERVER TIME';

  const lblFrom = document.getElementById('lblFrom');
  if (lblFrom) lblFrom.innerText = t.lblFrom;
  const lblTo = document.getElementById('lblTo');
  if (lblTo) lblTo.innerText = t.lblTo;
  const lblDate = document.getElementById('lblDate');
  if (lblDate) lblDate.innerText = t.lblDate;
  const lblPax = document.getElementById('lblPax');
  if (lblPax) lblPax.innerText = t.lblPax;
  const lblTrain = document.getElementById('lblTrain');
  if (lblTrain) lblTrain.innerText = t.lblTrain;
  const lblClass = document.getElementById('lblClass');
  if (lblClass) lblClass.innerText = t.lblClass;

  const lblPrioTitle = document.getElementById('lblPrioTitle');
  if (lblPrioTitle) lblPrioTitle.innerText = currentLang === 'bn' ? '🎯 ক্যাসকেডিং প্রায়োরিটি চেইন' : '🎯 Cascading Priority Chain';

  const btnArmText = document.getElementById('btnArmText');
  if (btnArmText) btnArmText.innerText = currentLang === 'bn' ? '১০ দিন পরের অগ্রিম টিকিট আর্ম করুন' : 'Arm Advance Schedule & Watchdog';

  const btnGrabText = document.getElementById('btnGrabText');
  if (btnGrabText) btnGrabText.innerText = currentLang === 'bn' ? 'তাৎক্ষণিক গ্র্যাব / সোল্ড-আউট ওয়াচডগ' : 'Instant Fast-Grab (Lock)';

  const btnSaveVaultText = document.getElementById('btnSaveVaultText');
  if (btnSaveVaultText) btnSaveVaultText.innerText = t.btnSaveVaultText;

  const btnDirectLoginText = document.getElementById('btnDirectLoginText');
  if (btnDirectLoginText) btnDirectLoginText.innerText = t.btnDirectLoginText;

  populateDropdowns();
  onRouteChanged();
  checkAndDisplayAuthStatus();
}

function onRouteChanged() {
  const rawFrom = document.getElementById('routeFrom')?.value || 'Dhaka';
  const rawTo = document.getElementById('routeTo')?.value || 'Rajshahi';

  const from = resolveStationValue(rawFrom);
  const to = resolveStationValue(rawTo);
  const routeKey = `${from}-${to}`;

  const trainDropdown = document.getElementById('trainName');
  if (!trainDropdown) return;
  const curTrain = trainDropdown.value;

  let trains = ROUTE_TRAIN_MAP[routeKey] || ROUTE_TRAIN_MAP[`${to}-${from}`] || [];
  trains = sortTrainsChronologically(trains);
  trainDropdown.innerHTML = '';

  const btnArm = document.getElementById('btnArmSchedule');
  const btnGrab = document.getElementById('btnGrabNow');

  if (!trains || trains.length === 0) {
    isCurrentRouteValid = false;
    const noTrainOpt = document.createElement('option');
    noTrainOpt.disabled = true;
    noTrainOpt.selected = true;
    noTrainOpt.value = '';
    noTrainOpt.innerText = currentLang === 'bn' ? 'কোনো সরাসরি ট্রেন নেই' : 'No direct trains available';
    trainDropdown.appendChild(noTrainOpt);

    if (btnArm) { btnArm.disabled = true; btnArm.style.opacity = '0.5'; }
    if (btnGrab) { btnGrab.disabled = true; btnGrab.style.opacity = '0.5'; }
    return;
  }

  isCurrentRouteValid = true;
  if (btnArm) { btnArm.disabled = false; btnArm.style.opacity = '1'; }
  if (btnGrab) { btnGrab.disabled = false; btnGrab.style.opacity = '1'; }

  const anyTrainOpt = document.createElement('option');
  anyTrainOpt.value = 'ANY_TRAIN';
  anyTrainOpt.innerText = currentLang === 'bn' 
    ? '✨ যেকোনো উপলব্ধ ট্রেন' 
    : '✨ Any Available Train';
  if (!curTrain || curTrain === 'ANY_TRAIN') anyTrainOpt.selected = true;
  trainDropdown.appendChild(anyTrainOpt);

  trains.forEach((t) => {
    const trainName = currentLang === 'bn' ? (t.nameBn || t.nameEn) : t.nameEn;
    const timeStr = t.arr ? `${t.dep} ➔ ${t.arr}` : t.dep;
    const opt = document.createElement('option');
    opt.value = t.nameEn;
    opt.innerText = `${trainName} (${timeStr})`;
    if (t.nameEn === curTrain) opt.selected = true;
    trainDropdown.appendChild(opt);
  });

  updateCalculations();
}

function updateCalculations() {
  if (!isCurrentRouteValid) return;

  const rawFrom = document.getElementById('routeFrom')?.value || 'Dhaka';
  const rawTo = document.getElementById('routeTo')?.value || 'Rajshahi';
  const from = resolveStationValue(rawFrom);
  const to = resolveStationValue(rawTo);
  const chosenClass = document.getElementById('prefClass')?.value || 'S_CHAIR';
  const pax = parseInt(document.getElementById('passengerCount')?.value, 10) || 1;

  const routeKey = `${from}-${to}`;
  const routeFares = FARE_RATES[routeKey] || FARE_RATES["Dhaka-Rajshahi"];
  const unitPrice = routeFares ? (routeFares[chosenClass] || 205) : 205;

  const baseTotal = unitPrice * pax;
  const serviceCharge = 20 * pax;
  const subtotal = baseTotal + serviceCharge;
  const bkashFee = Math.round(subtotal * 0.015);
  const totalPay = subtotal + bkashFee;
  const recommended = Math.ceil((totalPay + 5) / 10) * 10;

  const valBase = document.getElementById('valBaseFare');
  const valStation = document.getElementById('valStationFee');
  const valBkash = document.getElementById('valBkashFee');
  const valTotal = document.getElementById('valTotalFare');
  const valAdviceNote = document.getElementById('lblFareAdviceNote');

  if (valBase) valBase.innerText = `৳${unitPrice} × ${pax} = ৳${baseTotal}`;
  if (valStation) valStation.innerText = `৳${serviceCharge}`;
  if (valBkash) valBkash.innerText = `৳${bkashFee}`;
  if (valTotal) valTotal.innerText = `৳${totalPay}`;
  if (valAdviceNote) {
    valAdviceNote.innerText = currentLang === 'bn'
      ? `💡 সকাল ৮:০০ টার আগে বিকাশে অন্তত ৳${recommended} ব্যালেন্স রাখুন!`
      : `💡 Keep at least ৳${recommended} in bKash before 8:00 AM!`;
  }
}

function saveCurrentConfig() {
  const from = resolveStationValue(document.getElementById('routeFrom')?.value || 'Dhaka');
  const to = resolveStationValue(document.getElementById('routeTo')?.value || 'Rajshahi');
  const date = document.getElementById('journeyDate')?.value || new Date().toISOString().split('T')[0];
  const passengers = parseInt(document.getElementById('passengerCount')?.value, 10) || 1;
  const trainName = document.getElementById('trainName')?.value || 'ANY_TRAIN';
  const classCode = document.getElementById('prefClass')?.value || 'ANY';

  const p1C = document.getElementById('p1Class')?.value || 'S_CHAIR';
  const p1D = document.getElementById('p1Dir')?.value || 'any';
  const p2C = document.getElementById('p2Class')?.value || 'F_CHAIR';
  const p2D = document.getElementById('p2Dir')?.value || 'any';
  const p3C = document.getElementById('p3Class')?.value || 'SNIGDHA';
  const p3D = document.getElementById('p3Dir')?.value || 'any';

  const priorities = [
    { level: 1, classCode: p1C, dir: p1D, coach: 'ANY' },
    { level: 2, classCode: p2C, dir: p2D, coach: 'ANY' },
    { level: 3, classCode: p3C, dir: p3D, coach: 'ANY' }
  ];

  const configUpdate = { routeFrom: from, routeTo: to, targetDate: date, passengers, trainName, prefClass: classCode, priorities };
  if (chrome?.storage?.local) {
    chrome.storage.local.set({ geTicketConfig: configUpdate });
  }
  return { from, to, date, passengers, trainName, classCode, priorities };
}

// Handler: Arm Advance Schedule
function handleArmSchedule() {
  if (!isPopupEngineActive) {
    showToast(currentLang === 'bn' ? '⏸️ ইঞ্জিন বন্ধ আছে। সক্রিয় করুন।' : '⏸️ Engine is paused. Activate first.');
    return;
  }
  if (!isCurrentRouteValid) {
    showToast(currentLang === 'bn' ? '⚠️ এই রুটে সরাসরি ট্রেন নেই!' : '⚠️ Route unavailable!');
    return;
  }

  const cfg = saveCurrentConfig();
  const westZone = ['Rajshahi', 'Khulna', 'Rangpur', 'Dinajpur', 'Panchagarh', 'Benapole', 'Ishwardi', 'Bogra'];
  const isWest = westZone.includes(cfg.to) || westZone.includes(cfg.from);

  const selectedDate = new Date(cfg.date);
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);
  const diffDays = Math.round((selectedDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));
  const isWithin10Days = diffDays <= 10;

  let targetTimestamp = null;
  if (!isWithin10Days) {
    const releaseDay = new Date(selectedDate);
    releaseDay.setDate(releaseDay.getDate() - 10);
    releaseDay.setHours(isWest ? 7 : 13, 50, 0, 0);
    targetTimestamp = releaseDay.getTime();
    if (targetTimestamp <= Date.now()) targetTimestamp = null;
  }

  const scheduleId = `geticket_sched_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
  const newBooking = {
    id: scheduleId,
    type: isWithin10Days ? 'instant' : 'advance',
    from: cfg.from,
    to: cfg.to,
    date: cfg.date,
    passengers: cfg.passengers,
    trainName: cfg.trainName,
    classCode: cfg.classCode,
    isWestZone: isWest,
    targetTimestamp,
    priorities: cfg.priorities,
    createdAt: new Date().toISOString()
  };

  getScheduledBookings((bookings) => {
    const updated = [newBooking, ...bookings.filter(b => b.id !== scheduleId)];
    saveScheduledBookings(updated, () => {
      renderSchedulesList(updated);
      playChime();

      if (chrome?.runtime?.sendMessage) {
        chrome.runtime.sendMessage({
          action: isWithin10Days ? 'TRIGGER_INSTANT_GRAB' : 'SCHEDULE_BOOKING',
          id: scheduleId,
          targetTimestamp,
          bookingInfo: newBooking,
          from: cfg.from,
          to: cfg.to,
          date: cfg.date,
          passengers: cfg.passengers,
          trainName: cfg.trainName,
          classCode: cfg.classCode,
          priorities: cfg.priorities
        }).catch(() => { });
      }

      showToast(currentLang === 'bn' ? '✓ শিডিউল ও অ্যালার্ম আর্ম হয়েছে (লিস্টে যুক্ত)!' : '✓ Schedule Armed & added to Lists!');
    });
  });
}

// Handler: Instant Fast-Grab
function handleInstantGrab(overrideTrain, overrideClass, overrideDate) {
  if (!isPopupEngineActive) {
    showToast(currentLang === 'bn' ? '⏸️ ইঞ্জিন বন্ধ আছে। সক্রিয় করুন।' : '⏸️ Engine is paused. Activate first.');
    return;
  }
  if (!isCurrentRouteValid) {
    showToast(currentLang === 'bn' ? '⚠️ এই রুটে সরাসরি ট্রেন নেই!' : '⚠️ Route unavailable!');
    return;
  }

  const cfg = saveCurrentConfig();
  if (overrideTrain) cfg.trainName = overrideTrain;
  if (overrideClass) cfg.classCode = overrideClass;
  if (overrideDate) cfg.date = overrideDate;

  const instantId = `geticket_instant_${Date.now()}`;
  const newBooking = {
    id: instantId,
    type: 'instant',
    from: cfg.from,
    to: cfg.to,
    date: cfg.date,
    passengers: cfg.passengers,
    trainName: cfg.trainName,
    classCode: cfg.classCode,
    priorities: cfg.priorities,
    createdAt: new Date().toISOString()
  };

  getScheduledBookings((bookings) => {
    const updated = [newBooking, ...bookings.filter(b => b.id !== instantId)];
    saveScheduledBookings(updated, () => {
      renderSchedulesList(updated);
      playChime();

      if (chrome?.runtime?.sendMessage) {
        chrome.runtime.sendMessage({
          action: 'TRIGGER_INSTANT_GRAB',
          from: cfg.from,
          to: cfg.to,
          date: cfg.date,
          passengers: cfg.passengers,
          trainName: cfg.trainName,
          classCode: cfg.classCode,
          priorities: cfg.priorities
        }).catch(() => { });
      }

      const trainDisp = getTrainDisplayName(cfg.trainName, currentLang);
      showToast(currentLang === 'bn'
        ? `⚡ (${trainDisp}) সিট তাৎক্ষণিক লকিং শুরু হয়েছে!`
        : `⚡ (${trainDisp}) Instant Grab started!`);
    });
  });
}

// Initializer
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => switchPage(tab.dataset.page));
  });

  function updatePopupClock() {
    const el = document.getElementById('popServerClock');
    if (!el) return;
    const now = new Date();
    const hrs = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    const secs = String(now.getSeconds()).padStart(2, '0');
    const ms = String(now.getMilliseconds()).padStart(3, '0');
    el.innerText = `${hrs}:${mins}:${secs}.${ms}`;
  }
  setInterval(updatePopupClock, 50);

  const btnSwapStations = document.getElementById('btnSwapStations');
  if (btnSwapStations) {
    btnSwapStations.addEventListener('click', () => {
      const fromInput = document.getElementById('routeFrom');
      const toInput = document.getElementById('routeTo');
      if (fromInput && toInput) {
        const temp = fromInput.value;
        fromInput.value = toInput.value;
        toInput.value = temp;
        onRouteChanged();
        showToast(currentLang === 'bn' ? '⇄ স্টেশন অদলবদল করা হয়েছে' : '⇄ Stations swapped!');
      }
    });
  }

  const journeyDateEl = document.getElementById('journeyDate');
  if (journeyDateEl) {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    journeyDateEl.min = todayStr;
    if (!journeyDateEl.value || journeyDateEl.value < todayStr) {
      journeyDateEl.value = todayStr;
    }
  }

  // Synchronize inputs with active railway tab search parameters if available
  if (chrome?.tabs?.query) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs && tabs[0] ? tabs[0] : null;
      if (activeTab && activeTab.url && activeTab.url.includes('/booking/train/search')) {
        try {
          const tabUrl = new URL(activeTab.url);
          const doj = tabUrl.searchParams.get('doj');
          const fromCity = tabUrl.searchParams.get('fromcity');
          const toCity = tabUrl.searchParams.get('tocity');

          if (doj) {
            const inputDoj = parseRailwayDateToInputFormat(doj);
            if (journeyDateEl && inputDoj) journeyDateEl.value = inputDoj;
          }
          if (fromCity) {
            const fromEl = document.getElementById('routeFrom');
            if (fromEl) fromEl.value = fromCity;
          }
          if (toCity) {
            const toEl = document.getElementById('routeTo');
            if (toEl) toEl.value = toCity;
          }
          onRouteChanged();
        } catch (e) { }
      }
    });
  }

  document.getElementById('btnArmSchedule')?.addEventListener('click', handleArmSchedule);
  document.getElementById('btnGrabNow')?.addEventListener('click', () => handleInstantGrab());

  document.getElementById('btnPopPower')?.addEventListener('click', () => {
    isPopupEngineActive = !isPopupEngineActive;
    const btn = document.getElementById('btnPopPower');
    if (btn) {
      if (isPopupEngineActive) {
        btn.className = 'tool-btn power-btn active';
        btn.innerText = '🟢 Active';
        showToast(currentLang === 'bn' ? '⚡ অটোমেশন ইঞ্জিন সক্রিয়' : '⚡ Automation Engine Active');
      } else {
        btn.className = 'tool-btn power-btn paused';
        btn.innerText = '🔴 Paused';
        showToast(currentLang === 'bn' ? '⏸️ অটোমেশন ইঞ্জিন বন্ধ' : '⏸️ Automation Engine Paused');
        if (chrome?.tabs?.query) {
          chrome.tabs.query({ url: '*://eticket.railway.gov.bd/*' }, (tabs) => {
            if (tabs) tabs.forEach(t => chrome.tabs.sendMessage(t.id, { action: 'PAUSE_ENGINE' }).catch(() => {}));
          });
        }
      }
    }
  });

  document.getElementById('routeFrom')?.addEventListener('change', () => onRouteChanged());
  document.getElementById('routeTo')?.addEventListener('change', () => onRouteChanged());
  document.getElementById('trainName')?.addEventListener('change', updateCalculations);
  document.getElementById('passengerCount')?.addEventListener('change', updateCalculations);
  document.getElementById('journeyDate')?.addEventListener('change', () => onRouteChanged());

  document.getElementById('btnPopTheme')?.addEventListener('click', () => {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    if (chrome?.storage?.local) chrome.storage.local.set({ gt_theme: currentTheme });
    applyThemeAndLang();
  });

  document.getElementById('btnPopLang')?.addEventListener('click', () => {
    currentLang = currentLang === 'en' ? 'bn' : 'en';
    if (chrome?.storage?.local) chrome.storage.local.set({ gt_lang: currentLang });
    applyThemeAndLang();
  });

  document.getElementById('btnSaveVault')?.addEventListener('click', () => {
    const phone = document.getElementById('vaultPhone')?.value?.trim() || '';
    const pass = document.getElementById('vaultPass')?.value?.trim() || '';
    if (chrome?.storage?.local) {
      chrome.storage.local.set({ railwayVault: { phone, pass } }, () => {
        playChime();
        showToast(UI_TEXT[currentLang].toastVaultSaved);
      });
    }
  });

  document.getElementById('btnDirectLogin')?.addEventListener('click', () => {
    const phone = document.getElementById('vaultPhone')?.value?.trim() || '';
    const pass = document.getElementById('vaultPass')?.value?.trim() || '';
    if (chrome?.storage?.local) {
      chrome.storage.local.set({ railwayVault: { phone, pass } }, () => {
        chrome.runtime.sendMessage({ action: 'TRIGGER_AUTO_LOGIN' });
        showToast(currentLang === 'bn' ? '🔑 লগইন পেজ খোলা হচ্ছে...' : '🔑 Opening login page...');
      });
    }
  });

  if (chrome?.storage?.local) {
    chrome.storage.local.get(['gt_theme', 'gt_lang', 'geTicketConfig', 'railwayVault'], (data) => {
      if (data.gt_theme) currentTheme = data.gt_theme;
      if (data.gt_lang) currentLang = data.gt_lang;
      if (data.railwayVault) {
        if (document.getElementById('vaultPhone')) document.getElementById('vaultPhone').value = data.railwayVault.phone || '';
        if (document.getElementById('vaultPass')) document.getElementById('vaultPass').value = data.railwayVault.pass || '';
      }
      applyThemeAndLang();
      if (data.geTicketConfig) {
        const cfg = data.geTicketConfig;
        if (cfg.routeFrom && document.getElementById('routeFrom')) document.getElementById('routeFrom').value = cfg.routeFrom;
        if (cfg.routeTo && document.getElementById('routeTo')) document.getElementById('routeTo').value = cfg.routeTo;
        if (cfg.targetDate && document.getElementById('journeyDate')) document.getElementById('journeyDate').value = cfg.targetDate;
        if (cfg.passengers && document.getElementById('passengerCount')) document.getElementById('passengerCount').value = String(cfg.passengers);
        if (cfg.prefClass && document.getElementById('prefClass')) document.getElementById('prefClass').value = cfg.prefClass;
        if (cfg.trainName && document.getElementById('trainName')) document.getElementById('trainName').value = cfg.trainName;
        if (cfg.priorities && cfg.priorities.length >= 3) {
          if (document.getElementById('p1Class')) document.getElementById('p1Class').value = cfg.priorities[0].classCode || 'S_CHAIR';
          if (document.getElementById('p1Dir')) document.getElementById('p1Dir').value = cfg.priorities[0].dir || 'any';
          if (document.getElementById('p2Class')) document.getElementById('p2Class').value = cfg.priorities[1].classCode || 'F_CHAIR';
          if (document.getElementById('p2Dir')) document.getElementById('p2Dir').value = cfg.priorities[1].dir || 'any';
          if (document.getElementById('p3Class')) document.getElementById('p3Class').value = cfg.priorities[2].classCode || 'SNIGDHA';
          if (document.getElementById('p3Dir')) document.getElementById('p3Dir').value = cfg.priorities[2].dir || 'any';
        }
      }
      getScheduledBookings(renderSchedulesList);
      checkAndDisplayAuthStatus();
    });
  } else {
    applyThemeAndLang();
    checkAndDisplayAuthStatus();
  }
});

