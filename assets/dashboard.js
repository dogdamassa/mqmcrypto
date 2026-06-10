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
    const savedToken = sessionStorage.getItem("mqm_dashboard_token");
    let demoMode = false;

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
