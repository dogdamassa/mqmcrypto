import {
    cleanField,
    dayKey,
    deviceType,
    getClientIp,
    hash,
    isBot,
    redis,
    setApiHeaders,
} from "./_analytics.js";

function decodeHeader(value) {
    try {
        return decodeURIComponent(value || "");
    } catch {
        return value || "";
    }
}

export default async function handler(request, response) {
    setApiHeaders(response);

    if (request.method !== "POST") {
        response.setHeader("Allow", "POST");
        return response.status(405).json({ error: "Metodo nao permitido." });
    }

    const userAgent = String(request.headers["user-agent"] || "");
    if (isBot(userAgent)) return response.status(202).json({ ok: true });

    try {
        const body = typeof request.body === "string" ? JSON.parse(request.body) : request.body || {};
        const type = body.type === "click" ? "click" : "page_view";
        const day = dayKey();
        const prefix = `mqm:analytics:${day}`;
        const page = cleanField(body.page, "Pagina desconhecida");
        const country = cleanField(request.headers["x-vercel-ip-country"], "Desconhecido");
        const city = cleanField(
            decodeHeader(request.headers["x-vercel-ip-city"]),
            "Desconhecida"
        );
        const device = deviceType(userAgent);
        const ip = getClientIp(request);
        const visitor = hash(`${day}|${ip}|${userAgent}`);
        const session = hash(`${day}|${body.sessionId || ip}|${userAgent}`);
        const expireSeconds = 60 * 60 * 24 * 120;
        const commands = [];

        if (type === "page_view") {
            const referrer = cleanField(body.referrer, "Direto");
            const campaign = cleanField(body.campaign, "Sem campanha");
            const source = cleanField(body.source, "Sem UTM");
            commands.push(
                ["INCR", `${prefix}:views`],
                ["PFADD", `${prefix}:visitors`, visitor],
                ["PFADD", `${prefix}:sessions`, session],
                ["HINCRBY", `${prefix}:pages`, page, 1],
                ["HINCRBY", `${prefix}:referrers`, referrer, 1],
                ["HINCRBY", `${prefix}:countries`, country, 1],
                ["HINCRBY", `${prefix}:cities`, `${country} / ${city}`, 1],
                ["HINCRBY", `${prefix}:devices`, device, 1],
                ["HINCRBY", `${prefix}:campaigns`, `${source} / ${campaign}`, 1]
            );
        } else {
            const target = cleanField(body.target, "Elemento sem nome");
            const zone = cleanField(body.zone, "Zona desconhecida");
            commands.push(
                ["INCR", `${prefix}:click_count`],
                ["HINCRBY", `${prefix}:clicks`, `${page} | ${target}`, 1],
                ["HINCRBY", `${prefix}:zones`, `${page} | ${zone}`, 1]
            );
        }

        const keys = [...new Set(commands.map((command) => command[1]))];
        for (const key of keys) commands.push(["EXPIRE", key, expireSeconds]);
        await redis(commands);
        return response.status(202).json({ ok: true });
    } catch (error) {
        console.error("analytics_collect_error", error);
        return response.status(500).json({ error: "Nao foi possivel registrar o evento." });
    }
}
