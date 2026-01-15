/**
 * Théâtre d'Épidaure v2 - Construction à la règle et au compas
 *
 * Approche pédagogique :
 * 1. Tracer TOUS les rayons avec le report d'angle (méthode connue de l'élève)
 * 2. Tous les rayons vont de l'orchestre jusqu'en haut
 * 3. Gommer la partie inférieure d'un rayon sur deux
 *
 * Résultat : zone inférieure avec rayons espacés, zone supérieure avec tous les rayons
 */

// Configuration - Proportions fidèles au vrai théâtre (v8)
// Rayons horizontaux (0° et 180°) toujours complets
const CONFIG = {
    centerX: 375,
    centerY: 580,               // Centre plus bas pour voir toute la construction
    baseAngle: 10,              // Plus de rayons
    extraAngles: 2,             // Nombre d'angles au-delà de l'horizontale de chaque côté

    // Orchestre (cercle complet)
    orchestraRadius: 50,

    // Zone inférieure (koilon inférieur) - ~32 rangées
    zone1Start: 58,
    zone1Rows: 32,
    zone1Step: 4,               // Espacement serré

    // Diazoma (couloir = ~2-3 rangées d'épaisseur)
    diazomaWidth: 12,

    // Zone supérieure (koilon supérieur) - ~22 rangées (ratio 1.5:1)
    zone2Rows: 22,
    zone2Step: 4,               // Même espacement

    // Couleurs
    orchestraColor: '#2196f3',
    zone1Color: '#5d4e37',
    zone2Color: '#7a6a54',
    mainArcColor: '#2c3e50',
    rayColor: '#2c3e50',
    chordColor: '#e74c3c'
};

// État global
let currentMode = 'animation';
let canvas, drawer;
let svg, layerConstruction, layerFinal;
let steps = [];
let currentStep = 0;
let isAnimating = false;

// Zoom
let zoomGroup = null;
let currentZoom = 1.3;
const ZOOM_START = 1.3;
const ZOOM_END = 0.75;
let autoZoomEnabled = true;

// Données calculées
let O, outerRadius, diazomaStart, zone2Start;

// ============================================
// INITIALISATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    initConfig();
    buildSteps();
    initModeAnimation();
    initModeExploration();
    initModeSwitch();
    showMode('animation');
});

function initConfig() {
    O = { x: CONFIG.centerX, y: CONFIG.centerY };

    // Zone 1 : fin
    CONFIG.zone1End = CONFIG.zone1Start + (CONFIG.zone1Rows - 1) * CONFIG.zone1Step;

    // Diazoma : entre zone 1 et zone 2
    diazomaStart = CONFIG.zone1End;
    zone2Start = CONFIG.zone1End + CONFIG.diazomaWidth;

    // Zone 2 : fin
    CONFIG.zone2End = zone2Start + (CONFIG.zone2Rows - 1) * CONFIG.zone2Step;

    // Rayon extérieur
    outerRadius = CONFIG.zone2End;
}

// ============================================
// GESTION DES MODES
// ============================================
function initModeSwitch() {
    document.getElementById('tabAnimation').addEventListener('click', () => showMode('animation'));
    document.getElementById('tabExploration').addEventListener('click', () => showMode('exploration'));
}

function showMode(mode) {
    currentMode = mode;

    document.getElementById('tabAnimation').classList.toggle('active', mode === 'animation');
    document.getElementById('tabExploration').classList.toggle('active', mode === 'exploration');
    document.getElementById('panelAnimation').classList.toggle('active', mode === 'animation');
    document.getElementById('panelExploration').classList.toggle('active', mode === 'exploration');

    const svgEl = document.getElementById('canvas');
    svgEl.innerHTML = '';

    if (mode === 'animation') {
        setupAnimationMode();
    } else {
        setupExplorationMode();
    }
}

// ============================================
// MODE ANIMATION
// ============================================
function initModeAnimation() {
    document.getElementById('btnPlay').addEventListener('click', startAnimation);
    document.getElementById('btnPause').addEventListener('click', togglePauseAnimation);
    document.getElementById('btnReset').addEventListener('click', resetAnimation);

    document.getElementById('speedSlider').addEventListener('input', (e) => {
        const speed = parseFloat(e.target.value);
        document.getElementById('speedValue').textContent = speed + 'x';
        if (canvas) canvas.speed = speed;
    });

    document.getElementById('zoomSlider').addEventListener('input', (e) => {
        const zoom = parseFloat(e.target.value);
        document.getElementById('zoomValue').textContent = 'x' + zoom.toFixed(1);

        if (autoZoomEnabled) {
            autoZoomEnabled = false;
        }

        if (zoomGroup) {
            currentZoom = zoom;
            applyZoom(zoom, false);
        }
    });
}

function setupAnimationMode() {
    canvas = new GeoCanvas('canvas');
    drawer = new GeoDrawer(canvas);
    canvas.speed = parseFloat(document.getElementById('speedSlider').value);

    zoomGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    zoomGroup.setAttribute('id', 'zoomGroup');

    const layers = [
        canvas.layerConstructions,
        canvas.layerPoints,
        canvas.layerInstruments,
        canvas.layerLabels
    ];
    for (const layer of layers) {
        zoomGroup.appendChild(layer);
    }
    canvas.svg.appendChild(zoomGroup);

    currentZoom = ZOOM_START;
    applyZoom(currentZoom);

    updateStepInfo('Pret', 'Cliquez sur "Lancer l\'animation" pour construire le theatre d\'Epidaure.');
}

function applyZoom(scale, updateSlider = true) {
    if (!zoomGroup) return;

    const svgWidth = canvas.width;
    const svgHeight = canvas.height;

    const cx = svgWidth / 2;
    const cy = svgHeight / 2 - 50;

    const translateX = cx - O.x * scale;
    const translateY = cy - O.y * scale;

    zoomGroup.setAttribute('transform', `translate(${translateX}, ${translateY}) scale(${scale})`);

    if (updateSlider) {
        const zoomSlider = document.getElementById('zoomSlider');
        const zoomValue = document.getElementById('zoomValue');
        if (zoomSlider && zoomValue) {
            zoomSlider.value = scale;
            zoomValue.textContent = 'x' + scale.toFixed(1);
        }
    }
}

async function animateZoomTo(targetZoom, duration = 800) {
    if (!autoZoomEnabled) return;
    if (!canvas || !zoomGroup) return;

    const startZoom = currentZoom;
    const startTime = performance.now();

    return new Promise(resolve => {
        function step(now) {
            if (!autoZoomEnabled) {
                resolve();
                return;
            }

            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);

            currentZoom = startZoom + (targetZoom - startZoom) * eased;
            applyZoom(currentZoom);

            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                currentZoom = targetZoom;
                resolve();
            }
        }
        requestAnimationFrame(step);
    });
}

async function startAnimation() {
    if (isAnimating && canvas.isPaused) {
        canvas.resume();
        document.getElementById('btnPause').textContent = 'Pause';
        return;
    }

    if (isAnimating) return;

    isAnimating = true;
    autoZoomEnabled = true;
    document.getElementById('btnPlay').textContent = 'En cours...';
    document.getElementById('btnPlay').classList.add('playing');

    canvas.clear();
    currentZoom = ZOOM_START;
    applyZoom(currentZoom);

    await buildEpidaureAnimated();

    isAnimating = false;
    document.getElementById('btnPlay').textContent = 'Lancer l\'animation';
    document.getElementById('btnPlay').classList.remove('playing');
}

function togglePauseAnimation() {
    if (!isAnimating) return;

    if (canvas.isPaused) {
        canvas.resume();
        document.getElementById('btnPause').textContent = 'Pause';
    } else {
        canvas.pause();
        document.getElementById('btnPause').textContent = 'Reprendre';
    }
}

function resetAnimation() {
    if (canvas) {
        canvas.stop();
    }
    isAnimating = false;
    autoZoomEnabled = true;

    const svgEl = document.getElementById('canvas');
    svgEl.innerHTML = '';

    setupAnimationMode();

    document.getElementById('btnPlay').textContent = 'Lancer l\'animation';
    document.getElementById('btnPlay').classList.remove('playing');
    document.getElementById('btnPause').textContent = 'Pause';
    updateStepInfo('Pret', 'Cliquez sur "Lancer l\'animation" pour construire le theatre d\'Epidaure.');
}

// ============================================
// CONSTRUCTION ANIMÉE
// ============================================
async function buildEpidaureAnimated() {
    const tempElements = [];
    // Les rayons dépassent l'horizontale de chaque côté
    const minAngle = 0 - CONFIG.extraAngles * CONFIG.baseAngle;
    const maxAngle = 180 + CONFIG.extraAngles * CONFIG.baseAngle;

    // ========================================
    // ÉTAPE 1 : Centre O
    // ========================================
    updateStepInfo('Centre O', 'On place le centre O du theatre.');
    await canvas.wait(500);

    drawer.createPoint('O', O.x, O.y, '#2c3e50', 6);
    await drawer.showPoint('O', 400);
    drawer.createLabel('O', 'O', O.x + 10, O.y + 5);
    await drawer.showLabel('O');
    await canvas.wait(400);

    // ========================================
    // ÉTAPE 2 : Orchestre
    // ========================================
    updateStepInfo('Orchestre', 'On trace le cercle de l\'orchestre.');
    await canvas.wait(400);

    canvas.compas.setEcart(CONFIG.orchestraRadius);
    canvas.compas.setPosition(O.x, O.y, -90);
    canvas.compas.show();
    await canvas.wait(300);

    // Cercle complet pour l'orchestre
    await drawer.drawArc('orchestra', O.x, O.y, CONFIG.orchestraRadius, 0, 359.9, CONFIG.orchestraColor, 2.5, 800);

    canvas.compas.hide();
    await canvas.wait(400);

    // ========================================
    // ÉTAPE 3 : Arc extérieur (limite du théâtre)
    // ========================================
    updateStepInfo('Arc exterieur', 'On trace l\'arc qui marque la limite exterieure du theatre.');
    await canvas.wait(400);

    canvas.compas.setPosition(O.x, O.y, -90);
    canvas.compas.show();
    canvas.compas.setEcart(outerRadius);
    await canvas.wait(200);
    await drawer.drawArc('arcOuter', O.x, O.y, outerRadius, minAngle, maxAngle, CONFIG.mainArcColor, 3, 600);

    canvas.compas.hide();
    await canvas.wait(400);

    // ========================================
    // ÉTAPE 4 : Premier rayon vertical (90°)
    // ========================================
    updateStepInfo('Premier rayon', 'On trace le premier rayon vertical (axe de symetrie).');
    await canvas.wait(400);

    const ray90Start = pointOnCircle(O.x, O.y, CONFIG.orchestraRadius, 90);
    const ray90End = pointOnCircle(O.x, O.y, outerRadius, 90);

    canvas.regle.setPosition(O.x, O.y - 25, -90);
    canvas.regle.show();
    await canvas.wait(300);

    canvas.crayon.setPosition(ray90Start.x, ray90Start.y);
    canvas.crayon.show();
    await drawer.drawSegment('ray_90', ray90Start.x, ray90Start.y, ray90End.x, ray90End.y, CONFIG.rayColor, 2, 500);

    canvas.regle.hide();
    canvas.crayon.hide();
    await canvas.wait(400);

    // ========================================
    // ÉTAPE 5 : Arc de construction pour report d'angle
    // ========================================
    updateStepInfo('Arc de report', 'On trace un arc pour le report d\'angle.');
    await canvas.wait(400);

    const constructionRadius = CONFIG.zone1Start;
    canvas.compas.setEcart(constructionRadius);
    canvas.compas.setPosition(O.x, O.y, -90);
    canvas.compas.show();
    await canvas.wait(300);

    await drawer.drawArc('constructionArc', O.x, O.y, constructionRadius, minAngle, maxAngle, CONFIG.chordColor, 1.5, 800);
    tempElements.push(canvas.objects['constructionArc'].element);

    const P90 = pointOnCircle(O.x, O.y, constructionRadius, 90);
    drawer.createPoint('P90', P90.x, P90.y, '#000', 4);
    await drawer.showPoint('P90', 200);
    tempElements.push(canvas.objects['P90'].element);

    canvas.compas.hide();
    await canvas.wait(300);

    // ========================================
    // ÉTAPE 6 : Deuxième rayon + corde
    // ========================================
    updateStepInfo('Angle de base', 'On trace le deuxieme rayon et on memorise la corde.');
    await canvas.wait(400);

    const angle2 = 90 + CONFIG.baseAngle;
    const ray2Start = pointOnCircle(O.x, O.y, CONFIG.orchestraRadius, angle2);
    const ray2End = pointOnCircle(O.x, O.y, outerRadius, angle2);

    canvas.regle.setPosition(O.x, O.y - 25, -angle2);
    canvas.regle.show();
    await canvas.wait(200);

    canvas.crayon.setPosition(ray2Start.x, ray2Start.y);
    canvas.crayon.show();
    await drawer.drawSegment(`ray_${angle2}`, ray2Start.x, ray2Start.y, ray2End.x, ray2End.y, CONFIG.rayColor, 2, 400);

    const P2 = pointOnCircle(O.x, O.y, constructionRadius, angle2);
    drawer.createPoint(`P${angle2}`, P2.x, P2.y, '#000', 4);
    await drawer.showPoint(`P${angle2}`, 200);
    tempElements.push(canvas.objects[`P${angle2}`].element);

    canvas.regle.hide();
    canvas.crayon.hide();

    // Corde
    await drawer.drawSegment('chord1', P90.x, P90.y, P2.x, P2.y, CONFIG.chordColor, 2.5, 400);
    tempElements.push(canvas.objects['chord1'].element);

    await canvas.wait(400);

    // ========================================
    // ÉTAPE 7 : Mémoriser la corde
    // ========================================
    updateStepInfo('Memoriser la corde', 'Le compas memorise la longueur de la corde.');
    await canvas.wait(400);

    const chordLen = distance(P90, P2);

    canvas.compas.setEcart(10);
    canvas.compas.setPosition(P90.x, P90.y, Math.atan2(P90.y - P2.y, P2.x - P90.x) * 180 / Math.PI);
    canvas.compas.show();
    await canvas.wait(300);

    await canvas.compas.ecarterTo(chordLen, 800);
    await canvas.wait(500);

    // ========================================
    // ÉTAPE 8 : Tous les rayons vers la gauche (COMPLETS)
    // ========================================
    updateStepInfo('Reports a gauche', 'On reporte l\'angle vers la gauche - tous les rayons sont COMPLETS.');
    await canvas.wait(400);

    let prevPoint = P2;
    const allAngles = [90, angle2];

    for (let angle = 90 + 2 * CONFIG.baseAngle; angle <= maxAngle; angle += CONFIG.baseAngle) {
        const progress = (angle - 90) / 90;
        animateZoomTo(ZOOM_START + (1.0 - ZOOM_START) * progress * 0.5, 300);

        const newPoint = pointOnCircle(O.x, O.y, constructionRadius, angle);

        // Arc de report
        await canvas.compas.moveTo(prevPoint.x, prevPoint.y, 200);
        const angleToNew = Math.atan2(-(newPoint.y - prevPoint.y), newPoint.x - prevPoint.x) * 180 / Math.PI;
        await canvas.compas.rotateTo(angleToNew - 90, 150);

        await drawer.drawArc(`reportL_${angle}`, prevPoint.x, prevPoint.y, chordLen,
            angleToNew - 20, angleToNew + 20, CONFIG.chordColor, 1.5, 200);
        tempElements.push(canvas.objects[`reportL_${angle}`].element);

        canvas.compas.hide();

        // Rayon COMPLET (de l'orchestre jusqu'en haut)
        const rayStart = pointOnCircle(O.x, O.y, CONFIG.orchestraRadius, angle);
        const rayEnd = pointOnCircle(O.x, O.y, outerRadius, angle);

        canvas.regle.setPosition(O.x, O.y - 25, -angle);
        canvas.regle.show();
        await canvas.wait(100);

        canvas.crayon.setPosition(rayStart.x, rayStart.y);
        canvas.crayon.show();
        await drawer.drawSegment(`ray_${angle}`, rayStart.x, rayStart.y, rayEnd.x, rayEnd.y, CONFIG.rayColor, 2, 250);

        drawer.createPoint(`P${angle}`, newPoint.x, newPoint.y, '#000', 4);
        await drawer.showPoint(`P${angle}`, 100);
        tempElements.push(canvas.objects[`P${angle}`].element);

        canvas.regle.hide();
        canvas.crayon.hide();
        canvas.compas.show();

        allAngles.push(angle);
        prevPoint = newPoint;
        await canvas.wait(80);
    }

    // ========================================
    // ÉTAPE 9 : Tous les rayons vers la droite (COMPLETS)
    // ========================================
    updateStepInfo('Reports a droite', 'On reporte l\'angle vers la droite - tous les rayons sont COMPLETS.');
    await canvas.wait(400);

    prevPoint = P90;

    for (let angle = 90 - CONFIG.baseAngle; angle >= minAngle; angle -= CONFIG.baseAngle) {
        const newPoint = pointOnCircle(O.x, O.y, constructionRadius, angle);

        // Arc de report
        await canvas.compas.moveTo(prevPoint.x, prevPoint.y, 200);
        const angleToNew = Math.atan2(-(newPoint.y - prevPoint.y), newPoint.x - prevPoint.x) * 180 / Math.PI;
        await canvas.compas.rotateTo(angleToNew - 90, 150);

        await drawer.drawArc(`reportR_${angle}`, prevPoint.x, prevPoint.y, chordLen,
            angleToNew - 20, angleToNew + 20, CONFIG.chordColor, 1.5, 200);
        tempElements.push(canvas.objects[`reportR_${angle}`].element);

        canvas.compas.hide();

        // Rayon COMPLET
        const rayStart = pointOnCircle(O.x, O.y, CONFIG.orchestraRadius, angle);
        const rayEnd = pointOnCircle(O.x, O.y, outerRadius, angle);

        canvas.regle.setPosition(O.x, O.y - 25, -angle);
        canvas.regle.show();
        await canvas.wait(100);

        canvas.crayon.setPosition(rayStart.x, rayStart.y);
        canvas.crayon.show();
        await drawer.drawSegment(`ray_${angle}`, rayStart.x, rayStart.y, rayEnd.x, rayEnd.y, CONFIG.rayColor, 2, 250);

        drawer.createPoint(`P${angle}`, newPoint.x, newPoint.y, '#000', 4);
        await drawer.showPoint(`P${angle}`, 100);
        tempElements.push(canvas.objects[`P${angle}`].element);

        canvas.regle.hide();
        canvas.crayon.hide();
        canvas.compas.show();

        allAngles.push(angle);
        prevPoint = newPoint;
        await canvas.wait(80);
    }

    canvas.compas.hide();
    await canvas.wait(500);

    // ========================================
    // ÉTAPE 10 : Arc du diazoma
    // ========================================
    await animateZoomTo(0.95, 600);

    updateStepInfo('Arc du diazoma', 'On trace l\'arc du diazoma (couloir entre les deux zones).');
    await canvas.wait(400);

    canvas.compas.setPosition(O.x, O.y, -90);
    canvas.compas.show();
    canvas.compas.setEcart(diazomaStart);
    await canvas.wait(200);
    await drawer.drawArc('arcDiazoma', O.x, O.y, diazomaStart, minAngle, maxAngle, CONFIG.mainArcColor, 3, 500);

    canvas.compas.hide();
    await canvas.wait(400);

    // ========================================
    // ÉTAPE 11 : GOMMAGE - effacer la partie inférieure d'un rayon sur deux
    // ========================================
    updateStepInfo('Gommage', 'On efface la partie INFERIEURE d\'un rayon sur deux.');
    await canvas.wait(600);

    // Trier les angles
    allAngles.sort((a, b) => a - b);

    // Gommer un rayon sur deux dans la zone inférieure
    for (let i = 0; i < allAngles.length; i++) {
        const angle = allAngles[i];

        // Calculer l'index depuis le centre (90°)
        const indexFromCenter = Math.round(Math.abs(angle - 90) / CONFIG.baseAngle);

        // Les rayons horizontaux (0° et 180°) restent toujours complets
        const isHorizontal = (angle === 0 || angle === 180);

        // Gommer les rayons d'index impair (1, 3, 5...) SAUF les horizontaux
        if (indexFromCenter % 2 === 1 && !isHorizontal) {
            const eraseStart = pointOnCircle(O.x, O.y, CONFIG.orchestraRadius - 2, angle);
            const eraseEnd = pointOnCircle(O.x, O.y, diazomaStart + 2, angle);

            // Ligne blanche pour "gommer"
            const eraseLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            eraseLine.setAttribute('x1', eraseStart.x);
            eraseLine.setAttribute('y1', eraseStart.y);
            eraseLine.setAttribute('x2', eraseEnd.x);
            eraseLine.setAttribute('y2', eraseEnd.y);
            eraseLine.setAttribute('stroke', '#ffffff');
            eraseLine.setAttribute('stroke-width', '6');
            eraseLine.setAttribute('stroke-linecap', 'round');
            canvas.layerConstructions.appendChild(eraseLine);

            await canvas.wait(80);
        }
    }

    await canvas.wait(500);

    // ========================================
    // ÉTAPE 12 : Rangées zone inférieure
    // ========================================
    updateStepInfo('Rangees zone inferieure', 'On trace les arcs des rangees de la zone inferieure.');
    await canvas.wait(400);

    canvas.compas.setPosition(O.x, O.y, -90);
    canvas.compas.show();

    for (let k = 0; k < CONFIG.zone1Rows; k++) {
        const rowRadius = CONFIG.zone1Start + k * CONFIG.zone1Step;
        if (rowRadius < diazomaStart) {
            canvas.compas.setEcart(rowRadius);
            await canvas.wait(60);
            await drawer.drawArc(`rowZ1_${k}`, O.x, O.y, rowRadius, minAngle, maxAngle, CONFIG.zone1Color, 1.5, 180);
        }
    }

    canvas.compas.hide();
    await canvas.wait(400);

    // ========================================
    // ÉTAPE 13 : Arc début zone supérieure
    // ========================================
    updateStepInfo('Zone superieure', 'On trace la limite de la zone superieure.');
    await canvas.wait(400);

    canvas.compas.setPosition(O.x, O.y, -90);
    canvas.compas.show();
    canvas.compas.setEcart(zone2Start);
    await canvas.wait(200);
    await drawer.drawArc('arcZone2Start', O.x, O.y, zone2Start, minAngle, maxAngle, CONFIG.mainArcColor, 3, 400);

    canvas.compas.hide();
    await canvas.wait(400);

    // ========================================
    // ÉTAPE 14 : Rangées zone supérieure
    // ========================================
    updateStepInfo('Rangees zone superieure', 'On trace les arcs des rangees de la zone superieure.');
    await canvas.wait(400);

    canvas.compas.setPosition(O.x, O.y, -90);
    canvas.compas.show();

    for (let k = 1; k < CONFIG.zone2Rows; k++) {
        const rowRadius = zone2Start + k * CONFIG.zone2Step;
        if (rowRadius < outerRadius) {
            canvas.compas.setEcart(rowRadius);
            await canvas.wait(60);
            await drawer.drawArc(`rowZ2_${k}`, O.x, O.y, rowRadius, minAngle, maxAngle, CONFIG.zone2Color, 1.5, 180);
        }
    }

    canvas.compas.hide();
    await canvas.wait(400);

    // ========================================
    // NETTOYAGE
    // ========================================
    updateStepInfo('Nettoyage', 'On efface les constructions auxiliaires.');
    await canvas.wait(400);

    for (const el of tempElements) {
        if (el) {
            el.style.transition = 'opacity 0.5s';
            el.style.opacity = '0';
        }
    }

    const pointO = canvas.objects['O'];
    const labelO = canvas.objects['label-O'];
    if (pointO && pointO.element) {
        pointO.element.style.transition = 'opacity 0.5s';
        pointO.element.style.opacity = '0';
    }
    if (labelO && labelO.element) {
        labelO.element.style.transition = 'opacity 0.5s';
        labelO.element.style.opacity = '0';
    }

    await canvas.wait(600);

    for (const el of tempElements) {
        if (el && el.parentNode) el.remove();
    }
    if (pointO && pointO.element && pointO.element.parentNode) pointO.element.remove();
    if (labelO && labelO.element && labelO.element.parentNode) labelO.element.remove();

    // ========================================
    // FIN
    // ========================================
    await animateZoomTo(ZOOM_END, 800);

    updateStepInfo('Theatre termine !', 'Zone inferieure : rayons espaces. Zone superieure : tous les rayons (double densite).');

    // Confettis
    const svgWidth = canvas.width;
    const confettiColors = ['#e91e63', '#9c27b0', '#4caf50', '#ff9800', '#2196f3', '#f44336'];
    const confettis = [];

    for (let i = 0; i < 35; i++) {
        const confetti = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        const x = Math.random() * svgWidth;
        const y = -20 - Math.random() * 60;
        confetti.setAttribute('x', x);
        confetti.setAttribute('y', y);
        confetti.setAttribute('width', 8 + Math.random() * 5);
        confetti.setAttribute('height', 5 + Math.random() * 4);
        confetti.setAttribute('fill', confettiColors[Math.floor(Math.random() * confettiColors.length)]);
        confetti.setAttribute('rx', '2');
        canvas.svg.appendChild(confetti);

        confettis.push({
            el: confetti, x, y,
            speedY: 2 + Math.random() * 2,
            speedX: (Math.random() - 0.5) * 1.5,
            rot: Math.random() * 360,
            rotSpeed: (Math.random() - 0.5) * 8
        });
    }

    const startTime = performance.now();
    const animConfetti = () => {
        const elapsed = performance.now() - startTime;
        if (elapsed < 3000) {
            for (const c of confettis) {
                c.y += c.speedY;
                c.x += c.speedX + Math.sin(elapsed / 200) * 0.3;
                c.rot += c.rotSpeed;
                c.el.setAttribute('x', c.x);
                c.el.setAttribute('y', c.y);
                c.el.setAttribute('transform', `rotate(${c.rot}, ${c.x + 4}, ${c.y + 3})`);
                if (elapsed > 2000) {
                    c.el.setAttribute('opacity', 1 - (elapsed - 2000) / 1000);
                }
            }
            requestAnimationFrame(animConfetti);
        } else {
            confettis.forEach(c => c.el.remove());
        }
    };
    requestAnimationFrame(animConfetti);
}

// ============================================
// MODE EXPLORATION
// ============================================
function initModeExploration() {
    document.getElementById('timeline').addEventListener('input', (e) => {
        goToStep(parseInt(e.target.value));
    });
    document.getElementById('btnPrev').addEventListener('click', () => goToStep(currentStep - 1));
    document.getElementById('btnNext').addEventListener('click', () => goToStep(currentStep + 1));
    document.getElementById('btnResetExplore').addEventListener('click', () => goToStep(0));
}

function setupExplorationMode() {
    svg = document.getElementById('canvas');

    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bg.setAttribute('width', '100%');
    bg.setAttribute('height', '100%');
    bg.setAttribute('fill', '#fafafa');
    svg.appendChild(bg);

    layerConstruction = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    svg.appendChild(layerConstruction);

    layerFinal = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    svg.appendChild(layerFinal);

    document.getElementById('timeline').setAttribute('max', steps.length - 1);
    document.getElementById('timeline').value = 0;
    currentStep = 0;

    renderStep(0);
    updateExplorationUI();
}

function goToStep(idx) {
    if (idx < 0) idx = 0;
    if (idx >= steps.length) idx = steps.length - 1;
    currentStep = idx;
    renderStep(currentStep);
    updateExplorationUI();
}

function updateExplorationUI() {
    document.getElementById('timeline').value = currentStep;
    document.getElementById('stepCounter').textContent = `${currentStep + 1} / ${steps.length}`;
    document.getElementById('btnPrev').disabled = currentStep === 0;
    document.getElementById('btnNext').disabled = currentStep === steps.length - 1;
    updateStepInfo(steps[currentStep].title, steps[currentStep].description);
}

function renderStep(idx) {
    layerConstruction.innerHTML = '';
    layerFinal.innerHTML = '';
    for (let i = 0; i <= idx; i++) {
        steps[i].render(i === idx);
    }
}

// ============================================
// DÉFINITION DES ÉTAPES (EXPLORATION)
// ============================================
function buildSteps() {
    steps = [];
    // Les rayons dépassent l'horizontale de chaque côté
    const minAngle = 0 - CONFIG.extraAngles * CONFIG.baseAngle;
    const maxAngle = 180 + CONFIG.extraAngles * CONFIG.baseAngle;

    steps.push({
        title: 'Centre O',
        description: 'On place le centre O du theatre.',
        render: () => {
            drawPoint(O.x, O.y, '#2c3e50', 6);
            drawLabel('O', O.x + 10, O.y + 5);
        }
    });

    steps.push({
        title: 'Orchestre',
        description: 'On trace le cercle de l\'orchestre.',
        render: () => {
            drawCircle(O.x, O.y, CONFIG.orchestraRadius, CONFIG.orchestraColor, 2.5);
        }
    });

    steps.push({
        title: 'Arc exterieur',
        description: 'Limite exterieure du theatre.',
        render: () => {
            drawArc(O.x, O.y, outerRadius, minAngle, maxAngle, CONFIG.mainArcColor, 3);
        }
    });

    // Tous les rayons COMPLETS
    for (let angle = minAngle; angle <= maxAngle; angle += CONFIG.baseAngle) {
        steps.push({
            title: `Rayon ${angle}°`,
            description: `Rayon COMPLET a ${angle}° (de l'orchestre au bord exterieur).`,
            render: () => {
                const start = pointOnCircle(O.x, O.y, CONFIG.orchestraRadius, angle);
                const end = pointOnCircle(O.x, O.y, outerRadius, angle);
                drawSegment(start.x, start.y, end.x, end.y, CONFIG.rayColor, 2);
            }
        });
    }

    steps.push({
        title: 'Arc du diazoma',
        description: 'On trace le diazoma (couloir entre les deux zones).',
        render: () => {
            drawArc(O.x, O.y, diazomaStart, minAngle, maxAngle, CONFIG.mainArcColor, 3);
        }
    });

    steps.push({
        title: 'Gommage',
        description: 'On efface la partie INFERIEURE d\'un rayon sur deux.',
        render: () => {
            // Redessiner les rayons avec le gommage appliqué
            for (let angle = minAngle; angle <= maxAngle; angle += CONFIG.baseAngle) {
                const indexFromCenter = Math.round(Math.abs(angle - 90) / CONFIG.baseAngle);
                const isHorizontal = (angle === 0 || angle === 180);
                const isErased = indexFromCenter % 2 === 1 && !isHorizontal;

                if (isErased) {
                    // Rayon partiel : seulement zone supérieure
                    const start = pointOnCircle(O.x, O.y, diazomaStart, angle);
                    const end = pointOnCircle(O.x, O.y, outerRadius, angle);
                    drawSegment(start.x, start.y, end.x, end.y, CONFIG.rayColor, 2);
                } else {
                    // Rayon complet (incluant les horizontaux 0° et 180°)
                    const start = pointOnCircle(O.x, O.y, CONFIG.orchestraRadius, angle);
                    const end = pointOnCircle(O.x, O.y, outerRadius, angle);
                    drawSegment(start.x, start.y, end.x, end.y, CONFIG.rayColor, 2);
                }
            }
        }
    });

    steps.push({
        title: 'Rangees zone inferieure',
        description: 'Arcs des rangees de la zone inferieure.',
        render: () => {
            for (let k = 0; k < CONFIG.zone1Rows; k++) {
                const rowRadius = CONFIG.zone1Start + k * CONFIG.zone1Step;
                if (rowRadius < diazomaStart) {
                    drawArc(O.x, O.y, rowRadius, minAngle, maxAngle, CONFIG.zone1Color, 1.5);
                }
            }
        }
    });

    steps.push({
        title: 'Zone superieure',
        description: 'Limite et rangees de la zone superieure.',
        render: () => {
            drawArc(O.x, O.y, zone2Start, minAngle, maxAngle, CONFIG.mainArcColor, 3);
            for (let k = 1; k < CONFIG.zone2Rows; k++) {
                const rowRadius = zone2Start + k * CONFIG.zone2Step;
                if (rowRadius < outerRadius) {
                    drawArc(O.x, O.y, rowRadius, minAngle, maxAngle, CONFIG.zone2Color, 1.5);
                }
            }
        }
    });

    steps.push({
        title: 'Theatre termine',
        description: 'Zone inferieure : rayons espaces. Zone superieure : tous les rayons.',
        render: () => {
            // Orchestre (cercle complet)
            drawCircleFinal(O.x, O.y, CONFIG.orchestraRadius, CONFIG.orchestraColor, 2.5);

            // Rayons avec gommage
            for (let angle = minAngle; angle <= maxAngle; angle += CONFIG.baseAngle) {
                const indexFromCenter = Math.round(Math.abs(angle - 90) / CONFIG.baseAngle);
                const isHorizontal = (angle === 0 || angle === 180);
                const isErased = indexFromCenter % 2 === 1 && !isHorizontal;

                if (isErased) {
                    const start = pointOnCircle(O.x, O.y, diazomaStart, angle);
                    const end = pointOnCircle(O.x, O.y, outerRadius, angle);
                    drawSegmentFinal(start.x, start.y, end.x, end.y, CONFIG.rayColor, 2);
                } else {
                    const start = pointOnCircle(O.x, O.y, CONFIG.orchestraRadius, angle);
                    const end = pointOnCircle(O.x, O.y, outerRadius, angle);
                    drawSegmentFinal(start.x, start.y, end.x, end.y, CONFIG.rayColor, 2);
                }
            }

            // Zone inférieure
            for (let k = 0; k < CONFIG.zone1Rows; k++) {
                const rowRadius = CONFIG.zone1Start + k * CONFIG.zone1Step;
                if (rowRadius < diazomaStart) {
                    drawArcFinal(O.x, O.y, rowRadius, minAngle, maxAngle, CONFIG.zone1Color, 1.5);
                }
            }
            drawArcFinal(O.x, O.y, diazomaStart, minAngle, maxAngle, CONFIG.mainArcColor, 3);

            // Zone supérieure
            drawArcFinal(O.x, O.y, zone2Start, minAngle, maxAngle, CONFIG.mainArcColor, 3);
            for (let k = 1; k < CONFIG.zone2Rows; k++) {
                const rowRadius = zone2Start + k * CONFIG.zone2Step;
                if (rowRadius < outerRadius) {
                    drawArcFinal(O.x, O.y, rowRadius, minAngle, maxAngle, CONFIG.zone2Color, 1.5);
                }
            }
            drawArcFinal(O.x, O.y, outerRadius, minAngle, maxAngle, CONFIG.mainArcColor, 3);
        }
    });
}

// ============================================
// FONCTIONS DE DESSIN
// ============================================
function drawSegment(x1, y1, x2, y2, color, width) {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1);
    line.setAttribute('y1', y1);
    line.setAttribute('x2', x2);
    line.setAttribute('y2', y2);
    line.setAttribute('stroke', color);
    line.setAttribute('stroke-width', width);
    line.setAttribute('stroke-linecap', 'round');
    layerConstruction.appendChild(line);
}

function drawSegmentFinal(x1, y1, x2, y2, color, width) {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1);
    line.setAttribute('y1', y1);
    line.setAttribute('x2', x2);
    line.setAttribute('y2', y2);
    line.setAttribute('stroke', color);
    line.setAttribute('stroke-width', width);
    line.setAttribute('stroke-linecap', 'round');
    layerFinal.appendChild(line);
}

function drawPoint(x, y, color, r) {
    const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    c.setAttribute('cx', x);
    c.setAttribute('cy', y);
    c.setAttribute('r', r);
    c.setAttribute('fill', color);
    layerConstruction.appendChild(c);
}

function drawLabel(text, x, y) {
    const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    t.setAttribute('x', x);
    t.setAttribute('y', y);
    t.setAttribute('fill', '#333');
    t.setAttribute('font-size', '14');
    t.setAttribute('font-weight', 'bold');
    t.setAttribute('font-family', 'Arial, sans-serif');
    t.textContent = text;
    layerConstruction.appendChild(t);
}

function drawCircle(cx, cy, r, color, width) {
    const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    c.setAttribute('cx', cx);
    c.setAttribute('cy', cy);
    c.setAttribute('r', r);
    c.setAttribute('fill', 'none');
    c.setAttribute('stroke', color);
    c.setAttribute('stroke-width', width);
    layerConstruction.appendChild(c);
}

function drawCircleFinal(cx, cy, r, color, width) {
    const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    c.setAttribute('cx', cx);
    c.setAttribute('cy', cy);
    c.setAttribute('r', r);
    c.setAttribute('fill', 'none');
    c.setAttribute('stroke', color);
    c.setAttribute('stroke-width', width);
    layerFinal.appendChild(c);
}

function drawArc(cx, cy, r, start, end, color, width) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', describeArc(cx, cy, r, start, end));
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', color);
    path.setAttribute('stroke-width', width);
    path.setAttribute('stroke-linecap', 'round');
    layerConstruction.appendChild(path);
}

function drawArcFinal(cx, cy, r, start, end, color, width) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', describeArc(cx, cy, r, start, end));
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', color);
    path.setAttribute('stroke-width', width);
    path.setAttribute('stroke-linecap', 'round');
    layerFinal.appendChild(path);
}

// ============================================
// UTILITAIRES
// ============================================
function pointOnCircle(cx, cy, r, angleDeg) {
    const rad = angleDeg * Math.PI / 180;
    return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
}

function distance(p1, p2) {
    return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
}

function describeArc(cx, cy, r, start, end) {
    const s = pointOnCircle(cx, cy, r, start);
    const e = pointOnCircle(cx, cy, r, end);
    const delta = end - start;
    const large = Math.abs(delta) > 180 ? '1' : '0';
    const sweep = delta > 0 ? '0' : '1';
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} ${sweep} ${e.x} ${e.y}`;
}

function updateStepInfo(title, desc) {
    document.getElementById('stepTitle').textContent = title;
    document.getElementById('stepDescription').textContent = desc;
}
