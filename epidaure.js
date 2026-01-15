/**
 * Théâtre d'Épidaure - Construction à la règle et au compas
 *
 * Structure :
 * - Départ de l'axe vertical (90°)
 * - Report d'angle symétrique à gauche et à droite
 * - On dépasse l'horizontale de 2 angles de base de chaque côté
 * - Les côtés (sous l'horizontale) : on relie une rangée sur deux
 */

// Configuration - Structure en 3 zones comme le vrai théâtre d'Épidaure
const CONFIG = {
    centerX: 375,
    centerY: 460,
    baseAngle: 10,              // Angle entre chaque rayon

    // Orchestre
    orchestraRadius: 40,

    // 3 grandes zones de gradins (espacement décroissant vers le haut)
    // Zone 1 (inférieure, près de l'orchestre) - gradins les plus larges
    zone1Start: 55,             // Début zone 1
    zone1Rows: 6,               // Nombre de rangées dans zone 1
    zone1Step: 14,              // Espacement entre rangées zone 1 (le plus grand)

    // Diazoma 1 (couloir vide entre zone 1 et 2)
    zone2Gap: 18,               // Espace VIDE du diazoma 1

    // Zone 2 (intermédiaire) - gradins moyens
    zone2Rows: 6,               // Nombre de rangées dans zone 2
    zone2Step: 11,              // Espacement entre rangées zone 2 (moyen)

    // Diazoma 2 (couloir vide entre zone 2 et 3)
    zone3Gap: 16,               // Espace VIDE du diazoma 2

    // Zone 3 (supérieure, la plus éloignée) - gradins les plus serrés
    zone3Rows: 7,               // Nombre de rangées dans zone 3
    zone3Step: 8,               // Espacement entre rangées zone 3 (le plus petit)

    // Couleurs
    orchestraColor: '#2196f3',
    zone1Color: '#5d4e37',      // Brun foncé pour zone inférieure
    zone2Color: '#6b5b45',      // Brun moyen pour zone intermédiaire
    zone3Color: '#7a6a54',      // Brun clair pour zone supérieure
    mainArcColor: '#2c3e50',    // Couleur des arcs principaux (limites de zones)
    rayColor: '#2c3e50',
    pointColor: '#000000',
    chordColor: '#e74c3c'
};

// État global
let currentMode = 'animation';
let canvas, drawer;
let svg, layerConstruction, layerFinal;
let steps = [];
let currentStep = 0;
let isAnimating = false;

// Zoom dynamique
let zoomGroup = null;
let currentZoom = 1.3;
const ZOOM_START = 1.3;
const ZOOM_END = 0.85;
let autoZoomEnabled = true;

// Données calculées
let O, outerRadius;
let rayAngles = [];      // Tous les angles des rayons
let mainAngles = [];     // Angles de la partie principale (0° à 180°)
let sideAnglesLeft = []; // Angles côté gauche (> 180°)
let sideAnglesRight = []; // Angles côté droit (< 0°)

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

    // Calculer les rayons pour la structure en 3 zones
    // Zone 1 : gradins inférieurs (près de l'orchestre)
    CONFIG.zone1End = CONFIG.zone1Start + (CONFIG.zone1Rows - 1) * CONFIG.zone1Step;

    // Zone 2 : gradins intermédiaires
    CONFIG.zone2Start = CONFIG.zone1End + CONFIG.zone2Gap;
    CONFIG.zone2End = CONFIG.zone2Start + (CONFIG.zone2Rows - 1) * CONFIG.zone2Step;

    // Zone 3 : gradins supérieurs (les plus éloignés)
    CONFIG.zone3Start = CONFIG.zone2End + CONFIG.zone3Gap;
    CONFIG.zone3End = CONFIG.zone3Start + (CONFIG.zone3Rows - 1) * CONFIG.zone3Step;

    // Rayon extérieur total
    outerRadius = CONFIG.zone3End;

    // Rayon pour l'arc de construction (report d'angle)
    CONFIG.innerRadius = CONFIG.zone1Start - 5;

    // Les diazomas (couloirs) sont entre les zones
    CONFIG.diazoma1Radius = CONFIG.zone1End + CONFIG.zone2Gap / 2; // Entre zone 1 et 2
    CONFIG.diazoma2Radius = CONFIG.zone2End + CONFIG.zone3Gap / 2; // Entre zone 2 et 3

    // Calculer tous les angles des rayons
    // Partie principale : de 0° à 180° (au-dessus de l'horizontale)
    // Côtés : 2 angles de base au-delà de chaque côté

    rayAngles = [];
    mainAngles = [];
    sideAnglesLeft = [];
    sideAnglesRight = [];

    // Construire depuis le centre (90°) vers les deux côtés
    // D'abord vers la gauche (90° → 180° → 180° + 2*baseAngle)
    for (let a = 90; a <= 180 + 2 * CONFIG.baseAngle; a += CONFIG.baseAngle) {
        rayAngles.push(a);
        if (a <= 180) {
            mainAngles.push(a);
        } else {
            sideAnglesLeft.push(a);
        }
    }

    // Puis vers la droite (90° - baseAngle → 0° → -2*baseAngle)
    for (let a = 90 - CONFIG.baseAngle; a >= -2 * CONFIG.baseAngle; a -= CONFIG.baseAngle) {
        rayAngles.push(a);
        if (a >= 0) {
            mainAngles.push(a);
        } else {
            sideAnglesRight.push(a);
        }
    }

    // Trier les angles principaux
    mainAngles.sort((a, b) => a - b);
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
            document.getElementById('zoomValue').textContent = 'x' + zoom.toFixed(1) + ' (manuel)';
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

    // Créer le groupe de zoom
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

    await drawer.drawArc('orchestra', O.x, O.y, CONFIG.orchestraRadius, 0, 359.9, CONFIG.orchestraColor, 2.5, 800);

    canvas.compas.hide();
    await canvas.wait(400);

    const minAngle = -2 * CONFIG.baseAngle;
    const maxAngle = 180 + 2 * CONFIG.baseAngle;
    const diazoma1Radius = CONFIG.diazoma1Radius;

    // ========================================
    // ÉTAPE 3 : Les 3 arcs principaux (structure de base)
    // ========================================
    updateStepInfo('Arcs principaux', 'On trace les 3 arcs qui delimitent les zones de gradins.');
    await canvas.wait(400);

    canvas.compas.setPosition(O.x, O.y, -90);
    canvas.compas.show();

    // Arc 1 : limite inférieure (début zone 1)
    canvas.compas.setEcart(CONFIG.zone1Start);
    await canvas.wait(200);
    await drawer.drawArc('mainArc1', O.x, O.y, CONFIG.zone1Start, minAngle, maxAngle, CONFIG.mainArcColor, 3, 500);

    // Arc 2 : limite intermédiaire (fin zone 1 / début zone 2)
    canvas.compas.setEcart(CONFIG.zone2Start);
    await canvas.wait(200);
    await drawer.drawArc('mainArc2', O.x, O.y, CONFIG.zone2Start, minAngle, maxAngle, CONFIG.mainArcColor, 3, 500);

    // Arc 3 : limite supérieure (fin zone 3)
    canvas.compas.setEcart(CONFIG.zone3End);
    await canvas.wait(200);
    await drawer.drawArc('mainArc3', O.x, O.y, CONFIG.zone3End, minAngle, maxAngle, CONFIG.mainArcColor, 3, 500);

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

    const P90 = pointOnCircle(O.x, O.y, CONFIG.innerRadius, 90);
    drawer.createPoint('P90', P90.x, P90.y, CONFIG.pointColor, 5);
    await drawer.showPoint('P90', 200);

    canvas.regle.hide();
    canvas.crayon.hide();
    await canvas.wait(400);

    // ========================================
    // ÉTAPE 4 : Arc de construction pour report d'angle
    // ========================================
    updateStepInfo('Arc de report', 'On trace un arc pour le report d\'angle.');
    await canvas.wait(400);

    canvas.compas.setEcart(CONFIG.innerRadius);
    canvas.compas.setPosition(O.x, O.y, -90);
    canvas.compas.show();
    await canvas.wait(300);

    // Arc de construction complet (sera effacé)
    await drawer.drawArc('constructionArc', O.x, O.y, CONFIG.innerRadius, minAngle, maxAngle, CONFIG.chordColor, 1.5, 1000);
    tempElements.push(canvas.objects['constructionArc'].element);

    canvas.compas.hide();
    await canvas.wait(300);

    // ========================================
    // ÉTAPE 5 : Deuxième rayon + corde (angle de base)
    // ========================================
    updateStepInfo('Angle de base', 'On trace le deuxieme rayon et on memorise la corde.');
    await canvas.wait(400);

    const angle2 = 90 + CONFIG.baseAngle;
    // Tous les rayons sont COMPLETS au début
    const ray2Start = pointOnCircle(O.x, O.y, CONFIG.orchestraRadius, angle2);
    const ray2End = pointOnCircle(O.x, O.y, outerRadius, angle2);

    canvas.regle.setPosition(O.x, O.y - 25, -angle2);
    canvas.regle.show();
    await canvas.wait(200);

    canvas.crayon.setPosition(ray2Start.x, ray2Start.y);
    canvas.crayon.show();
    await drawer.drawSegment(`ray_${angle2}`, ray2Start.x, ray2Start.y, ray2End.x, ray2End.y, CONFIG.rayColor, 2, 400);

    const P2 = pointOnCircle(O.x, O.y, CONFIG.innerRadius, angle2);
    drawer.createPoint(`P${angle2}`, P2.x, P2.y, CONFIG.pointColor, 5);
    await drawer.showPoint(`P${angle2}`, 200);

    canvas.regle.hide();
    canvas.crayon.hide();

    // Corde
    await drawer.drawSegment('chord1', P90.x, P90.y, P2.x, P2.y, CONFIG.chordColor, 2.5, 400);
    tempElements.push(canvas.objects['chord1'].element);

    await canvas.wait(400);

    // ========================================
    // ÉTAPE 6 : Mémoriser la corde
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
    // ÉTAPE 7 : Reports vers la gauche (jusqu'à 180° + 2*baseAngle)
    // ========================================
    updateStepInfo('Reports a gauche', 'On reporte l\'angle vers la gauche (tous les rayons complets).');
    await canvas.wait(400);

    let prevPoint = P2;
    let prevAngle = angle2;

    // Stocker les angles des rayons pour le gommage ultérieur
    const allRayAngles = [90, angle2];

    for (let angle = 90 + 2 * CONFIG.baseAngle; angle <= 180 + 2 * CONFIG.baseAngle; angle += CONFIG.baseAngle) {
        const progress = (angle - 90) / (180 + 2 * CONFIG.baseAngle - 90);
        animateZoomTo(ZOOM_START + (1.0 - ZOOM_START) * progress * 0.5, 300);

        const newPoint = pointOnCircle(O.x, O.y, CONFIG.innerRadius, angle);

        // Arc de report
        await canvas.compas.moveTo(prevPoint.x, prevPoint.y, 200);
        const angleToNew = Math.atan2(-(newPoint.y - prevPoint.y), newPoint.x - prevPoint.x) * 180 / Math.PI;
        await canvas.compas.rotateTo(angleToNew - 90, 150);

        await drawer.drawArc(`reportL_${angle}`, prevPoint.x, prevPoint.y, chordLen,
            angleToNew - 20, angleToNew + 20, CONFIG.chordColor, 1.5, 200);
        tempElements.push(canvas.objects[`reportL_${angle}`].element);

        canvas.compas.hide();

        // TOUS les rayons sont COMPLETS pendant cette phase
        const rayStart = pointOnCircle(O.x, O.y, CONFIG.orchestraRadius, angle);
        const rayEnd = pointOnCircle(O.x, O.y, outerRadius, angle);

        canvas.regle.setPosition(O.x, O.y - 25, -angle);
        canvas.regle.show();
        await canvas.wait(100);

        canvas.crayon.setPosition(rayStart.x, rayStart.y);
        canvas.crayon.show();
        await drawer.drawSegment(`ray_${angle}`, rayStart.x, rayStart.y, rayEnd.x, rayEnd.y, CONFIG.rayColor, 2, 250);

        drawer.createPoint(`P${angle}`, newPoint.x, newPoint.y, CONFIG.pointColor, 5);
        await drawer.showPoint(`P${angle}`, 100);

        canvas.regle.hide();
        canvas.crayon.hide();
        canvas.compas.show();

        allRayAngles.push(angle);
        prevPoint = newPoint;
        prevAngle = angle;
        await canvas.wait(80);
    }

    // ========================================
    // ÉTAPE 8 : Reports vers la droite (jusqu'à -2*baseAngle)
    // ========================================
    updateStepInfo('Reports a droite', 'On reporte l\'angle vers la droite (tous les rayons complets).');
    await canvas.wait(400);

    prevPoint = P90;
    prevAngle = 90;

    for (let angle = 90 - CONFIG.baseAngle; angle >= -2 * CONFIG.baseAngle; angle -= CONFIG.baseAngle) {
        const newPoint = pointOnCircle(O.x, O.y, CONFIG.innerRadius, angle);

        // Arc de report
        await canvas.compas.moveTo(prevPoint.x, prevPoint.y, 200);
        const angleToNew = Math.atan2(-(newPoint.y - prevPoint.y), newPoint.x - prevPoint.x) * 180 / Math.PI;
        await canvas.compas.rotateTo(angleToNew - 90, 150);

        await drawer.drawArc(`reportR_${angle}`, prevPoint.x, prevPoint.y, chordLen,
            angleToNew - 20, angleToNew + 20, CONFIG.chordColor, 1.5, 200);
        tempElements.push(canvas.objects[`reportR_${angle}`].element);

        canvas.compas.hide();

        // TOUS les rayons sont COMPLETS pendant cette phase
        const rayStart = pointOnCircle(O.x, O.y, CONFIG.orchestraRadius, angle);
        const rayEnd = pointOnCircle(O.x, O.y, outerRadius, angle);

        canvas.regle.setPosition(O.x, O.y - 25, -angle);
        canvas.regle.show();
        await canvas.wait(100);

        canvas.crayon.setPosition(rayStart.x, rayStart.y);
        canvas.crayon.show();
        await drawer.drawSegment(`ray_${angle}`, rayStart.x, rayStart.y, rayEnd.x, rayEnd.y, CONFIG.rayColor, 2, 250);

        drawer.createPoint(`P${angle}`, newPoint.x, newPoint.y, CONFIG.pointColor, 5);
        await drawer.showPoint(`P${angle}`, 100);

        canvas.regle.hide();
        canvas.crayon.hide();
        canvas.compas.show();

        allRayAngles.push(angle);
        prevPoint = newPoint;
        prevAngle = angle;
        await canvas.wait(80);
    }

    canvas.compas.hide();
    await canvas.wait(500);

    // ========================================
    // ÉTAPE 10 : Arcs secondaires (optionnel - pour affiner)
    // ========================================
    await animateZoomTo(0.95, 600);

    updateStepInfo('Arcs secondaires', 'On ajoute des arcs intermediaires pour les rangees de sieges.');
    await canvas.wait(400);

    canvas.compas.setPosition(O.x, O.y, -90);
    canvas.compas.show();

    // Zone 1 : arcs secondaires seulement (le premier arc principal est déjà tracé)
    for (let k = 1; k < CONFIG.zone1Rows; k++) {
        const rowRadius = CONFIG.zone1Start + k * CONFIG.zone1Step;
        canvas.compas.setEcart(rowRadius);
        await canvas.wait(80);
        await drawer.drawArc(`rowZ1_${k}`, O.x, O.y, rowRadius, minAngle, maxAngle, CONFIG.zone1Color, 1.5, 250);
    }

    // Zone 2 : arcs secondaires
    for (let k = 1; k < CONFIG.zone2Rows; k++) {
        const rowRadius = CONFIG.zone2Start + k * CONFIG.zone2Step;
        canvas.compas.setEcart(rowRadius);
        await canvas.wait(80);
        await drawer.drawArc(`rowZ2_${k}`, O.x, O.y, rowRadius, minAngle, maxAngle, CONFIG.zone2Color, 1.5, 250);
    }

    // Zone 3 : arcs secondaires (sauf le dernier qui est déjà tracé)
    for (let k = 1; k < CONFIG.zone3Rows - 1; k++) {
        const rowRadius = CONFIG.zone3Start + k * CONFIG.zone3Step;
        canvas.compas.setEcart(rowRadius);
        await canvas.wait(80);
        await drawer.drawArc(`rowZ3_${k}`, O.x, O.y, rowRadius, minAngle, maxAngle, CONFIG.zone3Color, 1.5, 250);
    }

    canvas.compas.hide();
    await canvas.wait(400);

    // ========================================
    // ÉTAPE 11 : Gommage (alternance)
    // ========================================
    await animateZoomTo(ZOOM_END, 600);

    updateStepInfo('Gommage', 'On efface la partie interieure des rayons impairs (alternance).');
    await canvas.wait(500);

    // Trier les angles par distance au centre (90°)
    allRayAngles.sort((a, b) => Math.abs(a - 90) - Math.abs(b - 90));

    // Effacer la partie intérieure des rayons d'index impair
    for (let i = 0; i < allRayAngles.length; i++) {
        const angle = allRayAngles[i];
        const indexFromCenter = Math.round(Math.abs(angle - 90) / CONFIG.baseAngle);

        if (indexFromCenter % 2 === 1) {
            // Rayon impair : effacer de l'orchestre à la rangée du milieu
            const eraseStart = pointOnCircle(O.x, O.y, CONFIG.orchestraRadius - 2, angle);
            const eraseEnd = pointOnCircle(O.x, O.y, diazoma1Radius + 2, angle);

            // Dessiner un segment blanc pour "gommer"
            const eraseLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            eraseLine.setAttribute('x1', eraseStart.x);
            eraseLine.setAttribute('y1', eraseStart.y);
            eraseLine.setAttribute('x2', eraseEnd.x);
            eraseLine.setAttribute('y2', eraseEnd.y);
            eraseLine.setAttribute('stroke', '#ffffff');
            eraseLine.setAttribute('stroke-width', '5');
            eraseLine.setAttribute('stroke-linecap', 'round');
            canvas.layerConstructions.appendChild(eraseLine);

            await canvas.wait(100);
        }
    }

    await canvas.wait(400);

    // (Les points aux intersections sont supprimés - les arcs suffisent)
    await canvas.wait(300);

    // ========================================
    // NETTOYAGE
    // ========================================
    updateStepInfo('Nettoyage', 'On efface les constructions auxiliaires et le centre.');
    await canvas.wait(400);

    // Effacer les éléments temporaires (arcs de report, cordes)
    for (const el of tempElements) {
        if (el) {
            el.style.transition = 'opacity 0.5s';
            el.style.opacity = '0';
        }
    }

    // Effacer aussi le point O et son label
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

    updateStepInfo('Theatre termine !', 'Le theatre d\'Epidaure est construit par report d\'angle !');

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
    const minAngle = -2 * CONFIG.baseAngle;
    const maxAngle = 180 + 2 * CONFIG.baseAngle;

    // diazoma1Radius pour l'alternance (rayons partiels commencent ici)
    const diazoma1RadiusExplore = CONFIG.diazoma1Radius;

    // ========================================
    // ÉTAPE 1 : Centre O
    // ========================================
    steps.push({
        title: 'Centre O',
        description: 'On place le centre O du theatre.',
        render: () => {
            drawPoint(O.x, O.y, '#2c3e50', 6);
            drawLabel('O', O.x + 10, O.y + 5);
        }
    });

    // ========================================
    // ÉTAPE 2 : Orchestre
    // ========================================
    steps.push({
        title: 'Orchestre',
        description: 'On trace le cercle de l\'orchestre.',
        render: () => {
            drawCircle(O.x, O.y, CONFIG.orchestraRadius, CONFIG.orchestraColor, 2.5);
        }
    });

    // ========================================
    // ÉTAPE 3 : Les 3 arcs principaux
    // ========================================
    steps.push({
        title: 'Arcs principaux',
        description: 'On trace les 3 arcs qui delimitent les zones de gradins.',
        render: () => {
            drawArc(O.x, O.y, CONFIG.zone1Start, minAngle, maxAngle, CONFIG.mainArcColor, 3);
            drawArc(O.x, O.y, CONFIG.zone2Start, minAngle, maxAngle, CONFIG.mainArcColor, 3);
            drawArc(O.x, O.y, CONFIG.zone3End, minAngle, maxAngle, CONFIG.mainArcColor, 3);
        }
    });

    // ========================================
    // ÉTAPE 4 : Premier rayon vertical (90°)
    // ========================================
    steps.push({
        title: 'Premier rayon',
        description: 'On trace le premier rayon vertical (axe de symetrie).',
        render: () => {
            const start = pointOnCircle(O.x, O.y, CONFIG.orchestraRadius, 90);
            const end = pointOnCircle(O.x, O.y, outerRadius, 90);
            drawSegment(start.x, start.y, end.x, end.y, CONFIG.rayColor, 2);
            // Point sur l'arc de construction
            const P90 = pointOnCircle(O.x, O.y, CONFIG.innerRadius, 90);
            drawPoint(P90.x, P90.y, CONFIG.pointColor, 5);
        }
    });

    // ========================================
    // ÉTAPE 5 : Arc de report
    // ========================================
    steps.push({
        title: 'Arc de report',
        description: 'On trace un arc pour le report d\'angle.',
        render: () => {
            drawArc(O.x, O.y, CONFIG.innerRadius, minAngle, maxAngle, CONFIG.chordColor, 1.5);
        }
    });

    // ========================================
    // ÉTAPE 6 : Angle de base (deuxième rayon + corde)
    // ========================================
    steps.push({
        title: 'Angle de base',
        description: 'On trace le deuxieme rayon et on memorise la corde.',
        render: () => {
            const angle2 = 90 + CONFIG.baseAngle;
            const start = pointOnCircle(O.x, O.y, CONFIG.orchestraRadius, angle2);
            const end = pointOnCircle(O.x, O.y, outerRadius, angle2);
            drawSegment(start.x, start.y, end.x, end.y, CONFIG.rayColor, 2);
            // Point sur l'arc
            const P90 = pointOnCircle(O.x, O.y, CONFIG.innerRadius, 90);
            const P2 = pointOnCircle(O.x, O.y, CONFIG.innerRadius, angle2);
            drawPoint(P2.x, P2.y, CONFIG.pointColor, 5);
            // Corde entre les deux points
            drawSegment(P90.x, P90.y, P2.x, P2.y, CONFIG.chordColor, 2.5);
        }
    });

    // ========================================
    // ÉTAPE 7 : Reports vers la gauche
    // ========================================
    for (let angle = 90 + 2 * CONFIG.baseAngle; angle <= maxAngle; angle += CONFIG.baseAngle) {
        steps.push({
            title: `Rayon ${angle}°`,
            description: angle <= 180
                ? `Report vers la gauche : ${angle}°`
                : `Cote gauche : ${angle}°`,
            render: () => {
                const start = pointOnCircle(O.x, O.y, CONFIG.orchestraRadius, angle);
                const end = pointOnCircle(O.x, O.y, outerRadius, angle);
                drawSegment(start.x, start.y, end.x, end.y, CONFIG.rayColor, 2);
                // Point sur l'arc de construction
                const P = pointOnCircle(O.x, O.y, CONFIG.innerRadius, angle);
                drawPoint(P.x, P.y, CONFIG.pointColor, 5);
            }
        });
    }

    // ========================================
    // ÉTAPE 8 : Reports vers la droite
    // ========================================
    for (let angle = 90 - CONFIG.baseAngle; angle >= minAngle; angle -= CONFIG.baseAngle) {
        steps.push({
            title: `Rayon ${angle}°`,
            description: angle >= 0
                ? `Report vers la droite : ${angle}°`
                : `Cote droit : ${angle}°`,
            render: () => {
                const start = pointOnCircle(O.x, O.y, CONFIG.orchestraRadius, angle);
                const end = pointOnCircle(O.x, O.y, outerRadius, angle);
                drawSegment(start.x, start.y, end.x, end.y, CONFIG.rayColor, 2);
                // Point sur l'arc de construction
                const P = pointOnCircle(O.x, O.y, CONFIG.innerRadius, angle);
                drawPoint(P.x, P.y, CONFIG.pointColor, 5);
            }
        });
    }

    // ========================================
    // ÉTAPE 9 : Arcs secondaires
    // ========================================
    steps.push({
        title: 'Arcs secondaires',
        description: 'On ajoute les arcs intermediaires pour les rangees de sieges.',
        render: () => {
            // Zone 1 : arcs secondaires
            for (let k = 1; k < CONFIG.zone1Rows; k++) {
                const rowRadius = CONFIG.zone1Start + k * CONFIG.zone1Step;
                drawArc(O.x, O.y, rowRadius, minAngle, maxAngle, CONFIG.zone1Color, 1.5);
            }
            // Zone 2 : arcs secondaires
            for (let k = 1; k < CONFIG.zone2Rows; k++) {
                const rowRadius = CONFIG.zone2Start + k * CONFIG.zone2Step;
                drawArc(O.x, O.y, rowRadius, minAngle, maxAngle, CONFIG.zone2Color, 1.5);
            }
            // Zone 3 : arcs secondaires (sauf le dernier)
            for (let k = 1; k < CONFIG.zone3Rows - 1; k++) {
                const rowRadius = CONFIG.zone3Start + k * CONFIG.zone3Step;
                drawArc(O.x, O.y, rowRadius, minAngle, maxAngle, CONFIG.zone3Color, 1.5);
            }
        }
    });

    // Étape de gommage
    steps.push({
        title: 'Gommage',
        description: 'On efface la partie interieure des rayons impairs pour creer l\'alternance.',
        render: () => {
            // Cette étape montre le résultat après gommage (rayons avec alternance)
            // On redessine tous les rayons avec l'alternance appliquée
            for (let angle = minAngle; angle <= maxAngle; angle += CONFIG.baseAngle) {
                const indexFromCenter = Math.round(Math.abs(angle - 90) / CONFIG.baseAngle);
                const isPartial = indexFromCenter % 2 === 1;
                const startRadius = isPartial ? diazoma1RadiusExplore : CONFIG.orchestraRadius;
                const start = pointOnCircle(O.x, O.y, startRadius, angle);
                const end = pointOnCircle(O.x, O.y, outerRadius, angle);
                drawSegment(start.x, start.y, end.x, end.y, CONFIG.rayColor, 2);
            }
        }
    });

    // Étape finale
    steps.push({
        title: 'Theatre termine',
        description: 'Le theatre d\'Epidaure complet avec ses 3 zones de gradins.',
        render: () => {
            // Orchestre
            drawCircle(O.x, O.y, CONFIG.orchestraRadius, CONFIG.orchestraColor, 2.5);

            // Tous les rayons avec alternance basée sur l'index depuis le centre (90°)
            const diazoma1RadiusFinal = CONFIG.diazoma1Radius;

            for (let angle = minAngle; angle <= maxAngle; angle += CONFIG.baseAngle) {
                const indexFromCenter = Math.round(Math.abs(angle - 90) / CONFIG.baseAngle);
                const isPartial = indexFromCenter % 2 === 1;
                const startRadius = isPartial ? diazoma1RadiusFinal : CONFIG.orchestraRadius;
                const start = pointOnCircle(O.x, O.y, startRadius, angle);
                const end = pointOnCircle(O.x, O.y, outerRadius, angle);
                drawSegmentFinal(start.x, start.y, end.x, end.y, CONFIG.rayColor, 2);
            }

            // Zone 1 - arcs seulement (pas de points)
            for (let k = 0; k < CONFIG.zone1Rows; k++) {
                const rowRadius = CONFIG.zone1Start + k * CONFIG.zone1Step;
                const isMain = (k === 0 || k === CONFIG.zone1Rows - 1);
                const color = isMain ? CONFIG.mainArcColor : CONFIG.zone1Color;
                const width = isMain ? 3 : 1.5;
                drawArcFinal(O.x, O.y, rowRadius, minAngle, maxAngle, color, width);
            }

            // Zone 2 - arcs seulement
            for (let k = 0; k < CONFIG.zone2Rows; k++) {
                const rowRadius = CONFIG.zone2Start + k * CONFIG.zone2Step;
                const isMain = (k === 0 || k === CONFIG.zone2Rows - 1);
                const color = isMain ? CONFIG.mainArcColor : CONFIG.zone2Color;
                const width = isMain ? 3 : 1.5;
                drawArcFinal(O.x, O.y, rowRadius, minAngle, maxAngle, color, width);
            }

            // Zone 3 - arcs seulement
            for (let k = 0; k < CONFIG.zone3Rows; k++) {
                const rowRadius = CONFIG.zone3Start + k * CONFIG.zone3Step;
                const isMain = (k === 0 || k === CONFIG.zone3Rows - 1);
                const color = isMain ? CONFIG.mainArcColor : CONFIG.zone3Color;
                const width = isMain ? 3 : 1.5;
                drawArcFinal(O.x, O.y, rowRadius, minAngle, maxAngle, color, width);
            }
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

function drawPointFinal(x, y, color, r) {
    const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    c.setAttribute('cx', x);
    c.setAttribute('cy', y);
    c.setAttribute('r', r);
    c.setAttribute('fill', color);
    layerFinal.appendChild(c);
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
