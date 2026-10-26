// Données de référence de la campagne Hadj 2027 (1448 H)

export const REGIONS = ["Conakry", "Boké", "Kindia", "Mamou", "Labé", "Faranah", "Kankan", "N'Zérékoré", "Diaspora"] as const;

export const HADJ_DATE = "2027-05-15T00:00:00Z";
export const OPENING_DATE = "2027-02-01T00:00:00Z";
export const FIRST_FLIGHT = "2027-04-19T00:00:00Z";

export type Package = {
  id: string;
  name: string;
  nameAr: string;
  price: number;
  days: number;
  hotel: string;
  features: string[];
  highlight?: boolean;
};

export const PACKAGES: Package[] = [
  {
    id: "standard",
    name: "Standard",
    nameAr: "عادي",
    price: 58_500_000,
    days: 30,
    hotel: "Hôtel 3★ à 1,5 km du Haram",
    features: ["Vol aller-retour Conakry – Djeddah", "Visa Hadj", "Tente climatisée à Mina", "Repas 2 fois par jour", "Encadreur pour 45 pèlerins"],
  },
  {
    id: "confort",
    name: "Confort",
    nameAr: "مريح",
    price: 72_000_000,
    days: 28,
    hotel: "Hôtel 4★ à 600 m du Haram",
    features: ["Tout le package Standard", "Pension complète", "Bus climatisés dédiés", "Ziyarat à Médine", "Encadreur pour 30 pèlerins"],
    highlight: true,
  },
  {
    id: "premium",
    name: "Premium",
    nameAr: "ممتاز",
    price: 95_000_000,
    days: 25,
    hotel: "Hôtel 5★ face au Haram",
    features: ["Tout le package Confort", "Tente VIP à Mina et Arafat", "Accompagnement médical renforcé", "Chambres de 2", "Encadreur pour 15 pèlerins"],
  },
];

export const pkgById = (id?: string | null) => PACKAGES.find((p) => p.id === id);

export const STATUS: Record<string, { label: string; labelAr: string; tone: string }> = {
  brouillon: { label: "Brouillon", labelAr: "مسودة", tone: "slate" },
  soumis: { label: "Soumis", labelAr: "مُقدَّم", tone: "blue" },
  verification: { label: "En vérification", labelAr: "قيد التحقق", tone: "amber" },
  valide: { label: "Validé", labelAr: "مقبول", tone: "emerald" },
  rejete: { label: "À corriger", labelAr: "يحتاج تصحيح", tone: "red" },
  complet: { label: "Complet", labelAr: "مكتمل", tone: "emerald" },
};

export const HEALTH_STATUS: Record<string, string> = {
  a_remplir: "Fiche à remplir",
  soumis: "En attente du médecin",
  apte: "Apte au voyage",
  inapte: "Non apte (avis médical)",
  a_risque: "Apte – suivi renforcé",
};

export const PAY_METHODS: Record<string, { label: string; color: string; hint: string }> = {
  orange: { label: "Orange Money", color: "#ff7900", hint: "Validez sur votre téléphone avec votre code secret (#144#)." },
  mtn: { label: "MTN MoMo", color: "#ffcc00", hint: "Validez la demande reçue sur votre téléphone (*440#)." },
  banque: { label: "Virement / carte", color: "#0f766e", hint: "Paiement sécurisé par carte ou virement (diaspora)." },
};

export const NEWS = [
  { date: "2026-10-20", title: "Calendrier prévisionnel du Hadj 2027 publié", body: "Le Hadj 1448 H est attendu vers le 15 mai 2027, sous réserve de l'observation lunaire. Les inscriptions ouvriront le 1er février 2027." },
  { date: "2026-10-12", title: "Vaccin contre la méningite : obligatoire", body: "Tout pèlerin doit présenter un certificat de vaccination ACYW135 de moins de 3 ans. Des centres agréés sont ouverts dans les 8 régions." },
  { date: "2026-10-05", title: "Paiement par Mobile Money", body: "Les frais pourront être réglés en 3 tranches via Orange Money, MTN MoMo ou virement bancaire. Chaque paiement donne lieu à un reçu avec QR code." },
];

export const TIMELINE = [
  { date: "1 févr. 2027", label: "Ouverture des inscriptions", icon: "🚀" },
  { date: "9 avr. 2027", label: "Clôture des inscriptions et paiements", icon: "💳" },
  { date: "19 avr. 2027", label: "Premiers vols vers Djeddah", icon: "✈️" },
  { date: "15 mai 2027", label: "Journée de Arafat (date approx.)", icon: "🕋" },
  { date: "20 mai 2027", label: "Premiers vols retour", icon: "🏠" },
];

export const FAQ = [
  { q: "Qui peut s'inscrire ?", a: "Tout musulman de nationalité guinéenne, en Guinée ou dans la diaspora, muni d'un passeport valide au moins 6 mois après la date de retour." },
  { q: "Je n'ai pas de smartphone, comment faire ?", a: "Rendez-vous à la préfecture la plus proche : un agent vous inscrit sur place (mode assisté) et vous recevez toutes les alertes par SMS." },
  { q: "Puis-je payer en plusieurs fois ?", a: "Oui, en 3 tranches maximum via Orange Money, MTN MoMo ou virement. Un proche peut aussi payer pour vous avec votre numéro de dossier." },
  { q: "Que se passe-t-il si mon dossier est rejeté ?", a: "Vous recevez un SMS avec le motif. Il suffit de corriger la pièce concernée, sans tout ressaisir." },
  { q: "Quels vaccins sont obligatoires ?", a: "Le vaccin contre la méningite (ACYW135) est obligatoire. Une visite médicale valide votre aptitude au voyage." },
];

export const RITES = [
  { day: "8 Dhou al-Hijja", title: "Yawm at-Tarwiya", place: "Mina", steps: ["Revêtir l'ihram depuis l'hôtel", "Formuler l'intention (niyya) du Hadj", "Départ en bus vers Mina après Fajr", "Prières à Mina, nuit sur place"] },
  { day: "9 Dhou al-Hijja", title: "Journée de Arafat", place: "Arafat", steps: ["Départ vers Arafat après le lever du soleil", "Station (wuquf) jusqu'au coucher du soleil", "Invocations et prières", "Après le coucher du soleil : départ vers Muzdalifa"] },
  { day: "9–10 Dhou al-Hijja", title: "Nuit à Muzdalifa", place: "Muzdalifa", steps: ["Prières de Maghrib et Isha regroupées", "Ramasser 49 à 70 petits cailloux", "Repos à la belle étoile", "Départ vers Mina après Fajr"] },
  { day: "10 Dhou al-Hijja", title: "Jour de l'Aïd", place: "Mina · La Mecque", steps: ["Lapidation de la grande stèle (Jamarat al-Aqaba)", "Sacrifice (bon de sacrifice remis par l'agence)", "Rasage ou coupe des cheveux", "Tawaf al-Ifada et Sa'y à La Mecque"] },
  { day: "11–12 Dhou al-Hijja", title: "Jours de Tachriq", place: "Mina", steps: ["Lapidation des 3 stèles chaque jour après midi", "Nuits à Mina", "Restez avec votre groupe et votre encadreur"] },
  { day: "Avant le départ", title: "Tawaf d'adieu", place: "La Mecque", steps: ["Tawaf al-Wada", "Retour à l'hôtel et préparation des bagages", "Départ vers Médine ou l'aéroport selon programme"] },
];

export const PLACES = [
  { id: "haram", name: "Masjid al-Haram", city: "La Mecque", x: 120, y: 210, info: "La Grande Mosquée et la Kaaba. Lieu du Tawaf et du Sa'y." },
  { id: "mina", name: "Mina", city: "La Mecque", x: 230, y: 180, info: "Ville de tentes. Tente du groupe guinéen : secteur 5, rue 512." },
  { id: "jamarat", name: "Jamarat", city: "Mina", x: 205, y: 205, info: "Pont des stèles. Suivez l'horaire de lapidation de votre groupe." },
  { id: "muzdalifa", name: "Muzdalifa", city: "", x: 290, y: 165, info: "Nuit du 9 au 10. Ramassage des cailloux." },
  { id: "arafat", name: "Mont Arafat", city: "", x: 380, y: 140, info: "Station du 9 Dhou al-Hijja. Point de ralliement : panneau GN-12." },
  { id: "clinique", name: "Mission médicale guinéenne", city: "Aziziya", x: 175, y: 245, info: "Ouverte 24 h/24. Tél. +966 5 00 00 00 00." },
];

export const PROGRESS_STEPS = [
  { key: "compte", label: "Créer son compte", sub: "téléphone + code OTP", icon: "📱" },
  { key: "dossier", label: "Remplir le dossier", sub: "passeport, photo", icon: "📝" },
  { key: "validation", label: "Dossier validé", sub: "contrôle des pièces", icon: "✅" },
  { key: "paiement", label: "Payer par tranches", sub: "Orange Money, MoMo", icon: "💳" },
  { key: "sante", label: "Visite médicale", sub: "vaccin méningite", icon: "🩺" },
  { key: "badge", label: "Recevoir son badge", sub: "QR code, vol, hôtel", icon: "🪪" },
  { key: "hadj", label: "Hadj accompagné", sub: "rites, alertes, SOS", icon: "🕋" },
  { key: "retour", label: "Retour et avis", sub: "note de satisfaction", icon: "⭐" },
];

export const ROLES: Record<string, { label: string; home: string }> = {
  pelerin: { label: "Pèlerin", home: "/espace" },
  agent: { label: "Agent préfectoral", home: "/agent" },
  agence: { label: "Agence agréée", home: "/agence" },
  encadreur: { label: "Encadreur", home: "/encadreur" },
  medecin: { label: "Médecin", home: "/medecin" },
  admin: { label: "Administrateur", home: "/admin" },
};

export const DEMO_ACCOUNTS = [
  { phone: "620000001", role: "admin" },
  { phone: "620000002", role: "agent" },
  { phone: "620000003", role: "medecin" },
  { phone: "620000004", role: "encadreur" },
  { phone: "620000005", role: "agence" },
];
