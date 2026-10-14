// Choices offered on the public /apply form. Values are what gets stored on
// the application row; labels are plain-English for the screen.

export const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue",
  "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu",
  "FCT (Abuja)", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina",
  "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo",
  "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
] as const;

export const APPLICANT_TYPES = [
  { value: "self", label: "I am the child applying for myself", hint: "For young people applying on their own behalf." },
  { value: "guardian", label: "I am a parent or guardian", hint: "Applying for a child in your care." },
  { value: "organisation", label: "I represent an organisation", hint: "A school, church, NGO or community group applying for a child." },
] as const;

export const GENDERS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other / prefer not to say" },
] as const;

export const EDU_STATUSES = [
  { value: "in_school", label: "Currently in school" },
  { value: "out_of_school", label: "Left school (dropped out)" },
  { value: "never_attended", label: "Has never attended school" },
] as const;

export const ACADEMIC_PERFORMANCE = [
  { value: "excellent", label: "Excellent" },
  { value: "good", label: "Good" },
  { value: "average", label: "Average" },
  { value: "struggling", label: "Struggling" },
  { value: "unknown", label: "I don't know" },
] as const;

export const LIVING_SITUATIONS = [
  { value: "both_parents", label: "With both parents" },
  { value: "single_parent", label: "With one parent" },
  { value: "relatives", label: "With relatives" },
  { value: "guardian", label: "With a guardian / foster carer" },
  { value: "orphanage", label: "In a children's home" },
  { value: "other", label: "Other" },
] as const;

export const HOUSEHOLD_INCOME = [
  { value: "none", label: "No regular income" },
  { value: "below_30k", label: "Below ₦30,000 a month" },
  { value: "30k_70k", label: "₦30,000 – ₦70,000 a month" },
  { value: "70k_150k", label: "₦70,000 – ₦150,000 a month" },
  { value: "above_150k", label: "Above ₦150,000 a month" },
  { value: "prefer_not", label: "Prefer not to say" },
] as const;

export const CHALLENGES = [
  "Cannot afford school fees",
  "Loss of one or both parents",
  "Parent unemployed or ill",
  "Unstable or unsafe housing",
  "Not enough food at home",
  "Large family with limited income",
  "Disability in the family",
  "Child works to support the family",
] as const;

export const SUPPORT_TYPES = [
  "School fees",
  "Books and uniforms",
  "Mentorship",
  "Skills / vocational training",
  "Healthcare",
  "Food and basic needs",
  "Counselling and emotional support",
  "Business start-up support",
] as const;
