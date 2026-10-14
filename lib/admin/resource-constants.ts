// Shared by the upload form (client check) and the server action (real check).

export const RESOURCE_CATEGORIES = [
  { value: "policies", label: "Policies" },
  { value: "minutes", label: "Minutes" },
  { value: "templates", label: "Templates" },
  { value: "guides", label: "Guides" },
  { value: "other", label: "Other" },
] as const;
export type ResourceCategory = (typeof RESOURCE_CATEGORIES)[number]["value"];

export const MAX_RESOURCE_BYTES = 5 * 1024 * 1024;

// MIME type -> the extension we store it with.
export const RESOURCE_TYPES = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
} as const;

export const RESOURCE_ACCEPT = "application/pdf,image/jpeg,image/png";
