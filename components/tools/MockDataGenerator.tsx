"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { faker } from "@faker-js/faker";
import { Button } from "@/components/ui/button";

interface MockDataGeneratorProps {
  t: Record<string, unknown>;
}

interface FieldConfig {
  id: string;
  name: string;
  type: string;
}

const FIELD_TYPES = [
  "firstName",
  "lastName",
  "fullName",
  "email",
  "phone",
  "address",
  "city",
  "country",
  "zipCode",
  "company",
  "jobTitle",
  "uuid",
  "integer",
  "float",
  "boolean",
  "date",
  "url",
  "ipAddress",
  "color",
  "paragraph",
] as const;

type FieldType = (typeof FIELD_TYPES)[number];

function generateValue(type: FieldType): string {
  switch (type) {
    case "firstName":
      return faker.person.firstName();
    case "lastName":
      return faker.person.lastName();
    case "fullName":
      return faker.person.fullName();
    case "email":
      return faker.internet.email();
    case "phone":
      return faker.phone.number();
    case "address":
      return faker.location.streetAddress();
    case "city":
      return faker.location.city();
    case "country":
      return faker.location.country();
    case "zipCode":
      return faker.location.zipCode();
    case "company":
      return faker.company.name();
    case "jobTitle":
      return faker.person.jobTitle();
    case "uuid":
      return faker.string.uuid();
    case "integer":
      return String(faker.number.int({ min: 0, max: 10000 }));
    case "float":
      return String(faker.number.float({ min: 0, max: 1000, fractionDigits: 2 }));
    case "boolean":
      return String(faker.datatype.boolean());
    case "date":
      return faker.date.past().toISOString().split("T")[0];
    case "url":
      return faker.internet.url();
    case "ipAddress":
      return faker.internet.ip();
    case "color":
      return faker.color.rgb();
    case "paragraph":
      return faker.lorem.paragraph();
    default:
      return "";
  }
}

function escapeCsvField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export default function MockDataGenerator({ t }: MockDataGeneratorProps) {
  const common = t.common as Record<string, string>;
  const toolT = (t.tools as Record<string, Record<string, unknown>>)[
    "mock-data-generator"
  ];
  const types = toolT.types as Record<string, string>;

  const [fields, setFields] = useState<FieldConfig[]>([
    { id: crypto.randomUUID(), name: "fullName", type: "fullName" },
    { id: crypto.randomUUID(), name: "email", type: "email" },
    { id: crypto.randomUUID(), name: "company", type: "company" },
  ]);
  const [rowCount, setRowCount] = useState(10);
  const [generatedData, setGeneratedData] = useState<
    Record<string, string>[]
  >([]);

  // Track which field's type dropdown is open
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (openDropdownId) {
        const ref = dropdownRefs.current[openDropdownId];
        if (ref && !ref.contains(e.target as Node)) {
          setOpenDropdownId(null);
        }
      }
    }
    if (openDropdownId) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [openDropdownId]);

  const handleAddField = useCallback(() => {
    setFields((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: "", type: "firstName" },
    ]);
  }, []);

  const handleRemoveField = useCallback((id: string) => {
    setFields((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const handleFieldNameChange = useCallback((id: string, name: string) => {
    setFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, name } : f))
    );
  }, []);

  const handleFieldTypeChange = useCallback((id: string, type: string) => {
    setFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, type } : f))
    );
    setOpenDropdownId(null);
  }, []);

  const handleGenerate = useCallback(() => {
    const rows: Record<string, string>[] = [];
    for (let i = 0; i < rowCount; i++) {
      const row: Record<string, string> = {};
      for (const field of fields) {
        const key = field.name || field.type;
        row[key] = generateValue(field.type as FieldType);
      }
      rows.push(row);
    }
    setGeneratedData(rows);
  }, [fields, rowCount]);

  const handleExportJson = useCallback(() => {
    const json = JSON.stringify(generatedData, null, 2);
    const blob = new Blob([json], { type: "application/json;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "mock-data.json";
    link.click();
    URL.revokeObjectURL(url);
  }, [generatedData]);

  const handleExportCsv = useCallback(() => {
    if (generatedData.length === 0) return;
    const headers = Object.keys(generatedData[0]);
    const csvRows = [
      headers.map(escapeCsvField).join(","),
      ...generatedData.map((row) =>
        headers.map((h) => escapeCsvField(row[h] ?? "")).join(",")
      ),
    ];
    const csv = csvRows.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "mock-data.csv";
    link.click();
    URL.revokeObjectURL(url);
  }, [generatedData]);

  const columnKeys =
    generatedData.length > 0 ? Object.keys(generatedData[0]) : [];

  return (
    <div className="space-y-6">
      {/* Field configuration */}
      <div className="space-y-3">
        <label className="text-sm font-medium">
          {toolT.fieldsLabel as string}
        </label>

        <div className="space-y-2">
          {fields.map((field) => (
            <div
              key={field.id}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
            >
              {/* Field name input */}
              <input
                type="text"
                value={field.name}
                onChange={(e) =>
                  handleFieldNameChange(field.id, e.target.value)
                }
                placeholder={toolT.fieldNamePlaceholder as string}
                className="flex-1 h-9 px-3 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                spellCheck={false}
              />

              {/* Custom type dropdown */}
              <div
                className="relative"
                ref={(el) => {
                  dropdownRefs.current[field.id] = el;
                }}
              >
                <button
                  type="button"
                  onClick={() =>
                    setOpenDropdownId((prev) =>
                      prev === field.id ? null : field.id
                    )
                  }
                  className="inline-flex items-center gap-1 h-9 px-3 w-full sm:w-[180px] rounded-md border border-input bg-background text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="flex-1 text-left truncate">
                    {types[field.type] || field.type}
                  </span>
                  <svg
                    className="size-3.5 text-muted-foreground shrink-0"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>

                {openDropdownId === field.id && (
                  <div className="absolute top-full left-0 mt-1 z-50 w-full sm:w-[220px] max-h-[240px] overflow-y-auto rounded-md border border-border bg-background shadow-md">
                    {FIELD_TYPES.map((ft) => (
                      <button
                        key={ft}
                        type="button"
                        onClick={() => handleFieldTypeChange(field.id, ft)}
                        className={`w-full text-left px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground transition-colors ${
                          field.type === ft
                            ? "bg-accent/50 font-medium"
                            : ""
                        }`}
                      >
                        {types[ft] || ft}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Remove field button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveField(field.id)}
                disabled={fields.length <= 1}
                className="shrink-0 self-center"
                aria-label={toolT.removeField as string}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="size-4"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z"
                    clipRule="evenodd"
                  />
                </svg>
              </Button>
            </div>
          ))}
        </div>

        <Button variant="outline" size="sm" onClick={handleAddField}>
          {toolT.addField as string}
        </Button>
      </div>

      {/* Row count */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          {toolT.rowCountLabel as string}
        </label>
        <input
          type="number"
          min={1}
          max={1000}
          value={rowCount}
          onChange={(e) => {
            const val = parseInt(e.target.value, 10);
            if (!isNaN(val)) {
              setRowCount(Math.max(1, Math.min(1000, val)));
            }
          }}
          className="h-9 w-32 px-3 rounded-md border border-border bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        />
      </div>

      {/* Generate button */}
      <div>
        <Button onClick={handleGenerate}>
          {toolT.generate as string}
        </Button>
      </div>

      {/* Generated data preview */}
      {generatedData.length > 0 && (
        <>
          {/* Stats and export buttons */}
          <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 border border-border rounded-lg px-3 py-2 bg-muted/30">
            <span className="text-sm text-muted-foreground">
              {generatedData.length} {toolT.rowsGenerated as string}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleExportJson}
              >
                {toolT.exportJson as string}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleExportCsv}
              >
                {toolT.exportCsv as string}
              </Button>
            </div>
          </div>

          {/* Data table */}
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="sticky top-0 bg-muted/50 border-b border-border">
                    {columnKeys.map((key, i) => (
                      <th
                        key={i}
                        className="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap"
                      >
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {generatedData.map((row, rowIndex) => (
                    <tr
                      key={rowIndex}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      {columnKeys.map((key, colIndex) => (
                        <td
                          key={colIndex}
                          className="px-3 py-1.5 whitespace-nowrap font-mono text-sm max-w-[200px] sm:max-w-none truncate"
                        >
                          {row[key] ?? ""}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
