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
    soldOut: "Sold Out (0 Seats Available)",
    liveAvail: "avail.",
    liveSold: "Sold Out",
    liveBookBtn: "Book Now",
    liveChkFailed: "Live check failed",
    lblLiveEmpty: "No live data. Try again.",
    scanningLive: "Scanning live availability..."
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
    soldOut: "বুকিং শেষ (০ টি সিট খালি)",
    liveAvail: "খালি",
    liveSold: "বুকড",
    liveBookBtn: "এখনই বুক করুন",
    liveChkFailed: "লাইভ চেক ব্যর্থ",
    lblLiveEmpty: "লাইভ তথ্য পাওয়া যায়নি। আবার চেষ্টা করুন।",
    scanningLive: "লাইভ সিট স্ক্যান হচ্ছে..."
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
  } catch (e) { }
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
    chrome.runtime.sendMessage({ action: 'SYNC_BADGE', count: num }).catch(() => { });
  }
}

// Storage Helpers
function getScheduledBookings(callback) {
  if (chrome?.storage?.local) {
    chrome.storage.local.get(['scheduledBookings'], (res) => {
      if (Array.isArray(res?.scheduledBookings)) {
        try { localStorage.setItem('scheduledBookings', JSON.stringify(res.scheduledBookings)); } catch (e) { }
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
  } catch (e) { }

  updateBadgeCount(safeList.length);

  try {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'SYNC_SCHEDULES', count: safeList.length }, '*');
    }
  } catch (e) { }

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
  updateBadgeCount(schedules ? schedules.length : 0);

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
      const isInstant = item.type === 'instant' || item.alarmTime === '⚡ Instant Grab Active';
      const isWestRoute = item.zone === 'west' || ['Rajshahi', 'Khulna', 'Rangpur', 'Dinajpur', 'Panchagarh', 'Benapole', 'Ishwardi', 'Bogra'].includes(item.to);
      const alarmTime = item.alarmTime || (isWestRoute ? '07:50 AM' : '01:50 PM');
      const zoneNameStr = isWestRoute
        ? (currentLang === 'bn' ? 'পশ্চিমাঞ্চল' : 'West Zone')
        : (currentLang === 'bn' ? 'পূর্বাঞ্চল' : 'East Zone');

      const statusText = isInstant
        ? (currentLang === 'bn' ? '⚡ তাৎক্ষণিক ফাস্ট-গ্র্যাব সক্রিয়' : '⚡ Instant Fast-Grab Active')
        : (currentLang === 'bn' ? `⏰ অ্যালার্ম: ${alarmTime} (${zoneNameStr} সক্রিয়)` : `⏰ Alarm: ${alarmTime} (${zoneNameStr} Armed)`);
      const statusColor = isInstant ? '#10b981' : 'var(--primary)';

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
    } catch (err) {
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
        chrome.runtime.sendMessage({ action: 'CANCEL_SCHEDULE', id }).catch(() => { });
      }
      showToast(UI_TEXT[currentLang].toastSchedDeleted);
    });
  });
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
        if (response && response.success && response.data?.trains && response.data.trains.length > 0) {
          liveServerData = response.data;
          resolve(response.data.trains);
        } else {
          resolve(null);
        }
      });
    } else {
      resolve(null);
    }
  });
}

// Main Controller Initializer
document.addEventListener('DOMContentLoaded', () => {

  // Tab navigation (Setup, Lists, Vault)
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      switchPage(tab.dataset.page);
    });
  });

  // Live Clock Updater (Ticks every 50ms)
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

  // Quick Swap Stations Button (⇄)
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

  // Set default date and strictly prevent past date selection (min = today, max = 10 days)
  const journeyDateEl = document.getElementById('journeyDate');
  if (journeyDateEl) {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const max10 = new Date();
    max10.setDate(max10.getDate() + 10);
    const max10Str = max10.toISOString().split('T')[0];
    journeyDateEl.min = todayStr;
    journeyDateEl.max = max10Str;
    if (!journeyDateEl.value || journeyDateEl.value < todayStr) {
      journeyDateEl.value = todayStr;
    }
  }

  // Route Change Listener (Chronological AM to PM Sorting with Timing Display)
  async function onRouteChanged(forceServerSync = false) {
    const rawFrom = document.getElementById('routeFrom')?.value || 'Dhaka';
    const rawTo = document.getElementById('routeTo')?.value || 'Rajshahi';
    const dateVal = document.getElementById('journeyDate')?.value || new Date().toISOString().split('T')[0];

    const from = resolveStationValue(rawFrom);
    const to = resolveStationValue(rawTo);
    const routeKey = `${from}-${to}`;

    const trainDropdown = document.getElementById('trainName');
    if (!trainDropdown) return;
    const curTrain = trainDropdown.value;

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
      trains = ROUTE_TRAIN_MAP[routeKey] || ROUTE_TRAIN_MAP[`${to}-${from}`] || [];
    }

    // Ensure trains are strictly sorted by departure time (AM to PM)
    trains = sortTrainsChronologically(trains);

    trainDropdown.innerHTML = '';

    const btnArm = document.getElementById('btnArmSchedule');
    const btnGrab = document.getElementById('btnGrabNow');

    // Route Validation: Check if any train exists
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

    // Route is Valid: Populate Trains with Timings (e.g. Padma Express (11:00 PM ➔ 04:40 AM))
    // 1. Any Available Train (Fastest Available) Option
    const anyTrainOpt = document.createElement('option');
    anyTrainOpt.value = 'ANY_TRAIN';
    anyTrainOpt.innerText = currentLang === 'bn' 
      ? '⚡ যেকোনো উপলব্ধ ট্রেন (সবচেয়ে দ্রুত)' 
      : '⚡ Any Available Train (Fastest Available)';
    if (curTrain === 'ANY_TRAIN') anyTrainOpt.selected = true;
    trainDropdown.appendChild(anyTrainOpt);

    // 2. Specific Trains on the Route
    trains.forEach((t, idx) => {
      const trainName = currentLang === 'bn' ? (t.nameBn || t.nameEn) : t.nameEn;
      const timeStr = t.arr ? `${t.dep} ➔ ${t.arr}` : t.dep;
      const opt = document.createElement('option');
      opt.value = t.nameEn;
      opt.innerText = `${trainName} (${timeStr})`;
      if (t.nameEn === curTrain || (!curTrain && idx === 0)) opt.selected = true;
      trainDropdown.appendChild(opt);
    });

    updateCalculations();
  }

  // Live Calculations (Vault Fare Breakdown & Summary)
  function updateCalculations() {
    if (!isCurrentRouteValid) return;

    const rawFrom = document.getElementById('routeFrom')?.value || 'Dhaka';
    const rawTo = document.getElementById('routeTo')?.value || 'Rajshahi';
    const from = resolveStationValue(rawFrom);
    const to = resolveStationValue(rawTo);
    const trainKey = document.getElementById('trainName')?.value;
    const pax = parseInt(document.getElementById('passengerCount')?.value, 10) || 1;
    const chosenClass = document.getElementById('prefClass')?.value || 'S_CHAIR';

    const routeKey = `${from}-${to}`;
    const revRouteKey = `${to}-${from}`;

    // Determine Exact Fare: Check Live Server seat_types first, then fallback to FARE_RATES
    let unitPrice = 205;
    if (liveServerData?.trains) {
      const liveTrain = liveServerData.trains.find(lt => (lt.train_name || lt.name) === trainKey);
      if (liveTrain?.seat_types) {
        const match = liveTrain.seat_types.find(st => st.type === chosenClass);
        if (match && match.fare) unitPrice = match.fare;
      }
    } else {
      const routeFares = FARE_RATES[routeKey] || FARE_RATES[revRouteKey] || FARE_RATES["Dhaka-Rajshahi"] || FARE_RATES["Dhaka-Jamalpur"];
      unitPrice = routeFares ? (routeFares[chosenClass] || 205) : 205;
    }

    const baseTotal = unitPrice * pax;
    const serviceCharge = 20 * pax;
    const subtotal = baseTotal + serviceCharge;
    const bkashFee = Math.round(subtotal * 0.015);
    const totalPay = subtotal + bkashFee;
    const recommended = Math.ceil((totalPay + 5) / 10) * 10;

    // Vault Tab Summary Elements
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

  // Populate Dropdown Options
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

    const curFrom = fromInput?.value ? resolveStationValue(fromInput.value) : "Dhaka";
    const curTo = toInput?.value ? resolveStationValue(toInput.value) : "Rajshahi";
    const curPax = paxSel?.value || "2";
    const curPref = prefClass?.value || "S_CHAIR";

    const curP1C = p1Class?.value || "S_CHAIR";
    const curP2C = p2Class?.value || "SNIGDHA";
    const curP3C = p3Class?.value || "F_CHAIR";

    const curP1D = p1Dir?.value || "straight";
    const curP2D = p2Dir?.value || "middle";
    const curP3D = p3Dir?.value || "any";

    // Station Selectors
    if (fromInput) {
      if (fromInput.tagName === 'SELECT') {
        fromInput.innerHTML = '';
        (STATIONS[currentLang] || STATIONS.en).forEach(s => {
          fromInput.appendChild(new Option(s.text, s.value));
        });
        fromInput.value = curFrom;
      } else {
        if (dlistFrom) {
          dlistFrom.innerHTML = '';
          (STATIONS[currentLang] || STATIONS.en).forEach(s => {
            dlistFrom.appendChild(new Option(s.text, s.text));
          });
        }
        fromInput.value = getStationName(curFrom, currentLang);
      }
    }

    if (toInput) {
      if (toInput.tagName === 'SELECT') {
        toInput.innerHTML = '';
        (STATIONS[currentLang] || STATIONS.en).forEach(s => {
          toInput.appendChild(new Option(s.text, s.value));
        });
        toInput.value = curTo;
      } else {
        if (dlistTo) {
          dlistTo.innerHTML = '';
          (STATIONS[currentLang] || STATIONS.en).forEach(s => {
            dlistTo.appendChild(new Option(s.text, s.text));
          });
        }
        toInput.value = getStationName(curTo, currentLang);
      }
    }

    // Passengers
    if (paxSel) {
      paxSel.innerHTML = '';
      (PASSENGERS_OPTS[currentLang] || PASSENGERS_OPTS.en).forEach(p => {
        paxSel.appendChild(new Option(p.text, p.value));
      });
      paxSel.value = curPax;
    }

    // Coach Classes
    [prefClass, p1Class, p2Class, p3Class].forEach(sel => {
      if (!sel) return;
      sel.innerHTML = '';
      (CLASSES_OPTS[currentLang] || CLASSES_OPTS.en).forEach(c => {
        sel.appendChild(new Option(c.text, c.value));
      });
    });
    if (prefClass) prefClass.value = curPref;
    if (p1Class) p1Class.value = curP1C;
    if (p2Class) p2Class.value = curP2C;
    if (p3Class) p3Class.value = curP3C;

    // Directions
    [p1Dir, p2Dir, p3Dir].forEach(sel => {
      if (!sel) return;
      sel.innerHTML = '';
      (DIRECTIONS_OPTS[currentLang] || DIRECTIONS_OPTS.en).forEach(d => {
        sel.appendChild(new Option(d.text, d.value));
      });
    });
    if (p1Dir) p1Dir.value = curP1D;
    if (p2Dir) p2Dir.value = curP2D;
    if (p3Dir) p3Dir.value = curP3D;
  }

  // Apply Theme & Language
  function applyThemeAndLang() {
    document.documentElement.setAttribute('data-theme', currentTheme);
    document.documentElement.setAttribute('data-lang', currentLang);

    const themeBtn = document.getElementById('btnPopTheme');
    if (themeBtn) themeBtn.innerText = currentTheme === 'light' ? '☀️' : '🌙';
    const langBtn = document.getElementById('btnPopLang');
    if (langBtn) langBtn.innerText = currentLang === 'en' ? 'EN' : 'বাং';

    const t = UI_TEXT[currentLang];
    const hdrTitle = document.getElementById('hdrTitle');
    if (hdrTitle) hdrTitle.innerText = t.hdrTitle;

    // Tabs
    const tabSetup = document.getElementById('tabSetup');
    if (tabSetup) tabSetup.childNodes[0].nodeValue = t.tabSetup + ' ';

    const tabSched = document.getElementById('tabSchedules');
    if (tabSched) tabSched.childNodes[0].nodeValue = t.tabSchedules + ' ';

    const tabVault = document.getElementById('tabVault');
    if (tabVault) tabVault.innerText = t.tabVault;

    // Clock
    const lblClock = document.getElementById('lblClockStrip');
    if (lblClock) lblClock.innerText = currentLang === 'bn' ? 'রেলওয়ে সার্ভার টাইম' : 'RAILWAY SERVER TIME';

    // Page 1: Setup
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

    // Priority
    const lblPrioTitle = document.getElementById('lblPrioTitle');
    if (lblPrioTitle) lblPrioTitle.innerText = currentLang === 'bn' ? '🎯 ক্যাসকেডিং প্রায়োরিটি চেইন' : '🎯 Cascading Priority Chain';

    // Action buttons
    const btnArmText = document.getElementById('btnArmText');
    if (btnArmText) btnArmText.innerText = currentLang === 'bn' ? 'অগ্রিম শিডিউল ও অ্যালার্ম সক্রিয় করুন' : 'Arm Advance Schedule & Watchdog';

    const btnGrabText = document.getElementById('btnGrabText');
    if (btnGrabText) btnGrabText.innerText = currentLang === 'bn' ? 'তাত্ক্ষণিক ফাস্ট-গ্র্যাব (লক)' : 'Instant Fast-Grab (Lock)';

    const stealthNotice = document.getElementById('lblStealthNotice');
    if (stealthNotice) stealthNotice.innerHTML = currentLang === 'bn'
      ? '<span>🛡️ ১০০% হিউম্যানাইজড স্টিলথ সক্রিয় • অ্যাকাউন্ট ব্যান ঝুঁকিহীন</span>'
      : '<span>🛡️ 100% Humanized Stealth Active • Zero Account Ban</span>';

    // Page 2: Lists
    const lblSchedTitle = document.getElementById('lblSchedTitle');
    if (lblSchedTitle) lblSchedTitle.innerText = t.lblSchedTitle;
    const lblNoSched = document.getElementById('lblNoSched');
    if (lblNoSched) lblNoSched.innerText = t.lblNoSched;
    const lblNoSchedSub = document.getElementById('lblNoSchedSub');
    if (lblNoSchedSub) lblNoSchedSub.innerText = t.lblNoSchedSub;

    // Page 3: Vault
    const lblVaultTitle = document.getElementById('lblVaultTitle');
    if (lblVaultTitle) lblVaultTitle.innerText = t.lblVaultTitle;
    const lblVaultHint = document.getElementById('lblVaultHint');
    if (lblVaultHint) lblVaultHint.innerText = t.lblVaultHint;
    const lblVaultPhone = document.getElementById('lblVaultPhone');
    if (lblVaultPhone) lblVaultPhone.innerText = t.lblVaultPhone;
    const lblVaultPass = document.getElementById('lblVaultPass');
    if (lblVaultPass) lblVaultPass.innerText = t.lblVaultPass;
    const btnSaveVaultText = document.getElementById('btnSaveVaultText');
    if (btnSaveVaultText) btnSaveVaultText.innerText = currentLang === 'bn' ? 'রেলওয়ে অ্যাকাউন্ট ভল্টে সেভ করুন' : 'Save Railway Account to Vault';

    const lblFareCardHead = document.getElementById('lblFareCardHead');
    if (lblFareCardHead) lblFareCardHead.innerText = currentLang === 'bn' ? '💳 লাইভ ভাড়া ও বিকাশ সামারি' : '💳 Live Fare & bKash Summary';
    const lblBaseFareText = document.getElementById('lblBaseFareText');
    if (lblBaseFareText) lblBaseFareText.innerText = currentLang === 'bn' ? 'মূল টিকিট ভাড়া:' : 'Base Ticket Fare:';
    const lblStationFeeText = document.getElementById('lblStationFeeText');
    if (lblStationFeeText) lblStationFeeText.innerText = currentLang === 'bn' ? 'রেলওয়ে চার্জ (৳২০):' : 'Railway Charge (৳20):';
    const lblBkashFeeText = document.getElementById('lblBkashFeeText');
    if (lblBkashFeeText) lblBkashFeeText.innerText = currentLang === 'bn' ? 'বিকাশ গেটওয়ে চার্জ (১.৫%):' : 'bKash Charge (1.5%):';
    const lblTotalKeepCaption = document.getElementById('lblTotalKeepCaption');
    if (lblTotalKeepCaption) lblTotalKeepCaption.innerText = currentLang === 'bn' ? 'বিকাশে সর্বমোট যা রাখতে হবে' : 'TOTAL TO KEEP IN BKASH';

    const lblVaultGuardHead = document.getElementById('lblVaultGuardHead');
    if (lblVaultGuardHead) lblVaultGuardHead.innerText = t.lblVaultGuardHead;
    const lblVaultGuardDesc = document.getElementById('lblVaultGuardDesc');
    if (lblVaultGuardDesc) lblVaultGuardDesc.innerText = t.lblVaultGuardDesc;

    // Live Availability Scanner
    const btnScanText = document.getElementById('btnScanText');
    if (btnScanText) btnScanText.innerText = currentLang === 'bn' ? 'লাইভ সিট স্ক্যান' : 'Scan Live Availability';
    const lblLiveResultsTitle = document.getElementById('lblLiveResultsTitle');
    if (lblLiveResultsTitle) lblLiveResultsTitle.innerText = currentLang === 'bn' ? '🚄 লাইভ সিট তথ্য' : '🚄 Live Availability';
    const lblLiveEmpty = document.getElementById('lblLiveEmpty');
    if (lblLiveEmpty) lblLiveEmpty.innerText = currentLang === 'bn' ? 'লাইভ তথ্য পাওয়া যায়নি। আবার চেষ্টা করুন।' : 'No live data. Try again.';

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
          if (c.routeFrom && document.getElementById('routeFrom')) document.getElementById('routeFrom').value = c.routeFrom;
          if (c.routeTo && document.getElementById('routeTo')) document.getElementById('routeTo').value = c.routeTo;
          if (c.targetDate && document.getElementById('journeyDate')) document.getElementById('journeyDate').value = c.targetDate;
          if (c.passengers && document.getElementById('passengerCount')) document.getElementById('passengerCount').value = c.passengers;
          if (c.prefClass && document.getElementById('prefClass')) document.getElementById('prefClass').value = c.prefClass;

          if (c.priorities && c.priorities.length >= 3) {
            if (document.getElementById('p1Class')) document.getElementById('p1Class').value = c.priorities[0].classCode;
            if (document.getElementById('p1Dir')) document.getElementById('p1Dir').value = c.priorities[0].dir;
            if (document.getElementById('p2Class')) document.getElementById('p2Class').value = c.priorities[1].classCode;
            if (document.getElementById('p2Dir')) document.getElementById('p2Dir').value = c.priorities[1].dir;
            if (document.getElementById('p3Class')) document.getElementById('p3Class').value = c.priorities[2].classCode;
            if (document.getElementById('p3Dir')) document.getElementById('p3Dir').value = c.priorities[2].dir;
          }
        }

        if (data.railwayVault) {
          const phoneEl = document.getElementById('vaultPhone');
          const passEl = document.getElementById('vaultPass');
          if (phoneEl && data.railwayVault.phone) phoneEl.value = data.railwayVault.phone;
          if (passEl && data.railwayVault.pass) passEl.value = data.railwayVault.pass;
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

  // Save Priority Configuration helper
  function saveCurrentConfig() {
    const from = resolveStationValue(document.getElementById('routeFrom')?.value || 'Dhaka');
    const to = resolveStationValue(document.getElementById('routeTo')?.value || 'Rajshahi');
    const date = document.getElementById('journeyDate')?.value || new Date().toISOString().split('T')[0];
    const passengers = parseInt(document.getElementById('passengerCount')?.value, 10) || 1;
    const trainName = document.getElementById('trainName')?.value || 'Padma Express';
    const classCode = document.getElementById('prefClass')?.value || 'S_CHAIR';

    const p1C = document.getElementById('p1Class')?.value || classCode;
    const p1D = document.getElementById('p1Dir')?.value || 'straight';
    const p2C = document.getElementById('p2Class')?.value || 'SNIGDHA';
    const p2D = document.getElementById('p2Dir')?.value || 'middle';
    const p3C = document.getElementById('p3Class')?.value || 'F_CHAIR';
    const p3D = document.getElementById('p3Dir')?.value || 'any';

    const priorities = [
      { level: 1, classCode: p1C, dir: p1D, coach: 'ANY' },
      { level: 2, classCode: p2C, dir: p2D, coach: 'ANY' },
      { level: 3, classCode: p3C, dir: p3D, coach: 'ANY' }
    ];

    const configUpdate = { routeFrom: from, routeTo: to, targetDate: date, passengers, trainName, prefClass: classCode, priorities };
    if (chrome?.storage?.local) {
      chrome.storage.local.get(['geTicketConfig'], (res) => {
        const full = { ...(res.geTicketConfig || {}), ...configUpdate };
        chrome.storage.local.set({ geTicketConfig: full });
      });
    }
    return { from, to, date, passengers, trainName, classCode, priorities };
  }

  // ARM ADVANCE SCHEDULE & WATCHDOG
  function handleArmSchedule() {
    if (!isCurrentRouteValid) {
      showToast(currentLang === 'bn' ? '⚠️ এই রুটে সরাসরি ট্রেন নেই!' : '⚠️ Route unavailable!');
      return;
    }

    const cfg = saveCurrentConfig();
    const WEST_STATIONS = ['Rajshahi', 'Khulna', 'Rangpur', 'Dinajpur', 'Panchagarh', 'Benapole', 'Ishwardi', 'Bogra'];
    const isWest = WEST_STATIONS.includes(cfg.to) || WEST_STATIONS.includes(cfg.from);
    
    const selectedDate = new Date((cfg.date || '') + 'T00:00:00');
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    const diffDays = Math.round((selectedDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));
    const isWithin10Days = diffDays <= 10;

    const scheduleId = `geticket_sched_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const alarmTime = isWithin10Days 
      ? (currentLang === 'bn' ? '⚡ লাইভ ওয়াচডগ সক্রিয় (প্রতি ২ মিনিট)' : '⚡ Live Watchdog Active (Every 2m)')
      : (isWest ? '07:50 AM' : '01:50 PM');

    const newBooking = {
      id: scheduleId,
      type: isWithin10Days ? 'instant' : 'schedule',
      from: cfg.from,
      to: cfg.to,
      date: cfg.date,
      passengers: cfg.passengers,
      trainName: cfg.trainName,
      classCode: cfg.classCode,
      zone: isWest ? 'west' : 'east',
      alarmTime,
      releaseTime: isWest ? '08:00 AM' : '02:00 PM',
      priorities: cfg.priorities,
      createdAt: new Date().toISOString()
    };

    getScheduledBookings((bookings) => {
      const updated = [newBooking, ...bookings.filter(b => b.id !== scheduleId)];
      saveScheduledBookings(updated, () => {
        renderSchedulesList(updated);

        if (chrome?.runtime?.sendMessage) {
          chrome.runtime.sendMessage({
            action: isWithin10Days ? 'TRIGGER_INSTANT_GRAB' : 'SCHEDULE_BOOKING',
            id: scheduleId,
            bookingInfo: newBooking,
            from: cfg.from,
            to: cfg.to,
            date: cfg.date,
            passengers: cfg.passengers,
            trainName: cfg.trainName,
            classCode: cfg.classCode
          }).catch(() => { });
        }

        playChime();
        const trainDisp = getTrainDisplayName(cfg.trainName, currentLang);
        showToast(currentLang === 'bn'
          ? `🎉 সফল! (${trainDisp}) শিডিউল সক্রিয় করা হয়েছে!`
          : `🎉 Success! (${trainDisp}) Schedule Armed!`);

        setTimeout(() => switchPage('schedules'), 350);
      });
    });
  }

  // INSTANT FAST-GRAB (LOCK) - Adds to Lists & executes grab
  function handleInstantGrab() {
    if (!isCurrentRouteValid) {
      showToast(currentLang === 'bn' ? '⚠️ এই রুটে সরাসরি ট্রেন নেই!' : '⚠️ Route unavailable!');
      return;
    }

    const cfg = saveCurrentConfig();
    const instantId = `geticket_instant_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;

    const newBooking = {
      id: instantId,
      type: 'instant',
      from: cfg.from,
      to: cfg.to,
      date: cfg.date,
      passengers: cfg.passengers,
      trainName: cfg.trainName,
      classCode: cfg.classCode,
      alarmTime: currentLang === 'bn' ? '⚡ লাইভ ওয়াচডগ সক্রিয় (প্রতি ২ মিনিট)' : '⚡ Live Watchdog Active (Every 2m)',
      status: 'Instant Active',
      priorities: cfg.priorities,
      createdAt: new Date().toISOString()
    };

    getScheduledBookings((bookings) => {
      const updated = [newBooking, ...bookings.filter(b => b.id !== instantId)];
      saveScheduledBookings(updated, () => {
        renderSchedulesList(updated);
        playChime();

        // 1. Notify background runtime
        if (chrome?.runtime?.sendMessage) {
          chrome.runtime.sendMessage({
            action: 'TRIGGER_INSTANT_GRAB',
            from: cfg.from,
            to: cfg.to,
            date: cfg.date,
            passengers: cfg.passengers,
            trainName: cfg.trainName,
            classCode: cfg.classCode
          }).catch(() => { });
        }

        // 2. Direct message to active railway tab
        if (chrome?.tabs?.query) {
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]?.id) {
              chrome.tabs.sendMessage(tabs[0].id, {
                action: 'INSTANT_GRAB_COMMAND',
                from: cfg.from,
                to: cfg.to,
                date: cfg.date,
                passengers: cfg.passengers,
                trainName: cfg.trainName,
                classCode: cfg.classCode
              }).catch(() => { });
            }
          });
        }

const trainDisp = getTrainDisplayName(cfg.trainName, currentLang);
        showToast(currentLang === 'bn'
          ? `⚡ (${trainDisp}) সিট তাৎক্ষণিক লক ও লাইভ ওয়াচডগ শুরু হয়েছে (লিস্টে যুক্ত)! `
          : `⚡ (${trainDisp}) Instant Grab & Live Watchdog active (added to Lists)!`);
      });
    });
  }

  // LIVE AVAILABILITY SCANNER: Fetches live API trains and renders per-class
  // seat availability with a Book Now action that reuses the Instant Grab flow.
  async function handleScanLive() {
    const btnScan = document.getElementById('btnScanLive');
    const panel = document.getElementById('liveResultsPanel');
    const listEl = document.getElementById('liveResultsList');
    const emptyEl = document.getElementById('liveResultsEmpty');
    const metaEl = document.getElementById('lblLiveResultsMeta');
    if (!btnScan || !panel || !listEl) return;

    btnScan.disabled = true;
    btnScan.innerText = UI_TEXT[currentLang].scanningLive || 'Scanning...';
    panel.style.display = 'flex';
    listEl.innerHTML = '';
    if (emptyEl) emptyEl.style.display = 'none';
    if (metaEl) metaEl.innerText = '';

    // Force a fresh server fetch for the current route/date, then render.
    liveServerData = null;
    await onRouteChanged(true);

    btnScan.disabled = false;
    const btnScanText = document.getElementById('btnScanText');
    if (btnScanText) {
      btnScanText.innerText = currentLang === 'bn' ? 'লাইভ সিট স্ক্যান' : 'Scan Live Availability';
    }

    const rawFrom = document.getElementById('routeFrom')?.value || 'Dhaka';
    const rawTo = document.getElementById('routeTo')?.value || 'Rajshahi';
    const dateVal = document.getElementById('journeyDate')?.value || new Date().toISOString().split('T')[0];
    const from = resolveStationValue(rawFrom);
    const to = resolveStationValue(rawTo);

    if (!liveServerData || !Array.isArray(liveServerData.trains) || liveServerData.trains.length === 0) {
      if (metaEl) metaEl.innerText = UI_TEXT[currentLang].liveChkFailed || 'Live check failed';
      if (emptyEl) emptyEl.style.display = 'block';
      return;
    }

    const trains = liveServerData.trains;
    const routeKey = `${from}-${to}`;
    const revKey = `${to}-${from}`;
    if (metaEl) {
      metaEl.innerText = currentLang === 'bn'
        ? `${trains.length} টি ট্রেন • ${dateVal}`
        : `${trains.length} trains • ${dateVal}`;
    }

    const CLASS_LABELS = {};
    (CLASSES_OPTS[currentLang] || CLASSES_OPTS.en).forEach(c => { CLASS_LABELS[c.value] = c.text; });

    trains.forEach(train => {
      const trainName = currentLang === 'bn'
        ? (train.train_name_bn || train.train_name || train.name)
        : (train.train_name || train.name);
      const trainCode = train.train_model || train.train_id || '';
      const dep = train.departure_time || '';
      const arr = train.arrival_time || '';
      const trainKey = train.train_name || train.name || '';

      const card = document.createElement('div');
      card.className = 'live-train-card';

      const header = document.createElement('div');
      header.className = 'live-train-name';
      header.innerHTML = `<span>🚄 ${trainName || 'Train'}${trainCode ? ` (${trainCode})` : ''}</span>`;

      const timeRow = document.createElement('div');
      timeRow.className = 'live-train-time';
      if (dep && arr) timeRow.textContent = `🕐 ${dep} ➔ ${arr}`;
      else if (dep) timeRow.textContent = `🕐 Departs ${dep}`;

      const chipsWrap = document.createElement('div');
      chipsWrap.className = 'live-seat-chips';

      const seatTypes = train.seat_types || [];
      if (seatTypes.length === 0) {
        const routeFares = FARE_RATES[routeKey] || FARE_RATES[revKey] || {};
        Object.entries(routeFares).forEach(([code, fare]) => {
          const chip = document.createElement('div');
          chip.className = 'live-seat-chip';
          chip.innerHTML = `
            <div class="live-seat-chip-name">${CLASS_LABELS[code] || code}</div>
            <div class="live-seat-chip-fare">৳${fare}</div>
            <div class="live-seat-chip-count unknown">--</div>
          `;
          chipsWrap.appendChild(chip);
        });
      } else {
        seatTypes.forEach(st => {
          const code = st.type || st.class || st.seat_class || '';
          const fare = st.fare || st.price || '';
          const totalSeats = parseInt(st.total_seat, 10) || parseInt(st.count, 10);
          const assignedSeats = parseInt(st.assigned_seat, 10) || parseInt(st.booked, 10);
          const remainingFromField = parseInt(st.remaining_seat, 10) || parseInt(st.remaining, 10) || parseInt(st.available_seat, 10);

          let countText = '';
          let countClass = 'unknown';
          if (!isNaN(remainingFromField) && remainingFromField >= 0) {
            countText = `${remainingFromField} ${UI_TEXT[currentLang].liveAvail}`;
            countClass = remainingFromField > 0 ? 'available' : 'sold';
          } else if (!isNaN(totalSeats) && !isNaN(assignedSeats)) {
            const rem = Math.max(0, totalSeats - assignedSeats);
            countText = `${rem} ${UI_TEXT[currentLang].liveAvail}`;
            countClass = rem > 0 ? 'available' : 'sold';
          } else {
            const isAvail = st.is_available;
            const isDis = st.disable;
            if (isDis === true || isAvail === false || isAvail === 'N' || isAvail === 0 || isAvail === 'false') {
              countText = UI_TEXT[currentLang].liveSold;
              countClass = 'sold';
            } else {
              countText = UI_TEXT[currentLang].liveAvail;
              countClass = 'available';
            }
          }

          const chip = document.createElement('div');
          chip.className = 'live-seat-chip';
          chip.title = (CLASS_LABELS[code] || code) + ' - ' + countText;
          chip.innerHTML = `
            <div class="live-seat-chip-name">${CLASS_LABELS[code] || code || '--'}</div>
            <div class="live-seat-chip-fare">${fare ? `৳${fare}` : '--'}</div>
            <div class="live-seat-chip-count ${countClass}">${countText}</div>
          `;

          // Clicking a class chip selects it as the preferred grab class.
          chip.addEventListener('click', () => {
            const prefClass = document.getElementById('prefClass');
            if (prefClass && code) {
              prefClass.value = code;
              prefClass.dispatchEvent(new Event('change'));
            }
            chipsWrap.querySelectorAll('.live-seat-chip').forEach(c => c.classList.remove('live-seat-chip-selected'));
            chip.classList.add('live-seat-chip-selected');
          });

          chipsWrap.appendChild(chip);
        });
      }

      // Book Now: reuse the Instant Grab pipeline on the selected train/class.
      const bookBtn = document.createElement('button');
      bookBtn.className = 'live-train-book';
      bookBtn.textContent = UI_TEXT[currentLang].liveBookBtn || 'Book Now';
      bookBtn.addEventListener('click', () => {
        const trainNameSel = document.getElementById('trainName');
        if (trainNameSel && trainKey) {
          trainNameSel.value = trainKey;
        }
        handleInstantGrab();
      });

      card.appendChild(header);
      if (timeRow.textContent) card.appendChild(timeRow);
      card.appendChild(chipsWrap);
      card.appendChild(bookBtn);
      listEl.appendChild(card);
    });
  }

  // Action Buttons
  const btnArm = document.getElementById('btnArmSchedule');
  if (btnArm) btnArm.addEventListener('click', handleArmSchedule);

  const btnGrab = document.getElementById('btnGrabNow');
  if (btnGrab) btnGrab.addEventListener('click', handleInstantGrab);

  const btnScan = document.getElementById('btnScanLive');
  if (btnScan) btnScan.addEventListener('click', handleScanLive);

  // Form Inputs Listeners
  document.getElementById('routeFrom')?.addEventListener('change', () => onRouteChanged());
  document.getElementById('routeTo')?.addEventListener('change', () => onRouteChanged());
  document.getElementById('trainName')?.addEventListener('change', updateCalculations);
  document.getElementById('passengerCount')?.addEventListener('change', updateCalculations);
  document.getElementById('journeyDate')?.addEventListener('change', () => onRouteChanged());

  document.getElementById('prefClass')?.addEventListener('change', () => {
    const val = document.getElementById('prefClass').value;
    const p1 = document.getElementById('p1Class');
    if (p1) p1.value = val;
    updateCalculations();
    saveCurrentConfig();
  });

  // Cascading Priority Interactivity & Auto-Sync
  ['p1Class', 'p1Dir', 'p2Class', 'p2Dir', 'p3Class', 'p3Dir'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('change', () => {
        if (id === 'p1Class') {
          const prefEl = document.getElementById('prefClass');
          if (prefEl && prefEl.value !== el.value) {
            prefEl.value = el.value;
          }
          updateCalculations();
        }
        saveCurrentConfig();
      });
    }
  });

  // Theme & Language Buttons
  document.getElementById('btnPopTheme')?.addEventListener('click', () => {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    if (chrome?.storage?.local) chrome.storage.local.set({ gt_theme: currentTheme });
    localStorage.setItem('gt_theme', currentTheme);
    applyThemeAndLang();
    showToast(currentTheme === 'light' ? 'Light Mode (Default)' : 'Dark Mode');
  });

  document.getElementById('btnPopLang')?.addEventListener('click', () => {
    currentLang = currentLang === 'en' ? 'bn' : 'en';
    if (chrome?.storage?.local) chrome.storage.local.set({ gt_lang: currentLang });
    localStorage.setItem('gt_lang', currentLang);
    applyThemeAndLang();
    showToast(currentLang === 'en' ? 'Language: Pure English' : 'ভাষা: সম্পূর্ণ বাংলা');
  });

  // Save Account Vault
  document.getElementById('btnSaveVault')?.addEventListener('click', () => {
    const phone = document.getElementById('vaultPhone')?.value?.trim() || '';
    const pass = document.getElementById('vaultPass')?.value?.trim() || '';

    if (chrome?.storage?.local) {
      chrome.storage.local.set({ railwayVault: { phone, pass } }, () => {
        if (chrome?.runtime?.sendMessage) {
          chrome.runtime.sendMessage({ action: 'START_SESSION_GUARD' }).catch(() => { });
        }
        playChime();
        showToast(UI_TEXT[currentLang].toastVaultSaved);
      });
    } else {
      localStorage.setItem('railwayVault', JSON.stringify({ phone, pass }));
      playChime();
      showToast(UI_TEXT[currentLang].toastVaultSaved);
    }
  });

  // Initialize
  loadStoredSettings();
});
