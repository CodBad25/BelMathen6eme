/**
 * Theatre d'Epidaure v14 - 2026-01-14
 *
 * Changement par rapport à v13 :
 * - L'arc de report d'angle est maintenant sur l'arc EXTÉRIEUR (outerRadius)
 * - La corde est plus grande et plus visible pour les élèves
 */

// Configuration
const CONFIG = {
    centerX: 375,
    centerY: 750,
    baseAngle: 9,
    extraAnglesZone1: 2,
    extraAnglesZone2: 1,

    orchestraRadius: 50,

    zone1Start: 58,
    zone1Rows: 32,
    zone1Step: 4,

    diazomaWidth: 12,

    zone2Rows: 22,
    zone2Step: 4,

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
let minAngle, maxAngle;
let minAngleZ2, maxAngleZ2;
let constructionRadius; // v14 : sera égal à outerRadius

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

    CONFIG.zone1End = CONFIG.zone1Start + (CONFIG.zone1Rows - 1) * CONFIG.zone1Step;

    diazomaStart = CONFIG.zone1End;
    zone2Start = CONFIG.zone1End + CONFIG.diazomaWidth;

    CONFIG.zone2End = zone2Start + (CONFIG.zone2Rows - 1) * CONFIG.zone2Step;

    outerRadius = CONFIG.zone2End;

    CONFIG.borderRadius = outerRadius + 10;

    minAngle = 0 - CONFIG.extraAnglesZone1 * CONFIG.baseAngle;
    maxAngle = 180 + CONFIG.extraAnglesZone1 * CONFIG.baseAngle;

    minAngleZ2 = 0 - CONFIG.extraAnglesZone2 * CONFIG.baseAngle;
    maxAngleZ2 = 180 + CONFIG.extraAnglesZone2 * CONFIG.baseAngle;

    // v14 : Arc de report sur l'arc EXTÉRIEUR (grande corde visible)
    constructionRadius = outerRadius;
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
    const cy = svgHeight / 2 + 100;

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

    // ÉTAPE 1 : Centre O
    updateStepInfo('Centre O', 'On place le centre O du theatre.');
    await canvas.wait(500);

    drawer.createPoint('O', O.x, O.y, '#2c3e50', 6);
    await drawer.showPoint('O', 400);
    drawer.createLabel('O', 'O', O.x + 10, O.y + 5);
    await drawer.showLabel('O');
    await canvas.wait(400);

    // ÉTAPE 2 : Orchestre
    updateStepInfo('Orchestre', 'On trace le cercle de l\'orchestre.');
    await canvas.wait(400);

    canvas.compas.setEcart(CONFIG.orchestraRadius);
    canvas.compas.setPosition(O.x, O.y, -90);
    canvas.compas.show();
    await canvas.wait(300);

    await drawer.drawArc('orchestra', O.x, O.y, CONFIG.orchestraRadius, 0, 359.9, CONFIG.orchestraColor, 2.5, 800);

    canvas.compas.hide();
    await canvas.wait(400);

    // ÉTAPE 3 : Arc de bordure
    updateStepInfo('Arc de bordure', 'On trace l\'arc de bordure (long).');
    await canvas.wait(400);

    canvas.compas.setPosition(O.x, O.y, -90);
    canvas.compas.show();
    canvas.compas.setEcart(CONFIG.borderRadius);
    await canvas.wait(200);
    await drawer.drawArc('arcBorder', O.x, O.y, CONFIG.borderRadius, minAngle, maxAngle, CONFIG.mainArcColor, 3, 600);

    // ÉTAPE 4 : Arc extérieur (c'est aussi l'arc de report d'angle en v14)
    updateStepInfo('Arc exterieur', 'On trace l\'arc de la derniere rangee. C\'est sur cet arc qu\'on fera le report d\'angle.');
    await canvas.wait(400);

    canvas.compas.setEcart(outerRadius);
    await canvas.wait(200);
    await drawer.drawArc('arcOuter', O.x, O.y, outerRadius, minAngle, maxAngle, CONFIG.mainArcColor, 3, 600);

    canvas.compas.hide();
    await canvas.wait(400);

    // ÉTAPE 5 : Arcs du diazoma
    updateStepInfo('Arcs du diazoma', 'On trace les deux arcs (longs) qui delimitent le couloir.');
    await canvas.wait(400);

    canvas.compas.setPosition(O.x, O.y, -90);
    canvas.compas.show();

    canvas.compas.setEcart(diazomaStart);
    await canvas.wait(200);
    await drawer.drawArc('arcDiazomaStart', O.x, O.y, diazomaStart, minAngle, maxAngle, CONFIG.mainArcColor, 3, 500);

    canvas.compas.setEcart(zone2Start);
    await canvas.wait(200);
    await drawer.drawArc('arcDiazomaEnd', O.x, O.y, zone2Start, minAngle, maxAngle, CONFIG.mainArcColor, 3, 500);

    canvas.compas.hide();
    await canvas.wait(400);

    // ÉTAPE 6 : Premier rayon vertical (90°)
    updateStepInfo('Premier rayon', 'On trace le premier rayon vertical (axe de symetrie).');
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
    await drawer.drawSegment('ray_90_z1', ray90Start.x, ray90Start.y, ray90DiazomaStart.x, ray90DiazomaStart.y, CONFIG.rayColor, 2, 300);
    await drawer.drawSegment('ray_90_z2', ray90Zone2Start.x, ray90Zone2Start.y, ray90End.x, ray90End.y, CONFIG.rayColor, 2, 200);

    // v14 : Point sur l'arc EXTÉRIEUR
    const P90 = pointOnCircle(O.x, O.y, constructionRadius, 90);
    drawer.createPoint('P90', P90.x, P90.y, CONFIG.chordColor, 5);
    await drawer.showPoint('P90', 200);
    tempElements.push(canvas.objects['P90'].element);

    canvas.regle.hide();
    canvas.crayon.hide();
    await canvas.wait(400);

    // ÉTAPE 7 : Deuxième rayon + corde (sur l'arc extérieur)
    updateStepInfo('Angle de base', 'On trace le deuxieme rayon. La corde sur l\'arc exterieur definit l\'angle de base.');
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
    await drawer.drawSegment(`ray_${angle2}_z1`, ray2Start.x, ray2Start.y, ray2DiazomaStart.x, ray2DiazomaStart.y, CONFIG.rayColor, 2, 250);
    await drawer.drawSegment(`ray_${angle2}_z2`, ray2Zone2Start.x, ray2Zone2Start.y, ray2End.x, ray2End.y, CONFIG.rayColor, 2, 150);

    // v14 : Point et corde sur l'arc EXTÉRIEUR
    const P2 = pointOnCircle(O.x, O.y, constructionRadius, angle2);
    drawer.createPoint('P2', P2.x, P2.y, CONFIG.chordColor, 5);
    await drawer.showPoint('P2', 200);
    tempElements.push(canvas.objects['P2'].element);

    canvas.regle.hide();
    canvas.crayon.hide();

    // Corde (grande et bien visible sur l'arc extérieur)
    await drawer.drawSegment('chord1', P90.x, P90.y, P2.x, P2.y, CONFIG.chordColor, 2.5, 400);
    tempElements.push(canvas.objects['chord1'].element);

    await canvas.wait(400);

    // ÉTAPE 8 : Mémoriser la corde
    updateStepInfo('Memoriser la corde', 'Le compas memorise la longueur de la corde (grande et bien visible).');
    await canvas.wait(400);

    const chordLen = distance(P90, P2);

    canvas.compas.setEcart(10);
    canvas.compas.setPosition(P90.x, P90.y, Math.atan2(P90.y - P2.y, P2.x - P90.x) * 180 / Math.PI);
    canvas.compas.show();
    await canvas.wait(300);

    await canvas.compas.ecarterTo(chordLen, 800);
    await canvas.wait(500);

    // ÉTAPE 9 : Rayons vers la gauche
    updateStepInfo('Reports a gauche', 'On reporte l\'angle vers la gauche sur l\'arc exterieur.');
    await canvas.wait(400);

    let prevPoint = P2;
    const allAngles = [90, angle2];

    for (let angle = 90 + 2 * CONFIG.baseAngle; angle <= maxAngle; angle += CONFIG.baseAngle) {
        const progress = (angle - 90) / 90;
        animateZoomTo(ZOOM_START + (1.0 - ZOOM_START) * progress * 0.5, 300);

        // v14 : Point sur l'arc EXTÉRIEUR
        const newPoint = pointOnCircle(O.x, O.y, constructionRadius, angle);

        await canvas.compas.moveTo(prevPoint.x, prevPoint.y, 200);
        const angleToNew = Math.atan2(-(newPoint.y - prevPoint.y), newPoint.x - prevPoint.x) * 180 / Math.PI;
        await canvas.compas.rotateTo(angleToNew - 90, 150);

        // Arc de report (visible sur l'arc extérieur)
        await drawer.drawArc(`reportL_${angle}`, prevPoint.x, prevPoint.y, chordLen,
            angleToNew - 20, angleToNew + 20, CONFIG.chordColor, 1.5, 200);
        tempElements.push(canvas.objects[`reportL_${angle}`].element);

        canvas.compas.hide();

        const rayStart = pointOnCircle(O.x, O.y, CONFIG.orchestraRadius, angle);
        const rayDiazomaStart = pointOnCircle(O.x, O.y, diazomaStart, angle);
        const rayZone2Start = pointOnCircle(O.x, O.y, zone2Start, angle);
        const rayEnd = pointOnCircle(O.x, O.y, outerRadius, angle);

        canvas.regle.setPosition(O.x, O.y - 25, -angle);
        canvas.regle.show();
        await canvas.wait(100);

        canvas.crayon.setPosition(rayStart.x, rayStart.y);
        canvas.crayon.show();
        await drawer.drawSegment(`ray_${angle}_z1`, rayStart.x, rayStart.y, rayDiazomaStart.x, rayDiazomaStart.y, CONFIG.rayColor, 2, 150);
        await drawer.drawSegment(`ray_${angle}_z2`, rayZone2Start.x, rayZone2Start.y, rayEnd.x, rayEnd.y, CONFIG.rayColor, 2, 100);

        canvas.regle.hide();
        canvas.crayon.hide();
        canvas.compas.show();

        allAngles.push(angle);
        prevPoint = newPoint;
        await canvas.wait(80);
    }

    // ÉTAPE 10 : Rayons vers la droite
    updateStepInfo('Reports a droite', 'On reporte l\'angle vers la droite sur l\'arc exterieur.');
    await canvas.wait(400);

    prevPoint = P90;

    for (let angle = 90 - CONFIG.baseAngle; angle >= minAngle; angle -= CONFIG.baseAngle) {
        // v14 : Point sur l'arc EXTÉRIEUR
        const newPoint = pointOnCircle(O.x, O.y, constructionRadius, angle);

        await canvas.compas.moveTo(prevPoint.x, prevPoint.y, 200);
        const angleToNew = Math.atan2(-(newPoint.y - prevPoint.y), newPoint.x - prevPoint.x) * 180 / Math.PI;
        await canvas.compas.rotateTo(angleToNew - 90, 150);

        await drawer.drawArc(`reportR_${angle}`, prevPoint.x, prevPoint.y, chordLen,
            angleToNew - 20, angleToNew + 20, CONFIG.chordColor, 1.5, 200);
        tempElements.push(canvas.objects[`reportR_${angle}`].element);

        canvas.compas.hide();

        const rayStart = pointOnCircle(O.x, O.y, CONFIG.orchestraRadius, angle);
        const rayDiazomaStart = pointOnCircle(O.x, O.y, diazomaStart, angle);
        const rayZone2Start = pointOnCircle(O.x, O.y, zone2Start, angle);
        const rayEnd = pointOnCircle(O.x, O.y, outerRadius, angle);

        canvas.regle.setPosition(O.x, O.y - 25, -angle);
        canvas.regle.show();
        await canvas.wait(100);

        canvas.crayon.setPosition(rayStart.x, rayStart.y);
        canvas.crayon.show();
        await drawer.drawSegment(`ray_${angle}_z1`, rayStart.x, rayStart.y, rayDiazomaStart.x, rayDiazomaStart.y, CONFIG.rayColor, 2, 150);
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

    // ÉTAPE 11 : Gommage rayons zone inf
    await animateZoomTo(0.95, 600);
    updateStepInfo('Gommage rayons (zone inf)', 'On efface la partie INFERIEURE d\'un rayon sur deux.');
    await canvas.wait(600);

    allAngles.sort((a, b) => a - b);

    for (let i = 0; i < allAngles.length; i++) {
        const angle = allAngles[i];
        const indexFromCenter = Math.round(Math.abs(angle - 90) / CONFIG.baseAngle);

        if (indexFromCenter % 2 === 1) {
            const segmentZ1 = canvas.objects[`ray_${angle}_z1`];
            if (segmentZ1 && segmentZ1.element) {
                segmentZ1.element.style.transition = 'opacity 0.3s';
                segmentZ1.element.style.opacity = '0';
                await canvas.wait(80);
                segmentZ1.element.remove();
            }
        }
    }

    await canvas.wait(500);

    // ÉTAPE 12 : Gommage rayons zone sup
    updateStepInfo('Gommage rayons (zone sup)', 'On efface les rayons superieurs qui depassent.');
    await canvas.wait(400);

    for (let i = 0; i < allAngles.length; i++) {
        const angle = allAngles[i];

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

    // ÉTAPE 13 : Rangées zone inférieure
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

    // ÉTAPE 14 : Gommage des arcs
    updateStepInfo('Gommage des arcs', 'On raccourcit les arcs de la zone superieure.');
    await canvas.wait(400);

    const arcsToTrim = ['arcBorder', 'arcOuter', 'arcDiazomaEnd'];
    for (const arcId of arcsToTrim) {
        const arc = canvas.objects[arcId];
        if (arc && arc.element) {
            arc.element.style.transition = 'opacity 0.4s';
            arc.element.style.opacity = '0';
        }
    }
    await canvas.wait(500);

    for (const arcId of arcsToTrim) {
        const arc = canvas.objects[arcId];
        if (arc && arc.element && arc.element.parentNode) {
            arc.element.remove();
        }
    }

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

    // ÉTAPE 15 : Rangées zone supérieure
    updateStepInfo('Rangees zone superieure', 'On trace les arcs des rangees de la zone superieure.');
    await canvas.wait(400);

    canvas.compas.setPosition(O.x, O.y, -90);
    canvas.compas.show();

    for (let k = 1; k < CONFIG.zone2Rows; k++) {
        const rowRadius = zone2Start + k * CONFIG.zone2Step;
        if (rowRadius < outerRadius) {
            canvas.compas.setEcart(rowRadius);
            await canvas.wait(60);
            await drawer.drawArc(`rowZ2_${k}`, O.x, O.y, rowRadius, minAngleZ2, maxAngleZ2, CONFIG.zone2Color, 1.5, 180);
        }
    }

    canvas.compas.hide();
    await canvas.wait(400);

    // NETTOYAGE
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

    // FIN
    await animateZoomTo(ZOOM_END, 800);

    updateStepInfo('Theatre termine !', 'Le theatre d\'Epidaure est construit !');

    // Confettis
    const svgWidth = canvas.width;
    const centerX = svgWidth / 2;
    const confettiSpread = 400;

    const confettiColors = ['#e91e63', '#9c27b0', '#4caf50', '#ff9800', '#2196f3', '#f44336'];
    const confettis = [];

    for (let i = 0; i < 35; i++) {
        const confetti = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        const x = centerX + (Math.random() - 0.5) * confettiSpread;
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

    const exploreZoomGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');

    const svgWidth = 750;
    const svgHeight = 600;
    const scale = 0.75;
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
// DÉFINITION DES ÉTAPES (EXPLORATION) - SYNCHRONISÉES AVEC L'ANIMATION
// ============================================
function buildSteps() {
    steps = [];

    // ÉTAPE 1 : Centre O
    steps.push({
        title: 'Centre O',
        description: 'On place le centre O du theatre.',
        render: () => {
            drawPoint(O.x, O.y, '#2c3e50', 6);
            drawLabel('O', O.x + 10, O.y + 5);
        }
    });

    // ÉTAPE 2 : Orchestre
    steps.push({
        title: 'Orchestre',
        description: 'On trace le cercle de l\'orchestre.',
        render: () => {
            drawCircle(O.x, O.y, CONFIG.orchestraRadius, CONFIG.orchestraColor, 2.5);
        }
    });

    // ÉTAPE 3 : Arc de bordure
    steps.push({
        title: 'Arc de bordure',
        description: 'On trace l\'arc de bordure (long).',
        render: () => {
            drawArc(O.x, O.y, CONFIG.borderRadius, minAngle, maxAngle, CONFIG.mainArcColor, 3);
        }
    });

    // ÉTAPE 4 : Arc extérieur (= arc de report en v14)
    steps.push({
        title: 'Arc exterieur',
        description: 'On trace l\'arc de la derniere rangee. C\'est sur cet arc qu\'on fera le report d\'angle.',
        render: () => {
            drawArc(O.x, O.y, outerRadius, minAngle, maxAngle, CONFIG.mainArcColor, 3);
        }
    });

    // ÉTAPE 5 : Arcs du diazoma
    steps.push({
        title: 'Arcs du diazoma',
        description: 'On trace les deux arcs (longs) qui delimitent le couloir.',
        render: () => {
            drawArc(O.x, O.y, diazomaStart, minAngle, maxAngle, CONFIG.mainArcColor, 3);
            drawArc(O.x, O.y, zone2Start, minAngle, maxAngle, CONFIG.mainArcColor, 3);
        }
    });

    // ÉTAPE 6 : Premier rayon vertical (90°) + point sur arc extérieur
    steps.push({
        title: 'Premier rayon',
        description: 'On trace le premier rayon vertical (axe de symetrie).',
        render: () => {
            const startZ1 = pointOnCircle(O.x, O.y, CONFIG.orchestraRadius, 90);
            const endZ1 = pointOnCircle(O.x, O.y, diazomaStart, 90);
            drawSegment(startZ1.x, startZ1.y, endZ1.x, endZ1.y, CONFIG.rayColor, 2);
            const startZ2 = pointOnCircle(O.x, O.y, zone2Start, 90);
            const endZ2 = pointOnCircle(O.x, O.y, outerRadius, 90);
            drawSegment(startZ2.x, startZ2.y, endZ2.x, endZ2.y, CONFIG.rayColor, 2);
            // v14 : Point sur l'arc EXTÉRIEUR
            const P90 = pointOnCircle(O.x, O.y, constructionRadius, 90);
            drawPoint(P90.x, P90.y, CONFIG.chordColor, 5);
        }
    });

    // ÉTAPE 7 : Angle de base (deuxième rayon + corde sur arc extérieur)
    steps.push({
        title: 'Angle de base',
        description: 'On trace le deuxieme rayon. La corde sur l\'arc exterieur definit l\'angle de base.',
        render: () => {
            const angle2 = 90 + CONFIG.baseAngle;
            // Deuxième rayon
            const startZ1 = pointOnCircle(O.x, O.y, CONFIG.orchestraRadius, angle2);
            const endZ1 = pointOnCircle(O.x, O.y, diazomaStart, angle2);
            drawSegment(startZ1.x, startZ1.y, endZ1.x, endZ1.y, CONFIG.rayColor, 2);
            const startZ2 = pointOnCircle(O.x, O.y, zone2Start, angle2);
            const endZ2 = pointOnCircle(O.x, O.y, outerRadius, angle2);
            drawSegment(startZ2.x, startZ2.y, endZ2.x, endZ2.y, CONFIG.rayColor, 2);
            // v14 : Points et corde sur l'arc EXTÉRIEUR
            const P90 = pointOnCircle(O.x, O.y, constructionRadius, 90);
            const P2 = pointOnCircle(O.x, O.y, constructionRadius, angle2);
            drawPoint(P2.x, P2.y, CONFIG.chordColor, 5);
            drawSegment(P90.x, P90.y, P2.x, P2.y, CONFIG.chordColor, 2.5);
        }
    });

    // Reports d'angle vers la gauche
    for (let angle = 90 + 2 * CONFIG.baseAngle; angle <= maxAngle; angle += CONFIG.baseAngle) {
        const angleVal = angle;
        steps.push({
            title: `Report ${angleVal}°`,
            description: `On reporte l'angle vers la gauche : ${angleVal}°`,
            render: () => {
                const startZ1 = pointOnCircle(O.x, O.y, CONFIG.orchestraRadius, angleVal);
                const endZ1 = pointOnCircle(O.x, O.y, diazomaStart, angleVal);
                drawSegment(startZ1.x, startZ1.y, endZ1.x, endZ1.y, CONFIG.rayColor, 2);
                const startZ2 = pointOnCircle(O.x, O.y, zone2Start, angleVal);
                const endZ2 = pointOnCircle(O.x, O.y, outerRadius, angleVal);
                drawSegment(startZ2.x, startZ2.y, endZ2.x, endZ2.y, CONFIG.rayColor, 2);
            }
        });
    }

    // Reports d'angle vers la droite
    for (let angle = 90 - CONFIG.baseAngle; angle >= minAngle; angle -= CONFIG.baseAngle) {
        const angleVal = angle;
        steps.push({
            title: `Report ${angleVal}°`,
            description: `On reporte l'angle vers la droite : ${angleVal}°`,
            render: () => {
                const startZ1 = pointOnCircle(O.x, O.y, CONFIG.orchestraRadius, angleVal);
                const endZ1 = pointOnCircle(O.x, O.y, diazomaStart, angleVal);
                drawSegment(startZ1.x, startZ1.y, endZ1.x, endZ1.y, CONFIG.rayColor, 2);
                const startZ2 = pointOnCircle(O.x, O.y, zone2Start, angleVal);
                const endZ2 = pointOnCircle(O.x, O.y, outerRadius, angleVal);
                drawSegment(startZ2.x, startZ2.y, endZ2.x, endZ2.y, CONFIG.rayColor, 2);
            }
        });
    }

    // Gommage rayons
    steps.push({
        title: 'Gommage rayons',
        description: 'On efface la partie INFERIEURE d\'un rayon sur deux + les rayons superieurs qui depassent.',
        render: () => {
            for (let angle = minAngle; angle <= maxAngle; angle += CONFIG.baseAngle) {
                const indexFromCenter = Math.round(Math.abs(angle - 90) / CONFIG.baseAngle);
                const isErased = indexFromCenter % 2 === 1;
                const hasZoneSup = angle >= minAngleZ2 && angle <= maxAngleZ2;

                if (isErased) {
                    if (hasZoneSup) {
                        const startZ2 = pointOnCircle(O.x, O.y, zone2Start, angle);
                        const endZ2 = pointOnCircle(O.x, O.y, outerRadius, angle);
                        drawSegment(startZ2.x, startZ2.y, endZ2.x, endZ2.y, CONFIG.rayColor, 2);
                    }
                } else {
                    const startZ1 = pointOnCircle(O.x, O.y, CONFIG.orchestraRadius, angle);
                    const endZ1 = pointOnCircle(O.x, O.y, diazomaStart, angle);
                    drawSegment(startZ1.x, startZ1.y, endZ1.x, endZ1.y, CONFIG.rayColor, 2);
                    if (hasZoneSup) {
                        const startZ2 = pointOnCircle(O.x, O.y, zone2Start, angle);
                        const endZ2 = pointOnCircle(O.x, O.y, outerRadius, angle);
                        drawSegment(startZ2.x, startZ2.y, endZ2.x, endZ2.y, CONFIG.rayColor, 2);
                    }
                }
            }
        }
    });

    // Rangées zone inférieure
    steps.push({
        title: 'Rangees zone inferieure',
        description: 'On trace les arcs des rangees de la zone inferieure.',
        render: () => {
            for (let k = 0; k < CONFIG.zone1Rows; k++) {
                const rowRadius = CONFIG.zone1Start + k * CONFIG.zone1Step;
                if (rowRadius < diazomaStart) {
                    drawArc(O.x, O.y, rowRadius, minAngle, maxAngle, CONFIG.zone1Color, 1.5);
                }
            }
        }
    });

    // Gommage des arcs
    steps.push({
        title: 'Gommage des arcs',
        description: 'On raccourcit les arcs de la zone superieure.',
        render: () => {
            drawArc(O.x, O.y, CONFIG.borderRadius, minAngleZ2, maxAngleZ2, CONFIG.mainArcColor, 3);
            drawArc(O.x, O.y, outerRadius, minAngleZ2, maxAngleZ2, CONFIG.mainArcColor, 3);
            drawArc(O.x, O.y, zone2Start, minAngleZ2, maxAngleZ2, CONFIG.mainArcColor, 3);
            drawArc(O.x, O.y, diazomaStart, minAngle, maxAngle, CONFIG.mainArcColor, 3);
        }
    });

    // Rangées zone supérieure
    steps.push({
        title: 'Rangees zone superieure',
        description: 'On trace les arcs des rangees de la zone superieure.',
        render: () => {
            for (let k = 1; k < CONFIG.zone2Rows; k++) {
                const rowRadius = zone2Start + k * CONFIG.zone2Step;
                if (rowRadius < outerRadius) {
                    drawArc(O.x, O.y, rowRadius, minAngleZ2, maxAngleZ2, CONFIG.zone2Color, 1.5);
                }
            }
        }
    });

    // Théâtre terminé
    steps.push({
        title: 'Theatre termine',
        description: 'Le theatre d\'Epidaure est construit !',
        render: () => {
            drawCircleFinal(O.x, O.y, CONFIG.orchestraRadius, CONFIG.orchestraColor, 2.5);

            for (let angle = minAngle; angle <= maxAngle; angle += CONFIG.baseAngle) {
                const indexFromCenter = Math.round(Math.abs(angle - 90) / CONFIG.baseAngle);
                const isErased = indexFromCenter % 2 === 1;
                const hasZoneSup = angle >= minAngleZ2 && angle <= maxAngleZ2;

                if (isErased) {
                    if (hasZoneSup) {
                        const startZ2 = pointOnCircle(O.x, O.y, zone2Start, angle);
                        const endZ2 = pointOnCircle(O.x, O.y, outerRadius, angle);
                        drawSegmentFinal(startZ2.x, startZ2.y, endZ2.x, endZ2.y, CONFIG.rayColor, 2);
                    }
                } else {
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

            for (let k = 0; k < CONFIG.zone1Rows; k++) {
                const rowRadius = CONFIG.zone1Start + k * CONFIG.zone1Step;
                if (rowRadius < diazomaStart) {
                    drawArcFinal(O.x, O.y, rowRadius, minAngle, maxAngle, CONFIG.zone1Color, 1.5);
                }
            }
            drawArcFinal(O.x, O.y, diazomaStart, minAngle, maxAngle, CONFIG.mainArcColor, 3);

            drawArcFinal(O.x, O.y, zone2Start, minAngleZ2, maxAngleZ2, CONFIG.mainArcColor, 3);
            for (let k = 1; k < CONFIG.zone2Rows; k++) {
                const rowRadius = zone2Start + k * CONFIG.zone2Step;
                if (rowRadius < outerRadius) {
                    drawArcFinal(O.x, O.y, rowRadius, minAngleZ2, maxAngleZ2, CONFIG.zone2Color, 1.5);
                }
            }
            drawArcFinal(O.x, O.y, outerRadius, minAngleZ2, maxAngleZ2, CONFIG.mainArcColor, 3);
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
