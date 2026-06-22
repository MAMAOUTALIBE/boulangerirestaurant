import type { Metadata } from "next";
import { LegalLayout } from "@/components/LegalLayout";
import { siteConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: "Mentions légales",
  robots: { index: false },
};

export default function MentionsLegalesPage() {
  return (
    <LegalLayout title="Mentions légales" updatedAt="31 mai 2026">
      <p className="rounded-xl border border-gold/30 bg-gold/5 p-4 text-sm text-gold">
        ⚠️ Modèle à compléter avec vos informations légales réelles avant toute
        mise en production (raison sociale, SIRET, etc.).
      </p>

      <h2>Éditeur du site</h2>
      <p>
        {siteConfig.name}
        <br />
        Adresse : {siteConfig.contact.address}
        <br />
        Téléphone : {siteConfig.contact.phone}
        <br />
        Email :{" "}
        <a href={`mailto:${siteConfig.contact.email}`}>
          {siteConfig.contact.email}
        </a>
        <br />
        Forme juridique : [SARL / SAS / …] — Capital social : [montant] €<br />
        SIRET : [numéro] — RCS : [ville et numéro]
        <br />
        TVA intracommunautaire : [FR…]
      </p>

      <h2>Directeur de la publication</h2>
      <p>[Nom du responsable légal]</p>

      <h2>Hébergement</h2>
      <p>
        Le site est hébergé par [Vercel Inc. / OVH / …], [adresse de
        l&apos;hébergeur].
      </p>

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
    </LegalLayout>
  );
}
