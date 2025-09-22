"use client";
import React from "react";
import clsx from "clsx";

export type Column<T> = {
  key: keyof T | string;
  header: React.ReactNode;
  render?: (row: T, rowIndex: number) => React.ReactNode;
  className?: string;
  align?: "left" | "center" | "right";
};

export default function DataTable<T extends { id: string }>({
  rows,
  columns,
  total,
  page,
  size,
  onPageChange,
  onSizeChange,
}: {
  rows: T[];
  columns: Column<T>[];
  total: number;
  page: number;
  size: number;
  onPageChange: (p: number) => void;
  onSizeChange: (s: number) => void;
}) {
  return (
    <div className="w-full">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              {columns.map((c, i) => (
                <th
                  key={i}
                  className={clsx(
                    "px-3 py-2 text-left font-medium",
                    c.className
                  )}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((r, ri) => (
              <tr key={r.id} className="bg-white hover:bg-gray-50">
                {columns.map((c, ci) => (
                  <td key={ci} className={clsx("px-3 py-2", c.className)}>
                    {c.render ? c.render(r, ri) : String(r[c.key as keyof T] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between p-3 text-xs text-gray-600">
        <div>
          Page {page} · Showing {rows.length} of {total}
        </div>
        <div className="flex items-center gap-2">
          <button
            className="px-2 py-1 border rounded"
            onClick={() => onPageChange(Math.max(1, page - 1))}
          >
            Prev
          </button>
          <button
            className="px-2 py-1 border rounded"
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </button>
          <select
            className="border rounded px-2 py-1"
            value={size}
            onChange={(e) => onSizeChange(parseInt(e.target.value))}
          >
            {[10, 20, 50].map((s) => (
              <option key={s} value={s}>
                {s}/page
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
