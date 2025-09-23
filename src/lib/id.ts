// src/lib/id.ts
import { randomBytes } from "crypto";

const ALPHANUM = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export function generateMembershipId(length = 9) {
  const buf = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHANUM[buf[i] % ALPHANUM.length];
  }
  return out;
}
