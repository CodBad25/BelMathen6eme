/**
 * Spirale d'Archimède - Construction à la règle et au compas
 *
 * Phase 1 : Construire l'éventail (reporter l'angle 15+ fois)
 * Phase 2 : Placer les points A, B, C, D... avec OB=2×OA, OC=3×OA, etc.
 * Phase 3 : Relier les points pour former la spirale
 */

// Configuration
const CONFIG = {
    centerX: 380,             // Centré horizontalement (plus à droite)
    centerY: 320,             // Position verticale (plus haut)
    unitLength: 18,           // Longueur OA (1 unité) - légèrement réduite
    baseAngle: 20,            // Angle entre chaque demi-droite
    numBranches: 16,          // Nombre de demi-droites (au moins 15 angles)
    arcRadius: 40,            // Rayon pour le report d'angle
    rayLength: 300,           // Longueur des demi-droites de construction
    constructionColor: '#3498db',
    chordColor: '#e74c3c',
    spiralColor: '#9b59b6',
    pointColor: '#27ae60',
    rayColor: '#bdc3c7',
    unitMarkColor: '#f39c12'  // Couleur pour les marques de report de longueur
};

// Noms des points : A, B, C, D, E, F, G, H, I, J, K, L, M, N, P, Q, R, S, T, U
const POINT_NAMES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'U'];

// État global
let currentMode = 'animation';
let canvas, drawer;
let svg, layerConstruction, layerFinal;
let steps = [];
let currentStep = 0;
let isAnimating = false;

// Zoom dynamique
let zoomGroup = null;
let currentZoom = 2.0;  // Zoom initial (rapproché)
const ZOOM_START = 2.0;  // Zoom au début (très rapproché pour voir les détails)
const ZOOM_END = 0.75;   // Zoom à la fin (recul pour voir l'ensemble)
let autoZoomEnabled = true;  // Le zoom automatique est-il actif ?

// Données calculées
let O, chordLength;
let arcPoints = [];      // Points sur l'arc (pour le report d'angle)
let spiralPoints = [];   // Points de la spirale (A, B, C, D...)

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

    // Précalculer les points sur l'arc (pour l'éventail)
    arcPoints = [];
    for (let i = 0; i < CONFIG.numBranches; i++) {
        arcPoints.push(pointOnCircle(O.x, O.y, CONFIG.arcRadius, i * CONFIG.baseAngle));
    }

    // Précalculer les points de la spirale
    // A sur rayon 1 à distance 1×unit, B sur rayon 2 à distance 2×unit, etc.
    spiralPoints = [];
    for (let i = 0; i < CONFIG.numBranches; i++) {
        const angle = i * CONFIG.baseAngle;
        const distance = (i + 1) * CONFIG.unitLength;
        spiralPoints.push({
            ...pointOnCircle(O.x, O.y, distance, angle),
            name: POINT_NAMES[i]
        });
    }

    // Longueur de la corde pour l'angle de base
    const P0 = pointOnCircle(O.x, O.y, CONFIG.arcRadius, 0);
    const P1 = pointOnCircle(O.x, O.y, CONFIG.arcRadius, CONFIG.baseAngle);
    chordLength = distance(P0, P1);
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
        document.getElementById('zoomValue').textContent = '×' + zoom.toFixed(1);

        // Désactiver le zoom automatique dès que l'utilisateur touche le slider
        if (autoZoomEnabled) {
            autoZoomEnabled = false;
            document.getElementById('zoomValue').textContent = '×' + zoom.toFixed(1) + ' (manuel)';
        }

        if (zoomGroup) {
            currentZoom = zoom;
            applyZoom(zoom, false); // false = ne pas mettre à jour le slider
        }
    });
}

function setupAnimationMode() {
    canvas = new GeoCanvas('canvas');
    drawer = new GeoDrawer(canvas);
    canvas.speed = parseFloat(document.getElementById('speedSlider').value);

    // Créer le groupe de zoom qui englobera tout le contenu (y compris les instruments)
    zoomGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    zoomGroup.setAttribute('id', 'zoomGroup');

    // Déplacer TOUS les calques dans le groupe de zoom (constructions, points, instruments, labels)
    const layers = [
        canvas.layerConstructions,
        canvas.layerPoints,
        canvas.layerInstruments,  // Important : inclure les instruments !
        canvas.layerLabels
    ];
    for (const layer of layers) {
        zoomGroup.appendChild(layer);
    }
    canvas.svg.appendChild(zoomGroup);

    // Appliquer le zoom initial
    currentZoom = ZOOM_START;
    applyZoom(currentZoom);

    updateStepInfo('Prêt', 'Cliquez sur "Lancer l\'animation" pour voir la construction de la spirale d\'Archimède.');
}

// Appliquer le zoom centré sur O
function applyZoom(scale, updateSlider = true) {
    if (!zoomGroup) return;

    // Utiliser les dimensions du viewBox (700x600) car canvas.width peut être NaN
    const svgWidth = canvas.width || 700;
    const svgHeight = canvas.height || 600;

    // Centre du SVG
    const cx = svgWidth / 2;
    const cy = svgHeight / 2;

    // Translation pour centrer le zoom sur O
    const translateX = cx - O.x * scale;
    const translateY = cy - O.y * scale;

    zoomGroup.setAttribute('transform', `translate(${translateX}, ${translateY}) scale(${scale})`);

    // Mettre à jour le slider de zoom (sauf si demandé autrement)
    if (updateSlider) {
        const zoomSlider = document.getElementById('zoomSlider');
        const zoomValue = document.getElementById('zoomValue');
        if (zoomSlider && zoomValue) {
            zoomSlider.value = scale;
            zoomValue.textContent = '×' + scale.toFixed(1);
        }
    }
}

// Transition fluide du zoom (seulement si le zoom automatique est actif)
async function animateZoomTo(targetZoom, duration = 800) {
    // Si le zoom manuel est activé, on ne fait rien
    if (!autoZoomEnabled) return;

    if (!canvas || !zoomGroup) return;

    const startZoom = currentZoom;
    const startTime = performance.now();

    return new Promise(resolve => {
        function step(now) {
            // Vérifier à chaque frame si le zoom automatique est toujours actif
            if (!autoZoomEnabled) {
                resolve();
                return;
            }

            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing (ease-out)
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
        document.getElementById('btnPause').textContent = '⏸ Pause';
        return;
    }

    if (isAnimating) return;

    isAnimating = true;
    document.getElementById('btnPlay').textContent = '⏳ En cours...';
    document.getElementById('btnPlay').classList.add('playing');

    canvas.clear();
    await buildSpiralAnimated();

    isAnimating = false;
    document.getElementById('btnPlay').textContent = '▶ Lancer l\'animation';
    document.getElementById('btnPlay').classList.remove('playing');
}

function togglePauseAnimation() {
    if (!isAnimating) return;

    if (canvas.isPaused) {
        canvas.resume();
        document.getElementById('btnPause').textContent = '⏸ Pause';
    } else {
        canvas.pause();
        document.getElementById('btnPause').textContent = '▶ Reprendre';
    }
}

function resetAnimation() {
    if (canvas) {
        canvas.stop();
    }
    isAnimating = false;

    // Réactiver le zoom automatique
    autoZoomEnabled = true;

    // Réinitialiser complètement le SVG
    const svgEl = document.getElementById('canvas');
    svgEl.innerHTML = '';

    // Recréer le canvas
    setupAnimationMode();

    document.getElementById('btnPlay').textContent = '▶ Lancer l\'animation';
    document.getElementById('btnPlay').classList.remove('playing');
    document.getElementById('btnPause').textContent = '⏸ Pause';
    updateStepInfo('Prêt', 'Cliquez sur "Lancer l\'animation" pour voir la construction de la spirale d\'Archimède.');
}

// ============================================
// CONSTRUCTION ANIMÉE
// ============================================
async function buildSpiralAnimated() {
    let elementsToRemove = [];
    const localArcPoints = [];

    // Réinitialiser le zoom automatique au début
    autoZoomEnabled = true;
    currentZoom = ZOOM_START;
    applyZoom(currentZoom);

    // ========================================
    // PHASE 1 : CONSTRUIRE L'ÉVENTAIL
    // ========================================

    // === Étape 1 : Point O ===
    updateStepInfo('Phase 1 - Étape 1', 'On place le point O, centre de la spirale.');
    await canvas.wait(800);

    drawer.createPoint('O', O.x, O.y, '#2c3e50', 7);
    await drawer.showPoint('O', 400);
    drawer.createLabel('O', 'O', O.x - 20, O.y + 5);
    await drawer.showLabel('O');
    await canvas.wait(600);

    // === Étape 2 : Première demi-droite [OA) ===
    updateStepInfo('Phase 1 - Étape 2', 'On trace la première demi-droite d\'origine O.');
    await canvas.wait(600);

    const ray0End = pointOnCircle(O.x, O.y, CONFIG.rayLength, 0);

    canvas.regle.setPosition(O.x, O.y - 25, 0);
    canvas.regle.show();
    await canvas.wait(400);

    canvas.crayon.setPosition(O.x, O.y);
    canvas.crayon.show();
    await drawer.drawSegment('ray0', O.x, O.y, ray0End.x, ray0End.y, CONFIG.rayColor, 1.5, 600);
    elementsToRemove.push(canvas.objects['ray0'].element);

    canvas.regle.hide();
    canvas.crayon.hide();
    await canvas.wait(500);

    // === Étape 3 : Arc et point P₀ ===
    updateStepInfo('Phase 1 - Étape 3', 'On trace un arc centré en O. Il coupe la demi-droite en P₀.');
    await canvas.wait(600);

    const P0 = pointOnCircle(O.x, O.y, CONFIG.arcRadius, 0);
    localArcPoints.push(P0);

    canvas.compas.setEcart(CONFIG.arcRadius);
    canvas.compas.setPosition(O.x, O.y, -90);
    canvas.compas.show();
    await canvas.wait(400);

    const totalAngle = (CONFIG.numBranches - 1) * CONFIG.baseAngle;
    await drawer.drawArc('arcPrincipal', O.x, O.y, CONFIG.arcRadius, 0, totalAngle, CONFIG.constructionColor, 2, 1200);
    elementsToRemove.push(canvas.objects['arcPrincipal'].element);

    drawer.createPoint('P0', P0.x, P0.y, CONFIG.constructionColor, 5);
    await drawer.showPoint('P0', 200);
    drawer.createLabel('P0', 'P₀', P0.x + 5, P0.y + 18);
    await drawer.showLabel('P0');
    elementsToRemove.push(canvas.objects['P0'].element);
    elementsToRemove.push(canvas.objects['label-P0'].element);

    canvas.compas.hide();
    await canvas.wait(600);

    // === Étape 4 : Deuxième demi-droite + P₁ ===
    updateStepInfo('Phase 1 - Étape 4', 'On trace une deuxième demi-droite pour créer l\'angle de départ. L\'arc la coupe en P₁.');
    await canvas.wait(600);

    const ray1End = pointOnCircle(O.x, O.y, CONFIG.rayLength, CONFIG.baseAngle);
    const P1 = pointOnCircle(O.x, O.y, CONFIG.arcRadius, CONFIG.baseAngle);
    localArcPoints.push(P1);

    canvas.regle.setPosition(O.x, O.y - 25, -CONFIG.baseAngle);
    canvas.regle.show();
    await canvas.wait(400);

    canvas.crayon.setPosition(O.x, O.y);
    canvas.crayon.show();
    await drawer.drawSegment('ray1', O.x, O.y, ray1End.x, ray1End.y, CONFIG.rayColor, 1.5, 600);
    elementsToRemove.push(canvas.objects['ray1'].element);

    drawer.createPoint('P1', P1.x, P1.y, CONFIG.constructionColor, 5);
    await drawer.showPoint('P1', 200);
    const lbl1 = CONFIG.baseAngle * Math.PI / 180;
    drawer.createLabel('P1', 'P₁', P1.x + 12 * Math.cos(lbl1), P1.y - 12 * Math.sin(lbl1));
    await drawer.showLabel('P1');
    elementsToRemove.push(canvas.objects['P1'].element);
    elementsToRemove.push(canvas.objects['label-P1'].element);

    canvas.regle.hide();
    canvas.crayon.hide();
    await canvas.wait(600);

    // === Étape 5 : Corde P₀P₁ ===
    updateStepInfo('Phase 1 - Étape 5', 'On trace la CORDE P₀P₁. Cette distance caractérise notre angle.');
    await canvas.wait(600);

    canvas.crayon.setPosition(P0.x, P0.y);
    canvas.crayon.show();
    await drawer.drawSegment('chord01', P0.x, P0.y, P1.x, P1.y, CONFIG.chordColor, 3, 500);
    canvas.crayon.hide();
    await canvas.wait(500);

    // === Étape 6 : Mémoriser la corde ===
    updateStepInfo('Phase 1 - Étape 6', 'On place le compas sur P₀ et on écarte jusqu\'à P₁ pour mémoriser la corde.');
    await canvas.wait(600);

    // Indicateur sur P₀
    const highlightP0 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    highlightP0.setAttribute('cx', P0.x);
    highlightP0.setAttribute('cy', P0.y);
    highlightP0.setAttribute('r', '12');
    highlightP0.setAttribute('fill', 'none');
    highlightP0.setAttribute('stroke', CONFIG.chordColor);
    highlightP0.setAttribute('stroke-width', '3');
    highlightP0.setAttribute('opacity', '0.8');
    canvas.layerConstructions.appendChild(highlightP0);

    const angleP0P1 = Math.atan2(P1.y - P0.y, P1.x - P0.x) * 180 / Math.PI;
    canvas.compas.setEcart(10);
    canvas.compas.setPosition(P0.x, P0.y, angleP0P1);
    canvas.compas.show();
    await canvas.wait(500);

    // Cible sur P₁
    const targetP1 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    targetP1.setAttribute('cx', P1.x);
    targetP1.setAttribute('cy', P1.y);
    targetP1.setAttribute('r', '15');
    targetP1.setAttribute('fill', 'none');
    targetP1.setAttribute('stroke', CONFIG.chordColor);
    targetP1.setAttribute('stroke-width', '2');
    targetP1.setAttribute('stroke-dasharray', '4,4');
    targetP1.setAttribute('opacity', '0.6');
    canvas.layerConstructions.appendChild(targetP1);

    await canvas.compas.ecarterTo(chordLength, 1200);

    targetP1.setAttribute('stroke', '#27ae60');
    targetP1.setAttribute('stroke-width', '4');
    targetP1.setAttribute('stroke-dasharray', 'none');
    targetP1.setAttribute('opacity', '1');

    updateStepInfo('Phase 1 - Étape 6', 'Pointe sèche sur P₀, mine sur P₁. Cet écartement sera utilisé pour tous les reports !');
    await canvas.wait(1000);

    highlightP0.remove();
    targetP1.remove();

    // === Reports successifs pour créer l'éventail ===
    for (let i = 2; i < CONFIG.numBranches; i++) {
        const currentAngle = i * CONFIG.baseAngle;
        const prevPoint = localArcPoints[i - 1];

        // Zoom progressif pendant la Phase 1 (de ZOOM_START vers 1.1)
        const phase1Progress = (i - 2) / (CONFIG.numBranches - 3);
        const targetZoomPhase1 = ZOOM_START + (1.1 - ZOOM_START) * phase1Progress;
        animateZoomTo(targetZoomPhase1, 400); // Animation en parallèle

        updateStepInfo(`Phase 1 - Report ${i - 1}`, `On reporte l'angle avec la corde mémorisée.`);
        await canvas.wait(300);

        // Arc de report
        canvas.compas.setEcart(chordLength);
        const orientAngle = (currentAngle - CONFIG.baseAngle / 2);
        await canvas.compas.moveTo(prevPoint.x, prevPoint.y, 400);
        await canvas.compas.rotateTo(-orientAngle - 90, 300);
        await canvas.wait(200);

        const newArcPoint = pointOnCircle(O.x, O.y, CONFIG.arcRadius, currentAngle);
        const angleToNew = Math.atan2(-(newArcPoint.y - prevPoint.y), newArcPoint.x - prevPoint.x) * 180 / Math.PI;

        await drawer.drawArc(`reportArc${i}`, prevPoint.x, prevPoint.y, chordLength,
            angleToNew - 30, angleToNew + 30, CONFIG.chordColor, 2, 400);
        elementsToRemove.push(canvas.objects[`reportArc${i}`].element);

        // Nouveau point P sur l'arc
        localArcPoints.push(newArcPoint);

        // Tracer la nouvelle demi-droite
        const rayEnd = pointOnCircle(O.x, O.y, CONFIG.rayLength, currentAngle);

        canvas.compas.hide();
        canvas.regle.setPosition(O.x, O.y - 25, -currentAngle);
        canvas.regle.show();
        await canvas.wait(300);

        canvas.crayon.setPosition(O.x, O.y);
        canvas.crayon.show();
        await drawer.drawSegment(`ray${i}`, O.x, O.y, rayEnd.x, rayEnd.y, CONFIG.rayColor, 1.5, 400);
        elementsToRemove.push(canvas.objects[`ray${i}`].element);

        canvas.regle.hide();
        canvas.crayon.hide();

        if (i < CONFIG.numBranches - 1) {
            canvas.compas.show();
        }
        await canvas.wait(200);
    }

    canvas.compas.hide();
    await canvas.wait(500);

    // ========================================
    // PHASE 2 : PLACER LES POINTS DE LA SPIRALE
    // ========================================

    // Transition de zoom vers la Phase 2
    await animateZoomTo(1.0, 600);

    updateStepInfo('Phase 2', 'Maintenant, on place les points A, B, C, D... avec des distances croissantes.');
    await canvas.wait(1000);

    const placedPoints = [];
    const unitMarks = []; // Pour stocker les petites marques de report

    // === Étape spéciale : Mesurer OA sur la première demi-droite ===
    updateStepInfo('Phase 2 - Mesure OA', 'On choisit une longueur OA qui sera notre unité de mesure.');
    await canvas.wait(800);

    const pointA = pointOnCircle(O.x, O.y, CONFIG.unitLength, 0);

    // Indicateur sur O (pointe sèche)
    const highlightO = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    highlightO.setAttribute('cx', O.x);
    highlightO.setAttribute('cy', O.y);
    highlightO.setAttribute('r', '12');
    highlightO.setAttribute('fill', 'none');
    highlightO.setAttribute('stroke', CONFIG.unitMarkColor);
    highlightO.setAttribute('stroke-width', '3');
    highlightO.setAttribute('opacity', '0.8');
    canvas.layerConstructions.appendChild(highlightO);

    // Compas sur O, orienté vers la première demi-droite
    canvas.compas.setEcart(5);
    canvas.compas.setPosition(O.x, O.y, 0);
    canvas.compas.show();
    await canvas.wait(500);

    // Cible sur la position de A
    const targetA = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    targetA.setAttribute('cx', pointA.x);
    targetA.setAttribute('cy', pointA.y);
    targetA.setAttribute('r', '15');
    targetA.setAttribute('fill', 'none');
    targetA.setAttribute('stroke', CONFIG.unitMarkColor);
    targetA.setAttribute('stroke-width', '2');
    targetA.setAttribute('stroke-dasharray', '4,4');
    targetA.setAttribute('opacity', '0.7');
    canvas.layerConstructions.appendChild(targetA);

    // Écarter le compas jusqu'à la position de A
    await canvas.compas.ecarterTo(CONFIG.unitLength, 1000);

    targetA.setAttribute('stroke', '#27ae60');
    targetA.setAttribute('stroke-width', '4');
    targetA.setAttribute('stroke-dasharray', 'none');
    targetA.setAttribute('opacity', '1');

    updateStepInfo('Phase 2 - Mesure OA', 'Le compas a mémorisé la longueur OA. C\'est notre unité !');
    await canvas.wait(1000);

    // Placer le point A
    drawer.createPoint('spiral0', pointA.x, pointA.y, CONFIG.pointColor, 6);
    await drawer.showPoint('spiral0', 300);
    drawer.createLabel('spiral0', 'A', pointA.x + 15, pointA.y - 5);
    await drawer.showLabel('spiral0');
    placedPoints.push(pointA);

    highlightO.remove();
    targetA.remove();
    canvas.compas.hide();
    await canvas.wait(600);

    // === Placer les autres points en reportant OA ===
    for (let i = 1; i < CONFIG.numBranches; i++) {
        const pointName = POINT_NAMES[i];
        const angle = i * CONFIG.baseAngle;
        const dist = (i + 1) * CONFIG.unitLength;
        const point = pointOnCircle(O.x, O.y, dist, angle);

        // Zoom progressif pendant la Phase 2 (de 1.0 vers ZOOM_END)
        const phase2Progress = i / (CONFIG.numBranches - 1);
        const targetZoomPhase2 = 1.0 + (ZOOM_END - 1.0) * phase2Progress;
        animateZoomTo(targetZoomPhase2, 500); // Animation en parallèle

        updateStepInfo(`Phase 2 - Point ${pointName}`, `On place ${pointName} : O${pointName} = ${i + 1} × OA. On reporte ${i + 1} fois la longueur OA.`);
        await canvas.wait(600);

        // Montrer le report pas à pas sur cette demi-droite
        canvas.compas.setEcart(CONFIG.unitLength);
        canvas.compas.setPosition(O.x, O.y, -angle);
        canvas.compas.show();

        // Indicateur sur O
        const highlightStart = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        highlightStart.setAttribute('cx', O.x);
        highlightStart.setAttribute('cy', O.y);
        highlightStart.setAttribute('r', '10');
        highlightStart.setAttribute('fill', 'none');
        highlightStart.setAttribute('stroke', CONFIG.unitMarkColor);
        highlightStart.setAttribute('stroke-width', '2');
        canvas.layerConstructions.appendChild(highlightStart);

        await canvas.wait(300);

        // Reporter la distance i+1 fois
        const currentRayMarks = []; // Marques pour cette demi-droite
        for (let j = 1; j <= i + 1; j++) {
            const markPos = pointOnCircle(O.x, O.y, j * CONFIG.unitLength, angle);

            // Petite marque perpendiculaire à la demi-droite (fine)
            const perpAngle = (angle + 90) * Math.PI / 180;
            const markLength = 6;
            const mark = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            mark.setAttribute('x1', markPos.x - markLength * Math.cos(perpAngle));
            mark.setAttribute('y1', markPos.y + markLength * Math.sin(perpAngle));
            mark.setAttribute('x2', markPos.x + markLength * Math.cos(perpAngle));
            mark.setAttribute('y2', markPos.y - markLength * Math.sin(perpAngle));
            mark.setAttribute('stroke', CONFIG.unitMarkColor);
            mark.setAttribute('stroke-width', '1.5');
            mark.setAttribute('stroke-linecap', 'round');
            mark.style.opacity = '0';
            canvas.layerConstructions.appendChild(mark);
            currentRayMarks.push(mark);
            unitMarks.push(mark);

            // Animer l'arc de report
            const prevPos = pointOnCircle(O.x, O.y, (j - 1) * CONFIG.unitLength, angle);

            // Déplacer le compas à la position précédente
            if (j > 1) {
                await canvas.compas.moveTo(prevPos.x, prevPos.y, 200);
            }

            // Tracer un petit arc de report (plus fin)
            const arcStartAngle = angle - 25;
            const arcEndAngle = angle + 25;
            await drawer.drawArc(`unitArc${i}_${j}`, prevPos.x, prevPos.y, CONFIG.unitLength,
                arcStartAngle, arcEndAngle, CONFIG.unitMarkColor, 1, 250);
            elementsToRemove.push(canvas.objects[`unitArc${i}_${j}`].element);

            // Faire apparaître la marque avec animation
            mark.style.transition = 'opacity 0.3s';
            mark.style.opacity = '1';

            await canvas.wait(100);
        }

        // Ajouter le label près du point final (à l'extérieur de la spirale)
        const lblAngleRad = angle * Math.PI / 180;
        const labelDistance = (i + 1) * CONFIG.unitLength + 25; // Au-delà du point
        const labelPos = pointOnCircle(O.x, O.y, labelDistance, angle);
        const multipleLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        multipleLabel.setAttribute('x', labelPos.x);
        multipleLabel.setAttribute('y', labelPos.y);
        multipleLabel.setAttribute('fill', CONFIG.unitMarkColor);
        multipleLabel.setAttribute('font-size', '10');
        multipleLabel.setAttribute('font-weight', 'normal');
        multipleLabel.setAttribute('font-family', 'Arial, sans-serif');
        multipleLabel.setAttribute('text-anchor', 'middle');
        multipleLabel.setAttribute('dominant-baseline', 'middle');
        multipleLabel.textContent = `${i + 1}×OA`;
        multipleLabel.style.opacity = '0';
        canvas.layerConstructions.appendChild(multipleLabel);
        unitMarks.push(multipleLabel);

        multipleLabel.style.transition = 'opacity 0.3s';
        multipleLabel.style.opacity = '1';

        highlightStart.remove();
        canvas.compas.hide();
        await canvas.wait(300);

        // Placer le point final
        drawer.createPoint(`spiral${i}`, point.x, point.y, CONFIG.pointColor, 6);
        await drawer.showPoint(`spiral${i}`, 300);

        const lblAngle = angle * Math.PI / 180;
        const lblOffset = 18;
        drawer.createLabel(`spiral${i}`, pointName,
            point.x + lblOffset * Math.cos(lblAngle),
            point.y - lblOffset * Math.sin(lblAngle));
        await drawer.showLabel(`spiral${i}`);

        placedPoints.push(point);
        await canvas.wait(400);
    }

    await canvas.wait(800);

    // Effacer les marques de report progressivement
    updateStepInfo('Phase 2 - Terminée', 'Tous les points sont placés. On efface les marques de construction.');
    await canvas.wait(500);

    for (const mark of unitMarks) {
        mark.style.transition = 'opacity 0.4s';
        mark.style.opacity = '0';
    }
    await canvas.wait(600);
    for (const mark of unitMarks) {
        if (mark.parentNode) mark.remove();
    }

    // ========================================
    // PHASE 3 : RELIER LES POINTS
    // ========================================

    updateStepInfo('Phase 3', 'On relie les points A, B, C, D... pour former la spirale d\'Archimède !');
    await canvas.wait(800);

    canvas.crayon.setPosition(placedPoints[0].x, placedPoints[0].y);
    canvas.crayon.show();

    for (let i = 1; i < placedPoints.length; i++) {
        await drawer.drawSegment(`spiralSeg${i}`,
            placedPoints[i - 1].x, placedPoints[i - 1].y,
            placedPoints[i].x, placedPoints[i].y,
            CONFIG.spiralColor, 3, 300);
    }

    canvas.crayon.hide();
    await canvas.wait(600);

    // ========================================
    // NETTOYAGE
    // ========================================

    updateStepInfo('Nettoyage', 'On efface les traces de construction pour ne garder que la spirale.');
    await canvas.wait(800);

    // Ajouter les éléments à supprimer (labels des points P, corde initiale, etc.)
    if (canvas.objects['chord01']) elementsToRemove.push(canvas.objects['chord01'].element);

    for (const el of elementsToRemove) {
        if (el) {
            el.style.transition = 'opacity 0.4s';
            el.style.opacity = '0';
        }
    }
    await canvas.wait(600);

    for (const el of elementsToRemove) {
        if (el && el.parentNode) el.remove();
    }

    // ========================================
    // DÉCORATION FINALE
    // ========================================

    updateStepInfo('Décoration', 'Ajoutons les rayons OA, OB, OC... et une touche de couleur !');
    await canvas.wait(600);

    // Tracer les rayons OA, OB, OC... (du centre vers chaque point)
    const colors = ['#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#1abc9c', '#3498db', '#9b59b6', '#e91e63'];

    for (let i = 0; i < placedPoints.length; i++) {
        const color = colors[i % colors.length];
        const ray = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        ray.setAttribute('x1', O.x);
        ray.setAttribute('y1', O.y);
        ray.setAttribute('x2', placedPoints[i].x);
        ray.setAttribute('y2', placedPoints[i].y);
        ray.setAttribute('stroke', color);
        ray.setAttribute('stroke-width', '1.5');
        ray.setAttribute('stroke-linecap', 'round');
        ray.setAttribute('opacity', '0.6');
        canvas.layerConstructions.appendChild(ray);
        await canvas.wait(50);
    }

    await canvas.wait(400);

    // Colorer la spirale en dégradé

    for (let i = 1; i < placedPoints.length; i++) {
        const seg = canvas.objects[`spiralSeg${i}`];
        if (seg) {
            const color = colors[(i - 1) % colors.length];
            seg.element.style.transition = 'stroke 0.2s';
            seg.element.setAttribute('stroke', color);
            await canvas.wait(80);
        }
    }

    await canvas.wait(400);

    // ========================================
    // ZOOM FINAL + CONFETTIS
    // ========================================

    updateStepInfo('Bravo !', 'La spirale d\'Archimède est construite !');

    // Petit zoom avant pour la célébration
    await animateZoomTo(ZOOM_END + 0.15, 800);

    // Utiliser les dimensions du viewBox (700x600) car canvas.width peut être NaN
    const svgWidth = canvas.width || 700;
    const svgHeight = canvas.height || 600;

    // Confettis - dispersés sur toute la largeur
    const confettiColors = ['#e74c3c', '#f39c12', '#2ecc71', '#3498db', '#9b59b6', '#e91e63'];
    const confettis = [];

    for (let i = 0; i < 45; i++) {
        const confetti = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        const x = Math.random() * svgWidth;
        const y = -20 - Math.random() * 80;
        confetti.setAttribute('x', x);
        confetti.setAttribute('y', y);
        confetti.setAttribute('width', 8 + Math.random() * 6);
        confetti.setAttribute('height', 6 + Math.random() * 4);
        confetti.setAttribute('fill', confettiColors[Math.floor(Math.random() * confettiColors.length)]);
        confetti.setAttribute('rx', '2');
        canvas.svg.appendChild(confetti);

        confettis.push({
            el: confetti, x, y,
            speedY: 2 + Math.random() * 2.5,
            speedX: (Math.random() - 0.5) * 1.5,
            rot: Math.random() * 360,
            rotSpeed: (Math.random() - 0.5) * 10
        });
    }

    const startTime = performance.now();
    const animConfetti = () => {
        const elapsed = performance.now() - startTime;
        if (elapsed < 3500) {
            for (const c of confettis) {
                c.y += c.speedY;
                c.x += c.speedX + Math.sin(elapsed / 200) * 0.4;
                c.rot += c.rotSpeed;
                c.el.setAttribute('x', c.x);
                c.el.setAttribute('y', c.y);
                c.el.setAttribute('transform', `rotate(${c.rot}, ${c.x + 4}, ${c.y + 3})`);
                if (elapsed > 2500) {
                    c.el.setAttribute('opacity', 1 - (elapsed - 2500) / 1000);
                }
            }
            requestAnimationFrame(animConfetti);
        } else {
            confettis.forEach(c => c.el.remove());
        }
    };
    requestAnimationFrame(animConfetti);

    await canvas.wait(1000);
    updateStepInfo('Félicitations !', `Tu as construit une spirale d'Archimède avec ${CONFIG.numBranches - 1} angles égaux !`);
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

    // Phase 1 : L'éventail
    steps.push({
        title: 'Phase 1 - Centre O',
        description: 'On place le point O, centre de la spirale.',
        render: () => {
            drawPoint(O.x, O.y, '#2c3e50', 7);
            drawLabel('O', O.x - 20, O.y + 5);
        }
    });

    steps.push({
        title: 'Phase 1 - Première demi-droite',
        description: 'On trace la première demi-droite d\'origine O.',
        render: () => {
            const end = pointOnCircle(O.x, O.y, CONFIG.rayLength, 0);
            drawSegment(O.x, O.y, end.x, end.y, CONFIG.rayColor, 1.5);
        }
    });

    steps.push({
        title: 'Phase 1 - Arc et P₀',
        description: 'On trace un arc centré en O. Il coupe la demi-droite en P₀.',
        render: () => {
            const totalAngle = (CONFIG.numBranches - 1) * CONFIG.baseAngle;
            drawArc(O.x, O.y, CONFIG.arcRadius, 0, totalAngle, CONFIG.constructionColor, 2);
            const P0 = arcPoints[0];
            drawPoint(P0.x, P0.y, CONFIG.constructionColor, 5);
            drawLabel('P₀', P0.x + 5, P0.y + 18);
        }
    });

    steps.push({
        title: 'Phase 1 - Angle de départ',
        description: 'On trace une deuxième demi-droite. L\'arc la coupe en P₁.',
        render: () => {
            const end = pointOnCircle(O.x, O.y, CONFIG.rayLength, CONFIG.baseAngle);
            drawSegment(O.x, O.y, end.x, end.y, CONFIG.rayColor, 1.5);
            const P1 = arcPoints[1];
            drawPoint(P1.x, P1.y, CONFIG.constructionColor, 5);
            const lbl = CONFIG.baseAngle * Math.PI / 180;
            drawLabel('P₁', P1.x + 12 * Math.cos(lbl), P1.y - 12 * Math.sin(lbl));
        }
    });

    steps.push({
        title: 'Phase 1 - Corde P₀P₁',
        description: 'On trace la CORDE P₀P₁. Cette distance caractérise notre angle.',
        render: () => {
            drawSegment(arcPoints[0].x, arcPoints[0].y, arcPoints[1].x, arcPoints[1].y, CONFIG.chordColor, 3);
        }
    });

    steps.push({
        title: 'Phase 1 - Mémoriser',
        description: 'Le compas mémorise la longueur de la corde.',
        render: (isCurrent) => {
            if (isCurrent) {
                drawSegment(arcPoints[0].x, arcPoints[0].y, arcPoints[1].x, arcPoints[1].y, '#f39c12', 4);
            }
        }
    });

    // Reports d'angle
    for (let i = 2; i < CONFIG.numBranches; i++) {
        steps.push({
            title: `Phase 1 - Demi-droite ${i + 1}`,
            description: `On reporte l'angle et trace la demi-droite n°${i + 1}.`,
            render: () => {
                const end = pointOnCircle(O.x, O.y, CONFIG.rayLength, i * CONFIG.baseAngle);
                drawSegment(O.x, O.y, end.x, end.y, CONFIG.rayColor, 1.5);
            }
        });
    }

    // Phase 2 : Placer les points
    for (let i = 0; i < CONFIG.numBranches; i++) {
        const name = POINT_NAMES[i];
        steps.push({
            title: `Phase 2 - Point ${name}`,
            description: i === 0
                ? `On place ${name} sur la 1ère demi-droite : O${name} = 1 unité.`
                : `On place ${name} sur la demi-droite n°${i + 1} : O${name} = ${i + 1} × OA.`,
            render: () => {
                const pt = spiralPoints[i];
                drawPoint(pt.x, pt.y, CONFIG.pointColor, 6);
                const angle = i * CONFIG.baseAngle * Math.PI / 180;
                drawLabel(name, pt.x + 15 * Math.cos(angle), pt.y - 15 * Math.sin(angle));
            }
        });
    }

    // Phase 3 : Spirale finale
    steps.push({
        title: 'Phase 3 - Spirale',
        description: 'On relie les points pour former la spirale d\'Archimède !',
        render: () => {
            layerConstruction.innerHTML = '';
            const colors = ['#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#1abc9c', '#3498db', '#9b59b6', '#e91e63'];

            // Points
            for (let i = 0; i < spiralPoints.length; i++) {
                drawPointFinal(spiralPoints[i].x, spiralPoints[i].y, colors[i % colors.length], 5);
            }
            // Segments
            for (let i = 1; i < spiralPoints.length; i++) {
                drawSegmentFinal(spiralPoints[i-1].x, spiralPoints[i-1].y,
                    spiralPoints[i].x, spiralPoints[i].y, colors[(i-1) % colors.length], 3);
            }
            // Centre
            drawPointFinal(O.x, O.y, '#2c3e50', 7);
        }
    });
}

// ============================================
// FONCTIONS DE DESSIN
// ============================================
function drawSegment(x1, y1, x2, y2, color, width) {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1); line.setAttribute('y1', y1);
    line.setAttribute('x2', x2); line.setAttribute('y2', y2);
    line.setAttribute('stroke', color);
    line.setAttribute('stroke-width', width);
    line.setAttribute('stroke-linecap', 'round');
    layerConstruction.appendChild(line);
}

function drawPoint(x, y, color, r) {
    const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    c.setAttribute('cx', x); c.setAttribute('cy', y); c.setAttribute('r', r);
    c.setAttribute('fill', color);
    c.setAttribute('stroke', '#fff');
    c.setAttribute('stroke-width', '1');
    layerConstruction.appendChild(c);
}

function drawLabel(text, x, y) {
    const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    t.setAttribute('x', x); t.setAttribute('y', y);
    t.setAttribute('fill', '#333');
    t.setAttribute('font-size', '14');
    t.setAttribute('font-weight', 'bold');
    t.setAttribute('font-family', 'Arial, sans-serif');
    t.textContent = text;
    layerConstruction.appendChild(t);
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

function drawSegmentFinal(x1, y1, x2, y2, color, width) {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1); line.setAttribute('y1', y1);
    line.setAttribute('x2', x2); line.setAttribute('y2', y2);
    line.setAttribute('stroke', color);
    line.setAttribute('stroke-width', width);
    line.setAttribute('stroke-linecap', 'round');
    layerFinal.appendChild(line);
}

function drawPointFinal(x, y, color, r) {
    const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    c.setAttribute('cx', x); c.setAttribute('cy', y); c.setAttribute('r', r);
    c.setAttribute('fill', color);
    c.setAttribute('stroke', '#fff');
    c.setAttribute('stroke-width', '1');
    layerFinal.appendChild(c);
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
