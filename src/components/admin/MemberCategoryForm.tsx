"use client";

import { z } from "zod";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

/** Helpers to normalize blank -> undefined */
const blankToUndef = (v: unknown) => (v === "" ? undefined : v);

/** Zod schema (transforms only where safe) */
const CategorySchema = z.object({
  code: z
    .string()
    .min(2, "Code is required (min 2 characters)")
    .max(24, "Code too long (max 24)")
    .regex(/^[A-Z0-9_-]+$/, "Use A–Z, 0–9, underscore or dash only")
    .transform((v) => v.toUpperCase()),

  name: z.string().min(2, "Name is required").max(100, "Name too long"),

  // allow "" in the form, store undefined if blank
  description: z.preprocess(
    blankToUndef,
    z.string().max(500, "Description too long").optional()
  ),

  // accept "", number-like strings, or numbers; output number | undefined
  rank: z.preprocess(
    (v) => (v === "" || v === undefined ? undefined : v),
    z.coerce.number().int().min(0, "Rank must be ≥ 0").optional()
  ),

  active: z.boolean().default(true),
});

/** IMPORTANT: explicitly expose input vs output types  */
type CategoryInput = z.input<typeof CategorySchema>; // what the form holds
export type MemberCategoryFormValues = z.output<typeof CategorySchema>; // what you submit

export default function MemberCategoryForm({
  initial,
  submitting,
  serverError,
  onSubmit,
}: {
  initial?: Partial<MemberCategoryFormValues>;
  submitting?: boolean;
  serverError?: string | null;
  onSubmit: SubmitHandler<MemberCategoryFormValues>;
}) {
  /** useForm with proper type context */
  const form = useForm<CategoryInput, unknown, MemberCategoryFormValues>({
    resolver: zodResolver(CategorySchema),
    defaultValues: {
      code: initial?.code ?? "",
      name: initial?.name ?? "",
      // for inputs, "" is fine; preprocess will turn it into undefined for output
      description: initial?.description ?? "",
      // input can be number or ""; pick "" when not set so it stays blank in the UI
      rank: typeof initial?.rank === "number" ? initial.rank : "",
      active: initial?.active ?? true,
    },
  });

  // Auto-uppercase code as user types
  useEffect(() => {
    const sub = form.watch((values, { name }) => {
      if (name === "code" && typeof values.code === "string") {
        const up = values.code.toUpperCase();
        if (up !== values.code) {
          form.setValue("code", up, {
            shouldValidate: true,
            shouldDirty: true,
          });
        }
      }
    });
    return () => sub.unsubscribe();
  }, [form]);

  return (
    <form
      className="space-y-6"
      onSubmit={form.handleSubmit((vals) => {
        // vals is MemberCategoryFormValues (transformed output)
        // code is already uppercased by schema; submit as-is
        onSubmit(vals);
      })}
    >
      {serverError && (
        <div className="rounded border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {serverError}
        </div>
      )}

      {/* Code + Name */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>
            Code <span className="text-red-500">*</span>
          </Label>
          <Input
            placeholder="e.g., GOLD"
            {...form.register("code")}
            autoCapitalize="characters"
          />
          {form.formState.errors.code && (
            <p className="text-xs text-red-600 mt-1">
              {form.formState.errors.code.message}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            Unique identifier (A–Z, 0–9, _ or -). Used in APIs and imports.
          </p>
        </div>

        <div>
          <Label>
            Name <span className="text-red-500">*</span>
          </Label>
          <Input placeholder="e.g., Gold" {...form.register("name")} />
          {form.formState.errors.name && (
            <p className="text-xs text-red-600 mt-1">
              {form.formState.errors.name.message}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            Human-friendly display name shown to admins and members.
          </p>
        </div>
      </div>

      {/* Description */}
      <div>
        <Label>Description</Label>
        <Textarea
          rows={3}
          placeholder="Short description (optional)"
          {...form.register("description")}
        />
        {form.formState.errors.description && (
          <p className="text-xs text-red-600 mt-1">
            {form.formState.errors.description.message}
          </p>
        )}
      </div>

      {/* Rank + Active */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
        <div>
          <Label>Rank</Label>
          <Input
            type="number"
            min={0}
            // note: still registering as "rank" (input can be "" or number)
            {...form.register("rank")}
            placeholder="Lower = higher tier (optional)"
          />
          {form.formState.errors.rank && (
            <p className="text-xs text-red-600 mt-1">
              {String(form.formState.errors.rank.message)}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            Optional ordering hint. Example: 1 for highest tier, 99 for lowest.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Switch
            checked={!!form.watch("active")}
            onCheckedChange={(v) =>
              form.setValue("active", Boolean(v), { shouldDirty: true })
            }
            id="active-switch"
          />
          <Label htmlFor="active-switch">Active</Label>
        </div>
      </div>

      <div className="pt-2">
        <Button type="submit" disabled={submitting} className="px-8">
          {submitting ? "Saving..." : "Create Category"}
        </Button>
      </div>
    </form>
  );
}
