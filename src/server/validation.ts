import { z } from "zod";
import { parsePhoneNumberFromString } from "libphonenumber-js";

export const phoneSchema = z.string().max(40).transform(value => parsePhoneNumberFromString(value, "IN"))
  .refine(value => value?.isValid(), "Enter a valid phone number with country code.")
  .transform(value => value!.number.toString());
export const passwordSchema = z.string().min(12).max(128);
export const text = (max: number) => z.string().trim().min(1).max(max);
export const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
});
export const sectionIds = ["opening", "ganesha", "invitation", "date", "events", "rsvp", "invitee"] as const;
export const sectionsSchema = z.array(z.enum(sectionIds)).min(1).refine(values => new Set(values).size === values.length);
const safeMap = z.url().refine(value => {
  const url = new URL(value);
  return url.protocol === "https:" && ["www.google.com", "maps.google.com", "maps.app.goo.gl"].includes(url.hostname);
});
export const royalContentSchema = z.object({
  artworkOverrides: z.partialRecord(z.enum(["hero","welcome","mehendi","haldi","sangeet","wedding","reception"]), z.string().regex(/^\/api\/media\/[a-z0-9]+$/)).optional(),
  partnerOne: text(100), partnerTwo: text(100), message: text(1000), weddingDate: dateOnly,
  venue: text(250), family: text(200), invitationLead: text(200),
  partnerOneParents: text(200), partnerTwoParents: text(200), dateMessage: text(100),
  weddingStartsAt: z.iso.datetime({ offset: true }), eventsMessage: text(400),
  ceremonies: z.array(z.object({
    id: z.enum(["welcome", "mehendi", "haldi", "sangeet", "wedding", "reception"]),
    name: text(100), description: text(250), date: dateOnly, time: text(100), venue: text(200), address: text(300), mapUrl: safeMap,
  })).max(6).refine(values => new Set(values.map(v => v.id)).size === values.length),
  invitee: z.object({ introduction: text(200), elder: text(100), hosts: z.array(text(100)).min(1).max(6), signOff: text(200) }),
});
export const rsvpSchema = z.object({
  name: text(120), phone: phoneSchema, email: z.union([z.email().max(254), z.literal("")]).optional(),
  attending: z.boolean(), partySize: z.number().int().min(0).max(100), ceremonies: z.array(text(40)).max(6),
  dietary: z.string().trim().max(500).optional(), accommodation: z.string().trim().max(250).optional(),
});
export function normalizeSlug(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 90).replace(/-$/g, "");
}
export function calculateDiscount(price: number, coupon?: { kind: string; value: number } | null) {
  if (!Number.isSafeInteger(price) || price < 0) throw new Error("Invalid amount");
  const discount = !coupon ? 0 : coupon.kind === "FREE" ? price : coupon.kind === "PERCENT"
    ? Math.floor(price * coupon.value / 100) : coupon.value;
  return Math.max(0, Math.min(price, discount));
}
export const csvCell = (value: unknown) => `"${String(value ?? "").replace(/^[\s\u0000-\u001f]*[=+@-]/, "'$&").replaceAll('"', '""')}"`;
