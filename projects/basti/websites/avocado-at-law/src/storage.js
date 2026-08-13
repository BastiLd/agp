import AsyncStorage from '@react-native-async-storage/async-storage';

// Hier wird der Fortschritt gespeichert (XP, Streak, Tagesziel, ...).
// AsyncStorage merkt sich die Daten - auch nach App-Neustart.
// Im Browser nutzt es automatisch den localStorage.

const KEY = 'avo_progress_v1';

export const defaultProgress = {
  xp: 0, // gesamte XP
  streak: 0, // Tage in Folge
  lastActiveDate: null, // letzter Lern-Tag (YYYY-MM-DD)
  dailyXp: 0, // XP am letzten Lern-Tag
  dailyGoal: 20, // tägliches XP-Ziel
  completedLessons: [], // welche Lektionen geschafft sind
  onboardingDone: false, // Begrüßungs-Flow schon gesehen?
  reason: null, // Onboarding: warum lernst du?
};

export async function loadProgress() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return { ...defaultProgress };
    return { ...defaultProgress, ...JSON.parse(raw) };
  } catch {
    return { ...defaultProgress };
  }
}

export async function saveProgress(p) {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    // wenn Speichern fehlschlägt, einfach weitermachen
  }
}

// ---- kleine Datums-Helfer ----
function dateStr(d) {
  return d.toISOString().slice(0, 10); // "YYYY-MM-DD"
}
export function todayStr() {
  return dateStr(new Date());
}
export function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return dateStr(d);
}

// Wird aufgerufen, wenn eine Lektion fertig ist.
// Aktualisiert XP, Streak (Tage in Folge) und das Tages-XP.
export function registerLessonDone(p, earnedXp, lessonId) {
  const today = todayStr();
  let streak = p.streak || 0;
  let dailyXp = p.dailyXp || 0;

  if (p.lastActiveDate === today) {
    // heute schon gelernt -> Streak bleibt, XP dazu
    dailyXp += earnedXp;
  } else {
    // neuer Tag: war gestern aktiv -> Streak +1, sonst neu bei 1
    streak = p.lastActiveDate === yesterdayStr() ? streak + 1 : 1;
    dailyXp = earnedXp;
  }

  const completedLessons = p.completedLessons.includes(lessonId)
    ? p.completedLessons
    : [...p.completedLessons, lessonId];

  return {
    ...p,
    xp: (p.xp || 0) + earnedXp,
    streak,
    dailyXp,
    lastActiveDate: today,
    completedLessons,
  };
}

// Tages-XP für die Anzeige: an einem neuen Tag wieder 0.
export function effectiveDailyXp(p) {
  return p.lastActiveDate === todayStr() ? p.dailyXp || 0 : 0;
}
