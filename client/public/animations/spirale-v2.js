/**
 * Spirale d'Archimède v2 - Version Interactive
 *
 * Mode Personnalisation :
 *   - Point B draggable pour changer l'angle
 *   - Slider pour la longueur OA
 *   - Rendu en temps réel
 */

// Configuration par défaut
let CONFIG = {
    centerX: 300,
    centerY: 280,
    unitLength: 18,
    baseAngle: 20,
    numBranches: 16,
    arcRadius: 60,          // Rayon de l'arc pour le drag du point B
    dragArcRadius: 60,      // Rayon pour l'arc de guidage
};

// Couleurs
const COLORS = {
    spiral: ['#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#1abc9c', '#3498db', '#9b59b6', '#e91e63'],
    pointA: '#27ae60',
    pointB: '#3498db',
    pointO: '#2c3e50',
    arc: '#3498db',
    ray: '#bdc3c7',
    angleArc: '#f39c12'
};

// État global
let svg, layerBackground, layerSpiral, layerControls, layerPoints;
let O = { x: CONFIG.centerX, y: CONFIG.centerY };
let pointA, pointB;
let isDragging = false;
let currentMode = 'personnalisation';

// Noms des points
const POINT_NAMES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'U'];

// ============================================
// INITIALISATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    initSVG();
    initControls();
    initModeSwitch();
    showMode('personnalisation');
});

function initSVG() {
    svg = document.getElementById('canvas');

    // Créer les calques
    layerBackground = createLayer('background');
    layerSpiral = createLayer('spiral');
    layerControls = createLayer('controls');
    layerPoints = createLayer('points');

    // Fond
    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bg.setAttribute('width', '100%');
    bg.setAttribute('height', '100%');
    bg.setAttribute('fill', '#fafafa');
    layerBackground.appendChild(bg);
}

function createLayer(id) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('id', 'layer-' + id);
    svg.appendChild(g);
    return g;
}

function initControls() {
    // Slider OA
    const oaSlider = document.getElementById('oaSlider');
    oaSlider.addEventListener('input', (e) => {
        CONFIG.unitLength = parseInt(e.target.value);
        document.getElementById('oaValue').textContent = CONFIG.unitLength;
        if (currentMode === 'personnalisation') {
            renderPersonnalisation();
        }
    });

    // Bouton reset
    document.getElementById('btnReset').addEventListener('click', resetToDefault);

    // Animation controls
    document.getElementById('btnPlay').addEventListener('click', startAnimation);
    document.getElementById('btnPause').addEventListener('click', togglePause);
    document.getElementById('speedSlider').addEventListener('input', (e) => {
        document.getElementById('speedValue').textContent = e.target.value + 'x';
    });
}

function initModeSwitch() {
    document.getElementById('tabPersonnalisation').addEventListener('click', () => showMode('personnalisation'));
    document.getElementById('tabAnimation').addEventListener('click', () => showMode('animation'));
}

function showMode(mode) {
    currentMode = mode;

    document.getElementById('tabPersonnalisation').classList.toggle('active', mode === 'personnalisation');
    document.getElementById('tabAnimation').classList.toggle('active', mode === 'animation');
    document.getElementById('panelPersonnalisation').classList.toggle('active', mode === 'personnalisation');
    document.getElementById('panelAnimation').classList.toggle('active', mode === 'animation');

    if (mode === 'personnalisation') {
        renderPersonnalisation();
    } else {
        renderAnimationPreview();
    }
}

function resetToDefault() {
    CONFIG.unitLength = 18;
    CONFIG.baseAngle = 20;
    document.getElementById('oaSlider').value = 18;
    document.getElementById('oaValue').textContent = '18';
    renderPersonnalisation();
}

// ============================================
// MODE PERSONNALISATION
// ============================================
function renderPersonnalisation() {
    clearLayers();

    O = { x: CONFIG.centerX, y: CONFIG.centerY };

    // Calculer les positions de A et B
    pointA = pointOnCircle(O.x, O.y, CONFIG.dragArcRadius, 0);
    pointB = pointOnCircle(O.x, O.y, CONFIG.dragArcRadius, CONFIG.baseAngle);

    // Dessiner l'arc de guidage (où B peut être dragué)
    drawGuideArc();

    // Dessiner l'angle (arc entre A et B)
    drawAngleArc();

    // Dessiner les rayons OA et OB
    drawRay(O, pointA, '#bdc3c7', 2);
    drawRay(O, pointB, '#bdc3c7', 2);

    // Dessiner la spirale
    drawSpiral();

    // Dessiner les points O, A, B (en dernier pour être au-dessus)
    drawInteractivePoint(O.x, O.y, 'O', COLORS.pointO, 8, false);
    drawInteractivePoint(pointA.x, pointA.y, 'A', COLORS.pointA, 7, false);
    drawInteractivePoint(pointB.x, pointB.y, 'B', COLORS.pointB, 10, true); // Draggable

    // Mettre à jour les stats
    updateStats();
}

function drawGuideArc() {
    const arc = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    // Arc de 5° à 45° (limites du drag)
    arc.setAttribute('d', describeArc(O.x, O.y, CONFIG.dragArcRadius, 5, 45));
    arc.setAttribute('fill', 'none');
    arc.setAttribute('stroke', '#e0e0e0');
    arc.setAttribute('stroke-width', '8');
    arc.setAttribute('stroke-linecap', 'round');
    arc.setAttribute('opacity', '0.5');
    layerControls.appendChild(arc);
}

function drawAngleArc() {
    const arc = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    arc.setAttribute('d', describeArc(O.x, O.y, 30, 0, CONFIG.baseAngle));
    arc.setAttribute('fill', 'none');
    arc.setAttribute('stroke', COLORS.angleArc);
    arc.setAttribute('stroke-width', '3');
    arc.setAttribute('stroke-linecap', 'round');
    layerControls.appendChild(arc);
}

function drawRay(from, to, color, width) {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', from.x);
    line.setAttribute('y1', from.y);
    line.setAttribute('x2', to.x);
    line.setAttribute('y2', to.y);
    line.setAttribute('stroke', color);
    line.setAttribute('stroke-width', width);
    line.setAttribute('stroke-linecap', 'round');
    layerControls.appendChild(line);
}

function drawSpiral() {
    // Calculer les points de la spirale
    const spiralPoints = [];
    for (let i = 0; i < CONFIG.numBranches; i++) {
        const angle = i * CONFIG.baseAngle;
        const distance = (i + 1) * CONFIG.unitLength;
        spiralPoints.push({
            ...pointOnCircle(O.x, O.y, distance, angle),
            name: POINT_NAMES[i]
        });
    }

    // Dessiner les rayons colorés (du centre vers chaque point)
    for (let i = 0; i < spiralPoints.length; i++) {
        const color = COLORS.spiral[i % COLORS.spiral.length];
        const ray = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        ray.setAttribute('x1', O.x);
        ray.setAttribute('y1', O.y);
        ray.setAttribute('x2', spiralPoints[i].x);
        ray.setAttribute('y2', spiralPoints[i].y);
        ray.setAttribute('stroke', color);
        ray.setAttribute('stroke-width', '1.5');
        ray.setAttribute('stroke-linecap', 'round');
        ray.setAttribute('opacity', '0.5');
        layerSpiral.appendChild(ray);
    }

    // Dessiner les segments de la spirale
    for (let i = 1; i < spiralPoints.length; i++) {
        const color = COLORS.spiral[(i - 1) % COLORS.spiral.length];
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', spiralPoints[i - 1].x);
        line.setAttribute('y1', spiralPoints[i - 1].y);
        line.setAttribute('x2', spiralPoints[i].x);
        line.setAttribute('y2', spiralPoints[i].y);
        line.setAttribute('stroke', color);
        line.setAttribute('stroke-width', '3');
        line.setAttribute('stroke-linecap', 'round');
        layerSpiral.appendChild(line);
    }

    // Dessiner les points de la spirale
    for (let i = 0; i < spiralPoints.length; i++) {
        const color = COLORS.spiral[i % COLORS.spiral.length];
        const pt = spiralPoints[i];

        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', pt.x);
        circle.setAttribute('cy', pt.y);
        circle.setAttribute('r', '4');
        circle.setAttribute('fill', color);
        circle.setAttribute('stroke', '#fff');
        circle.setAttribute('stroke-width', '1');
        layerSpiral.appendChild(circle);
    }
}

function drawInteractivePoint(x, y, label, color, radius, draggable) {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('class', 'point-group');

    // Cercle externe (halo) pour les points draggables
    if (draggable) {
        const halo = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        halo.setAttribute('cx', x);
        halo.setAttribute('cy', y);
        halo.setAttribute('r', radius + 8);
        halo.setAttribute('fill', color);
        halo.setAttribute('opacity', '0.2');
        group.appendChild(halo);
    }

    // Cercle principal
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', x);
    circle.setAttribute('cy', y);
    circle.setAttribute('r', radius);
    circle.setAttribute('fill', color);
    circle.setAttribute('stroke', '#fff');
    circle.setAttribute('stroke-width', '2');
    circle.style.cursor = draggable ? 'grab' : 'default';
    group.appendChild(circle);

    // Label
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    const labelOffset = draggable ? 25 : 20;
    const angle = label === 'B' ? CONFIG.baseAngle : (label === 'A' ? 0 : -90);
    const rad = angle * Math.PI / 180;
    text.setAttribute('x', x + labelOffset * Math.cos(rad));
    text.setAttribute('y', y - labelOffset * Math.sin(rad) + 5);
    text.setAttribute('fill', color);
    text.setAttribute('font-size', '16');
    text.setAttribute('font-weight', 'bold');
    text.setAttribute('font-family', 'Arial, sans-serif');
    text.setAttribute('text-anchor', 'middle');
    text.textContent = label;
    group.appendChild(text);

    // Événements de drag pour le point B
    if (draggable) {
        circle.addEventListener('mousedown', startDrag);
        circle.addEventListener('touchstart', startDrag, { passive: false });
    }

    layerPoints.appendChild(group);
}

// ============================================
// DRAG & DROP
// ============================================
function startDrag(e) {
    e.preventDefault();
    isDragging = true;
    document.getElementById('canvas').style.cursor = 'grabbing';

    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', stopDrag);
    document.addEventListener('touchmove', onDrag, { passive: false });
    document.addEventListener('touchend', stopDrag);
}

function onDrag(e) {
    if (!isDragging) return;
    e.preventDefault();

    // Obtenir la position de la souris/touch relative au SVG
    const rect = svg.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;

    // Calculer l'angle par rapport à O
    const dx = mouseX - O.x;
    const dy = O.y - mouseY; // Y inversé en SVG
    let angle = Math.atan2(dy, dx) * 180 / Math.PI;

    // Limiter l'angle entre 5° et 45°
    angle = Math.max(5, Math.min(45, angle));

    // Mettre à jour CONFIG
    CONFIG.baseAngle = Math.round(angle);

    // Re-render
    renderPersonnalisation();
}

function stopDrag() {
    isDragging = false;
    document.getElementById('canvas').style.cursor = 'default';

    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', stopDrag);
    document.removeEventListener('touchmove', onDrag);
    document.removeEventListener('touchend', stopDrag);
}

// ============================================
// MODE ANIMATION (Preview)
// ============================================
function renderAnimationPreview() {
    clearLayers();

    // Afficher un aperçu statique de la spirale
    O = { x: CONFIG.centerX, y: CONFIG.centerY };

    // Point O
    const pointO = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    pointO.setAttribute('cx', O.x);
    pointO.setAttribute('cy', O.y);
    pointO.setAttribute('r', '7');
    pointO.setAttribute('fill', COLORS.pointO);
    pointO.setAttribute('stroke', '#fff');
    pointO.setAttribute('stroke-width', '2');
    layerPoints.appendChild(pointO);

    // Label O
    const labelO = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    labelO.setAttribute('x', O.x - 20);
    labelO.setAttribute('y', O.y + 5);
    labelO.setAttribute('fill', COLORS.pointO);
    labelO.setAttribute('font-size', '14');
    labelO.setAttribute('font-weight', 'bold');
    labelO.textContent = 'O';
    layerPoints.appendChild(labelO);

    // Message
    const msg = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    msg.setAttribute('x', O.x);
    msg.setAttribute('y', O.y + 80);
    msg.setAttribute('fill', '#888');
    msg.setAttribute('font-size', '14');
    msg.setAttribute('text-anchor', 'middle');
    msg.textContent = 'Clique sur "Lancer l\'animation" pour voir la construction';
    layerControls.appendChild(msg);
}

let animationCanvas = null;
let animationDrawer = null;
let isAnimating = false;

function startAnimation() {
    if (isAnimating) return;

    // Pour l'instant, afficher un message
    alert('Mode animation en développement. Utilisez le mode Personnalisation pour explorer !');
}

function togglePause() {
    // À implémenter
}

// ============================================
// UTILITAIRES
// ============================================
function clearLayers() {
    layerSpiral.innerHTML = '';
    layerControls.innerHTML = '';
    layerPoints.innerHTML = '';
}

function pointOnCircle(cx, cy, r, angleDeg) {
    const rad = angleDeg * Math.PI / 180;
    return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
}

function describeArc(cx, cy, r, startAngle, endAngle) {
    const start = pointOnCircle(cx, cy, r, startAngle);
    const end = pointOnCircle(cx, cy, r, endAngle);
    const largeArc = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;
    const sweep = endAngle > startAngle ? 0 : 1;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} ${sweep} ${end.x} ${end.y}`;
}

function updateStats() {
    document.getElementById('statBranches').textContent = CONFIG.numBranches;
    document.getElementById('statPoints').textContent = CONFIG.numBranches;
}
