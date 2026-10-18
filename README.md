# Pharmacy Stock And Sale

Créer une application complète de gestion de stock et de caisse pour la Pharmacie Siloé avec un design moderne, soigné et intuitif.

Fonctionnalités requises :

1. Authentification et Sessions (RBAC) :
- Écran de connexion à l'ouverture : sélection du profil utilisateur dans une liste déroulante + saisie sécurisée du code PIN (pavé numérique à l'écran et au clavier).
- Deux rôles : Administrateur et Vendeur.
- Rôle Administrateur : gestion des utilisateurs (créer, modifier les comptes et réinitialiser les PIN), accès complet au stock, aux commandes et aux statistiques.
- Rôle Vendeur : accès centré sur la vente et la caisse, avec historique de ses ventes.
- L'utilisateur connecté est affiché en permanence en haut avec son rôle, et chaque vente ou action est enregistrée à son nom.

2. Stock :
- Liste complète des médicaments et produits : nom, référence/code-barres, quantité disponible, prix public (prix de vente).
- Indicateurs visuels pour le stock faible ou en rupture.
- Ajout, modification et mise à jour rapide des quantités.

3. Vente & Caisse (Écran séparé en deux colonnes) :
- Partie gauche (Vente) : catalogue et recherche instantanée des médicaments, ajout au panier, réglage des quantités, affichage du total et bouton "Envoyer à la caisse".
- Partie droite (Caisse) : affichage du montant total à régler.
- Modes de règlement flexibles : Espèces (Cash), Mobile Money, ou Paiement partiel/mixte (une partie en Mobile Money et le reste en espèces, ou l'inverse).
- Saisie du montant reçu, calcul automatique et instantané de la monnaie à rendre, puis validation de la vente avec aperçu/impression du ticket.

4. Commandes Fournisseurs & Téléchargement PDF :
- Interface pour préparer une commande en sélectionnant les produits et en définissant les quantités nécessaires.
- Génération et téléchargement direct du bon de commande au format PDF arborant fièrement l'en-tête officiel "Pharmacie Siloé", avec date, numéro de commande, nom de l'agent responsable et tableau détaillé des articles.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/d2e76922-4615-4281-877f-506481399b3b).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
