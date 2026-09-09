export interface AvatarPreset {
  id: string;
  name: string;
  gender: 'male' | 'female';
  bgColor: string;
  svg: string;
}

export const PRESET_AVATARS: AvatarPreset[] = [
  // ==========================================
  // 5 ERKEK KARAKTER (Farklı Fenotipler)
  // ==========================================
  {
    id: 'preset:male-1',
    name: 'Karakter 1',
    gender: 'male',
    bgColor: '#4f46e5',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="50" fill="url(#bg-m1)"/>
      <defs>
        <linearGradient id="bg-m1" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop stop-color="#6366f1"/>
          <stop offset="1" stop-color="#4338ca"/>
        </linearGradient>
      </defs>
      <!-- Gövde / Kıyafet -->
      <path d="M22 96 C22 76, 36 70, 50 70 C64 70, 78 76, 78 96 Z" fill="#312e81"/>
      <path d="M42 70 L50 82 L58 70 Z" fill="#e0e7ff"/>
      <!-- Boyun -->
      <rect x="44" y="58" width="12" height="15" rx="4" fill="#c68a4c"/>
      <!-- Yüz -->
      <ellipse cx="50" cy="46" rx="19" ry="22" fill="#d99b5b"/>
      <!-- Kulaklar -->
      <circle cx="31" cy="47" r="4.5" fill="#c68a4c"/>
      <circle cx="69" cy="47" r="4.5" fill="#c68a4c"/>
      <!-- Saç (Kısa dalgalı siyah) -->
      <path d="M30 42 C30 25, 40 20, 50 20 C62 20, 70 26, 70 42 C67 36, 61 34, 50 34 C39 34, 33 37, 30 42 Z" fill="#1e1b18"/>
      <!-- Kaşlar & Kirli Sakal -->
      <path d="M38 37 Q43 35 46 37" stroke="#1e1b18" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M54 37 Q57 35 62 37" stroke="#1e1b18" stroke-width="2.2" stroke-linecap="round"/>
      <circle cx="43" cy="43" r="2.2" fill="#1e1b18"/>
      <circle cx="57" cy="43" r="2.2" fill="#1e1b18"/>
      <!-- Burun & Gülümseme -->
      <path d="M50 45 L48.5 50 L51.5 50" stroke="#b07538" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M44 56 Q50 61 56 56" stroke="#844f22" stroke-width="2" stroke-linecap="round"/>
      <!-- Hafif kirli sakal dokusu -->
      <path d="M39 52 C39 63, 44 67, 50 67 C56 67, 61 63, 61 52 C57 56, 43 56, 39 52 Z" fill="#1e1b18" fill-opacity="0.18"/>
    </svg>`
  },
  {
    id: 'preset:male-2',
    name: 'Karakter 2',
    gender: 'male',
    bgColor: '#0284c7',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="50" fill="url(#bg-m2)"/>
      <defs>
        <linearGradient id="bg-m2" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop stop-color="#38bdf8"/>
          <stop offset="1" stop-color="#0369a1"/>
        </linearGradient>
      </defs>
      <!-- Gövde -->
      <path d="M22 96 C22 76, 36 70, 50 70 C64 70, 78 76, 78 96 Z" fill="#0f766e"/>
      <circle cx="50" cy="80" r="4" fill="#5eead4"/>
      <!-- Boyun -->
      <rect x="44" y="58" width="12" height="15" rx="4" fill="#fcd0a1"/>
      <!-- Yüz -->
      <ellipse cx="50" cy="46" rx="19" ry="21" fill="#ffe0bd"/>
      <!-- Kulaklar -->
      <circle cx="31" cy="47" r="4.5" fill="#fcd0a1"/>
      <circle cx="69" cy="47" r="4.5" fill="#fcd0a1"/>
      <!-- Saç (Modern yandan ayrılmış sarı) -->
      <path d="M29 42 C28 26, 40 18, 54 18 C67 18, 72 25, 72 38 C68 31, 58 29, 44 29 C34 29, 30 36, 29 42 Z" fill="#eab308"/>
      <path d="M45 20 Q56 22 66 28" stroke="#ca8a04" stroke-width="2" stroke-linecap="round"/>
      <!-- Gözler (Mavi) & Kaşlar -->
      <path d="M38 37 Q43 35 46 37" stroke="#ca8a04" stroke-width="2" stroke-linecap="round"/>
      <path d="M54 37 Q57 35 62 37" stroke="#ca8a04" stroke-width="2" stroke-linecap="round"/>
      <circle cx="43" cy="43" r="2.2" fill="#0284c7"/>
      <circle cx="57" cy="43" r="2.2" fill="#0284c7"/>
      <path d="M50 45 L49 49 L51.5 49" stroke="#e0a87a" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M44 56 Q50 61 56 56" stroke="#b45309" stroke-width="2" stroke-linecap="round"/>
    </svg>`
  },
  {
    id: 'preset:male-3',
    name: 'Karakter 3',
    gender: 'male',
    bgColor: '#7c3aed',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="50" fill="url(#bg-m3)"/>
      <defs>
        <linearGradient id="bg-m3" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop stop-color="#a855f7"/>
          <stop offset="1" stop-color="#6b21a8"/>
        </linearGradient>
      </defs>
      <!-- Gövde -->
      <path d="M22 96 C22 76, 36 70, 50 70 C64 70, 78 76, 78 96 Z" fill="#f59e0b"/>
      <path d="M44 70 L50 80 L56 70 Z" fill="#ffffff"/>
      <!-- Boyun -->
      <rect x="43" y="58" width="14" height="15" rx="4" fill="#4a2e1b"/>
      <!-- Yüz -->
      <ellipse cx="50" cy="46" rx="19.5" ry="22" fill="#5c3a21"/>
      <!-- Kulaklar -->
      <circle cx="30.5" cy="47" r="4.5" fill="#4a2e1b"/>
      <circle cx="69.5" cy="47" r="4.5" fill="#4a2e1b"/>
      <!-- Saç (Afro Fade Kıvırcık) -->
      <path d="M28 42 C26 23, 40 17, 50 17 C60 17, 74 23, 72 42 C68 34, 60 32, 50 32 C40 32, 32 34, 28 42 Z" fill="#1c1917"/>
      <circle cx="36" cy="24" r="5" fill="#1c1917"/>
      <circle cx="46" cy="20" r="6" fill="#1c1917"/>
      <circle cx="56" cy="21" r="5.5" fill="#1c1917"/>
      <circle cx="64" cy="26" r="5" fill="#1c1917"/>
      <!-- Kaşlar & Gözler -->
      <path d="M38 37 Q43 35 46 37" stroke="#1c1917" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M54 37 Q57 35 62 37" stroke="#1c1917" stroke-width="2.4" stroke-linecap="round"/>
      <circle cx="43" cy="43" r="2.4" fill="#1c1917"/>
      <circle cx="57" cy="43" r="2.4" fill="#1c1917"/>
      <!-- Burun & Dudaklar -->
      <path d="M47 50 Q50 51 53 50" stroke="#3d2314" stroke-width="2" stroke-linecap="round"/>
      <path d="M43 57 Q50 62 57 57" stroke="#3d2314" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M45 58 Q50 63 55 58" fill="#a1583a"/>
    </svg>`
  },
  {
    id: 'preset:male-4',
    name: 'Karakter 4',
    gender: 'male',
    bgColor: '#059669',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="50" fill="url(#bg-m4)"/>
      <defs>
        <linearGradient id="bg-m4" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop stop-color="#10b981"/>
          <stop offset="1" stop-color="#047857"/>
        </linearGradient>
      </defs>
      <!-- Gövde -->
      <path d="M22 96 C22 76, 36 70, 50 70 C64 70, 78 76, 78 96 Z" fill="#1e293b"/>
      <circle cx="50" cy="78" r="3" fill="#cbd5e1"/>
      <!-- Boyun -->
      <rect x="44" y="58" width="12" height="15" rx="4" fill="#e8be92"/>
      <!-- Yüz -->
      <ellipse cx="50" cy="46" rx="19" ry="21" fill="#f8cfab"/>
      <!-- Kulaklar -->
      <circle cx="31" cy="47" r="4.5" fill="#e8be92"/>
      <circle cx="69" cy="47" r="4.5" fill="#e8be92"/>
      <!-- Saç (Düz siyah kakül) -->
      <path d="M29 42 C29 24, 38 19, 50 19 C62 19, 71 24, 71 42 C67 34, 59 32, 50 32 C39 32, 33 35, 29 42 Z" fill="#171717"/>
      <!-- Gözlük -->
      <rect x="36" y="38" width="12" height="9" rx="3.5" fill="rgba(255,255,255,0.4)" stroke="#0f172a" stroke-width="2"/>
      <rect x="52" y="38" width="12" height="9" rx="3.5" fill="rgba(255,255,255,0.4)" stroke="#0f172a" stroke-width="2"/>
      <line x1="48" y1="42" x2="52" y2="42" stroke="#0f172a" stroke-width="2"/>
      <!-- Gözler -->
      <circle cx="42" cy="42.5" r="1.8" fill="#171717"/>
      <circle cx="58" cy="42.5" r="1.8" fill="#171717"/>
      <path d="M50 46 L49 49 L51.5 49" stroke="#d49f6f" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M45 56 Q50 59 55 56" stroke="#92400e" stroke-width="2" stroke-linecap="round"/>
    </svg>`
  },
  {
    id: 'preset:male-5',
    name: 'Kızıl / Çilli',
    gender: 'male',
    bgColor: '#ea580c',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="50" fill="url(#bg-m5)"/>
      <defs>
        <linearGradient id="bg-m5" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop stop-color="#f97316"/>
          <stop offset="1" stop-color="#c2410c"/>
        </linearGradient>
      </defs>
      <!-- Gövde -->
      <path d="M22 96 C22 76, 36 70, 50 70 C64 70, 78 76, 78 96 Z" fill="#047857"/>
      <!-- Boyun -->
      <rect x="44" y="58" width="12" height="15" rx="4" fill="#fad7ba"/>
      <!-- Yüz -->
      <ellipse cx="50" cy="46" rx="19" ry="21" fill="#ffe4cf"/>
      <!-- Kulaklar -->
      <circle cx="31" cy="47" r="4.5" fill="#fad7ba"/>
      <circle cx="69" cy="47" r="4.5" fill="#fad7ba"/>
      <!-- Saç (Dalgalı kızıl) -->
      <path d="M28 42 C27 24, 38 18, 50 18 C64 18, 73 24, 72 42 C67 33, 58 30, 48 30 C38 30, 31 35, 28 42 Z" fill="#b91c1c"/>
      <!-- Kaşlar & Gözler -->
      <path d="M38 37 Q43 35 46 37" stroke="#b91c1c" stroke-width="2" stroke-linecap="round"/>
      <path d="M54 37 Q57 35 62 37" stroke="#b91c1c" stroke-width="2" stroke-linecap="round"/>
      <circle cx="43" cy="43" r="2.2" fill="#15803d"/>
      <circle cx="57" cy="43" r="2.2" fill="#15803d"/>
      <!-- Çiller -->
      <circle cx="41" cy="48" r="0.9" fill="#ea580c"/>
      <circle cx="44" cy="49" r="0.9" fill="#ea580c"/>
      <circle cx="56" cy="49" r="0.9" fill="#ea580c"/>
      <circle cx="59" cy="48" r="0.9" fill="#ea580c"/>
      <path d="M50 45 L49 49 L51.5 49" stroke="#e0a37e" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M44 56 Q50 61 56 56" stroke="#9a3412" stroke-width="2" stroke-linecap="round"/>
    </svg>`
  },
  {
    id: 'preset:male-6',
    name: 'Karakter 6',
    gender: 'male',
    bgColor: '#334155',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="50" fill="url(#bg-m6)"/>
      <defs>
        <linearGradient id="bg-m6" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop stop-color="#475569"/>
          <stop offset="1" stop-color="#1e293b"/>
        </linearGradient>
      </defs>
      <!-- Gövde -->
      <path d="M22 96 C22 76, 36 70, 50 70 C64 70, 78 76, 78 96 Z" fill="#0f172a"/>
      <path d="M44 70 L50 78 L56 70 Z" fill="#cbd5e1"/>
      <!-- Boyun -->
      <rect x="44" y="58" width="12" height="15" rx="4" fill="#e2a76f"/>
      <!-- Yüz -->
      <ellipse cx="50" cy="46" rx="19" ry="22" fill="#f3ba84"/>
      <!-- Kulaklar -->
      <circle cx="31" cy="47" r="4.5" fill="#e2a76f"/>
      <circle cx="69" cy="47" r="4.5" fill="#e2a76f"/>
      <!-- Saç (Gümüş / Karizmatik stil) -->
      <path d="M29 42 C29 23, 40 19, 50 19 C63 19, 71 24, 71 42 C67 34, 60 31, 50 31 C40 31, 33 35, 29 42 Z" fill="#64748b"/>
      <path d="M36 26 C43 20, 56 22, 63 26" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <!-- Kaşlar & Gözler -->
      <path d="M38 37 Q43 35 46 37" stroke="#475569" stroke-width="2" stroke-linecap="round"/>
      <path d="M54 37 Q57 35 62 37" stroke="#475569" stroke-width="2" stroke-linecap="round"/>
      <circle cx="43" cy="43" r="2.2" fill="#1e293b"/>
      <circle cx="57" cy="43" r="2.2" fill="#1e293b"/>
      <!-- Kirli Sakal & Gülümseme -->
      <path d="M38 51 C38 64, 44 68, 50 68 C56 68, 62 64, 62 51 C58 56, 42 56, 38 51 Z" fill="#475569" fill-opacity="0.3"/>
      <path d="M50 45 L48.5 49 L51.5 49" stroke="#c88b50" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M44 56 Q50 60 56 56" stroke="#8c5322" stroke-width="2" stroke-linecap="round"/>
    </svg>`
  },

  // ==========================================
  // KADIN KARAKTERLER (Farklı Fenotipler)
  // ==========================================
  {
    id: 'preset:female-1',
    name: 'Karakter 6',
    gender: 'female',
    bgColor: '#db2777',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="50" fill="url(#bg-f1)"/>
      <defs>
        <linearGradient id="bg-f1" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop stop-color="#ec4899"/>
          <stop offset="1" stop-color="#be185d"/>
        </linearGradient>
      </defs>
      <!-- Uzun Saç Arka -->
      <path d="M26 40 C24 65, 27 82, 33 90 L67 90 C73 82, 76 65, 74 40 Z" fill="#1c1917"/>
      <!-- Gövde -->
      <path d="M24 96 C24 76, 36 72, 50 72 C64 72, 76 76, 76 96 Z" fill="#7c2d12"/>
      <!-- Boyun & Kolye -->
      <rect x="45" y="58" width="10" height="15" rx="4" fill="#c68a4c"/>
      <circle cx="50" cy="72" r="3" fill="#facc15"/>
      <!-- Yüz -->
      <ellipse cx="50" cy="46" rx="17.5" ry="20" fill="#d99b5b"/>
      <!-- Küpeler -->
      <circle cx="32" cy="49" r="2.8" fill="#facc15"/>
      <circle cx="68" cy="49" r="2.8" fill="#facc15"/>
      <!-- Saç Ön (Dalgalı) -->
      <path d="M30 42 C30 24, 40 18, 50 18 C62 18, 70 24, 70 42 C66 32, 58 30, 48 30 C38 30, 33 34, 30 42 Z" fill="#1c1917"/>
      <path d="M31 38 C28 50, 27 65, 30 72 C33 64, 34 50, 33 38 Z" fill="#1c1917"/>
      <path d="M69 38 C72 50, 73 65, 70 72 C67 64, 66 50, 67 38 Z" fill="#1c1917"/>
      <!-- Kaşlar & Gözler -->
      <path d="M39 37 Q43 34 46 37" stroke="#1c1917" stroke-width="2" stroke-linecap="round"/>
      <path d="M54 37 Q57 34 61 37" stroke="#1c1917" stroke-width="2" stroke-linecap="round"/>
      <circle cx="43" cy="42.5" r="2.2" fill="#1c1917"/>
      <circle cx="57" cy="42.5" r="2.2" fill="#1c1917"/>
      <!-- Kirpikler -->
      <path d="M41 40 L39 38" stroke="#1c1917" stroke-width="1.2"/>
      <path d="M59 40 L61 38" stroke="#1c1917" stroke-width="1.2"/>
      <path d="M50 45 L49 48.5 L51 48.5" stroke="#b07538" stroke-width="1.4" stroke-linecap="round"/>
      <!-- Dudaklar (Gül Kurusu) -->
      <path d="M44 55 Q50 60 56 55" stroke="#be185d" stroke-width="2.5" stroke-linecap="round"/>
    </svg>`
  },
  {
    id: 'preset:female-2',
    name: 'Karakter 7',
    gender: 'female',
    bgColor: '#2563eb',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="50" fill="url(#bg-f2)"/>
      <defs>
        <linearGradient id="bg-f2" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop stop-color="#60a5fa"/>
          <stop offset="1" stop-color="#1d4ed8"/>
        </linearGradient>
      </defs>
      <!-- At Kuyruğu Arka -->
      <path d="M64 26 C75 22, 85 35, 78 55 C74 45, 70 36, 64 26 Z" fill="#facc15"/>
      <circle cx="65" cy="27" r="4" fill="#3b82f6"/>
      <!-- Gövde -->
      <path d="M24 96 C24 76, 36 72, 50 72 C64 72, 76 76, 76 96 Z" fill="#6366f1"/>
      <!-- Boyun -->
      <rect x="45" y="58" width="10" height="15" rx="4" fill="#fcd0a1"/>
      <!-- Yüz -->
      <ellipse cx="50" cy="46" rx="17.5" ry="20" fill="#ffe0bd"/>
      <!-- Saç Ön -->
      <path d="M30 42 C29 25, 40 18, 54 18 C67 18, 70 26, 70 42 C67 33, 56 29, 44 29 C34 29, 31 36, 30 42 Z" fill="#facc15"/>
      <!-- Kaşlar & Gözler (Mavi) -->
      <path d="M39 37 Q43 34 46 37" stroke="#ca8a04" stroke-width="2" stroke-linecap="round"/>
      <path d="M54 37 Q57 34 61 37" stroke="#ca8a04" stroke-width="2" stroke-linecap="round"/>
      <circle cx="43" cy="42.5" r="2.2" fill="#0284c7"/>
      <circle cx="57" cy="42.5" r="2.2" fill="#0284c7"/>
      <path d="M41 40 L39 38" stroke="#ca8a04" stroke-width="1.2"/>
      <path d="M59 40 L61 38" stroke="#ca8a04" stroke-width="1.2"/>
      <path d="M50 45 L49 48.5 L51 48.5" stroke="#e0a87a" stroke-width="1.4" stroke-linecap="round"/>
      <path d="M45 55 Q50 59 55 55" stroke="#e11d48" stroke-width="2.2" stroke-linecap="round"/>
    </svg>`
  },
  {
    id: 'preset:female-3',
    name: 'Karakter 8',
    gender: 'female',
    bgColor: '#d97706',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="50" fill="url(#bg-f3)"/>
      <defs>
        <linearGradient id="bg-f3" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop stop-color="#fbbf24"/>
          <stop offset="1" stop-color="#b45309"/>
        </linearGradient>
      </defs>
      <!-- Hacimli Saç Arka -->
      <circle cx="50" cy="38" r="27" fill="#1c1917"/>
      <circle cx="28" cy="40" r="9" fill="#1c1917"/>
      <circle cx="72" cy="40" r="9" fill="#1c1917"/>
      <circle cx="50" cy="18" r="11" fill="#1c1917"/>
      <!-- Gövde -->
      <path d="M24 96 C24 76, 36 72, 50 72 C64 72, 76 76, 76 96 Z" fill="#0284c7"/>
      <!-- Boyun -->
      <rect x="44" y="58" width="12" height="15" rx="4" fill="#4a2e1b"/>
      <!-- Yüz -->
      <ellipse cx="50" cy="48" rx="18" ry="20" fill="#5c3a21"/>
      <!-- Büyük Halka Küpeler -->
      <circle cx="30" cy="52" r="5" stroke="#fbbf24" stroke-width="2" fill="none"/>
      <circle cx="70" cy="52" r="5" stroke="#fbbf24" stroke-width="2" fill="none"/>
      <!-- Kaşlar & Gözler -->
      <path d="M39 39 Q43 36 46 39" stroke="#1c1917" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M54 39 Q57 36 61 39" stroke="#1c1917" stroke-width="2.2" stroke-linecap="round"/>
      <circle cx="43" cy="44.5" r="2.2" fill="#1c1917"/>
      <circle cx="57" cy="44.5" r="2.2" fill="#1c1917"/>
      <path d="M47 51 Q50 52 53 51" stroke="#3d2314" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M44 58 Q50 63 56 58" stroke="#be123c" stroke-width="2.5" stroke-linecap="round"/>
    </svg>`
  },
  {
    id: 'preset:female-4',
    name: 'Karakter 9',
    gender: 'female',
    bgColor: '#e11d48',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="50" fill="url(#bg-f4)"/>
      <defs>
        <linearGradient id="bg-f4" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop stop-color="#f43f5e"/>
          <stop offset="1" stop-color="#be123c"/>
        </linearGradient>
      </defs>
      <!-- Küt Saç Arka -->
      <path d="M27 38 L27 68 C27 75, 73 75, 73 68 L73 38 Z" fill="#171717"/>
      <!-- Gövde -->
      <path d="M24 96 C24 76, 36 72, 50 72 C64 72, 76 76, 76 96 Z" fill="#1e1b4b"/>
      <!-- Boyun -->
      <rect x="45" y="58" width="10" height="15" rx="4" fill="#e8be92"/>
      <!-- Yüz -->
      <ellipse cx="50" cy="46" rx="17.5" ry="20" fill="#f8cfab"/>
      <!-- Küt Saç Ön & Kakül -->
      <path d="M28 42 C28 24, 38 18, 50 18 C62 18, 72 24, 72 42 C67 34, 58 33, 50 33 C40 33, 33 35, 28 42 Z" fill="#171717"/>
      <path d="M28 42 L28 65 Q33 67 34 50 Z" fill="#171717"/>
      <path d="M72 42 L72 65 Q67 67 66 50 Z" fill="#171717"/>
      <!-- Kaşlar & Gözler -->
      <path d="M39 37 Q43 34 46 37" stroke="#171717" stroke-width="2" stroke-linecap="round"/>
      <path d="M54 37 Q57 34 61 37" stroke="#171717" stroke-width="2" stroke-linecap="round"/>
      <circle cx="43" cy="42" r="2" fill="#171717"/>
      <circle cx="57" cy="42" r="2" fill="#171717"/>
      <path d="M50 45 L49 48 L51 48" stroke="#d49f6f" stroke-width="1.4" stroke-linecap="round"/>
      <path d="M45 55 Q50 59 55 55" stroke="#dc2626" stroke-width="2.2" stroke-linecap="round"/>
    </svg>`
  },
  {
    id: 'preset:female-5',
    name: 'Karakter 10',
    gender: 'female',
    bgColor: '#0d9488',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="50" fill="url(#bg-f5)"/>
      <defs>
        <linearGradient id="bg-f5" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop stop-color="#2dd4bf"/>
          <stop offset="1" stop-color="#0f766e"/>
        </linearGradient>
      </defs>
      <!-- Dalgalı Kızıl Saç Arka -->
      <path d="M24 40 C22 65, 25 85, 33 92 L67 92 C75 85, 78 65, 76 40 Z" fill="#b91c1c"/>
      <!-- Gövde -->
      <path d="M24 96 C24 76, 36 72, 50 72 C64 72, 76 76, 76 96 Z" fill="#4338ca"/>
      <!-- Boyun -->
      <rect x="45" y="58" width="10" height="15" rx="4" fill="#fad7ba"/>
      <!-- Yüz -->
      <ellipse cx="50" cy="46" rx="17.5" ry="20" fill="#ffe4cf"/>
      <!-- Saç Ön -->
      <path d="M28 42 C27 24, 38 18, 50 18 C64 18, 73 24, 72 42 C67 33, 58 30, 48 30 C38 30, 31 35, 28 42 Z" fill="#b91c1c"/>
      <!-- Kaşlar & Yeşil Gözler -->
      <path d="M39 37 Q43 34 46 37" stroke="#b91c1c" stroke-width="2" stroke-linecap="round"/>
      <path d="M54 37 Q57 34 61 37" stroke="#b91c1c" stroke-width="2" stroke-linecap="round"/>
      <circle cx="43" cy="42.5" r="2.2" fill="#16a34a"/>
      <circle cx="57" cy="42.5" r="2.2" fill="#16a34a"/>
      <!-- Çiller -->
      <circle cx="41" cy="47" r="0.9" fill="#ea580c"/>
      <circle cx="44" cy="48" r="0.9" fill="#ea580c"/>
      <circle cx="56" cy="48" r="0.9" fill="#ea580c"/>
      <circle cx="59" cy="47" r="0.9" fill="#ea580c"/>
      <path d="M50 45 L49 48 L51 48" stroke="#e0a37e" stroke-width="1.4" stroke-linecap="round"/>
      <path d="M45 55 Q50 59 55 55" stroke="#e11d48" stroke-width="2.2" stroke-linecap="round"/>
    </svg>`
  },
  {
    id: 'preset:female-6',
    name: 'Karakter 12',
    gender: 'female',
    bgColor: '#7c3aed',
    svg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="50" fill="url(#bg-f6)"/>
      <defs>
        <linearGradient id="bg-f6" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop stop-color="#8b5cf6"/>
          <stop offset="1" stop-color="#6d28d9"/>
        </linearGradient>
      </defs>
      <!-- Saç Topuzu -->
      <circle cx="50" cy="20" r="11" fill="#292524"/>
      <!-- Gövde / Şık Ceket -->
      <path d="M24 96 C24 76, 36 72, 50 72 C64 72, 76 76, 76 96 Z" fill="#1e1b4b"/>
      <path d="M44 72 L50 82 L56 72 Z" fill="#f8fafc"/>
      <!-- Boyun -->
      <rect x="45" y="58" width="10" height="15" rx="4" fill="#d49f6f"/>
      <!-- Yüz -->
      <ellipse cx="50" cy="46" rx="17.5" ry="20" fill="#e8b584"/>
      <!-- Küpeler (Gümüş Halka) -->
      <circle cx="32" cy="48" r="3" stroke="#e2e8f0" stroke-width="1.5" fill="none"/>
      <circle cx="68" cy="48" r="3" stroke="#e2e8f0" stroke-width="1.5" fill="none"/>
      <!-- Saç Ön (Toplu Şık) -->
      <path d="M30 42 C30 25, 40 22, 50 22 C62 22, 70 25, 70 42 C66 32, 58 31, 50 31 C40 31, 33 33, 30 42 Z" fill="#292524"/>
      <!-- Gözlük -->
      <rect x="37" y="39" width="11" height="8" rx="3" fill="rgba(255,255,255,0.3)" stroke="#1e293b" stroke-width="1.8"/>
      <rect x="52" y="39" width="11" height="8" rx="3" fill="rgba(255,255,255,0.3)" stroke="#1e293b" stroke-width="1.8"/>
      <line x1="48" y1="42" x2="52" y2="42" stroke="#1e293b" stroke-width="1.8"/>
      <!-- Kaşlar & Gözler -->
      <path d="M39 36 Q43 33 46 36" stroke="#292524" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M54 36 Q57 33 61 36" stroke="#292524" stroke-width="1.8" stroke-linecap="round"/>
      <circle cx="42.5" cy="43" r="1.8" fill="#171717"/>
      <circle cx="57.5" cy="43" r="1.8" fill="#171717"/>
      <path d="M50 45 L49 48.5 L51 48.5" stroke="#b07538" stroke-width="1.4" stroke-linecap="round"/>
      <!-- Dudaklar -->
      <path d="M44 55 Q50 59 56 55" stroke="#9333ea" stroke-width="2.2" stroke-linecap="round"/>
    </svg>`
  }
];

export function isPresetAvatar(url?: string | null): boolean {
  return !!url && url.startsWith('preset:');
}

export function getPresetAvatar(id?: string | null): AvatarPreset | undefined {
  if (!id) return undefined;
  return PRESET_AVATARS.find(a => a.id === id);
}

export function getPresetSvg(id?: string | null): string {
  const preset = getPresetAvatar(id);
  return preset ? preset.svg : '';
}
