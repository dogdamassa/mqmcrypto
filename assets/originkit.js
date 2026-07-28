/*
 * Ports fiéis (vanilla JS) de dois componentes Originkit (originkit.dev):
 *  - Coverflow Gallery ("Smooth 3D Slideshow"): coverflow 3D com o card ativo em
 *    destaque e vizinhos inclinados em perspectiva; clique traz o card ao centro.
 *  - Round Carousel: cilindro 3D com rotação automática, arraste com momentum e
 *    cards de dupla face (face interna espelhada e escurecida).
 * Constantes, fórmulas e física idênticas ao código-fonte original dos componentes.
 *
 * Divergências intencionais em relação ao original:
 *  - Responsividade: função fit() redimensiona os cards ao container e escala o
 *    espaçamento (tx) proporcionalmente em telas pequenas.
 *  - Swipe horizontal no coverflow em toque (original: apenas clique/teclado).
 *  - prefers-reduced-motion desliga autoplay/rotação automática.
 *  - Acessibilidade extra no round carousel (role, aria-label, teclado).
 *  - Ajustes de design do site: título do coverflow 22px (original 28px),
 *    sombra nos cards e fundo #0a0a0f nas faces do round carousel.
 */
(function () {
    "use strict";

    var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* ============================== Coverflow Gallery ============================== */

    var CF = {
        PERSPECTIVE: 1600,
        SCALE_STEP: 0.16,
        MAX_VISIBLE: 2,
        DEPTH: 240,
        EASE: "cubic-bezier(0.22, 1, 0.36, 1)"
    };

    function coverflow(root, opts) {
        opts = opts || {};
        var slides = opts.slides || [];
        var n = slides.length;
        if (!n) return null;

        var cfg = {
            cardWidth: opts.cardWidth || 400,
            cardHeight: opts.cardHeight || 400,
            radius: opts.radius != null ? opts.radius : 3,
            tilt: opts.tilt != null ? opts.tilt : 12,
            sideTilt: opts.sideTilt != null ? opts.sideTilt : 8,
            gap: opts.gap != null ? opts.gap : 8,
            opacity: opts.opacity != null ? opts.opacity : 60,
            duration: opts.duration != null ? opts.duration : 0.6,
            autoplay: !!opts.autoplay,
            autoplayDirection: opts.autoplayDirection || "rightToLeft",
            autoplayDelay: opts.autoplayDelay != null ? opts.autoplayDelay : 2.5,
            showTitle: opts.showTitle !== false,
            responsive: opts.responsive !== false
        };

        var active = 0;
        var locked = false;
        var dur = REDUCED ? 0 : cfg.duration;
        var transitionCss = "transform " + dur + "s " + CF.EASE + ", opacity " + dur + "s " + CF.EASE;
        var dim = 1 - Math.max(0, Math.min(100, cfg.opacity)) / 100;

        root.classList.add("ok-coverflow");
        root.tabIndex = 0;
        root.setAttribute("role", "group");
        root.setAttribute("aria-roledescription", "carousel");
        root.style.perspective = CF.PERSPECTIVE + "px";

        var stage = document.createElement("div");
        stage.className = "ok-coverflow-stage";
        root.appendChild(stage);

        var cardW = cfg.cardWidth;
        var cardH = cfg.cardHeight;

        function effectiveRadius() {
            return (Math.max(0, Math.min(20, cfg.radius)) / 20) * (Math.min(cardW, cardH) / 2);
        }

        var cards = slides.map(function (slide, i) {
            var card = document.createElement("div");
            card.className = "ok-coverflow-card";
            card.setAttribute("aria-label", slide.title || "Slide " + (i + 1));

            var img = document.createElement("img");
            img.src = slide.image && slide.image.src ? slide.image.src : "";
            img.alt = (slide.image && slide.image.alt) || slide.title || "";
            img.draggable = false;
            img.loading = i === 0 ? "eager" : "lazy";
            card.appendChild(img);

            if (cfg.showTitle && slide.title) {
                var grad = document.createElement("div");
                grad.className = "ok-coverflow-grad";
                card.appendChild(grad);

                var titleWrap = document.createElement("div");
                titleWrap.className = "ok-coverflow-title";
                var span = document.createElement("span");
                span.textContent = slide.title;
                titleWrap.appendChild(span);
                card.appendChild(titleWrap);
            }

            var overlay = document.createElement("div");
            overlay.className = "ok-coverflow-dim";
            overlay.style.transition = "opacity " + dur + "s " + CF.EASE;
            card.appendChild(overlay);

            card.addEventListener("click", function () {
                if (cfg.autoplay || locked) return;
                if (suppressClick) { suppressClick = false; return; }
                lock();
                active = i === active ? (active + 1) % n : i;
                update();
            });

            stage.appendChild(card);
            return { el: card, overlay: overlay };
        });

        function lock() {
            locked = true;
            window.setTimeout(function () { locked = false; }, Math.max(50, dur * 1000));
        }

        function step(dirStep) {
            if (locked) return;
            lock();
            active = (((active + dirStep) % n) + n) % n;
            update();
        }

        function update() {
            stage.style.width = cardW + "px";
            stage.style.height = cardH + "px";
            var br = effectiveRadius() + "px";
            var gapScale = cardW / cfg.cardWidth;
            cards.forEach(function (c, i) {
                var rel = i - active;
                if (rel > n / 2) rel -= n;
                if (rel < -n / 2) rel += n;
                var ax = Math.abs(rel);
                var visible = ax <= CF.MAX_VISIBLE;
                var isActive = rel === 0;
                var sc = Math.max(0.4, 1 - ax * CF.SCALE_STEP);
                var tx = rel * (cfg.gap * 30) * gapScale;
                var tz = -ax * CF.DEPTH;
                var ry = -rel * cfg.tilt;
                var rz = rel * cfg.sideTilt;

                var s = c.el.style;
                s.width = cardW + "px";
                s.height = cardH + "px";
                s.borderRadius = br;
                s.transform = "translate(-50%, -50%) translateX(" + tx + "px) translateZ(" + tz +
                    "px) rotateY(" + ry + "deg) rotateZ(" + rz + "deg) scale(" + sc + ")";
                s.transition = transitionCss;
                s.opacity = visible ? 1 : 0;
                s.cursor = cfg.autoplay || isActive ? "default" : "pointer";
                s.pointerEvents = visible && !cfg.autoplay ? "auto" : "none";
                c.el.setAttribute("aria-hidden", visible ? "false" : "true");
                c.overlay.style.opacity = isActive ? 0 : dim;
            });
        }

        root.addEventListener("keydown", function (e) {
            if (e.key === "ArrowRight") { e.preventDefault(); step(1); }
            else if (e.key === "ArrowLeft") { e.preventDefault(); step(-1); }
        });

        var suppressClick = false;
        var swipeX = null;
        root.addEventListener("pointerdown", function (e) {
            if (cfg.autoplay) return;
            swipeX = e.clientX;
        });
        root.addEventListener("pointerup", function (e) {
            if (swipeX == null) return;
            var dx = e.clientX - swipeX;
            swipeX = null;
            if (Math.abs(dx) > 40) {
                suppressClick = true;
                step(dx < 0 ? 1 : -1);
            }
        });
        root.addEventListener("pointercancel", function () { swipeX = null; });

        var autoplayId = 0;
        if (cfg.autoplay && !REDUCED && n > 1) {
            var ms = Math.max(0.3, cfg.autoplayDelay) * 1000;
            var dirAuto = cfg.autoplayDirection === "leftToRight" ? -1 : 1;
            autoplayId = window.setInterval(function () { step(dirAuto); }, ms);
        }

        function fit() {
            if (!cfg.responsive) return;
            var w = root.clientWidth;
            if (!w) return;
            var target = Math.min(cfg.cardWidth, Math.max(250, w * 0.7));
            cardW = Math.round(target);
            cardH = Math.round(target * (cfg.cardHeight / cfg.cardWidth));
            update();
        }

        var resizeTimer;
        function onResize() {
            window.clearTimeout(resizeTimer);
            resizeTimer = window.setTimeout(fit, 120);
        }
        window.addEventListener("resize", onResize);

        fit();
        update();
        return {
            next: function () { step(1); },
            prev: function () { step(-1); },
            destroy: function () {
                window.clearInterval(autoplayId);
                window.clearTimeout(resizeTimer);
                window.removeEventListener("resize", onResize);
            }
        };
    }

    /* =============================== Round Carousel =============================== */

    function roundCarousel(root, opts) {
        opts = opts || {};
        var images = opts.images || [];
        var count = images.length;
        if (!count) return null;

        var cfg = {
            imageWidth: opts.imageWidth || 300,
            imageHeight: opts.imageHeight || 300,
            spacing: opts.spacing != null ? opts.spacing : 3,
            speed: opts.speed != null ? opts.speed : 7,
            direction: opts.direction || "right",
            drag: opts.drag !== false,
            sensitivity: opts.sensitivity != null ? opts.sensitivity : 5,
            tilt: opts.tilt != null ? opts.tilt : -7,
            perspective: opts.perspective != null ? opts.perspective : 3000,
            cornerRadius: opts.cornerRadius != null ? opts.cornerRadius : 22,
            innerDim: opts.innerDim != null ? opts.innerDim : 3.5,
            responsive: opts.responsive !== false
        };

        var imageW = cfg.imageWidth;
        var imageH = cfg.imageHeight;
        var angle = 360 / count;
        var radius = 0;

        var rotY = 0;
        var vel = 0;
        var last = 0;
        var raf = 0;
        var hovered = false;
        var MAX_VEL = 240;
        var dragState = { active: false, engaged: false, sx: 0, sy: 0, x: 0 };
        var degPerSec = cfg.speed * 6 * (cfg.direction === "left" ? -1 : 1);
        if (REDUCED) degPerSec = 0;

        root.classList.add("ok-roundcarousel");
        root.tabIndex = 0;
        root.setAttribute("role", "group");
        root.setAttribute("aria-roledescription", "carousel");
        root.style.perspective = cfg.perspective + "px";
        root.style.cursor = cfg.drag ? "grab" : "default";
        root.style.touchAction = "pan-y";

        var tiltWrap = document.createElement("div");
        tiltWrap.className = "ok-roundcarousel-tilt";
        tiltWrap.style.transform = "rotateX(" + cfg.tilt + "deg)";
        root.appendChild(tiltWrap);

        var ring = document.createElement("div");
        ring.className = "ok-roundcarousel-ring";
        tiltWrap.appendChild(ring);

        var faces = images.map(function (img, i) {
            var holder = document.createElement("div");
            holder.className = "ok-roundcarousel-item";
            holder.setAttribute("role", "img");
            holder.setAttribute("aria-label", img.alt || "Item " + (i + 1) + " de " + count);

            var front = document.createElement("div");
            front.className = "ok-roundcarousel-face";
            front.style.backgroundImage = "url(" + img.src + ")";
            front.style.borderRadius = cfg.cornerRadius + "px";
            holder.appendChild(front);

            var back = document.createElement("div");
            back.className = "ok-roundcarousel-face ok-roundcarousel-back";
            back.setAttribute("aria-hidden", "true");
            back.style.backgroundImage = "url(" + img.src + ")";
            back.style.borderRadius = cfg.cornerRadius + "px";
            back.style.filter = "brightness(" + cfg.innerDim / 10 + ")";
            holder.appendChild(back);

            ring.appendChild(holder);
            return holder;
        });

        function layout() {
            var factor = 1 + cfg.spacing * 0.15;
            radius = (imageW * factor) / (2 * Math.tan(Math.PI / count));
            ring.style.width = imageW + "px";
            ring.style.height = imageH + "px";
            faces.forEach(function (holder, i) {
                holder.style.transform = "rotateY(" + i * angle + "deg) translateZ(" + radius + "px)";
            });
            apply();
        }

        function apply() {
            ring.style.transform = "translateZ(" + -radius + "px) rotateY(" + rotY + "deg)";
        }

        function draw(now) {
            var dt = last ? (now - last) / 1000 : 0;
            last = now;
            var f = Math.min(dt, 0.1);
            if (!dragState.engaged) {
                if (Math.abs(vel) > 0.01) {
                    rotY += vel * f;
                    vel *= 0.94;
                } else if (!hovered) {
                    rotY += degPerSec * f;
                }
            }
            apply();
            raf = window.requestAnimationFrame(draw);
        }

        root.addEventListener("pointerdown", function (e) {
            if (!cfg.drag) return;
            dragState = { active: true, engaged: false, sx: e.clientX, sy: e.clientY, x: e.clientX };
        });
        root.addEventListener("pointermove", function (e) {
            var d = dragState;
            if (!d.active) return;
            if (!d.engaged) {
                var mx = Math.abs(e.clientX - d.sx);
                var my = Math.abs(e.clientY - d.sy);
                // Gesto vertical = scroll da página; não engatar o giro.
                if (my > 12 && my > mx) { d.active = false; return; }
                if (mx < 10 || mx <= my) return;
                d.engaged = true;
                d.x = e.clientX;
                vel = 0;
                if (root.setPointerCapture) {
                    try { root.setPointerCapture(e.pointerId); } catch (err) { /* sem captura */ }
                }
                root.style.cursor = "grabbing";
            }
            var dx = e.clientX - d.x;
            d.x = e.clientX;
            var k = 0.3 * cfg.sensitivity;
            rotY += dx * k;
            vel = Math.max(-MAX_VEL, Math.min(MAX_VEL, dx * k * 60));
        });
        function endDrag(e) {
            if (root.releasePointerCapture && e.pointerId != null) {
                try { root.releasePointerCapture(e.pointerId); } catch (err) { /* já liberado */ }
            }
            dragState.active = false;
            dragState.engaged = false;
            root.style.cursor = cfg.drag ? "grab" : "default";
        }
        root.addEventListener("pointerup", endDrag);
        root.addEventListener("pointercancel", endDrag);

        // Pausa a rotação automática com o mouse em cima, para leitura dos cards.
        root.addEventListener("mouseenter", function () { hovered = true; });
        root.addEventListener("mouseleave", function () { hovered = false; });

        root.addEventListener("keydown", function (e) {
            if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                e.preventDefault();
                vel = 0;
                rotY += e.key === "ArrowRight" ? -angle : angle;
                apply();
            }
        });

        function fit() {
            if (!cfg.responsive) return;
            var w = root.clientWidth;
            if (!w) return;
            var target = Math.min(cfg.imageWidth, Math.max(250, w * 0.45));
            imageW = Math.round(target);
            imageH = Math.round(target * (cfg.imageHeight / cfg.imageWidth));
            layout();
        }

        var resizeTimer;
        function onResize() {
            window.clearTimeout(resizeTimer);
            resizeTimer = window.setTimeout(fit, 120);
        }
        window.addEventListener("resize", onResize);

        fit();
        layout();
        raf = window.requestAnimationFrame(draw);
        return {
            destroy: function () {
                window.cancelAnimationFrame(raf);
                window.clearTimeout(resizeTimer);
                window.removeEventListener("resize", onResize);
            }
        };
    }

    window.OriginKit = { coverflow: coverflow, roundCarousel: roundCarousel };
})();
