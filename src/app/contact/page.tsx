import { db } from "@/server/db";
import { PublicHeader, PublicFooter } from "@/components/public-shell";
import { phoneSchema } from "@/server/validation";
export const dynamic = "force-dynamic";
export default async function Contact() {
  const settings = await db.settings.findUnique({ where: { id: "studio" } });
  const phone = phoneSchema.safeParse(settings?.phone);
  return <><PublicHeader /><main id="main-content" className="wrap contact-page"><p className="eyebrow">Made personal</p><h1>Let’s create your invitation.</h1><p>Choose a template, then contact {settings?.name || "the studio"} to personalize it and arrange payment offline.</p><div className="business-actions">{phone.success && <a className="button primary" href={`tel:${phone.data}`}>Call {settings?.phone}</a>}{settings?.email && <a className="button outline" href={`mailto:${settings.email}`}>Email the studio</a>}</div>{!phone.success && !settings?.email && <p>Contact details will be available here when the studio opens for bookings.</p>}<a href="/templates">Browse invitation previews →</a></main><PublicFooter /></>;
}
