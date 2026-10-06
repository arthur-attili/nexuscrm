/**
 * Extrai os campos `cf__<type>__<field_name>` do FormData e monta o
 * objeto `custom_values` esperado pelo backend.
 *
 * - multiselect: pega todos os valores do mesmo name (array)
 * - checkbox: "true" se enviado como "true", senão false
 * - outros: primeiro valor não vazio
 */
export function parseCustomValues(
    formData: FormData,
): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    for (const key of formData.keys()) {
        if (!key.startsWith("cf__")) continue;

        const parts = key.split("__");
        if (parts.length < 3) continue;

        const fieldType = parts[1];
        const fieldName = parts.slice(2).join("__");

        if (fieldType == "multiselect") {
            const values = formData.getAll(key).map((v) => String(v));
            if (values.length > 0) result[fieldName] = values;
        } else if (fieldType === "checkbox") {
            const values = formData.getAll(key).map((v) => String(v));
            result[fieldName] = values.includes("true");
        } else {
            const value = formData.get(key);
            if (value !== null && String(value).trim() !== "") {
                result[fieldName] = String(value);
            }
        }
    }

    return result;
}