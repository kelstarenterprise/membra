"use client";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
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
import {
  Member,
  MemberCategory,
  MemberStatus,
  Gender,
  MembershipLevel,
  EducationLevel,
} from "@/types/member";
import {
  MEMBER_STATUS,
  CATEGORY,
  GENDER,
  MEMBERSHIP_LEVEL,
  EDUCATION_LEVEL,
} from "@/types/member";

const MemberSchema = z.object({
  // Required personal information
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: z.enum(GENDER),
  nationalId: z.string().min(5, "National ID / Voter ID Number is required"),
  phone: z.string().min(10, "Phone number is required"),
  residentialAddress: z.string().min(10, "Residential address is required"),
  regionConstituencyElectoralArea: z
    .string()
    .min(3, "Region / Constituency / Electoral Area is required"),

  // Optional personal information
  email: z.string().email("Provide a valid email").optional().or(z.literal("")),
  occupation: z.string().optional(),
  highestEducationLevel: z.enum(EDUCATION_LEVEL).optional(),

  // Membership details
  membershipLevel: z.enum(MEMBERSHIP_LEVEL),
  branchWard: z.string().optional(),
  recruitedBy: z.string().optional(),

  // System fields (backward compatibility)
  level: z.enum(CATEGORY),
  status: z.enum(MEMBER_STATUS),

  // File input – optional; if provided ensure it's an image under ~5MB
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
      {
        message: "Passport photo must be JPG/PNG/WebP and ≤ 5MB",
      }
    ),

  // Legacy fields - keep for backward compatibility
  nationality: z.string().optional(),
});

export type MemberFormValues = z.infer<typeof MemberSchema>;

export default function MemberForm({
  initial,
  onSubmit,
  submitting,
}: {
  initial?: Partial<Member> & { passportPictureUrl?: string | null };
  submitting?: boolean;
  onSubmit: (values: MemberFormValues) => void;
}) {
  const form = useForm<MemberFormValues>({
    resolver: zodResolver(MemberSchema),
    defaultValues: {
      // Required personal information
      firstName: initial?.firstName ?? "",
      lastName: initial?.lastName ?? "",
      dateOfBirth: initial?.dateOfBirth ?? "",
      gender: (initial?.gender as Gender) ?? "",
      nationalId: initial?.nationalId ?? "",
      phone: initial?.phone ?? "",
      residentialAddress: initial?.residentialAddress ?? "",
      regionConstituencyElectoralArea:
        initial?.regionConstituencyElectoralArea ?? "",

      // Optional personal information
      email: initial?.email ?? "",
      occupation: initial?.occupation ?? "",
      highestEducationLevel:
        (initial?.highestEducationLevel as EducationLevel) ?? "",

      // Membership details
      membershipLevel: (initial?.membershipLevel as MembershipLevel) ?? "",
      branchWard: initial?.branchWard ?? "",
      recruitedBy: initial?.recruitedBy ?? "",

      // System fields (backward compatibility)
      level: (initial?.level as MemberCategory) ?? "BEGINNER",
      status: (initial?.status as MemberStatus) ?? "PROSPECT",

      // Legacy fields
      nationality: initial?.nationality ?? "",
      passportPicture: undefined,
    },
  });

  // Preview for new uploads or existing URL
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    initial?.passportPictureUrl ?? null
  );

  useEffect(() => {
    form.reset({
      // Required personal information
      firstName: initial?.firstName ?? "",
      lastName: initial?.lastName ?? "",
      dateOfBirth: initial?.dateOfBirth ?? "",
      gender: (initial?.gender as Gender) ?? "",
      nationalId: initial?.nationalId ?? "",
      phone: initial?.phone ?? "",
      residentialAddress: initial?.residentialAddress ?? "",
      regionConstituencyElectoralArea:
        initial?.regionConstituencyElectoralArea ?? "",

      // Optional personal information
      email: initial?.email ?? "",
      occupation: initial?.occupation ?? "",
      highestEducationLevel:
        (initial?.highestEducationLevel as EducationLevel) ?? "",

      // Membership details
      membershipLevel: (initial?.membershipLevel as MembershipLevel) ?? "",
      branchWard: initial?.branchWard ?? "",
      recruitedBy: initial?.recruitedBy ?? "",

      // System fields (backward compatibility)
      level: (initial?.level as MemberCategory) ?? "BEGINNER",
      status: (initial?.status as MemberStatus) ?? "PROSPECT",

      // Legacy fields
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
              value={form.watch("gender")}
              onValueChange={(v) => form.setValue("gender", v as Gender)}
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
                {form.formState.errors.gender.message}
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
                {form.formState.errors.email.message}
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
              value={form.watch("highestEducationLevel")}
              onValueChange={(v) =>
                form.setValue("highestEducationLevel", v as EducationLevel)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select education level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PRIMARY">Primary</SelectItem>
                <SelectItem value="SECONDARY">Secondary</SelectItem>
                <SelectItem value="TERTIARY">Tertiary</SelectItem>
                <SelectItem value="POSTGRADUATE">Postgraduate</SelectItem>
                <SelectItem value="VOCATIONAL">Vocational</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
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
              value={form.watch("membershipLevel")}
              onValueChange={(v) =>
                form.setValue("membershipLevel", v as MembershipLevel)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select membership level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ORDINARY">Ordinary</SelectItem>
                <SelectItem value="EXECUTIVE">Executive</SelectItem>
                <SelectItem value="DELEGATE">Delegate</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
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
            <Label>Member Category</Label>
            <Select
              value={form.watch("level")}
              onValueChange={(v) => form.setValue("level", v as MemberCategory)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GOLD">Gold</SelectItem>
                <SelectItem value="SILVER">Silver</SelectItem>
                <SelectItem value="BRONZE">Bronze</SelectItem>
                <SelectItem value="VIP">VIP</SelectItem>
                <SelectItem value="BEGINNER">Beginner</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Status</Label>
            <Select
              value={form.watch("status")}
              onValueChange={(v) => form.setValue("status", v as MemberStatus)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PROSPECT">Prospect</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
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
                {form.formState.errors.passportPicture.message as string}
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
                width={96} // same as h-24 (24*4=96px)
                height={96} // same as w-24
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
