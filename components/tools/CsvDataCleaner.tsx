"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SegmentedControl } from "@/components/ui/segmented-control";

interface CsvDataCleanerProps {
  t: Record<string, unknown>;
}

export default function CsvDataCleaner({ t }: CsvDataCleanerProps) {
  const common = t.common as Record<string, string>;
  const toolT = (t.tools as Record<string, Record<string, string>>)[
    "csv-data-cleaner"
  ];

  const [rawInput, setRawInput] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [data, setData] = useState<string[][]>([]);
  const [message, setMessage] = useState("");

  // Sort state
  const [sortColumn, setSortColumn] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Custom dropdown state
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [dropdownOpen]);

  const handleParse = useCallback(() => {
    if (!rawInput.trim()) {
      setHeaders([]);
      setData([]);
      setMessage("");
      return;
    }

    const result = Papa.parse<string[]>(rawInput.trim(), {
      header: false,
      skipEmptyLines: true,
    });

    if (result.data.length === 0) {
      setHeaders([]);
      setData([]);
      setMessage("");
      return;
    }

    const parsedHeaders = result.data[0];
    const parsedRows = result.data.slice(1);

    setHeaders(parsedHeaders);
    setData(parsedRows);
    setSortColumn("");
    setSortDirection("asc");
    setMessage("");
  }, [rawInput]);

  const handleRemoveDuplicates = useCallback(() => {
    const seen = new Set<string>();
    const unique: string[][] = [];
    let duplicateCount = 0;

    for (const row of data) {
      const key = row.join("\x00");
      if (seen.has(key)) {
        duplicateCount++;
      } else {
        seen.add(key);
        unique.push(row);
      }
    }

    setData(unique);
    if (duplicateCount > 0) {
      setMessage(
        `${duplicateCount} ${toolT.duplicatesRemoved}`
      );
    } else {
      setMessage(toolT.duplicatesFound);
    }
  }, [data, toolT]);

  const handleSort = useCallback(
    (column: string, direction: "asc" | "desc") => {
      const colIndex = headers.indexOf(column);
      if (colIndex === -1) return;

      const sorted = [...data].sort((a, b) => {
        const valA = a[colIndex] ?? "";
        const valB = b[colIndex] ?? "";

        // Try numeric comparison
        const numA = Number(valA);
        const numB = Number(valB);
        if (!isNaN(numA) && !isNaN(numB) && valA !== "" && valB !== "") {
          return direction === "asc" ? numA - numB : numB - numA;
        }

        // Fall back to string comparison
        const cmp = valA.localeCompare(valB);
        return direction === "asc" ? cmp : -cmp;
      });

      setData(sorted);
      setMessage("");
    },
    [data, headers]
  );

  const handleColumnSelect = useCallback(
    (column: string) => {
      setSortColumn(column);
      setDropdownOpen(false);
      handleSort(column, sortDirection);
    },
    [sortDirection, handleSort]
  );

  const handleDirectionChange = useCallback(
    (direction: "asc" | "desc") => {
      setSortDirection(direction);
      if (sortColumn) {
        handleSort(sortColumn, direction);
      }
    },
    [sortColumn, handleSort]
  );

  const handleDownloadCsv = useCallback(() => {
    const csvContent = Papa.unparse({
      fields: headers,
      data: data,
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "cleaned-data.csv";
    link.click();
    URL.revokeObjectURL(url);
  }, [headers, data]);

  const sortOptions = [
    { label: toolT.ascending, value: "asc" as const },
    { label: toolT.descending, value: "desc" as const },
  ];

  const hasData = headers.length > 0 && data.length > 0;

  return (
    <div className="space-y-4">
      {/* Input textarea */}
      <div className="space-y-2">
        <Textarea
          value={rawInput}
          onChange={(e) => setRawInput(e.target.value)}
          placeholder={toolT.inputPlaceholder}
          className="font-mono text-sm min-h-[200px] resize-y"
          spellCheck={false}
        />
      </div>

      {/* Parse button */}
      <div className="flex items-center gap-3">
        <Button onClick={handleParse} size="sm">
          {toolT.parseData}
        </Button>
      </div>

      {/* Message */}
      {message && (
        <div className="text-sm px-3 py-1.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400">
          {message}
        </div>
      )}

      {/* Data display */}
      {hasData ? (
        <>
          {/* Stats */}
          <div className="text-sm text-muted-foreground">
            {data.length} {toolT.rows}, {headers.length} {toolT.columns}
          </div>

          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3 border border-border rounded-lg px-3 py-2 bg-muted/30">
            <Button onClick={handleRemoveDuplicates} variant="secondary" size="sm">
              {toolT.removeDuplicates}
            </Button>

            {/* Sort controls */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {toolT.sortBy}
              </span>

              {/* Custom dropdown for column selection */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setDropdownOpen((prev) => !prev)}
                  className="inline-flex items-center gap-1 h-8 px-3 rounded-md border border-input bg-background text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="max-w-[120px] truncate">
                    {sortColumn || "\u2014"}
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

                {dropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 z-50 min-w-[160px] max-h-[240px] overflow-y-auto rounded-md border border-border bg-background shadow-md">
                    {headers.map((header) => (
                      <button
                        key={header}
                        type="button"
                        onClick={() => handleColumnSelect(header)}
                        className={`w-full text-left px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground transition-colors ${
                          sortColumn === header
                            ? "bg-accent/50 font-medium"
                            : ""
                        }`}
                      >
                        {header}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <SegmentedControl
                options={sortOptions}
                value={sortDirection}
                onChange={handleDirectionChange}
                size="sm"
              />
            </div>

            <div className="ml-auto">
              <Button onClick={handleDownloadCsv} variant="secondary" size="sm">
                {toolT.downloadCsv}
              </Button>
            </div>
          </div>

          {/* Data table */}
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="sticky top-0 bg-muted/50 border-b border-border">
                    {headers.map((header, i) => (
                      <th
                        key={i}
                        className="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.map((row, rowIndex) => (
                    <tr
                      key={rowIndex}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      {headers.map((_, colIndex) => (
                        <td
                          key={colIndex}
                          className="px-3 py-1.5 whitespace-nowrap font-mono text-sm"
                        >
                          {row[colIndex] ?? ""}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        headers.length === 0 &&
        data.length === 0 &&
        rawInput.trim() === "" && (
          <div className="text-sm text-muted-foreground text-center py-8">
            {toolT.noDataParsed}
          </div>
        )
      )}
    </div>
  );
}
