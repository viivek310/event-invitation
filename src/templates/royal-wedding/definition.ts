import type { TemplateDefinition } from "../types";
import { royalWeddingDemo } from "./content.ts";

// Public availability remains planned while sections are reviewed locally.
export const royalWeddingDefinition: TemplateDefinition = {
  id: "royal-wedding",
  name: "Royal Wedding",
  description:
    "Palace-inspired details, rich burgundy, and a ceremonial opening. A new invitation, coming to the collection.",
  category: "Wedding",
  schemaVersion: 1,
  status: "planned",
  palette: ["#501B2B", "#D6BC83", "#F7F0E2"],
  sections: [
    "Sealed envelope",
    "Ganeshji animation",
    "Main invitation",
    "Date reveal & confetti",
    "Events",
    "RSVP",
    "Invitee closing",
  ],
  demo: royalWeddingDemo,
};
