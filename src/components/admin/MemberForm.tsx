"use client";

import { useEffect, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

export default function MemberForm({
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
    <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
      {/* Section 1: Member Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">
          Member Information
        </h3>

        {/* Basic personal info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>
              First Name <span className="text-red-500">*</span>
            </Label>
            <Input
              {...form.register("firstName")}
              placeholder="Enter first name"
            />
            {form.formState.errors.firstName && (
              <p className="text-xs text-red-600">
                {form.formState.errors.firstName.message}
              </p>
            )}
          </div>
          <div>
            <Label>
              Last Name <span className="text-red-500">*</span>
            </Label>
            <Input
              {...form.register("lastName")}
              placeholder="Enter last name"
            />
            {form.formState.errors.lastName && (
              <p className="text-xs text-red-600">
                {form.formState.errors.lastName.message}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>
              Date of Birth <span className="text-red-500">*</span>
            </Label>
            <Input type="date" {...form.register("dateOfBirth")} />
            {form.formState.errors.dateOfBirth && (
              <p className="text-xs text-red-600">
                {form.formState.errors.dateOfBirth.message}
              </p>
            )}
          </div>
          <div>
            <Label>
              Gender <span className="text-red-500">*</span>
            </Label>
            <Select
              value={form.watch("gender") ?? ""}
              onValueChange={(v) => form.setValue("gender", toGender(v))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MALE">Male</SelectItem>
                <SelectItem value="FEMALE">Female</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.gender && (
              <p className="text-xs text-red-600">
                {String(form.formState.errors.gender.message)}
              </p>
            )}
          </div>
          <div>
            <Label>
              Voter ID Number <span className="text-red-500">*</span>
            </Label>
            <Input
              {...form.register("nationalId")}
              placeholder="Enter ID number"
            />
            {form.formState.errors.nationalId && (
              <p className="text-xs text-red-600">
                {form.formState.errors.nationalId.message}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>
              Phone Number <span className="text-red-500">*</span>
            </Label>
            <Input
              {...form.register("phone")}
              placeholder="Enter phone number"
            />
            {form.formState.errors.phone && (
              <p className="text-xs text-red-600">
                {form.formState.errors.phone.message}
              </p>
            )}
          </div>
          <div>
            <Label>Email Address</Label>
            <Input
              type="email"
              {...form.register("email")}
              placeholder="Enter email address"
            />
            {form.formState.errors.email && (
              <p className="text-xs text-red-600">
                {String(form.formState.errors.email.message)}
              </p>
            )}
          </div>
        </div>

        <div>
          <Label>
            Residential Address <span className="text-red-500">*</span>
          </Label>
          <Textarea
            rows={3}
            {...form.register("residentialAddress")}
            placeholder="Enter full residential address"
          />
          {form.formState.errors.residentialAddress && (
            <p className="text-xs text-red-600">
              {form.formState.errors.residentialAddress.message}
            </p>
          )}
        </div>

        <div>
          <Label>
            Region / Constituency / Electoral Area{" "}
            <span className="text-red-500">*</span>
          </Label>
          <Input
            {...form.register("regionConstituencyElectoralArea")}
            placeholder="Enter region, constituency, or electoral area"
          />
          {form.formState.errors.regionConstituencyElectoralArea && (
            <p className="text-xs text-red-600">
              {form.formState.errors.regionConstituencyElectoralArea.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Occupation</Label>
            <Input
              {...form.register("occupation")}
              placeholder="e.g., Teacher, Engineer"
            />
          </div>
          <div>
            <Label>Highest Education Level</Label>
            <Select
              value={form.watch("highestEducationLevel") ?? ""}
              onValueChange={(v) =>
                form.setValue("highestEducationLevel", toEdu(v))
              }
            >
              <SelectTrigger>
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
          </div>
        </div>
      </div>

      {/* Section 2: Membership Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">
          Membership Details
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>
              Membership Level <span className="text-red-500">*</span>
            </Label>
            <Select
              value={form.watch("membershipLevel") ?? ""}
              onValueChange={(v) =>
                form.setValue("membershipLevel", toLevel(v), {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger>
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
            {form.formState.errors.membershipLevel && (
              <p className="text-xs text-red-600">
                {form.formState.errors.membershipLevel.message}
              </p>
            )}
          </div>
          <div>
            <Label>Branch / Ward</Label>
            <Input
              {...form.register("branchWard")}
              placeholder="Select or enter branch/ward"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>
              Member Category <span className="text-red-500">*</span>
            </Label>
            <Select
              value={form.watch("level")}
              onValueChange={(v) => form.setValue("level", v)}
              disabled={categoriesLoading || !!categoriesError}
            >
              <SelectTrigger>
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
            {categoriesError && (
              <p className="text-xs text-red-600 mt-1">{categoriesError}</p>
            )}
            {form.formState.errors.level && (
              <p className="text-xs text-red-600 mt-1">
                {form.formState.errors.level.message}
              </p>
            )}
          </div>
          <div>
            <Label>Status</Label>
            <Select
              value={form.watch("status") ?? ""}
              onValueChange={(v) => form.setValue("status", toStatus(v))}
            >
              <SelectTrigger>
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
          </div>
        </div>

        <div>
          <Label>Recruited By</Label>
          <Input
            {...form.register("recruitedBy")}
            placeholder="Name or member ID of recruiter (optional)"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Optional: Enter the name or member ID of the person who recruited
            this member.
          </p>
        </div>
      </div>

      {/* Section 3: Attachments */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">Attachments</h3>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-end">
          <div>
            <Label>Passport Photo</Label>
            <Input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
            />
            {form.formState.errors.passportPicture && (
              <p className="text-xs text-red-600">
                {String(form.formState.errors.passportPicture.message)}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Upload member&apos;s passport photo (JPG/PNG/WebP, max 5MB)
            </p>
          </div>
          {previewUrl && (
            <div className="justify-self-start">
              <Image
                src={previewUrl}
                alt="Passport preview"
                width={96}
                height={96}
                className="rounded object-cover border shadow-sm"
              />
            </div>
          )}
        </div>
      </div>

      <div className="pt-4">
        <Button
          type="submit"
          disabled={submitting}
          className="w-full md:w-auto px-8"
        >
          {submitting ? "Saving Member..." : "Save Member"}
        </Button>
      </div>
    </form>
  );
}
