const CONFIG = { originX: 240, originY: 480, baseAngle: 10, totalAngle: 180, innerRadius: 80, rowCount: 12, rowStep: 18, branchColor: '#2c3e50', arcColor: '#3498db', chordColor: '#e74c3c', rowColor: '#8e44ad', pointColor: '#27ae60', stageColor: '#8B4513' };
let currentMode = 'animation';
let canvas, drawer, svg, layerConstruction, layerFinal;
let steps = [], currentStep = 0, isAnimating = false;
let O, R, L, angle, totalAngle, numRays, arcPoints = [], chordLength = 0;
document.addEventListener('DOMContentLoaded', () => { initConfig(); buildSteps(); initModeAnimation(); initModeExploration(); initModeSwitch(); bindAngleControl(); showMode('animation'); updateAngleInsight(); });
function initConfig() { O = { x: CONFIG.originX, y: CONFIG.originY }; R = CONFIG.innerRadius; angle = CONFIG.baseAngle; totalAngle = CONFIG.totalAngle; numRays = Math.floor(totalAngle / angle) + 1; L = R + CONFIG.rowCount * CONFIG.rowStep; arcPoints = []; for (let i = 0; i < numRays; i++) { arcPoints.push(pointOnCircle(O.x, O.y, R, i * angle)); } chordLength = distance(arcPoints[0], arcPoints[1]); }
function bindAngleControl() { const slider = document.getElementById('baseAngleSlider'); const label = document.getElementById('baseAngleLabel'); slider.addEventListener('input', (e) => { const val = parseInt(e.target.value, 10); label.textContent = `${val}°`; setBaseAngle(val); }); }
function setBaseAngle(val) { CONFIG.baseAngle = val; initConfig(); buildSteps(); const svgEl = document.getElementById('canvas'); svgEl.innerHTML = ''; showMode(currentMode); updateAngleInsight(); }
function initModeSwitch() { document.getElementById('tabAnimation').addEventListener('click', () => showMode('animation')); document.getElementById('tabExploration').addEventListener('click', () => showMode('exploration')); }
function showMode(mode) { currentMode = mode; document.getElementById('tabAnimation').classList.toggle('active', mode === 'animation'); document.getElementById('tabExploration').classList.toggle('active', mode === 'exploration'); document.getElementById('panelAnimation').classList.toggle('active', mode === 'animation'); document.getElementById('panelExploration').classList.toggle('active', mode === 'exploration'); const svgEl = document.getElementById('canvas'); svgEl.innerHTML = ''; if (mode === 'animation') { setupAnimationMode(); } else { setupExplorationMode(); } }
function initModeAnimation() { document.getElementById('btnPlay').addEventListener('click', startAnimation); document.getElementById('btnPause').addEventListener('click', togglePauseAnimation); document.getElementById('btnReset').addEventListener('click', resetAnimation); document.getElementById('speedSlider').addEventListener('input', (e) => { const speed = parseFloat(e.target.value); document.getElementById('speedValue').textContent = speed + 'x'; if (canvas) canvas.speed = speed; }); }
function setupAnimationMode() { canvas = new GeoCanvas('canvas'); drawer = new GeoDrawer(canvas); canvas.speed = parseFloat(document.getElementById('speedSlider').value); updateStepInfo('Prêt', 'Cliquez sur "Lancer l\'animation" pour construire le théâtre par report d\'angle.'); }
async function startAnimation() { if (isAnimating && canvas.isPaused) { canvas.resume(); document.getElementById('btnPause').textContent = '⏸ Pause'; return; } if (isAnimating) return; isAnimating = true; document.getElementById('btnPlay').textContent = '⏳ En cours...'; document.getElementById('btnPlay').classList.add('playing'); canvas.clear(); await buildEpidaureAnimated(); isAnimating = false; document.getElementById('btnPlay').textContent = '▶ Lancer l\'animation'; document.getElementById('btnPlay').classList.remove('playing'); }
function togglePauseAnimation() { if (!isAnimating) return; if (canvas.isPaused) { canvas.resume(); document.getElementById('btnPause').textContent = '⏸ Pause'; } else { canvas.pause(); document.getElementById('btnPause').textContent = '▶ Reprendre'; } }
function resetAnimation() { if (canvas) { canvas.stop(); canvas.clear(); } isAnimating = false; document.getElementById('btnPlay').textContent = '▶ Lancer l\'animation'; document.getElementById('btnPlay').classList.remove('playing'); document.getElementById('btnPause').textContent = '⏸ Pause'; updateStepInfo('Prêt', 'Cliquez sur "Lancer l\'animation" pour construire le théâtre par report d\'angle.'); }
async function buildEpidaureAnimated() {
    const elementsToRemove = [];
    updateStepInfo('Centre O', 'On place le centre O de l\'orchestre.');
    await canvas.wait(600);
    drawer.createPoint('O', O.x, O.y, '#2c3e50', 7);
    await drawer.showPoint('O', 300);
    drawer.createLabel('O', 'O', O.x - 18, O.y + 5);
    await drawer.showLabel('O');
    elementsToRemove.push(canvas.objects['O'].element);
    elementsToRemove.push(canvas.objects['label-O'].element);
    await canvas.wait(300);
    updateStepInfo('Première demi-droite', 'On trace la première demi-droite.');
    await canvas.wait(300);
    const end0 = pointOnCircle(O.x, O.y, L, 0);
    canvas.regle.setPosition(O.x, O.y - 25, 0);
    canvas.regle.show();
    await canvas.wait(200);
    canvas.crayon.setPosition(O.x, O.y);
    canvas.crayon.show();
    await drawer.drawSegment('ray0', O.x, O.y, end0.x, end0.y, CONFIG.branchColor, 2, 600);
    elementsToRemove.push(canvas.objects['ray0'].element);
    canvas.regle.hide();
    canvas.crayon.hide();
    await canvas.wait(300);
    updateStepInfo('Arc du secteur', 'On trace l\'arc centré en O pour le secteur.');
    await canvas.wait(300);
    canvas.compas.setEcart(R);
    canvas.compas.setPosition(O.x, O.y, -90);
    canvas.compas.show();
    await canvas.wait(200);
    await drawer.drawArc('arcPrincipal', O.x, O.y, R, 0, totalAngle, CONFIG.arcColor, 2, 1000);
    const P0 = arcPoints[0];
    const P1 = arcPoints[1];
    drawer.createPoint('P0', P0.x, P0.y, CONFIG.pointColor, 6);
    await drawer.showPoint('P0', 200);
    drawer.createLabel('P0', 'P₀', P0.x + 5, P0.y + 18);
    await drawer.showLabel('P0');
    drawer.createPoint('P1', P1.x, P1.y, CONFIG.pointColor, 6);
    await drawer.showPoint('P1', 200);
    const a1 = angle * Math.PI / 180;
    drawer.createLabel('P1', 'P₁', P1.x + 15 * Math.cos(a1), P1.y - 15 * Math.sin(a1));
    await drawer.showLabel('P1');
    elementsToRemove.push(canvas.objects['P0'].element);
    elementsToRemove.push(canvas.objects['label-P0'].element);
    elementsToRemove.push(canvas.objects['P1'].element);
    elementsToRemove.push(canvas.objects['label-P1'].element);
    canvas.compas.hide();
    await canvas.wait(300);
    updateStepInfo('Corde P₀P₁', 'On trace la corde qui caractérise l\'angle.');
    await canvas.wait(300);
    canvas.crayon.setPosition(P0.x, P0.y);
    canvas.crayon.show();
    await drawer.drawSegment('chord01', P0.x, P0.y, P1.x, P1.y, CONFIG.chordColor, 3, 500);
    canvas.crayon.hide();
    await canvas.wait(300);
    updateStepInfo('Réglage du compas', 'On règle le compas sur la longueur de la corde.');
    await canvas.wait(300);
    const angP0P1 = Math.atan2(P1.y - P0.y, P1.x - P0.x) * 180 / Math.PI;
    const h0 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    h0.setAttribute('cx', P0.x);
    h0.setAttribute('cy', P0.y);
    h0.setAttribute('r', '12');
    h0.setAttribute('fill', 'none');
    h0.setAttribute('stroke', CONFIG.chordColor);
    h0.setAttribute('stroke-width', '3');
    h0.setAttribute('opacity', '0.8');
    canvas.layerConstructions.appendChild(h0);
    const t1 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    t1.setAttribute('cx', P1.x);
    t1.setAttribute('cy', P1.y);
    t1.setAttribute('r', '15');
    t1.setAttribute('fill', 'none');
    t1.setAttribute('stroke', CONFIG.chordColor);
    t1.setAttribute('stroke-width', '2');
    t1.setAttribute('stroke-dasharray', '4,4');
    t1.setAttribute('opacity', '0.6');
    canvas.layerConstructions.appendChild(t1);
    canvas.compas.setEcart(10);
    canvas.compas.setPosition(P0.x, P0.y, angP0P1);
    canvas.compas.show();
    await canvas.wait(300);
    await canvas.compas.ecarterTo(chordLength, 1000);
    t1.setAttribute('stroke', '#27ae60');
    t1.setAttribute('stroke-width', '4');
    t1.setAttribute('stroke-dasharray', 'none');
    t1.setAttribute('opacity', '1');
    h0.remove();
    t1.remove();
    updateStepInfo('Reports d\'angle', 'On reporte l\'angle pour toutes les demi-droites du secteur.');
    await canvas.wait(300);
    for (let i = 2; i < numRays; i++) {
        const currentAngle = i * angle;
        const prev = pointOnCircle(O.x, O.y, R, (i - 1) * angle);
        const np = pointOnCircle(O.x, O.y, R, currentAngle);
        const atn = Math.atan2(-(np.y - prev.y), np.x - prev.x) * 180 / Math.PI;
        canvas.compas.setEcart(chordLength);
        await canvas.compas.moveTo(prev.x, prev.y, 300);
        await canvas.compas.rotateTo(-currentAngle + angle / 2 - 90, 250);
        await drawer.drawArc(`reportArc${i}`, prev.x, prev.y, chordLength, atn - 25, atn + 25, CONFIG.chordColor, 2, 350);
        elementsToRemove.push(canvas.objects[`reportArc${i}`].element);
        canvas.compas.hide();
        const endRay = pointOnCircle(O.x, O.y, L, currentAngle);
        canvas.regle.setPosition(O.x, O.y - 25, -currentAngle);
        canvas.regle.show();
        await canvas.wait(150);
        canvas.crayon.setPosition(O.x, O.y);
        canvas.crayon.show();
        await drawer.drawSegment(`ray${i}`, O.x, O.y, endRay.x, endRay.y, CONFIG.branchColor, 2, 450);
        elementsToRemove.push(canvas.objects[`ray${i}`].element);
        canvas.regle.hide();
        canvas.crayon.hide();
    }
    
    updateStepInfo('Rangées', 'On trace des arcs concentriques pour les rangées de sièges.');
    await canvas.wait(500);
    for (let k = 0; k < CONFIG.rowCount; k++) {
        const rad = R + k * CONFIG.rowStep;
        await drawer.drawArc(`row${k}`, O.x, O.y, rad, 0, totalAngle, CONFIG.rowColor, 2.5, 350);
    }
    updateStepInfo('Nettoyage', 'On efface les constructions auxiliaires.');
    await canvas.wait(500);
    for (const el of elementsToRemove) { if (el) { el.style.transition = 'opacity 0.3s'; el.style.opacity = '0'; } }
    await canvas.wait(300);
    for (const el of elementsToRemove) { if (el && el.parentNode) el.remove(); }
    updateStepInfo('Orchestre', 'On ajoute l\'orchestre au centre.');
    await canvas.wait(300);
    const stage = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    stage.setAttribute('cx', O.x);
    stage.setAttribute('cy', O.y);
    stage.setAttribute('r', (R - 10).toString());
    stage.setAttribute('fill', CONFIG.stageColor);
    stage.setAttribute('opacity', '0.3');
    canvas.layerConstructions.appendChild(stage);
    await canvas.wait(500);
    drawAnglesPersistent();
    updateStepInfo('Terminé', 'Le théâtre d\'Épidaure est construit: mêmes angles pour les directions, arcs pour les rangées.');
}
function initModeExploration() { document.getElementById('timeline').addEventListener('input', (e) => { goToStep(parseInt(e.target.value)); }); document.getElementById('btnPrev').addEventListener('click', () => goToStep(currentStep - 1)); document.getElementById('btnNext').addEventListener('click', () => goToStep(currentStep + 1)); document.getElementById('btnResetExplore').addEventListener('click', () => goToStep(0)); }
function setupExplorationMode() { svg = document.getElementById('canvas'); const bg = document.createElementNS(SVG_NS, 'rect'); bg.setAttribute('width', '100%'); bg.setAttribute('height', '100%'); bg.setAttribute('fill', '#fafafa'); svg.appendChild(bg); layerConstruction = document.createElementNS(SVG_NS, 'g'); layerConstruction.setAttribute('id', 'construction'); svg.appendChild(layerConstruction); layerFinal = document.createElementNS(SVG_NS, 'g'); layerFinal.setAttribute('id', 'final'); svg.appendChild(layerFinal); document.getElementById('timeline').setAttribute('max', steps.length - 1); document.getElementById('timeline').value = 0; currentStep = 0; renderStepExploration(0); updateExplorationUI(); }
function goToStep(stepIndex) { if (stepIndex < 0) stepIndex = 0; if (stepIndex >= steps.length) stepIndex = steps.length - 1; currentStep = stepIndex; renderStepExploration(currentStep); updateExplorationUI(); }
function updateExplorationUI() { document.getElementById('timeline').value = currentStep; document.getElementById('stepCounter').textContent = `${currentStep + 1} / ${steps.length}`; document.getElementById('btnPrev').disabled = currentStep === 0; document.getElementById('btnNext').disabled = currentStep === steps.length - 1; const step = steps[currentStep]; updateStepInfo(step.title, step.description); }
function renderStepExploration(stepIndex) { layerConstruction.innerHTML = ''; layerFinal.innerHTML = ''; for (let i = 0; i <= stepIndex; i++) { steps[i].render(i === stepIndex); } }
function buildSteps() { steps = []; steps.push({ title: 'Centre O', description: 'On place le centre O.', render: () => { drawPoint(O.x, O.y, '#2c3e50', 7); drawLabel('O', O.x - 18, O.y + 5); } }); steps.push({ title: 'Première demi-droite', description: 'On trace la première demi-droite.', render: () => { const end = pointOnCircle(O.x, O.y, L, 0); drawSegment(O.x, O.y, end.x, end.y, CONFIG.branchColor, 2); } }); steps.push({ title: 'Arc du secteur', description: 'Arc centré en O pour le secteur.', render: () => { drawArc(O.x, O.y, R, 0, totalAngle, CONFIG.arcColor, 2); } }); steps.push({ title: 'Points P₀ et P₁', description: 'On obtient P₀ et P₁.', render: () => { const P0 = arcPoints[0]; const P1 = arcPoints[1]; drawPoint(P0.x, P0.y, CONFIG.pointColor, 6); drawLabel('P₀', P0.x + 5, P0.y + 18); drawPoint(P1.x, P1.y, CONFIG.pointColor, 6); const a = angle * Math.PI / 180; drawLabel('P₁', P1.x + 15 * Math.cos(a), P1.y - 15 * Math.sin(a)); } }); steps.push({ title: 'Corde P₀P₁', description: 'On trace la corde.', render: () => { const P0 = arcPoints[0]; const P1 = arcPoints[1]; drawSegment(P0.x, P0.y, P1.x, P1.y, CONFIG.chordColor, 3); } }); for (let i = 2; i < numRays; i++) { const currentAngle = i * angle; steps.push({ title: `Report ${i - 1}`, description: `On reporte l\'angle et trace la demi-droite n°${i + 1}.`, render: () => { const end = pointOnCircle(O.x, O.y, L, currentAngle); drawSegment(O.x, O.y, end.x, end.y, CONFIG.branchColor, 2); } }); }
    steps.push({ title: 'Angles', description: `Visualisation des angles de base (${angle}°) entre les rayons.`, render: () => { const angleRadius = Math.max(30, R - 25); for (let i = 1; i < numRays; i++) { const startA = (i - 1) * angle; const endA = i * angle; const midA = (startA + endA) / 2; const p = describeArc(O.x, O.y, angleRadius, startA + 1, endA - 1); const path = document.createElementNS(SVG_NS, 'path'); path.setAttribute('d', p); path.setAttribute('fill', 'none'); path.setAttribute('stroke', '#f39c12'); path.setAttribute('stroke-width', '1.5'); path.setAttribute('stroke-linecap', 'round'); layerFinal.appendChild(path); const labelPos = pointOnCircle(O.x, O.y, angleRadius + 12, midA); const t = document.createElementNS(SVG_NS, 'text'); t.setAttribute('x', labelPos.x); t.setAttribute('y', labelPos.y); t.setAttribute('fill', '#f39c12'); t.setAttribute('font-size', '12'); t.setAttribute('font-family', 'Arial, sans-serif'); t.setAttribute('text-anchor', 'middle'); t.setAttribute('dominant-baseline', 'middle'); t.textContent = `${angle}°`; layerFinal.appendChild(t); } const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'; const outerR = R + CONFIG.rowCount * CONFIG.rowStep + 10; for (let i = 0; i < numRays; i++) { const pos = pointOnCircle(O.x, O.y, outerR, i * angle); const tt = document.createElementNS(SVG_NS, 'text'); tt.setAttribute('x', pos.x); tt.setAttribute('y', pos.y); tt.setAttribute('fill', '#ccc'); tt.setAttribute('font-size', '12'); tt.setAttribute('font-family', 'Arial, sans-serif'); tt.setAttribute('text-anchor', 'middle'); tt.setAttribute('dominant-baseline', 'middle'); tt.textContent = letters[i % letters.length]; layerFinal.appendChild(tt); } } }); steps.push({ title: 'Rangées', description: 'Arcs concentriques des rangées.', render: () => { for (let k = 0; k < CONFIG.rowCount; k++) { const rad = R + k * CONFIG.rowStep; drawArcFinal(O.x, O.y, rad, 0, totalAngle, CONFIG.rowColor, 2.5); } } }); steps.push({ title: 'Orchestre', description: 'Disque central de l\'orchestre.', render: () => { const c = document.createElementNS(SVG_NS, 'circle'); c.setAttribute('cx', O.x); c.setAttribute('cy', O.y); c.setAttribute('r', (R - 10).toString()); c.setAttribute('fill', CONFIG.stageColor); c.setAttribute('opacity', '0.3'); layerFinal.appendChild(c); } }); }
function updateAngleInsight() { const theta = CONFIG.baseAngle * Math.PI / 180; const innerArc = R * theta; const outerArc = (R + CONFIG.rowCount * CONFIG.rowStep) * theta; const rayCount = Math.floor(totalAngle / CONFIG.baseAngle) + 1; const fmt = (x) => (Math.round(x)).toString(); document.getElementById('rayCountValue').textContent = `${rayCount}`; document.getElementById('innerArcValue').textContent = `${fmt(innerArc)} px`; document.getElementById('outerArcValue').textContent = `${fmt(outerArc)} px`; }
function drawAnglesPersistent() { const angleRadius = Math.max(30, R - 25); for (let i = 1; i < numRays; i++) { const startA = (i - 1) * angle; const endA = i * angle; const midA = (startA + endA) / 2; const p = describeArc(O.x, O.y, angleRadius, startA + 1, endA - 1); const path = document.createElementNS(SVG_NS, 'path'); path.setAttribute('d', p); path.setAttribute('fill', 'none'); path.setAttribute('stroke', '#ffda00'); path.setAttribute('stroke-width', '2.5'); path.setAttribute('stroke-linecap', 'round'); canvas.layerLabels.appendChild(path); const labelPos = pointOnCircle(O.x, O.y, angleRadius + 16, midA); const t = document.createElementNS(SVG_NS, 'text'); t.setAttribute('x', labelPos.x); t.setAttribute('y', labelPos.y); t.setAttribute('fill', '#ffda00'); t.setAttribute('font-size', '13'); t.setAttribute('font-family', 'Arial, sans-serif'); t.setAttribute('text-anchor', 'middle'); t.setAttribute('dominant-baseline', 'middle'); t.textContent = `${angle}°`; canvas.layerLabels.appendChild(t); } }
function drawSegment(x1, y1, x2, y2, color, width) { const line = document.createElementNS(SVG_NS, 'line'); line.setAttribute('x1', x1); line.setAttribute('y1', y1); line.setAttribute('x2', x2); line.setAttribute('y2', y2); line.setAttribute('stroke', color); line.setAttribute('stroke-width', width); line.setAttribute('stroke-linecap', 'round'); layerConstruction.appendChild(line); }
function drawPoint(x, y, color, radius) { const circle = document.createElementNS(SVG_NS, 'circle'); circle.setAttribute('cx', x); circle.setAttribute('cy', y); circle.setAttribute('r', radius); circle.setAttribute('fill', color); circle.setAttribute('stroke', '#fff'); circle.setAttribute('stroke-width', '1'); layerConstruction.appendChild(circle); }
function drawLabel(text, x, y) { const label = document.createElementNS(SVG_NS, 'text'); label.setAttribute('x', x); label.setAttribute('y', y); label.setAttribute('fill', '#333'); label.setAttribute('font-size', '14'); label.setAttribute('font-weight', 'bold'); label.setAttribute('font-family', 'Arial, sans-serif'); label.textContent = text; layerConstruction.appendChild(label); }
function drawArc(cx, cy, radius, startAngle, endAngle, color, width) { const path = document.createElementNS(SVG_NS, 'path'); path.setAttribute('d', describeArc(cx, cy, radius, startAngle, endAngle)); path.setAttribute('fill', 'none'); path.setAttribute('stroke', color); path.setAttribute('stroke-width', width); path.setAttribute('stroke-linecap', 'round'); layerConstruction.appendChild(path); }
function drawSegmentFinal(x1, y1, x2, y2, color, width) { const line = document.createElementNS(SVG_NS, 'line'); line.setAttribute('x1', x1); line.setAttribute('y1', y1); line.setAttribute('x2', x2); line.setAttribute('y2', y2); line.setAttribute('stroke', color); line.setAttribute('stroke-width', width); line.setAttribute('stroke-linecap', 'round'); layerFinal.appendChild(line); }
function drawArcFinal(cx, cy, radius, startAngle, endAngle, color, width) { const path = document.createElementNS(SVG_NS, 'path'); path.setAttribute('d', describeArc(cx, cy, radius, startAngle, endAngle)); path.setAttribute('fill', 'none'); path.setAttribute('stroke', color); path.setAttribute('stroke-width', width); path.setAttribute('stroke-linecap', 'round'); layerFinal.appendChild(path); }
function pointOnCircle(cx, cy, radius, angleDeg) { const angleRad = angleDeg * Math.PI / 180; return { x: cx + radius * Math.cos(angleRad), y: cy - radius * Math.sin(angleRad) }; }
function distance(p1, p2) { return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2); }
function describeArc(cx, cy, radius, startAngle, endAngle) { const start = pointOnCircle(cx, cy, radius, startAngle); const end = pointOnCircle(cx, cy, radius, endAngle); const deltaAngle = endAngle - startAngle; const largeArcFlag = Math.abs(deltaAngle) > 180 ? '1' : '0'; const sweepFlag = deltaAngle > 0 ? '0' : '1'; return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${end.x} ${end.y}`; }
function updateStepInfo(title, description) { document.getElementById('stepTitle').textContent = title; document.getElementById('stepDescription').textContent = description; }
