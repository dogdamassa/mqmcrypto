(() => {
    "use strict";

    const elements = {
        dashboard: document.querySelector("#dashboard"),
        login: document.querySelector("#login"),
        form: document.querySelector("#login-form"),
        token: document.querySelector("#token"),
        message: document.querySelector("#message"),
        period: document.querySelector("#period"),
        logout: document.querySelector("#logout"),
        demo: document.querySelector("#demo"),
    };

    const number = new Intl.NumberFormat("pt-BR");
    const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
    const brlCents = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
    const savedToken = sessionStorage.getItem("mqm_dashboard_token");
    let demoMode = false;

    // Snapshot do negócio (Lastlink) — exportações de 25/06/2026.
    // Apenas agregados, sem dados pessoais. Recalcule rodando o export e atualize aqui.
    const BUSINESS = {
        asOf: "2026-06-25",
        totals: {
            grossApproved: 12980,
            approvedCount: 84,
            mrr: 2475.67,
            arr: 29708,
            mrrPendingRisk: 891,
            activeMembers: 25,
            activeSubs: 25,
            pendingSubs: 9,
            newSales: 45,
            renewals: 39,
            lostCount: 16,
            lostValue: 4857,
            churnedSubs: 18,
            cartCount: 15,
            cartValue: 4758,
            cartsOpen: 8,
            cartsExpired: 7,
            chargebacks: 1,
        },
        monthly: [
            { month: "2026-03", revenue: 4261 },
            { month: "2026-04", revenue: 4459 },
            { month: "2026-05", revenue: 2475 },
            { month: "2026-06", revenue: 1785 },
        ],
        splits: {
            saleType: [
                { label: "Novas vendas", value: 45 },
                { label: "Renovações", value: 39 },
            ],
            subStatus: [
                { label: "Ativas", value: 25 },
                { label: "Pendentes", value: 9 },
                { label: "Expiradas", value: 15 },
                { label: "Canceladas", value: 3 },
            ],
            payment: [
                { label: "Cartão", value: 51 },
                { label: "Pix", value: 33 },
            ],
            plan: [
                { label: "Mensal", value: 77 },
                { label: "Anual", value: 4 },
                { label: "Manual avulso", value: 3 },
            ],
        },
    };

    const demoData = {
        totals: { views: 1847, visitors: 1126, sessions: 1384, clicks: 492, clickRate: 26.6 },
        timeline: Array.from({ length: 30 }, (_, index) => ({
            date: `2026-05-${String(index + 1).padStart(2, "0")}`,
            views: 28 + ((index * 17) % 74),
            visitors: 18 + ((index * 11) % 45),
            clicks: 7 + ((index * 9) % 24),
        })),
        rankings: {
            clicks: [
                { label: "Manual | Acessar o Manual", value: 164 },
                { label: "Home | Abrir Comunidade mQm", value: 126 },
                { label: "Mentoria | Falar no WhatsApp", value: 103 },
                { label: "Comunidade | Entrar na Comunidade", value: 82 },
            ],
            pages: [
                { label: "Home", value: 842 },
                { label: "Manual", value: 438 },
                { label: "Comunidade", value: 351 },
                { label: "Mentoria", value: 216 },
            ],
            referrers: [
                { label: "Direto", value: 734 },
                { label: "instagram.com", value: 491 },
                { label: "youtube.com", value: 277 },
                { label: "x.com", value: 185 },
            ],
            countries: [
                { label: "BR", value: 1038 },
                { label: "PT", value: 46 },
                { label: "US", value: 25 },
            ],
            devices: [
                { label: "Celular", value: 839 },
                { label: "Computador", value: 264 },
                { label: "Tablet", value: 23 },
            ],
        },
        generatedAt: new Date().toISOString(),
    };

    function setText(id, value) {
        document.querySelector(`#${id}`).textContent = value;
    }

    function renderRanking(id, entries) {
        const container = document.querySelector(`#${id}`);
        container.replaceChildren();
        if (!entries?.length) {
            const empty = document.createElement("p");
            empty.className = "empty-state";
            empty.textContent = "Ainda sem dados neste período.";
            container.append(empty);
            return;
        }

        const max = Math.max(...entries.map((entry) => entry.value), 1);
        entries.forEach((entry) => {
            const row = document.createElement("div");
            row.className = "rank-row";

            const label = document.createElement("span");
            label.className = "rank-label";
            label.title = entry.label;
            label.textContent = entry.label;

            const value = document.createElement("strong");
            value.className = "rank-value";
            value.textContent = number.format(entry.value);

            const track = document.createElement("span");
            track.className = "rank-track";
            const fill = document.createElement("i");
            fill.className = "rank-fill";
            fill.style.width = `${Math.max((entry.value / max) * 100, 2)}%`;
            track.append(fill);
            row.append(label, value, track);
            container.append(row);
        });
    }

    function renderValueRanking(id, entries, format) {
        const container = document.querySelector(`#${id}`);
        container.replaceChildren();
        const max = Math.max(...entries.map((entry) => entry.value), 1);
        entries.forEach((entry) => {
            const row = document.createElement("div");
            row.className = "rank-row";

            const label = document.createElement("span");
            label.className = "rank-label";
            label.title = entry.label;
            label.textContent = entry.label;

            const value = document.createElement("strong");
            value.className = "rank-value";
            value.textContent = format(entry.value);

            const track = document.createElement("span");
            track.className = "rank-track";
            const fill = document.createElement("i");
            fill.className = "rank-fill";
            fill.style.width = `${Math.max((entry.value / max) * 100, 2)}%`;
            track.append(fill);
            row.append(label, value, track);
            container.append(row);
        });
    }

    function renderBusiness() {
        const t = BUSINESS.totals;
        const stamp = new Date(`${BUSINESS.asOf}T12:00:00`).toLocaleDateString("pt-BR");
        setText("biz-asof", `Dados de ${stamp}`);
        setText("biz-mrr", brlCents.format(t.mrr));
        setText("biz-arr", `ARR ${brl.format(t.arr)} · ${t.activeSubs} assinaturas`);
        setText("biz-members", number.format(t.activeMembers));
        setText("biz-subs", `${t.activeSubs} ativas · ${t.pendingSubs} pendentes`);
        setText("biz-gross", brl.format(t.grossApproved));
        setText("biz-gross-note", `${t.approvedCount} vendas aprovadas (desde mar/26)`);
        setText("biz-carts", number.format(t.cartsOpen));
        setText("biz-carts-note", `${brl.format(t.mrrPendingRisk)} aberto · ${t.cartsExpired} expirados`);

        const callout = document.querySelector("#biz-callout");
        callout.replaceChildren();
        const parts = [
            `<strong>${t.pendingSubs} renovações pendentes</strong> (${brl.format(t.mrrPendingRisk)} em risco)`,
            `<strong>${t.churnedSubs} assinaturas perdidas</strong> no período`,
            `${brl.format(t.lostValue)} em ${t.lostCount} transações não concluídas`,
            `${t.chargebacks} chargeback`,
        ];
        callout.innerHTML = `⚠ ${parts.join(" &nbsp;·&nbsp; ")}`;

        const monthLabel = (m) => {
            const date = new Date(`${m}-01T12:00:00`);
            const name = date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
            const partial = m === BUSINESS.asOf.slice(0, 7) ? " (parcial)" : "";
            return `${name}/${m.slice(2, 4)}${partial}`;
        };
        renderValueRanking(
            "biz-monthly",
            BUSINESS.monthly.map((e) => ({ label: monthLabel(e.month), value: e.revenue })),
            (v) => brl.format(v)
        );
        renderRanking("biz-saletype", BUSINESS.splits.saleType);
        renderRanking("biz-substatus", BUSINESS.splits.subStatus);
        renderRanking("biz-payment", BUSINESS.splits.payment);
        renderRanking("biz-plan", BUSINESS.splits.plan);
    }

    function renderTimeline(entries) {
        const chart = document.querySelector("#timeline");
        chart.replaceChildren();
        const max = Math.max(...entries.map((entry) => entry.views), 1);
        const labelEvery = entries.length <= 14 ? 2 : Math.ceil(entries.length / 7);

        entries.forEach((entry, index) => {
            const day = document.createElement("div");
            day.className = "chart-day";
            day.title = `${new Date(`${entry.date}T12:00:00`).toLocaleDateString("pt-BR")}: ${entry.views} visualizações, ${entry.visitors} visitantes`;

            ["views", "visitors"].forEach((type) => {
                const bar = document.createElement("span");
                bar.className = `chart-bar ${type}`;
                bar.style.height = `${Math.max((entry[type] / max) * 100, 1)}%`;
                day.append(bar);
            });

            if (index % labelEvery === 0 || index === entries.length - 1) {
                const label = document.createElement("small");
                label.className = "chart-day-label";
                label.textContent = new Date(`${entry.date}T12:00:00`).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                });
                day.append(label);
            }
            chart.append(day);
        });
    }

    function render(data) {
        renderBusiness();
        setText("views", number.format(data.totals.views));
        setText("visitors", number.format(data.totals.visitors));
        setText("sessions", number.format(data.totals.sessions));
        setText("clicks", number.format(data.totals.clicks));
        setText("click-rate", `${String(data.totals.clickRate).replace(".", ",")}% por visualização`);
        renderTimeline(data.timeline);
        renderRanking("click-ranking", data.rankings.clicks);
        renderRanking("page-ranking", data.rankings.pages);
        renderRanking("referrer-ranking", data.rankings.referrers);
        renderRanking("country-ranking", data.rankings.countries);
        renderRanking("device-ranking", data.rankings.devices);
        setText(
            "last-update",
            `${demoMode ? "Demonstração com dados ilustrativos" : "Atualizado"} em ${
                new Date(data.generatedAt).toLocaleString("pt-BR")
            }`
        );
        elements.login.hidden = true;
        elements.dashboard.hidden = false;
    }

    async function loadDashboard(token) {
        elements.message.textContent = "Carregando métricas...";
        const response = await fetch(`/api/stats?days=${elements.period.value}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Não foi possível carregar o dashboard.");
        sessionStorage.setItem("mqm_dashboard_token", token);
        elements.message.textContent = "";
        render(data);
    }

    elements.form.addEventListener("submit", async (event) => {
        event.preventDefault();
        demoMode = false;
        try {
            await loadDashboard(elements.token.value);
        } catch (error) {
            elements.message.textContent = error.message;
        }
    });

    elements.period.addEventListener("change", async () => {
        if (demoMode) {
            render(demoData);
            return;
        }
        const token = sessionStorage.getItem("mqm_dashboard_token");
        if (token) {
            try {
                await loadDashboard(token);
            } catch (error) {
                elements.dashboard.hidden = true;
                elements.login.hidden = false;
                elements.message.textContent = error.message;
            }
        }
    });

    elements.logout.addEventListener("click", () => {
        sessionStorage.removeItem("mqm_dashboard_token");
        demoMode = false;
        elements.dashboard.hidden = true;
        elements.login.hidden = false;
        elements.token.value = "";
    });

    elements.demo.addEventListener("click", () => {
        demoMode = true;
        render(demoData);
    });

    if (savedToken) {
        loadDashboard(savedToken).catch((error) => {
            sessionStorage.removeItem("mqm_dashboard_token");
            elements.message.textContent = error.message;
        });
    }
})();
