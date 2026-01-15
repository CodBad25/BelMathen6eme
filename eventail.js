/**
 * Report d'angle avec le compas - Construction d'un éventail
 * Deux modes : Animation (avec instruments) et Exploration (avec timeline)
 */

// Configuration
const CONFIG = {
    originX: 180,
    originY: 420,
    baseAngle: 20,
    numBranches: 7,
    arcRadius: 140,
    constructionLength: 380,
    branchColor: '#2c3e50',
    arcColor: '#3498db',
    chordColor: '#e74c3c',
    reportArcColor: '#9b59b6',
    pointColor: '#27ae60'
};

const SUBSCRIPTS = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉'];

// État global
let currentMode = 'animation'; // 'animation' ou 'exploration'
let canvas, drawer;  // Pour le mode animation
let svg, layerConstruction, layerFinal; // Pour le mode exploration
let steps = [];
let currentStep = 0;
let isAnimating = false;

// Données calculées
let O, R, L, angle, totalAngle, chordLength;
let arcPoints = [];

// ============================================
// INITIALISATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    initConfig();
    buildSteps();
    initModeAnimation();
    initModeExploration();
    initModeSwitch();

    // Afficher le mode animation par défaut
    showMode('animation');
});

function initConfig() {
    O = { x: CONFIG.originX, y: CONFIG.originY };
    R = CONFIG.arcRadius;
    L = CONFIG.constructionLength;
    angle = CONFIG.baseAngle;
    totalAngle = angle * (CONFIG.numBranches - 1);

    // Précalculer tous les points
    arcPoints = [];
    for (let i = 0; i < CONFIG.numBranches; i++) {
        arcPoints.push(pointOnCircle(O.x, O.y, R, i * angle));
    }

    // Longueur de la corde
    chordLength = distance(arcPoints[0], arcPoints[1]);
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

    // Onglets
    document.getElementById('tabAnimation').classList.toggle('active', mode === 'animation');
    document.getElementById('tabExploration').classList.toggle('active', mode === 'exploration');

    // Panneaux
    document.getElementById('panelAnimation').classList.toggle('active', mode === 'animation');
    document.getElementById('panelExploration').classList.toggle('active', mode === 'exploration');

    // Réinitialiser le canvas
    const svgEl = document.getElementById('canvas');
    svgEl.innerHTML = '';

    if (mode === 'animation') {
        setupAnimationMode();
    } else {
        setupExplorationMode();
    }
}

// ============================================
// MODE ANIMATION (avec instruments)
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
}

function setupAnimationMode() {
    canvas = new GeoCanvas('canvas');
    drawer = new GeoDrawer(canvas);
    canvas.speed = parseFloat(document.getElementById('speedSlider').value);

    updateStepInfo('Prêt', 'Cliquez sur "Lancer l\'animation" pour voir la construction avec les instruments.');
}

async function startAnimation() {
    if (isAnimating && canvas.isPaused) {
        canvas.resume();
        document.getElementById('btnPlay').textContent = '▶ Lancer l\'animation';
        document.getElementById('btnPause').textContent = '⏸ Pause';
        return;
    }

    if (isAnimating) return;

    isAnimating = true;
    document.getElementById('btnPlay').textContent = '⏳ En cours...';
    document.getElementById('btnPlay').classList.add('playing');

    canvas.clear();
    await buildEventailAnimated();

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
        canvas.clear();
    }
    isAnimating = false;
    document.getElementById('btnPlay').textContent = '▶ Lancer l\'animation';
    document.getElementById('btnPlay').classList.remove('playing');
    document.getElementById('btnPause').textContent = '⏸ Pause';
    updateStepInfo('Prêt', 'Cliquez sur "Lancer l\'animation" pour voir la construction avec les instruments.');
}

// Construction animée avec instruments
async function buildEventailAnimated() {
    const localArcPoints = [];
    let elementsToRemove = [];

    // Étape 1 : Point O
    updateStepInfo('Étape 1', 'On place le point O, sommet de l\'éventail.');
    await canvas.wait(800);

    drawer.createPoint('O', O.x, O.y, '#2c3e50', 7);
    await drawer.showPoint('O', 400);
    drawer.createLabel('O', 'O', O.x - 20, O.y + 5);
    await drawer.showLabel('O');
    elementsToRemove.push(canvas.objects['O'].element);
    elementsToRemove.push(canvas.objects['label-O'].element);
    await canvas.wait(800);

    // Étape 2 : Première demi-droite
    updateStepInfo('Étape 2', 'On trace une première demi-droite d\'origine O.');
    await canvas.wait(600);

    const endPoint1 = pointOnCircle(O.x, O.y, L, 0);
    canvas.regle.setPosition(O.x, O.y - 25, 0);
    canvas.regle.show();
    await canvas.wait(400);

    canvas.crayon.setPosition(O.x, O.y);
    canvas.crayon.show();
    await drawer.drawSegment('construction0', O.x, O.y, endPoint1.x, endPoint1.y, CONFIG.branchColor, 2, 800);
    elementsToRemove.push(canvas.objects['construction0'].element);

    canvas.regle.hide();
    canvas.crayon.hide();
    await canvas.wait(600);

    // Étape 3 : Arc + P₀
    updateStepInfo('Étape 3', 'On trace un arc centré en O avec le compas. Il coupe la demi-droite au point P₀.');
    await canvas.wait(600);

    const P0 = pointOnCircle(O.x, O.y, R, 0);
    localArcPoints.push(P0);

    canvas.compas.setEcart(R);
    canvas.compas.setPosition(O.x, O.y, -90);
    canvas.compas.show();
    await canvas.wait(500);

    await drawer.drawArc('arcPrincipal', O.x, O.y, R, 0, totalAngle, CONFIG.arcColor, 2, 1500);

    drawer.createPoint('P0', P0.x, P0.y, CONFIG.pointColor, 6);
    await drawer.showPoint('P0', 300);
    drawer.createLabel('P0', 'P₀', P0.x + 5, P0.y + 18);
    await drawer.showLabel('P0');
    elementsToRemove.push(canvas.objects['P0'].element);
    elementsToRemove.push(canvas.objects['label-P0'].element);

    canvas.compas.hide();
    await canvas.wait(800);

    // Étape 4 : Deuxième demi-droite + P₁
    updateStepInfo('Étape 4', 'On trace une deuxième demi-droite pour créer l\'angle de départ. L\'arc la coupe en P₁.');
    await canvas.wait(600);

    const endPoint2 = pointOnCircle(O.x, O.y, L, angle);
    const P1 = pointOnCircle(O.x, O.y, R, angle);
    localArcPoints.push(P1);

    canvas.regle.setPosition(O.x, O.y - 25, -angle);
    canvas.regle.show();
    await canvas.wait(400);

    canvas.crayon.setPosition(O.x, O.y);
    canvas.crayon.show();
    await drawer.drawSegment('construction1', O.x, O.y, endPoint2.x, endPoint2.y, CONFIG.branchColor, 2, 800);
    elementsToRemove.push(canvas.objects['construction1'].element);

    drawer.createPoint('P1', P1.x, P1.y, CONFIG.pointColor, 6);
    await drawer.showPoint('P1', 300);
    const labelAngle1 = angle * Math.PI / 180;
    drawer.createLabel('P1', 'P₁', P1.x + 15 * Math.cos(labelAngle1), P1.y - 15 * Math.sin(labelAngle1));
    await drawer.showLabel('P1');
    elementsToRemove.push(canvas.objects['P1'].element);
    elementsToRemove.push(canvas.objects['label-P1'].element);

    canvas.regle.hide();
    canvas.crayon.hide();
    await canvas.wait(800);

    // Étape 5 : Corde P₀P₁
    updateStepInfo('Étape 5', 'On trace la CORDE P₀P₁. Cette distance caractérise notre angle de départ.');
    await canvas.wait(600);

    canvas.crayon.setPosition(P0.x, P0.y);
    canvas.crayon.show();
    await drawer.drawSegment('chord01', P0.x, P0.y, P1.x, P1.y, CONFIG.chordColor, 3, 600);
    canvas.crayon.hide();
    await canvas.wait(600);

    // Étape 6 : Mémoriser la corde avec le compas
    updateStepInfo('Étape 6', 'On place la pointe sèche du compas sur P₀.');
    await canvas.wait(600);

    // Calculer l'angle de P₀ vers P₁ pour orienter le compas (en coordonnées SVG)
    // L'angle doit être tel que la mine (à droite du compas) pointe vers P₁
    const angleP0P1 = Math.atan2(P1.y - P0.y, P1.x - P0.x) * 180 / Math.PI;

    // Créer un indicateur visuel sur P₀ (cercle pour montrer où est la pointe sèche)
    const highlightP0 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    highlightP0.setAttribute('cx', P0.x);
    highlightP0.setAttribute('cy', P0.y);
    highlightP0.setAttribute('r', '12');
    highlightP0.setAttribute('fill', 'none');
    highlightP0.setAttribute('stroke', '#e74c3c');
    highlightP0.setAttribute('stroke-width', '3');
    highlightP0.setAttribute('opacity', '0.8');
    canvas.layerConstructions.appendChild(highlightP0);

    // Positionner le compas sur P₀, orienté vers P₁, fermé au départ
    canvas.compas.setEcart(10);
    canvas.compas.setPosition(P0.x, P0.y, angleP0P1);
    canvas.compas.show();
    await canvas.wait(800);

    // Maintenant écarter vers P₁
    updateStepInfo('Étape 6', 'On écarte le compas jusqu\'à ce que la mine touche exactement P₁.');
    await canvas.wait(400);

    // Créer un indicateur visuel sur P₁ (cercle cible pour montrer où la mine doit aller)
    const targetP1 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    targetP1.setAttribute('cx', P1.x);
    targetP1.setAttribute('cy', P1.y);
    targetP1.setAttribute('r', '15');
    targetP1.setAttribute('fill', 'none');
    targetP1.setAttribute('stroke', '#e74c3c');
    targetP1.setAttribute('stroke-width', '2');
    targetP1.setAttribute('stroke-dasharray', '4,4');
    targetP1.setAttribute('opacity', '0.6');
    canvas.layerConstructions.appendChild(targetP1);
    await canvas.wait(300);

    // Écarter le compas progressivement jusqu'à ce que la mine atteigne P₁
    await canvas.compas.ecarterTo(chordLength, 1500);

    // Mettre en évidence que la mine est maintenant sur P₁
    targetP1.setAttribute('stroke', '#27ae60');
    targetP1.setAttribute('stroke-width', '4');
    targetP1.setAttribute('stroke-dasharray', 'none');
    targetP1.setAttribute('opacity', '1');
    await canvas.wait(600);

    // Message de confirmation
    updateStepInfo('Étape 6', 'La pointe sèche est sur P₀, la mine est sur P₁. L\'écartement du compas est maintenant égal à la corde P₀P₁ !');
    await canvas.wait(1200);

    // Retirer les indicateurs visuels
    highlightP0.remove();
    targetP1.remove();

    // Reports successifs
    for (let i = 2; i < CONFIG.numBranches; i++) {
        const currentAngle = i * angle;
        const prevPoint = localArcPoints[localArcPoints.length - 1];
        const pIndex = localArcPoints.length;

        // Arc de report
        updateStepInfo(`Report ${i - 1} - Arc`, `On place le compas sur P${SUBSCRIPTS[pIndex - 1]} et on trace un arc avec l'écartement mémorisé.`);
        await canvas.wait(500);

        canvas.compas.setEcart(chordLength);
        await canvas.compas.moveTo(prevPoint.x, prevPoint.y, 600);
        const orientAngle = currentAngle - angle / 2;
        await canvas.compas.rotateTo(-orientAngle - 90, 400);
        await canvas.wait(400);

        const newPoint = pointOnCircle(O.x, O.y, R, currentAngle);
        const angleToNewPoint = Math.atan2(-(newPoint.y - prevPoint.y), newPoint.x - prevPoint.x) * 180 / Math.PI;

        await drawer.drawArc(`reportArc${i}`, prevPoint.x, prevPoint.y, chordLength,
            angleToNewPoint - 25, angleToNewPoint + 25, CONFIG.reportArcColor, 2.5, 600);
        elementsToRemove.push(canvas.objects[`reportArc${i}`].element);

        // Nouveau point
        updateStepInfo(`Report ${i - 1} - Point`, `L'arc coupe l'arc bleu en P${SUBSCRIPTS[pIndex]}. C'est le même angle car c'est la même corde !`);
        await canvas.wait(400);

        localArcPoints.push(newPoint);
        drawer.createPoint(`P${pIndex}`, newPoint.x, newPoint.y, CONFIG.pointColor, 6);
        await drawer.showPoint(`P${pIndex}`, 300);

        const lblAngle = currentAngle * Math.PI / 180;
        drawer.createLabel(`P${pIndex}`, `P${SUBSCRIPTS[pIndex]}`,
            newPoint.x + 18 * Math.cos(lblAngle),
            newPoint.y - 18 * Math.sin(lblAngle));
        await drawer.showLabel(`P${pIndex}`);
        elementsToRemove.push(canvas.objects[`P${pIndex}`].element);
        elementsToRemove.push(canvas.objects[`label-P${pIndex}`].element);

        // Corde
        updateStepInfo(`Report ${i - 1} - Corde`, `On trace la corde P${SUBSCRIPTS[pIndex - 1]}P${SUBSCRIPTS[pIndex]} — même longueur que P₀P₁ !`);
        await canvas.wait(400);

        canvas.compas.hide();
        canvas.crayon.setPosition(prevPoint.x, prevPoint.y);
        canvas.crayon.show();
        await drawer.drawSegment(`chord${pIndex}`, prevPoint.x, prevPoint.y, newPoint.x, newPoint.y,
            CONFIG.chordColor, 3, 500);
        canvas.crayon.hide();

        // Demi-droite
        updateStepInfo(`Report ${i - 1} - Demi-droite`, 'On trace la demi-droite passant par O et le nouveau point.');
        await canvas.wait(400);

        const newBranchEnd = pointOnCircle(O.x, O.y, L, currentAngle);
        canvas.regle.setPosition(O.x, O.y - 25, -currentAngle);
        canvas.regle.show();
        await canvas.wait(300);

        canvas.crayon.setPosition(O.x, O.y);
        canvas.crayon.show();
        await drawer.drawSegment(`construction${i}`, O.x, O.y, newBranchEnd.x, newBranchEnd.y,
            CONFIG.branchColor, 2, 600);
        elementsToRemove.push(canvas.objects[`construction${i}`].element);

        canvas.regle.hide();
        canvas.crayon.hide();

        if (i < CONFIG.numBranches - 1) {
            canvas.compas.show();
        }
        await canvas.wait(400);
    }

    // Nettoyage
    canvas.compas.hide();
    updateStepInfo('Nettoyage', 'On efface les traces de construction pour ne garder que l\'éventail final.');
    await canvas.wait(1000);

    for (const el of elementsToRemove) {
        el.style.transition = 'opacity 0.3s';
        el.style.opacity = '0';
    }
    await canvas.wait(500);

    for (const el of elementsToRemove) {
        el.remove();
    }

    // Segments finaux
    updateStepInfo('Résultat final', `L'éventail a ${CONFIG.numBranches} baguettes avec des angles tous égaux. Construction réalisée uniquement avec la règle et le compas !`);
    await canvas.wait(500);

    canvas.crayon.setPosition(O.x, O.y);
    canvas.crayon.show();

    for (let i = 0; i < localArcPoints.length; i++) {
        const P = localArcPoints[i];
        await drawer.drawSegment(`finalSeg${i}`, O.x, O.y, P.x, P.y, CONFIG.branchColor, 2.5, 300);
        canvas.crayon.setPosition(O.x, O.y);
    }

    canvas.crayon.hide();
    await canvas.wait(600);

    // ============================================
    // DÉCORATION : Transformer en vrai éventail !
    // ============================================
    updateStepInfo('Décoration', 'Ajoutons les toiles et le rivet pour un vrai éventail !');
    await canvas.wait(800);

    // Palette de couleurs pour les toiles (dégradé de couleurs chaudes)
    const colors = [
        'rgba(231, 76, 60, 0.4)',   // rouge
        'rgba(241, 196, 15, 0.4)',  // jaune
        'rgba(230, 126, 34, 0.4)',  // orange
        'rgba(155, 89, 182, 0.4)',  // violet
        'rgba(52, 152, 219, 0.4)',  // bleu
        'rgba(46, 204, 113, 0.4)',  // vert
    ];

    // Dessiner les toiles entre les baguettes (secteurs colorés)
    for (let i = 0; i < localArcPoints.length - 1; i++) {
        const startAngle = i * angle;
        const endAngle = (i + 1) * angle;

        // Créer un secteur (path en forme de part de tarte)
        const sector = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const startPt = pointOnCircle(O.x, O.y, R, startAngle);
        const endPt = pointOnCircle(O.x, O.y, R, endAngle);

        const pathData = `M ${O.x} ${O.y} L ${startPt.x} ${startPt.y} A ${R} ${R} 0 0 0 ${endPt.x} ${endPt.y} Z`;
        sector.setAttribute('d', pathData);
        sector.setAttribute('fill', colors[i % colors.length]);
        sector.setAttribute('stroke', 'none');
        sector.setAttribute('opacity', '0');

        // Insérer sous les baguettes
        canvas.layerConstructions.insertBefore(sector, canvas.layerConstructions.firstChild);

        // Animation d'apparition
        sector.style.transition = 'opacity 0.4s ease-in-out';
        await canvas.wait(100);
        sector.setAttribute('opacity', '1');
    }

    await canvas.wait(400);

    // Ajouter un motif décoratif sur l'arc (bordure de l'éventail)
    const decorArc = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const arcStart = pointOnCircle(O.x, O.y, R, 0);
    const arcEnd = pointOnCircle(O.x, O.y, R, totalAngle);
    const arcPath = `M ${arcStart.x} ${arcStart.y} A ${R} ${R} 0 0 0 ${arcEnd.x} ${arcEnd.y}`;
    decorArc.setAttribute('d', arcPath);
    decorArc.setAttribute('fill', 'none');
    decorArc.setAttribute('stroke', '#8B4513');
    decorArc.setAttribute('stroke-width', '4');
    decorArc.setAttribute('stroke-linecap', 'round');
    canvas.layerConstructions.appendChild(decorArc);

    await canvas.wait(300);

    // Ajouter le rivet central (le pivot de l'éventail)
    const rivetOuter = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    rivetOuter.setAttribute('cx', O.x);
    rivetOuter.setAttribute('cy', O.y);
    rivetOuter.setAttribute('r', '12');
    rivetOuter.setAttribute('fill', '#c0a080');
    rivetOuter.setAttribute('stroke', '#8B4513');
    rivetOuter.setAttribute('stroke-width', '2');
    canvas.layerPoints.appendChild(rivetOuter);

    const rivetInner = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    rivetInner.setAttribute('cx', O.x);
    rivetInner.setAttribute('cy', O.y);
    rivetInner.setAttribute('r', '5');
    rivetInner.setAttribute('fill', '#8B4513');
    canvas.layerPoints.appendChild(rivetInner);

    // Petit reflet sur le rivet
    const rivetHighlight = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    rivetHighlight.setAttribute('cx', O.x - 3);
    rivetHighlight.setAttribute('cy', O.y - 3);
    rivetHighlight.setAttribute('r', '2');
    rivetHighlight.setAttribute('fill', 'rgba(255, 255, 255, 0.6)');
    canvas.layerPoints.appendChild(rivetHighlight);

    await canvas.wait(500);

    updateStepInfo('Terminé !', `Voici notre éventail à ${CONFIG.numBranches} baguettes, construit uniquement à la règle et au compas !`);
    await canvas.wait(800);

    // ============================================
    // FINAL : Zoom + Confettis !
    // ============================================

    // Calculer le centre de l'éventail pour le zoom
    const centerAngle = totalAngle / 2;
    const fanCenterX = O.x + (R / 2) * Math.cos(centerAngle * Math.PI / 180);
    const fanCenterY = O.y - (R / 2) * Math.sin(centerAngle * Math.PI / 180);

    // Créer un groupe pour tout le contenu à zoomer
    const zoomGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    zoomGroup.setAttribute('id', 'zoom-group');

    // Déplacer tout le contenu dans le groupe de zoom
    const allLayers = [canvas.layerConstructions, canvas.layerPoints, canvas.layerLabels];
    const originalContents = [];

    for (const layer of allLayers) {
        while (layer.firstChild) {
            originalContents.push({ element: layer.firstChild, parent: layer });
            zoomGroup.appendChild(layer.firstChild);
        }
    }

    canvas.svg.appendChild(zoomGroup);

    // Animation de zoom
    updateStepInfo('Bravo !', 'Construction parfaite !');

    const zoomDuration = 1500;
    const targetScale = 1.3;
    const svgWidth = canvas.width;
    const svgHeight = canvas.height;

    // Point vers lequel zoomer (centre de l'éventail)
    const zoomToX = fanCenterX;
    const zoomToY = fanCenterY;

    await canvas.animate(zoomDuration, (progress) => {
        // Easing pour un effet plus doux
        const eased = 1 - Math.pow(1 - progress, 3);
        const scale = 1 + (targetScale - 1) * eased;

        // Calculer le déplacement pour centrer le zoom
        const translateX = (svgWidth / 2 - zoomToX) * (scale - 1) / scale;
        const translateY = (svgHeight / 2 - zoomToY) * (scale - 1) / scale;

        zoomGroup.setAttribute('transform',
            `translate(${svgWidth/2}, ${svgHeight/2}) scale(${scale}) translate(${-svgWidth/2 + translateX}, ${-svgHeight/2 + translateY})`
        );
    });

    await canvas.wait(300);

    // ============================================
    // CONFETTIS !
    // ============================================
    const confettiColors = ['#e74c3c', '#f39c12', '#2ecc71', '#3498db', '#9b59b6', '#e91e63', '#00bcd4', '#ff5722'];
    const confettiCount = 50;
    const confettis = [];

    // Créer les confettis
    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        const x = Math.random() * svgWidth;
        const y = -20 - Math.random() * 100; // Démarrer au-dessus du canvas
        const width = 8 + Math.random() * 8;
        const height = 6 + Math.random() * 6;
        const color = confettiColors[Math.floor(Math.random() * confettiColors.length)];
        const rotation = Math.random() * 360;

        confetti.setAttribute('x', x);
        confetti.setAttribute('y', y);
        confetti.setAttribute('width', width);
        confetti.setAttribute('height', height);
        confetti.setAttribute('fill', color);
        confetti.setAttribute('rx', '2');
        confetti.setAttribute('transform', `rotate(${rotation}, ${x + width/2}, ${y + height/2})`);

        canvas.svg.appendChild(confetti);

        confettis.push({
            element: confetti,
            x: x,
            y: y,
            width: width,
            height: height,
            speedY: 2 + Math.random() * 3,
            speedX: (Math.random() - 0.5) * 2,
            rotation: rotation,
            rotationSpeed: (Math.random() - 0.5) * 10,
            wobble: Math.random() * Math.PI * 2
        });
    }

    // Animer les confettis
    const confettiDuration = 4000;
    const startTime = performance.now();

    const animateConfetti = () => {
        const elapsed = performance.now() - startTime;

        if (elapsed < confettiDuration) {
            for (const c of confettis) {
                c.y += c.speedY;
                c.x += c.speedX + Math.sin(c.wobble + elapsed / 200) * 0.5;
                c.rotation += c.rotationSpeed;
                c.wobble += 0.05;

                c.element.setAttribute('x', c.x);
                c.element.setAttribute('y', c.y);
                c.element.setAttribute('transform',
                    `rotate(${c.rotation}, ${c.x + c.width/2}, ${c.y + c.height/2})`
                );

                // Faire disparaître progressivement vers la fin
                if (elapsed > confettiDuration * 0.7) {
                    const fadeProgress = (elapsed - confettiDuration * 0.7) / (confettiDuration * 0.3);
                    c.element.setAttribute('opacity', 1 - fadeProgress);
                }
            }
            requestAnimationFrame(animateConfetti);
        } else {
            // Nettoyer les confettis
            for (const c of confettis) {
                c.element.remove();
            }
        }
    };

    requestAnimationFrame(animateConfetti);

    // Message final avec émoji
    await canvas.wait(1000);
    updateStepInfo('Félicitations !', 'Tu as appris à reporter un angle uniquement avec la règle et le compas !');
}

// ============================================
// MODE EXPLORATION (avec timeline)
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

    // Fond blanc (sans grille - construction à la règle et au compas)
    const bg = document.createElementNS(SVG_NS, 'rect');
    bg.setAttribute('width', '100%');
    bg.setAttribute('height', '100%');
    bg.setAttribute('fill', '#fafafa');
    svg.appendChild(bg);

    // Calques
    layerConstruction = document.createElementNS(SVG_NS, 'g');
    layerConstruction.setAttribute('id', 'construction');
    svg.appendChild(layerConstruction);

    layerFinal = document.createElementNS(SVG_NS, 'g');
    layerFinal.setAttribute('id', 'final');
    svg.appendChild(layerFinal);

    // Mettre à jour le slider
    document.getElementById('timeline').setAttribute('max', steps.length - 1);
    document.getElementById('timeline').value = 0;
    currentStep = 0;

    renderStepExploration(0);
    updateExplorationUI();
}

function goToStep(stepIndex) {
    if (stepIndex < 0) stepIndex = 0;
    if (stepIndex >= steps.length) stepIndex = steps.length - 1;

    currentStep = stepIndex;
    renderStepExploration(currentStep);
    updateExplorationUI();
}

function updateExplorationUI() {
    document.getElementById('timeline').value = currentStep;
    document.getElementById('stepCounter').textContent = `${currentStep + 1} / ${steps.length}`;
    document.getElementById('btnPrev').disabled = currentStep === 0;
    document.getElementById('btnNext').disabled = currentStep === steps.length - 1;

    const step = steps[currentStep];
    updateStepInfo(step.title, step.description);
}

function renderStepExploration(stepIndex) {
    layerConstruction.innerHTML = '';
    layerFinal.innerHTML = '';

    for (let i = 0; i <= stepIndex; i++) {
        steps[i].render(i === stepIndex);
    }
}

// ============================================
// DÉFINITION DES ÉTAPES (pour mode exploration)
// ============================================
function buildSteps() {
    steps = [];

    steps.push({
        title: 'Étape 1 : Le sommet',
        description: 'On place le point O, sommet de l\'éventail.',
        render: () => {
            drawPoint(O.x, O.y, '#2c3e50', 7);
            drawLabel('O', O.x - 20, O.y + 5);
        }
    });

    steps.push({
        title: 'Étape 2 : Première demi-droite',
        description: 'On trace une première demi-droite d\'origine O.',
        render: () => {
            const end = pointOnCircle(O.x, O.y, L, 0);
            drawSegment(O.x, O.y, end.x, end.y, CONFIG.branchColor, 2);
        }
    });

    steps.push({
        title: 'Étape 3 : Arc et point P₀',
        description: 'On trace un arc centré en O. Il coupe la demi-droite au point P₀.',
        render: () => {
            drawArc(O.x, O.y, R, 0, totalAngle, CONFIG.arcColor, 2);
            drawPoint(arcPoints[0].x, arcPoints[0].y, CONFIG.pointColor, 6);
            drawLabel('P₀', arcPoints[0].x + 5, arcPoints[0].y + 18);
        }
    });

    steps.push({
        title: 'Étape 4 : Angle de départ',
        description: 'On trace une deuxième demi-droite pour créer l\'angle de départ. L\'arc la coupe en P₁.',
        render: () => {
            const end = pointOnCircle(O.x, O.y, L, angle);
            drawSegment(O.x, O.y, end.x, end.y, CONFIG.branchColor, 2);
            drawPoint(arcPoints[1].x, arcPoints[1].y, CONFIG.pointColor, 6);
            const lblAngle = angle * Math.PI / 180;
            drawLabel('P₁', arcPoints[1].x + 15 * Math.cos(lblAngle), arcPoints[1].y - 15 * Math.sin(lblAngle));
        }
    });

    steps.push({
        title: 'Étape 5 : La corde P₀P₁',
        description: 'On trace la CORDE P₀P₁. Cette distance caractérise notre angle de départ.',
        render: () => {
            drawSegment(arcPoints[0].x, arcPoints[0].y, arcPoints[1].x, arcPoints[1].y, CONFIG.chordColor, 3);
        }
    });

    steps.push({
        title: 'Étape 6 : Mémoriser la corde',
        description: 'On règle le compas sur la longueur de la corde P₀P₁. Cet écartement sera utilisé pour tous les reports.',
        render: (isCurrent) => {
            if (isCurrent) {
                drawSegment(arcPoints[0].x, arcPoints[0].y, arcPoints[1].x, arcPoints[1].y, '#f39c12', 4);
            }
        }
    });

    for (let i = 2; i < CONFIG.numBranches; i++) {
        const prevIdx = i - 1;
        const currAngle = i * angle;

        steps.push({
            title: `Report ${i - 1} - Arc`,
            description: `On place le compas sur P${SUBSCRIPTS[prevIdx]} et on trace un arc (rayon = corde).`,
            render: () => {
                const prevPt = arcPoints[prevIdx];
                const newPt = arcPoints[i];
                const angleToNew = Math.atan2(-(newPt.y - prevPt.y), newPt.x - prevPt.x) * 180 / Math.PI;
                drawArc(prevPt.x, prevPt.y, chordLength, angleToNew - 25, angleToNew + 25, CONFIG.reportArcColor, 2.5);
            }
        });

        steps.push({
            title: `Report ${i - 1} - Point P${SUBSCRIPTS[i]}`,
            description: `L'arc de report coupe l'arc bleu. On obtient le point P${SUBSCRIPTS[i]}.`,
            render: () => {
                const pt = arcPoints[i];
                drawPoint(pt.x, pt.y, CONFIG.pointColor, 6);
                const lblAngle = currAngle * Math.PI / 180;
                drawLabel(`P${SUBSCRIPTS[i]}`, pt.x + 18 * Math.cos(lblAngle), pt.y - 18 * Math.sin(lblAngle));
            }
        });

        steps.push({
            title: `Report ${i - 1} - Corde`,
            description: `On trace la corde P${SUBSCRIPTS[prevIdx]}P${SUBSCRIPTS[i]} — même longueur que P₀P₁ !`,
            render: () => {
                drawSegment(arcPoints[prevIdx].x, arcPoints[prevIdx].y, arcPoints[i].x, arcPoints[i].y, CONFIG.chordColor, 3);
            }
        });

        steps.push({
            title: `Report ${i - 1} - Demi-droite`,
            description: 'On trace la demi-droite passant par O et le nouveau point.',
            render: () => {
                const end = pointOnCircle(O.x, O.y, L, currAngle);
                drawSegment(O.x, O.y, end.x, end.y, CONFIG.branchColor, 2);
            }
        });
    }

    steps.push({
        title: 'Nettoyage',
        description: 'On efface les traces de construction pour ne garder que l\'éventail final.',
        render: () => {}
    });

    steps.push({
        title: 'Résultat final',
        description: `L'éventail a ${CONFIG.numBranches} baguettes avec des angles tous égaux. Construction réalisée uniquement avec la règle et le compas !`,
        render: () => {
            layerConstruction.innerHTML = '';
            drawArcFinal(O.x, O.y, R, 0, totalAngle, CONFIG.arcColor, 2);
            for (let i = 0; i < arcPoints.length; i++) {
                drawSegmentFinal(O.x, O.y, arcPoints[i].x, arcPoints[i].y, CONFIG.branchColor, 2.5);
            }
            for (let i = 0; i < arcPoints.length - 1; i++) {
                drawSegmentFinal(arcPoints[i].x, arcPoints[i].y, arcPoints[i + 1].x, arcPoints[i + 1].y, CONFIG.chordColor, 3);
            }
        }
    });
}

// ============================================
// FONCTIONS DE DESSIN
// ============================================
function drawSegment(x1, y1, x2, y2, color, width) {
    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', x1);
    line.setAttribute('y1', y1);
    line.setAttribute('x2', x2);
    line.setAttribute('y2', y2);
    line.setAttribute('stroke', color);
    line.setAttribute('stroke-width', width);
    line.setAttribute('stroke-linecap', 'round');
    layerConstruction.appendChild(line);
}

function drawPoint(x, y, color, radius) {
    const circle = document.createElementNS(SVG_NS, 'circle');
    circle.setAttribute('cx', x);
    circle.setAttribute('cy', y);
    circle.setAttribute('r', radius);
    circle.setAttribute('fill', color);
    circle.setAttribute('stroke', '#fff');
    circle.setAttribute('stroke-width', '1');
    layerConstruction.appendChild(circle);
}

function drawLabel(text, x, y) {
    const label = document.createElementNS(SVG_NS, 'text');
    label.setAttribute('x', x);
    label.setAttribute('y', y);
    label.setAttribute('fill', '#333');
    label.setAttribute('font-size', '14');
    label.setAttribute('font-weight', 'bold');
    label.setAttribute('font-family', 'Arial, sans-serif');
    label.textContent = text;
    layerConstruction.appendChild(label);
}

function drawArc(cx, cy, radius, startAngle, endAngle, color, width) {
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', describeArc(cx, cy, radius, startAngle, endAngle));
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', color);
    path.setAttribute('stroke-width', width);
    path.setAttribute('stroke-linecap', 'round');
    layerConstruction.appendChild(path);
}

function drawSegmentFinal(x1, y1, x2, y2, color, width) {
    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', x1);
    line.setAttribute('y1', y1);
    line.setAttribute('x2', x2);
    line.setAttribute('y2', y2);
    line.setAttribute('stroke', color);
    line.setAttribute('stroke-width', width);
    line.setAttribute('stroke-linecap', 'round');
    layerFinal.appendChild(line);
}

function drawArcFinal(cx, cy, radius, startAngle, endAngle, color, width) {
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', describeArc(cx, cy, radius, startAngle, endAngle));
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', color);
    path.setAttribute('stroke-width', width);
    path.setAttribute('stroke-linecap', 'round');
    layerFinal.appendChild(path);
}

// ============================================
// UTILITAIRES
// ============================================
function pointOnCircle(cx, cy, radius, angleDeg) {
    const angleRad = angleDeg * Math.PI / 180;
    return {
        x: cx + radius * Math.cos(angleRad),
        y: cy - radius * Math.sin(angleRad)
    };
}

function distance(p1, p2) {
    return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
}

function describeArc(cx, cy, radius, startAngle, endAngle) {
    const start = pointOnCircle(cx, cy, radius, startAngle);
    const end = pointOnCircle(cx, cy, radius, endAngle);
    const deltaAngle = endAngle - startAngle;
    const largeArcFlag = Math.abs(deltaAngle) > 180 ? '1' : '0';
    const sweepFlag = deltaAngle > 0 ? '0' : '1';
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${end.x} ${end.y}`;
}

function updateStepInfo(title, description) {
    document.getElementById('stepTitle').textContent = title;
    document.getElementById('stepDescription').textContent = description;
}
