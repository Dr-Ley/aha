"use client";

import { useEffect, useMemo, useState } from "react";

type TypeaheadOption = {
  id: string;
  label: string;
  description?: string | null;
};

type TypeaheadCreateSelectProps = {
  value: string;
  options: TypeaheadOption[];
  placeholder?: string;
  createLabel?: string;
  inputStyle?: React.CSSProperties;
  onSelect: (id: string) => void;
  onCreate: (label: string) => Promise<TypeaheadOption | null>;
};

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export function TypeaheadCreateSelect({
  value,
  options,
  placeholder = "Search...",
  createLabel = "Create",
  inputStyle,
  onSelect,
  onCreate,
}: TypeaheadCreateSelectProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const selected = options.find((o) => o.id === value);
    if (selected) setQuery(selected.label);
  }, [options, value]);

  const filtered = useMemo(() => {
    const q = normalize(query);
    if (!q) return options.slice(0, 20);
    return options.filter((o) => normalize(o.label).includes(q)).slice(0, 20);
  }, [options, query]);

  const exactMatch = useMemo(() => {
    const q = normalize(query);
    return q.length > 0 && options.some((o) => normalize(o.label) === q);
  }, [options, query]);

  async function createCurrent() {
    const label = query.trim();
    if (!label || creating) return;
    setCreating(true);
    try {
      const created = await onCreate(label);
      if (created) {
        onSelect(created.id);
        setQuery(created.label);
        setOpen(false);
      }
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="relative">
      <input
        className="input input-bordered input-sm w-full"
        style={inputStyle}
        value={query}
        placeholder={placeholder}
        autoComplete="off"
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        onChange={(e) => {
          setQuery(e.target.value);
          onSelect("");
          setOpen(true);
        }}
      />
      {open ? (
        <div className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-box border border-base-content/10 bg-base-100 p-1 shadow-lg">
          {filtered.map((option) => (
            <button
              key={option.id}
              type="button"
              className="block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-base-200"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onSelect(option.id);
                setQuery(option.label);
                setOpen(false);
              }}
            >
              <span className="block font-medium">{option.label}</span>
              {option.description ? (
                <span className="block text-xs text-base-content/50">{option.description}</span>
              ) : null}
            </button>
          ))}
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm text-base-content/50">No matches</div>
          ) : null}
          {query.trim() && !exactMatch ? (
            <button
              type="button"
              className="mt-1 block w-full rounded-md border border-dashed border-primary/40 px-3 py-2 text-left text-sm font-medium text-primary hover:bg-primary/10"
              disabled={creating}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => void createCurrent()}
            >
              {creating ? "Creating..." : `${createLabel} "${query.trim()}"`}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
