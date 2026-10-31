// Durations live outside rendering so the template's motion can be tuned together.
export const royalCreator = {
  name: "Vivek Vasant",
  phone: "+91 9106974854",
  telephone: "tel:+919106974854",
} as const;

export const royalMotion = {
  entrance: 800,
  stagger: 110,
  confetti: 2000,
  dateRollScreens: 0.9,
  dateHoldScreens: 1.5,
} as const;

export const royalEvents = {
  holdScreens: 0.75,
  transitionScreens: 0.45,
  exitScreens: 0.35,
  mobileScrub: 0.4,
  desktopScrub: 0.6,
  minimumImageHeight: 120,
  maximumImageHeight: 360,
  accents: {
    welcome: { background: "#401522", glow: "#7f4143", accent: "#D6BC83" },
    mehendi: { background: "#471d30", glow: "#845363", accent: "#DDB5AE" },
    haldi: { background: "#491f20", glow: "#89603b", accent: "#E0BE78" },
    sangeet: { background: "#33172c", glow: "#634264", accent: "#D2B3D2" },
    wedding: { background: "#501B2B", glow: "#815347", accent: "#D6BC83" },
    reception: { background: "#361723", glow: "#76604d", accent: "#E5CFA4" },
  },
} as const;

export const palaceArtwork = {
  hero: {
    src: "/templates/royal-wedding/palace/hero.webp",
    mobile: "/templates/royal-wedding/palace/hero-mobile.webp",
    position: "50% 50%",
  },
  welcome: {
    src: "/templates/royal-wedding/palace/welcome.webp",
    mobile: "/templates/royal-wedding/palace/welcome-mobile.webp",
    position: "50% 50%",
  },
  mehendi: {
    src: "/templates/royal-wedding/palace/mehendi.webp",
    mobile: "/templates/royal-wedding/palace/mehendi-mobile.webp",
    position: "50% 55%",
  },
  haldi: {
    src: "/templates/royal-wedding/palace/haldi.webp",
    mobile: "/templates/royal-wedding/palace/haldi-mobile.webp",
    position: "50% 55%",
  },
  sangeet: {
    src: "/templates/royal-wedding/palace/sangeet.webp",
    mobile: "/templates/royal-wedding/palace/sangeet-mobile.webp",
    position: "50% 45%",
  },
  wedding: {
    src: "/templates/royal-wedding/palace/wedding.webp",
    mobile: "/templates/royal-wedding/palace/wedding-mobile.webp",
    position: "50% 55%",
  },
  reception: {
    src: "/templates/royal-wedding/palace/reception.webp",
    mobile: "/templates/royal-wedding/palace/reception-mobile.webp",
    position: "50% 50%",
  },
} as const;
