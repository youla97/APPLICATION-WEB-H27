# Hadj 2027 Guinée — application web

Prototype fonctionnel de la plateforme décrite dans le *Cahier des charges — Application Web Hadj 2027 Guinée* :
inscription, paiement, suivi des dossiers et accompagnement des pèlerins, de la préinscription au retour.

## Lancer l'application

Prérequis : **Node.js 22.13 ou plus récent** (la base SQLite intégrée `node:sqlite` est utilisée, aucune installation de base de données n'est nécessaire).

```bash
npm install
npm run dev
```

Ouvrir http://localhost:3000. Au premier lancement, la base `data/hadj.db` est créée avec 140 pèlerins de démonstration.
Pour repartir de zéro, arrêtez le serveur et supprimez le dossier `data/`.

Production : `npm run build` puis `npm start` (le port est lu dans la variable `PORT`).

## Déploiement sur Render

L'application a besoin d'un serveur Node : elle doit être déployée en **Web Service**, pas en *Static Site*
(un Static Site affiche « Not Found »).

- **Le plus simple :** sur Render, *New → Blueprint*, choisir ce dépôt. Le fichier `render.yaml` configure tout.
- **À la main :** *New → Web Service*, runtime **Node**, build `npm ci && npm run build`, start `npm start`,
  variables `NODE_VERSION=24` et `HADJ_QR_SECRET` (une longue valeur aléatoire).

Sur l'offre gratuite, le disque est éphémère : la base de démonstration est recréée à chaque redémarrage
ou redéploiement, et le service se met en veille après 15 min sans visite (premier chargement lent).
Pour conserver les données, ajoutez un disque persistant monté sur `/opt/render/project/src/data`, ou passez à PostgreSQL.

## Comptes de démonstration

Connexion par **téléphone + code OTP** (le code s'affiche à l'écran comme s'il était reçu par SMS).

| Profil | Téléphone |
|---|---|
| Administrateur (SGAR / COGEP) | 620000001 |
| Agent préfectoral (Kindia) | 620000002 |
| Médecin | 620000003 |
| Encadreur | 620000004 |
| Agence agréée | 620000005 |
| Pèlerin | tout autre numéro (ex. 622123456) crée un compte |

Proche / parrain : page **Payer pour un proche** (`/payer`), sans compte, avec le numéro de dossier du pèlerin.

## Parcours de démonstration conseillé

1. Pèlerin : créer un compte, remplir les 5 étapes (le bouton « Scanner la page du passeport » simule la lecture MRZ), envoyer.
2. Administrateur : *Dossiers → À traiter* → valider (ou rejeter avec un motif : le pèlerin corrige sans tout ressaisir).
3. Pèlerin : payer une tranche (Orange Money / MTN MoMo / carte) → confirmation de l'opérateur en ~4 s → reçu avec QR code.
4. Pèlerin : remplir la fiche santé. Médecin : déclarer « Apte ».
5. Dès que le dossier est payé et apte, il passe **Complet** : vol, hôtels, tente et groupe sont affectés et le **badge QR** est disponible.
6. *Programme des rites* → bouton **URGENCE** : l'alerte (avec position GPS) apparaît en direct chez l'encadreur et l'administrateur.

Ouvrez deux navigateurs différents (pèlerin / administrateur) pour voir les mises à jour **en temps réel** (indicateur « En direct »).

## Couverture du cahier des charges

| Module | Réalisé dans le prototype |
|---|---|
| M1 Portail public | Accueil, compte à rebours, packages et tarifs, calendrier, actualités, FAQ, contact |
| M2 Inscription | Compte par OTP, formulaire en 5 étapes, sauvegarde automatique, photo compressée (WebP), lecture MRZ avec clés de contrôle, numéro de dossier unique |
| M3 Dossiers | 6 statuts, contrôle des pièces, détection des doublons (passeport, nom + date de naissance), motifs de rejet, historique |
| M4 Paiements | Orange Money, MTN MoMo, carte/virement, tranches, reçu avec QR code, rapprochement automatique, remboursement |
| M5 Espace pèlerin | Barre de progression 8 étapes, documents, notifications SMS/app, messagerie avec l'administration |
| M6 Back-office | Validation, quotas par région (bloquants), agences (ajout, suspension), rôles, journal d'audit non modifiable |
| M7 Santé | Fiche médicale, vaccin méningite obligatoire, certificat d'aptitude, suivi des pèlerins à risque |
| M8 Logistique | Affectation automatique vol / hôtels La Mecque et Médine / tente Mina / bus / groupe, badge avec QR code |
| M9 Accompagnement | Programme des rites jour par jour (hors ligne), carte interactive, consignes, SOS géolocalisé, appel du groupe, diffusion de consignes |
| M10 Pilotage | Tableau de bord temps réel, statistiques par région, exports Excel (CSV) et liste passagers, satisfaction au retour |
| Transverse | PWA installable, mode sombre, taille du texte, français / arabe (RTL), lecture vocale, vérification des documents par QR signé |

## Ce qui est simulé

Ces éléments sont simulés et devront être branchés sur les services réels :

- **SMS / WhatsApp** : les messages sont enregistrés et affichés dans l'espace pèlerin ; le code OTP s'affiche à l'écran.
- **Orange Money / MTN MoMo / banque** : la confirmation de l'opérateur (webhook) est simulée 4 secondes après l'initiation.
- **Lecture du passeport** : l'analyse MRZ et ses clés de contrôle sont réelles, mais l'OCR de l'image est simulé.
- **Messages vocaux en pular, malinké et soussou** : la lecture utilise la synthèse vocale du navigateur (français/arabe) ; les enregistrements dans les langues nationales restent à produire.
- **Plateformes saoudiennes (Nusuk / Masar)** et **compagnie aérienne** : le prototype fournit seulement les exports CSV.
- **PDF** : reçus, fiches et badges sont des pages imprimables (« Télécharger en PDF / imprimer »).

## Architecture

- **Next.js 16** (App Router, Server Components, Server Actions) + **TypeScript** + **Tailwind CSS 4**
- **SQLite** (`node:sqlite`) dans `src/lib/db.ts`. Le schéma se transpose directement en **PostgreSQL**, comme le recommande le cahier des charges.
- Temps réel par **Server-Sent Events** (`/api/events`) ; en production, remplacer le bus en mémoire (`src/lib/events.ts`) par Redis Pub/Sub.
- Sessions par cookie `httpOnly`, contrôle d'accès par rôle côté serveur, QR codes signés par HMAC (variable `HADJ_QR_SECRET` à définir en production).

```
src/
  app/            pages (portail, espace, admin, agent, medecin, encadreur, agence, accompagnement…)
  app/actions/    actions serveur (auth, pèlerin, paiement, personnel)
  app/api/        flux temps réel (SSE) et exports
  components/     composants partagés (en-tête, suivi, paiement, messagerie…)
  lib/            base de données, règles métier, i18n, MRZ, QR
```
