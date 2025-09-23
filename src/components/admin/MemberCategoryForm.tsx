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
import { FormField, FormRow } from "@/components/forms/FormField";
import { FormSection, FormContainer, FormActions } from "@/components/forms/FormSection";

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
    <FormContainer maxWidth="lg">
      <form
        onSubmit={form.handleSubmit((vals) => {
          // vals is MemberCategoryFormValues (transformed output)
          // code is already uppercased by schema; submit as-is
          onSubmit(vals);
        })}
        className="space-y-8"
      >
        {serverError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-400">
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Error:</span>
              {serverError}
            </div>
          </div>
        )}

        <FormSection 
          title="Category Information"
          subtitle="Define the basic attributes of this membership category"
        >
          <FormRow columns={2}>
            <FormField
              label="Code"
              required
              error={form.formState.errors.code?.message}
              helpText="Unique identifier (A–Z, 0–9, _ or -). Used in APIs and imports."
              id="code"
            >
              <Input
                id="code"
                placeholder="e.g., GOLD"
                {...form.register("code")}
                autoCapitalize="characters"
                aria-invalid={!!form.formState.errors.code}
              />
            </FormField>

            <FormField
              label="Name"
              required
              error={form.formState.errors.name?.message}
              helpText="Human-friendly display name shown to admins and members."
              id="name"
            >
              <Input 
                id="name"
                placeholder="e.g., Gold" 
                {...form.register("name")}
                aria-invalid={!!form.formState.errors.name}
              />
            </FormField>
          </FormRow>

          <FormField
            label="Description"
            error={form.formState.errors.description?.message}
            helpText="Optional detailed description of this category's features and benefits."
            id="description"
          >
            <Textarea
              id="description"
              rows={3}
              placeholder="Short description (optional)"
              {...form.register("description")}
              aria-invalid={!!form.formState.errors.description}
            />
          </FormField>
        </FormSection>

        <FormSection 
          title="Category Settings"
          subtitle="Configure ordering and availability settings"
        >
          <FormRow columns={2}>
            <FormField
              label="Rank"
              error={form.formState.errors.rank?.message as string}
              helpText="Optional ordering hint. Example: 1 for highest tier, 99 for lowest."
              id="rank"
            >
              <Input
                id="rank"
                type="number"
                min={0}
                {...form.register("rank")}
                placeholder="Lower = higher tier (optional)"
                aria-invalid={!!form.formState.errors.rank}
              />
            </FormField>

            <FormField
              label="Status"
              helpText="Only active categories are available for new member assignments."
              id="active"
            >
              <div className="flex items-center gap-3 pt-2">
                <Switch
                  checked={!!form.watch("active")}
                  onCheckedChange={(v) =>
                    form.setValue("active", Boolean(v), { shouldDirty: true })
                  }
                  id="active-switch"
                />
                <Label htmlFor="active-switch" className="font-normal">
                  {form.watch("active") ? "Active" : "Inactive"}
                </Label>
              </div>
            </FormField>
          </FormRow>
        </FormSection>

        <FormActions align="left">
          <Button type="submit" disabled={submitting} className="px-8">
            {submitting ? "Saving..." : "Create Category"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => form.reset()}
          >
            Reset Form
          </Button>
        </FormActions>
      </form>
    </FormContainer>
  );
}
