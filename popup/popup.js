/**
 * GeTicket Pro - Popup Controller
 * Strict Single-Language Purity (Pure English default <-> Pure Bengali)
 * Dual-Mode Engine: Instant Ticket Grab & Advance 8:00 AM Schedule,
 * Live Railway Server API Fetcher, Master Train Database (40+ Trains),
 * Type-To-Search Station Autocomplete, Active Schedules Notification Badge & Manager.
 */

// 1. Comprehensive Bangladesh Railway Stations (All Major Railway Junctions)
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
    { value: "S_CHAIR", text: "Shovon Chair" },
    { value: "SHOVON", text: "Shovon" },
    { value: "SNIGDHA", text: "Snigdha AC" },
    { value: "F_CHAIR", text: "1st Class Chair" },
    { value: "AC_S", text: "AC Seat" },
    { value: "AC_B", text: "AC Berth" }
  ],
  bn: [
    { value: "S_CHAIR", text: "শোভন চেয়ার" },
    { value: "SHOVON", text: "সাধারণ শোভন" },
    { value: "SNIGDHA", text: "স্নিগ্ধা এসি" },
    { value: "F_CHAIR", text: "১ম শ্রেণি চেয়ার" },
    { value: "AC_S", text: "এসি সিট" },
    { value: "AC_B", text: "এসি বার্থ" }
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

// Chronological Train Sorting Engine (Strict AM to PM Ascending Order)
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
    { nameEn: "Silkcity Express", nameBn: "সিল্কসিটি এক্সপ্রেস", code: "753", dep: "02:45 PM", arr: "08:35 PM", durationEn: "5h 50m", durationBn: "৫ ঘণ্টা ৫০ মি.", offDay: 0, offEn: "Sunday", offBn: "রবিবার" },
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
const UI_TEXT = {
  en: {
    hdrTitle: "GeTicket Pro",
    hdrStatus: "● Stealth Safe",
    tabSetup: "🎯 Setup",
    tabSchedules: "📅 Lists",
    tabPriority: "⚡ Priority",
    tabVault: "🔐 Vault",
    lblModeInstant: "Instant Buy Now",
    lblModeSchedule: "Advance 8:00 AM",
    pillToday: "Today",
    pillTomorrow: "Tomorrow",
    pill3Days: "3 Days",
    pill5Days: "5 Days",
    pill7Days: "7 Days",
    pill10Days: "10 Days",
    lblFrom: "From Station",
    lblTo: "To Station",
    lblDate: "Journey Date",
    lblPax: "Passengers",
    lblTrain: "Train Name",
    lblClass: "Coach Class",
    lblTotalFareText: "Total in bKash:",
    btnActionInstant: "⚡ Instant Grab & Lock Seats",
    btnActionSchedule: "⏰ Arm Schedule & Set Alarm",
    lblSchedTitle: "Scheduled Bookings",
    lblNoSched: "No active schedules",
    lblNoSchedSub: "Switch to Advance 8:00 AM mode on Setup tab to arm an automatic ticket alarm.",
    lblPrioTitle: "Cascading Rules",
    lblPrioHint: "Auto-Shift",
    tagP1: "Priority 1 (First)",
    statP1: "● Primary Target",
    tagP2: "Priority 2 (Fallback)",
    statP2: "● 1ms Failover",
    tagP3: "Priority 3 (Backup)",
    statP3: "● Last Resort",
    btnSavePrioText: "Save Priority Rules",
    lblVaultTitle: "Account Vault",
    lblVaultHint: "Encrypted",
    lblVaultPhone: "Railway Mobile",
    lblVaultPass: "Password",
    lblVaultGuardHead: "✓ Anti-Logout Guard Active",
    lblVaultGuardDesc: "Keeps your railway session warm from 7:50 AM to prevent unexpected logout during morning peak rush.",
    btnSaveVaultText: "Save to Vault",
    toastSchedSaved: "✓ Schedule Armed & Added to List!",
    toastSchedDeleted: "✓ Schedule Removed",
    toastPrioSaved: "✓ Priority Rules Saved!",
    toastVaultSaved: "🔒 Railway Account Saved in Vault!",
    serverSynced: "Railway Live Server Synced",
    dbActive: "Master Railway Database Active",
    searchingLive: "Querying Live Railway API...",
    noDirectTrain: "No direct trains operate between these two stations.",
    soldOut: "Sold Out (0 Seats Available)"
  },
  bn: {
    hdrTitle: "জি-টিকিট প্রো",
    hdrStatus: "● সুরক্ষিত স্টিলথ",
    tabSetup: "🎯 সেটআপ",
    tabSchedules: "📅 শিডিউল",
    tabPriority: "⚡ প্রায়োরিটি",
    tabVault: "🔐 ভল্ট",
    lblModeInstant: "রিলিজ টিকিট এখনই কাটুন",
    lblModeSchedule: "অগ্রিম সকাল ৮:০০ শিডিউল",
    pillToday: "আজকের",
    pillTomorrow: "আগামীকাল",
    pill3Days: "৩ দিন",
    pill5Days: "৫ দিন",
    pill7Days: "৭ দিন",
    pill10Days: "১০ দিন",
    lblFrom: "যাত্রার স্টেশন",
    lblTo: "গন্তব্য স্টেশন",
    lblDate: "যাত্রার তারিখ",
    lblPax: "যাত্রী সংখ্যা",
    lblTrain: "ট্রেনের নাম",
    lblClass: "বসার শ্রেণি",
    lblTotalFareText: "বিকাশে সর্বমোট:",
    btnActionInstant: "⚡ রিলিজকৃত টিকিট এখনই কাটুন",
    btnActionSchedule: "⏰ শিডিউল ও অ্যালার্ম সেট করুন",
    lblSchedTitle: "নির্ধারিত শিডিউল তালিকা",
    lblNoSched: "কোনো সক্রিয় শিডিউল নেই",
    lblNoSchedSub: "সেটআপ ট্যাব থেকে অগ্রিম শিডিউল যুক্ত করলে সকাল ০৭:৫০ এ স্বয়ংক্রিয় অ্যালার্ম বাজবে।",
    lblPrioTitle: "ক্যাসকেডিং প্রায়োরিটি রুল",
    lblPrioHint: "অটো-সুইচ",
    tagP1: "প্রায়োরিটি ১ (প্রথম পছন্দ)",
    statP1: "● মূল টার্গেট",
    tagP2: "প্রায়োরিটি ২ (দ্বিতীয় পছন্দ)",
    statP2: "● ১ মিলিসেকেন্ড সুইচ",
    tagP3: "প্রায়োরিটি ৩ (ব্যাকআপ)",
    statP3: "● শেষ বিকল্প",
    btnSavePrioText: "প্রায়োরিটি রুল সেভ করুন",
    lblVaultTitle: "সুরক্ষিত ভল্ট",
    lblVaultHint: "এনক্রিপ্টেড",
    lblVaultPhone: "রেলওয়ে মোবাইল নম্বর",
    lblVaultPass: "পাসওয়ার্ড",
    lblVaultGuardHead: "✓ অ্যান্টি-লগআউট সেশন গার্ড সক্রিয়",
    lblVaultGuardDesc: "সকাল ৭:৫০ থেকে ব্রাউজার সেশন সচল রাখবে যাতে ৮টার ভিড়ে লগআউট না হয়ে যায়।",
    btnSaveVaultText: "ভল্টে সেভ করুন",
    toastSchedSaved: "✓ শিডিউল ও অ্যালার্ম যুক্ত হয়েছে!",
    toastSchedDeleted: "✓ শিডিউল মুছে ফেলা হয়েছে",
    toastPrioSaved: "✓ প্রায়োরিটি রুল সেভ হয়েছে!",
    toastVaultSaved: "🔒 অ্যাকাউন্ট লোকাল ভল্টে সংরক্ষিত!",
    serverSynced: "রেলওয়ে লাইভ সার্ভার সংযুক্ত",
    dbActive: "রেলওয়ে মাস্টার ডাটাবেজ সক্রিয়",
    searchingLive: "রেলওয়ে লাইভ সার্ভার খোঁজা হচ্ছে...",
    noDirectTrain: "এই রুটে কোনো সরাসরি ট্রেন চলাচল করে না।",
    soldOut: "বুকিং শেষ (০ টি সিট খালি)"
  }
};

let currentTheme = 'light';
let currentLang = 'en';
let currentMode = 'instant'; // 'instant' | 'schedule'
let liveServerData = null; // Caches real API response from railway server
let isCurrentRouteValid = true;

// Web Audio API Chime
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
  } catch (e) {}
}

// Helper: Page Switcher
function switchPage(pageId) {
  document.querySelectorAll('.nav-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.page === pageId);
  });
  document.querySelectorAll('.page-view').forEach(p => {
    p.classList.toggle('active', p.id === `page-${pageId}`);
  });
}
window.switchPage = switchPage;

// Helper: Toast Message
function showToast(msg) {
  const toast = document.getElementById('statusToast');
  if (toast) {
    toast.innerText = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2400);
  }
}

// Helper: Update Badge Everywhere (Header, Tab, Toolbar Icon)
function updateBadgeCount(count) {
  const num = parseInt(count, 10) || 0;

  const lblBadge = document.getElementById('lblBadgeCount');
  if (lblBadge) lblBadge.innerText = String(num);

  const miniBadge = document.getElementById('miniBadgeCount');
  if (miniBadge) miniBadge.innerText = String(num);

  const schedCount = document.getElementById('lblSchedCount');
  if (schedCount) {
    schedCount.innerText = currentLang === 'bn' ? `${num} টি সক্রিয়` : `${num} Active`;
  }

  if (chrome?.action?.setBadgeText) {
    chrome.action.setBadgeText({ text: num > 0 ? String(num) : '' });
    chrome.action.setBadgeBackgroundColor({ color: '#0284c7' });
  }

  if (chrome?.runtime?.sendMessage) {
    chrome.runtime.sendMessage({ action: 'SYNC_BADGE', count: num }).catch(() => {});
  }
}

// Storage Helpers
function getScheduledBookings(callback) {
  if (chrome?.storage?.local) {
    chrome.storage.local.get(['scheduledBookings'], (res) => {
      if (Array.isArray(res?.scheduledBookings)) {
        try { localStorage.setItem('scheduledBookings', JSON.stringify(res.scheduledBookings)); } catch (e) {}
        callback(res.scheduledBookings);
      } else {
        try {
          const raw = localStorage.getItem('scheduledBookings') || '[]';
          callback(JSON.parse(raw));
        } catch (e) {
          callback([]);
        }
      }
    });
  } else {
    try {
      const raw = localStorage.getItem('scheduledBookings') || '[]';
      callback(JSON.parse(raw));
    } catch (e) {
      callback([]);
    }
  }
}

function saveScheduledBookings(list, callback) {
  const safeList = Array.isArray(list) ? list : [];
  try {
    localStorage.setItem('scheduledBookings', JSON.stringify(safeList));
  } catch (e) {}

  updateBadgeCount(safeList.length);

  try {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'SYNC_SCHEDULES', count: safeList.length }, '*');
    }
  } catch (e) {}

  if (chrome?.storage?.local) {
    chrome.storage.local.set({ scheduledBookings: safeList }, () => {
      if (callback) callback();
    });
  } else {
    if (callback) callback();
  }
}

// Language Name Resolvers (Smart Prefix, Abbreviation & Fuzzy Autocomplete)
function resolveStationValue(inputVal) {
  if (!inputVal) return "Dhaka";
  const trimmed = inputVal.trim().toLowerCase();

  // Fast Abbreviation & Prefix Aliases
  if (trimmed === 'dhk' || trimmed === 'dha' || trimmed === 'ঢা') return 'Dhaka';
  if (trimmed === 'ctg' || trimmed === 'chi' || trimmed === 'chattogram' || trimmed === 'chattagram' || trimmed === 'chittagong' || trimmed === 'চট' || trimmed === 'চট্টগ্রাম') return 'Chattogram';
  if (trimmed === 'jmp' || trimmed === 'jam' || trimmed === 'jamal' || trimmed === 'জা' || trimmed === 'জাম') return 'Jamalpur';
  if (trimmed === 'mym' || trimmed === 'mmn' || trimmed === 'ময়' || trimmed === 'ময়') return 'Mymensingh';
  if (trimmed === 'cox' || trimmed === 'কক্স') return "Cox's Bazar";
  if (trimmed === 'syl' || trimmed === 'সি') return 'Sylhet';
  if (trimmed === 'raj' || trimmed === 'রাজ') return 'Rajshahi';
  if (trimmed === 'khu' || trimmed === 'খুল') return 'Khulna';
  if (trimmed === 'ran' || trimmed === 'রং') return 'Rangpur';
  if (trimmed === 'din' || trimmed === 'দিনা') return 'Dinajpur';
  if (trimmed === 'pan' || trimmed === 'পঞ্চ') return 'Panchagarh';
  if (trimmed === 'ben' || trimmed === 'বেনা') return 'Benapole';
  if (trimmed === 'ishw' || trimmed === 'ঈশ্বর') return 'Ishwardi';
  if (trimmed === 'bog' || trimmed === 'বগু') return 'Bogra';
  if (trimmed === 'com' || trimmed === 'cumilla' || trimmed === 'comilla' || trimmed === 'কুমি' || trimmed === 'কুমিল্লা') return 'Cumilla';
  if (trimmed === 'fen' || trimmed === 'ফেন' || trimmed === 'ফেনী') return 'Feni';
  if (trimmed === 'sree' || trimmed === 'শ্রী') return 'Sreemangal';

  // 1. Exact Match
  for (const s of STATIONS.en) {
    if (s.value.toLowerCase() === trimmed || s.text.toLowerCase() === trimmed) return s.value;
  }
  for (const s of STATIONS.bn) {
    if (s.text === inputVal.trim() || s.value.toLowerCase() === trimmed) return s.value;
  }

  // 2. StartsWith Prefix Match
  for (const s of STATIONS.en) {
    if (s.value.toLowerCase().startsWith(trimmed) || s.text.toLowerCase().startsWith(trimmed)) return s.value;
  }
  for (const s of STATIONS.bn) {
    if (s.text.startsWith(inputVal.trim())) return s.value;
  }

  return inputVal.trim();
}

function getStationName(val, lang) {
  const list = STATIONS[lang] || STATIONS.en;
  const item = list.find(s => s.value === val);
  return item ? item.text : val;
}

function getClassName(val, lang) {
  const list = CLASSES_OPTS[lang] || CLASSES_OPTS.en;
  const item = list.find(c => c.value === val);
  return item ? item.text : val;
}

function getTrainDisplayName(nameEn, lang) {
  for (const route in ROUTE_TRAIN_MAP) {
    const found = ROUTE_TRAIN_MAP[route].find(t => t.nameEn === nameEn);
    if (found) {
      return lang === 'bn' ? `${found.nameBn} (${found.code})` : `${found.nameEn} (${found.code})`;
    }
  }
  return nameEn;
}

// Render Page 2: Active Schedules List
function renderSchedulesList(schedules) {
  const container = document.getElementById('schedulesContainer');
  const empty = document.getElementById('emptyScheduleState');
  if (!container) return;

  container.innerHTML = '';
  updateBadgeCount(schedules.length);

  if (!schedules || schedules.length === 0) {
    if (empty) empty.style.display = 'block';
    return;
  }

  if (empty) empty.style.display = 'none';

  schedules.forEach((item) => {
    try {
      const card = document.createElement('div');
      card.className = 'schedule-card-item';

      const fromStation = getStationName(item.from, currentLang);
      const toStation = getStationName(item.to, currentLang);
      const trainDisplay = getTrainDisplayName(item.trainName, currentLang);
      const isWestRoute = item.zone === 'west' || ['Rajshahi', 'Khulna', 'Rangpur', 'Dinajpur', 'Panchagarh', 'Benapole', 'Ishwardi', 'Bogra'].includes(item.to);
      const alarmTime = item.alarmTime || (isWestRoute ? '07:50 AM' : '01:50 PM');
      const zoneNameStr = isWestRoute 
        ? (currentLang === 'bn' ? 'পশ্চিমাঞ্চল' : 'West Zone') 
        : (currentLang === 'bn' ? 'পূর্বাঞ্চল' : 'East Zone');
      const alarmTimeText = currentLang === 'bn' ? `⏰ অ্যালার্ম: ${alarmTime} (${zoneNameStr} সক্রিয়)` : `⏰ Alarm: ${alarmTime} (${zoneNameStr} Armed)`;

      const paxCount = item.passengers || 1;
      const paxText = currentLang === 'bn' ? `${paxCount} জন যাত্রী` : `${paxCount} Pax`;
      const classDisplay = (CLASSES_OPTS[currentLang] || CLASSES_OPTS.en).find(c => c.value === item.classCode)?.text || item.classCode || 'Shovon Chair';

      card.innerHTML = `
        <div style="flex: 1; padding-right: 8px;">
          <div class="sched-info-title">🚄 ${trainDisplay}</div>
          <div class="sched-info-meta">📍 ${fromStation} ➔ ${toStation}</div>
          <div class="sched-info-meta">📅 ${item.date} • 👥 ${paxText} • 💺 ${classDisplay}</div>
          <div class="sched-info-meta" style="color: var(--success); font-weight: 700; margin-top: 4px;">${alarmTimeText}</div>
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
    } catch(err) {
      console.error('Error rendering schedule card:', err);
    }
  });
}

function deleteSchedule(id) {
  getScheduledBookings((bookings) => {
    const updated = bookings.filter(b => b.id !== id);
    saveScheduledBookings(updated, () => {
      renderSchedulesList(updated);
      if (chrome?.runtime?.sendMessage) {
        chrome.runtime.sendMessage({ action: 'CANCEL_SCHEDULE', id }).catch(() => {});
      }
      showToast(UI_TEXT[currentLang].toastSchedDeleted);
    });
  });
}

// 5. Live Railway Server API Integration (Real Fares, Real Trains, Real Seat Counts)
async function fetchLiveTrainsFromServer(fromStation, toStation, journeyDate) {
  const statusText = document.getElementById('lblServerStatusText');
  const statusDot = document.getElementById('serverStatusDot');

  if (statusText) statusText.innerText = UI_TEXT[currentLang].searchingLive;
  if (statusDot) statusDot.style.color = '#f59e0b';

  return new Promise((resolve) => {
    // 1. Attempt via Chrome Runtime background proxy (No CORS restrictions)
    if (chrome?.runtime?.sendMessage) {
      chrome.runtime.sendMessage({
        action: 'FETCH_RAILWAY_LIVE_API',
        from: fromStation,
        to: toStation,
        date: journeyDate
      }, (response) => {
        if (response && response.success && response.data?.trains && response.data.trains.length > 0) {
          liveServerData = response.data;
          if (statusText) statusText.innerText = `${UI_TEXT[currentLang].serverSynced} (${response.data.trains.length} Trains)`;
          if (statusDot) statusDot.style.color = '#10b981';
          resolve(response.data.trains);
        } else {
          fallbackToMasterDb();
        }
      });
    } else {
      // 2. Direct browser fetch if on railway domain or local preview
      const apiUrl = `https://eticket.railway.gov.bd/api/v1/booking/train-search?from_station=${encodeURIComponent(fromStation)}&to_station=${encodeURIComponent(toStation)}&journey_date=${encodeURIComponent(journeyDate)}&select_class=S_CHAIR`;
      fetch(apiUrl, { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
          if (data && data.trains && data.trains.length > 0) {
            liveServerData = data;
            if (statusText) statusText.innerText = `${UI_TEXT[currentLang].serverSynced} (${data.trains.length} Trains)`;
            if (statusDot) statusDot.style.color = '#10b981';
            resolve(data.trains);
          } else {
            fallbackToMasterDb();
          }
        })
        .catch(() => {
          fallbackToMasterDb();
        });
    }

    function fallbackToMasterDb() {
      const routeKey = `${fromStation}-${toStation}`;
      const fallbackList = ROUTE_TRAIN_MAP[routeKey];
      if (statusText) {
        if (fallbackList && fallbackList.length > 0) {
          statusText.innerText = `${UI_TEXT[currentLang].dbActive} (${fallbackList.length} Trains)`;
          if (statusDot) statusDot.style.color = '#10b981';
        } else {
          statusText.innerText = currentLang === 'bn' ? 'সরাসরি কোনো ট্রেন নেই' : 'No Direct Route';
          if (statusDot) statusDot.style.color = '#ef4444';
        }
      }
      resolve(null);
    }
  });
}

// Main Controller Initializer
document.addEventListener('DOMContentLoaded', () => {

  // Tab navigation
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      switchPage(tab.dataset.page);
    });
  });

  // Top header active schedules button click
  const btnActiveSchedules = document.getElementById('btnActiveSchedules');
  if (btnActiveSchedules) {
    btnActiveSchedules.addEventListener('click', () => {
      switchPage('schedules');
    });
  }

  // Booking Mode Switcher (Instant Buy Now vs Advance 8:00 AM)
  const btnModeInstant = document.getElementById('btnModeInstant');
  const btnModeSchedule = document.getElementById('btnModeSchedule');
  const btnMainAction = document.getElementById('btnMainAction');
  const btnMainActionText = document.getElementById('btnMainActionText');
  const instantSeatsCard = document.getElementById('instantSeatsCard');

  function setBookingMode(mode) {
    currentMode = mode;
    if (mode === 'instant') {
      btnModeInstant.classList.add('active');
      btnModeSchedule.classList.remove('active');
      btnMainActionText.innerText = UI_TEXT[currentLang].btnActionInstant;
      if (instantSeatsCard) instantSeatsCard.style.display = isCurrentRouteValid ? 'block' : 'none';
    } else {
      btnModeSchedule.classList.add('active');
      btnModeInstant.classList.remove('active');
      btnMainActionText.innerText = UI_TEXT[currentLang].btnActionSchedule;
      if (instantSeatsCard) instantSeatsCard.style.display = 'none';
    }
  }

  btnModeInstant.addEventListener('click', () => setBookingMode('instant'));
  btnModeSchedule.addEventListener('click', () => setBookingMode('schedule'));

  // Quick Swap Stations Button (⇄) - Clean & Instant Without Rotation
  const btnSwapStations = document.getElementById('btnSwapStations');
  if (btnSwapStations) {
    btnSwapStations.addEventListener('click', () => {
      const fromInput = document.getElementById('routeFrom');
      const toInput = document.getElementById('routeTo');
      const temp = fromInput.value;
      fromInput.value = toInput.value;
      toInput.value = temp;

      onRouteChanged();
      showToast(currentLang === 'bn' ? '⇄ স্টেশন অদলবদল করা হয়েছে' : '⇄ Stations swapped!');
    });
  }

  // Two-way Date Synchronizer (Quick Day Chips <-> Manual Date Picker)
  function syncQuickDayWithDate(dateVal) {
    if (!dateVal) return;
    const target = new Date(dateVal + 'T00:00:00');
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diffDays = Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    const dayChips = document.querySelectorAll('.day-chip');
    let matched = false;
    dayChips.forEach(chip => {
      const chipDay = parseInt(chip.dataset.day, 10);
      if (chipDay === diffDays) {
        chip.classList.add('active');
        matched = true;
      } else {
        chip.classList.remove('active');
      }
    });
    if (!matched) {
      dayChips.forEach(chip => chip.classList.remove('active'));
    }

    if (diffDays <= 2 && diffDays >= 0) {
      setBookingMode('instant');
    } else if (diffDays > 2) {
      setBookingMode('schedule');
    }
  }

  // Refresh server trains button
  document.getElementById('btnRefreshServer').addEventListener('click', () => {
    onRouteChanged(true);
    showToast(currentLang === 'bn' ? '🔄 লাইভ ট্রেনের তথ্য রিফ্রেশ করা হচ্ছে...' : '🔄 Refreshing live trains from Railway Server...');
  });

  // Quick Day Chips
  const dayChips = document.querySelectorAll('.day-chip');
  dayChips.forEach(chip => {
    chip.addEventListener('click', () => {
      dayChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const offset = parseInt(chip.dataset.day, 10);
      const d = new Date();
      d.setDate(d.getDate() + offset);
      document.getElementById('journeyDate').value = d.toISOString().split('T')[0];

      if (offset <= 2) {
        setBookingMode('instant');
      }
      onRouteChanged();
    });
  });

  const today = new Date();
  document.getElementById('journeyDate').value = today.toISOString().split('T')[0];

  // Route Change Listener (with Live Server API Sync & Route Validity Verification)
  async function onRouteChanged(forceServerSync = false) {
    const rawFrom = document.getElementById('routeFrom').value;
    const rawTo = document.getElementById('routeTo').value;
    const dateVal = document.getElementById('journeyDate').value;

    const from = resolveStationValue(rawFrom);
    const to = resolveStationValue(rawTo);
    const routeKey = `${from}-${to}`;

    const trainDropdown = document.getElementById('trainName');
    const curTrain = trainDropdown.value;
    const timingBox = document.getElementById('miniTimingBox');
    const warningBox = document.getElementById('routeWarningBox');

    let trains = [];

    // 1. Attempt live server fetch
    const liveTrains = await fetchLiveTrainsFromServer(from, to, dateVal);
    if (liveTrains && liveTrains.length > 0) {
      trains = liveTrains.map(lt => ({
        nameEn: lt.train_name || lt.name,
        nameBn: lt.train_name_bn || lt.train_name || lt.name,
        code: lt.train_model || lt.train_id || "700",
        dep: lt.departure_time || "08:00 AM",
        arr: lt.arrival_time || "02:00 PM",
        durationEn: lt.travel_time || "6h 00m",
        durationBn: lt.travel_time || "৬ ঘণ্টা",
        offDay: -1,
        offEn: "No Off-Day",
        offBn: "কোনো বন্ধ নেই",
        seatTypes: lt.seat_types || []
      }));
    } else {
      // 2. Fallback to our master database
      trains = ROUTE_TRAIN_MAP[routeKey] || [];
    }

    // Ensure trains are strictly sorted by departure time (AM to PM)
    trains = sortTrainsChronologically(trains);

    trainDropdown.innerHTML = '';

    // Route Validation: Check if any direct train exists
    if (!trains || trains.length === 0) {
      isCurrentRouteValid = false;
      const noTrainOpt = document.createElement('option');
      noTrainOpt.disabled = true;
      noTrainOpt.selected = true;
      noTrainOpt.value = '';
      noTrainOpt.innerText = currentLang === 'bn' ? 'কোনো সরাসরি ট্রেন নেই' : 'No direct trains available';
      trainDropdown.appendChild(noTrainOpt);

      if (timingBox) timingBox.style.display = 'none';
      if (warningBox) warningBox.style.display = 'flex';
      if (instantSeatsCard) instantSeatsCard.style.display = 'none';
      btnMainAction.disabled = true;
      btnMainAction.style.opacity = '0.5';

      document.getElementById('lblTotalFareVal').innerText = 'N/A';
      document.getElementById('lblFareAdvice').innerText = currentLang === 'bn' 
        ? 'এই রুটে টিকিট কেনা সম্ভব নয়' 
        : 'Ticket booking unavailable on this route';
      return;
    }

    // Route is Valid: Populate Trains
    isCurrentRouteValid = true;
    if (timingBox) timingBox.style.display = 'block';
    if (warningBox) warningBox.style.display = 'none';
    if (instantSeatsCard && currentMode === 'instant') instantSeatsCard.style.display = 'block';
    btnMainAction.disabled = false;
    btnMainAction.style.opacity = '1';

    trains.forEach((t, idx) => {
      const trainName = currentLang === 'bn' ? t.nameBn : t.nameEn;
      const depLabel = currentLang === 'bn' ? 'ছাড়ার সময়' : 'Dep';
      const opt = document.createElement('option');
      opt.value = t.nameEn;
      opt.innerText = `${trainName} (${t.code}) - ${depLabel}: ${t.dep}`;
      if (t.nameEn === curTrain || idx === 0) opt.selected = true;
      trainDropdown.appendChild(opt);
    });

    updateCalculations();
  }

  // Live Calculations (Timings, Fares, and Instant Available Seats Grid)
  function updateCalculations() {
    if (!isCurrentRouteValid) return;

    const rawFrom = document.getElementById('routeFrom').value;
    const rawTo = document.getElementById('routeTo').value;
    const from = resolveStationValue(rawFrom);
    const to = resolveStationValue(rawTo);
    const trainKey = document.getElementById('trainName').value;
    const dateVal = document.getElementById('journeyDate').value;
    const pax = parseInt(document.getElementById('passengerCount').value, 10) || 1;
    const chosenClass = document.getElementById('prefClass').value || 'S_CHAIR';

    const routeKey = `${from}-${to}`;
    const availableTrains = ROUTE_TRAIN_MAP[routeKey] || [];
    const train = availableTrains.find(t => t.nameEn === trainKey) || availableTrains[0];

    // Update Timetable Box
    if (train) {
      document.getElementById('timingDep').innerText = train.dep;
      document.getElementById('timingArr').innerText = train.arr;

      const durationText = currentLang === 'bn' ? train.durationBn : train.durationEn;
      const trainName = currentLang === 'bn' ? train.nameBn : train.nameEn;
      const offDayName = currentLang === 'bn' ? train.offBn : train.offEn;

      const selectedDate = new Date(dateVal + 'T00:00:00');
      const dayOfWeek = selectedDate.getDay();
      const isOffDay = (train.offDay === dayOfWeek);

      const offLabel = currentLang === 'bn' ? 'বন্ধ' : 'Off';
      if (isOffDay) {
        const warnText = currentLang === 'bn' ? `⚠️ বন্ধের দিন!` : `⚠️ Off-day!`;
        document.getElementById('timingMeta').innerHTML = `<span style="color: var(--danger); font-weight: 700;">${warnText} ${trainName} (${offLabel}: ${offDayName})</span>`;
      } else {
        document.getElementById('timingMeta').innerText = `${trainName} (${train.code}) • ${durationText} • ${offLabel}: ${offDayName}`;
      }
    }

    // Update Official Railway Release Zone
    const WEST_STATIONS = ['Rajshahi', 'Khulna', 'Rangpur', 'Dinajpur', 'Panchagarh', 'Benapole', 'Ishwardi', 'Bogra'];
    const isWest = WEST_STATIONS.includes(to) || WEST_STATIONS.includes(from);
    const zoneNameEl = document.getElementById('lblZoneName');
    const zoneRelEl = document.getElementById('lblZoneRelease');
    const schedModeLabel = document.getElementById('lblModeSchedule');

    if (zoneNameEl && zoneRelEl) {
      if (isWest) {
        zoneNameEl.innerText = currentLang === 'bn' ? 'পশ্চিমাঞ্চল (West Zone)' : 'Western Zone (পশ্চিমাঞ্চল)';
        zoneRelEl.innerText = currentLang === 'bn' ? 'সকাল ০৮:০০:০০ টা' : '08:00 AM Sharp';
        zoneRelEl.style.background = 'var(--primary)';
        if (schedModeLabel) schedModeLabel.innerText = currentLang === 'bn' ? 'অগ্রিম ০৮:০০ টা' : 'Advance 8:00 AM';
      } else {
        zoneNameEl.innerText = currentLang === 'bn' ? 'পূর্বাঞ্চল (East Zone)' : 'Eastern Zone (পূর্বাঞ্চল)';
        zoneRelEl.innerText = currentLang === 'bn' ? 'দুপুর ০২:০০:০০ টা' : '02:00 PM Sharp';
        zoneRelEl.style.background = '#8b5cf6';
        if (schedModeLabel) schedModeLabel.innerText = currentLang === 'bn' ? 'অগ্রিম ০২:০০ টা' : 'Advance 2:00 PM';
      }
    }

    // Determine Exact Fare: Check Live Server seat_types first, then fallback to FARE_RATES
    let unitPrice = 205;
    if (liveServerData?.trains) {
      const liveTrain = liveServerData.trains.find(lt => (lt.train_name || lt.name) === trainKey);
      if (liveTrain?.seat_types) {
        const match = liveTrain.seat_types.find(st => st.type === chosenClass);
        if (match && match.fare) unitPrice = match.fare;
      }
    } else {
      const routeFares = FARE_RATES[routeKey] || FARE_RATES["Dhaka-Jamalpur"];
      unitPrice = routeFares[chosenClass] || 205;
    }

    const baseTotal = unitPrice * pax;
    const serviceCharge = 20 * pax;
    const subtotal = baseTotal + serviceCharge;
    const bkashFee = Math.round(subtotal * 0.015);
    const totalPay = subtotal + bkashFee;
    const recommended = Math.ceil((totalPay + 5) / 10) * 10;

    document.getElementById('lblTotalFareVal').innerText = `৳${totalPay}`;

    if (currentLang === 'bn') {
      document.getElementById('lblFareAdvice').innerText = `সকাল ৮:০০ টার আগে বিকাশে অন্তত ৳${recommended} ব্যালেন্স রাখুন`;
    } else {
      document.getElementById('lblFareAdvice').innerText = `Keep at least ৳${recommended} in bKash before 8:00 AM`;
    }

    // Populate Instant Available Seats Breakdown Grid
    renderInstantSeatsGrid(chosenClass, trainKey);
  }

  // Render Instant Seats Breakdown
  function renderInstantSeatsGrid(selectedClass, trainKey) {
    const grid = document.getElementById('instantSeatsGrid');
    if (!grid) return;

    const dateVal = document.getElementById('journeyDate').value;
    const targetDate = new Date(dateVal + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.round((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // Zero-Dummy Policy: Default to 0 / Sold Out for running/current dates unless real live server data is present
    let seatsAvailable = {
      S_CHAIR: 0,
      SHOVON: 0,
      SNIGDHA: 0,
      F_CHAIR: 0,
      AC_S: 0,
      AC_B: 0
    };
    let isLiveOnline = false;

    if (liveServerData?.trains) {
      const liveTrain = liveServerData.trains.find(lt => (lt.train_name || lt.name) === trainKey);
      if (liveTrain?.seat_types) {
        isLiveOnline = true;
        liveTrain.seat_types.forEach(st => {
          seatsAvailable[st.type] = Number(st.seat_counts?.online ?? 0);
        });
      }
    }

    const classKeys = ['S_CHAIR', 'SNIGDHA', 'F_CHAIR', 'AC_S', 'SHOVON', 'AC_B'];
    grid.innerHTML = '';

    classKeys.forEach(code => {
      const avail = seatsAvailable[code] || 0;
      const chip = document.createElement('div');
      chip.className = `seat-class-chip ${code === selectedClass ? 'matched' : ''}`;

      const name = getClassName(code, currentLang);
      let availText = '';
      if (isLiveOnline) {
        availText = avail > 0 ? `${avail}` : (currentLang === 'bn' ? '০ (বুকড)' : '0 (Sold)');
      } else if (diffDays > 2) {
        availText = currentLang === 'bn' ? '৮:০০ AM' : '08:00 AM';
      } else {
        availText = currentLang === 'bn' ? '০ (বুকড)' : '0 (Sold)';
      }

      chip.innerHTML = `
        <span class="seat-class-name">${name}</span>
        <span class="seat-avail-count ${avail === 0 ? 'empty' : ''}">${availText}</span>
      `;

      chip.addEventListener('click', () => {
        document.getElementById('prefClass').value = code;
        const p1 = document.getElementById('p1Class');
        if (p1) p1.value = code;
        updateCalculations();
      });

      grid.appendChild(chip);
    });

    const p1Class = document.getElementById('p1Class').value;
    const matchedEl = document.getElementById('lblMatchedPriority');
    if (matchedEl) {
      const p1Name = getClassName(p1Class, currentLang);
      matchedEl.innerText = currentLang === 'bn' ? `🎯 প্রায়োরিটি ১ মিল: ${p1Name}` : `🎯 P1 Matched: ${p1Name}`;
    }
  }

  // Populate Dropdown Options and Datalist Autocomplete
  function populateDropdowns() {
    const fromInput = document.getElementById('routeFrom');
    const toInput = document.getElementById('routeTo');
    const dlistFrom = document.getElementById('stationListFrom');
    const dlistTo = document.getElementById('stationListTo');
    const paxSel = document.getElementById('passengerCount');
    const prefClass = document.getElementById('prefClass');

    const p1Class = document.getElementById('p1Class');
    const p2Class = document.getElementById('p2Class');
    const p3Class = document.getElementById('p3Class');

    const p1Dir = document.getElementById('p1Dir');
    const p2Dir = document.getElementById('p2Dir');
    const p3Dir = document.getElementById('p3Dir');

    const curFrom = fromInput.value ? resolveStationValue(fromInput.value) : "Dhaka";
    const curTo = toInput.value ? resolveStationValue(toInput.value) : "Jamalpur";
    const curPax = paxSel.value || "2";
    const curPref = prefClass.value || "S_CHAIR";

    const curP1C = p1Class.value || "S_CHAIR";
    const curP2C = p2Class.value || "SNIGDHA";
    const curP3C = p3Class.value || "F_CHAIR";

    const curP1D = p1Dir.value || "straight";
    const curP2D = p2Dir.value || "middle";
    const curP3D = p3Dir.value || "any";

    // Station Datalists (Allows typing to search on mobile and PC)
    dlistFrom.innerHTML = '';
    dlistTo.innerHTML = '';
    STATIONS[currentLang].forEach(s => {
      dlistFrom.appendChild(new Option(s.text, s.text));
      dlistTo.appendChild(new Option(s.text, s.text));
    });

    fromInput.value = getStationName(curFrom, currentLang);
    toInput.value = getStationName(curTo, currentLang);

    // Passengers
    paxSel.innerHTML = '';
    PASSENGERS_OPTS[currentLang].forEach(p => {
      paxSel.appendChild(new Option(p.text, p.value));
    });
    paxSel.value = curPax;

    // Preferred Class & Priority Classes
    [prefClass, p1Class, p2Class, p3Class].forEach(sel => {
      sel.innerHTML = '';
      CLASSES_OPTS[currentLang].forEach(c => {
        sel.appendChild(new Option(c.text, c.value));
      });
    });
    prefClass.value = curPref;
    p1Class.value = curP1C;
    p2Class.value = curP2C;
    p3Class.value = curP3C;

    // Directions
    [p1Dir, p2Dir, p3Dir].forEach(sel => {
      sel.innerHTML = '';
      DIRECTIONS_OPTS[currentLang].forEach(d => {
        sel.appendChild(new Option(d.text, d.value));
      });
    });
    p1Dir.value = curP1D;
    p2Dir.value = curP2D;
    p3Dir.value = curP3D;
  }

  // Apply Theme & Language
  function applyThemeAndLang() {
    document.documentElement.setAttribute('data-theme', currentTheme);
    document.documentElement.setAttribute('data-lang', currentLang);

    document.getElementById('btnPopTheme').innerText = currentTheme === 'light' ? '☀️' : '🌙';
    document.getElementById('btnPopLang').innerText = currentLang === 'en' ? 'EN' : 'বাং';

    const t = UI_TEXT[currentLang];
    document.getElementById('hdrTitle').innerText = t.hdrTitle;
    document.getElementById('hdrStatus').innerText = t.hdrStatus;

    // Mode Switcher
    document.getElementById('lblModeInstant').innerText = t.lblModeInstant;
    document.getElementById('lblModeSchedule').innerText = t.lblModeSchedule;

    // Tabs
    const tabSetup = document.getElementById('tabSetup');
    tabSetup.childNodes[0].nodeValue = t.tabSetup + ' ';

    const tabSched = document.getElementById('tabSchedules');
    tabSched.childNodes[0].nodeValue = t.tabSchedules + ' ';

    const tabPrio = document.getElementById('tabPriority');
    if (tabPrio) tabPrio.innerText = t.tabPriority;
    const tabVault = document.getElementById('tabVault');
    if (tabVault) tabVault.innerText = t.tabVault;

    // Page 1: Setup
    document.getElementById('pillToday').innerText = t.pillToday;
    document.getElementById('pillTomorrow').innerText = t.pillTomorrow;
    document.getElementById('pill3Days').innerText = t.pill3Days;
    document.getElementById('pill5Days').innerText = t.pill5Days;
    document.getElementById('pill7Days').innerText = t.pill7Days;
    document.getElementById('pill10Days').innerText = t.pill10Days;

    document.getElementById('lblFrom').innerText = t.lblFrom;
    document.getElementById('lblTo').innerText = t.lblTo;
    document.getElementById('lblDate').innerText = t.lblDate;
    document.getElementById('lblPax').innerText = t.lblPax;
    document.getElementById('lblTrain').innerText = t.lblTrain;
    document.getElementById('lblClass').innerText = t.lblClass;
    document.getElementById('lblTotalFareText').innerText = t.lblTotalFareText;

    document.getElementById('btnMainActionText').innerText = currentMode === 'instant' ? t.btnActionInstant : t.btnActionSchedule;

    // Page 2: Schedules List
    document.getElementById('lblSchedTitle').innerText = t.lblSchedTitle;
    document.getElementById('lblNoSched').innerText = t.lblNoSched;
    document.getElementById('lblNoSchedSub').innerText = t.lblNoSchedSub;

    // Page 3: Priority Rules
    document.getElementById('lblPrioTitle').innerText = t.lblPrioTitle;
    document.getElementById('lblPrioHint').innerText = t.lblPrioHint;
    document.getElementById('tagP1').innerText = t.tagP1;
    document.getElementById('statP1').innerText = t.statP1;
    document.getElementById('tagP2').innerText = t.tagP2;
    document.getElementById('statP2').innerText = t.statP2;
    document.getElementById('tagP3').innerText = t.tagP3;
    document.getElementById('statP3').innerText = t.statP3;
    document.getElementById('btnSavePrioText').innerText = t.btnSavePrioText;

    // Page 4: Vault
    document.getElementById('lblVaultTitle').innerText = t.lblVaultTitle;
    document.getElementById('lblVaultHint').innerText = t.lblVaultHint;
    document.getElementById('lblVaultPhone').innerText = t.lblVaultPhone;
    document.getElementById('lblVaultPass').innerText = t.lblVaultPass;
    document.getElementById('lblVaultGuardHead').innerText = t.lblVaultGuardHead;
    document.getElementById('lblVaultGuardDesc').innerText = t.lblVaultGuardDesc;
    document.getElementById('btnSaveVaultText').innerText = t.btnSaveVaultText;

    populateDropdowns();
    onRouteChanged();

    getScheduledBookings((bookings) => {
      renderSchedulesList(bookings);
    });
  }

  // Load Stored Settings
  function loadStoredSettings() {
    if (chrome?.storage?.local) {
      chrome.storage.local.get(['gt_theme', 'gt_lang', 'geTicketConfig', 'railwayVault', 'scheduledBookings'], (data) => {
        if (data.gt_theme) currentTheme = data.gt_theme;
        if (data.gt_lang) currentLang = data.gt_lang;
        applyThemeAndLang();

        if (data.geTicketConfig) {
          const c = data.geTicketConfig;
          if (c.routeFrom) document.getElementById('routeFrom').value = getStationName(c.routeFrom, currentLang);
          if (c.routeTo) document.getElementById('routeTo').value = getStationName(c.routeTo, currentLang);
          if (c.targetDate) document.getElementById('journeyDate').value = c.targetDate;
          if (c.passengers) document.getElementById('passengerCount').value = c.passengers;
          if (c.prefClass) document.getElementById('prefClass').value = c.prefClass;

          if (c.priorities && c.priorities.length >= 3) {
            document.getElementById('p1Class').value = c.priorities[0].classCode;
            document.getElementById('p1Dir').value = c.priorities[0].dir;
            document.getElementById('p2Class').value = c.priorities[1].classCode;
            document.getElementById('p2Dir').value = c.priorities[1].dir;
            document.getElementById('p3Class').value = c.priorities[2].classCode;
            document.getElementById('p3Dir').value = c.priorities[2].dir;
          }
        }

        if (data.railwayVault) {
          if (data.railwayVault.phone) document.getElementById('vaultPhone').value = data.railwayVault.phone;
          if (data.railwayVault.pass) document.getElementById('vaultPass').value = data.railwayVault.pass;
        }

        renderSchedulesList(data.scheduledBookings || []);
        onRouteChanged();
      });
    } else {
      currentTheme = localStorage.getItem('gt_theme') || 'light';
      currentLang = localStorage.getItem('gt_lang') || 'en';
      applyThemeAndLang();
      getScheduledBookings((bookings) => {
        renderSchedulesList(bookings);
      });
      onRouteChanged();
    }
  }

  // Interactive Station Search & Autocomplete
  function setupStationAutocomplete(inputId, suggestBoxId) {
    const input = document.getElementById(inputId);
    const box = document.getElementById(suggestBoxId);
    if (!input || !box) return;

    function renderList(query) {
      box.innerHTML = '';
      const q = (query || '').trim().toLowerCase();
      const stationList = STATIONS[currentLang] || STATIONS.en;

      const matches = stationList.filter(s => {
        if (!q) return true;
        return s.text.toLowerCase().includes(q) || s.value.toLowerCase().includes(q);
      });

      if (matches.length === 0) {
        box.style.display = 'none';
        return;
      }

      matches.forEach(s => {
        const item = document.createElement('div');
        item.className = 'station-suggest-item';
        item.innerHTML = `<span>${s.text}</span><span style="font-size: 9px; opacity: 0.7;">${s.value}</span>`;
        item.addEventListener('mousedown', (e) => {
          e.preventDefault();
          input.value = s.text;
          box.style.display = 'none';
          onRouteChanged();
        });
        box.appendChild(item);
      });

      box.style.display = 'block';
    }

    input.addEventListener('focus', () => renderList(input.value));
    input.addEventListener('input', () => {
      renderList(input.value);
      onRouteChanged();
    });
    input.addEventListener('blur', () => {
      setTimeout(() => { box.style.display = 'none'; }, 200);
    });
    input.addEventListener('change', () => onRouteChanged());
  }

  setupStationAutocomplete('routeFrom', 'suggestFrom');
  setupStationAutocomplete('routeTo', 'suggestTo');

  document.getElementById('trainName').addEventListener('change', updateCalculations);
  document.getElementById('prefClass').addEventListener('change', () => {
    const p1 = document.getElementById('p1Class');
    if (p1) p1.value = document.getElementById('prefClass').value;
    updateCalculations();
  });
  document.getElementById('journeyDate').addEventListener('change', (e) => {
    syncQuickDayWithDate(e.target.value);
    onRouteChanged();
  });
  document.getElementById('passengerCount').addEventListener('change', updateCalculations);

  // Theme & Language Buttons
  document.getElementById('btnPopTheme').addEventListener('click', () => {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    if (chrome?.storage?.local) chrome.storage.local.set({ gt_theme: currentTheme });
    localStorage.setItem('gt_theme', currentTheme);
    applyThemeAndLang();
    showToast(currentTheme === 'light' ? 'Light Mode (Default)' : 'Dark Mode');
  });

  document.getElementById('btnPopLang').addEventListener('click', () => {
    currentLang = currentLang === 'en' ? 'bn' : 'en';
    if (chrome?.storage?.local) chrome.storage.local.set({ gt_lang: currentLang });
    localStorage.setItem('gt_lang', currentLang);
    applyThemeAndLang();
    showToast(currentLang === 'en' ? 'Language: Pure English' : 'ভাষা: সম্পূর্ণ বাংলা');
  });

  // MAIN ACTION BUTTON: Executes either Instant Grab or Advance Schedule based on active mode
  document.getElementById('btnMainAction').addEventListener('click', () => {
    if (!isCurrentRouteValid) {
      showToast(currentLang === 'bn' ? '⚠️ এই রুটে সরাসরি ট্রেন নেই!' : '⚠️ Route unavailable!');
      return;
    }

    const from = resolveStationValue(document.getElementById('routeFrom').value);
    const to = resolveStationValue(document.getElementById('routeTo').value);
    const date = document.getElementById('journeyDate').value;
    const passengers = parseInt(document.getElementById('passengerCount').value, 10);
    const trainName = document.getElementById('trainName').value;
    const classCode = document.getElementById('prefClass').value || 'S_CHAIR';

    if (currentMode === 'instant') {
      // ⚡ INSTANT TICKET GRAB: Starts immediately without waiting for alarm!
      playChime();
      showToast(currentLang === 'bn' 
        ? '⚡ রিলিজকৃত সিট তাৎক্ষণিক খোঁজা হচ্ছে ও লক করা হচ্ছে...' 
        : '⚡ Instant Grab initiated! Querying live seats & locking...');

      if (chrome?.runtime?.sendMessage) {
        chrome.runtime.sendMessage({
          action: 'TRIGGER_INSTANT_GRAB',
          from,
          to,
          date,
          passengers,
          trainName,
          classCode
        });
      }
    } else {
      // 📅 ADVANCE SCHEDULE: Arms alarm for exact zone release (08:00 AM West or 02:00 PM East)
      const WEST_STATIONS = ['Rajshahi', 'Khulna', 'Rangpur', 'Dinajpur', 'Panchagarh', 'Benapole', 'Ishwardi', 'Bogra'];
      const isWest = WEST_STATIONS.includes(to) || WEST_STATIONS.includes(from);
      const scheduleId = `geticket_sched_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
      const targetTimeSuffix = isWest ? 'T07:50:00' : 'T13:50:00';
      const targetDay = new Date(date + targetTimeSuffix);

      const newBooking = {
        id: scheduleId,
        from,
        to,
        date,
        passengers,
        trainName,
        classCode,
        zone: isWest ? 'west' : 'east',
        alarmTime: isWest ? '07:50 AM' : '01:50 PM',
        releaseTime: isWest ? '08:00 AM' : '02:00 PM',
        createdAt: new Date().toISOString()
      };

      getScheduledBookings((bookings) => {
        // Prevent duplicates
        const updated = [...bookings.filter(b => b.id !== scheduleId), newBooking];
        saveScheduledBookings(updated, () => {
          renderSchedulesList(updated);

          if (chrome?.runtime?.sendMessage) {
            chrome.runtime.sendMessage({
              action: 'SCHEDULE_BOOKING',
              id: scheduleId,
              targetTimestamp: targetDay.getTime(),
              bookingInfo: newBooking
            }).catch(() => {});
          }

          // Auto-save priority rules from Setup
          const p1Class = document.getElementById('p1Class')?.value || classCode;
          const p1Dir = document.getElementById('p1Dir')?.value || 'straight';
          const p2Class = document.getElementById('p2Class')?.value || 'SNIGDHA';
          const p2Dir = document.getElementById('p2Dir')?.value || 'middle';
          const p3Class = document.getElementById('p3Class')?.value || 'F_CHAIR';
          const p3Dir = document.getElementById('p3Dir')?.value || 'any';

          const priorities = [
            { level: 1, classCode: p1Class, dir: p1Dir, coach: 'ANY' },
            { level: 2, classCode: p2Class, dir: p2Dir, coach: 'ANY' },
            { level: 3, classCode: p3Class, dir: p3Dir, coach: 'ANY' }
          ];

          const configUpdate = { routeFrom: from, routeTo: to, targetDate: date, passengers, trainName, prefClass: classCode, priorities };
          if (chrome?.storage?.local) {
            chrome.storage.local.get(['geTicketConfig'], (res) => {
              const full = { ...(res.geTicketConfig || {}), ...configUpdate };
              chrome.storage.local.set({ geTicketConfig: full });
            });
          }

          playChime();
          const trainDisp = getTrainDisplayName(trainName, currentLang);
          const confirmMsg = currentLang === 'bn'
            ? `🎉 সফল! (${trainDisp}) ট্রেনের অগ্রিম শিডিউল সক্রিয় করা হয়েছে! (${alarmTime} এ অ্যালার্ম বাজবে)`
            : `🎉 Success! (${trainDisp}) Advance Schedule Armed! (Alarm: ${alarmTime})`;
          showToast(confirmMsg);

          setTimeout(() => {
            switchPage('schedules');
          }, 350);
        });
      });
    }
  });

  // Save Priority Rules (if button exists)
  const btnSavePriority = document.getElementById('btnSavePriority');
  if (btnSavePriority) {
    btnSavePriority.addEventListener('click', () => {
      const p1Val = document.getElementById('p1Class').value;
      const prefClassEl = document.getElementById('prefClass');
      if (prefClassEl) prefClassEl.value = p1Val;
      updateCalculations();

      const priorities = [
        { level: 1, classCode: document.getElementById('p1Class').value, dir: document.getElementById('p1Dir').value, coach: 'ANY' },
        { level: 2, classCode: document.getElementById('p2Class').value, dir: document.getElementById('p2Dir').value, coach: 'ANY' },
        { level: 3, classCode: document.getElementById('p3Class').value, dir: document.getElementById('p3Dir').value, coach: 'ANY' }
      ];

      if (chrome?.storage?.local) {
        chrome.storage.local.get(['geTicketConfig'], (res) => {
          const full = { ...(res.geTicketConfig || {}), priorities };
          chrome.storage.local.set({ geTicketConfig: full }, () => {
            showToast(UI_TEXT[currentLang].toastPrioSaved);
          });
        });
      } else {
        showToast(UI_TEXT[currentLang].toastPrioSaved);
      }
    });
  }

  // Save Account Vault
  document.getElementById('btnSaveVault').addEventListener('click', () => {
    const phone = document.getElementById('vaultPhone').value.trim();
    const pass = document.getElementById('vaultPass').value.trim();

    if (chrome?.storage?.local) {
      chrome.storage.local.set({ railwayVault: { phone, pass } }, () => {
        if (chrome?.runtime?.sendMessage) {
          chrome.runtime.sendMessage({ action: 'START_SESSION_GUARD' }).catch(() => {});
        }
        showToast(UI_TEXT[currentLang].toastVaultSaved);
      });
    } else {
      showToast(UI_TEXT[currentLang].toastVaultSaved);
    }
  });

  // Initialize
  loadStoredSettings();
});
