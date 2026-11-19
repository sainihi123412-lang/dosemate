import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Bot,
  Camera,
  Check,
  CircleCheck,
  Clock3,
  Columns2,
  ExternalLink,
  Globe,
  HeartPulse,
  Instagram,
  LogOut,
  Moon,
  PackageCheck,
  Pill,
  Plus,
  RotateCcw,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Sun,
  Trash2,
  Upload,
  User,
  UserCheck,
  Volume2,
  VolumeX,
  X,
  Youtube,
} from "lucide-react";
import {
  auth,
  googleProvider,
  isFirebaseConfigured,
  saveProfileToCloud,
  saveTrackersToCloud,
  saveLogsToCloud,
  saveCheckupsToCloud,
  subscribeToUserCloudData,
} from "./firebase";
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from "firebase/auth";

// App & Persistent Storage Configuration
const STORAGE_PREFIX = "dosemate_wellness_v1";

function loadStoredData(uid, key, fallback) {
  if (!uid || typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}:${uid}:${key}`);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveStoredData(uid, key, value) {
  if (!uid || typeof window === "undefined") return;
  try {
    window.localStorage.setItem(`${STORAGE_PREFIX}:${uid}:${key}`, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors
  }
}

// Product Presets & Catalog Data
const MAN_MATTERS_GUMMY_PRESETS = [
  {
    name: "Biotin Hair Gummies (No Added Sugar)",
    defaultStock: 30,
    defaultDose: 1,
    defaultTimes: ["09:00"],
    defaultMeal: "After meal",
    reorderUrl: "https://man.matters",
  },
  {
    name: "Stage 2 Hair Growth Kit (Minoxidil 5% + Biotin)",
    defaultStock: 60,
    defaultDose: 2,
    defaultTimes: ["09:00", "21:00"],
    defaultMeal: "After meal",
    reorderUrl: "https://man.matters",
  },
  {
    name: "Pure Himalayan Shilajit Gummies",
    defaultStock: 30,
    defaultDose: 2,
    defaultTimes: ["08:30", "17:00"],
    defaultMeal: "After meal",
    reorderUrl: "https://man.matters",
  },
  {
    name: "Melatonin Deep Sleep Gummies",
    defaultStock: 30,
    defaultDose: 1,
    defaultTimes: ["22:00"],
    defaultMeal: "After meal",
    reorderUrl: "https://man.matters",
  },
  {
    name: "BeardMax Beard Growth Serum (Redensyl)",
    defaultStock: 30,
    defaultDose: 1,
    defaultTimes: ["21:30"],
    defaultMeal: "Before meal",
    reorderUrl: "https://man.matters",
  },
  {
    name: "Apple Cider Vinegar Weight Management Gummies",
    defaultStock: 30,
    defaultDose: 2,
    defaultTimes: ["08:30", "13:00"],
    defaultMeal: "Before meal",
    reorderUrl: "https://man.matters",
  },
];

const MAN_MATTERS_PRODUCTS = [
  {
    id: "prod-biotin-gummies",
    category: "Hair",
    badge: "BESTSELLER",
    bgTint: "#E3F2EC",
    accent: "#276B50",
    name: "Biotin Hair Gummies (No Added Sugar)",
    actives: "5000 mcg Biotin · Zinc · Vitamin A, C & E",
    benefit: "Strengthens hair follicles, reduces breakage, and supports thicker hair growth.",
    rating: "4.8",
    reviews: "14.2k",
    price: 499,
    mrp: 699,
    url: "https://man.matters",
  },
  {
    id: "prod-minoxidil-5",
    category: "Hair",
    badge: "CLINICALLY PROVEN",
    bgTint: "#EAEFF9",
    accent: "#3D4E7A",
    name: "Minoxidil 5% Topical Solution (Alcohol-Free)",
    actives: "5% Minoxidil · Procapil · Lipid Base",
    benefit: "Reactivates dormant hair follicles and improves scalp blood circulation without dryness.",
    rating: "4.7",
    reviews: "9.8k",
    price: 649,
    mrp: 899,
    url: "https://man.matters",
  },
  {
    id: "prod-redensyl-tonic",
    category: "Hair",
    badge: "STAGE 1-2 CARE",
    bgTint: "#FDF2D8",
    accent: "#8A5D0A",
    name: "Advanced Hair Tonic with Redensyl & Saw Palmetto",
    actives: "3% Redensyl · Saw Palmetto · Biotin",
    benefit: "Targets DHT buildup and boosts new anagen phase hair sprouts with zero side effects.",
    rating: "4.6",
    reviews: "6.4k",
    price: 599,
    mrp: 799,
    url: "https://man.matters",
  },
  {
    id: "prod-shilajit-gummies",
    category: "Performance",
    badge: "STAMINA & ENERGY",
    bgTint: "#FCECE8",
    accent: "#B54434",
    name: "Pure Himalayan Shilajit & Ashwagandha Gummies",
    actives: "75% Fulvic Acid Shilajit · KSM-66 Ashwagandha",
    benefit: "Boosts daily stamina, workout recovery, and natural vitality with zero bitterness.",
    rating: "4.8",
    reviews: "11.5k",
    price: 549,
    mrp: 749,
    url: "https://man.matters",
  },
  {
    id: "prod-beard-serum",
    category: "Beard",
    badge: "PATCHY BEARD",
    bgTint: "#E3F2EC",
    accent: "#276B50",
    name: "BeardMax Beard Growth Serum",
    actives: "Redensyl · Argan Oil · Vitamin E",
    benefit: "Nourishes facial hair roots to fill patchy spots and soften coarse beard strands.",
    rating: "4.5",
    reviews: "5.1k",
    price: 449,
    mrp: 599,
    url: "https://man.matters",
  },
  {
    id: "prod-sleep-gummies",
    category: "Wellness & Sleep",
    badge: "DEEP RECOVERY",
    bgTint: "#EAEFF9",
    accent: "#3D4E7A",
    name: "Melatonin & Chamomile Deep Sleep Gummies",
    actives: "3 mg Melatonin · L-Theanine · Chamomile",
    benefit: "Helps you fall asleep faster and wake up refreshed without morning grogginess.",
    rating: "4.7",
    reviews: "7.3k",
    price: 399,
    mrp: 549,
    url: "https://man.matters",
  },
];

const emptyForm = {
  product_name: MAN_MATTERS_GUMMY_PRESETS[0].name,
  is_custom_product: false,
  gummies_remaining: 30,
  daily_dose: 1,
  reminder_time: "09:00",
  meal_timing: "After meal",
  dose_schedules: [{ time: "09:00", meal: "After meal" }],
  reorder_threshold: 7,
  reorder_url: "https://man.matters",
  reminder_enabled: true,
};

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function daysRemaining(tracker) {
  const dose = Math.max(1, Number(tracker?.daily_dose) || 1);
  const stock = Math.max(0, Number(tracker?.gummies_remaining) || 0);
  return Math.floor(stock / dose);
}

function isLowOnStock(tracker) {
  const threshold = Number(tracker?.reorder_threshold ?? 7);
  return daysRemaining(tracker) <= threshold;
}

function generateHairSnapshotSvg(stage = "day1") {
  const density = stage === "day24" ? 36 : stage === "day14" ? 24 : 14;
  const label =
    stage === "day24"
      ? "DAY 24 · STRONGER DENSITY"
      : stage === "day14"
      ? "DAY 14 · BABY SPROUTS"
      : "DAY 01 · BASELINE SCAN";

  const strands = Array.from({ length: density }, (_, i) => {
    const x = 65 + ((i * 270) % 270);
    const y = 42 + ((i * 19) % 55);
    const height = stage === "day24" ? 26 : stage === "day14" ? 20 : 14;
    return `<path d="M${x} ${y + height} Q${x + (i % 2 === 0 ? 4 : -4)} ${
      y + height / 2
    } ${x + (i % 3 === 0 ? 6 : -3)} ${y}" stroke="#1E2D27" stroke-width="${
      stage === "day24" ? "2.4" : "1.8"
    }" stroke-linecap="round" fill="none" opacity="0.82"/>`;
  }).join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 220">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#E7F2EC"/>
        <stop offset="100%" stop-color="#D4E5DC"/>
      </linearGradient>
    </defs>
    <rect width="400" height="220" fill="url(#bg)"/>
    <ellipse cx="200" cy="145" rx="125" ry="95" fill="#F2D7C4" stroke="#DFC0AA" stroke-width="2"/>
    <path d="M85 118 Q200 72 315 118" stroke="#388E6C" stroke-width="2" stroke-dasharray="5 5" fill="none"/>
    ${strands}
    <rect x="16" y="16" width="175" height="26" rx="8" fill="#163A2E" opacity="0.9"/>
    <text x="28" y="33" fill="#FFFFFF" font-family="sans-serif" font-size="10" font-weight="bold">${label}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function createSeedCheckups() {
  const day14Date = new Date();
  day14Date.setDate(day14Date.getDate() - 2);
  const day1Date = new Date();
  day1Date.setDate(day1Date.getDate() - 15);

  return [
    {
      id: "seed-day-1",
      dayNumber: 1,
      date: localDateKey(day1Date),
      angle: "Hairline",
      hairFallCount: "50–100 strands",
      thicknessFeel: "Slightly thinner",
      scalpCondition: "Clean & balanced",
      babyHairs: "None yet",
      note: "Baseline checkup before starting daily Biotin & Redensyl regimen.",
      gummiesTakenSoFar: 1,
      imageUrl: generateHairSnapshotSvg("day1"),
      isSimulated: true,
    },
    {
      id: "seed-day-14",
      dayNumber: 14,
      date: localDateKey(day14Date),
      angle: "Hairline",
      hairFallCount: "20–50 strands",
      thicknessFeel: "Same as before",
      scalpCondition: "Clean & balanced",
      babyHairs: "Fine fuzz",
      note: "Noticeably fewer strands on pillow and fine baby hairs along temples.",
      gummiesTakenSoFar: 14,
      imageUrl: generateHairSnapshotSvg("day14"),
      isSimulated: true,
    },
  ];
}

async function askSahilGemini(userText, history, userContext) {
  const lower = userText.toLowerCase();

  if (lower.includes("routine") || lower.includes("review")) {
    return `Here's your current snapshot${
      userContext.userName ? `, ${userContext.userName}` : ""
    }:\n• Active products: ${
      userContext.activeProducts || "Biotin Hair Gummies"
    }\n• Current streak: ${userContext.streak} day(s) · Journey Day ${
      userContext.journeyDay
    }\n\nTip: Taking Biotin gummies right after breakfast improves absorption, and consistency over 12 weeks delivers peak follicle strength.`;
  }
  if (lower.includes("minoxidil") || lower.includes("biotin")) {
    return "Biotin Hair Gummies nourish hair follicles internally with essential vitamins & zinc, while Minoxidil 5% works topically to increase scalp blood flow. Using both together is our gold-standard Stage 2 hair regrowth combo!";
  }
  if (lower.includes("boost") || lower.includes("result") || lower.includes("hair")) {
    return "To maximize hair results:\n1. Never miss your daily dose window.\n2. Keep scalp clean with a gentle anti-DHT shampoo 3x a week.\n3. Aim for 7+ hours of sleep and log a weekly hairline photo in your Progress tab.";
  }

  return `Great question! Based on your ${
    userContext.concerns?.[0] || "wellness"
  } focus, staying consistent with your daily ${
    userContext.activeProducts || "Dosemate routine"
  } is key. Would you like tips on optimal meal timing or pairing products?`;
}

/**
 * Shared Outer Web Shell with Toast Notifications
 */
function WebAppShell({ children, toasts = [] }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#F4F7F5] dark:bg-[#0B0F0E] text-[#1A2B24] dark:text-[#F1F5F3] dark:bg-[#0B0F0E] dark:text-[#F1F5F3] antialiased">
      {children}

      {/* Floating Toast Stack */}
      {toasts.length > 0 && (
        <div
          aria-live="polite"
          className="fixed top-20 right-4 z-50 flex flex-col gap-2 sm:right-6"
        >
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`flex items-center gap-2.5 rounded-2xl border px-4 py-3 text-xs font-bold shadow-lg transition ${
                t.type === "error"
                  ? "border-[#F5C6BA] bg-[#FDF6F4] text-[#9C331C]"
                  : t.type === "info"
                  ? "border-[#DCE5DF] dark:border-[#22332A] bg-white dark:bg-[#131A16] text-[#1A2B24] dark:text-[#F1F5F3]"
                  : "border-[#BFE3D3] dark:border-[#00E599]/30 bg-[#163A2E] dark:bg-[#0F1713] text-white"
              }`}
            >
              <CircleCheck size={15} className="shrink-0" />
              <span>{String(t.message)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Dedicated Sign-In / Sign-Up Landing Screen
 */
function SignInScreen({
  authMode,
  setAuthMode,
  email,
  setEmail,
  password,
  setPassword,
  authBusy,
  submitAuth,
  signInWithGoogle,
  signInAsGuest,
}) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-4 py-10 sm:px-6">
      <div className="grid w-full grid-cols-1 overflow-hidden rounded-3xl border border-[#DCE5DF] dark:border-[#22332A] bg-white dark:bg-[#131A16] shadow-xl lg:grid-cols-12">
        {/* Left Brand Showcase */}
        <div className="flex flex-col justify-between bg-[#163A2E] dark:bg-[#0F1713] p-8 text-white sm:p-10 lg:col-span-6">
          <div>
            <div className="inline-flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#388E6C] bg-[#388E6C] dark:bg-[#00E599] text-white dark:text-[#061810] shadow-2xs">
                <ShieldCheck size={20} />
              </span>
              <div className="flex flex-col leading-tight">
                <span className="text-lg font-extrabold tracking-tight">
                  Dose<span className="font-normal text-[#A8C4B8]">mate</span>
                </span>
                <span className="text-[10px] font-semibold tracking-wider text-[#86E3C3] uppercase">
                  Powered by Man Matters
                </span>
              </div>
            </div>

            <h1 className="mt-8 text-3xl leading-tight font-extrabold sm:text-4xl">
              Your daily men&apos;s wellness &amp; hair growth companion.
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-[#A8C4B8]">
              Track daily gummy &amp; tonic doses, monitor bottle supply before running out, and compare real hairline progress photos.
            </p>
          </div>

          <div className="mt-8 space-y-3 border-t border-white/10 pt-6 text-xs text-[#D5E6DF]">
            <div className="flex items-center gap-2.5">
              <CircleCheck size={16} className="text-[#86E3C3]" />
              <span>Smart meal-timed reminders &amp; streak tracking</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CircleCheck size={16} className="text-[#86E3C3]" />
              <span>Before &amp; after hairline split-slider checkups</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CircleCheck size={16} className="text-[#86E3C3]" />
              <span>24/7 guidance from Dosemate AI specialist</span>
            </div>
          </div>
        </div>

        {/* Right Authentication Form */}
        <div className="flex flex-col justify-center p-8 sm:p-10 lg:col-span-6">
          <div className="mb-6 flex rounded-2xl bg-[#F4F7F5] dark:bg-[#0B0F0E] p-1">
            <button
              type="button"
              onClick={() => setAuthMode("signin")}
              className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition ${
                authMode === "signin"
                  ? "bg-white dark:bg-[#131A16] text-[#1A2B24] dark:text-[#F1F5F3] shadow-2xs"
                  : "text-[#5E736A] dark:text-[#8EA399]"
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setAuthMode("signup")}
              className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition ${
                authMode === "signup"
                  ? "bg-white dark:bg-[#131A16] text-[#1A2B24] dark:text-[#F1F5F3] shadow-2xs"
                  : "text-[#5E736A] dark:text-[#8EA399]"
              }`}
            >
              Create account
            </button>
          </div>

          <form onSubmit={(e) => void submitAuth(e)} className="space-y-4">
            <div>
              <label htmlFor="auth-email" className="block text-xs font-bold text-[#3E4C59] dark:text-[#A0B4AA]">
                Email address
              </label>
              <input
                id="auth-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="yourname@gmail.com"
                className="mt-1.5 w-full rounded-xl border border-[#D5DCE4] dark:border-[#25382E] bg-[#F7F8FA] dark:bg-[#17201C] px-3.5 py-3 text-xs font-semibold text-[#141A21] dark:text-[#F1F5F3] outline-none transition focus:border-[#388E6C] dark:focus:border-[#00E599] dark:border-[#00E599] focus:bg-white dark:bg-[#131A16]"
              />
            </div>

            <div>
              <label
                htmlFor="auth-password"
                className="block text-xs font-bold text-[#3E4C59] dark:text-[#A0B4AA]"
              >
                Password
              </label>
              <input
                id="auth-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1.5 w-full rounded-xl border border-[#D5DCE4] dark:border-[#25382E] bg-[#F7F8FA] dark:bg-[#17201C] px-3.5 py-3 text-xs font-semibold text-[#141A21] dark:text-[#F1F5F3] outline-none transition focus:border-[#388E6C] dark:focus:border-[#00E599] dark:border-[#00E599] focus:bg-white dark:bg-[#131A16]"
              />
            </div>

            <button
              type="submit"
              disabled={authBusy}
              className="w-full rounded-xl bg-[#388E6C] dark:bg-[#00E599] dark:text-[#061810] py-3 text-xs font-bold text-white shadow-sm transition hover:bg-[#2E775A] dark:hover:bg-[#00CC88] disabled:opacity-60"
            >
              {authBusy
                ? "Please wait…"
                : authMode === "signup"
                ? "Create Account & Personalize"
                : "Sign In to Dashboard"}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3 text-[11px] font-bold text-[#72877E] dark:text-[#7D9489]">
            <span className="h-px flex-1 bg-[#EAEFEA] dark:bg-[#22332A]" />
            <span>OR CONTINUE WITH</span>
            <span className="h-px flex-1 bg-[#EAEFEA] dark:bg-[#22332A]" />
          </div>

          <div className="space-y-2.5">
            <button
              type="button"
              disabled={authBusy}
              onClick={() => void signInWithGoogle()}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#DCE5DF] dark:border-[#22332A] bg-white dark:bg-[#131A16] py-3 text-xs font-bold text-[#1A2B24] dark:text-[#F1F5F3] transition hover:bg-[#F4F7F5] dark:hover:bg-[#1A2520] dark:bg-[#0B0F0E]"
            >
              <UserCheck size={15} className="text-[#388E6C] dark:text-[#00E599]" />
              <span>Continue with Google</span>
            </button>

            <button
              type="button"
              disabled={authBusy}
              onClick={() => void signInAsGuest()}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#BFE3D3] dark:border-[#00E599]/40 bg-[#E3F2EC] dark:bg-[#00E599]/15 py-3 text-xs font-bold text-[#163A2E] dark:text-[#00E599] transition hover:bg-[#E3F2EC] dark:hover:bg-[#00E599]/25"
            >
              <Sparkles size={15} className="text-[#388E6C] dark:text-[#00E599]" />
              <span>Continue as Instant Guest</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Post-Sign-In Health Profile & Onboarding Assessment Wizard (One Question at a Time)
 */
function HealthOnboardingWizard({ userEmail, existingProfile, onComplete, onSkip, onSignOut }) {
  const defaultName =
    existingProfile?.fullName ||
    (userEmail && !userEmail.includes("guest")
      ? userEmail
          .split("@")[0]
          .replace(/[._-]/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase())
      : "");

  const [step, setStep] = useState(0);
  const [fullName, setFullName] = useState(defaultName);
  const [age, setAge] = useState(existingProfile?.age || 28);
  const [concerns, setConcerns] = useState(
    existingProfile?.concerns || ["Hair Fall & Thinning"]
  );
  const [hairStage, setHairStage] = useState(
    existingProfile?.hairStage || "Stage 2 (Receding temples)"
  );
  const [sleepHours, setSleepHours] = useState(existingProfile?.sleepHours || "6–7 hrs");
  const [stressLevel, setStressLevel] = useState(existingProfile?.stressLevel || "Moderate");
  const [selectedProducts, setSelectedProducts] = useState(
    existingProfile?.selectedProducts || ["Biotin Hair Gummies (No Added Sugar)"]
  );
  const [customProductText, setCustomProductText] = useState("");
  const [goalHorizon, setGoalHorizon] = useState(existingProfile?.goalHorizon || "12 Weeks");
  const [preferredReminder, setPreferredReminder] = useState(
    existingProfile?.preferredReminder || "09:00"
  );
  const [submitting, setSubmitting] = useState(false);

  const TOTAL_STEPS = 5;

  const CONCERN_OPTIONS = [
    "Hair Fall & Thinning",
    "Patchy Beard",
    "Daily Energy & Stamina",
    "Deep Sleep & Stress",
    "Weight & Gut Health",
    "Dandruff & Scalp Care",
  ];

  const HAIR_STAGES = [
    "Stage 1 (Minimal / Prevention)",
    "Stage 2 (Receding temples)",
    "Stage 3 (Crown & hairline thinning)",
    "Stage 4+ (Advanced thinning)",
  ];

  function toggleConcern(item) {
    setConcerns((prev) =>
      prev.includes(item)
        ? prev.length > 1
          ? prev.filter((c) => c !== item)
          : prev
        : [...prev, item]
    );
  }

  function toggleProduct(name) {
    setSelectedProducts((prev) =>
      prev.includes(name) ? prev.filter((p) => p !== name) : [...prev, name]
    );
  }

  function handleAddCustomProduct() {
    const trimmed = customProductText.trim();
    if (!trimmed) return;
    if (!selectedProducts.includes(trimmed)) {
      setSelectedProducts((prev) => [...prev, trimmed]);
    }
    setCustomProductText("");
  }

  async function handleFinish(overrideProfile = null) {
    setSubmitting(true);
    const profileData = overrideProfile || {
      fullName: fullName.trim() || "Arjun",
      age: Number(age) || 28,
      sleepHours,
      stressLevel,
      concerns,
      hairStage,
      selectedProducts:
        selectedProducts.length > 0
          ? selectedProducts
          : ["Biotin Hair Gummies (No Added Sugar)"],
      goalHorizon,
      preferredReminder,
      avatarUrl: existingProfile?.avatarUrl || "",
      completedAt: new Date().toISOString(),
    };
    await onComplete(profileData);
    setSubmitting(false);
  }

  async function handleSkipNow() {
    if (onSkip) {
      onSkip();
      return;
    }
    await handleFinish({
      fullName: fullName.trim() || defaultName || "Member",
      age: Number(age) || 28,
      sleepHours: "6–7 hrs",
      stressLevel: "Moderate",
      concerns: ["Hair Fall & Thinning"],
      hairStage: "Stage 1 (Minimal / Prevention)",
      selectedProducts: ["Biotin Hair Gummies (No Added Sugar)"],
      goalHorizon: "12 Weeks",
      preferredReminder: "09:00",
      avatarUrl: existingProfile?.avatarUrl || "",
      skippedAt: new Date().toISOString(),
    });
  }

  function handleNext(e) {
    if (e) e.preventDefault();
    if (step < TOTAL_STEPS - 1) {
      setStep((s) => s + 1);
    } else {
      void handleFinish();
    }
  }

  const progressPercent = Math.round(((step + 1) / TOTAL_STEPS) * 100);

  return (
    <div className="mx-auto flex min-h-[calc(100vh-84px)] w-full max-w-2xl flex-col justify-center px-4 py-8 sm:px-6">
      <div className="overflow-hidden rounded-3xl border border-[#DCE5DF] dark:border-[#22332A] bg-white dark:bg-[#131A16] shadow-xl">
        {/* Top Progress Header with Prominent Skip Option */}
        <div className="border-b border-[#EAEFEA] dark:border-[#1B2922] bg-[#F9FBFA] dark:bg-[#17201C] px-6 py-4 sm:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#E3F2EC] dark:bg-[#00E599]/15 text-[#388E6C] dark:text-[#00E599]">
                <Sparkles size={13} />
              </span>
              <span className="text-xs font-bold tracking-wide text-[#5E736A] dark:text-[#8EA399]">
                Step {step + 1} of {TOTAL_STEPS}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {onSignOut && (
                <button
                  type="button"
                  onClick={onSignOut}
                  className="rounded-xl px-2.5 py-1.5 text-xs font-semibold text-[#C53030] dark:text-[#FF8080] transition hover:bg-[#FFF5F5] dark:hover:bg-[#201515]"
                >
                  Log out
                </button>
              )}
              <button
                type="button"
                disabled={submitting}
                onClick={() => void handleSkipNow()}
                className="rounded-xl px-3 py-1.5 text-xs font-bold text-[#5E736A] dark:text-[#8EA399] transition hover:bg-[#EAEFEA] dark:hover:bg-[#1E2C25] hover:text-[#1A2B24] dark:text-[#F1F5F3] disabled:opacity-50"
              >
                Skip for now →
              </button>
            </div>
          </div>

          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#E4ECE7]">
            <div
              className="h-full rounded-full bg-[#388E6C] dark:bg-[#00E599] dark:text-[#061810] transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Single-Question Interactive Body */}
        <form onSubmit={handleNext} className="p-6 sm:p-10">
          {step === 0 && (
            <div className="space-y-6">
              <div>
                <span className="inline-block rounded-full bg-[#E3F2EC] dark:bg-[#00E599]/15 px-3 py-1 text-[11px] font-bold text-[#276B50] dark:text-[#00E599]">
                  Welcome to Dosemate · Powered by Man Matters 👋
                </span>
                <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-[#1A2B24] dark:text-[#F1F5F3] sm:text-3xl">
                  Let&apos;s personalize your journey.
                </h1>
                <p className="mt-1.5 text-sm text-[#5E736A] dark:text-[#8EA399]">
                  First, what should we call you?
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <label htmlFor="onb-name" className="block text-xs font-bold text-[#3E4C59] dark:text-[#A0B4AA]">
                    First name
                  </label>
                  <input
                    id="onb-name"
                    type="text"
                    autoFocus
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Arjun"
                    className="mt-1.5 w-full rounded-2xl border border-[#D5DCE4] dark:border-[#25382E] bg-[#F7F8FA] dark:bg-[#17201C] px-4 py-3 text-sm font-semibold text-[#141A21] dark:text-[#F1F5F3] outline-none transition focus:border-[#388E6C] dark:focus:border-[#00E599] dark:border-[#00E599] focus:bg-white dark:bg-[#131A16]"
                  />
                </div>

                <div>
                  <label htmlFor="onb-age" className="block text-xs font-bold text-[#3E4C59] dark:text-[#A0B4AA]">
                    Age
                  </label>
                  <input
                    id="onb-age"
                    type="number"
                    min={18}
                    max={85}
                    required
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="mt-1.5 w-full rounded-2xl border border-[#D5DCE4] dark:border-[#25382E] bg-[#F7F8FA] dark:bg-[#17201C] px-4 py-3 text-sm font-semibold text-[#141A21] dark:text-[#F1F5F3] outline-none transition focus:border-[#388E6C] dark:focus:border-[#00E599] dark:border-[#00E599] focus:bg-white dark:bg-[#131A16]"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight text-[#1A2B24] dark:text-[#F1F5F3]">
                  What&apos;s your main focus right now{fullName ? `, ${fullName.split(" ")[0]}` : ""}?
                </h2>
                <p className="mt-1 text-xs text-[#5E736A] dark:text-[#8EA399]">Pick one or more goals.</p>
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {CONCERN_OPTIONS.map((item) => {
                  const active = concerns.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleConcern(item)}
                      className={`flex items-center justify-between rounded-2xl border px-4 py-3.5 text-left text-xs font-bold transition ${
                        active
                          ? "border-[#388E6C] dark:border-[#00E599] bg-[#E3F2EC] dark:bg-[#00E599]/15 text-[#163A2E] dark:text-white dark:text-white shadow-2xs"
                          : "border-[#DCE5DF] dark:border-[#22332A] bg-[#F9FBFA] dark:bg-[#17201C] text-[#485C53] dark:text-[#B8CCC2] hover:bg-[#F4F7F5] dark:hover:bg-[#1A2520]"
                      }`}
                    >
                      <span>{item}</span>
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                          active ? "bg-[#388E6C] dark:bg-[#00E599] text-white dark:text-[#061810]" : "border border-[#CFD8D3] dark:border-[#2A3F34] bg-white dark:bg-[#131A16]"
                        }`}
                      >
                        {active && <Check size={12} />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight text-[#1A2B24] dark:text-[#F1F5F3]">
                  Quick hair &amp; lifestyle check
                </h2>
                <p className="mt-1 text-xs text-[#5E736A] dark:text-[#8EA399]">
                  Helps Dosemate AI tailor daily tips for you.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#3E4C59] dark:text-[#A0B4AA]">Hair stage</label>
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {HAIR_STAGES.map((stage) => (
                    <button
                      key={stage}
                      type="button"
                      onClick={() => setHairStage(stage)}
                      className={`flex items-center justify-between rounded-2xl border px-3.5 py-3 text-left text-xs font-bold transition ${
                        hairStage === stage
                          ? "border-[#388E6C] dark:border-[#00E599] bg-[#E3F2EC] dark:bg-[#00E599]/15 text-[#163A2E] dark:text-white dark:text-white"
                          : "border-[#DCE5DF] dark:border-[#22332A] bg-[#F9FBFA] dark:bg-[#17201C] text-[#5E736A] dark:text-[#8EA399] hover:bg-[#F4F7F5] dark:hover:bg-[#1A2520]"
                      }`}
                    >
                      <span>{stage}</span>
                      {hairStage === stage && <Check size={14} className="shrink-0 text-[#388E6C] dark:text-[#00E599]" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 pt-1 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-[#3E4C59] dark:text-[#A0B4AA]">Nightly sleep</label>
                  <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                    {["< 6 hrs", "6–7 hrs", "7–8+ hrs"].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setSleepHours(opt)}
                        className={`rounded-xl py-2.5 text-xs font-bold transition ${
                          sleepHours === opt
                            ? "bg-[#388E6C] bg-[#388E6C] dark:bg-[#00E599] text-white dark:text-[#061810]"
                            : "border border-[#DCE5DF] dark:border-[#22332A] bg-[#F4F7F5] dark:bg-[#0B0F0E] text-[#5E736A] dark:text-[#8EA399]"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#3E4C59] dark:text-[#A0B4AA]">Stress level</label>
                  <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                    {["Low", "Moderate", "High"].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setStressLevel(opt)}
                        className={`rounded-xl py-2.5 text-xs font-bold transition ${
                          stressLevel === opt
                            ? "bg-[#388E6C] bg-[#388E6C] dark:bg-[#00E599] text-white dark:text-[#061810]"
                            : "border border-[#DCE5DF] dark:border-[#22332A] bg-[#F4F7F5] dark:bg-[#0B0F0E] text-[#5E736A] dark:text-[#8EA399]"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight text-[#1A2B24] dark:text-[#F1F5F3]">
                  Using any supplements or tonics already?
                </h2>
                <p className="mt-1 text-xs text-[#5E736A] dark:text-[#8EA399]">
                  We&apos;ll set up your daily dose trackers automatically.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {MAN_MATTERS_GUMMY_PRESETS.map((preset) => {
                  const checked = selectedProducts.includes(preset.name);
                  return (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => toggleProduct(preset.name)}
                      className={`flex items-center justify-between gap-2 rounded-2xl border p-3 text-left text-xs font-bold transition ${
                        checked
                          ? "border-[#388E6C] dark:border-[#00E599] bg-[#E3F2EC] dark:bg-[#00E599]/15 dark:bg-[#00E599]/15 text-[#163A2E] dark:text-white"
                          : "border-[#DCE5DF] dark:border-[#22332A] bg-[#F9FBFA] dark:bg-[#17201C] text-[#5E736A] dark:text-[#8EA399] hover:bg-white dark:bg-[#131A16]"
                      }`}
                    >
                      <span className="line-clamp-1">{preset.name}</span>
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md ${
                          checked
                            ? "bg-[#388E6C] bg-[#388E6C] dark:bg-[#00E599] text-white dark:text-[#061810]"
                            : "border border-[#D5DCE4] dark:border-[#25382E] bg-white dark:bg-[#131A16]"
                        }`}
                      >
                        {checked && <Check size={12} />}
                      </span>
                    </button>
                  );
                })}

                {selectedProducts
                  .filter((name) => !MAN_MATTERS_GUMMY_PRESETS.some((p) => p.name === name))
                  .map((customName) => (
                    <button
                      key={customName}
                      type="button"
                      onClick={() => toggleProduct(customName)}
                      className="flex items-center justify-between gap-2 rounded-2xl border border-[#388E6C] dark:border-[#00E599] bg-[#E3F2EC] dark:bg-[#00E599]/15 dark:bg-[#00E599]/15 p-3 text-left text-xs font-bold text-[#163A2E] dark:text-white"
                    >
                      <span className="line-clamp-1">{customName}</span>
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#388E6C] bg-[#388E6C] dark:bg-[#00E599] text-white dark:text-[#061810]">
                        <Check size={12} />
                      </span>
                    </button>
                  ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={customProductText}
                  onChange={(e) => setCustomProductText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddCustomProduct();
                    }
                  }}
                  placeholder="+ Add custom product..."
                  className="flex-1 rounded-xl border border-[#D5DCE4] dark:border-[#25382E] bg-[#F7F8FA] dark:bg-[#17201C] px-3.5 py-2.5 text-xs text-[#1A2B24] dark:text-[#F1F5F3] outline-none focus:border-[#388E6C] dark:focus:border-[#00E599] dark:border-[#00E599] focus:bg-white dark:bg-[#131A16]"
                />
                <button
                  type="button"
                  onClick={handleAddCustomProduct}
                  className="rounded-xl border border-[#388E6C] dark:border-[#00E599] bg-[#E3F2EC] dark:bg-[#00E599]/15 px-4 py-2 text-xs font-bold text-[#276B50] dark:text-[#00E599] transition hover:bg-[#388E6C] dark:bg-[#00E599] dark:text-[#061810] hover:text-white"
                >
                  Add
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight text-[#1A2B24] dark:text-[#F1F5F3]">
                  When should we remind you?
                </h2>
                <p className="mt-1 text-xs text-[#5E736A] dark:text-[#8EA399]">
                  Consistency is key—pick a goal horizon and daily reminder time.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#3E4C59] dark:text-[#A0B4AA]">Goal timeline</label>
                <div className="mt-2 grid grid-cols-3 gap-2.5">
                  {["8 Weeks", "12 Weeks", "24 Weeks"].map((goal) => (
                    <button
                      key={goal}
                      type="button"
                      onClick={() => setGoalHorizon(goal)}
                      className={`rounded-2xl py-3 text-xs font-bold transition ${
                        goalHorizon === goal
                          ? "bg-[#388E6C] bg-[#388E6C] dark:bg-[#00E599] text-white dark:text-[#061810] shadow-2xs"
                          : "border border-[#DCE5DF] dark:border-[#22332A] bg-[#F4F7F5] dark:bg-[#0B0F0E] text-[#5E736A] dark:text-[#8EA399] hover:bg-[#EAEFEA] dark:hover:bg-[#1E2C25]"
                      }`}
                    >
                      {goal}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="onb-time" className="block text-xs font-bold text-[#3E4C59] dark:text-[#A0B4AA]">
                  Morning dose reminder
                </label>
                <input
                  id="onb-time"
                  type="time"
                  value={preferredReminder}
                  onChange={(e) => setPreferredReminder(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-[#D5DCE4] dark:border-[#25382E] bg-[#F7F8FA] dark:bg-[#17201C] px-4 py-3 text-sm font-bold text-[#141A21] dark:text-[#F1F5F3] outline-none focus:border-[#388E6C] dark:focus:border-[#00E599] dark:border-[#00E599] focus:bg-white dark:bg-[#131A16]"
                />
              </div>
            </div>
          )}

          {/* Step Navigation Footer */}
          <div className="mt-8 flex items-center justify-between gap-3 border-t border-[#EAEFEA] dark:border-[#1B2922] pt-5">
            {step > 0 ? (
              <button
                type="button"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#DCE5DF] dark:border-[#22332A] bg-white dark:bg-[#131A16] px-4 py-3 text-xs font-bold text-[#485C53] dark:text-[#B8CCC2] transition hover:bg-[#F4F7F5] dark:hover:bg-[#1A2520] dark:bg-[#0B0F0E]"
              >
                <ArrowLeft size={15} />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-[#388E6C] dark:bg-[#00E599] dark:text-[#061810] px-6 py-3 text-xs font-bold text-white shadow-md transition hover:bg-[#2E775A] dark:hover:bg-[#00CC88] active:scale-[0.98] disabled:opacity-60"
            >
              <span>
                {submitting
                  ? "Setting up…"
                  : step === TOTAL_STEPS - 1
                  ? "Start My Journey"
                  : "Continue"}
              </span>
              <ArrowRight size={15} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Progress & Daily Hair Condition Page Component ("Progress")
 */
function HairCheckupPage({
  today,
  currentJourneyDay,
  primaryGummyName,
  totalGummiesConsumed,
  checkups,
  onAddCheckup,
  onDeleteCheckup,
  showToast,
}) {
  const [selectedAngle, setSelectedAngle] = useState("Hairline");
  const [hairFallCount, setHairFallCount] = useState("20–50 strands");
  const [thicknessFeel, setThicknessFeel] = useState("Same as before");
  const [scalpCondition, setScalpCondition] = useState("Clean & balanced");
  const [babyHairs, setBabyHairs] = useState("Fine fuzz");
  const [note, setNote] = useState("");
  const [customImage, setCustomImage] = useState(null);
  const [compareDayA, setCompareDayA] = useState("1");
  const [compareDayB, setCompareDayB] = useState("14");
  const [sliderPos, setSliderPos] = useState(50);

  const sortedCheckups = useMemo(
    () => [...checkups].sort((a, b) => a.dayNumber - b.dayNumber),
    [checkups]
  );

  const baselineSnapshot = useMemo(() => {
    return (
      sortedCheckups.find((c) => c.dayNumber.toString() === compareDayA) ||
      sortedCheckups[0]
    );
  }, [sortedCheckups, compareDayA]);

  const selectedSnapshot = useMemo(() => {
    return (
      sortedCheckups.find((c) => c.dayNumber.toString() === compareDayB) ||
      sortedCheckups[sortedCheckups.length - 1] ||
      sortedCheckups[0]
    );
  }, [sortedCheckups, compareDayB]);

  const todayLogged = checkups.some((c) => c.date === today);

  async function handleCaptureToday(e) {
    e.preventDefault();
    const simulatedSvg = generateHairSnapshotSvg(
      currentJourneyDay > 20 ? "day24" : currentJourneyDay > 10 ? "day14" : "day1"
    );
    const newEntry = {
      id: `checkup-${Date.now()}`,
      dayNumber: currentJourneyDay,
      date: today,
      angle: selectedAngle,
      hairFallCount,
      thicknessFeel,
      scalpCondition,
      babyHairs,
      note:
        note.trim() ||
        `Day ${currentJourneyDay}: Hair fall ${hairFallCount}, thickness feels ${thicknessFeel.toLowerCase()}.`,
      gummiesTakenSoFar: totalGummiesConsumed,
      imageUrl: customImage || simulatedSvg,
      isSimulated: !customImage,
    };
    await onAddCheckup(newEntry);
    setCompareDayB(String(currentJourneyDay));
    setNote("");
    setCustomImage(null);
  }

  function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 750_000) {
      showToast("Please select a photo under 750 KB for fast storage.", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setCustomImage(event.target?.result);
      showToast("Photo uploaded and ready to save!", "success");
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-3 border-b border-[#DCE5DF] dark:border-[#22332A] pb-5 sm:flex-row sm:items-end">
        <div>
          <span className="rounded-md bg-[#E3F2EC] dark:bg-[#00E599]/15 px-2.5 py-1 text-[11px] font-bold text-[#388E6C] dark:text-[#00E599]">
            DAY {currentJourneyDay} HAIR JOURNEY
          </span>
          <h1 className="mt-2 text-2xl font-extrabold text-[#1A2B24] dark:text-[#F1F5F3] sm:text-3xl">
            Hair Growth &amp; Condition Checkup
          </h1>
          <p className="mt-1 text-sm text-[#5E736A] dark:text-[#8EA399]">
            Log daily hair fall, thickness feel, and visual snapshots to track real changes over time.
          </p>
        </div>
        <div className="rounded-2xl border border-[#DCE5DF] dark:border-[#22332A] bg-white dark:bg-[#131A16] px-4 py-2.5 text-xs font-semibold text-[#3E4C59] dark:text-[#A0B4AA]">
          Primary Regimen: <strong className="text-[#1A2B24] dark:text-[#F1F5F3]">{primaryGummyName}</strong> ·{" "}
          <span className="text-[#388E6C] dark:text-[#00E599]">{totalGummiesConsumed} doses logged</span>
        </div>
      </div>

      {/* Main 2-Column Workspace */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Daily Check-In Questions & Photo Capture */}
        <div className="lg:col-span-6">
          <div className="rounded-3xl border border-[#DCE5DF] dark:border-[#22332A] bg-white dark:bg-[#131A16] p-5 shadow-2xs sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-2xl font-bold ${
                    todayLogged ? "bg-[#388E6C] bg-[#388E6C] dark:bg-[#00E599] text-white dark:text-[#061810]" : "bg-[#FDF2D8] text-[#B87D14]"
                  }`}
                >
                  {todayLogged ? <Check size={18} /> : <Camera size={18} />}
                </span>
                <div>
                  <h2 className="text-base font-bold text-[#1A2B24] dark:text-[#F1F5F3]">
                    {todayLogged
                      ? "Today's checkup is logged"
                      : "Today's Condition & Photo Checkup"}
                  </h2>
                  <p className="text-xs text-[#5E736A] dark:text-[#8EA399]">
                    Answer 4 quick questions to record today&apos;s hair response
                  </p>
                </div>
              </div>
              {todayLogged && (
                <span className="rounded-full bg-[#E3F2EC] dark:bg-[#00E599]/15 px-3 py-1 text-[11px] font-bold text-[#276B50] dark:text-[#00E599]">
                  LOGGED TODAY
                </span>
              )}
            </div>

            <form
              onSubmit={(e) => void handleCaptureToday(e)}
              className="mt-5 space-y-4 border-t border-[#EAEFEA] dark:border-[#1B2922] pt-5"
            >
              {/* Focus Area */}
              <div>
                <label className="block text-xs font-bold text-[#3E4C59] dark:text-[#A0B4AA]">
                  1. Photo Focus Area
                </label>
                <div className="mt-1.5 grid grid-cols-3 gap-2">
                  {["Hairline", "Crown", "Temples"].map((angle) => (
                    <button
                      key={angle}
                      type="button"
                      onClick={() => setSelectedAngle(angle)}
                      className={`rounded-xl py-2 text-xs font-bold transition ${
                        selectedAngle === angle
                          ? "bg-[#388E6C] bg-[#388E6C] dark:bg-[#00E599] text-white dark:text-[#061810] shadow-2xs"
                          : "border border-[#DCE5DF] dark:border-[#22332A] bg-[#F4F7F5] dark:bg-[#0B0F0E] text-[#5E736A] dark:text-[#8EA399] hover:bg-[#EAEFEA] dark:hover:bg-[#1E2C25]"
                      }`}
                    >
                      {angle}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question 2: Hair fall today */}
              <div>
                <label className="block text-xs font-bold text-[#3E4C59] dark:text-[#A0B4AA]">
                  2. Roughly how many strands fell out today?
                </label>
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  {["< 20 strands", "20–50 strands", "50–100 strands", "100+ strands"].map(
                    (opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setHairFallCount(opt)}
                        className={`rounded-xl px-3 py-2 text-left text-xs font-semibold transition ${
                          hairFallCount === opt
                            ? "border border-[#388E6C] dark:border-[#00E599] bg-[#E3F2EC] dark:bg-[#00E599]/15 text-[#163A2E] dark:text-white dark:text-white"
                            : "border border-[#DCE5DF] dark:border-[#22332A] bg-[#F9FBFA] dark:bg-[#17201C] text-[#5E736A] dark:text-[#8EA399] hover:bg-[#F4F7F5] dark:hover:bg-[#1A2520] dark:bg-[#0B0F0E]"
                        }`}
                      >
                        {opt}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Question 3: Thickness feel */}
              <div>
                <label className="block text-xs font-bold text-[#3E4C59] dark:text-[#A0B4AA]">
                  3. How does your hair thickness feel compared to last week?
                </label>
                <div className="mt-1.5 grid grid-cols-3 gap-2">
                  {["Thicker & fuller", "Same as before", "Slightly thinner"].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setThicknessFeel(opt)}
                      className={`rounded-xl px-2.5 py-2 text-center text-xs font-semibold transition ${
                        thicknessFeel === opt
                          ? "border border-[#388E6C] dark:border-[#00E599] bg-[#E3F2EC] dark:bg-[#00E599]/15 text-[#163A2E] dark:text-white dark:text-white"
                          : "border border-[#DCE5DF] dark:border-[#22332A] bg-[#F9FBFA] dark:bg-[#17201C] text-[#5E736A] dark:text-[#8EA399] hover:bg-[#F4F7F5] dark:hover:bg-[#1A2520] dark:bg-[#0B0F0E]"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question 4 & 5: Scalp & Baby hairs */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-[#3E4C59] dark:text-[#A0B4AA]">
                    4. Scalp Condition
                  </label>
                  <select
                    value={scalpCondition}
                    onChange={(e) => setScalpCondition(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-[#DCE5DF] dark:border-[#22332A] bg-[#F9FBFA] dark:bg-[#17201C] px-3 py-2.5 text-xs font-semibold text-[#1A2B24] dark:text-[#F1F5F3] outline-none focus:border-[#388E6C] dark:focus:border-[#00E599] dark:border-[#00E599]"
                  >
                    <option value="Clean & balanced">Clean &amp; balanced</option>
                    <option value="Oily / sweaty">Oily / sweaty</option>
                    <option value="Itchy or flaky">Itchy or flaky</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#3E4C59] dark:text-[#A0B4AA]">
                    5. New Baby Hair Growth
                  </label>
                  <select
                    value={babyHairs}
                    onChange={(e) => setBabyHairs(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-[#DCE5DF] dark:border-[#22332A] bg-[#F9FBFA] dark:bg-[#17201C] px-3 py-2.5 text-xs font-semibold text-[#1A2B24] dark:text-[#F1F5F3] outline-none focus:border-[#388E6C] dark:focus:border-[#00E599] dark:border-[#00E599]"
                  >
                    <option value="None yet">None yet</option>
                    <option value="Fine fuzz">Fine fuzz along temples</option>
                    <option value="Visible sprouts">Visible thicker sprouts</option>
                  </select>
                </div>
              </div>

              {/* Optional Observation Note */}
              <div>
                <label className="block text-xs font-bold text-[#3E4C59] dark:text-[#A0B4AA]">
                  Observation Note{" "}
                  <span className="font-normal text-[#72877E] dark:text-[#7D9489]">(optional)</span>
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Less hair on pillow this morning..."
                  className="mt-1.5 w-full rounded-xl border border-[#DCE5DF] dark:border-[#22332A] bg-[#F9FBFA] dark:bg-[#17201C] px-3.5 py-2.5 text-xs text-[#1A2B24] dark:text-[#F1F5F3] outline-none focus:border-[#388E6C] dark:focus:border-[#00E599] dark:border-[#00E599]"
                />
              </div>

              {/* Snapshot Preview */}
              <div className="relative overflow-hidden rounded-2xl border border-[#DCE5DF] dark:border-[#22332A] bg-[#F4F7F5] dark:bg-[#0B0F0E]">
                <img
                  src={
                    customImage ||
                    generateHairSnapshotSvg(currentJourneyDay > 20 ? "day24" : "day14")
                  }
                  alt="Hair checkup preview"
                  className="mx-auto h-44 w-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/70 to-transparent px-3.5 py-2.5 text-white">
                  <span className="text-[11px] font-bold tracking-wider uppercase">
                    Day {currentJourneyDay} · {selectedAngle}
                  </span>
                  <span className="text-[10px] text-white/85">
                    {customImage ? "Uploaded photo" : "Guided scan preview"}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2.5 sm:flex-row">
                <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#DCE5DF] dark:border-[#22332A] bg-white dark:bg-[#131A16] py-3 text-xs font-bold text-[#485C53] dark:text-[#B8CCC2] transition hover:bg-[#F4F7F5] dark:hover:bg-[#1A2520] dark:bg-[#0B0F0E]">
                  <Upload size={15} />
                  <span>Upload Real Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                <button
                  type="submit"
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#388E6C] dark:bg-[#00E599] dark:text-[#061810] py-3 text-xs font-bold text-white shadow-sm transition hover:bg-[#2E775A] dark:hover:bg-[#00CC88]"
                >
                  <Camera size={15} />
                  <span>Save Today&apos;s Checkup</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Interactive Before & After Comparison Slider + Timeline */}
        <div className="space-y-6 lg:col-span-6">
          <section className="rounded-3xl border border-[#DCE5DF] dark:border-[#22332A] bg-white dark:bg-[#131A16] p-5 shadow-2xs sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold tracking-wider text-[#667B72] dark:text-[#7D9489]">
                  VISUAL COMPARISON
                </p>
                <h2 className="text-base font-bold text-[#1A2B24] dark:text-[#F1F5F3]">
                  Before &amp; After Split Slider
                </h2>
              </div>
              <span className="text-[#388E6C] dark:text-[#00E599]">
                <Columns2 size={18} />
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#5E736A] dark:text-[#8EA399]">
                  BEFORE (BASELINE)
                </label>
                <select
                  value={compareDayA}
                  onChange={(e) => setCompareDayA(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#DCE5DF] dark:border-[#22332A] bg-[#F4F7F5] dark:bg-[#0B0F0E] px-3 py-2 text-xs font-semibold text-[#1A2B24] dark:text-[#F1F5F3] outline-none"
                >
                  {sortedCheckups.map((c) => (
                    <option key={c.id} value={c.dayNumber}>
                      Day {c.dayNumber} ({c.angle})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#5E736A] dark:text-[#8EA399]">
                  AFTER (PROGRESS)
                </label>
                <select
                  value={compareDayB}
                  onChange={(e) => setCompareDayB(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#DCE5DF] dark:border-[#22332A] bg-[#F4F7F5] dark:bg-[#0B0F0E] px-3 py-2 text-xs font-semibold text-[#1A2B24] dark:text-[#F1F5F3] outline-none"
                >
                  {sortedCheckups.map((c) => (
                    <option key={c.id} value={c.dayNumber}>
                      Day {c.dayNumber} ({c.angle})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Interactive Split Overlay Viewer */}
            <div className="relative mt-4 h-56 w-full overflow-hidden rounded-2xl border border-[#DCE5DF] dark:border-[#22332A] bg-[#F4F7F5] dark:bg-[#0B0F0E] select-none">
              <img
                src={selectedSnapshot?.imageUrl}
                alt="After progress"
                className="h-full w-full object-cover"
              />
              <div
                className="absolute inset-y-0 left-0 overflow-hidden"
                style={{ width: `${sliderPos}%` }}
              >
                <img
                  src={baselineSnapshot?.imageUrl}
                  alt="Before baseline"
                  className="h-56 w-full max-w-none object-cover"
                />
              </div>

              {/* Divider Line */}
              <div
                className="pointer-events-none absolute inset-y-0 w-0.5 bg-white dark:bg-[#131A16] shadow-[0_0_8px_rgba(0,0,0,0.45)]"
                style={{ left: `${sliderPos}%` }}
              >
                <div className="absolute top-1/2 left-1/2 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#1A2B24] text-[10px] font-bold text-white shadow">
                  ↔
                </div>
              </div>

              <span className="absolute top-3 left-3 rounded-lg bg-black/60 px-2.5 py-1 text-[10px] font-bold text-white">
                Day {baselineSnapshot?.dayNumber || 1}
              </span>
              <span className="absolute top-3 right-3 rounded-lg bg-[#388E6C] dark:bg-[#00E599] dark:text-[#061810] px-2.5 py-1 text-[10px] font-bold text-white">
                Day {selectedSnapshot?.dayNumber || currentJourneyDay}
              </span>
            </div>

            <div className="mt-3 flex items-center gap-3">
              <span className="text-[11px] font-bold text-[#5E736A] dark:text-[#8EA399]">Slide to compare</span>
              <input
                type="range"
                min={5}
                max={95}
                value={sliderPos}
                onChange={(e) => setSliderPos(Number(e.target.value))}
                aria-label="Compare before and after hair growth"
                className="h-1.5 flex-1 cursor-pointer accent-[#388E6C] dark:accent-[#00E599]"
              />
            </div>
          </section>

          {/* Chronological Checkup Timeline */}
          <section className="rounded-3xl border border-[#DCE5DF] dark:border-[#22332A] bg-white dark:bg-[#131A16] p-5 shadow-2xs sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-[#1A2B24] dark:text-[#F1F5F3]">
                Checkup History &amp; Condition Logs
              </h2>
              <span className="rounded-full bg-[#F4F7F5] dark:bg-[#0B0F0E] px-3 py-1 text-xs font-bold text-[#5E736A] dark:text-[#8EA399]">
                {sortedCheckups.length} entries
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              {sortedCheckups.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col justify-between rounded-2xl border border-[#DCE5DF] dark:border-[#22332A] bg-[#F9FBFA] dark:bg-[#17201C] p-3.5"
                >
                  <div>
                    <div className="relative overflow-hidden rounded-xl border border-[#E1E6EB] dark:border-[#1B2922]">
                      <img
                        src={item.imageUrl}
                        alt={`Day ${item.dayNumber}`}
                        className="h-32 w-full object-cover"
                      />
                      <span className="absolute top-2 left-2 rounded-md bg-[#1A2B24]/85 px-2 py-0.5 font-mono text-[10px] font-bold text-white">
                        DAY {item.dayNumber} · {item.angle}
                      </span>
                      {sortedCheckups.length > 1 && (
                        <button
                          type="button"
                          onClick={() => void onDeleteCheckup(item.id)}
                          className="absolute top-2 right-2 rounded-lg bg-white dark:bg-[#131A16]/90 p-1.5 text-[#5E736A] dark:text-[#8EA399] transition hover:text-[#C94A38]"
                          aria-label="Delete checkup"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>

                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {item.hairFallCount && (
                        <span className="rounded-md bg-[#FDF2D8] px-2 py-0.5 text-[10px] font-bold text-[#8A5D0A]">
                          Fall: {item.hairFallCount}
                        </span>
                      )}
                      {item.thicknessFeel && (
                        <span className="rounded-md bg-[#E3F2EC] dark:bg-[#00E599]/15 px-2 py-0.5 text-[10px] font-bold text-[#276B50] dark:text-[#00E599]">
                          {item.thicknessFeel}
                        </span>
                      )}
                      {item.babyHairs && item.babyHairs !== "None yet" && (
                        <span className="rounded-md bg-[#EAEFF9] px-2 py-0.5 text-[10px] font-bold text-[#3D4E7A]">
                          {item.babyHairs}
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-xs leading-relaxed text-[#485C53] dark:text-[#B8CCC2]">{item.note}</p>
                  </div>

                  <p className="mt-2.5 border-t border-[#EAEFEA] dark:border-[#1B2922] pt-2 text-[10px] font-semibold text-[#72877E] dark:text-[#7D9489]">
                    Logged on {item.date}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

/**
 * Products Catalog Web Page Component ("Products")
 */
function ProductsCatalogPage() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const categories = ["All", "Hair", "Performance", "Beard", "Wellness & Sleep"];

  const filteredProducts = useMemo(() => {
    return MAN_MATTERS_PRODUCTS.filter((prod) => {
      const matchCat = selectedCategory === "All" || prod.category === selectedCategory;
      const matchQuery =
        prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prod.actives.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prod.benefit.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      {/* Header + Search */}
      <div className="flex flex-col justify-between gap-4 border-b border-[#DCE5DF] dark:border-[#22332A] pb-5 md:flex-row md:items-end">
        <div>
          <span className="rounded-md bg-[#E3F2EC] dark:bg-[#00E599]/15 px-2.5 py-1 text-[11px] font-bold text-[#388E6C] dark:text-[#00E599]">
            MAN MATTERS CURATED STORE
          </span>
          <h1 className="mt-2 text-2xl font-extrabold text-[#1A2B24] dark:text-[#F1F5F3] sm:text-3xl">
            Doctor-Backed Men&apos;s Solutions
          </h1>
          <p className="mt-1 text-sm text-[#5E736A] dark:text-[#8EA399]">
            Explore clinically evaluated gummies, tonics, and kits—click any product to view details &amp; reorder.
          </p>
        </div>

        <div className="relative w-full md:w-80">
          <span className="pointer-events-none absolute top-3 left-3.5 text-[#72877E] dark:text-[#7D9489]">
            <Search size={16} />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Biotin, Minoxidil, Shilajit..."
            className="w-full rounded-xl border border-[#DCE5DF] dark:border-[#22332A] bg-white dark:bg-[#131A16] py-2.5 pr-4 pl-10 text-xs font-semibold text-[#1A2B24] dark:text-[#F1F5F3] shadow-2xs outline-none transition focus:border-[#388E6C] dark:focus:border-[#00E599] dark:border-[#00E599]"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`rounded-full px-4 py-2 text-xs font-bold transition ${
              selectedCategory === cat
                ? "bg-[#388E6C] bg-[#388E6C] dark:bg-[#00E599] text-white dark:text-[#061810] shadow-sm"
                : "border border-[#DCE5DF] dark:border-[#22332A] bg-white dark:bg-[#131A16] text-[#5E736A] dark:text-[#8EA399] hover:bg-[#EAEFEA] dark:hover:bg-[#1E2C25]"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Responsive 3-Column Product Catalog Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filteredProducts.map((prod) => (
          <article
            key={prod.id}
            className="flex flex-col justify-between rounded-3xl border border-[#DCE5DF] dark:border-[#22332A] bg-white dark:bg-[#131A16] p-5 shadow-2xs transition hover:-translate-y-0.5 hover:border-[#388E6C] dark:border-[#00E599] hover:shadow-md"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <span
                  className="rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wider"
                  style={{ backgroundColor: prod.bgTint, color: prod.accent }}
                >
                  {prod.badge}
                </span>
                <div className="flex items-center gap-1 text-xs font-bold text-[#1A2B24] dark:text-[#F1F5F3]">
                  <Star size={14} className="fill-[#F5B841] text-[#F5B841]" />
                  <span>{prod.rating}</span>
                  <span className="text-[11px] font-normal text-[#72877E] dark:text-[#7D9489]">({prod.reviews})</span>
                </div>
              </div>

              <a
                href={prod.url}
                target="_blank"
                rel="noreferrer"
                className="mt-3 block text-base font-bold text-[#1A2B24] dark:text-[#F1F5F3] transition hover:text-[#388E6C] dark:text-[#00E599]"
              >
                {prod.name}
              </a>
              <p className="mt-1 text-xs font-semibold text-[#388E6C] dark:text-[#00E599]">{prod.actives}</p>
              <p className="mt-2 text-xs leading-relaxed text-[#5E736A] dark:text-[#8EA399]">{prod.benefit}</p>
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-[#EAEFEA] dark:border-[#1B2922] pt-4">
              <div>
                <span className="text-base font-extrabold text-[#1A2B24] dark:text-[#F1F5F3]">₹{prod.price}</span>
                <span className="ml-2 text-xs font-medium text-[#72877E] dark:text-[#7D9489] line-through">
                  ₹{prod.mrp}
                </span>
              </div>

              <a
                href={prod.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#388E6C] dark:bg-[#00E599] dark:text-[#061810] px-4 py-2.5 text-xs font-bold text-white shadow-2xs transition hover:bg-[#2E775A] dark:hover:bg-[#00CC88]"
              >
                <span>View on Site</span>
                <ExternalLink size={13} />
              </a>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

/**
 * User Profile, Editable Avatar, Man Matters Socials & App Rating Page ("Profile")
 */
function UserProfilePage({
  user,
  healthProfile,
  displayName,
  streak,
  currentJourneyDay,
  totalGummiesConsumed,
  onUpdateAvatar,
  onEditHealthProfile,
  onSignOut,
  showToast,
}) {
  const [rating, setRating] = useState(5);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  const avatarUrl = healthProfile?.avatarUrl || "";

  function handleAvatarFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 800_000) {
      showToast("Please choose a profile picture under 800 KB.", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result;
      if (dataUrl) {
        await onUpdateAvatar(String(dataUrl));
      }
    };
    reader.readAsDataURL(file);
  }

  function handleSubmitRating(e) {
    e.preventDefault();
    setRatingSubmitted(true);
    showToast(`Thank you for rating Dosemate ${rating}/5 stars!`);
  }

  const MAN_MATTERS_SOCIALS = [
    {
      name: "Instagram",
      handle: "@man.matters",
      url: "https://www.instagram.com/man.matters/",
      bg: "#FCECE8",
      accent: "#B54434",
      icon: <Instagram size={18} />,
    },
    {
      name: "YouTube",
      handle: "Man Matters",
      url: "https://www.youtube.com/@ManMatters",
      bg: "#FDF2D8",
      accent: "#8A5D0A",
      icon: <Youtube size={18} />,
    },
    {
      name: "Official Website",
      handle: "manmatters.com",
      url: "https://manmatters.com/home-alt?theme=reset&utm_source=google&utm_medium=brand&utm_campaign=Search_Brand_MM&utm_source=google_Search&utm_medium=180290939936&utm_campaign=753311585718&utm_term=man%20matters&gad_source=1&gad_campaignid=22580437328&gbraid=0AAAAA-2S6Ud-GmneGNC4Wl-VmRHwtAu8G&gclid=Cj0KCQiA2frXBhC_ARIsAPTFcdN00Zz_PXrFdt6IdPBdmuZ3M6aCGbczbeRyNnmAPuGjMe-nOPzQDeUaAkvgEALw_wcB",
      bg: "#E3F2EC",
      accent: "#276B50",
      icon: <Globe size={18} />,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      {/* Profile Hero & Editable Picture Card */}
      <section className="rounded-3xl border border-[#DCE5DF] dark:border-[#22332A] bg-white dark:bg-[#131A16] p-6 shadow-2xs sm:p-8">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
          {/* Editable Profile Avatar (Can be left as default monogram or customized) */}
          <div className="relative shrink-0">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="h-24 w-24 rounded-full border-4 border-[#E3F2EC] object-cover shadow-sm"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-[#E3F2EC] bg-[#163A2E] dark:bg-[#0F1713] text-3xl font-extrabold text-white shadow-sm">
                {displayName.slice(0, 1).toUpperCase()}
              </div>
            )}

            <label
              title="Change profile picture"
              className="absolute right-0 bottom-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-[#388E6C] bg-[#388E6C] dark:bg-[#00E599] text-white dark:text-[#061810] shadow-md transition hover:scale-105 hover:bg-[#2E775A] dark:hover:bg-[#00CC88]"
            >
              <Camera size={14} />
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarFileChange}
                className="hidden"
              />
            </label>
          </div>

          {/* User Details & Optional Avatar Controls */}
          <div className="flex-1 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#E3F2EC] dark:bg-[#00E599]/15 px-3 py-1 text-[10px] font-bold tracking-wider text-[#276B50] dark:text-[#00E599] uppercase">
              <ShieldCheck size={12} />
              <span>Dosemate Member · Powered by Man Matters</span>
            </div>
            <h1 className="mt-2 text-2xl font-extrabold text-[#1A2B24] dark:text-[#F1F5F3]">{displayName}</h1>
            <p className="mt-0.5 text-xs text-[#5E736A] dark:text-[#8EA399]">
              {user?.email || "guest@dosemate.app"} · {healthProfile?.hairStage || "Daily Wellness"}
            </p>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-[#DCE5DF] dark:border-[#22332A] bg-[#F4F7F5] dark:bg-[#0B0F0E] px-3.5 py-2 text-xs font-bold text-[#1A2B24] dark:text-[#F1F5F3] transition hover:bg-[#E3F2EC] dark:bg-[#00E599]/15 hover:text-[#276B50] dark:text-[#00E599]">
                <Camera size={14} />
                <span>{avatarUrl ? "Change Photo" : "Upload Photo (Optional)"}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarFileChange}
                  className="hidden"
                />
              </label>

              {avatarUrl && (
                <button
                  type="button"
                  onClick={() => void onUpdateAvatar("")}
                  className="inline-flex items-center gap-1 rounded-xl border border-[#F5C6BA] bg-white dark:bg-[#131A16] px-3 py-2 text-xs font-bold text-[#B54434] transition hover:bg-[#FCECE8]"
                >
                  <Trash2 size={13} />
                  <span>Reset Default</span>
                </button>
              )}

              <button
                type="button"
                onClick={onEditHealthProfile}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#DCE5DF] dark:border-[#22332A] bg-white dark:bg-[#131A16] px-3.5 py-2 text-xs font-bold text-[#3E4C59] dark:text-[#A0B4AA] transition hover:bg-[#F4F7F5] dark:hover:bg-[#1A2520] dark:bg-[#0B0F0E]"
              >
                <HeartPulse size={14} className="text-[#388E6C] dark:text-[#00E599]" />
                <span>Edit Health Goals</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Journey Stats Strip */}
        <div className="mt-6 grid grid-cols-3 gap-3 border-t border-[#EAEFEA] dark:border-[#1B2922] pt-5 text-center">
          <div className="rounded-2xl bg-[#F9FBFA] dark:bg-[#17201C] p-3">
            <p className="text-lg font-extrabold text-[#1A2B24] dark:text-[#F1F5F3]">{streak}</p>
            <p className="text-[11px] font-bold text-[#667B72] dark:text-[#7D9489]">Day Streak</p>
          </div>
          <div className="rounded-2xl bg-[#F9FBFA] dark:bg-[#17201C] p-3">
            <p className="text-lg font-extrabold text-[#388E6C] dark:text-[#00E599]">Day {currentJourneyDay}</p>
            <p className="text-[11px] font-bold text-[#667B72] dark:text-[#7D9489]">Journey</p>
          </div>
          <div className="rounded-2xl bg-[#F9FBFA] dark:bg-[#17201C] p-3">
            <p className="text-lg font-extrabold text-[#1A2B24] dark:text-[#F1F5F3]">{totalGummiesConsumed}</p>
            <p className="text-[11px] font-bold text-[#667B72] dark:text-[#7D9489]">Doses Logged</p>
          </div>
        </div>
      </section>

      {/* Two-Column Lower Section: Man Matters Socials & Rate App */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Man Matters Official Socials */}
        <section className="flex flex-col justify-between rounded-3xl border border-[#DCE5DF] dark:border-[#22332A] bg-white dark:bg-[#131A16] p-6 shadow-2xs">
          <div>
            <span className="text-[11px] font-bold tracking-wider text-[#388E6C] dark:text-[#00E599] uppercase">
              COMMUNITY &amp; UPDATES
            </span>
            <h2 className="mt-1 text-lg font-extrabold text-[#1A2B24] dark:text-[#F1F5F3]">
              Man Matters Socials
            </h2>
            <p className="mt-1 text-xs text-[#5E736A] dark:text-[#8EA399]">
              Follow doctor-led hair, beard, and men&apos;s wellness tips across our official channels.
            </p>

            <div className="mt-4 space-y-2.5">
              {MAN_MATTERS_SOCIALS.map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between rounded-2xl border border-[#DCE5DF] dark:border-[#22332A] bg-[#F9FBFA] dark:bg-[#17201C] p-3.5 transition hover:border-[#388E6C] dark:border-[#00E599] hover:bg-white dark:bg-[#131A16] hover:shadow-2xs"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-10 w-10 items-center justify-center rounded-xl"
                      style={{ backgroundColor: social.bg, color: social.accent }}
                    >
                      {social.icon}
                    </span>
                    <div>
                      <p className="text-xs font-extrabold text-[#1A2B24] dark:text-[#F1F5F3]">{social.name}</p>
                      <p className="text-[11px] font-medium text-[#5E736A] dark:text-[#8EA399]">{social.handle}</p>
                    </div>
                  </div>
                  <ExternalLink size={15} className="text-[#72877E] dark:text-[#7D9489]" />
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Rate Man Matters / Dosemate App */}
        <section className="flex flex-col justify-between rounded-3xl border border-[#DCE5DF] dark:border-[#22332A] bg-white dark:bg-[#131A16] p-6 shadow-2xs">
          <div>
            <span className="text-[11px] font-bold tracking-wider text-[#B87D14] uppercase">
              YOUR FEEDBACK MATTERS
            </span>
            <h2 className="mt-1 text-lg font-extrabold text-[#1A2B24] dark:text-[#F1F5F3]">
              Rate Man Matters App
            </h2>
            <p className="mt-1 text-xs text-[#5E736A] dark:text-[#8EA399]">
              Enjoying your daily dose reminders &amp; progress tracker? Tap a star to rate your experience.
            </p>

            {ratingSubmitted ? (
              <div className="mt-5 rounded-2xl border border-[#BFE3D3] dark:border-[#00E599]/30 bg-[#E3F2EC] dark:bg-[#00E599]/15 dark:bg-[#00E599]/15 p-5 text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#388E6C] bg-[#388E6C] dark:bg-[#00E599] text-white dark:text-[#061810]">
                  <Check size={18} />
                </div>
                <p className="mt-2.5 text-sm font-extrabold text-[#163A2E] dark:text-[#00E599]">
                  Thanks for your {rating}-Star Rating!
                </p>
                <p className="mt-1 text-xs text-[#276B50] dark:text-[#00E599]">
                  Your feedback helps us make Man Matters &amp; Dosemate even better.
                </p>
                <button
                  type="button"
                  onClick={() => setRatingSubmitted(false)}
                  className="mt-3 text-xs font-bold text-[#388E6C] dark:text-[#00E599] underline"
                >
                  Edit rating
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitRating} className="mt-5 space-y-4">
                <div className="flex items-center justify-center gap-2 rounded-2xl border border-[#EAEFEA] dark:border-[#1B2922] bg-[#F9FBFA] dark:bg-[#17201C] py-4">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const filled = (hoveredStar || rating) >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoveredStar(star)}
                        onMouseLeave={() => setHoveredStar(0)}
                        onClick={() => setRating(star)}
                        aria-label={`Rate ${star} stars`}
                        className="p-1 transition hover:scale-110"
                      >
                        <Star
                          size={28}
                          className={
                            filled
                              ? "fill-[#F5B841] text-[#F5B841]"
                              : "text-[#CFD8D3]"
                          }
                        />
                      </button>
                    );
                  })}
                </div>

                <div>
                  <label htmlFor="app-review" className="block text-xs font-bold text-[#3E4C59] dark:text-[#A0B4AA]">
                    Quick note <span className="font-normal text-[#72877E] dark:text-[#7D9489]">(optional)</span>
                  </label>
                  <textarea
                    id="app-review"
                    rows={2}
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Tell us what you love or what we can improve..."
                    className="mt-1.5 w-full rounded-xl border border-[#DCE5DF] dark:border-[#22332A] bg-[#F9FBFA] dark:bg-[#17201C] p-3 text-xs text-[#1A2B24] dark:text-[#F1F5F3] outline-none focus:border-[#388E6C] dark:focus:border-[#00E599] dark:border-[#00E599] focus:bg-white dark:bg-[#131A16]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-[#388E6C] dark:bg-[#00E599] dark:text-[#061810] py-3 text-xs font-bold text-white shadow-sm transition hover:bg-[#2E775A] dark:hover:bg-[#00CC88]"
                >
                  Submit Rating
                </button>
              </form>
            )}
          </div>
        </section>
      </div>

      {/* Sign Out Footer Button */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={() => void onSignOut()}
          className="inline-flex items-center gap-2 rounded-2xl border border-[#F5C6BA] bg-white dark:bg-[#131A16] px-5 py-3 text-xs font-bold text-[#B54434] transition hover:bg-[#FCECE8]"
        >
          <LogOut size={15} />
          <span>Sign Out of Dosemate</span>
        </button>
      </div>
    </div>
  );
}

/**
 * Dosemate AI Product Specialist Chatbot Popup Component
 */
function SahilAIChatbot({
  healthProfile,
  trackers,
  streak,
  currentJourneyDay,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      id: "m-1",
      sender: "bot",
      text: `Hi${
        healthProfile?.fullName ? ` ${healthProfile.fullName}` : ""
      }! I'm your Dosemate specialist (Powered by Man Matters). Ask any queries about your active routine, Biotin gummies, Redensyl tonic, Minoxidil 5%, or Ashwagandha & Shilajit!`,
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [isOpen, messages, isTyping]);

  async function handleSend(e) {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userText = input.trim();
    setInput("");
    const userMsg = { id: `m-${Date.now()}`, sender: "user", text: userText };
    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setIsTyping(true);

    const userContext = {
      userName: healthProfile?.fullName || "",
      age: healthProfile?.age || "",
      concerns: healthProfile?.concerns || [],
      hairStage: healthProfile?.hairStage || "",
      sleepHours: healthProfile?.sleepHours || "",
      stressLevel: healthProfile?.stressLevel || "",
      goalHorizon: healthProfile?.goalHorizon || "",
      trackerCount: trackers.length,
      activeProducts: trackers
        .map((t) => `${t.product_name} (${t.gummies_remaining} units left)`)
        .join(", "),
      streak,
      journeyDay: currentJourneyDay,
    };

    const botReply = await askSahilGemini(userText, messages, userContext);

    setIsTyping(false);
    setMessages((prev) => [
      ...prev,
      { id: `m-${Date.now() + 1}`, sender: "bot", text: botReply },
    ]);
  }

  return (
    <>
      {/* Floating Bottom-Right Chat Trigger Button (Positioned above Bottom Navigation Bar) */}
      <div className="fixed right-5 bottom-20 z-40 sm:right-7 sm:bottom-22">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Open Ask Queries chatbot"
          className="flex items-center gap-2 rounded-full bg-[#163A2E] dark:bg-[#0F1713] px-4 py-3 text-xs font-bold text-white shadow-2xl transition hover:scale-105 hover:bg-[#1E4D3D] active:scale-95"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#388E6C] bg-[#388E6C] dark:bg-[#00E599] text-white dark:text-[#061810]">
            {isOpen ? <X size={14} /> : <Bot size={15} />}
          </span>
          <span>{isOpen ? "Close Queries" : "Ask Queries"}</span>
        </button>
      </div>

      {/* Responsive Desktop & Mobile Chat Popup Drawer */}
      {isOpen && (
        <div className="fixed right-4 bottom-36 left-4 z-50 flex h-[450px] flex-col overflow-hidden rounded-3xl border border-[#DCE5DF] dark:border-[#22332A] bg-white dark:bg-[#131A16] shadow-2xl sm:right-7 sm:bottom-36 sm:left-auto sm:w-96">
          {/* Chat Header */}
          <div className="flex items-center justify-between bg-[#163A2E] dark:bg-[#0F1713] px-4 py-3.5 text-white">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#244E41] text-[#86E3C3]">
                <Bot size={18} />
              </span>
              <div>
                <p className="text-xs font-bold">Ask Queries · Dosemate Specialist</p>
                <p className="text-[10px] text-[#A8C4B8]">
                  Powered by Man Matters · Instant AI Support
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() =>
                  setMessages([
                    {
                      id: "m-1",
                      sender: "bot",
                      text: "Chat reset. What would you like to know about your Dosemate regimen or Man Matters products?",
                    },
                  ])
                }
                title="Reset chat"
                className="rounded-full p-1.5 text-[#A8C4B8] transition hover:bg-white dark:bg-[#131A16]/10 hover:text-white"
              >
                <RotateCcw size={14} />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close chat"
                className="rounded-full p-1.5 text-[#A8C4B8] transition hover:bg-white dark:bg-[#131A16]/10 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Message List */}
          <div className="flex-1 space-y-3 overflow-y-auto bg-[#F4F7F5] dark:bg-[#0B0F0E] p-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-line shadow-2xs ${
                    m.sender === "user"
                      ? "rounded-br-sm bg-[#388E6C] bg-[#388E6C] dark:bg-[#00E599] text-white dark:text-[#061810]"
                      : "rounded-bl-sm border border-[#DCE5DF] dark:border-[#22332A] bg-white dark:bg-[#131A16] text-[#1A2B24] dark:text-[#F1F5F3]"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-sm border border-[#DCE5DF] dark:border-[#22332A] bg-white dark:bg-[#131A16] px-3.5 py-2 text-xs text-[#5E736A] dark:text-[#8EA399]">
                  Analyzing your profile…
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestion Chips */}
          <div className="flex gap-1.5 overflow-x-auto border-t border-[#EAEFEA] dark:border-[#1B2922] bg-white dark:bg-[#131A16] px-3.5 py-2">
            {[
              "Review my current routine",
              "Biotin vs Minoxidil?",
              "How to boost hair results?",
            ].map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => setInput(chip)}
                className="shrink-0 rounded-full border border-[#DCE5DF] dark:border-[#22332A] bg-[#F4F7F5] dark:bg-[#0B0F0E] px-2.5 py-1 text-[10px] font-semibold text-[#485C53] dark:text-[#B8CCC2] transition hover:bg-[#E3F2EC] dark:bg-[#00E599]/15 hover:text-[#388E6C] dark:text-[#00E599]"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => void handleSend(e)}
            className="flex items-center gap-2 border-t border-[#EAEFEA] dark:border-[#1B2922] bg-white dark:bg-[#131A16] p-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask any query about your regimen..."
              className="flex-1 rounded-xl border border-[#DCE5DF] dark:border-[#22332A] bg-[#F4F7F5] dark:bg-[#0B0F0E] px-3 py-2 text-xs text-[#1A2B24] dark:text-[#F1F5F3] outline-none transition focus:border-[#388E6C] dark:focus:border-[#00E599] dark:border-[#00E599]"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#388E6C] bg-[#388E6C] dark:bg-[#00E599] text-white dark:text-[#061810] shadow-2xs transition hover:bg-[#2E775A] dark:hover:bg-[#00CC88] disabled:opacity-50"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

// Melodic in-app alarm chime using Web Audio API (zero-dependency, works on mobile & desktop)
function playAlarmChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === "suspended") {
      void ctx.resume();
    }
    // High-clarity 4-note ascending bell chime: C5, E5, G5, C6
    const notes = [523.25, 659.25, 783.99, 1046.5];
    const now = ctx.currentTime;
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + i * 0.13);
      gain.gain.setValueAtTime(0, now + i * 0.13);
      gain.gain.linearRampToValueAtTime(0.28, now + i * 0.13 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.13 + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.13);
      osc.stop(now + i * 0.13 + 0.5);
    });
  } catch (err) {
    console.warn("Could not play alarm audio:", err);
  }
}

/**
 * Main Dosemate Web Application with Local Persistence & Immediate Login Screen
 */
export default function App() {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("dosemate_theme") || "light";
    }
    return "light";
  });

  useEffect(() => {
    if (typeof document !== "undefined") {
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      localStorage.setItem("dosemate_theme", theme);
    }
  }, [theme]);

  function toggleTheme() {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authBusy, setAuthBusy] = useState(false);

  const [activeAlarm, setActiveAlarm] = useState(null);
  const [alarmSoundEnabled, setAlarmSoundEnabled] = useState(true);

  function triggerInAppAlarm(tracker) {
    setActiveAlarm(tracker);
  }

  // Looping audio chime while in-app alarm is active
  useEffect(() => {
    if (!activeAlarm || !alarmSoundEnabled) return;
    playAlarmChime();
    const interval = window.setInterval(() => {
      playAlarmChime();
    }, 3200);
    return () => window.clearInterval(interval);
  }, [activeAlarm, alarmSoundEnabled]);

  const [healthProfile, setHealthProfile] = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);

  const [activeTab, setActiveTab] = useState("routine");
  const [trackers, setTrackers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [checkups, setCheckups] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [today, setToday] = useState("");
  const [minute, setMinute] = useState("");
  const [workingId, setWorkingId] = useState(null);
  const [notifications, setNotifications] = useState("unsupported");
  const [toasts, setToasts] = useState([]);
  const sentNotificationsRef = useRef(new Set());

  function showToast(message, type = "success") {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 3400);
  }

  // Clock & Notification Permission Initialization
  useEffect(() => {
    setToday(localDateKey());
    const refreshClock = () => setMinute(new Date().toTimeString().slice(0, 5));
    refreshClock();
    const clock = window.setInterval(refreshClock, 15_000);

    if (typeof window !== "undefined" && "Notification" in window) {
      setNotifications(Notification.permission);
    }

    return () => window.clearInterval(clock);
  }, []);

  // Persistent Firebase Authentication State Listener
  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email || "user@gmail.com",
          displayName: firebaseUser.displayName || "",
          photoURL: firebaseUser.photoURL || "",
        });
      } else {
        // Only clear if not in an active guest session
        setUser((prev) => (prev?.uid?.startsWith("guest_") ? prev : null));
      }
    });
    return () => unsubscribe();
  }, []);

  // Hydrate User Session Data (Cloud Firestore with Real-time Sync or Local Storage)
  useEffect(() => {
    if (!user?.uid) return;

    if (isFirebaseConfigured && !user.uid.startsWith("guest_")) {
      // Real-time Firestore sync across all devices
      const unsubscribe = subscribeToUserCloudData(user.uid, (cloudData) => {
        if (cloudData.profile) {
          setHealthProfile(cloudData.profile);
          saveStoredData(user.uid, "profile", cloudData.profile);
        } else {
          const local = loadStoredData(user.uid, "profile", null);
          if (local) setHealthProfile(local);
        }
        if (cloudData.trackers && cloudData.trackers.length > 0) {
          setTrackers(cloudData.trackers);
          saveStoredData(user.uid, "trackers", cloudData.trackers);
        } else {
          setTrackers(loadStoredData(user.uid, "trackers", []));
        }
        if (cloudData.logs && cloudData.logs.length > 0) {
          setLogs(cloudData.logs);
          saveStoredData(user.uid, "logs", cloudData.logs);
        } else {
          setLogs(loadStoredData(user.uid, "logs", []));
        }
        if (cloudData.checkups && cloudData.checkups.length > 0) {
          setCheckups(cloudData.checkups);
          saveStoredData(user.uid, "checkups", cloudData.checkups);
        } else {
          const stored = loadStoredData(user.uid, "checkups", null);
          setCheckups(stored && stored.length > 0 ? stored : createSeedCheckups());
        }
      });
      return () => unsubscribe();
    } else {
      // Local fallback for guest sessions or offline
      setHealthProfile(loadStoredData(user.uid, "profile", null));
      setTrackers(loadStoredData(user.uid, "trackers", []));
      setLogs(loadStoredData(user.uid, "logs", []));
      const storedCheckups = loadStoredData(user.uid, "checkups", null);
      setCheckups(storedCheckups && storedCheckups.length > 0 ? storedCheckups : createSeedCheckups());
    }
  }, [user?.uid]);

  // Scheduled Dose & Low-Stock Alert Trigger
  useEffect(() => {
    if (!user?.uid || !minute || !today || trackers.length === 0) return;
    for (const tracker of trackers) {
      const schedules =
        Array.isArray(tracker.dose_schedules) && tracker.dose_schedules.length > 0
          ? tracker.dose_schedules
          : [{ time: tracker.reminder_time.slice(0, 5), meal: tracker.meal_timing || "After meal" }];

      const matchesMinute = schedules.some((s) => s.time.slice(0, 5) === minute);
      if (
        tracker.reminder_enabled &&
        matchesMinute &&
        !logs.some((log) => log.tracker_id === tracker.id && log.dose_date === today)
      ) {
        notifyOnce(
          `dose-${tracker.id}-${today}-${minute}`,
          `Time for ${tracker.product_name}`,
          `Your ${tracker.daily_dose} unit daily dose is ready.`
        );
        triggerInAppAlarm(tracker);
      }
      if (isLowOnStock(tracker)) {
        notifyOnce(
          `stock-${tracker.id}-${today}`,
          `${tracker.product_name} is running low`,
          `About ${daysRemaining(tracker)} days left. Reorder on Man Matters soon.`
        );
      }
    }
  }, [user?.uid, minute, today, trackers, logs, notifications]);

  const dosesToday = useMemo(
    () =>
      trackers.filter((tracker) =>
        logs.some((log) => log.tracker_id === tracker.id && log.dose_date === today)
      ).length,
    [trackers, logs, today]
  );

  const streak = useMemo(() => {
    let count = 0;
    for (let offset = 0; offset < 7; offset += 1) {
      const date = new Date();
      date.setDate(date.getDate() - offset);
      const key = localDateKey(date);
      if (
        trackers.length > 0 &&
        trackers.every((tracker) =>
          logs.some((log) => log.tracker_id === tracker.id && log.dose_date === key)
        )
      ) {
        count += 1;
      } else {
        if (offset === 0) continue;
        break;
      }
    }
    return count;
  }, [trackers, logs]);

  const totalGummiesConsumed = useMemo(() => {
    const loggedSum = logs.reduce((acc, log) => acc + (log.gummies_taken || 1), 0);
    return Math.max(loggedSum, 14);
  }, [logs]);

  const currentJourneyDay = useMemo(() => {
    if (checkups.length === 0) return 1;
    const earliest = [...checkups].sort((a, b) => a.dayNumber - b.dayNumber)[0];
    const start = new Date(`${earliest.date}T12:00:00`);
    const now = new Date();
    const diffDays = Math.max(1, Math.round((now - start) / 86_400_000) + earliest.dayNumber);
    return diffDays;
  }, [checkups]);

  function startUserSession(userEmail) {
    const normalized = userEmail.trim().toLowerCase() || "guest@dosemate.app";
    setUser({
      uid: normalized,
      email: normalized,
    });
  }

  async function submitAuth(event) {
    event.preventDefault();
    setAuthBusy(true);
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail.endsWith("@gmail.com")) {
      showToast("Email must end with @gmail.com", "error");
      setAuthBusy(false);
      return;
    }

    if (isFirebaseConfigured && auth) {
      try {
        if (authMode === "signup") {
          await createUserWithEmailAndPassword(auth, cleanEmail, password);
          showToast("Account created in cloud! Let's set up your profile.");
        } else {
          await signInWithEmailAndPassword(auth, cleanEmail, password);
          showToast("Welcome back to Dosemate!");
        }
      } catch (err: any) {
        console.error("Firebase auth error:", err);
        if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
          showToast("Incorrect password or user not found. Try signing up instead.", "error");
        } else if (err.code === "auth/email-already-in-use") {
          showToast("Account exists with this email. Please sign in.", "error");
        } else {
          showToast(err.message?.replace("Firebase: ", "") || "Authentication failed.", "error");
        }
      }
    } else {
      // Local session simulation fallback
      startUserSession(cleanEmail);
      showToast(
        authMode === "signup"
          ? "Account created! Complete your quick health profile."
          : "Welcome back to Dosemate."
      );
    }
    setAuthBusy(false);
  }

  async function signInWithGoogle() {
    setAuthBusy(true);
    if (isFirebaseConfigured && auth) {
      try {
        const result = await signInWithPopup(auth, googleProvider);
        showToast(`Signed in with Google as ${result.user.displayName || result.user.email}!`);
      } catch (err: any) {
        console.error("Google sign-in error:", err);
        showToast(err.message?.replace("Firebase: ", "") || "Google sign-in cancelled or failed.", "error");
      }
    } else {
      const entered = window.prompt("Enter your Google / Gmail account (must end with @gmail.com):");
      if (!entered) {
        setAuthBusy(false);
        return;
      }
      const clean = entered.trim().toLowerCase();
      if (!clean.endsWith("@gmail.com")) {
        showToast("Email must end with @gmail.com", "error");
        setAuthBusy(false);
        return;
      }
      startUserSession(clean);
      showToast(`Signed in with Google as ${clean}!`);
    }
    setAuthBusy(false);
  }

  async function signInAsGuest() {
    setAuthBusy(true);
    const guestId = `guest_${Date.now()}`;
    setUser({
      uid: guestId,
      email: "guest@dosemate.app",
    });
    setHealthProfile(null);
    setTrackers([]);
    setLogs([]);
    setCheckups(createSeedCheckups());
    setEditingProfile(false);
    showToast("Welcome! Let's personalize your health routine.");
    setAuthBusy(false);
  }

  async function signOut() {
    if (isFirebaseConfigured && auth) {
      try {
        await firebaseSignOut(auth);
      } catch (err) {
        console.error("Firebase sign out error:", err);
      }
    }
    setUser(null);
    setHealthProfile(null);
    setTrackers([]);
    setLogs([]);
    setCheckups([]);
    setEditingProfile(false);
    showToast("You’re signed out.", "info");
  }

  async function handleCompleteOnboarding(profileData) {
    if (!user?.uid) return;

    let nextTrackers = trackers;
    if (trackers.length === 0 && Array.isArray(profileData.selectedProducts)) {
      const nowIso = new Date().toISOString();
      nextTrackers = profileData.selectedProducts.map((prodName, i) => {
        const preset = MAN_MATTERS_GUMMY_PRESETS.find(
          (p) => p.name.toLowerCase() === prodName.toLowerCase()
        );

        const dailyDose = preset ? preset.defaultDose : 1;
        const baseTime = profileData.preferredReminder || "09:00";
        const schedules = Array.from({ length: dailyDose }, (_, idx) => ({
          time:
            preset?.defaultTimes?.[idx] ||
            (idx === 0 ? baseTime : idx === 1 ? "21:00" : "14:00"),
          meal: preset?.defaultMeal || "After meal",
        }));

        return {
          id: `tracker-${Date.now()}-${i}`,
          user_id: user.uid,
          product_name: prodName,
          gummies_remaining: preset ? preset.defaultStock : 30,
          daily_dose: dailyDose,
          reminder_time: schedules[0].time,
          meal_timing: schedules[0].meal,
          dose_schedules: schedules,
          reorder_threshold: 7,
          reorder_url: preset?.reorderUrl || "https://man.matters",
          reminder_enabled: true,
          created_at: nowIso,
        };
      });
      setTrackers(nextTrackers);
      saveStoredData(user.uid, "trackers", nextTrackers);
    }

    setHealthProfile(profileData);
    saveStoredData(user.uid, "profile", profileData);
    saveProfileToCloud(user.uid, profileData);
    saveTrackersToCloud(user.uid, nextTrackers);
    setEditingProfile(false);
    setActiveTab("routine");
    showToast("Your personalized Dosemate regimen is ready!");
  }

  async function handleUpdateAvatar(newAvatarUrl) {
    if (!user?.uid || !healthProfile) return;
    const updatedProfile = { ...healthProfile, avatarUrl: newAvatarUrl };
    setHealthProfile(updatedProfile);
    saveStoredData(user.uid, "profile", updatedProfile);
    saveProfileToCloud(user.uid, updatedProfile);

    showToast(
      newAvatarUrl ? "Profile picture updated!" : "Profile picture reset to default.",
      "success"
    );
  }

  function notifyOnce(key, title, body) {
    if (notifications !== "granted") return;
    const storageKey = `${user?.uid}:${key}`;
    if (sentNotificationsRef.current.has(storageKey)) return;
    new Notification(title, { body });
    sentNotificationsRef.current.add(storageKey);
  }

  async function enableNotifications() {
    if (!("Notification" in window)) {
      setNotifications("unsupported");
      showToast("Browser notifications aren't supported in this browser.", "info");
      return;
    }
    if (window.top !== window.self) {
      showToast("Reminders are active in-app! Open in a full tab for OS-level alerts.", "info");
      return;
    }
    const permission = await Notification.requestPermission();
    setNotifications(permission);
    if (permission === "granted") {
      showToast("Alerts are on while Dosemate is open.");
    } else {
      showToast("Allow notifications in your browser settings.", "info");
    }
  }

  function openAddDialog(tracker) {
    setEditing(tracker ?? null);
    if (tracker) {
      const matchedPreset = MAN_MATTERS_GUMMY_PRESETS.find(
        (preset) => preset.name.toLowerCase() === tracker.product_name.toLowerCase()
      );
      const doseCount = Math.max(1, Number(tracker.daily_dose) || 1);
      const existingSchedules =
        Array.isArray(tracker.dose_schedules) && tracker.dose_schedules.length > 0
          ? tracker.dose_schedules
          : Array.from({ length: doseCount }, (_, idx) => ({
              time: idx === 0 ? tracker.reminder_time.slice(0, 5) : "21:00",
              meal: tracker.meal_timing || "After meal",
            }));

      setForm({
        product_name: tracker.product_name,
        is_custom_product: !matchedPreset,
        gummies_remaining: tracker.gummies_remaining,
        daily_dose: doseCount,
        reminder_time: tracker.reminder_time.slice(0, 5),
        meal_timing: tracker.meal_timing || "After meal",
        dose_schedules: existingSchedules,
        reorder_threshold: tracker.reorder_threshold,
        reorder_url: tracker.reorder_url ?? "",
        reminder_enabled: tracker.reminder_enabled,
      });
    } else {
      setForm(emptyForm);
    }
    setDialogOpen(true);
  }

  function handleSelectProductPreset(selectedValue) {
    if (selectedValue === "__custom__") {
      setForm((prev) => ({
        ...prev,
        is_custom_product: true,
        product_name: "",
        reorder_url: "https://man.matters",
      }));
      return;
    }

    const preset = MAN_MATTERS_GUMMY_PRESETS.find((item) => item.name === selectedValue);
    if (!preset) return;

    const nextSchedules = Array.from({ length: preset.defaultDose }, (_, idx) => ({
      time: preset.defaultTimes[idx] || (idx === 0 ? "09:00" : idx === 1 ? "21:00" : "14:00"),
      meal: preset.defaultMeal,
    }));

    setForm((prev) => ({
      ...prev,
      is_custom_product: false,
      product_name: preset.name,
      gummies_remaining: preset.defaultStock || 30,
      daily_dose: preset.defaultDose,
      reminder_time: nextSchedules[0].time,
      meal_timing: preset.defaultMeal,
      dose_schedules: nextSchedules,
      reorder_url: preset.reorderUrl,
    }));
  }

  function handleDailyDoseChange(rawCount) {
    const count = Math.max(1, Math.min(10, Number(rawCount) || 1));
    setForm((prev) => {
      const currentSchedules = Array.isArray(prev.dose_schedules) ? prev.dose_schedules : [];
      const defaultTimes = ["09:00", "21:00", "14:00", "18:00"];
      const nextSchedules = Array.from({ length: count }, (_, idx) => {
        if (currentSchedules[idx]) return currentSchedules[idx];
        return {
          time: idx === 0 ? prev.reminder_time || "09:00" : defaultTimes[idx % defaultTimes.length],
          meal: prev.meal_timing || "After meal",
        };
      });
      return {
        ...prev,
        daily_dose: count,
        reminder_time: nextSchedules[0]?.time || prev.reminder_time,
        meal_timing: nextSchedules[0]?.meal || prev.meal_timing,
        dose_schedules: nextSchedules,
      };
    });
  }

  function updateDoseScheduleItem(index, field, value) {
    setForm((prev) => {
      const updated = prev.dose_schedules.map((item, idx) =>
        idx === index ? { ...item, [field]: value } : item
      );
      return {
        ...prev,
        dose_schedules: updated,
        reminder_time: updated[0]?.time || prev.reminder_time,
        meal_timing: updated[0]?.meal || prev.meal_timing,
      };
    });
  }

  async function saveTracker(event) {
    event.preventDefault();
    if (!user?.uid) return;
    if (!form.product_name.trim()) {
      showToast("Please select a product or enter a custom name.", "error");
      return;
    }
    setSaving(true);

    const normalizedSchedules = Array.from({ length: form.daily_dose }, (_, idx) => ({
      time: form.dose_schedules[idx]?.time || form.reminder_time || "09:00",
      meal: form.dose_schedules[idx]?.meal || form.meal_timing || "After meal",
    }));

    const values = {
      product_name: form.product_name.trim(),
      gummies_remaining: Number(form.gummies_remaining),
      daily_dose: Number(form.daily_dose),
      reorder_threshold: Number(form.reorder_threshold),
      reorder_url: form.reorder_url?.trim() || null,
      reminder_time: normalizedSchedules[0].time,
      meal_timing: normalizedSchedules[0].meal,
      dose_schedules: normalizedSchedules,
      reminder_enabled: Boolean(form.reminder_enabled),
    };

    let nextTrackers;
    if (editing) {
      nextTrackers = trackers.map((t) => (t.id === editing.id ? { ...t, ...values } : t));
      showToast("Product routine updated.");
    } else {
      const newId = `tracker-${Date.now()}`;
      nextTrackers = [
        ...trackers,
        { id: newId, ...values, user_id: user.uid, created_at: new Date().toISOString() },
      ];
      showToast("Product added to your routine.");
    }

    setTrackers(nextTrackers);
    saveStoredData(user.uid, "trackers", nextTrackers);
    saveTrackersToCloud(user.uid, nextTrackers);
    setDialogOpen(false);
    setSaving(false);
  }

  async function logDose(tracker) {
    if (!user?.uid || !today) return;
    const existingLog = logs.find(
      (log) => log.tracker_id === tracker.id && log.dose_date === today
    );

    setWorkingId(tracker.id);

    if (existingLog) {
      const nextLogs = logs.filter((l) => l.id !== existingLog.id);
      const nextTrackers = trackers.map((t) =>
        t.id === tracker.id
          ? { ...t, gummies_remaining: t.gummies_remaining + t.daily_dose }
          : t
      );
      setLogs(nextLogs);
      setTrackers(nextTrackers);
      saveStoredData(user.uid, "logs", nextLogs);
      saveStoredData(user.uid, "trackers", nextTrackers);
      saveLogsToCloud(user.uid, nextLogs);
      saveTrackersToCloud(user.uid, nextTrackers);
      showToast("Dose check-off undone.", "info");
    } else {
      if (tracker.gummies_remaining < tracker.daily_dose) {
        showToast(
          "Not enough units left for a full dose. Update your bottle count first.",
          "error"
        );
        setWorkingId(null);
        return;
      }
      const logId = `log-${tracker.id}-${today}`;
      const nextLogs = [
        {
          id: logId,
          tracker_id: tracker.id,
          user_id: user.uid,
          dose_date: today,
          gummies_taken: tracker.daily_dose,
          created_at: new Date().toISOString(),
        },
        ...logs,
      ];
      const nextTrackers = trackers.map((t) =>
        t.id === tracker.id
          ? { ...t, gummies_remaining: Math.max(0, t.gummies_remaining - t.daily_dose) }
          : t
      );
      setLogs(nextLogs);
      setTrackers(nextTrackers);
      saveStoredData(user.uid, "logs", nextLogs);
      saveStoredData(user.uid, "trackers", nextTrackers);
      saveLogsToCloud(user.uid, nextLogs);
      saveTrackersToCloud(user.uid, nextTrackers);
      showToast("Dose checked off. Keep your streak alive!");
    }

    setWorkingId(null);
  }

  async function deleteTracker(tracker) {
    if (!user?.uid) return;
    const nextTrackers = trackers.filter((t) => t.id !== tracker.id);
    const nextLogs = logs.filter((l) => l.tracker_id !== tracker.id);
    setTrackers(nextTrackers);
    setLogs(nextLogs);
    saveStoredData(user.uid, "trackers", nextTrackers);
    saveStoredData(user.uid, "logs", nextLogs);
    saveTrackersToCloud(user.uid, nextTrackers);
    saveLogsToCloud(user.uid, nextLogs);
    setDialogOpen(false);
    showToast("Product removed from routine.", "info");
  }

  async function handleAddCheckup(newEntry) {
    if (!user?.uid) return;
    const nextCheckups = [newEntry, ...checkups];
    setCheckups(nextCheckups);
    saveStoredData(user.uid, "checkups", nextCheckups);
    saveCheckupsToCloud(user.uid, nextCheckups);
    showToast(`Day ${newEntry.dayNumber} checkup saved!`);
  }

  async function handleDeleteCheckup(id) {
    if (!user?.uid) return;
    const nextCheckups = checkups.filter((item) => item.id !== id);
    setCheckups(nextCheckups);
    saveStoredData(user.uid, "checkups", nextCheckups);
    saveCheckupsToCloud(user.uid, nextCheckups);
    showToast("Checkup entry removed.", "info");
  }

  if (!user) {
    return (
      <WebAppShell toasts={toasts}>
        <SignInScreen
          authMode={authMode}
          setAuthMode={setAuthMode}
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          authBusy={authBusy}
          submitAuth={submitAuth}
          signInWithGoogle={signInWithGoogle}
          signInAsGuest={signInAsGuest}
        />
      </WebAppShell>
    );
  }

  const displayName =
    healthProfile?.fullName ||
    (user.email ? user.email.split("@")[0] : "Guest Member");

  const avatarUrl = healthProfile?.avatarUrl || "";
  const lowTrackers = trackers.filter(isLowOnStock);
  const expectedDoses = trackers.length;

  return (
    <WebAppShell toasts={toasts}>
      {/* Sticky Top Brand & Utility Bar */}
      <header className="sticky top-0 z-30 border-b border-[#DCE5DF] dark:border-[#22332A] bg-white dark:bg-[#131A16]/95 dark:bg-[#0F1713]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          {/* Brand Logo -> Navigates back to Routine Home */}
          <button
            type="button"
            onClick={() => {
              setEditingProfile(false);
              setActiveTab("routine");
            }}
            className="inline-flex cursor-pointer items-center gap-2.5 text-left transition hover:opacity-80"
            aria-label="Dosemate home — go to Routine"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#388E6C] bg-[#388E6C] dark:bg-[#00E599] text-white dark:text-[#061810] shadow-2xs sm:h-9 sm:w-9">
              <ShieldCheck size={18} strokeWidth={2.3} />
            </span>
            <span className="flex flex-col leading-none">
              <span className="text-base font-extrabold tracking-tight text-[#1A2B24] dark:text-[#F1F5F3] sm:text-lg">
                Dose<span className="font-normal text-[#566B62] dark:text-[#8EA399]">mate</span>
              </span>
              <span className="mt-0.5 text-[9px] font-bold tracking-wider text-[#388E6C] dark:text-[#00E599] uppercase sm:text-[10px]">
                Powered by Man Matters
              </span>
            </span>
          </button>

          {/* Top Bar Right Utility Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {healthProfile && (
              <button
                type="button"
                onClick={() => setEditingProfile((prev) => !prev)}
                title="Edit Health Profile"
                className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-[#DCE5DF] dark:border-[#22332A] bg-white dark:bg-[#131A16] px-2.5 text-xs font-semibold text-[#1A2B24] dark:text-[#F1F5F3] transition hover:bg-[#F4F7F5] dark:hover:bg-[#1A2520] dark:bg-[#0B0F0E] sm:h-9 sm:px-3"
              >
                <HeartPulse size={14} className="text-[#388E6C] dark:text-[#00E599]" />
                <span className="hidden sm:inline">Health Profile</span>
              </button>
            )}

            <button
              type="button"
              onClick={toggleTheme}
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label="Toggle theme"
              className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-[#DCE5DF] bg-white px-2.5 text-xs font-semibold text-[#1A2B24] transition hover:bg-[#F4F7F5] dark:border-[#22332A] dark:bg-[#131A16] dark:text-[#F1F5F3] dark:hover:bg-[#1A2520] sm:h-9 sm:px-3"
            >
              {theme === "dark" ? (
                <Sun size={14} className="text-[#00E599]" />
              ) : (
                <Moon size={14} className="text-[#388E6C]" />
              )}
              <span className="hidden sm:inline">
                {theme === "dark" ? "Light Mode" : "Dark Mode"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => void enableNotifications()}
              aria-label="Enable notifications"
              className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-[#DCE5DF] dark:border-[#22332A] bg-white dark:bg-[#131A16] px-2.5 text-xs font-semibold text-[#1A2B24] dark:text-[#F1F5F3] transition hover:bg-[#F4F7F5] dark:hover:bg-[#1A2520] dark:bg-[#0B0F0E] sm:h-9 sm:px-3"
            >
              <Bell
                size={14}
                className={notifications === "granted" ? "text-[#388E6C] dark:text-[#00E599]" : ""}
              />
              <span className="hidden sm:inline">
                {notifications === "granted" ? "Alerts on" : "Alerts"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                const sample = trackers[0] || {
                  id: "sample-alarm",
                  product_name: "Biotin Hair Gummies (No Added Sugar)",
                  daily_dose: 2,
                  meal_timing: "After breakfast",
                  gummies_remaining: 56,
                  reminder_enabled: true,
                };
                triggerInAppAlarm(sample);
              }}
              title="Test In-App Alarm with Sound"
              aria-label="Test Alarm"
              className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-[#BFE3D3] dark:border-[#00E599]/40 bg-[#E3F2EC] dark:bg-[#00E599]/15 px-2.5 text-xs font-semibold text-[#163A2E] dark:text-[#00E599] transition hover:bg-[#D4EBDD] dark:hover:bg-[#00E599]/25 sm:h-9 sm:px-3"
            >
              <Volume2 size={14} className="text-[#388E6C] dark:text-[#00E599]" />
              <span className="hidden sm:inline">Test Alarm</span>
            </button>

            <button
              type="button"
              onClick={() => void signOut()}
              title="Sign Out"
              aria-label="Sign Out"
              className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-[#F5C2C7] dark:border-[#4A2024] bg-white dark:bg-[#131A16] px-2.5 text-xs font-semibold text-[#C53030] dark:text-[#FF8080] transition hover:bg-[#FFF5F5] dark:hover:bg-[#201515] sm:h-9 sm:px-3"
            >
              <LogOut size={13} />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area: Onboarding Wizard OR Active Dashboard Tabs */}
      <main className="flex-1 pb-32">
        {!healthProfile || editingProfile ? (
          <HealthOnboardingWizard
            userEmail={user.email}
            existingProfile={healthProfile}
            onComplete={handleCompleteOnboarding}
            onSkip={editingProfile ? () => setEditingProfile(false) : null}
            onSignOut={signOut}
          />
        ) : activeTab === "progress" ? (
          <HairCheckupPage
            today={today}
            currentJourneyDay={currentJourneyDay}
            primaryGummyName={trackers[0]?.product_name || "Biotin Hair Gummies"}
            totalGummiesConsumed={totalGummiesConsumed}
            checkups={checkups}
            onAddCheckup={handleAddCheckup}
            onDeleteCheckup={handleDeleteCheckup}
            showToast={showToast}
          />
        ) : activeTab === "products" ? (
          <ProductsCatalogPage />
        ) : activeTab === "profile" ? (
          <UserProfilePage
            user={user}
            healthProfile={healthProfile}
            displayName={displayName}
            streak={streak}
            currentJourneyDay={currentJourneyDay}
            totalGummiesConsumed={totalGummiesConsumed}
            onUpdateAvatar={handleUpdateAvatar}
            onEditHealthProfile={() => setEditingProfile(true)}
            onSignOut={signOut}
            showToast={showToast}
          />
        ) : (
          <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
            {/* Personalized Welcome Header & Primary Add Products CTA */}
            <section className="flex flex-col justify-between gap-4 border-b border-[#DCE5DF] dark:border-[#22332A] pb-6 sm:flex-row sm:items-end">
              <div>
                <p className="inline-flex items-center gap-1.5 text-xs font-bold tracking-wide text-[#566B62] dark:text-[#8EA399]">
                  <span className="inline-flex text-[#F5B841]">
                    <Sun size={14} />
                  </span>
                  {healthProfile.goalHorizon} Goal · {healthProfile.concerns?.[0] || "Daily Wellness"}
                </p>
                <h1 className="mt-1.5 text-2xl font-extrabold text-[#1A2B24] dark:text-[#F1F5F3] sm:text-3xl">
                  Hey {displayName.split(" ")[0]}, keep your daily ritual going
                </h1>
                <p className="mt-1 text-sm text-[#5E736A] dark:text-[#8EA399]">
                  Track each dose, monitor bottle supply, and stay consistent with your regimen.
                </p>
              </div>

              <button
                type="button"
                onClick={() => openAddDialog()}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#388E6C] dark:bg-[#00E599] dark:text-[#061810] px-5 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-[#2E775A] dark:hover:bg-[#00CC88] active:scale-[0.98]"
              >
                <Plus size={16} />
                <span>Add Product</span>
              </button>
            </section>

            {/* 3-Card Summary Metrics Strip */}
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="flex items-center gap-3.5 rounded-2xl border border-[#DCE5DF] dark:border-[#22332A] bg-white dark:bg-[#131A16] p-4 shadow-2xs">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#E3F2EC] dark:bg-[#00E599]/15 text-[#388E6C] dark:text-[#00E599]">
                  <CircleCheck size={20} />
                </span>
                <div>
                  <p className="text-[11px] font-bold tracking-wider text-[#667B72] dark:text-[#7D9489]">
                    TODAY&apos;S PROGRESS
                  </p>
                  <p className="mt-0.5 text-xl font-extrabold text-[#1A2B24] dark:text-[#F1F5F3]">
                    {dosesToday}
                    <span className="text-sm font-medium text-[#667B72] dark:text-[#7D9489]">
                      {" "}
                      / {expectedDoses} done
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 rounded-2xl border border-[#DCE5DF] dark:border-[#22332A] bg-white dark:bg-[#131A16] p-4 shadow-2xs">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#FDF2D8] text-[#B87D14]">
                  <Sparkles size={20} />
                </span>
                <div>
                  <p className="text-[11px] font-bold tracking-wider text-[#667B72] dark:text-[#7D9489]">
                    CURRENT STREAK
                  </p>
                  <p className="mt-0.5 text-xl font-extrabold text-[#1A2B24] dark:text-[#F1F5F3]">
                    {streak}
                    <span className="text-sm font-medium text-[#667B72] dark:text-[#7D9489]">
                      {" "}
                      {streak === 1 ? "day" : "days"}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 rounded-2xl border border-[#DCE5DF] dark:border-[#22332A] bg-white dark:bg-[#131A16] p-4 shadow-2xs">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#FCECE8] text-[#C94F32]">
                  <PackageCheck size={20} />
                </span>
                <div>
                  <p className="text-[11px] font-bold tracking-wider text-[#667B72] dark:text-[#7D9489]">
                    BOTTLE SUPPLY
                  </p>
                  <p className="mt-0.5 text-xl font-extrabold text-[#1A2B24] dark:text-[#F1F5F3]">
                    {lowTrackers.length
                      ? `${lowTrackers.length} running low`
                      : "All well stocked"}
                  </p>
                </div>
              </div>
            </section>

            {/* Low-Stock Alert Banner */}
            {lowTrackers.length > 0 && (
              <section className="flex items-center justify-between gap-4 rounded-2xl border border-[#F5D6CE] bg-[#FDF6F4] p-4 shadow-2xs">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FCE5DF] text-[#C94F32]">
                    <PackageCheck size={20} />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-[#9C331C]">
                      Low supply alert — reorder soon
                    </p>
                    <p className="mt-0.5 text-xs text-[#6B4A43]">
                      {lowTrackers
                        .map(
                          (tracker) =>
                            `${tracker.product_name} (${daysRemaining(tracker)} ${
                              daysRemaining(tracker) === 1 ? "day" : "days"
                            } left)`
                        )
                        .join(" · ")}
                    </p>
                  </div>
                </div>
                <span className="hidden text-[#C94F32] sm:inline">
                  <ArrowDown size={16} />
                </span>
              </section>
            )}

            {/* Main 2-Column Web Dashboard Layout */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              {/* Left 8 Columns: Active Product Routine Cards */}
              <section className="space-y-4 lg:col-span-8">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold tracking-wider text-[#667B72] dark:text-[#7D9489]">
                      THE DAILY DOSE
                    </p>
                    <h2 className="text-lg font-bold text-[#1A2B24] dark:text-[#F1F5F3]">Active Regimen</h2>
                  </div>
                  <span className="rounded-full bg-[#E3F2EC] dark:bg-[#00E599]/15 px-3 py-1 text-xs font-bold text-[#276B50] dark:text-[#00E599]">
                    {trackers.length.toString().padStart(2, "0")}{" "}
                    {trackers.length === 1 ? "PRODUCT" : "PRODUCTS"}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {trackers.map((tracker, index) => {
                    const taken = logs.some(
                      (log) => log.tracker_id === tracker.id && log.dose_date === today
                    );
                    const days = daysRemaining(tracker);
                    const low = isLowOnStock(tracker);
                    const fill = Math.min(
                      100,
                      (tracker.gummies_remaining /
                        Math.max(tracker.gummies_remaining + tracker.daily_dose * 10, 1)) *
                        100
                    );

                    return (
                      <article
                        key={tracker.id}
                        className={`flex flex-col justify-between rounded-3xl border p-5 transition ${
                          taken
                            ? "border-[#BFE3D3] dark:border-[#00E599]/30 bg-[#F1F9F5] dark:bg-[#15231D]"
                            : "border-[#DCE5DF] dark:border-[#22332A] bg-white dark:bg-[#131A16] shadow-2xs hover:border-[#388E6C] dark:border-[#00E599]/50"
                        }`}
                      >
                        <div>
                          {/* Card Header */}
                          <div className="flex items-start justify-between gap-2.5">
                            <div className="flex items-center gap-3">
                              <div
                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-extrabold ${
                                  taken
                                    ? "bg-[#388E6C] bg-[#388E6C] dark:bg-[#00E599] text-white dark:text-[#061810]"
                                    : "border border-[#DCE5DF] dark:border-[#22332A] bg-[#F4F7F5] dark:bg-[#0B0F0E] text-[#485C53] dark:text-[#B8CCC2]"
                                }`}
                              >
                                {taken ? (
                                  <Check size={16} />
                                ) : (
                                  (index + 1).toString().padStart(2, "0")
                                )}
                              </div>
                              <div className="min-w-0">
                                <span className="text-[10px] font-bold tracking-wider text-[#667B72] dark:text-[#7D9489]">
                                  {tracker.reminder_enabled ? "DAILY REGIMEN" : "ROUTINE"}
                                </span>
                                <h3 className="text-sm font-bold text-[#1A2B24] dark:text-[#F1F5F3]">
                                  {tracker.product_name}
                                </h3>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => openAddDialog(tracker)}
                              aria-label={`Edit ${tracker.product_name}`}
                              title="Edit routine"
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[#72877E] dark:text-[#7D9489] transition hover:bg-[#EAEFEA] dark:hover:bg-[#1E2C25] hover:text-[#1A2B24] dark:text-[#F1F5F3]"
                            >
                              <Settings2 size={16} />
                            </button>
                          </div>

                          {/* Dosage & Meal Schedule Badges */}
                          <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-[#5E736A] dark:text-[#8EA399]">
                            <span className="inline-flex items-center gap-1 font-semibold text-[#3E4C59] dark:text-[#A0B4AA]">
                              <Clock3 size={13} />
                              {tracker.daily_dose}{" "}
                              {tracker.daily_dose === 1 ? "unit/day" : "units/day"}
                            </span>
                            {Array.isArray(tracker.dose_schedules) &&
                            tracker.dose_schedules.length > 0 ? (
                              tracker.dose_schedules.map((sched, sIdx) => (
                                <span
                                  key={sIdx}
                                  className="rounded-lg bg-[#E3F2EC] dark:bg-[#00E599]/15 px-2 py-0.5 text-[11px] font-semibold text-[#276B50] dark:text-[#00E599]"
                                >
                                  #{sIdx + 1} · {sched.time.slice(0, 5)} ({sched.meal})
                                </span>
                              ))
                            ) : (
                              <span className="rounded-lg bg-[#E3F2EC] dark:bg-[#00E599]/15 px-2 py-0.5 text-[11px] font-semibold text-[#276B50] dark:text-[#00E599]">
                                {tracker.reminder_time.slice(0, 5)} (
                                {tracker.meal_timing || "After meal"})
                              </span>
                            )}
                          </div>

                          {/* Bottle Supply Progress Bar */}
                          <div className="mt-4">
                            <div className="mb-1.5 flex items-center justify-between text-[11px] font-bold">
                              <span className="text-[#667B72] dark:text-[#7D9489]">
                                {tracker.gummies_remaining} units left in bottle
                              </span>
                              <span className={low ? "text-[#C94F32]" : "text-[#388E6C] dark:text-[#00E599]"}>
                                {days} {days === 1 ? "day" : "days"} left
                              </span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-[#E6ECE9]">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  low ? "bg-[#E86F52]" : "bg-[#388E6C] dark:bg-[#00E599] dark:text-[#061810]"
                                }`}
                                style={{ width: `${fill}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Action Footer */}
                        <div className="mt-4 flex items-center gap-2 border-t border-[#EAEFEA] dark:border-[#1B2922] pt-3.5">
                          <button
                            type="button"
                            onClick={() => void logDose(tracker)}
                            disabled={workingId === tracker.id}
                            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition active:scale-[0.98] ${
                              taken
                                ? "border border-[#B6DEC9] dark:border-[#00E599]/30 bg-[#DCF2E7] dark:bg-[#00E599]/20 text-[#22664B] dark:text-[#00E599] hover:bg-[#CFEAD9]"
                                : "bg-[#388E6C] bg-[#388E6C] dark:bg-[#00E599] text-white dark:text-[#061810] shadow-2xs hover:bg-[#2E775A] dark:hover:bg-[#00CC88]"
                            }`}
                          >
                            <Check size={15} />
                            {workingId === tracker.id
                              ? "Saving…"
                              : taken
                              ? "Taken today (Undo)"
                              : "Take dose"}
                          </button>

                          {tracker.reorder_url && low && (
                            <a
                              href={tracker.reorder_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 rounded-xl border border-[#F5C6BA] bg-white dark:bg-[#131A16] px-3.5 py-2.5 text-xs font-bold text-[#B54434] transition hover:bg-[#FCECE8]"
                            >
                              Reorder <ArrowUpRight size={14} />
                            </a>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>

              {/* Right 4 Columns: Weekly Consistency & Health Summary Sidebar */}
              <aside className="space-y-4 lg:col-span-4">
                {/* 7-Day Consistency Calendar */}
                <div className="rounded-3xl border border-[#DCE5DF] dark:border-[#22332A] bg-white dark:bg-[#131A16] p-5 shadow-2xs">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-bold tracking-wider text-[#667B72] dark:text-[#7D9489]">
                        CONSISTENCY
                      </p>
                      <h2 className="text-base font-bold text-[#1A2B24] dark:text-[#F1F5F3]">Last 7 Days</h2>
                    </div>
                    <span className="rounded-full bg-[#E3F2EC] dark:bg-[#00E599]/15 px-2.5 py-1 text-xs font-bold text-[#276B50] dark:text-[#00E599]">
                      {
                        logs.filter((log) =>
                          trackers.some((tracker) => tracker.id === log.tracker_id)
                        ).length
                      }{" "}
                      doses
                    </span>
                  </div>

                  <div className="grid grid-cols-7 gap-1.5 text-center">
                    {Array.from({ length: 7 }, (_, offset) => {
                      const date = new Date();
                      date.setDate(date.getDate() - (6 - offset));
                      const key = localDateKey(date);
                      const complete =
                        trackers.length > 0 &&
                        trackers.every((tracker) =>
                          logs.some(
                            (log) => log.tracker_id === tracker.id && log.dose_date === key
                          )
                        );
                      const partial = logs.some(
                        (log) =>
                          log.dose_date === key &&
                          trackers.some((tracker) => tracker.id === log.tracker_id)
                      );

                      return (
                        <div key={key} className="flex flex-col items-center gap-1.5">
                          <span className="text-[10px] font-bold text-[#72877E] dark:text-[#7D9489]">
                            {new Intl.DateTimeFormat("en", { weekday: "narrow" }).format(date)}
                          </span>
                          <span
                            className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold transition ${
                              complete
                                ? "bg-[#388E6C] bg-[#388E6C] dark:bg-[#00E599] text-white dark:text-[#061810] shadow-2xs"
                                : partial
                                ? "border border-[#388E6C] dark:border-[#00E599] bg-[#E3F2EC] dark:bg-[#00E599]/15 text-[#276B50] dark:text-[#00E599]"
                                : "border border-[#E1E6EB] dark:border-[#1B2922] bg-[#F9FBFA] dark:bg-[#17201C] text-[#566B62] dark:text-[#8EA399]"
                            }`}
                          >
                            {complete ? (
                              <Check size={14} />
                            ) : partial ? (
                              <span className="h-2 w-2 rounded-full bg-[#388E6C] dark:bg-[#00E599] dark:text-[#061810]" />
                            ) : (
                              <span>{date.getDate()}</span>
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* User Health Profile Snapshot Card */}
                <div className="rounded-3xl border border-[#DCE5DF] dark:border-[#22332A] bg-white dark:bg-[#131A16] p-5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold tracking-wider text-[#388E6C] dark:text-[#00E599]">
                      YOUR HEALTH PROFILE
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingProfile(true)}
                      className="text-xs font-bold text-[#5E736A] dark:text-[#8EA399] underline hover:text-[#1A2B24] dark:text-[#F1F5F3]"
                    >
                      Edit
                    </button>
                  </div>
                  <p className="mt-1.5 text-sm font-bold text-[#1A2B24] dark:text-[#F1F5F3]">
                    {healthProfile.hairStage}
                  </p>
                  <p className="mt-1 text-xs text-[#5E736A] dark:text-[#8EA399]">
                    Age {healthProfile.age} · Sleep {healthProfile.sleepHours} ·{" "}
                    {healthProfile.stressLevel} stress
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {(healthProfile.concerns || []).map((c) => (
                      <span
                        key={c}
                        className="rounded-lg bg-[#F4F7F5] dark:bg-[#0B0F0E] px-2.5 py-1 text-[10px] font-bold text-[#3E4C59] dark:text-[#A0B4AA]"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              </aside>
            </div>
          </div>
        )}
      </main>

      {/* Ask Queries Floating Specialist Chatbot */}
      <SahilAIChatbot
        healthProfile={healthProfile}
        trackers={trackers}
        streak={streak}
        currentJourneyDay={currentJourneyDay}
      />

      {/* Bottom Docked Navigation Bar (Routine · Progress · Products · Profile) */}
      {healthProfile && !editingProfile && (
        <nav
          aria-label="Bottom page navigation"
          className="fixed inset-x-0 bottom-0 z-30 border-t border-[#DCE5DF] dark:border-[#22332A] bg-white dark:bg-[#131A16]/95 dark:bg-[#0F1713]/90 px-4 py-2.5 shadow-[0_-4px_20px_rgba(22,58,46,0.06)] backdrop-blur-md"
        >
          <div className="mx-auto grid max-w-lg grid-cols-4 gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("routine")}
              className={`flex flex-col items-center justify-center gap-1 rounded-2xl py-2 text-xs font-bold transition ${
                activeTab === "routine"
                  ? "bg-[#E3F2EC] dark:bg-[#00E599]/15 text-[#388E6C] dark:text-[#00E599] shadow-2xs"
                  : "text-[#5E736A] dark:text-[#8EA399] hover:bg-[#F4F7F5] dark:hover:bg-[#1A2520] dark:bg-[#0B0F0E] hover:text-[#1A2B24] dark:text-[#F1F5F3]"
              }`}
            >
              <Pill size={17} />
              <span>Routine</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("progress")}
              className={`relative flex flex-col items-center justify-center gap-1 rounded-2xl py-2 text-xs font-bold transition ${
                activeTab === "progress"
                  ? "bg-[#E3F2EC] dark:bg-[#00E599]/15 text-[#388E6C] dark:text-[#00E599] shadow-2xs"
                  : "text-[#5E736A] dark:text-[#8EA399] hover:bg-[#F4F7F5] dark:hover:bg-[#1A2520] dark:bg-[#0B0F0E] hover:text-[#1A2B24] dark:text-[#F1F5F3]"
              }`}
            >
              <Camera size={17} />
              <span>Progress</span>
              {!checkups.some((c) => c.date === today) && (
                <span className="absolute top-2 right-5 h-2 w-2 rounded-full bg-[#E86F52]" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("products")}
              className={`flex flex-col items-center justify-center gap-1 rounded-2xl py-2 text-xs font-bold transition ${
                activeTab === "products"
                  ? "bg-[#E3F2EC] dark:bg-[#00E599]/15 text-[#388E6C] dark:text-[#00E599] shadow-2xs"
                  : "text-[#5E736A] dark:text-[#8EA399] hover:bg-[#F4F7F5] dark:hover:bg-[#1A2520] dark:bg-[#0B0F0E] hover:text-[#1A2B24] dark:text-[#F1F5F3]"
              }`}
            >
              <ShoppingBag size={17} />
              <span>Products</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("profile")}
              className={`flex flex-col items-center justify-center gap-1 rounded-2xl py-2 text-xs font-bold transition ${
                activeTab === "profile"
                  ? "bg-[#E3F2EC] dark:bg-[#00E599]/15 text-[#388E6C] dark:text-[#00E599] shadow-2xs"
                  : "text-[#5E736A] dark:text-[#8EA399] hover:bg-[#F4F7F5] dark:hover:bg-[#1A2520] dark:bg-[#0B0F0E] hover:text-[#1A2B24] dark:text-[#F1F5F3]"
              }`}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Profile"
                  className="h-[18px] w-[18px] rounded-full object-cover ring-1 ring-[#388E6C]"
                />
              ) : (
                <User size={17} />
              )}
              <span>Profile</span>
            </button>
          </div>
        </nav>
      )}

      {/* Centered Responsive Web Modal Dialog for Adding / Editing Products */}
      {dialogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A2B24]/55 p-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-[#DCE5DF] dark:border-[#22332A] bg-white dark:bg-[#131A16] p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#E3F2EC] dark:bg-[#00E599]/15 text-[#388E6C] dark:text-[#00E599]">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#1A2B24] dark:text-[#F1F5F3]">
                    {editing ? "Edit product routine" : "Add product to routine"}
                  </h2>
                  <p className="text-xs text-[#5E736A] dark:text-[#8EA399]">
                    Select a supplement or add your own with custom meal timings.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setDialogOpen(false)}
                aria-label="Close modal"
                className="rounded-full p-1.5 text-[#72877E] dark:text-[#7D9489] hover:bg-[#F4F7F5] dark:hover:bg-[#1A2520] dark:bg-[#0B0F0E]"
              >
                <X size={18} />
              </button>
            </div>

            <form className="mt-5 space-y-4" onSubmit={(event) => void saveTracker(event)}>
              <div>
                <label
                  htmlFor="product-select"
                  className="block text-xs font-bold text-[#3E4C59] dark:text-[#A0B4AA]"
                >
                  Select Product
                </label>
                <select
                  id="product-select"
                  value={form.is_custom_product ? "__custom__" : form.product_name}
                  onChange={(event) => handleSelectProductPreset(event.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#D5DCE4] dark:border-[#25382E] bg-[#F7F8FA] dark:bg-[#17201C] px-3.5 py-2.5 text-xs font-semibold text-[#141A21] dark:text-[#F1F5F3] outline-none transition focus:border-[#388E6C] dark:focus:border-[#00E599] dark:border-[#00E599]"
                >
                  {MAN_MATTERS_GUMMY_PRESETS.map((preset) => (
                    <option key={preset.name} value={preset.name}>
                      {preset.name}
                    </option>
                  ))}
                  <option value="__custom__">+ Add your own</option>
                </select>

                {form.is_custom_product && (
                  <div className="mt-2.5">
                    <label
                      htmlFor="custom-product-name"
                      className="block text-[11px] font-bold text-[#5E736A] dark:text-[#8EA399]"
                    >
                      Custom product name
                    </label>
                    <input
                      id="custom-product-name"
                      autoFocus
                      maxLength={80}
                      required
                      value={form.product_name}
                      onChange={(event) =>
                        setForm({ ...form, product_name: event.target.value })
                      }
                      placeholder="e.g. Redensyl Hair Tonic or Multivitamin"
                      className="mt-1 w-full rounded-xl border border-[#388E6C] dark:border-[#00E599] bg-white dark:bg-[#131A16] px-3.5 py-2.5 text-xs text-[#141A21] dark:text-[#F1F5F3] outline-none transition"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="stock-count"
                    className="block text-xs font-bold text-[#3E4C59] dark:text-[#A0B4AA]"
                  >
                    Units in bottle
                  </label>
                  <input
                    id="stock-count"
                    type="number"
                    min={0}
                    max={10000}
                    required
                    value={form.gummies_remaining}
                    onChange={(event) =>
                      setForm({ ...form, gummies_remaining: Number(event.target.value) })
                    }
                    className="mt-1.5 w-full rounded-xl border border-[#D5DCE4] dark:border-[#25382E] bg-[#F7F8FA] dark:bg-[#17201C] px-3.5 py-2.5 text-xs text-[#141A21] dark:text-[#F1F5F3] outline-none transition focus:border-[#388E6C] dark:focus:border-[#00E599] dark:border-[#00E599]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="daily-dose"
                    className="block text-xs font-bold text-[#3E4C59] dark:text-[#A0B4AA]"
                  >
                    Units per day
                  </label>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    {[1, 2, 3, 4].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => handleDailyDoseChange(num)}
                        className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition ${
                          form.daily_dose === num
                            ? "bg-[#388E6C] bg-[#388E6C] dark:bg-[#00E599] text-white dark:text-[#061810] shadow-2xs"
                            : "border border-[#D5DCE4] dark:border-[#25382E] bg-[#F7F8FA] dark:bg-[#17201C] text-[#485C53] dark:text-[#B8CCC2] hover:bg-[#EAEFEA] dark:hover:bg-[#1E2C25]"
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                    <input
                      id="daily-dose"
                      type="number"
                      min={1}
                      max={10}
                      required
                      aria-label="Custom daily dose"
                      value={form.daily_dose}
                      onChange={(event) => handleDailyDoseChange(event.target.value)}
                      className="w-12 rounded-xl border border-[#D5DCE4] dark:border-[#25382E] bg-[#F7F8FA] dark:bg-[#17201C] px-1.5 py-2.5 text-center text-xs font-bold text-[#141A21] dark:text-[#F1F5F3] outline-none transition focus:border-[#388E6C] dark:focus:border-[#00E599] dark:border-[#00E599]"
                    />
                  </div>
                </div>
              </div>

              {/* Single Dose vs Separate Per-Dose Timings & Before/After Meal Selection */}
              {form.daily_dose === 1 ? (
                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="reminder-time"
                      className="block text-xs font-bold text-[#3E4C59] dark:text-[#A0B4AA]"
                    >
                      Reminder time
                    </label>
                    <input
                      id="reminder-time"
                      type="time"
                      required
                      value={form.dose_schedules[0]?.time || form.reminder_time}
                      onChange={(event) =>
                        updateDoseScheduleItem(0, "time", event.target.value)
                      }
                      className="mt-1.5 w-full rounded-xl border border-[#D5DCE4] dark:border-[#25382E] bg-[#F7F8FA] dark:bg-[#17201C] px-3.5 py-2.5 text-xs text-[#141A21] dark:text-[#F1F5F3] outline-none transition focus:border-[#388E6C] dark:focus:border-[#00E599] dark:border-[#00E599]"
                    />
                  </div>

                  <div>
                    <span className="block text-xs font-bold text-[#3E4C59] dark:text-[#A0B4AA]">Meal timing</span>
                    <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                      {["Before meal", "After meal"].map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => updateDoseScheduleItem(0, "meal", option)}
                          className={`rounded-xl py-2.5 text-[11px] font-bold transition ${
                            (form.dose_schedules[0]?.meal || form.meal_timing) === option
                              ? "bg-[#388E6C] bg-[#388E6C] dark:bg-[#00E599] text-white dark:text-[#061810] shadow-2xs"
                              : "border border-[#D5DCE4] dark:border-[#25382E] bg-[#F7F8FA] dark:bg-[#17201C] text-[#485C53] dark:text-[#B8CCC2] hover:bg-[#EAEFEA] dark:hover:bg-[#1E2C25]"
                          }`}
                        >
                          {option === "Before meal" ? "Before" : "After"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5 rounded-2xl border border-[#DCE5DF] dark:border-[#22332A] bg-[#F9FBFA] dark:bg-[#17201C] p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold tracking-wide text-[#276B50] dark:text-[#00E599]">
                      SEPARATE DOSE SCHEDULE ({form.daily_dose} UNITS)
                    </span>
                    <span className="text-[10px] font-semibold text-[#667B72] dark:text-[#7D9489]">
                      Time &amp; meal preference
                    </span>
                  </div>

                  <div className="max-h-40 space-y-2 overflow-y-auto pr-0.5">
                    {form.dose_schedules.map((sched, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 rounded-xl border border-[#E1E6EB] dark:border-[#1B2922] bg-white dark:bg-[#131A16] p-2"
                      >
                        <span className="w-16 shrink-0 text-[11px] font-bold text-[#3E4C59] dark:text-[#A0B4AA]">
                          Dose #{idx + 1}
                        </span>
                        <input
                          type="time"
                          required
                          aria-label={`Dose ${idx + 1} reminder time`}
                          value={sched.time}
                          onChange={(event) =>
                            updateDoseScheduleItem(idx, "time", event.target.value)
                          }
                          className="w-24 rounded-lg border border-[#D5DCE4] dark:border-[#25382E] bg-[#F7F8FA] dark:bg-[#17201C] px-2 py-1.5 text-[11px] font-semibold text-[#141A21] dark:text-[#F1F5F3] outline-none focus:border-[#388E6C] dark:focus:border-[#00E599] dark:border-[#00E599]"
                        />
                        <div className="flex flex-1 gap-1">
                          {["Before meal", "After meal"].map((option) => (
                            <button
                              key={option}
                              type="button"
                              onClick={() => updateDoseScheduleItem(idx, "meal", option)}
                              className={`flex-1 rounded-lg py-1.5 text-[10px] font-bold transition ${
                                sched.meal === option
                                  ? "bg-[#388E6C] bg-[#388E6C] dark:bg-[#00E599] text-white dark:text-[#061810]"
                                  : "bg-[#F4F7F5] dark:bg-[#0B0F0E] text-[#5E736A] dark:text-[#8EA399] hover:bg-[#EAEFEA] dark:hover:bg-[#1E2C25]"
                              }`}
                            >
                              {option === "Before meal" ? "Before" : "After"}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="reorder-threshold"
                    className="block text-xs font-bold text-[#3E4C59] dark:text-[#A0B4AA]"
                  >
                    Low-stock warning (days left)
                  </label>
                  <input
                    id="reorder-threshold"
                    type="number"
                    min={0}
                    max={365}
                    required
                    value={form.reorder_threshold}
                    onChange={(event) =>
                      setForm({ ...form, reorder_threshold: Number(event.target.value) })
                    }
                    className="mt-1.5 w-full rounded-xl border border-[#D5DCE4] dark:border-[#25382E] bg-[#F7F8FA] dark:bg-[#17201C] px-3.5 py-2.5 text-xs text-[#141A21] dark:text-[#F1F5F3] outline-none transition focus:border-[#388E6C] dark:focus:border-[#00E599] dark:border-[#00E599]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="reorder-url"
                    className="block text-xs font-bold text-[#3E4C59] dark:text-[#A0B4AA]"
                  >
                    Reorder link
                  </label>
                  <input
                    id="reorder-url"
                    type="url"
                    maxLength={2048}
                    value={form.reorder_url ?? ""}
                    onChange={(event) =>
                      setForm({ ...form, reorder_url: event.target.value })
                    }
                    placeholder="https://man.matters"
                    className="mt-1.5 w-full rounded-xl border border-[#D5DCE4] dark:border-[#25382E] bg-[#F7F8FA] dark:bg-[#17201C] px-3.5 py-2.5 text-xs text-[#141A21] dark:text-[#F1F5F3] outline-none transition focus:border-[#388E6C] dark:focus:border-[#00E599] dark:border-[#00E599]"
                  />
                </div>
              </div>

              <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-[#DCE5DF] dark:border-[#22332A] bg-[#F9FBFA] dark:bg-[#17201C] p-3.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FDF2D8] text-[#B87D14]">
                  <Bell size={15} />
                </span>
                <span className="flex-1">
                  <strong className="block text-xs font-bold text-[#1A2B24] dark:text-[#F1F5F3]">
                    Enable daily reminders
                  </strong>
                  <small className="text-[11px] text-[#5E736A] dark:text-[#8EA399]">
                    {form.dose_schedules.length > 1
                      ? `${form.dose_schedules.length} reminders (${form.dose_schedules
                          .map((s) => `${s.time} ${s.meal === "Before meal" ? "before" : "after"}`)
                          .join(", ")})`
                      : `At ${form.dose_schedules[0]?.time || form.reminder_time || "09:00"} (${
                          form.dose_schedules[0]?.meal || form.meal_timing || "After meal"
                        })`}
                  </small>
                </span>
                <input
                  type="checkbox"
                  checked={form.reminder_enabled}
                  onChange={(event) =>
                    setForm({ ...form, reminder_enabled: event.target.checked })
                  }
                  aria-label="Enable daily reminder"
                  className="h-4 w-4 accent-[#388E6C] dark:accent-[#00E599]"
                />
              </label>

              <div className="flex items-center justify-end gap-2.5 border-t border-[#EAEFEA] dark:border-[#1B2922] pt-4">
                {editing && (
                  <button
                    type="button"
                    onClick={() => void deleteTracker(editing)}
                    className="mr-auto inline-flex items-center gap-1 rounded-xl border border-[#F5C6BA] px-3.5 py-2.5 text-xs font-bold text-[#B54434] transition hover:bg-[#FCECE8]"
                  >
                    <X size={14} /> Remove
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setDialogOpen(false)}
                  className="rounded-xl border border-[#DCE5DF] dark:border-[#22332A] bg-white dark:bg-[#131A16] px-4 py-2.5 text-xs font-bold text-[#485C53] dark:text-[#B8CCC2] transition hover:bg-[#F4F7F5] dark:hover:bg-[#1A2520] dark:bg-[#0B0F0E]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-[#388E6C] dark:bg-[#00E599] dark:text-[#061810] px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#2E775A] dark:hover:bg-[#00CC88] disabled:opacity-60"
                >
                  {saving ? "Saving…" : editing ? "Save changes" : "Add product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* In-App Alarm Modal Popup with Sound & Actions */}
      {activeAlarm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          role="alertdialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border-2 border-[#388E6C] dark:border-[#00E599] bg-white dark:bg-[#131A16] p-6 shadow-2xl sm:p-8">
            {/* Top pulsing badge & sound toggle */}
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-[#00E599]/20 px-3 py-1 text-[11px] font-extrabold text-[#276B50] dark:text-[#00E599]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00E599] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00E599]"></span>
                </span>
                DOSE ALARM RINGING
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setAlarmSoundEnabled(!alarmSoundEnabled)}
                  title={alarmSoundEnabled ? "Mute sound" : "Unmute sound"}
                  className="rounded-full p-1.5 text-[#5E736A] dark:text-[#8EA399] hover:bg-gray-100 dark:hover:bg-[#1E2C25] transition"
                >
                  {alarmSoundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveAlarm(null)}
                  className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1E2C25] transition"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Ringing Visual */}
            <div className="mt-5 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#E3F2EC] dark:bg-[#00E599]/15 text-[#388E6C] dark:text-[#00E599] shadow-inner">
                <Bell size={38} className="animate-bounce" />
              </div>
              <h3 className="mt-4 text-xl font-extrabold tracking-tight text-[#1A2B24] dark:text-[#F1F5F3]">
                Time for your daily dose!
              </h3>
              <p className="mt-1 text-sm font-semibold text-[#388E6C] dark:text-[#00E599]">
                {activeAlarm.product_name}
              </p>
              <p className="mt-0.5 text-xs text-[#5E736A] dark:text-[#8EA399]">
                Take {activeAlarm.daily_dose} unit ({activeAlarm.meal_timing || "After meal"}) · {activeAlarm.gummies_remaining ?? 60} left in bottle
              </p>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  void logDose(activeAlarm);
                  setActiveAlarm(null);
                }}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#388E6C] dark:bg-[#00E599] py-3.5 text-sm font-bold text-white dark:text-[#061810] shadow-md transition hover:bg-[#2E775A] dark:hover:bg-[#00CC88]"
              >
                <Check size={18} />
                Mark as Taken &amp; Stop Alarm
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const tracker = activeAlarm;
                    setActiveAlarm(null);
                    showToast("Alarm snoozed for 5 minutes ⏰", "info");
                    window.setTimeout(() => {
                      triggerInAppAlarm(tracker);
                    }, 5 * 60 * 1000);
                  }}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-[#DCE5DF] dark:border-[#22332A] bg-[#F9FBFA] dark:bg-[#17201C] py-2.5 text-xs font-bold text-[#1A2B24] dark:text-[#F1F5F3] hover:bg-[#EAEFEA] dark:hover:bg-[#25382E] transition"
                >
                  <Clock3 size={14} />
                  Snooze 5 Min
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveAlarm(null);
                    showToast("Alarm dismissed.", "info");
                  }}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-[#DCE5DF] dark:border-[#22332A] bg-[#F9FBFA] dark:bg-[#17201C] py-2.5 text-xs font-bold text-[#5E736A] dark:text-[#8EA399] hover:bg-[#EAEFEA] dark:hover:bg-[#25382E] transition"
                >
                  <VolumeX size={14} />
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </WebAppShell>
  );
}