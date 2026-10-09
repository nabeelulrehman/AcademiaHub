// ============================================
// storage.js — LocalStorage wrapper
// ============================================

export function saveData(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn("Storage save failed:", e);
  }
}

export function getData(key, defaultValue = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch (e) {
    return defaultValue;
  }
}

export function removeData(key) {
  localStorage.removeItem(key);
}