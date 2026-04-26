# Vinted ReLister

**[English](README.md) | Français**

Extension Chrome pour republier rapidement vos articles sur [vinted.fr](https://www.vinted.fr).

## Installation (depuis les sources)

1. Cloner ce dépôt
2. `npm install`
3. `npm run build`
4. Ouvrir Chrome et aller sur `chrome://extensions`
5. Activer le "Mode développeur" (en haut à droite)
6. Cliquer sur "Charger l'extension non empaquetée" et sélectionner la **racine du dépôt** (pas `dist/`)
7. Aller sur votre [dressing Vinted](https://www.vinted.fr/member/items/current)

## Utilisation

1. Aller sur votre [dressing Vinted](https://www.vinted.fr/member/items/current)
2. Cliquer sur le bouton **✨ Republier** d'un article
3. Modifier le prix si nécessaire (ou garder le prix actuel)
4. Confirmer
5. Attendre la fin du processus automatique

L'extension va :

- Réuploader les photos de l'article
- Créer un nouvel article identique (avec le nouveau prix si modifié)
- Supprimer l'ancien article
- Afficher une notification de succès — rafraîchir la page pour voir le nouvel article remonté en haut de votre dressing

## Statut

V1, `vinted.fr` uniquement. La couche d'intégration API (`src/api.js`) est en cours de finalisation contre des captures HAR réelles du flux officiel Vinted.

## Licence

MIT.

## Avertissement

Cette extension n'est ni affiliée ni approuvée par Vinted. Utilisation à vos risques et périls. Les conditions d'utilisation de Vinted peuvent interdire toute interaction automatisée avec leur service ; l'usage de cette extension peut conduire à la restriction ou suspension de votre compte. Respectez toujours les CGU de Vinted.
