import crypto from "node:crypto";

const MAX_FIELD_LENGTH = 120;

export function getRedisConfig() {
    const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
    return { url, token };
}

export async function redis(commands) {
    const { url, token } = getRedisConfig();
    if (!url || !token) {
        throw new Error("Banco de analytics nao configurado.");
    }

    const response = await fetch(`${url}/pipeline`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(commands),
    });

    if (!response.ok) {
        throw new Error(`Falha no banco de analytics: ${response.status}`);
    }

    const payload = await response.json();
    const failed = payload.find((entry) => entry.error);
    if (failed) throw new Error(failed.error);
    return payload.map((entry) => entry.result);
}

export function dayKey(date = new Date()) {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Sao_Paulo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(date);
}

export function dateKeys(days) {
    const result = [];
    const now = new Date();
    for (let offset = days - 1; offset >= 0; offset -= 1) {
        const date = new Date(now);
        date.setUTCDate(date.getUTCDate() - offset);
        result.push(dayKey(date));
    }
    return result;
}

export function cleanField(value, fallback = "Desconhecido") {
    const cleaned = String(value || "")
        .replace(/[\u0000-\u001f\u007f]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, MAX_FIELD_LENGTH);
    return cleaned || fallback;
}

export function hash(value) {
    const secret = process.env.ANALYTICS_HASH_SECRET || process.env.ANALYTICS_DASHBOARD_TOKEN;
    if (!secret) throw new Error("ANALYTICS_HASH_SECRET nao configurado.");
    return crypto.createHmac("sha256", secret).update(String(value)).digest("hex").slice(0, 24);
}

export function getClientIp(request) {
    return cleanField(
        request.headers["x-forwarded-for"]?.split(",")[0] ||
        request.headers["x-real-ip"] ||
        "unknown"
    );
}

export function isBot(userAgent) {
    return /bot|crawler|spider|headless|preview|facebookexternalhit|whatsapp/i.test(userAgent || "");
}

export function deviceType(userAgent) {
    if (/tablet|ipad/i.test(userAgent)) return "Tablet";
    if (/mobile|iphone|android/i.test(userAgent)) return "Celular";
    return "Computador";
}

export function isAuthorized(request) {
    const expected = process.env.ANALYTICS_DASHBOARD_TOKEN;
    const provided = String(request.headers.authorization || "").replace(/^Bearer\s+/i, "");
    if (!expected || !provided || expected.length !== provided.length) return false;
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
}

export function setApiHeaders(response) {
    response.setHeader("Cache-Control", "no-store");
    response.setHeader("Content-Type", "application/json; charset=utf-8");
    response.setHeader("X-Content-Type-Options", "nosniff");
}
