import type { Metadata } from "next";
import { LegalLayout } from "@/components/LegalLayout";
import { getSiteConfig } from "@/lib/site-settings";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  robots: { index: false },
};

export default async function ConfidentialitePage() {
  const siteConfig = await getSiteConfig();
  return (
    <LegalLayout
      title="Politique de confidentialité"
      updatedAt="9 juillet 2026"
    >
      <p className="rounded-xl border border-gold/30 bg-gold/5 p-4 text-sm text-gold">
        ⚠️ Modèle conforme RGPD à faire valider juridiquement avant production.
      </p>

      <h2>Responsable du traitement</h2>
      <p>
        {siteConfig.name} —{" "}
        <a href={`mailto:${siteConfig.contact.email}`}>
          {siteConfig.contact.email}
        </a>
      </p>

      <h2>Données collectées</h2>
      <p>
        Nous collectons uniquement les données nécessaires aux services suivants
        :
      </p>
      <ul className="list-disc space-y-1 pl-6">
        <li>
          <strong>Commande</strong> : nom, email, téléphone, adresse de
          livraison.
        </li>
        <li>
          <strong>Compte client</strong> : email (connexion par lien sécurisé).
        </li>
        <li>
          <strong>Newsletter</strong> : email.
        </li>
        <li>
          <strong>Contact</strong> : nom, email, téléphone, message.
        </li>
        <li>
          <strong>Tests et démonstrations</strong> : nom, email, téléphone,
          source du formulaire et message saisi lorsque ces informations sont
          renseignées volontairement.
        </li>
      </ul>

      <h2>Finalités</h2>
      <p>
        Traitement et suivi des commandes, gestion du compte client, envoi
        d&apos;informations commerciales (avec consentement), réponse aux
        demandes.
      </p>
      <p>
        Les coordonnées saisies pendant un test du site peuvent aussi servir à
        recontacter la personne au sujet de sa demande, de son panier ou de son
        essai de commande.
      </p>

      <h2>Durée de conservation</h2>
      <p>
        Les commandes sont conservées le temps légal comptable (10 ans). Les
        données de newsletter le sont jusqu&apos;à désinscription.
      </p>

      <h2>Vos droits</h2>
      <p>
        Conformément au RGPD, vous disposez d&apos;un droit d&apos;accès, de
        rectification, d&apos;effacement et de portabilité de vos données. Pour
        l&apos;exercer, écrivez à{" "}
        <a href={`mailto:${siteConfig.contact.email}`}>
          {siteConfig.contact.email}
        </a>
        .
      </p>

      <h2>Cookies</h2>
      <p>
        Le site utilise un cookie de session strictement nécessaire à
        l&apos;authentification. Les éventuels cookies de mesure d&apos;audience
        ne sont déposés qu&apos;après votre consentement via le bandeau dédié.
      </p>
    </LegalLayout>
  );
}
