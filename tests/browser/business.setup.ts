import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import { randomBytes, createHmac, createCipheriv } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "@node-rs/argon2";
import { authenticator } from "otplib";

export default async function setup() {
  if (process.env.NODE_ENV === "production" || !process.env.APP_URL?.startsWith("http://127.0.0.1:")) throw new Error("Browser fixtures are local-development only.");
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
  const token = randomBytes(32).toString("base64url"); const password = randomBytes(24).toString("base64url");
  const secret = authenticator.generateSecret(); const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm",Buffer.from(process.env.MFA_ENCRYPTION_KEY!,"hex"),iv);
  const encrypted = Buffer.concat([cipher.update(secret,"utf8"),cipher.final()]);
  const mfaSecret = [iv,cipher.getAuthTag(),encrypted].map(value=>value.toString("base64url")).join(".");
  try {
    // A new test-only operator is removed by teardown; never alter real admin credentials.
    const account = await db.account.create({ data:{ name:"Browser test operator",phone:`+919${String(Date.now()).slice(-9)}`,passwordHash:await hash(password,{algorithm:2}),role:"ADMIN",mustChangePassword:false,mfaSecret } });
    await db.session.create({ data:{ hash:createHmac("sha256",process.env.SESSION_SECRET!).update(token).digest("hex"),accountId:account.id,kind:"FULL",expiresAt:new Date(Date.now()+3600000) } });
    await mkdir("work",{recursive:true});
    await writeFile("work/browser-auth.json",JSON.stringify({cookies:[{name:"invitation-session",value:token,domain:"127.0.0.1",path:"/",httpOnly:true,secure:false,sameSite:"Lax",expires:Math.floor(Date.now()/1000)+3600}],origins:[]}),{mode:0o600});
    await writeFile("work/browser-operator.json",JSON.stringify({id:account.id,phone:account.phone,password,secret}),{mode:0o600});
  } finally { await db.$disconnect(); }
}
