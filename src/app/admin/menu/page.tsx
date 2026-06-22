import { getAdminMenuData } from "@/lib/dishes";
import {
  adminCreateDish,
  adminUpdateDish,
  adminDeleteDish,
  adminCreateCategory,
  adminAddOptionGroup,
  adminAddOption,
  adminDeleteOptionGroup,
} from "@/app/actions";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

const inputClass =
  "w-full rounded-lg border border-white/10 bg-ink px-3 py-2 text-sm text-cream placeholder:text-muted focus:border-gold/60 focus:outline-none";

export default async function AdminMenuPage() {
  const { categories, dishes } = await getAdminMenuData();

  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl font-bold text-cream">Menu</h1>

      {/* Catégories */}
      <section className="rounded-2xl border border-white/10 bg-ink-soft p-6">
        <h2 className="font-display text-lg font-semibold text-cream">
          Catégories
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {categories.map((c) => (
            <span
              key={c.id}
              className="rounded-full bg-white/10 px-3 py-1 text-sm text-cream"
            >
              {c.name}
            </span>
          ))}
        </div>
        <form
          action={adminCreateCategory}
          className="mt-4 flex flex-wrap gap-2"
        >
          <input
            name="name"
            placeholder="Nouvelle catégorie"
            required
            className={`${inputClass} max-w-xs`}
          />
          <input
            name="sortOrder"
            type="number"
            placeholder="Ordre"
            className="w-24 rounded-lg border border-white/10 bg-ink px-3 py-2 text-sm text-cream focus:border-gold/60 focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-ink transition hover:bg-gold-400"
          >
            Ajouter
          </button>
        </form>
      </section>

      {/* Ajout d'un plat */}
      <section className="rounded-2xl border border-white/10 bg-ink-soft p-6">
        <h2 className="font-display text-lg font-semibold text-cream">
          Ajouter un plat
        </h2>
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
          <input
            name="image"
            placeholder="Image (/images/…)"
            required
            className={`${inputClass} sm:col-span-2`}
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
          <label className="flex items-center gap-2 text-sm text-cream/80">
            <input
              type="checkbox"
              name="available"
              defaultChecked
              className="accent-gold"
            />
            Disponible
          </label>
          <div className="sm:col-span-2">
            <button type="submit" className="btn-primary">
              Ajouter le plat
            </button>
          </div>
        </form>
      </section>

      {/* Liste éditable */}
      <section className="space-y-4">
        <h2 className="font-display text-lg font-semibold text-cream">
          Plats ({dishes.length})
        </h2>
        {dishes.map((d) => (
          <div
            key={d.id}
            className="rounded-2xl border border-white/10 bg-ink-soft p-5"
          >
            <form
              action={adminUpdateDish}
              className="grid gap-3 sm:grid-cols-2"
            >
              <input type="hidden" name="id" value={d.id} />
              <input name="name" defaultValue={d.name} className={inputClass} />
              <input
                name="price"
                type="number"
                step="0.5"
                defaultValue={d.price}
                className={inputClass}
              />
              <input
                name="image"
                defaultValue={d.image}
                className={`${inputClass} sm:col-span-2`}
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
              <label className="flex items-center gap-2 text-sm text-cream/80">
                <input
                  type="checkbox"
                  name="available"
                  defaultChecked={d.available}
                  className="accent-gold"
                />
                Disponible {d.available ? "" : "(masqué)"}
              </label>
              <div className="flex items-center gap-3 sm:col-span-2">
                <button
                  type="submit"
                  className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-ink transition hover:bg-gold-400"
                >
                  Enregistrer
                </button>
                <span className="text-xs text-muted">
                  slug : {d.slug} · {d.category?.name ?? "sans catégorie"}
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
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-cream">
                        {g.name}{" "}
                        <span className="text-xs text-muted">
                          ({g.type === "multi" ? "plusieurs" : "1 choix"}
                          {g.required ? ", obligatoire" : ""})
                        </span>
                      </span>
                      <form action={adminDeleteOptionGroup}>
                        <input type="hidden" name="id" value={g.id} />
                        <button className="text-xs text-red-400 hover:text-red-300">
                          Suppr. groupe
                        </button>
                      </form>
                    </div>
                    <ul className="mt-2 space-y-1 text-sm text-cream/80">
                      {g.options.map((o) => (
                        <li key={o.id} className="flex justify-between">
                          <span>{o.name}</span>
                          {o.priceDelta > 0 && (
                            <span className="text-gold">
                              + {formatPrice(o.priceDelta)}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                    <form
                      action={adminAddOption}
                      className="mt-2 flex flex-wrap gap-2"
                    >
                      <input type="hidden" name="groupId" value={g.id} />
                      <input
                        name="name"
                        placeholder="Option"
                        required
                        className="rounded border border-white/10 bg-ink px-2 py-1 text-xs text-cream"
                      />
                      <input
                        name="priceDelta"
                        type="number"
                        step="0.5"
                        placeholder="+€"
                        className="w-20 rounded border border-white/10 bg-ink px-2 py-1 text-xs text-cream"
                      />
                      <button className="rounded bg-white/10 px-3 py-1 text-xs text-cream hover:bg-white/20">
                        + option
                      </button>
                    </form>
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
                    className="rounded border border-white/10 bg-ink px-2 py-1 text-xs text-cream"
                  />
                  <select
                    name="type"
                    className="rounded border border-white/10 bg-ink px-2 py-1 text-xs text-cream"
                  >
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
                  <button className="rounded bg-white/10 px-3 py-1 text-xs text-cream hover:bg-white/20">
                    + groupe
                  </button>
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
        ))}
      </section>
    </div>
  );
}
