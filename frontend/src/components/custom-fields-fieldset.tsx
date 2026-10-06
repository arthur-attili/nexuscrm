"use client";

import type { CustomField } from "@/lib/api/types";

type Props = {
  fields: CustomField[];
  initialValues?: Record<string, unknown>;
};

export function CustomFieldsFieldset({ fields, initialValues = {} }: Props) {
  if (fields.length === 0) return null;

  return (
    <div className="space-y-4 border-t border-zinc-800 pt-4">
      <p className="text-xs uppercase tracking-wider text-zinc-500 font-medium">
        Campos personalizados
      </p>

      {fields.map((field) => (
        <FieldRenderer
          key={field.id}
          field={field}
          initialValue={initialValues[field.name]}
        />
      ))}
    </div>
  );
}

function FieldRenderer({
  field,
  initialValue,
}: {
  field: CustomField;
  initialValue: unknown;
}) {
  switch (field.type) {
    case "text":
      return <TextField field={field} initialValue={initialValue} />;
    case "number":
      return <NumberField field={field} initialValue={initialValue} />;
    case "date":
      return <DateField field={field} initialValue={initialValue} />;
    case "url":
      return <UrlField field={field} initialValue={initialValue} />;
    case "checkbox":
      return <CheckboxField field={field} initialValue={initialValue} />;
    case "select":
      return <SelectField field={field} initialValue={initialValue} />;
    case "multiselect":
      return <MultiSelectField field={field} initialValue={initialValue} />;
    default:
      return null;
  }
}

// ============================================================
// Helpers de conversão de valor inicial
// ============================================================

function toStr(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v);
}

function toBool(v: unknown): boolean {
  return v === true || v === "true" || v === 1 || v === "1";
}

function toStrArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => String(x));
  return [];
}

// ============================================================
// Subcomponentes por tipo
// ============================================================

function TextField({
  field,
  initialValue,
}: {
  field: CustomField;
  initialValue: unknown;
}) {
  return (
    <div>
      <FieldLabel field={field} />
      <input
        type="text"
        name={`cf__text__${field.name}`}
        required={field.is_required}
        maxLength={500}
        defaultValue={toStr(initialValue)}
        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
      />
    </div>
  );
}

function NumberField({
  field,
  initialValue,
}: {
  field: CustomField;
  initialValue: unknown;
}) {
  return (
    <div>
      <FieldLabel field={field} />
      <input
        type="number"
        step="any"
        name={`cf__number__${field.name}`}
        required={field.is_required}
        defaultValue={toStr(initialValue)}
        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
      />
    </div>
  );
}

function DateField({
  field,
  initialValue,
}: {
  field: CustomField;
  initialValue: unknown;
}) {
  return (
    <div>
      <FieldLabel field={field} />
      <input
        type="date"
        name={`cf__date__${field.name}`}
        required={field.is_required}
        defaultValue={toStr(initialValue)}
        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
      />
    </div>
  );
}

function UrlField({
  field,
  initialValue,
}: {
  field: CustomField;
  initialValue: unknown;
}) {
  return (
    <div>
      <FieldLabel field={field} />
      <input
        type="url"
        name={`cf__url__${field.name}`}
        required={field.is_required}
        placeholder="https://..."
        defaultValue={toStr(initialValue)}
        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
      />
    </div>
  );
}

function CheckboxField({
  field,
  initialValue,
}: {
  field: CustomField;
  initialValue: unknown;
}) {
  return (
    <div>
      <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
        <input
          type="checkbox"
          name={`cf__checkbox__${field.name}`}
          value="true"
          defaultChecked={toBool(initialValue)}
          className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
        />
        <span>
          {field.name}
          {field.is_required && (
            <span className="text-red-400 ml-1">*</span>
          )}
        </span>
      </label>
    </div>
  );
}

function SelectField({
  field,
  initialValue,
}: {
  field: CustomField;
  initialValue: unknown;
}) {
  const options = (field.options ?? []) as Array<
    string | { value: string; label?: string }
  >;
  const current = toStr(initialValue);

  return (
    <div>
      <FieldLabel field={field} />
      <select
        name={`cf__select__${field.name}`}
        required={field.is_required}
        defaultValue={current}
        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
      >
        <option value="">Selecione...</option>
        {options.map((opt, idx) => {
          const value = typeof opt === "string" ? opt : opt.value;
          const label =
            typeof opt === "string" ? opt : opt.label ?? opt.value;
          return (
            <option key={`${value}-${idx}`} value={value}>
              {label}
            </option>
          );
        })}
      </select>
    </div>
  );
}

function MultiSelectField({
  field,
  initialValue,
}: {
  field: CustomField;
  initialValue: unknown;
}) {
  const options = (field.options ?? []) as Array<
    string | { value: string; label?: string }
  >;
  const selected = toStrArray(initialValue);

  return (
    <div>
      <FieldLabel field={field} />
      <div className="space-y-1.5 mt-1">
        {options.map((opt, idx) => {
          const value = typeof opt === "string" ? opt : opt.value;
          const label =
            typeof opt === "string" ? opt : opt.label ?? opt.value;
          return (
            <label
              key={`${value}-${idx}`}
              className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer"
            >
              <input
                type="checkbox"
                name={`cf__multiselect__${field.name}`}
                value={value}
                defaultChecked={selected.includes(value)}
                className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
              />
              <span>{label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

function FieldLabel({ field }: { field: CustomField }) {
  return (
    <label
      htmlFor={`cf__${field.name}`}
      className="block text-sm font-medium text-zinc-300 mb-1.5"
    >
      {field.name}
      {field.is_required && <span className="text-red-400 ml-1">*</span>}
    </label>
  );
}