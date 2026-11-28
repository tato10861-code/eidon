/**
 * IP allowlist / CIDR-based network access control.
 *
 * Supports both IPv4 and IPv6 (IPv4-mapped IPv6 addresses are normalised).
 * Enterprise workspaces can restrict API access to known egress IP ranges.
 */

/** Parse a dotted-decimal IPv4 address into a 32-bit integer. */
function parseIPv4(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  let n = 0;
  for (const part of parts) {
    const byte = parseInt(part, 10);
    if (isNaN(byte) || byte < 0 || byte > 255) return null;
    n = (n << 8) | byte;
  }
  return n >>> 0;
}

/** True if an IPv4 address falls within a CIDR range. */
function ipv4InCidr(ip: string, cidr: string): boolean {
  const [network, bits] = cidr.split("/");
  const prefix = parseInt(bits, 10);
  if (isNaN(prefix) || prefix < 0 || prefix > 32) return false;
  const ipNum = parseIPv4(ip);
  const netNum = parseIPv4(network);
  if (ipNum === null || netNum === null) return false;
  if (prefix === 0) return true;
  const mask = ~((1 << (32 - prefix)) - 1) >>> 0;
  return (ipNum & mask) === (netNum & mask);
}

/** Normalise an IPv4-mapped IPv6 address like ::ffff:1.2.3.4 → 1.2.3.4 */
function normalizeIP(raw: string): string {
  const mapped = raw.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  if (mapped) return mapped[1];
  return raw;
}

/** True if an IP address falls within a single CIDR range (IPv4 only for now). */
export function ipInCidr(rawIp: string, cidr: string): boolean {
  const ip = normalizeIP(rawIp);
  if (cidr.includes("/")) return ipv4InCidr(ip, cidr);
  return ip === cidr;
}

/**
 * Check whether an IP is permitted by an allowlist.
 * An empty allowlist means unrestricted (allow all).
 */
export function checkAllowlist(rawIp: string, allowlist: string[]): boolean {
  if (!allowlist.length) return true;
  const ip = normalizeIP(rawIp);
  return allowlist.some((entry) => ipInCidr(ip, entry));
}

/** Extract the real IP from a Next.js Request, respecting common proxy headers. */
export function extractClientIP(request: Request): string | null {
  const headers = request.headers;
  const cfIP = headers.get("cf-connecting-ip");
  if (cfIP) return cfIP.trim();
  const xForwardedFor = headers.get("x-forwarded-for");
  if (xForwardedFor) {
    const first = xForwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }
  const xRealIP = headers.get("x-real-ip");
  if (xRealIP) return xRealIP.trim();
  return null;
}

/** Validate that each entry is a valid IPv4 address or CIDR. */
export function validateAllowlist(entries: unknown[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  for (const entry of entries) {
    if (typeof entry !== "string") {
      errors.push(`${String(entry)}: must be a string`);
      continue;
    }
    const e = entry.trim();
    if (e.includes("/")) {
      const [ip, bits] = e.split("/");
      const prefix = parseInt(bits, 10);
      if (parseIPv4(ip) === null) errors.push(`${e}: invalid network address`);
      else if (isNaN(prefix) || prefix < 0 || prefix > 32)
        errors.push(`${e}: CIDR prefix must be 0–32`);
    } else {
      if (parseIPv4(e) === null && !e.match(/^[0-9a-fA-F:]+$/))
        errors.push(`${e}: not a valid IPv4 address or CIDR`);
    }
  }
  return { valid: errors.length === 0, errors };
}
