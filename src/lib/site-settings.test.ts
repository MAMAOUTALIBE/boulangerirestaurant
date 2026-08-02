import { describe, expect, it } from "vitest";

import { defaultSiteConfig } from "@/lib/config";
import { mergeSiteConfig } from "@/lib/site-config-merge";

const baseRow = {
  name: null,
  shortName: null,
  description: null,
  phone: null,
  email: null,
  address: null,
  city: null,
  facebook: null,
  instagram: null,
  tiktok: null,
  whatsappNumber: null,
  telegramUsername: null,
  hoursSummary: null,
};

describe("mergeSiteConfig — texte du hero", () => {
  it("conserve le rendu actuel par défaut", () => {
    const config = mergeSiteConfig(defaultSiteConfig, baseRow);

    expect(config.hero).toEqual(defaultSiteConfig.hero);
  });

  it("applique les textes et visibilités configurés dans le CRM", () => {
    const config = mergeSiteConfig(defaultSiteConfig, {
      ...baseRow,
      heroTitle: "Le goût de la maison",
      heroDescription: "Découvrez nos plats du jour.",
      heroTitleVisible: false,
      heroDescriptionVisible: true,
    });

    expect(config.hero).toEqual({
      title: "Le goût de la maison",
      description: "Découvrez nos plats du jour.",
      titleVisible: false,
      descriptionVisible: true,
    });
  });

  it("utilise le nom personnalisé lorsque le titre du hero est vide", () => {
    const config = mergeSiteConfig(defaultSiteConfig, {
      ...baseRow,
      name: "Mon Restaurant",
      heroTitle: null,
    });

    expect(config.hero.title).toBe("Mon Restaurant");
  });
});
