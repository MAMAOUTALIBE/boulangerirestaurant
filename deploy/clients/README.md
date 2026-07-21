# deploy/clients — un dossier par restaurant

Stratégie **multi-instance** : le même code (ce dépôt) est déployé plusieurs
fois, une instance isolée par restaurant. Ce dossier contient, par restaurant :

```
deploy/clients/
├── EXEMPLE.env              # modèle de config à copier
├── PORTS.md                 # registre des ports (anti-collision)
├── <slug>.env               # params de CIBLE (VPS, domaine, port, projet Compose) — PAS de secrets
└── <slug>/
    └── overlay/             # assets propres au restaurant (logo, favicon, photos) — hors dépôt public
        ├── public/images/…
        └── src/app/favicon.ico, icon.svg
```

## Ajouter un restaurant (résumé)

1. `cp deploy/clients/EXEMPLE.env deploy/clients/<slug>.env` puis renseigne-le
   (choisis un port libre dans `PORTS.md`).
2. (optionnel) Dépose les assets du restaurant dans `deploy/clients/<slug>/overlay/`
   en respectant l'arborescence du dépôt.
3. Suis la checklist de première mise en ligne dans **`MULTI-RESTAURANT.md`**
   (DNS → `.env` distant → provisioning → vhost Nginx + certbot).
4. Déploie / mets à jour avec : `./deploy/deploy-client.sh <slug>`.

## Ce qui est versionné ou non

- `*.env` (params de cible) et `PORTS.md` : **versionnés** (pas de secrets).
- `<slug>/overlay/**` (médias du restaurant) : **ignorés par git** (voir
  `.gitignore`) — ils restent locaux et sont poussés par rsync au déploiement.
- Les secrets (mots de passe, clés Stripe…) : **jamais ici**, uniquement dans le
  `.env` distant sur le VPS.
