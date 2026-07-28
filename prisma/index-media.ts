/**
 * Indexe dans la médiathèque les visuels livrés avec le dépôt.
 *
 * À lancer **après chaque déploiement** qui ajoute ou retire des fichiers dans
 * `public/images` ou `public/videos` :
 *
 *   npm run db:index-media
 *
 * En production (Docker) :
 *   docker compose -p <projet> --env-file .env run --rm migrate \
 *     node_modules/.bin/tsx prisma/index-media.ts
 *
 * Pourquoi un script séparé du seed : `prisma/seed.ts` applique un profil
 * complet (menu, identité, réglages) et le profil de démonstration est
 * DESTRUCTIF — il ne doit jamais tourner en production. Cette indexation-ci,
 * elle, est strictement additive : elle ne fait qu'`upsert` une ligne `Media`
 * par fichier trouvé, sans toucher au reste. Elle est donc sûre à relancer
 * autant de fois que nécessaire, sur n'importe quelle instance.
 *
 * Sans elle, `/admin/medias` s'ouvre sur une grille vide alors que le site est
 * déjà illustré, et le sélecteur d'images ne propose rien.
 */
import { PrismaClient } from "@prisma/client";
import { indexTemplateMedia } from "./seeds/template-media";

const prisma = new PrismaClient();

async function main() {
  const total = await indexTemplateMedia(prisma);
  const televerses = await prisma.media.count({ where: { source: "upload" } });
  console.log(
    `✓ Médiathèque : ${total} visuel·s du site indexé·s ` +
      `(${televerses} média·s téléversé·s depuis le CRM, laissés intacts).`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
