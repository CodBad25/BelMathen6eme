# Guide d'intégration - Géométrie Animée

## Pour le site belmathen6eme.vercel.app

### Étape 1 : Copier les fichiers dans votre projet

Dans votre projet React/Vercel, placez les fichiers dans `public/animations/` :

```
votre-projet/
├── public/
│   └── animations/
│       ├── geometrie.js
│       ├── eventail.html
│       ├── eventail.js
│       ├── spirale.html
│       └── spirale.js
```

### Étape 2 : Créer les cartes cliquables

Dans votre composant React (page exercices des angles), ajoutez des cartes comme celles existantes :

```jsx
// Carte pour l'éventail
<a
  href="/animations/eventail.html"
  target="_blank"
  rel="noopener noreferrer"
  className="exercise-card"  // Utilisez votre classe CSS existante
>
  <span className="card-icon">📐</span>
  <h3>Animation 1</h3>
  <p>L'éventail - Report d'angle</p>
  <span className="card-link">Voir l'animation ›</span>
</a>

// Carte pour la spirale
<a
  href="/animations/spirale.html"
  target="_blank"
  rel="noopener noreferrer"
  className="exercise-card"
>
  <span className="card-icon">🌀</span>
  <h3>Animation 2</h3>
  <p>La spirale d'Archimède</p>
  <span className="card-link">Voir l'animation ›</span>
</a>
```

### Étape 3 : Déployer sur Vercel

```bash
git add .
git commit -m "Ajout des animations géométriques"
git push
```

Vercel déploiera automatiquement. Les animations seront accessibles à :
- `https://belmathen6eme.vercel.app/animations/eventail.html`
- `https://belmathen6eme.vercel.app/animations/spirale.html`

---

## Fichiers nécessaires

```
geometrie-animee/
├── geometrie.js      # Moteur principal (OBLIGATOIRE)
├── eventail.html     # Page de l'éventail
├── eventail.js       # Script de l'éventail
├── spirale.html      # Page de la spirale
└── spirale.js        # Script de la spirale
```

## Personnalisation

### Modifier les couleurs

Dans chaque fichier JS (eventail.js, spirale.js), modifiez l'objet `CONFIG` :

```javascript
const CONFIG = {
    // ...
    constructionColor: '#3498db',  // Bleu pour les arcs
    chordColor: '#e74c3c',         // Rouge pour les cordes
    spiralColor: '#9b59b6',        // Violet pour la spirale
    pointColor: '#27ae60',         // Vert pour les points
    // ...
};
```

### Modifier la taille du canvas

Dans le fichier HTML, modifiez les attributs du SVG :

```html
<svg id="canvas" width="800" height="700"></svg>
```

### Modifier les paramètres de la spirale

```javascript
const CONFIG = {
    centerX: 380,         // Position horizontale du centre
    centerY: 320,         // Position verticale du centre
    unitLength: 18,       // Longueur OA (unité de base)
    baseAngle: 20,        // Angle entre chaque demi-droite (en degrés)
    numBranches: 16,      // Nombre de demi-droites
    // ...
};
```

## Structure des pages

Chaque animation a deux modes :
- **Animation** : Déroulement automatique avec instruments visibles
- **Exploration** : Navigation manuelle étape par étape

## Dépendances

**Aucune dépendance externe !** Les animations utilisent uniquement :
- JavaScript vanilla (ES6+)
- SVG natif du navigateur

Compatible avec tous les navigateurs modernes (Chrome, Firefox, Safari, Edge).

## Conseils pour l'intégration pédagogique

1. **Présentez d'abord en classe** avec le mode Animation
2. **Laissez les élèves explorer** avec le mode Exploration
3. **Le curseur de zoom** permet d'adapter la vue selon les besoins
4. **La vitesse** peut être ajustée pour les explications détaillées

## Support

En cas de problème d'intégration :
- Vérifiez que `geometrie.js` est chargé AVANT les autres scripts
- Vérifiez que l'ID du SVG est bien `canvas`
- Ouvrez la console du navigateur (F12) pour voir les erreurs éventuelles
