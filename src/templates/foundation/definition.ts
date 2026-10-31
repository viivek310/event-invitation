import type { TemplateDefinition } from "../types";

export const foundationDefinition: TemplateDefinition = {
  id: "foundation-preview",
  name: "Classic Invitation",
  description:
    "A quiet, timeless invitation. Explore the complete sample with fictional wedding details.",
  category: "Wedding",
  schemaVersion: 1,
  status: "preview",
  palette: ["#f6f1e7", "#536047", "#b89a65"],
  thumbnail: "/templates/foundation-preview/thumbnail.svg",
  sections: ["Invitation", "Date & venue", "Family sign-off"],
  demo: {
    partnerOne: "Aarav",
    partnerTwo: "Meera",
    message:
      "Together with our families, we invite you to celebrate our wedding. Your presence will make our day all the more special.",
    weddingDate: "2027-02-21",
    venue: "The Garden Courtyard, Jaipur",
    family: "The Sharma & Kapoor families",
  },
};
