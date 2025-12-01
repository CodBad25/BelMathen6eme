# Instructions pour Claude

## Workflow de développement

**IMPORTANT** : Procéder de manière incrémentale et laisser l'utilisateur répondre au fur et à mesure.

- Ne pas poser plusieurs questions à la fois
- Avancer étape par étape
- Attendre la réponse de l'utilisateur avant de continuer
- Proposer des choix simples quand c'est possible

## Workflow de déploiement

**IMPORTANT** : Avant de déployer sur Vercel, toujours laisser l'utilisateur tester en local d'abord, sauf contre-indication explicite.

Processus :
1. Faire les modifications
2. Attendre la validation de l'utilisateur après test local
3. Déployer uniquement après confirmation

## Structure du projet

- `api/trpc/[trpc].ts` - Backend Vercel (API serverless) - C'EST LE VRAI BACKEND
- `server/routers.ts` - Routeurs locaux (pour dev)
- `client/src/pages/` - Pages React

## Sections par chapitre

Chaque chapitre (Angles, Prix, Aires, Durées, Volumes) a les sections suivantes :
- introduction
- cours
- etude-1, etude-2, etude-3 (etude-4 pour volumes)
- activite-rapide
- corrections

## Visibilité par classe

Les ressources ont une visibilité par classe (6A, 6B, 6C, 6D) via les champs :
- `visible` - visibilité générale
- `visible6A`, `visible6B`, `visible6C`, `visible6D` - par classe

## Classes actives

Les classes actives sont stockées dans localStorage (`maths6e_active_classes`).
