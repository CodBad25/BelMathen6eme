/**
 * Géométrie Animée - Moteur de construction géométrique
 * Inspiré d'InstrumenPoche mais simplifié et modernisé
 */

const SVG_NS = 'http://www.w3.org/2000/svg';

// ============================================
// CLASSE PRINCIPALE : GeoCanvas
// ============================================
class GeoCanvas {
    constructor(svgId) {
        this.svg = document.getElementById(svgId);
        this.width = parseInt(this.svg.getAttribute('width'));
        this.height = parseInt(this.svg.getAttribute('height'));

        // Groupes pour organiser les calques
        this.layerBackground = this.createGroup('layer-background');
        this.layerConstructions = this.createGroup('layer-constructions');
        this.layerPoints = this.createGroup('layer-points');
        this.layerInstruments = this.createGroup('layer-instruments');
        this.layerLabels = this.createGroup('layer-labels');

        // Créer le fond
        this.createBackground();

        // Instruments
        this.crayon = new Crayon(this);
        this.regle = new Regle(this);
        this.compas = new Compas(this);

        // État de l'animation
        this.animationQueue = [];
        this.isPlaying = false;
        this.isPaused = false;
        this.speed = 1;
        this.currentAnimation = null;

        // Stockage des objets créés
        this.objects = {};
    }

    createGroup(id) {
        const g = document.createElementNS(SVG_NS, 'g');
        g.setAttribute('id', id);
        this.svg.appendChild(g);
        return g;
    }

    createBackground() {
        // Fond blanc (sans grille - construction à la règle et au compas)
        const rect = document.createElementNS(SVG_NS, 'rect');
        rect.setAttribute('width', '100%');
        rect.setAttribute('height', '100%');
        rect.setAttribute('fill', '#fafafa');
        this.layerBackground.appendChild(rect);
    }

    clear() {
        this.layerConstructions.innerHTML = '';
        this.layerPoints.innerHTML = '';
        this.layerLabels.innerHTML = '';
        this.objects = {};
        this.crayon.hide();
        this.regle.hide();
        this.compas.hide();
    }

    // File d'attente d'animations
    addAnimation(animFunc) {
        this.animationQueue.push(animFunc);
    }

    async play() {
        this.isPlaying = true;
        this.isPaused = false;

        while (this.animationQueue.length > 0 && this.isPlaying) {
            if (this.isPaused) {
                await new Promise(resolve => {
                    this.resumeCallback = resolve;
                });
            }

            const anim = this.animationQueue.shift();
            await anim();
        }

        this.isPlaying = false;
    }

    pause() {
        this.isPaused = true;
    }

    resume() {
        this.isPaused = false;
        if (this.resumeCallback) {
            this.resumeCallback();
            this.resumeCallback = null;
        }
    }

    stop() {
        this.isPlaying = false;
        this.isPaused = false;
        this.animationQueue = [];
    }

    // Utilitaires
    wait(ms) {
        return new Promise(resolve => {
            const checkPause = () => {
                if (this.isPaused) {
                    // Attendre la reprise
                    const waitForResume = () => {
                        if (!this.isPaused) {
                            setTimeout(resolve, ms / this.speed);
                        } else {
                            requestAnimationFrame(waitForResume);
                        }
                    };
                    requestAnimationFrame(waitForResume);
                } else {
                    setTimeout(resolve, ms / this.speed);
                }
            };
            checkPause();
        });
    }

    animate(duration, callback) {
        return new Promise(resolve => {
            const startTime = performance.now();
            const adjustedDuration = duration / this.speed;

            const step = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / adjustedDuration, 1);

                callback(progress);

                if (progress < 1 && this.isPlaying && !this.isPaused) {
                    requestAnimationFrame(step);
                } else {
                    callback(1);
                    resolve();
                }
            };

            requestAnimationFrame(step);
        });
    }
}

// ============================================
// CLASSE CRAYON
// ============================================
class Crayon {
    constructor(canvas) {
        this.canvas = canvas;
        this.x = 0;
        this.y = 0;
        this.angle = -40;
        this.visible = false;
        this.g = this.createGraphics();
        canvas.layerInstruments.appendChild(this.g);
    }

    createGraphics() {
        const g = document.createElementNS(SVG_NS, 'g');
        g.setAttribute('visibility', 'hidden');

        // Corps du crayon
        const body = document.createElementNS(SVG_NS, 'path');
        body.setAttribute('d', 'M0,0 L15,-4.5 L15,4.5 Z M15,-4.5 L97,-4.5 L97,4.5 L15,4.5 Z');
        body.setAttribute('fill', 'url(#crayonGradient)');
        body.setAttribute('stroke', '#333');
        body.setAttribute('stroke-width', '0.5');

        // Mine noire
        const mine = document.createElementNS(SVG_NS, 'path');
        mine.setAttribute('d', 'M0,0 L4,-1.2 L4,1.2 Z');
        mine.setAttribute('fill', '#222');

        // Bout bleu
        const bout = document.createElementNS(SVG_NS, 'circle');
        bout.setAttribute('cx', '97');
        bout.setAttribute('cy', '0');
        bout.setAttribute('r', '4.5');
        bout.setAttribute('fill', '#3498db');

        // Gradient
        const defs = document.createElementNS(SVG_NS, 'defs');
        const gradient = document.createElementNS(SVG_NS, 'linearGradient');
        gradient.setAttribute('id', 'crayonGradient');
        gradient.setAttribute('x1', '0%');
        gradient.setAttribute('y1', '0%');
        gradient.setAttribute('x2', '0%');
        gradient.setAttribute('y2', '100%');
        gradient.innerHTML = `
            <stop offset="0%" style="stop-color:#c0392b"/>
            <stop offset="50%" style="stop-color:#e74c3c"/>
            <stop offset="100%" style="stop-color:#c0392b"/>
        `;
        defs.appendChild(gradient);

        g.appendChild(defs);
        g.appendChild(body);
        g.appendChild(mine);
        g.appendChild(bout);

        return g;
    }

    setPosition(x, y, angle = this.angle) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.g.setAttribute('transform', `translate(${x}, ${y}) rotate(${angle})`);
    }

    show() {
        this.visible = true;
        this.g.setAttribute('visibility', 'visible');
    }

    hide() {
        this.visible = false;
        this.g.setAttribute('visibility', 'hidden');
    }

    async moveTo(x, y, duration = 500) {
        const startX = this.x;
        const startY = this.y;

        await this.canvas.animate(duration, (progress) => {
            const newX = startX + (x - startX) * progress;
            const newY = startY + (y - startY) * progress;
            this.setPosition(newX, newY);
        });
    }
}

// ============================================
// CLASSE REGLE
// ============================================
class Regle {
    constructor(canvas) {
        this.canvas = canvas;
        this.x = 0;
        this.y = 0;
        this.angle = 0;
        this.visible = false;
        this.longueur = 400; // pixels
        this.g = this.createGraphics();
        canvas.layerInstruments.appendChild(this.g);
    }

    createGraphics() {
        const g = document.createElementNS(SVG_NS, 'g');
        g.setAttribute('visibility', 'hidden');

        const larg = 50;

        // Corps de la règle
        const rect = document.createElementNS(SVG_NS, 'rect');
        rect.setAttribute('x', '-10');
        rect.setAttribute('y', '0');
        rect.setAttribute('width', this.longueur + 20);
        rect.setAttribute('height', larg);
        rect.setAttribute('rx', '5');
        rect.setAttribute('fill', 'rgba(200, 210, 230, 0.7)');
        rect.setAttribute('stroke', '#999');
        rect.setAttribute('stroke-width', '1');

        // Ligne de mesure
        const ligne = document.createElementNS(SVG_NS, 'line');
        ligne.setAttribute('x1', '0');
        ligne.setAttribute('y1', '25');
        ligne.setAttribute('x2', this.longueur);
        ligne.setAttribute('y2', '25');
        ligne.setAttribute('stroke', '#666');
        ligne.setAttribute('stroke-width', '1');

        // Graduations
        const graduations = document.createElementNS(SVG_NS, 'g');
        for (let i = 0; i <= this.longueur / 30; i++) {
            const x = i * 30;
            const tick = document.createElementNS(SVG_NS, 'line');
            tick.setAttribute('x1', x);
            tick.setAttribute('y1', '0');
            tick.setAttribute('x2', x);
            tick.setAttribute('y2', i % 1 === 0 ? '12' : '6');
            tick.setAttribute('stroke', '#333');
            tick.setAttribute('stroke-width', '0.5');
            graduations.appendChild(tick);

            if (i % 1 === 0) {
                const text = document.createElementNS(SVG_NS, 'text');
                text.setAttribute('x', x);
                text.setAttribute('y', '22');
                text.setAttribute('text-anchor', 'middle');
                text.setAttribute('font-size', '8');
                text.setAttribute('fill', '#333');
                text.textContent = i;
                graduations.appendChild(text);
            }
        }

        g.appendChild(rect);
        g.appendChild(ligne);
        g.appendChild(graduations);

        return g;
    }

    setPosition(x, y, angle = this.angle) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.g.setAttribute('transform', `translate(${x}, ${y}) rotate(${angle})`);
    }

    show() {
        this.visible = true;
        this.g.setAttribute('visibility', 'visible');
    }

    hide() {
        this.visible = false;
        this.g.setAttribute('visibility', 'hidden');
    }

    async moveTo(x, y, duration = 500) {
        const startX = this.x;
        const startY = this.y;

        await this.canvas.animate(duration, (progress) => {
            const newX = startX + (x - startX) * progress;
            const newY = startY + (y - startY) * progress;
            this.setPosition(newX, newY);
        });
    }

    async rotateTo(angle, duration = 500) {
        const startAngle = this.angle;

        await this.canvas.animate(duration, (progress) => {
            const newAngle = startAngle + (angle - startAngle) * progress;
            this.setPosition(this.x, this.y, newAngle);
        });
    }
}

// ============================================
// CLASSE COMPAS
// ============================================
class Compas {
    constructor(canvas) {
        this.canvas = canvas;
        this.x = 0;
        this.y = 0;
        this.angle = 0;
        this.ecart = 50;
        this.visible = false;
        this.leve = false;
        this.longueurBranche = 150;
        this.g = this.createGraphics();
        canvas.layerInstruments.appendChild(this.g);
    }

    createGraphics() {
        const g = document.createElementNS(SVG_NS, 'g');
        g.setAttribute('visibility', 'hidden');

        // Branche gauche (pointe)
        this.brancheGauche = document.createElementNS(SVG_NS, 'g');
        const pointe = document.createElementNS(SVG_NS, 'path');
        pointe.setAttribute('d', 'M0,0 L0,-15 L-6,-165 L0,-165 L6,-165 L0,-15 Z');
        pointe.setAttribute('fill', '#bbb');
        pointe.setAttribute('stroke', '#666');
        pointe.setAttribute('stroke-width', '0.5');

        const pointeMetal = document.createElementNS(SVG_NS, 'line');
        pointeMetal.setAttribute('x1', '0');
        pointeMetal.setAttribute('y1', '0');
        pointeMetal.setAttribute('x2', '0');
        pointeMetal.setAttribute('y2', '-15');
        pointeMetal.setAttribute('stroke', '#333');
        pointeMetal.setAttribute('stroke-width', '2');

        this.brancheGauche.appendChild(pointe);
        this.brancheGauche.appendChild(pointeMetal);

        // Branche droite (mine)
        this.brancheDroite = document.createElementNS(SVG_NS, 'g');
        const branche = document.createElementNS(SVG_NS, 'path');
        branche.setAttribute('d', 'M0,0 L0,-15 L-6,-165 L0,-165 L6,-165 L0,-15 Z');
        branche.setAttribute('fill', '#bbb');
        branche.setAttribute('stroke', '#666');
        branche.setAttribute('stroke-width', '0.5');

        const mine = document.createElementNS(SVG_NS, 'path');
        mine.setAttribute('d', 'M0,0 L-2,-12 L2,-12 Z');
        mine.setAttribute('fill', '#222');

        this.brancheDroite.appendChild(branche);
        this.brancheDroite.appendChild(mine);

        // Partie haute (chapeau)
        this.haut = document.createElementNS(SVG_NS, 'g');
        const chapeau = document.createElementNS(SVG_NS, 'path');
        chapeau.setAttribute('d', 'M-8,0 L-10,-30 L-5,-50 L0,-60 L5,-50 L10,-30 L8,0 Z');
        chapeau.setAttribute('fill', '#888');
        chapeau.setAttribute('stroke', '#555');
        chapeau.setAttribute('stroke-width', '0.5');
        this.haut.appendChild(chapeau);

        g.appendChild(this.brancheGauche);
        g.appendChild(this.brancheDroite);
        g.appendChild(this.haut);

        this.updateBranches();

        return g;
    }

    updateBranches() {
        const d = this.longueurBranche + 15;
        let ratio = this.ecart / (2 * d);
        if (ratio > 1) ratio = 1;
        const alpha = Math.asin(ratio) * 180 / Math.PI;

        this.brancheGauche.setAttribute('transform', `rotate(${alpha})`);
        this.brancheDroite.setAttribute('transform', `translate(${this.ecart}, 0) rotate(${-alpha})`);

        const hautY = -d * Math.cos(alpha * Math.PI / 180) + 30;
        this.haut.setAttribute('transform', `translate(${this.ecart / 2}, ${hautY})`);
    }

    setPosition(x, y, angle = this.angle) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.g.setAttribute('transform', `translate(${x}, ${y}) rotate(${angle})`);
    }

    setEcart(ecart) {
        this.ecart = ecart;
        this.updateBranches();
    }

    show() {
        this.visible = true;
        this.g.setAttribute('visibility', 'visible');
    }

    hide() {
        this.visible = false;
        this.g.setAttribute('visibility', 'hidden');
    }

    async moveTo(x, y, duration = 500) {
        const startX = this.x;
        const startY = this.y;

        await this.canvas.animate(duration, (progress) => {
            const newX = startX + (x - startX) * progress;
            const newY = startY + (y - startY) * progress;
            this.setPosition(newX, newY);
        });
    }

    async rotateTo(angle, duration = 500) {
        const startAngle = this.angle;
        // Normaliser pour prendre le chemin le plus court
        let diff = angle - startAngle;
        while (diff > 180) diff -= 360;
        while (diff < -180) diff += 360;
        const targetAngle = startAngle + diff;

        await this.canvas.animate(duration, (progress) => {
            const newAngle = startAngle + (targetAngle - startAngle) * progress;
            this.setPosition(this.x, this.y, newAngle);
        });
    }

    async ecarterTo(ecart, duration = 500) {
        const startEcart = this.ecart;

        await this.canvas.animate(duration, (progress) => {
            const newEcart = startEcart + (ecart - startEcart) * progress;
            this.setEcart(newEcart);
        });
    }
}

// ============================================
// FONCTIONS DE DESSIN
// ============================================
class GeoDrawer {
    constructor(canvas) {
        this.canvas = canvas;
    }

    // Créer un point
    createPoint(id, x, y, color = '#e74c3c', radius = 5) {
        const circle = document.createElementNS(SVG_NS, 'circle');
        circle.setAttribute('cx', x);
        circle.setAttribute('cy', y);
        circle.setAttribute('r', radius);
        circle.setAttribute('fill', color);
        circle.setAttribute('stroke', '#fff');
        circle.setAttribute('stroke-width', '1');
        circle.setAttribute('visibility', 'hidden');
        circle.setAttribute('id', `point-${id}`);

        this.canvas.layerPoints.appendChild(circle);
        this.canvas.objects[id] = { type: 'point', x, y, element: circle };

        return circle;
    }

    // Afficher un point avec animation
    async showPoint(id, duration = 200) {
        const point = this.canvas.objects[id];
        if (!point) return;

        const el = point.element;
        el.setAttribute('visibility', 'visible');
        el.setAttribute('r', '0');

        await this.canvas.animate(duration, (progress) => {
            el.setAttribute('r', 5 * progress);
        });
    }

    // Créer un label
    createLabel(id, text, x, y, color = '#333', fontSize = 14) {
        const textEl = document.createElementNS(SVG_NS, 'text');
        textEl.setAttribute('x', x);
        textEl.setAttribute('y', y);
        textEl.setAttribute('fill', color);
        textEl.setAttribute('font-size', fontSize);
        textEl.setAttribute('font-weight', 'bold');
        textEl.setAttribute('font-family', 'Arial, sans-serif');
        textEl.textContent = text;
        textEl.setAttribute('visibility', 'hidden');

        this.canvas.layerLabels.appendChild(textEl);
        this.canvas.objects[`label-${id}`] = { type: 'label', element: textEl };

        return textEl;
    }

    async showLabel(id) {
        const label = this.canvas.objects[`label-${id}`];
        if (label) {
            label.element.setAttribute('visibility', 'visible');
        }
    }

    // Tracer un segment avec animation (le crayon suit)
    async drawSegment(id, x1, y1, x2, y2, color = '#333', strokeWidth = 2, duration = 800) {
        const line = document.createElementNS(SVG_NS, 'line');
        line.setAttribute('x1', x1);
        line.setAttribute('y1', y1);
        line.setAttribute('x2', x1);
        line.setAttribute('y2', y1);
        line.setAttribute('stroke', color);
        line.setAttribute('stroke-width', strokeWidth);
        line.setAttribute('stroke-linecap', 'round');
        line.setAttribute('id', `segment-${id}`);

        this.canvas.layerConstructions.appendChild(line);
        this.canvas.objects[id] = { type: 'segment', x1, y1, x2, y2, element: line };

        // Animation : le segment "grandit" et le crayon suit
        await this.canvas.animate(duration, (progress) => {
            const currentX = x1 + (x2 - x1) * progress;
            const currentY = y1 + (y2 - y1) * progress;
            line.setAttribute('x2', currentX);
            line.setAttribute('y2', currentY);
            this.canvas.crayon.setPosition(currentX, currentY);
        });

        return line;
    }

    // Tracer un arc avec animation
    async drawArc(id, cx, cy, radius, startAngle, endAngle, color = '#3498db', strokeWidth = 2, duration = 600) {
        const path = document.createElementNS(SVG_NS, 'path');
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', color);
        path.setAttribute('stroke-width', strokeWidth);
        path.setAttribute('stroke-linecap', 'round');
        path.setAttribute('id', `arc-${id}`);

        this.canvas.layerConstructions.appendChild(path);

        // Animation de l'arc
        await this.canvas.animate(duration, (progress) => {
            const currentEndAngle = startAngle + (endAngle - startAngle) * progress;
            const d = this.describeArc(cx, cy, radius, startAngle, currentEndAngle);
            path.setAttribute('d', d);
        });

        this.canvas.objects[id] = { type: 'arc', cx, cy, radius, startAngle, endAngle, element: path };

        return path;
    }

    // Helper pour décrire un arc SVG
    // Convention : startAngle vers endAngle, angles en degrés (0° = droite, positif = anti-horaire)
    describeArc(cx, cy, radius, startAngle, endAngle) {
        const start = this.polarToCartesian(cx, cy, radius, startAngle);
        const end = this.polarToCartesian(cx, cy, radius, endAngle);

        // Calcul de l'amplitude de l'arc
        let deltaAngle = endAngle - startAngle;

        // Large arc si > 180°
        const largeArcFlag = Math.abs(deltaAngle) > 180 ? "1" : "0";

        // Sweep flag : 0 = anti-horaire en SVG (ce qui correspond à horaire visuellement car Y inversé)
        // Si deltaAngle > 0 (on va dans le sens anti-horaire math), on veut sweep = 0
        const sweepFlag = deltaAngle > 0 ? "0" : "1";

        return [
            "M", start.x, start.y,
            "A", radius, radius, 0, largeArcFlag, sweepFlag, end.x, end.y
        ].join(" ");
    }

    // Convention : 0° = droite, angles positifs = sens anti-horaire (vers le haut en écran)
    polarToCartesian(cx, cy, radius, angleInDegrees) {
        const angleInRadians = angleInDegrees * Math.PI / 180;
        return {
            x: cx + radius * Math.cos(angleInRadians),
            y: cy - radius * Math.sin(angleInRadians)  // Moins car Y inversé en SVG
        };
    }

    // Tracer la corde (segment entre deux points sur un arc)
    async drawChord(id, cx, cy, radius, angle1, angle2, color = '#f39c12', strokeWidth = 3, duration = 400) {
        const p1 = this.polarToCartesian(cx, cy, radius, angle1);
        const p2 = this.polarToCartesian(cx, cy, radius, angle2);

        return await this.drawSegment(id, p1.x, p1.y, p2.x, p2.y, color, strokeWidth, duration);
    }
}

// ============================================
// AFFICHAGE DES ÉTAPES
// ============================================
function updateStep(title, description) {
    document.getElementById('stepTitle').textContent = title;
    document.getElementById('stepDescription').textContent = description;
}

// Export global
window.GeoCanvas = GeoCanvas;
window.GeoDrawer = GeoDrawer;
window.updateStep = updateStep;
