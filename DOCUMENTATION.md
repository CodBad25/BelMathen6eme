# Géométrie Animée - Documentation

## Vue d'ensemble

Ce projet propose des animations interactives de constructions géométriques à la règle et au compas, destinées aux élèves de 6ème. L'objectif est de montrer **pas à pas** comment réaliser des constructions classiques, avec des instruments virtuels animés.

---

## Architecture du projet

```
geometrie-animee/
├── geometrie.js      # Moteur principal (classes GeoCanvas, instruments, dessin)
├── eventail.html     # Page HTML de l'éventail
├── eventail.js       # Animation de l'éventail (report d'angle)
├── spirale.html      # Page HTML de la spirale
├── spirale.js        # Animation de la spirale d'Archimède
└── DOCUMENTATION.md  # Ce fichier
```

### Classes principales (`geometrie.js`)

| Classe | Rôle |
|--------|------|
| `GeoCanvas` | Gestion du SVG, des calques, de l'animation et de la vitesse |
| `Crayon` | Instrument crayon animé |
| `Regle` | Instrument règle animé |
| `Compas` | Instrument compas avec écartement variable |
| `GeoDrawer` | Fonctions de dessin (points, segments, arcs, labels) |

---

## Leçons apprises et bonnes pratiques

### 1. Clarté pédagogique avant tout

> **Principe** : Chaque étape doit être immédiatement compréhensible visuellement.

- **Ne jamais supposer** que l'élève comprend ce qui se passe
- **Montrer explicitement** chaque action des instruments
- Utiliser des **indicateurs visuels** (cercles de surbrillance, cibles) pour montrer où l'instrument agit

**Exemple concret** : Quand le compas prend un écartement entre deux points P₀ et P₁ :
```javascript
// MAUVAIS : Le compas s'ouvre mais on ne voit pas qu'il touche les points
canvas.compas.setPosition(P0.x, P0.y, angle);
await canvas.compas.ecarterTo(chordLength, 1000);

// BON : Ajouter des indicateurs visuels
// 1. Cercle rouge sur P₀ (où est la pointe sèche)
const highlightP0 = createCircle(P0.x, P0.y, 12, '#e74c3c');
// 2. Cercle cible sur P₁ (où doit aller la mine)
const targetP1 = createCircle(P1.x, P1.y, 15, '#e74c3c', 'dashed');
// 3. Quand la mine atteint P₁, le cercle devient vert
targetP1.setAttribute('stroke', '#27ae60');
```

---

### 2. Positionnement correct du compas

> **Principe** : Les deux pointes du compas doivent visuellement toucher les points concernés.

Le calcul de l'angle d'orientation du compas doit utiliser les coordonnées SVG directement :

```javascript
// L'angle de P₀ vers P₁ en coordonnées SVG (Y vers le bas)
const angle = Math.atan2(P1.y - P0.y, P1.x - P0.x) * 180 / Math.PI;

// Positionner le compas : pointe sèche sur P₀, mine vers P₁
canvas.compas.setPosition(P0.x, P0.y, angle);
canvas.compas.setEcart(distance(P0, P1));
```

**Erreur fréquente** : Inverser le signe de Y ou ajouter des offsets inutiles (-90°) qui décalent l'orientation.

---

### 3. Vocabulaire géométrique précis

> **Principe** : Une demi-droite n'a qu'une seule extrémité (son origine).

- Ne pas placer de labels aux "deux bouts" d'une demi-droite
- Les points d'intersection avec un arc se nomment sur l'arc, pas au bout de la demi-droite
- Éviter de mentionner des valeurs d'angles (comme "20°") quand l'exercice montre justement qu'on peut reporter un angle **sans connaître sa mesure**

**Bon texte pédagogique** :
```
"On trace la CORDE P₀P₁. Cette distance caractérise notre angle de départ."
"Même rayon + même corde = même angle !"
```

**Mauvais texte** :
```
"On reporte l'angle de 20°" ← On ne connaît pas la mesure !
```

---

### 4. Deux modes d'utilisation

> **Principe** : Proposer un mode "Animation" pour découvrir et un mode "Exploration" pour réviser.

| Mode | Caractéristiques |
|------|------------------|
| **Animation** | Instruments visibles, déroulement automatique, vitesse réglable |
| **Exploration** | Timeline avec slider, navigation étape par étape, pas d'instruments |

```javascript
// Structure recommandée
if (mode === 'animation') {
    // Utiliser les instruments (compas, règle, crayon)
    canvas.compas.show();
    await canvas.compas.moveTo(x, y, 500);
    // ...
} else {
    // Dessiner directement sans instruments
    drawArc(cx, cy, radius, startAngle, endAngle);
}
```

---

### 5. Nettoyage des constructions auxiliaires

> **Principe** : À la fin, ne garder que le résultat final pour une figure claire.

Les traces de construction (arcs de report, demi-droites temporaires, points intermédiaires) doivent disparaître progressivement :

```javascript
// Fade out des éléments à supprimer
for (const el of elementsToRemove) {
    el.style.transition = 'opacity 0.3s';
    el.style.opacity = '0';
}
await wait(500);

// Puis suppression du DOM
for (const el of elementsToRemove) {
    el.remove();
}
```

**Éléments à conserver** :
- L'arc principal
- Les segments finaux (baguettes de l'éventail)
- Les cordes (optionnel, pour l'esthétique)

---

### 6. Touche finale festive

> **Principe** : Récompenser l'élève qui a suivi toute la construction.

Ajouter une célébration à la fin :
1. **Décoration** : Transformer la figure géométrique en objet réel (toiles colorées, rivet)
2. **Zoom** : Mettre en valeur le résultat final
3. **Confettis** : Animation joyeuse pour marquer l'accomplissement

```javascript
// Zoom progressif avec easing
await canvas.animate(1500, (progress) => {
    const eased = 1 - Math.pow(1 - progress, 3);
    const scale = 1 + 0.3 * eased;
    zoomGroup.setAttribute('transform', `scale(${scale})`);
});

// Confettis animés
for (let i = 0; i < 50; i++) {
    createConfetti(randomX, randomY, randomColor);
}
animateConfettiFalling();
```

---

### 7. Conventions SVG importantes

| Concept | Convention |
|---------|------------|
| Origine | Coin supérieur gauche |
| Axe Y | Positif vers le **bas** |
| Angles | 0° = droite, positif = sens horaire |
| Arcs | `sweepFlag=0` = anti-horaire, `sweepFlag=1` = horaire |

**Fonction utilitaire pour les points sur un cercle** :
```javascript
function pointOnCircle(cx, cy, radius, angleDeg) {
    const angleRad = angleDeg * Math.PI / 180;
    return {
        x: cx + radius * Math.cos(angleRad),
        y: cy - radius * Math.sin(angleRad)  // Moins car Y inversé
    };
}
```

---

## Constructions disponibles

### 1. L'Éventail (Report d'angle)

**Objectif pédagogique** : Montrer qu'on peut reproduire un angle sans rapporteur, uniquement avec la règle et le compas.

**Principe clé** : `Même rayon + Même corde = Même angle`

**Étapes** :
1. Placer le sommet O
2. Tracer la première demi-droite
3. Tracer un arc centré en O → point P₀
4. Tracer la deuxième demi-droite (angle de départ) → point P₁
5. Tracer la corde P₀P₁
6. **Mémoriser la corde** avec le compas (pointe sur P₀, mine sur P₁)
7. Reporter : arc depuis P₁ avec le même écartement → P₂
8. Répéter pour chaque baguette
9. Nettoyage + Décoration finale

---

## Checklist pour une nouvelle construction

- [ ] Définir les étapes pédagogiques claires
- [ ] Identifier les points clés à nommer
- [ ] Prévoir les indicateurs visuels pour chaque action d'instrument
- [ ] Implémenter le mode Animation avec instruments
- [ ] Implémenter le mode Exploration avec timeline
- [ ] Ajouter le nettoyage des constructions auxiliaires
- [ ] Prévoir une touche finale (décoration, zoom, célébration)
- [ ] Relire les textes : vocabulaire précis, pas de valeurs cachées
- [ ] Tester le positionnement exact des instruments

---

## Idées de futures constructions

- [ ] **Spirale d'Archimède** : Points à distance croissante avec angle constant
- [ ] **Triangle équilatéral** : Construction classique
- [ ] **Médiatrice** : Avec les deux arcs de cercle
- [ ] **Bissectrice** : Report d'angle divisé en deux
- [ ] **Hexagone régulier** : 6 reports de 60°
- [ ] **Tangente à un cercle** : Construction avec angle droit

---

*Documentation créée le 22 décembre 2025*
*Projet Géométrie Animée - Pour l'enseignement des mathématiques en 6ème*
