#!/usr/bin/env bash
set -euo pipefail

# Helpers
make_dir()  { [ -d "$1" ] || mkdir -p "$1"; }
make_file() { [ -f "$1" ] || { mkdir -p "$(dirname "$1")"; : > "$1"; }; }

# === Directories (safe to include parentheses when quoted) ===
DIRS=(
  "src/app/(auth)/login"
  "src/app/(auth)/register"

  "src/app/(admin)/dashboard"
  "src/app/(admin)/members/[id]"
  "src/app/(admin)/dues/plans"
  "src/app/(admin)/dues/posting"
  "src/app/(admin)/dues/activities"

  "src/app/(member)/dashboard"
  "src/app/(member)/statement"
  "src/app/(member)/activities"
  "src/app/(member)/profile"

  "src/components/layout"
  "src/components/shared"
  "src/components/forms/fields"

  "src/lib"
)

# === Files ===
FILES=(
  # auth
  "src/app/(auth)/login/page.tsx"
  "src/app/(auth)/register/page.tsx"
  "src/app/(auth)/layout.tsx"

  # admin
  "src/app/(admin)/dashboard/page.tsx"
  "src/app/(admin)/members/page.tsx"
  "src/app/(admin)/members/[id]/page.tsx"
  "src/app/(admin)/dues/plans/page.tsx"
  "src/app/(admin)/dues/posting/page.tsx"
  "src/app/(admin)/dues/activities/page.tsx"
  "src/app/(admin)/layout.tsx"

  # member
  "src/app/(member)/dashboard/page.tsx"
  "src/app/(member)/statement/page.tsx"
  "src/app/(member)/activities/page.tsx"
  "src/app/(member)/profile/page.tsx"
  "src/app/(member)/layout.tsx"

  # root app
  "src/app/page.tsx"
  "src/app/layout.tsx"
  "src/app/globals.css"

  # components
  "src/components/layout/AppTopbar.tsx"
  "src/components/layout/AppSidebar.tsx"
  "src/components/layout/Guard.tsx"

  "src/components/shared/KPIWidgets.tsx"
  "src/components/shared/DataTable.tsx"
  "src/components/shared/EmptyState.tsx"
  "src/components/shared/LoadingSpinner.tsx"
  "src/components/shared/ExportButtons.tsx"

  "src/components/forms/Form.tsx"
  "src/components/forms/fields/InputField.tsx"
  "src/components/forms/fields/SelectField.tsx"
  "src/components/forms/fields/SubmitBar.tsx"

  # lib
  "src/lib/auth.ts"
  "src/lib/roles.ts"
  "src/lib/utils.ts"
)

# Create directories
for d in "${DIRS[@]}"; do
  make_dir "$d"
done

# Create files (and parent dirs if needed)
for f in "${FILES[@]}"; do
  make_file "$f"
done

echo "✅ Project structure created (folders & files)."
