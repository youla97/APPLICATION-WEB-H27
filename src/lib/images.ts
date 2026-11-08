// Images du site et leurs crédits (licences libres Wikimedia Commons ; logos issus des kits officiels)

export type SiteImage = {
  src: string;
  alt: string;
  caption: string;
  author: string;
  license: string;
  source: string;
};

export const IMAGES = {
  kaaba: {
    src: "/images/kaaba.webp",
    alt: "Pèlerins autour de la Kaaba à La Mecque pendant le Hadj",
    caption: "La Kaaba, Masjid al-Haram, La Mecque",
    author: "Adli Wahid",
    license: "CC BY-SA 4.0",
    source: "https://commons.wikimedia.org/wiki/File:The_Kaaba_during_Hajj_(edited).jpg",
  },
  mosquee: {
    src: "/images/mosquee-conakry.webp",
    alt: "Vue aérienne de la Grande Mosquée Fayçal de Conakry",
    caption: "Grande Mosquée Fayçal, Conakry",
    author: "Mohamed Finando",
    license: "CC BY 4.0",
    source: "https://commons.wikimedia.org/wiki/File:Grande_Mosqu%C3%A9e_Fay%C3%A7al_de_Conakry_1.jpg",
  },
  conakryEid: {
    src: "/images/conakry-eid.webp",
    alt: "Fidèles rassemblés dans la cour de la Grande Mosquée de Conakry avant la prière de l'Aïd",
    caption: "Prière de l'Aïd à la Grande Mosquée de Conakry",
    author: "Lamine Kane",
    license: "CC0",
    source: "https://commons.wikimedia.org/wiki/File:Dans_la_cour_de_la_grande_mosqu%C3%A9e_de_Conakry_avant_la_pri%C3%A8re_de_l%E2%80%99eid.jpg",
  },
  arafat: {
    src: "/images/arafat.webp",
    alt: "Pèlerins vêtus de blanc couvrant le mont Arafat",
    caption: "Le mont Arafat, 9 Dhou al-Hijja",
    author: "Al Jazeera English",
    license: "CC BY-SA 2.0",
    source: "https://commons.wikimedia.org/wiki/File:Pilgrims_cover_Arafat%27s_roads,_plains_and_mountain_-_Flickr_-_Al_Jazeera_English.jpg",
  },
  armoiries: {
    src: "/images/armoiries.webp",
    alt: "Armoiries de la République de Guinée",
    caption: "Armoiries de la République de Guinée",
    author: "Turn685, d'après les armoiries officielles",
    license: "CC BY-SA 3.0",
    source: "https://commons.wikimedia.org/wiki/File:Coat_of_Arms_of_Guinea.svg",
  },
  simandou: {
    src: "/images/simandou-2040.webp",
    alt: "Logo du Programme Simandou 2040 — Un pont vers la prospérité",
    caption: "Logo du Programme Simandou 2040",
    author: "Programme Simandou 2040 (kit média officiel)",
    license: "Usage institutionnel",
    source: "https://www.simandou2040.gn/espace-presse",
  },
} satisfies Record<string, SiteImage>;
