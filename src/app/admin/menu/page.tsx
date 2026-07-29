import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Copy,
  Star,
  Trash2,
} from "lucide-react";
import { getAdminMenuData } from "@/lib/dishes";
import { remainingStock } from "@/lib/stock";
import {
  adminAddOption,
  adminAddOptionGroup,
  adminCreateCategory,
  adminCreateDish,
  adminDeleteCategory,
  adminDeleteDish,
  adminDeleteOption,
  adminDeleteOptionGroup,
  adminDuplicateDish,
  adminMoveCategory,
  adminMoveDish,
  adminToggleDishFeatured,
  adminUpdateCategory,
  adminUpdateDish,
  adminUpdateDishPrice,
  adminUpdateOption,
  adminUpdateOptionGroup,
} from "@/app/actions";
import { formatPrice } from "@/lib/utils";
import { MediaPicker } from "@/components/admin/MediaPicker";

export const dynamic = "force-dynamic";

const inputClass =
  "w-full rounded-lg border border-white/10 bg-ink px-3 py-2 text-sm text-cream placeholder:text-muted focus:border-gold/60 focus:outline-none";
const miniInput =
  "rounded border border-white/10 bg-ink px-2 py-1 text-xs text-cream placeholder:text-muted focus:border-gold/60 focus:outline-none";
const boutonPrimaire =
  "rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-ink transition hover:bg-gold-400";
const boutonDiscret =
  "rounded-lg border border-white/10 px-2 py-1 text-xs text-cream/70 transition hover:border-white/25 hover:text-cream";

const CATEGORY_CARD_STYLES = [
  {
    card: "border-amber-400/35 bg-amber-400/[0.045]",
    badge: "border-amber-300/30 bg-amber-400/15 text-amber-200",
    accent: "bg-amber-400",
  },
  {
    card: "border-emerald-400/35 bg-emerald-400/[0.045]",
    badge: "border-emerald-300/30 bg-emerald-400/15 text-emerald-200",
    accent: "bg-emerald-400",
  },
  {
    card: "border-sky-400/35 bg-sky-400/[0.045]",
    badge: "border-sky-300/30 bg-sky-400/15 text-sky-200",
    accent: "bg-sky-400",
  },
  {
    card: "border-violet-400/35 bg-violet-400/[0.045]",
    badge: "border-violet-300/30 bg-violet-400/15 text-violet-200",
    accent: "bg-violet-400",
  },
  {
    card: "border-rose-400/35 bg-rose-400/[0.045]",
    badge: "border-rose-300/30 bg-rose-400/15 text-rose-200",
    accent: "bg-rose-400",
  },
  {
    card: "border-orange-400/35 bg-orange-400/[0.045]",
    badge: "border-orange-300/30 bg-orange-400/15 text-orange-200",
    accent: "bg-orange-400",
  },
] as const;

/** Messages de retour des Server Actions (via ?saved= / ?error=). */
const MESSAGES_SUCCES: Record<string, string> = {
  categorie: "Catégorie enregistrée.",
  "categorie-supprimee": "Catégorie supprimée.",
  plat: "Plat enregistré.",
  prix: "Prix mis à jour.",
  duplication: "Plat dupliqué — il est masqué tant que vous ne l'activez pas.",
};

const MESSAGES_ERREUR: Record<string, string> = {
  categorie: "Catégorie refusée : vérifiez le nom et la bannière.",
  prix: "Prix invalide.",
  "1": "Enregistrement refusé : vérifiez le nom, la description, le prix et la photo (elle doit venir de la médiathèque).",
};

export default async function AdminMenuPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string; plats?: string }>;
}) {
  const [{ categories, dishes }, params] = await Promise.all([
    getAdminMenuData(),
    searchParams,
  ]);

  const misEnAvant = dishes.filter((d) => d.featured).length;
  const erreur =
    params.error === "categorie-occupee"
      ? `Cette catégorie contient encore ${params.plats ?? ""} plat·s. Cochez « détacher les plats » pour la supprimer sans les perdre.`
      : params.error
        ? (MESSAGES_ERREUR[params.error] ?? "Enregistrement refusé.")
        : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-cream">Menu</h1>
        <p className="mt-1 text-sm text-muted">
          {dishes.length} plat·s · {categories.length} catégorie·s ·{" "}
          {misEnAvant} mis en avant sur l&apos;accueil
        </p>
      </div>

      {erreur && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {erreur}
        </p>
      )}
      {params.saved && MESSAGES_SUCCES[params.saved] && (
        <p className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-300">
          {MESSAGES_SUCCES[params.saved]}
        </p>
      )}

      {/* ─── Catégories ────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">
            Étape 1
          </p>
          <h2 className="mt-1 font-display text-xl font-semibold text-cream">
            Organiser les catégories
          </h2>
          <p className="mt-1 text-sm text-muted">
            Ouvrez uniquement la catégorie à modifier. Chaque couleur représente
            une catégorie différente.
          </p>
        </div>

        <div className="space-y-3">
          {categories.map((c, index) => {
            const style =
              CATEGORY_CARD_STYLES[index % CATEGORY_CARD_STYLES.length];
            const nombrePlats = dishes.filter(
              (dish) => dish.categoryId === c.id,
            ).length;
            return (
              <details
                key={c.id}
                open={index === 0}
                className={`group overflow-hidden rounded-2xl border ${style.card}`}
              >
                <summary className="relative flex cursor-pointer list-none items-center gap-3 p-4 pr-5 [&::-webkit-details-marker]:hidden">
                  <span
                    className={`absolute inset-y-0 left-0 w-1 ${style.accent}`}
                    aria-hidden
                  />
                  <span
                    className={`ml-1 rounded-full border px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.16em] ${style.badge}`}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-lg font-semibold text-cream">
                      {c.name}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted">
                      {nombrePlats} plat{nombrePlats > 1 ? "s" : ""} ·{" "}
                      {c.active ? "visible sur le site" : "masquée"}
                    </span>
                  </span>
                  <span className="hidden rounded-full border border-white/10 px-3 py-1 text-xs text-cream/60 sm:inline">
                    Modifier
                  </span>
                  <ChevronRight className="h-5 w-5 shrink-0 text-cream/50 transition group-open:rotate-90" />
                </summary>

                <div className="border-t border-white/10 bg-black/10 p-4">
                  <form
                    action={adminUpdateCategory}
                    className="grid gap-3 sm:grid-cols-2"
                  >
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="sortOrder" value={c.sortOrder} />
                    <input
                      name="name"
                      defaultValue={c.name}
                      required
                      className={inputClass}
                    />
                    <input
                      name="description"
                      defaultValue={c.description ?? ""}
                      placeholder="Accroche affichée sur la carte (optionnel)"
                      className={inputClass}
                    />
                    <MediaPicker
                      name="image"
                      label="Bannière de la catégorie"
                      defaultValue={c.image}
                      className="sm:col-span-2"
                    />
                    <label className="flex items-center gap-2 text-sm text-cream/80">
                      <input
                        type="checkbox"
                        name="active"
                        defaultChecked={c.active}
                        className="accent-gold"
                      />
                      Visible sur le site
                    </label>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <button type="submit" className={boutonPrimaire}>
                        Enregistrer
                      </button>
                    </div>
                  </form>

                  <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-white/10 pt-3">
                    <span className="mr-auto text-xs text-muted">
                      {c.slug} · {index + 1}
                      <sup>e</sup> position
                    </span>
                    <form action={adminMoveCategory}>
                      <input type="hidden" name="id" value={c.id} />
                      <input type="hidden" name="direction" value="up" />
                      <button
                        className={boutonDiscret}
                        disabled={index === 0}
                        title="Monter"
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                      </button>
                    </form>
                    <form action={adminMoveCategory}>
                      <input type="hidden" name="id" value={c.id} />
                      <input type="hidden" name="direction" value="down" />
                      <button
                        className={boutonDiscret}
                        disabled={index === categories.length - 1}
                        title="Descendre"
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </button>
                    </form>
                    <form
                      action={adminDeleteCategory}
                      className="flex items-center gap-2"
                    >
                      <input type="hidden" name="id" value={c.id} />
                      <label className="flex items-center gap-1 text-xs text-muted">
                        <input
                          type="checkbox"
                          name="detach"
                          className="accent-gold"
                        />
                        détacher les plats
                      </label>
                      <button className="text-xs text-red-400 transition hover:text-red-300">
                        Supprimer
                      </button>
                    </form>
                  </div>
                </div>
              </details>
            );
          })}
        </div>

        <details className="group overflow-hidden rounded-2xl border border-dashed border-gold/35 bg-gold/[0.035]">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 text-sm font-semibold text-gold [&::-webkit-details-marker]:hidden">
            <span>+ Créer une nouvelle catégorie</span>
            <ChevronRight className="h-5 w-5 transition group-open:rotate-90" />
          </summary>
          <form
            action={adminCreateCategory}
            className="grid gap-3 border-t border-gold/15 p-4 sm:grid-cols-2"
          >
            <input
              name="name"
              placeholder="Nouvelle catégorie"
              required
              className={inputClass}
            />
            <input
              name="description"
              placeholder="Accroche (optionnel)"
              className={inputClass}
            />
            <MediaPicker
              name="image"
              label="Bannière (optionnel)"
              className="sm:col-span-2"
            />
            <input type="hidden" name="active" value="on" />
            <input
              name="sortOrder"
              type="number"
              placeholder="Ordre"
              defaultValue={categories.length + 1}
              className={inputClass}
            />
            <div className="flex items-end justify-end">
              <button type="submit" className={boutonPrimaire}>
                Ajouter la catégorie
              </button>
            </div>
          </form>
        </details>
      </section>

      {/* ─── Ajout d'un plat ───────────────────────────────────────────── */}
      <section className="rounded-2xl border border-gold/25 bg-gold/[0.035] p-6">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">
          Étape 2
        </p>
        <h2 className="mt-1 font-display text-xl font-semibold text-cream">
          Ajouter un plat
        </h2>
        <p className="mt-1 text-sm text-muted">
          Renseignez les informations essentielles, puis ajustez les options
          plus tard dans la liste des plats.
        </p>
        <form
          action={adminCreateDish}
          className="mt-4 grid gap-3 sm:grid-cols-2"
        >
          <input
            name="name"
            placeholder="Nom"
            required
            className={inputClass}
          />
          <input
            name="price"
            type="number"
            step="0.5"
            placeholder="Prix (€)"
            required
            className={inputClass}
          />
          <MediaPicker
            name="image"
            label="Photo du plat"
            required
            className="sm:col-span-2"
          />
          <input
            name="description"
            placeholder="Description"
            required
            className={`${inputClass} sm:col-span-2`}
          />
          <select name="categoryId" className={inputClass} defaultValue="">
            <option value="">— Catégorie —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            name="tag"
            placeholder="Tag (optionnel)"
            className={inputClass}
          />
          <input
            name="sortOrder"
            type="number"
            placeholder="Ordre (0)"
            className={inputClass}
          />
          <input
            name="prepMinutes"
            type="number"
            placeholder="Prép. (min)"
            defaultValue={15}
            className={inputClass}
          />
          <input
            name="dailyStock"
            type="number"
            min={0}
            placeholder="Stock/jour (vide = illimité)"
            className={inputClass}
          />
          <label className="flex items-center gap-2 text-sm text-cream/80">
            <input
              type="checkbox"
              name="available"
              defaultChecked
              className="accent-gold"
            />
            Disponible
          </label>
          <label className="flex items-center gap-2 text-sm text-cream/80">
            <input type="checkbox" name="featured" className="accent-gold" />
            Mettre en avant
          </label>
          <div className="sm:col-span-2">
            <button type="submit" className="btn-primary">
              Ajouter le plat
            </button>
          </div>
        </form>
      </section>

      {/* ─── Liste éditable ────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">
            Étape 3
          </p>
          <h2 className="mt-1 font-display text-xl font-semibold text-cream">
            Modifier les plats ({dishes.length})
          </h2>
          <p className="mt-1 text-sm text-muted">
            Les plats sont repliés pour faciliter la lecture. Cliquez sur un
            plat pour afficher tous ses réglages.
          </p>
        </div>
        {dishes.map((d, index) => {
          const style =
            CATEGORY_CARD_STYLES[index % CATEGORY_CARD_STYLES.length];
          return (
            <details
              key={d.id}
              className={`group overflow-hidden rounded-2xl border ${style.card}`}
            >
              <summary className="relative flex cursor-pointer list-none items-center gap-3 p-4 pr-5 [&::-webkit-details-marker]:hidden">
                <span
                  className={`absolute inset-y-0 left-0 w-1 ${style.accent}`}
                  aria-hidden
                />
                <span
                  className={`ml-1 rounded-full border px-2 py-1 text-[0.68rem] font-bold ${style.badge}`}
                >
                  {formatPrice(d.price)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display text-base font-semibold text-cream">
                    {d.name}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-muted">
                    {d.category?.name ?? "Sans catégorie"} ·{" "}
                    {d.available ? "disponible" : "masqué"}
                    {d.featured ? " · mis en avant" : ""}
                  </span>
                </span>
                <ChevronRight className="h-5 w-5 shrink-0 text-cream/50 transition group-open:rotate-90" />
              </summary>

              <div className="border-t border-white/10 bg-black/10 p-5">
                {/* Prix en ligne : le geste le plus fréquent, isolé du reste. */}
                <div className="mb-3 flex flex-wrap items-center gap-3 border-b border-white/10 pb-3">
                  <span className="text-xs font-bold uppercase tracking-[0.16em] text-cream/55">
                    Modification rapide
                  </span>
                  <form
                    action={adminUpdateDishPrice}
                    className="flex items-center gap-1.5"
                  >
                    <input type="hidden" name="id" value={d.id} />
                    <input
                      name="price"
                      type="number"
                      step="0.1"
                      min={0}
                      defaultValue={d.price}
                      aria-label={`Prix de ${d.name}`}
                      className={`${miniInput} w-24`}
                    />
                    <button className={boutonDiscret}>€ Enregistrer</button>
                  </form>

                  <form action={adminToggleDishFeatured}>
                    <input type="hidden" name="id" value={d.id} />
                    <button
                      className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs transition ${
                        d.featured
                          ? "bg-gold/15 text-gold"
                          : "border border-white/10 text-muted hover:text-cream"
                      }`}
                      title="Afficher ce plat parmi les spécialités de l'accueil"
                    >
                      <Star
                        className={`h-3.5 w-3.5 ${d.featured ? "fill-gold" : ""}`}
                      />
                      {d.featured ? "Mis en avant" : "Mettre en avant"}
                    </button>
                  </form>

                  <div className="ml-auto flex items-center gap-2">
                    <form action={adminMoveDish}>
                      <input type="hidden" name="id" value={d.id} />
                      <input type="hidden" name="direction" value="up" />
                      <button
                        className={boutonDiscret}
                        disabled={index === 0}
                        title="Monter dans sa catégorie"
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                      </button>
                    </form>
                    <form action={adminMoveDish}>
                      <input type="hidden" name="id" value={d.id} />
                      <input type="hidden" name="direction" value="down" />
                      <button
                        className={boutonDiscret}
                        disabled={index === dishes.length - 1}
                        title="Descendre dans sa catégorie"
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </button>
                    </form>
                    <form action={adminDuplicateDish}>
                      <input type="hidden" name="id" value={d.id} />
                      <button
                        className={boutonDiscret}
                        title="Dupliquer ce plat"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </form>
                  </div>
                </div>

                <form
                  action={adminUpdateDish}
                  className="grid gap-3 sm:grid-cols-2"
                >
                  <input type="hidden" name="id" value={d.id} />
                  <input
                    name="name"
                    defaultValue={d.name}
                    className={inputClass}
                  />
                  <input
                    name="price"
                    type="number"
                    step="0.5"
                    defaultValue={d.price}
                    className={inputClass}
                  />
                  <MediaPicker
                    name="image"
                    label="Photo du plat"
                    defaultValue={d.image}
                    required
                    className="sm:col-span-2"
                  />
                  <input
                    name="description"
                    defaultValue={d.description}
                    className={`${inputClass} sm:col-span-2`}
                  />
                  <select
                    name="categoryId"
                    defaultValue={d.categoryId ?? ""}
                    className={inputClass}
                  >
                    <option value="">— Catégorie —</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <input
                    name="tag"
                    defaultValue={d.tag ?? ""}
                    placeholder="Tag"
                    className={inputClass}
                  />
                  <input
                    name="sortOrder"
                    type="number"
                    defaultValue={d.sortOrder}
                    className={inputClass}
                  />
                  <input
                    name="prepMinutes"
                    type="number"
                    defaultValue={d.prepMinutes}
                    className={inputClass}
                    title="Temps de préparation (min)"
                  />
                  <input
                    name="dailyStock"
                    type="number"
                    min={0}
                    defaultValue={d.dailyStock ?? ""}
                    placeholder="Stock/jour (illimité)"
                    className={inputClass}
                    title="Stock du jour (vide = illimité)"
                  />
                  <label className="flex items-center gap-2 text-sm text-cream/80">
                    <input
                      type="checkbox"
                      name="available"
                      defaultChecked={d.available}
                      className="accent-gold"
                    />
                    Disponible {d.available ? "" : "(masqué)"}
                  </label>
                  <label className="flex items-center gap-2 text-sm text-cream/80">
                    <input
                      type="checkbox"
                      name="featured"
                      defaultChecked={d.featured}
                      className="accent-gold"
                    />
                    Mis en avant
                  </label>
                  <div className="flex items-center gap-3 sm:col-span-2">
                    <button type="submit" className={boutonPrimaire}>
                      Enregistrer
                    </button>
                    <span className="text-xs text-muted">
                      slug : {d.slug} · {d.category?.name ?? "sans catégorie"} ·{" "}
                      {d.dailyStock == null
                        ? "stock illimité"
                        : `${remainingStock(d)} restant·s aujourd'hui`}
                    </span>
                  </div>
                </form>

                {/* Options du plat */}
                <details className="mt-3 rounded-xl border border-white/10 p-3">
                  <summary className="cursor-pointer text-sm text-cream/80">
                    Options ({d.optionGroups.length} groupe·s)
                  </summary>
                  <div className="mt-3 space-y-3">
                    {d.optionGroups.map((g) => (
                      <div
                        key={g.id}
                        className="rounded-lg border border-white/10 p-3"
                      >
                        <form
                          action={adminUpdateOptionGroup}
                          className="flex flex-wrap items-center gap-2"
                        >
                          <input type="hidden" name="id" value={g.id} />
                          <input
                            name="name"
                            defaultValue={g.name}
                            required
                            className={`${miniInput} min-w-[10rem] flex-1`}
                          />
                          <select
                            name="type"
                            defaultValue={g.type}
                            className={miniInput}
                          >
                            <option value="single">1 choix</option>
                            <option value="multi">plusieurs</option>
                          </select>
                          <label className="flex items-center gap-1 text-xs text-cream/70">
                            <input
                              type="checkbox"
                              name="required"
                              defaultChecked={g.required}
                              className="accent-gold"
                            />
                            obligatoire
                          </label>
                          <button className={boutonDiscret}>Enregistrer</button>
                        </form>

                        <ul className="mt-2 space-y-1.5">
                          {g.options.map((o) => (
                            <li key={o.id} className="flex flex-wrap gap-2">
                              <form
                                action={adminUpdateOption}
                                className="flex flex-1 flex-wrap items-center gap-2"
                              >
                                <input type="hidden" name="id" value={o.id} />
                                <input
                                  name="name"
                                  defaultValue={o.name}
                                  required
                                  className={`${miniInput} min-w-[8rem] flex-1`}
                                />
                                <input
                                  name="priceDelta"
                                  type="number"
                                  step="0.5"
                                  defaultValue={o.priceDelta}
                                  aria-label="Supplément"
                                  className={`${miniInput} w-20`}
                                />
                                <span className="text-xs text-gold">
                                  {o.priceDelta > 0
                                    ? `+ ${formatPrice(o.priceDelta)}`
                                    : "inclus"}
                                </span>
                                <button className={boutonDiscret}>OK</button>
                              </form>
                              <form action={adminDeleteOption}>
                                <input type="hidden" name="id" value={o.id} />
                                <button
                                  className="p-1 text-red-400 transition hover:text-red-300"
                                  title="Supprimer cette option"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </form>
                            </li>
                          ))}
                        </ul>

                        <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-white/10 pt-2">
                          <form
                            action={adminAddOption}
                            className="flex flex-wrap gap-2"
                          >
                            <input type="hidden" name="groupId" value={g.id} />
                            <input
                              name="name"
                              placeholder="Nouvelle option"
                              required
                              className={miniInput}
                            />
                            <input
                              name="priceDelta"
                              type="number"
                              step="0.5"
                              placeholder="+€"
                              className={`${miniInput} w-20`}
                            />
                            <button className={boutonDiscret}>+ option</button>
                          </form>
                          <form
                            action={adminDeleteOptionGroup}
                            className="ml-auto"
                          >
                            <input type="hidden" name="id" value={g.id} />
                            <button className="text-xs text-red-400 hover:text-red-300">
                              Supprimer le groupe
                            </button>
                          </form>
                        </div>
                      </div>
                    ))}

                    <form
                      action={adminAddOptionGroup}
                      className="flex flex-wrap items-center gap-2"
                    >
                      <input type="hidden" name="dishId" value={d.id} />
                      <input
                        name="name"
                        placeholder="Nouveau groupe"
                        required
                        className={miniInput}
                      />
                      <select name="type" className={miniInput}>
                        <option value="single">1 choix</option>
                        <option value="multi">plusieurs</option>
                      </select>
                      <label className="flex items-center gap-1 text-xs text-cream/70">
                        <input
                          type="checkbox"
                          name="required"
                          className="accent-gold"
                        />{" "}
                        obligatoire
                      </label>
                      <button className={boutonDiscret}>+ groupe</button>
                    </form>
                  </div>
                </details>

                <form action={adminDeleteDish} className="mt-2">
                  <input type="hidden" name="id" value={d.id} />
                  <button
                    type="submit"
                    className="text-xs text-red-400 transition hover:text-red-300"
                  >
                    Supprimer ce plat
                  </button>
                </form>
              </div>
            </details>
          );
        })}
      </section>
    </div>
  );
}
