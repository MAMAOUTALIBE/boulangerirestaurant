import type { Metadata } from "next";
import { LegalLayout } from "@/components/LegalLayout";
import { LegalContent } from "@/components/LegalContent";
import { getSiteConfig } from "@/lib/site-settings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mentions légales",
  robots: { index: false },
};

export default async function MentionsLegalesPage() {
  const siteConfig = await getSiteConfig();
  return (
    <LegalLayout title="Mentions légales" updatedAt="31 mai 2026">
      <LegalContent section="page-mentions-legales">
        {!siteConfig.legal.siret && (
          <p className="rounded-xl border border-gold/30 bg-gold/5 p-4 text-sm text-gold">
            ⚠️ Informations légales incomplètes. Renseignez la raison sociale,
            le SIRET et l&apos;hébergeur dans le CRM (Paramètres → Mentions
            légales) avant la mise en production.
          </p>
        )}

        <h2>Éditeur du site</h2>
        <p>
          {siteConfig.legal.company || siteConfig.name}
          <br />
          Adresse : {siteConfig.contact.address}
          <br />
          Téléphone : {siteConfig.contact.phone}
          <br />
          Email :{" "}
          <a href={`mailto:${siteConfig.contact.email}`}>
            {siteConfig.contact.email}
          </a>
          {/* Chaque ligne n'apparaît qu'une fois renseignée au CRM : mieux vaut
              une mention absente qu'un « [numéro] » publié en production. */}
          {(siteConfig.legal.status || siteConfig.legal.capital) && (
            <>
              <br />
              {siteConfig.legal.status}
              {siteConfig.legal.status && siteConfig.legal.capital ? " — " : ""}
              {siteConfig.legal.capital &&
                `Capital social : ${siteConfig.legal.capital}`}
            </>
          )}
          {siteConfig.legal.siret && (
            <>
              <br />
              SIRET : {siteConfig.legal.siret}
            </>
          )}
          {siteConfig.legal.siren && (
            <>
              <br />
              SIREN : {siteConfig.legal.siren}
            </>
          )}
          {siteConfig.legal.ape && (
            <>
              <br />
              Code APE : {siteConfig.legal.ape}
            </>
          )}
          {siteConfig.legal.vat && (
            <>
              <br />
              TVA intracommunautaire : {siteConfig.legal.vat}
            </>
          )}
        </p>

        {siteConfig.legal.director && (
          <>
            <h2>Directeur de la publication</h2>
            <p>{siteConfig.legal.director}</p>
          </>
        )}

        {siteConfig.legal.host && (
          <>
            <h2>Hébergement</h2>
            <p>Le site est hébergé par {siteConfig.legal.host}.</p>
          </>
        )}

        <h2>Propriété intellectuelle</h2>
        <p>
          L&apos;ensemble des contenus de ce site (textes, images, logo) est
          protégé. Toute reproduction sans autorisation est interdite.
        </p>

        <h2>Données personnelles</h2>
        <p>
          Le traitement de vos données est décrit dans notre{" "}
          <a href="/confidentialite">politique de confidentialité</a>.
        </p>
      </LegalContent>
    </LegalLayout>
  );
}
