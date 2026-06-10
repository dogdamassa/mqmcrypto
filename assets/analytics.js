(() => {
    "use strict";

    if (navigator.doNotTrack === "1" || window.location.pathname.endsWith("/dashboard.html")) {
        return;
    }

    const endpoint = "/api/collect";
    const page = normalizePage(window.location.pathname);
    const visitorId = getId("mqm_visitor_id", localStorage);
    const sessionId = getId("mqm_session_id", sessionStorage);

    function getId(key, storage) {
        try {
            let value = storage.getItem(key);
            if (!value) {
                value = crypto.randomUUID();
                storage.setItem(key, value);
            }
            return value;
        } catch {
            return crypto.randomUUID();
        }
    }

    function normalizePage(pathname) {
        if (pathname === "/" || pathname.endsWith("/index.html")) return "Home";
        const filename = pathname.split("/").filter(Boolean).pop() || "Home";
        return filename.replace(/\.html$/, "").replace(/-/g, " ");
    }

    function send(payload) {
        const body = JSON.stringify({
            ...payload,
            page,
            visitorId,
            sessionId,
            screen: `${window.screen.width}x${window.screen.height}`,
            language: navigator.language || "",
        });

        if (navigator.sendBeacon) {
            navigator.sendBeacon(endpoint, new Blob([body], { type: "application/json" }));
            return;
        }

        fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body,
            keepalive: true,
        }).catch(() => {});
    }

    const referrer = document.referrer
        ? (() => {
            try {
                const host = new URL(document.referrer).hostname;
                return host === window.location.hostname ? "Interno" : host;
            } catch {
                return "Desconhecido";
            }
        })()
        : "Direto";

    const params = new URLSearchParams(window.location.search);
    send({
        type: "page_view",
        referrer,
        campaign: params.get("utm_campaign") || "",
        source: params.get("utm_source") || "",
    });

    document.addEventListener("click", (event) => {
        const element = event.target.closest("a, button");
        if (!element) return;

        const label = (
            element.dataset.analyticsLabel ||
            element.getAttribute("aria-label") ||
            element.textContent ||
            element.getAttribute("href") ||
            element.tagName
        ).replace(/\s+/g, " ").trim().slice(0, 100);

        const rect = element.getBoundingClientRect();
        const horizontal = event.clientX < window.innerWidth / 3
            ? "Esquerda"
            : event.clientX > (window.innerWidth * 2) / 3
                ? "Direita"
                : "Centro";
        const documentHeight = Math.max(document.documentElement.scrollHeight, 1);
        const y = (event.clientY + window.scrollY) / documentHeight;
        const vertical = y < 0.33 ? "Topo" : y > 0.66 ? "Final" : "Meio";

        send({
            type: "click",
            target: label || "Elemento sem nome",
            destination: element.getAttribute("href") || "",
            zone: `${vertical} / ${horizontal}`,
            elementWidth: Math.round(rect.width),
        });
    }, { capture: true });
})();
