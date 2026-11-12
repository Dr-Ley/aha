"use client";

import { useEffect, useMemo, useState } from "react";
import { compressImage } from "@/lib/compress-image";
import { imageSrc, MAX_PRODUCT_IMAGES } from "@/lib/shop-images";
import type { ProductRecord } from "@/lib/shop-db";

const empty = { name: "", category: "", price: "", tag: "", description: "" };

export function CatalogEditor({ shopName, products }: { shopName: string; products: ProductRecord[] }) {
  const [rows, setRows] = useState(products);
  const [draft, setDraft] = useState(empty);
  const [kept, setKept] = useState<string[]>([]);
  const [pending, setPending] = useState<File[]>([]);
  const [editing, setEditing] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const previews = useMemo(() => pending.map((file) => URL.createObjectURL(file)), [pending]);

  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

  function addFiles(files: FileList | null) {
    const next = [...(files ?? [])].filter((file) => file.type.startsWith("image/"));
    setPending((current) => [...current, ...next].slice(0, MAX_PRODUCT_IMAGES - kept.length));
  }

  function resetForm(form: HTMLFormElement) {
    setEditing(null);
    setDraft(empty);
    setKept([]);
    setPending([]);
    setError("");
    form.reset();
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (kept.length + pending.length < 1) {
      setError("Add at least one image.");
      return;
    }
    const form = event.currentTarget;
    const fields = new FormData(form);
    setSaving(true);
    setError("");
    let uploaded: string[] = [];
    try {
      if (pending.length > 0) {
        const body = new FormData();
        for (const file of pending) body.append("files", await compressImage(file));
        const response = await fetch("/api/shop/images", { method: "POST", body });
        const data = (await response.json()) as { keys?: string[]; error?: string };
        if (!response.ok || !data.keys) throw new Error(data.error ?? "Could not store the images.");
        uploaded = data.keys;
      }
      const payload = {
        name: String(fields.get("name") ?? ""),
        category: String(fields.get("category") ?? ""),
        price: Number(fields.get("price")),
        images: [...kept, ...uploaded],
        tag: String(fields.get("tag") ?? "") || null,
        description: String(fields.get("description") ?? ""),
      };
      const response = await fetch(editing ? `/api/shop/products/${editing}` : "/api/shop/products", {
        method: editing ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as { product?: ProductRecord; error?: string };
      if (!response.ok || !data.product) {
        if (uploaded.length > 0) {
          await fetch("/api/shop/images", {
            method: "DELETE",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ keys: uploaded }),
          });
        }
        setError(data.error ?? "Could not save the product.");
        return;
      }
      const product = data.product;
      setRows((current) => (editing ? current.map((row) => (row.id === product.id ? product : row)) : [...current, product]));
      resetForm(form);
    } catch (caught) {
      if (uploaded.length > 0) {
        await fetch("/api/shop/images", {
          method: "DELETE",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ keys: uploaded }),
        });
      }
      setError(caught instanceof Error ? caught.message : "Could not save the product.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    const response = await fetch(`/api/shop/products/${id}`, { method: "DELETE" });
    if (!response.ok) {
      setError("Could not delete the product.");
      return;
    }
    setRows((current) => current.filter((row) => row.id !== id));
    if (editing === id) {
      setEditing(null);
      setDraft(empty);
      setKept([]);
      setPending([]);
    }
  }

  return (
    <section className="catalog">
      <p className="eyebrow">{shopName}</p>
      <h1>Catalog</h1>
      <a className="text-link" href="/shop">Back to the shop</a>
      <form onSubmit={save}>
        {error ? <p className="form-error">{error}</p> : null}
        <label>Name<input name="name" required defaultValue={draft.name} key={`name-${editing ?? "new"}`} /></label>
        <label>Category<input name="category" required defaultValue={draft.category} key={`category-${editing ?? "new"}`} /></label>
        <label>Price<input name="price" type="number" min={1} required defaultValue={draft.price} key={`price-${editing ?? "new"}`} /></label>
        <label>
          Images
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={(event) => {
              addFiles(event.currentTarget.files);
              event.currentTarget.value = "";
            }}
          />
        </label>
        {kept.length + pending.length > 0 ? (
          <div className="image-picks">
            {kept.map((key) => (
              <figure key={key}>
                <img src={imageSrc(key)} alt="" />
                <button type="button" onClick={() => setKept((current) => current.filter((item) => item !== key))}>Remove</button>
              </figure>
            ))}
            {pending.map((file, index) => (
              <figure key={previews[index]}>
                <img src={previews[index]} alt="" />
                <button type="button" onClick={() => setPending((current) => current.filter((_, item) => item !== index))}>Remove</button>
              </figure>
            ))}
          </div>
        ) : null}
        <label>Tag<input name="tag" defaultValue={draft.tag} key={`tag-${editing ?? "new"}`} /></label>
        <label>Description<textarea name="description" required defaultValue={draft.description} key={`description-${editing ?? "new"}`} /></label>
        <button className="dark-button" type="submit" disabled={saving}>{editing ? "Update product" : "Add product"}</button>
      </form>
      <ul>
        {rows.map((product) => (
          <li key={product.id}>
            <strong>{product.name}</strong>
            <span>{product.category} · KSh {product.price.toLocaleString("en-KE")} · {product.images.length} {product.images.length === 1 ? "image" : "images"}</span>
            <div className="catalog-actions">
              <button
                type="button"
                className="back-link"
                onClick={() => {
                  setEditing(product.id);
                  setDraft({
                    name: product.name,
                    category: product.category,
                    price: String(product.price),
                    tag: product.tag ?? "",
                    description: product.description,
                  });
                  setKept(product.images);
                  setPending([]);
                  setError("");
                }}
              >
                Edit
              </button>
              <button type="button" className="back-link" onClick={() => remove(product.id)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
