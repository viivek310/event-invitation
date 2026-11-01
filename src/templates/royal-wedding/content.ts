import type { InvitationContent } from "../types";

export type CeremonyKind =
  | "welcome"
  | "mehendi"
  | "haldi"
  | "sangeet"
  | "wedding"
  | "reception";
export type RoyalCeremony = {
  id: CeremonyKind;
  name: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  address: string;
  mapUrl: string;
};
export type RoyalWeddingContent = InvitationContent & {
  artworkOverrides?: Partial<Record<CeremonyKind | "hero", string>>;
  invitationLead: string;
  partnerOneParents: string;
  partnerTwoParents: string;
  dateMessage: string;
  weddingStartsAt: string;
  eventsMessage: string;
  ceremonies: readonly RoyalCeremony[];
  invitee: {
    introduction: string;
    elder: string;
    hosts: readonly string[];
    signOff: string;
  };
};

const mapUrl =
  "https://www.google.com/maps/search/?api=1&query=Jaipur%2C%20Rajasthan";
export const royalWeddingDemo: RoyalWeddingContent = {
  partnerOne: "Aarav",
  partnerTwo: "Meera",
  invitationLead: "Together with the blessings of our families",
  partnerOneParents: "Son of Kavita & Rajesh Sharma",
  partnerTwoParents: "Daughter of Sunita & Vikram Kapoor",
  message:
    "With hearts full of love, we invite you to witness the beginning of our forever. Join us as two families become one, and a beautiful new chapter unfolds.",
  weddingDate: "2027-02-21",
  weddingStartsAt: "2027-02-21T16:30:00+05:30",
  venue: "The Rajvilas Courtyard, Jaipur",
  family: "The Sharma & Kapoor families",
  dateMessage: "The Wedding",
  eventsMessage:
    "A little colour, a little music, and a lifetime of memories. Come celebrate every beautiful beginning with us.",
  ceremonies: [
    {
      id: "welcome",
      name: "A Royal Welcome",
      description: "An evening of warm embraces & new beginnings",
      date: "2027-02-19",
      time: "6:00 PM onwards",
      venue: "The Lotus Courtyard",
      address: "Palace Gardens · Jaipur, Rajasthan",
    },
    {
      id: "mehendi",
      name: "Mehendi",
      description: "Love written in henna, laughter in the air",
      date: "2027-02-20",
      time: "11:00 AM onwards",
      venue: "The Jasmine Pavilion",
      address: "Palace Gardens · Jaipur, Rajasthan",
    },
    {
      id: "haldi",
      name: "Haldi",
      description: "A little sunshine, a whole lot of happiness",
      date: "2027-02-20",
      time: "3:00 PM onwards",
      venue: "The Marigold Terrace",
      address: "Palace Gardens · Jaipur, Rajasthan",
    },
    {
      id: "sangeet",
      name: "Sangeet",
      description: "An evening where our hearts find their rhythm",
      date: "2027-02-20",
      time: "7:00 PM onwards",
      venue: "The Sheesh Mahal",
      address: "Palace Gardens · Jaipur, Rajasthan",
    },
    {
      id: "wedding",
      name: "The Wedding",
      description: "Seven vows. Two hearts. One forever.",
      date: "2027-02-21",
      time: "4:30 PM · Wedding ceremony",
      venue: "The Rajvilas Courtyard",
      address: "Palace Gardens · Jaipur, Rajasthan",
    },
    {
      id: "reception",
      name: "Reception",
      description: "A toast to love and everything that follows",
      date: "2027-02-21",
      time: "7:30 PM onwards",
      venue: "The Moonlight Gardens",
      address: "Palace Gardens · Jaipur, Rajasthan",
    },
  ].map((event) => ({ ...event, id: event.id as CeremonyKind, mapUrl })),
  invitee: {
    introduction:
      "With heartfelt warmth, you are cordially invited by",
    elder: "Mrs. Savitri Devi Sharma",
    hosts: ["Kavita & Rajesh Sharma", "Sunita & Vikram Kapoor"],
    signOff: "And the Sharma & Kapoor families",
  },
};

// Date-only strings are intentionally formatted in UTC, never shifted by a guest's timezone.
export function formatRoyalDate(
  date: string,
  style: "full" | "short" = "full",
) {
  return new Intl.DateTimeFormat(
    "en-GB",
    style === "full"
      ? {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
          timeZone: "UTC",
        }
      : { day: "numeric", month: "long", timeZone: "UTC" },
  ).format(new Date(`${date}T12:00:00Z`));
}
