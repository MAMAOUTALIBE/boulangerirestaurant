import type { Metadata } from "next";
import { LegalLayout } from "@/components/LegalLayout";
import { LegalContent } from "@/components/LegalContent";
import { getSiteConfig } from "@/lib/site-settings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Conditions générales de vente",
  robots: { index: false },
};

export default async function CgvPage() {
  const siteConfig = await getSiteConfig();
  return (
    <LegalLayout title="Conditions générales de vente" updatedAt="31 mai 2026">
      <LegalContent section="page-cgv">
        <p className="rounded-xl border border-gold/30 bg-gold/5 p-4 text-sm text-gold">
          ⚠️ Modèle à adapter et faire valider juridiquement avant production.
        </p>

        <h2>Article 1 — Objet</h2>
        <p>
          Les présentes CGV régissent les ventes de produits réalisées par{" "}
          {siteConfig.name} via le site {siteConfig.url}.
        </p>

        <h2>Article 2 — Prix</h2>
        <p>
          Les prix sont indiqués en euros toutes taxes comprises (TTC).{" "}
          {siteConfig.name} se réserve le droit de modifier ses prix à tout
          moment, les produits étant facturés sur la base des tarifs en vigueur
          au moment de la commande.
        </p>

        <h2>Article 3 — Commande</h2>
        <p>
          Toute commande passée sur le site vaut acceptation des présentes CGV.
          Un email de confirmation récapitule la commande.
        </p>

        <h2>Article 4 — Paiement</h2>
        <p>
          Le paiement s&apos;effectue en ligne par carte bancaire via notre
          prestataire sécurisé. La commande n&apos;est validée qu&apos;après
          confirmation effective du paiement.
        </p>

        <h2>Article 5 — Livraison</h2>
        <p>
          Les zones, délais et frais de livraison sont précisés lors de la
          commande.
        </p>

        <h2>Article 6 — Droit de rétractation</h2>
        <p>
          Conformément à l&apos;article L221-28 du Code de la consommation, le
          droit de rétractation ne s&apos;applique pas aux denrées alimentaires
          périssables.
        </p>

        <h2>Article 7 — Service client</h2>
        <p>
          Pour toute réclamation :{" "}
          <a href={`mailto:${siteConfig.contact.email}`}>
            {siteConfig.contact.email}
          </a>{" "}
          — {siteConfig.contact.phone}.
        </p>
      </LegalContent>
    </LegalLayout>
  );
}
