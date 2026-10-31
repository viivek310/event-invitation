// Replace artwork here later; keep the flap and pocket on the same 9:16 canvas.
// Burgundy layers have a blank seal; original rose-gold PNGs remain for rollback.
export const openingConfig = {
  assets: {
    flap: "/templates/royal-wedding/opening/envelope-flap-burgundy-v1.png",
    pocket: "/templates/royal-wedding/opening/envelope-pocket-burgundy-v1.png",
    ganesh: "/templates/royal-wedding/opening/ganeshji.png",
  },
  seal: { x: 50, y: 51.5, width: 29, height: 16.5 },
  colors: {
    background: "#501B2B",
    backgroundDeep: "#2A0D17",
    card: "#501B2B",
    gold: "#D6BC83",
    text: "#F7F0E2",
  },
  duration: {
    flapHalf: 500,
    emerge: 1050,
    expand: 1250,
    ganeshReveal: 650,
    ganeshHold: 850,
    ganeshMove: 1300,
    blessingRibbon: 350,
    blessingWord: 450,
    blessingStagger: 80,
  },
} as const;

export const blessingWords = ["॥", "શ્રી", "ગણેશાય", "નમઃ", "॥"] as const;
export const gujaratiBlessing = blessingWords.join(" ");

export type OpeningPhase =
  | "loading"
  | "ready"
  | "flap"
  | "emerging"
  | "expanding"
  | "ganesh"
  | "complete"
  | "error";
export const phaseLabels: Record<OpeningPhase, string> = {
  loading: "Preparing the artwork",
  ready: "Ready to open",
  flap: "Opening the envelope",
  emerging: "Revealing the card",
  expanding: "Opening the card",
  ganesh: "Ganeshji introduction",
  complete: "Opening sequence complete",
  error: "Artwork could not load",
};
