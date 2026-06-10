import {
    dateKeys,
    isAuthorized,
    redis,
    setApiHeaders,
} from "./_analytics.js";

const HASH_SECTIONS = [
    "pages",
    "referrers",
    "countries",
    "cities",
    "devices",
    "campaigns",
    "clicks",
    "zones",
];

function addHash(target, values) {
    if (values && !Array.isArray(values) && typeof values === "object") {
        for (const [label, rawCount] of Object.entries(values)) {
            target[label] = (target[label] || 0) + (Number(rawCount) || 0);
        }
        return;
    }
    if (!Array.isArray(values)) return;
    for (let index = 0; index < values.length; index += 2) {
        const label = values[index];
        const count = Number(values[index + 1]) || 0;
        target[label] = (target[label] || 0) + count;
    }
}

function topEntries(values, limit = 10) {
    return Object.entries(values)
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, limit);
}

export default async function handler(request, response) {
    setApiHeaders(response);

    if (request.method !== "GET") {
        response.setHeader("Allow", "GET");
        return response.status(405).json({ error: "Metodo nao permitido." });
    }
    if (!isAuthorized(request)) {
        return response.status(401).json({ error: "Senha do dashboard invalida." });
    }

    try {
        const requestedDays = Number(request.query?.days || 30);
        const days = [7, 14, 30, 90].includes(requestedDays) ? requestedDays : 30;
        const dates = dateKeys(days);
        const visitorKeys = dates.map((date) => `mqm:analytics:${date}:visitors`);
        const sessionKeys = dates.map((date) => `mqm:analytics:${date}:sessions`);
        const commands = [
            ["PFCOUNT", ...visitorKeys],
            ["PFCOUNT", ...sessionKeys],
        ];

        for (const date of dates) {
            const prefix = `mqm:analytics:${date}`;
            commands.push(
                ["GET", `${prefix}:views`],
                ["PFCOUNT", `${prefix}:visitors`],
                ["PFCOUNT", `${prefix}:sessions`],
                ["GET", `${prefix}:click_count`]
            );
            for (const section of HASH_SECTIONS) {
                commands.push(["HGETALL", `${prefix}:${section}`]);
            }
        }

        const results = await redis(commands);
        const totals = { views: 0, visitors: 0, sessions: 0, clicks: 0 };
        const sections = Object.fromEntries(HASH_SECTIONS.map((section) => [section, {}]));
        const timeline = [];
        let cursor = 0;
        totals.visitors = Number(results[cursor++]) || 0;
        totals.sessions = Number(results[cursor++]) || 0;

        for (const date of dates) {
            const views = Number(results[cursor++]) || 0;
            const visitors = Number(results[cursor++]) || 0;
            const sessions = Number(results[cursor++]) || 0;
            const clicks = Number(results[cursor++]) || 0;

            totals.views += views;
            totals.clicks += clicks;
            timeline.push({ date, views, visitors, clicks });

            for (const section of HASH_SECTIONS) {
                addHash(sections[section], results[cursor++]);
            }
        }

        return response.status(200).json({
            days,
            totals: {
                ...totals,
                clickRate: totals.views ? Number(((totals.clicks / totals.views) * 100).toFixed(1)) : 0,
            },
            timeline,
            rankings: Object.fromEntries(
                HASH_SECTIONS.map((section) => [
                    section,
                    topEntries(sections[section], section === "clicks" ? 15 : 10),
                ])
            ),
            generatedAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error("analytics_stats_error", error);
        return response.status(500).json({
            error: "O banco de analytics ainda nao esta configurado ou respondeu com erro.",
        });
    }
}
