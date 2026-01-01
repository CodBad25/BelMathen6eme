/**
 * Théâtre d'Épidaure v12
 *
 * Approche pédagogique RÉALISTE :
 * 1. Tracer TOUS les arcs avec l'étendue MAXIMALE (zone inf) - l'élève ne connaît pas encore la forme finale
 * 2. Tracer TOUS les rayons avec le report d'angle
 * 3. Gommer la partie inférieure d'un rayon sur deux
 * 4. NOUVEAU : Gommer les extrémités des arcs de la zone supérieure (raccourcir)
 *
 * v12 : Construction réaliste - on dessine "trop long" puis on gomme le superflu
 * Résultat : zone inférieure avec rayons espacés, zone supérieure (plus courte) avec tous les rayons
 */

// Configuration - Proportions fidèles au vrai théâtre (v12)
// baseAngle = 9° → index des horizontaux = 10 (pair) → visibles en bas
// Zone inf : 2 extraAngles, Zone sup : 1 extraAngle
const CONFIG = {
    centerX: 375,
    centerY: 750,               // Centre TRÈS bas pour voir toute la construction dès le début
    baseAngle: 9,               // 9° pour que 0° et 180° aient index pair (90/9=10)
    extraAnglesZone1: 2,        // Zone inférieure : dépasse de 2 angles
    extraAnglesZone2: 1,        // Zone supérieure : dépasse de 1 angle seulement

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

// Zoom - valeurs différentes pour mobile
const isMobile = window.innerWidth <= 768;
let zoomGroup = null;
let currentZoom = isMobile ? 0.7 : 1.3;
const ZOOM_START = isMobile ? 0.7 : 1.3;
const ZOOM_END = isMobile ? 0.5 : 0.75;
let autoZoomEnabled = true;

// Données calculées
let O, outerRadius, diazomaStart, zone2Start;
let minAngle, maxAngle;       // Étendue zone inférieure
let minAngleZ2, maxAngleZ2;   // Étendue zone supérieure (plus courte)

// ============================================
// INITIALISATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // Sur mobile, ajuster le viewBox pour montrer la construction
    if (isMobile) {
        const svgEl = document.getElementById('canvas');
        svgEl.setAttribute('viewBox', '0 370 750 450');
    }

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

    // Rayon extérieur (dernière rangée)
    outerRadius = CONFIG.zone2End;

    // Rayon de bordure (encadre tout le théâtre)
    CONFIG.borderRadius = outerRadius + 10;

    // Étendue angulaire zone inférieure (2 extraAngles)
    minAngle = 0 - CONFIG.extraAnglesZone1 * CONFIG.baseAngle;
    maxAngle = 180 + CONFIG.extraAnglesZone1 * CONFIG.baseAngle;

    // Étendue angulaire zone supérieure (1 extraAngle - plus courte)
    minAngleZ2 = 0 - CONFIG.extraAnglesZone2 * CONFIG.baseAngle;
    maxAngleZ2 = 180 + CONFIG.extraAnglesZone2 * CONFIG.baseAngle;
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

    // Utiliser les dimensions du viewBox (750x600) car canvas.width peut être NaN
    const svgWidth = canvas.width || 750;
    const svgHeight = canvas.height || 600;

    const cx = svgWidth / 2;
    // Centrer sur un point PLUS HAUT que O pour que O apparaisse en bas
    // Sur mobile, remonter davantage pour voir toute la construction
    const cy = isMobile ? svgHeight / 2 - 50 : svgHeight / 2 + 100;

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
    // minAngle/maxAngle (zone inf) et minAngleZ2/maxAngleZ2 (zone sup) sont des variables globales

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
    // ÉTAPE 3 : Arc de bordure (le plus grand, encadre tout)
    // v12 : On trace LONG d'abord (étendue zone inf), on raccourcira plus tard
    // ========================================
    updateStepInfo('Arc de bordure', 'On trace l\'arc de bordure (long). On le raccourcira a la fin.');
    await canvas.wait(400);

    canvas.compas.setPosition(O.x, O.y, -90);
    canvas.compas.show();
    canvas.compas.setEcart(CONFIG.borderRadius);
    await canvas.wait(200);
    // Arc de bordure : étendue MAXIMALE (zone inf) - sera raccourci plus tard
    await drawer.drawArc('arcBorder', O.x, O.y, CONFIG.borderRadius, minAngle, maxAngle, CONFIG.mainArcColor, 3, 600);

    // ========================================
    // ÉTAPE 4 : Arc extérieur (dernière rangée de sièges)
    // v12 : On trace LONG d'abord
    // ========================================
    updateStepInfo('Arc exterieur', 'On trace l\'arc de la derniere rangee (long). On le raccourcira a la fin.');
    await canvas.wait(400);

    canvas.compas.setEcart(outerRadius);
    await canvas.wait(200);
    // Arc extérieur : étendue MAXIMALE (zone inf) - sera raccourci plus tard
    await drawer.drawArc('arcOuter', O.x, O.y, outerRadius, minAngle, maxAngle, CONFIG.mainArcColor, 3, 600);

    canvas.compas.hide();
    await canvas.wait(400);

    // ========================================
    // ÉTAPE 5 : Arcs du diazoma (AVANT les rayons pour guider l'élève)
    // v12 : On trace les deux arcs LONGS, on raccourcira le second plus tard
    // ========================================
    updateStepInfo('Arcs du diazoma', 'On trace les deux arcs (longs) qui delimitent le couloir.');
    await canvas.wait(400);

    canvas.compas.setPosition(O.x, O.y, -90);
    canvas.compas.show();

    // Arc début diazoma (fin zone inférieure) : étendue zone inf
    canvas.compas.setEcart(diazomaStart);
    await canvas.wait(200);
    await drawer.drawArc('arcDiazomaStart', O.x, O.y, diazomaStart, minAngle, maxAngle, CONFIG.mainArcColor, 3, 500);

    // Arc fin diazoma (début zone supérieure) : étendue MAXIMALE (sera raccourci)
    canvas.compas.setEcart(zone2Start);
    await canvas.wait(200);
    await drawer.drawArc('arcDiazomaEnd', O.x, O.y, zone2Start, minAngle, maxAngle, CONFIG.mainArcColor, 3, 500);

    canvas.compas.hide();
    await canvas.wait(400);

    // ========================================
    // ÉTAPE 5 : Premier rayon vertical (90°) - en 2 segments (diazoma vide)
    // ========================================
    updateStepInfo('Premier rayon', 'On trace le premier rayon vertical. Il s\'arrete au premier arc et reprend apres le deuxieme.');
    await canvas.wait(400);

    const ray90Start = pointOnCircle(O.x, O.y, CONFIG.orchestraRadius, 90);
    const ray90DiazomaStart = pointOnCircle(O.x, O.y, diazomaStart, 90);
    const ray90Zone2Start = pointOnCircle(O.x, O.y, zone2Start, 90);
    const ray90End = pointOnCircle(O.x, O.y, outerRadius, 90);

    canvas.regle.setPosition(O.x, O.y - 25, -90);
    canvas.regle.show();
    await canvas.wait(300);

    canvas.crayon.setPosition(ray90Start.x, ray90Start.y);
    canvas.crayon.show();
    // Segment zone inférieure
    await drawer.drawSegment('ray_90_z1', ray90Start.x, ray90Start.y, ray90DiazomaStart.x, ray90DiazomaStart.y, CONFIG.rayColor, 2, 300);
    // Segment zone supérieure
    await drawer.drawSegment('ray_90_z2', ray90Zone2Start.x, ray90Zone2Start.y, ray90End.x, ray90End.y, CONFIG.rayColor, 2, 200);

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

    canvas.compas.hide();
    await canvas.wait(300);

    // ========================================
    // ÉTAPE 6 : Deuxième rayon + corde - en 2 segments (diazoma vide)
    // ========================================
    updateStepInfo('Angle de base', 'On trace le deuxieme rayon et on memorise la corde.');
    await canvas.wait(400);

    const angle2 = 90 + CONFIG.baseAngle;
    const ray2Start = pointOnCircle(O.x, O.y, CONFIG.orchestraRadius, angle2);
    const ray2DiazomaStart = pointOnCircle(O.x, O.y, diazomaStart, angle2);
    const ray2Zone2Start = pointOnCircle(O.x, O.y, zone2Start, angle2);
    const ray2End = pointOnCircle(O.x, O.y, outerRadius, angle2);

    canvas.regle.setPosition(O.x, O.y - 25, -angle2);
    canvas.regle.show();
    await canvas.wait(200);

    canvas.crayon.setPosition(ray2Start.x, ray2Start.y);
    canvas.crayon.show();
    // Segment zone inférieure
    await drawer.drawSegment(`ray_${angle2}_z1`, ray2Start.x, ray2Start.y, ray2DiazomaStart.x, ray2DiazomaStart.y, CONFIG.rayColor, 2, 250);
    // Segment zone supérieure
    await drawer.drawSegment(`ray_${angle2}_z2`, ray2Zone2Start.x, ray2Zone2Start.y, ray2End.x, ray2End.y, CONFIG.rayColor, 2, 150);

    const P2 = pointOnCircle(O.x, O.y, constructionRadius, angle2);

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

        // Rayon en 2 segments (diazoma vide)
        // v12 : On trace TOUS les segments z2 (même hors plage zone sup) - on gommera plus tard
        const rayStart = pointOnCircle(O.x, O.y, CONFIG.orchestraRadius, angle);
        const rayDiazomaStart = pointOnCircle(O.x, O.y, diazomaStart, angle);
        const rayZone2Start = pointOnCircle(O.x, O.y, zone2Start, angle);
        const rayEnd = pointOnCircle(O.x, O.y, outerRadius, angle);

        canvas.regle.setPosition(O.x, O.y - 25, -angle);
        canvas.regle.show();
        await canvas.wait(100);

        canvas.crayon.setPosition(rayStart.x, rayStart.y);
        canvas.crayon.show();
        // Segment zone inférieure
        await drawer.drawSegment(`ray_${angle}_z1`, rayStart.x, rayStart.y, rayDiazomaStart.x, rayDiazomaStart.y, CONFIG.rayColor, 2, 150);
        // Segment zone supérieure (TOUS - on gommera les excès plus tard)
        await drawer.drawSegment(`ray_${angle}_z2`, rayZone2Start.x, rayZone2Start.y, rayEnd.x, rayEnd.y, CONFIG.rayColor, 2, 100);

        canvas.regle.hide();
        canvas.crayon.hide();
        canvas.compas.show();

        allAngles.push(angle);
        prevPoint = newPoint;
        await canvas.wait(80);
    }

    // ========================================
    // ÉTAPE 9 : Tous les rayons vers la droite (en 2 segments)
    // ========================================
    updateStepInfo('Reports a droite', 'On reporte l\'angle vers la droite - en 2 segments.');
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

        // Rayon en 2 segments (diazoma vide)
        // v12 : On trace TOUS les segments z2 - on gommera plus tard
        const rayStart = pointOnCircle(O.x, O.y, CONFIG.orchestraRadius, angle);
        const rayDiazomaStart = pointOnCircle(O.x, O.y, diazomaStart, angle);
        const rayZone2Start = pointOnCircle(O.x, O.y, zone2Start, angle);
        const rayEnd = pointOnCircle(O.x, O.y, outerRadius, angle);

        canvas.regle.setPosition(O.x, O.y - 25, -angle);
        canvas.regle.show();
        await canvas.wait(100);

        canvas.crayon.setPosition(rayStart.x, rayStart.y);
        canvas.crayon.show();
        // Segment zone inférieure
        await drawer.drawSegment(`ray_${angle}_z1`, rayStart.x, rayStart.y, rayDiazomaStart.x, rayDiazomaStart.y, CONFIG.rayColor, 2, 150);
        // Segment zone supérieure (TOUS - on gommera les excès plus tard)
        await drawer.drawSegment(`ray_${angle}_z2`, rayZone2Start.x, rayZone2Start.y, rayEnd.x, rayEnd.y, CONFIG.rayColor, 2, 100);

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
    // ÉTAPE 10 : GOMMAGE RAYONS - effacer la partie inférieure d'un rayon sur deux
    // ========================================
    await animateZoomTo(0.95, 600);
    updateStepInfo('Gommage rayons (zone inf)', 'On efface la partie INFERIEURE d\'un rayon sur deux.');
    await canvas.wait(600);

    // Trier les angles
    allAngles.sort((a, b) => a - b);

    // Gommer un rayon sur deux dans la zone inférieure (supprimer le segment z1)
    // Avec baseAngle=9°, les horizontaux (0° et 180°) ont index 10 (pair) → automatiquement conservés
    for (let i = 0; i < allAngles.length; i++) {
        const angle = allAngles[i];

        // Calculer l'index depuis le centre (90°)
        const indexFromCenter = Math.round(Math.abs(angle - 90) / CONFIG.baseAngle);

        // Gommer les rayons d'index impair (1, 3, 5...)
        // Les horizontaux ont index 10 (pair) donc automatiquement conservés
        if (indexFromCenter % 2 === 1) {
            // Trouver et effacer le segment z1 de ce rayon
            const segmentZ1 = canvas.objects[`ray_${angle}_z1`];
            if (segmentZ1 && segmentZ1.element) {
                // Animation de gommage (fade out)
                segmentZ1.element.style.transition = 'opacity 0.3s';
                segmentZ1.element.style.opacity = '0';
                await canvas.wait(80);
                segmentZ1.element.remove();
            }
        }
    }

    await canvas.wait(500);

    // ========================================
    // ÉTAPE 10b : GOMMAGE RAYONS - effacer les segments z2 hors zone sup
    // v12 : On a tracé tous les z2, maintenant on efface ceux qui dépassent
    // ========================================
    updateStepInfo('Gommage rayons (zone sup)', 'On efface les rayons superieurs qui depassent.');
    await canvas.wait(400);

    for (let i = 0; i < allAngles.length; i++) {
        const angle = allAngles[i];

        // Si l'angle est hors de la plage zone sup, effacer le segment z2
        if (angle < minAngleZ2 || angle > maxAngleZ2) {
            const segmentZ2 = canvas.objects[`ray_${angle}_z2`];
            if (segmentZ2 && segmentZ2.element) {
                segmentZ2.element.style.transition = 'opacity 0.3s';
                segmentZ2.element.style.opacity = '0';
                await canvas.wait(80);
                segmentZ2.element.remove();
            }
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
    // ÉTAPE 13 : GOMMAGE DES ARCS - raccourcir les arcs de la zone supérieure
    // v12 : C'est ici qu'on "gomme" les extrémités des arcs trop longs
    // ========================================
    updateStepInfo('Gommage des arcs', 'On raccourcit les arcs de la zone superieure.');
    await canvas.wait(400);

    // Effacer les anciens arcs longs
    const arcsToTrim = ['arcBorder', 'arcOuter', 'arcDiazomaEnd'];
    for (const arcId of arcsToTrim) {
        const arc = canvas.objects[arcId];
        if (arc && arc.element) {
            arc.element.style.transition = 'opacity 0.4s';
            arc.element.style.opacity = '0';
        }
    }
    await canvas.wait(500);

    // Supprimer les anciens arcs
    for (const arcId of arcsToTrim) {
        const arc = canvas.objects[arcId];
        if (arc && arc.element && arc.element.parentNode) {
            arc.element.remove();
        }
    }

    // Redessiner les arcs avec l'étendue réduite (zone sup)
    canvas.compas.setPosition(O.x, O.y, -90);
    canvas.compas.show();

    canvas.compas.setEcart(CONFIG.borderRadius);
    await canvas.wait(100);
    await drawer.drawArc('arcBorderShort', O.x, O.y, CONFIG.borderRadius, minAngleZ2, maxAngleZ2, CONFIG.mainArcColor, 3, 300);

    canvas.compas.setEcart(outerRadius);
    await canvas.wait(100);
    await drawer.drawArc('arcOuterShort', O.x, O.y, outerRadius, minAngleZ2, maxAngleZ2, CONFIG.mainArcColor, 3, 300);

    canvas.compas.setEcart(zone2Start);
    await canvas.wait(100);
    await drawer.drawArc('arcZone2Start', O.x, O.y, zone2Start, minAngleZ2, maxAngleZ2, CONFIG.mainArcColor, 3, 300);

    canvas.compas.hide();
    await canvas.wait(400);

    // ========================================
    // ÉTAPE 14 : Rangées zone supérieure
    // ========================================
    updateStepInfo('Rangees zone superieure', 'On trace les arcs des rangees de la zone superieure (etendue reduite).');
    await canvas.wait(400);

    canvas.compas.setPosition(O.x, O.y, -90);
    canvas.compas.show();

    for (let k = 1; k < CONFIG.zone2Rows; k++) {
        const rowRadius = zone2Start + k * CONFIG.zone2Step;
        if (rowRadius < outerRadius) {
            canvas.compas.setEcart(rowRadius);
            await canvas.wait(60);
            // Rangées zone sup : étendue réduite
            await drawer.drawArc(`rowZ2_${k}`, O.x, O.y, rowRadius, minAngleZ2, maxAngleZ2, CONFIG.zone2Color, 1.5, 180);
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

    // Confettis - dispersés sur toute la largeur
    // Utiliser les dimensions du viewBox (750x600) car canvas.width peut être NaN
    const svgWidth = canvas.width || 750;
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

    // Groupe de zoom pour centrer la vue sur le théâtre
    const exploreZoomGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');

    // Calculer la transformation pour voir tout le théâtre
    const svgWidth = 750;
    const svgHeight = 600;
    const scale = 0.75; // Zoom arrière pour voir tout
    const cx = svgWidth / 2;
    const cy = svgHeight / 2 + 50;
    const translateX = cx - O.x * scale;
    const translateY = cy - O.y * scale;
    exploreZoomGroup.setAttribute('transform', `translate(${translateX}, ${translateY}) scale(${scale})`);

    svg.appendChild(exploreZoomGroup);

    layerConstruction = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    exploreZoomGroup.appendChild(layerConstruction);

    layerFinal = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    exploreZoomGroup.appendChild(layerFinal);

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
    // Les angles min/max sont maintenant des variables globales calculées dans initConfig()
    // Zone inférieure : minAngle/maxAngle (2 extraAngles → -18° à 198°)
    // Zone supérieure : minAngleZ2/maxAngleZ2 (1 extraAngle → -9° à 189°)

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
        title: 'Arc de bordure',
        description: 'Arc de bordure (long). On le raccourcira a la fin.',
        render: () => {
            // v12 : Arc de bordure avec étendue MAXIMALE (sera raccourci plus tard)
            drawArc(O.x, O.y, CONFIG.borderRadius, minAngle, maxAngle, CONFIG.mainArcColor, 3);
        }
    });

    steps.push({
        title: 'Arc exterieur',
        description: 'Arc de la derniere rangee (long). On le raccourcira a la fin.',
        render: () => {
            // v12 : Arc extérieur avec étendue MAXIMALE (sera raccourci plus tard)
            drawArc(O.x, O.y, outerRadius, minAngle, maxAngle, CONFIG.mainArcColor, 3);
        }
    });

    // Arcs du diazoma AVANT les rayons (pour guider l'élève)
    steps.push({
        title: 'Arcs du diazoma',
        description: 'On trace les deux arcs (longs) qui delimitent le couloir.',
        render: () => {
            // Arc début diazoma : étendue zone inférieure (complète)
            drawArc(O.x, O.y, diazomaStart, minAngle, maxAngle, CONFIG.mainArcColor, 3);
            // v12 : Arc fin diazoma avec étendue MAXIMALE (sera raccourci plus tard)
            drawArc(O.x, O.y, zone2Start, minAngle, maxAngle, CONFIG.mainArcColor, 3);
        }
    });

    // Tous les rayons en 2 segments (diazoma vide)
    // v12 : On trace TOUS les z2 (même hors plage), on gommera plus tard
    let rayNumber = 1;
    for (let angle = minAngle; angle <= maxAngle; angle += CONFIG.baseAngle) {
        const angleVal = angle; // Capture pour la closure
        const currentRayNum = rayNumber;

        steps.push({
            title: `Rayon ${currentRayNum}`,
            description: `On trace le rayon ${currentRayNum} en 2 segments (il saute le couloir).`,
            render: () => {
                // Segment zone inférieure
                const startZ1 = pointOnCircle(O.x, O.y, CONFIG.orchestraRadius, angleVal);
                const endZ1 = pointOnCircle(O.x, O.y, diazomaStart, angleVal);
                drawSegment(startZ1.x, startZ1.y, endZ1.x, endZ1.y, CONFIG.rayColor, 2);
                // v12 : Segment zone supérieure pour TOUS les angles (on gommera plus tard)
                const startZ2 = pointOnCircle(O.x, O.y, zone2Start, angleVal);
                const endZ2 = pointOnCircle(O.x, O.y, outerRadius, angleVal);
                drawSegment(startZ2.x, startZ2.y, endZ2.x, endZ2.y, CONFIG.rayColor, 2);
            }
        });
        rayNumber++;
    }

    steps.push({
        title: 'Gommage rayons',
        description: 'On efface la partie INFERIEURE d\'un rayon sur deux + les rayons superieurs qui depassent.',
        render: () => {
            // v12 : Gommage en deux temps :
            // 1. Effacer z1 d'un rayon sur deux
            // 2. Effacer z2 des rayons hors plage zone sup
            for (let angle = minAngle; angle <= maxAngle; angle += CONFIG.baseAngle) {
                const indexFromCenter = Math.round(Math.abs(angle - 90) / CONFIG.baseAngle);
                const isErased = indexFromCenter % 2 === 1;
                const hasZoneSup = angle >= minAngleZ2 && angle <= maxAngleZ2;

                if (isErased) {
                    // Rayon gommé en bas : seulement zone supérieure (si dans la plage)
                    if (hasZoneSup) {
                        const startZ2 = pointOnCircle(O.x, O.y, zone2Start, angle);
                        const endZ2 = pointOnCircle(O.x, O.y, outerRadius, angle);
                        drawSegment(startZ2.x, startZ2.y, endZ2.x, endZ2.y, CONFIG.rayColor, 2);
                    }
                    // Sinon : rayon complètement effacé (hors zone sup et gommé en bas)
                } else {
                    // Rayon conservé en bas : zone inf toujours
                    const startZ1 = pointOnCircle(O.x, O.y, CONFIG.orchestraRadius, angle);
                    const endZ1 = pointOnCircle(O.x, O.y, diazomaStart, angle);
                    drawSegment(startZ1.x, startZ1.y, endZ1.x, endZ1.y, CONFIG.rayColor, 2);
                    // Zone sup seulement si dans la plage
                    if (hasZoneSup) {
                        const startZ2 = pointOnCircle(O.x, O.y, zone2Start, angle);
                        const endZ2 = pointOnCircle(O.x, O.y, outerRadius, angle);
                        drawSegment(startZ2.x, startZ2.y, endZ2.x, endZ2.y, CONFIG.rayColor, 2);
                    }
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

    // v12 : Gommage des arcs - raccourcir les arcs de la zone supérieure
    steps.push({
        title: 'Gommage des arcs',
        description: 'On raccourcit les arcs de la zone superieure.',
        render: () => {
            // Redessiner les arcs zone sup avec l'étendue réduite
            drawArc(O.x, O.y, CONFIG.borderRadius, minAngleZ2, maxAngleZ2, CONFIG.mainArcColor, 3);
            drawArc(O.x, O.y, outerRadius, minAngleZ2, maxAngleZ2, CONFIG.mainArcColor, 3);
            drawArc(O.x, O.y, zone2Start, minAngleZ2, maxAngleZ2, CONFIG.mainArcColor, 3);
        }
    });

    steps.push({
        title: 'Rangees zone superieure',
        description: 'Rangees de la zone superieure (etendue reduite).',
        render: () => {
            for (let k = 1; k < CONFIG.zone2Rows; k++) {
                const rowRadius = zone2Start + k * CONFIG.zone2Step;
                if (rowRadius < outerRadius) {
                    drawArc(O.x, O.y, rowRadius, minAngleZ2, maxAngleZ2, CONFIG.zone2Color, 1.5);
                }
            }
        }
    });

    steps.push({
        title: 'Theatre termine',
        description: 'Zone inferieure : rayons espaces. Zone superieure (plus courte) : tous les rayons. Diazoma vide.',
        render: () => {
            // Orchestre (cercle complet)
            drawCircleFinal(O.x, O.y, CONFIG.orchestraRadius, CONFIG.orchestraColor, 2.5);

            // Rayons avec gommage et diazoma vide
            // Avec baseAngle=9°, les horizontaux ont index 10 (pair) → automatiquement conservés
            for (let angle = minAngle; angle <= maxAngle; angle += CONFIG.baseAngle) {
                const indexFromCenter = Math.round(Math.abs(angle - 90) / CONFIG.baseAngle);
                const isErased = indexFromCenter % 2 === 1;
                const hasZoneSup = angle >= minAngleZ2 && angle <= maxAngleZ2;

                if (isErased) {
                    // Rayon gommé : seulement zone supérieure (si dans la plage)
                    if (hasZoneSup) {
                        const startZ2 = pointOnCircle(O.x, O.y, zone2Start, angle);
                        const endZ2 = pointOnCircle(O.x, O.y, outerRadius, angle);
                        drawSegmentFinal(startZ2.x, startZ2.y, endZ2.x, endZ2.y, CONFIG.rayColor, 2);
                    }
                } else {
                    // Rayon conservé : zone inf toujours, zone sup si dans la plage
                    const startZ1 = pointOnCircle(O.x, O.y, CONFIG.orchestraRadius, angle);
                    const endZ1 = pointOnCircle(O.x, O.y, diazomaStart, angle);
                    drawSegmentFinal(startZ1.x, startZ1.y, endZ1.x, endZ1.y, CONFIG.rayColor, 2);
                    if (hasZoneSup) {
                        const startZ2 = pointOnCircle(O.x, O.y, zone2Start, angle);
                        const endZ2 = pointOnCircle(O.x, O.y, outerRadius, angle);
                        drawSegmentFinal(startZ2.x, startZ2.y, endZ2.x, endZ2.y, CONFIG.rayColor, 2);
                    }
                }
            }

            // Zone inférieure (étendue complète)
            for (let k = 0; k < CONFIG.zone1Rows; k++) {
                const rowRadius = CONFIG.zone1Start + k * CONFIG.zone1Step;
                if (rowRadius < diazomaStart) {
                    drawArcFinal(O.x, O.y, rowRadius, minAngle, maxAngle, CONFIG.zone1Color, 1.5);
                }
            }
            drawArcFinal(O.x, O.y, diazomaStart, minAngle, maxAngle, CONFIG.mainArcColor, 3);

            // Zone supérieure (étendue réduite)
            drawArcFinal(O.x, O.y, zone2Start, minAngleZ2, maxAngleZ2, CONFIG.mainArcColor, 3);
            for (let k = 1; k < CONFIG.zone2Rows; k++) {
                const rowRadius = zone2Start + k * CONFIG.zone2Step;
                if (rowRadius < outerRadius) {
                    drawArcFinal(O.x, O.y, rowRadius, minAngleZ2, maxAngleZ2, CONFIG.zone2Color, 1.5);
                }
            }
            drawArcFinal(O.x, O.y, outerRadius, minAngleZ2, maxAngleZ2, CONFIG.mainArcColor, 3);

            // Arc de bordure (encadre tout - étendue zone sup)
            drawArcFinal(O.x, O.y, CONFIG.borderRadius, minAngleZ2, maxAngleZ2, CONFIG.mainArcColor, 3);
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
