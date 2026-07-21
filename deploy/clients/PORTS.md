# Registre des ports — VPS lodene (213.130.144.215)

Chaque restaurant (et chaque autre site du VPS) écoute sur `127.0.0.1:<port>`
et est exposé par un vhost Nginx. **Un port par site, jamais de collision.**
Avant d'ajouter un restaurant, choisis un port libre ici et note-le.

## Restaurants (ce code — Anatolia Grill & dérivés)

| Slug            | Domaine        | Port   | Projet Compose   | Dossier distant        |
| --------------- | -------------- | ------ | ---------------- | ---------------------- |
| `anatolia-grill`| lodene.cloud   | `3201` | `restaurant-turc`| `/root/restaurant-turc`|
| _(prochain)_    | _(à définir)_  | `3202` | _(slug)_         | `/root/<slug>`         |

Convention : réserver la plage **3201–3299** aux instances de ce code.

## Autres sites du VPS — NE PAS TOUCHER

| Site                     | Port   |
| ------------------------ | ------ |
| Boulangerie (lodene.org) | `3101` |
| Ancien restaurant        | `3100` |
| es-viry                  | `8090` |

> Ces sites ont leurs propres conteneurs/volumes. On ne redéploie, n'arrête et
> ne reconstruit jamais leurs services.
