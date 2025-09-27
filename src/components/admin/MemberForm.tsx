"use client";

import { useEffect, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField, FormRow } from "@/components/forms/FormField";
import { FormSection, FormContainer, FormActions } from "@/components/forms/FormSection";
import Image from "next/image";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Literal arrays for UI
const GENDERS = ["MALE", "FEMALE", "OTHER"] as const;
type GenderUnion = (typeof GENDERS)[number] | ""; // "" allowed in form

const STATUSES = ["PROSPECT", "PENDING", "ACTIVE", "SUSPENDED"] as const;
type StatusUnion = (typeof STATUSES)[number] | "" | undefined;

const LEVELS = ["ORDINARY", "EXECUTIVE", "DELEGATE", "OTHER"] as const;
type LevelUnion = (typeof LEVELS)[number] | "";

const EDU = [
  "PRIMARY",
  "SECONDARY", 
  "TERTIARY",
  "POSTGRADUATE",
  "VOCATIONAL",
  "OTHER",
] as const;
type EduUnion = (typeof EDU)[number] | "" | undefined;

// Type guard helpers to narrow incoming strings to the literal unions
function isOneOf<T extends readonly string[]>(
  arr: T,
  v: string
): v is T[number] {
  return (arr as readonly string[]).includes(v);
}
const toGender = (v: string): GenderUnion => (isOneOf(GENDERS, v) ? v : "");
const toStatus = (v: string): StatusUnion => (isOneOf(STATUSES, v) ? v : "");
const toLevel = (v: string): LevelUnion => (isOneOf(LEVELS, v) ? v : "");
const toEdu = (v: string): EduUnion => (isOneOf(EDU, v) ? v : "");

// Zod schema that allows "" during editing
const MemberSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),

  gender: z.union([z.enum(GENDERS), z.literal("")]),
  nationalId: z.string().min(5, "National ID / Voter ID Number is required"),
  phone: z.string().min(10, "Phone number is required"),
  residentialAddress: z.string().min(10, "Residential address is required"),
  regionConstituencyElectoralArea: z
    .string()
    .min(3, "Region / Constituency / Electoral Area is required"),

  email: z
    .union([
      z.string().email("Provide a valid email"),
      z.literal(""),
      z.undefined(),
    ])
    .optional(),
  occupation: z.string().optional(),
  highestEducationLevel: z
    .union([z.enum(EDU), z.literal(""), z.undefined()])
    .optional(),

  membershipLevel: z
    .union([z.enum(LEVELS), z.literal("")])
    .refine((v) => v !== "", { message: "Membership level is required" }),
  branchWard: z.string().optional(),
  recruitedBy: z.string().optional(),

  level: z.string().min(1, "Member category is required"),
  status: z.union([z.enum(STATUSES), z.literal(""), z.undefined()]).optional(),

  passportPicture: z
    .any()
    .optional()
    .refine(
      (fileList) =>
        !fileList ||
        !fileList.length ||
        (fileList.length === 1 &&
          ["image/jpeg", "image/png", "image/webp"].includes(
            fileList[0]?.type
          ) &&
          fileList[0]?.size <= 5 * 1024 * 1024),
      { message: "Passport photo must be JPG/PNG/WebP and ≤ 5MB" }
    ),

  nationality: z.string().optional(),
});

export type MemberFormValues = z.infer<typeof MemberSchema>;

export default function MemberFormNew({
  initial,
  onSubmit,
  submitting,
}: {
  initial?: Partial<{
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: GenderUnion;
    nationalId: string;
    phone: string;
    residentialAddress: string;
    regionConstituencyElectoralArea: string;
    email?: string | null;
    occupation?: string | null;
    highestEducationLevel?: EduUnion | null;
    membershipLevel?: LevelUnion;
    branchWard?: string | null;
    recruitedBy?: string | null;
    level?: string;
    status?: StatusUnion;
    nationality?: string | null;
    passportPictureUrl?: string | null;
  }>;
  submitting?: boolean;
  onSubmit: SubmitHandler<MemberFormValues>;
}) {
  const [memberCategories, setMemberCategories] = useState<
    Array<{ id: string; code: string; name: string }>
  >([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/member-categories")
      .then((res) => {
        if (!res.ok)
          throw new Error(`Failed to load categories: ${res.statusText}`);
        return res.json();
      })
      .then((data) => {
        if (data?.data) setMemberCategories(data.data);
        else throw new Error("No categories data received");
        setCategoriesError(null);
      })
      .catch((error) => {
        console.error("Error loading member categories:", error);
        setCategoriesError(error.message || "Failed to load categories");
      })
      .finally(() => setCategoriesLoading(false));
  }, []);

  const form = useForm<MemberFormValues>({
    resolver: zodResolver(MemberSchema),
    defaultValues: {
      firstName: initial?.firstName ?? "",
      lastName: initial?.lastName ?? "",
      dateOfBirth: initial?.dateOfBirth ?? "",
      gender: (initial?.gender as GenderUnion) ?? "",
      nationalId: initial?.nationalId ?? "",
      phone: initial?.phone ?? "",
      residentialAddress: initial?.residentialAddress ?? "",
      regionConstituencyElectoralArea:
        initial?.regionConstituencyElectoralArea ?? "",

      email: initial?.email ?? "",
      occupation: initial?.occupation ?? "",
      highestEducationLevel: (initial?.highestEducationLevel as EduUnion) ?? "",

      membershipLevel: (initial?.membershipLevel as LevelUnion) ?? "",
      branchWard: initial?.branchWard ?? "",
      recruitedBy: initial?.recruitedBy ?? "",

      level: initial?.level ?? "",
      status: (initial?.status as StatusUnion) ?? "PROSPECT",

      nationality: initial?.nationality ?? "",
      passportPicture: undefined,
    },
  });

  const [previewUrl, setPreviewUrl] = useState<string | null>(
    initial?.passportPictureUrl ?? null
  );

  useEffect(() => {
    form.reset({
      firstName: initial?.firstName ?? "",
      lastName: initial?.lastName ?? "",
      dateOfBirth: initial?.dateOfBirth ?? "",
      gender: (initial?.gender as GenderUnion) ?? "",
      nationalId: initial?.nationalId ?? "",
      phone: initial?.phone ?? "",
      residentialAddress: initial?.residentialAddress ?? "",
      regionConstituencyElectoralArea:
        initial?.regionConstituencyElectoralArea ?? "",

      email: initial?.email ?? "",
      occupation: initial?.occupation ?? "",
      highestEducationLevel: (initial?.highestEducationLevel as EduUnion) ?? "",

      membershipLevel: (initial?.membershipLevel as LevelUnion) ?? "",
      branchWard: initial?.branchWard ?? "",
      recruitedBy: initial?.recruitedBy ?? "",

      level: initial?.level ?? "",
      status: (initial?.status as StatusUnion) ?? "PROSPECT",

      nationality: initial?.nationality ?? "",
      passportPicture: undefined,
    });
    setPreviewUrl(initial?.passportPictureUrl ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    form.setValue("passportPicture", e.target.files, {
      shouldDirty: true,
      shouldValidate: true,
    });
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(initial?.passportPictureUrl ?? null);
    }
  };

  return (
    <FormContainer maxWidth="2xl">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormSection 
          title="Member Information"
          subtitle="Basic personal and contact information"
        >
          <FormRow columns={2}>
            <FormField
              label="First Name"
              required
              error={form.formState.errors.firstName?.message}
              id="firstName"
            >
              <Input
                id="firstName"
                {...form.register("firstName")}
                placeholder="Enter first name"
                aria-invalid={!!form.formState.errors.firstName}
              />
            </FormField>
            
            <FormField
              label="Last Name"
              required
              error={form.formState.errors.lastName?.message}
              id="lastName"
            >
              <Input
                id="lastName"
                {...form.register("lastName")}
                placeholder="Enter last name"
                aria-invalid={!!form.formState.errors.lastName}
              />
            </FormField>
          </FormRow>

          <FormRow columns={3}>
            <FormField
              label="Date of Birth"
              required
              error={form.formState.errors.dateOfBirth?.message}
              id="dateOfBirth"
            >
              <Input
                id="dateOfBirth"
                type="date"
                {...form.register("dateOfBirth")}
                aria-invalid={!!form.formState.errors.dateOfBirth}
              />
            </FormField>
            
            <FormField
              label="Gender"
              required
              error={form.formState.errors.gender?.message as string}
              id="gender"
            >
              <Select
                value={form.watch("gender") ?? ""}
                onValueChange={(v) => form.setValue("gender", toGender(v))}
              >
                <SelectTrigger id="gender" aria-invalid={!!form.formState.errors.gender}>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">Male</SelectItem>
                  <SelectItem value="FEMALE">Female</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            
            <FormField
              label="Voter ID Number"
              required
              error={form.formState.errors.nationalId?.message}
              id="nationalId"
            >
              <Input
                id="nationalId"
                {...form.register("nationalId")}
                placeholder="Enter ID number"
                aria-invalid={!!form.formState.errors.nationalId}
              />
            </FormField>
          </FormRow>

          <FormRow columns={2}>
            <FormField
              label="Phone Number"
              required
              error={form.formState.errors.phone?.message}
              id="phone"
            >
              <Input
                id="phone"
                {...form.register("phone")}
                placeholder="Enter phone number"
                aria-invalid={!!form.formState.errors.phone}
              />
            </FormField>
            
            <FormField
              label="Email Address"
              error={form.formState.errors.email?.message as string}
              id="email"
            >
              <Input
                id="email"
                type="email"
                {...form.register("email")}
                placeholder="Enter email address"
                aria-invalid={!!form.formState.errors.email}
              />
            </FormField>
          </FormRow>

          <FormField
            label="Residential Address"
            required
            error={form.formState.errors.residentialAddress?.message}
            helpText="Enter the complete residential address"
            id="residentialAddress"
          >
            <Textarea
              id="residentialAddress"
              rows={3}
              {...form.register("residentialAddress")}
              placeholder="Enter full residential address"
              aria-invalid={!!form.formState.errors.residentialAddress}
            />
          </FormField>

          <FormField
            label="Region / Constituency / Electoral Area"
            required
            error={form.formState.errors.regionConstituencyElectoralArea?.message}
            id="regionConstituencyElectoralArea"
          >
            <Input
              id="regionConstituencyElectoralArea"
              {...form.register("regionConstituencyElectoralArea")}
              placeholder="Enter region, constituency, or electoral area"
              aria-invalid={!!form.formState.errors.regionConstituencyElectoralArea}
            />
          </FormField>

          <FormRow columns={2}>
            <FormField
              label="Occupation"
              id="occupation"
            >
              <Input
                id="occupation"
                {...form.register("occupation")}
                placeholder="e.g., Teacher, Engineer"
              />
            </FormField>
            
            <FormField
              label="Highest Education Level"
              id="highestEducationLevel"
            >
              <Select
                value={form.watch("highestEducationLevel") ?? ""}
                onValueChange={(v) =>
                  form.setValue("highestEducationLevel", toEdu(v))
                }
              >
                <SelectTrigger id="highestEducationLevel">
                  <SelectValue placeholder="Select education level" />
                </SelectTrigger>
                <SelectContent>
                  {EDU.map((v) => (
                    <SelectItem key={v} value={v}>
                      {v[0] + v.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </FormRow>
        </FormSection>

        <FormSection 
          title="Membership Details"
          subtitle="Membership level and organizational information"
        >
          <FormRow columns={2}>
            <FormField
              label="Membership Level"
              required
              error={form.formState.errors.membershipLevel?.message}
              id="membershipLevel"
            >
              <Select
                value={form.watch("membershipLevel") ?? ""}
                onValueChange={(v) =>
                  form.setValue("membershipLevel", toLevel(v), {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger id="membershipLevel" aria-invalid={!!form.formState.errors.membershipLevel}>
                  <SelectValue placeholder="Select membership level" />
                </SelectTrigger>
                <SelectContent>
                  {LEVELS.map((v) => (
                    <SelectItem key={v} value={v}>
                      {v[0] + v.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            
            <FormField
              label="Branch / Ward"
              id="branchWard"
            >
              <Input
                id="branchWard"
                {...form.register("branchWard")}
                placeholder="Select or enter branch/ward"
              />
            </FormField>
          </FormRow>

          <FormRow columns={2}>
            <FormField
              label="Member Category"
              required
              error={form.formState.errors.level?.message}
              helpText={categoriesError || "Select the appropriate membership category"}
              id="level"
            >
              <Select
                value={form.watch("level")}
                onValueChange={(v) => form.setValue("level", v)}
                disabled={categoriesLoading || !!categoriesError}
              >
                <SelectTrigger id="level" aria-invalid={!!form.formState.errors.level}>
                  <SelectValue
                    placeholder={
                      categoriesLoading
                        ? "Loading categories..."
                        : categoriesError
                        ? "Error loading categories"
                        : "Select category"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {memberCategories.map((category) => (
                    <SelectItem key={category.id} value={category.code}>
                      {category.name}
                    </SelectItem>
                  ))}
                  {!categoriesLoading &&
                    memberCategories.length === 0 &&
                    !categoriesError && (
                      <SelectItem value="" disabled>
                        No categories available
                      </SelectItem>
                    )}
                </SelectContent>
              </Select>
            </FormField>
            
            <FormField
              label="Status"
              id="status"
            >
              <Select
                value={form.watch("status") ?? ""}
                onValueChange={(v) => form.setValue("status", toStatus(v))}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((v) => (
                    <SelectItem key={v} value={v}>
                      {v[0] + v.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </FormRow>

          <FormField
            label="Recruited By"
            helpText="Enter the name or member ID of the person who recruited this member (optional)"
            id="recruitedBy"
          >
            <Input
              id="recruitedBy"
              {...form.register("recruitedBy")}
              placeholder="Name or member ID of recruiter (optional)"
            />
          </FormField>
        </FormSection>

        <FormSection 
          title="Attachments"
          subtitle="Upload supporting documents and photos"
        >
          <FormRow columns={previewUrl ? 2 : 1}>
            <FormField
              label="Passport Photo"
              error={form.formState.errors.passportPicture?.message as string}
              helpText="Upload member's passport photo (JPG/PNG/WebP, max 5MB)"
              id="passportPicture"
            >
              <Input
                id="passportPicture"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                aria-invalid={!!form.formState.errors.passportPicture}
              />
            </FormField>
            
            {previewUrl && (
              <div className="flex justify-center">
                <div className="relative">
                  <Image
                    src={previewUrl}
                    alt="Passport preview"
                    width={120}
                    height={120}
                    className="rounded-lg object-cover border-2 border-gray-200 shadow-sm"
                  />
                  <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                    Preview
                  </div>
                </div>
              </div>
            )}
          </FormRow>
        </FormSection>

        <FormActions align="left">
          <Button
            type="submit"
            disabled={submitting}
            className="px-8"
          >
            {submitting ? "Saving Member..." : "Save Member"}
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