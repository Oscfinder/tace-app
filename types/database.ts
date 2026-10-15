// Hand-written to match supabase/migrations/001_initial_schema.sql exactly.
// Regenerate with `npx supabase gen types typescript --project-id <ref>`
// once CLI auth is set up; until then, keep this in sync with the migration.

type Role = "admin" | "member" | "sponsor" | "mentor" | "beneficiary";
type Status = "pending" | "active" | "inactive" | "suspended";
type MemberType = "trustee" | "member";
type Gender = "male" | "female" | "other";
type ApplicantType = "self" | "guardian" | "organisation";
type ApplicationStatus = "pending" | "approved" | "rejected" | "flagged";
type SponsorshipType = "one_time" | "long_term";
type MentorTrack = "career" | "tech";
type EduStatus = "in_school" | "out_of_school" | "never_attended";
type BeneficiaryStage =
  | "identified"
  | "assessed"
  | "education_support"
  | "vocational_training"
  | "certification"
  | "apprenticeship"
  | "savings"
  | "employment"
  | "business_owner";
type BeneficiaryStatus = "active" | "inactive" | "graduated" | "lost_contact";
type MatchStatus =
  "pending_consent" | "active" | "paused" | "completed" | "terminated";
type SenderType = "mentor" | "beneficiary" | "guardian" | "admin";
type ProjectStatus = "draft" | "active" | "completed" | "archived";
type EventType = "meeting" | "event" | "training" | "outreach";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          phone: string | null;
          role: Role;
          status: Status;
          member_type: MemberType | null;
          trustee_role: string | null;
          committee: string | null;
          avatar_url: string | null;
          profile_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & {
          id: string;
          full_name: string;
          email: string;
          role: Role;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
        Relationships: [];
      };
      applications: {
        Row: {
          id: string;
          applicant_type: ApplicantType | null;
          child_first_name: string;
          child_last_name: string;
          child_dob: string;
          child_gender: string | null;
          child_nationality: string | null;
          child_state: string | null;
          child_address: string | null;
          child_phone: string | null;
          child_email: string | null;
          child_photo_url: string | null;
          guardian_name: string | null;
          guardian_relationship: string | null;
          guardian_phone: string | null;
          guardian_email: string | null;
          guardian_address: string | null;
          guardian_occupation: string | null;
          org_name: string | null;
          org_contact_name: string | null;
          org_contact_role: string | null;
          org_phone: string | null;
          org_email: string | null;
          org_identification: string | null;
          edu_status: string | null;
          school_name: string | null;
          class_level: string | null;
          school_address: string | null;
          academic_performance: string | null;
          learning_difficulties: string | null;
          living_situation: string | null;
          siblings_count: number | null;
          household_income: string | null;
          challenges: string[] | null;
          support_types: string[] | null;
          support_description: string | null;
          interests: string | null;
          aspirations: string | null;
          subjects_skills: string | null;
          talents: string | null;
          health_conditions: string | null;
          disabilities: string | null;
          current_treatment: string | null;
          consent_information: boolean;
          consent_contact: boolean;
          consent_assessment: boolean;
          consent_no_guarantee: boolean;
          consent_photography: boolean;
          declarant_name: string | null;
          declared_at: string | null;
          status: ApplicationStatus;
          admin_notes: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["applications"]["Row"]> & {
          child_first_name: string;
          child_last_name: string;
          child_dob: string;
        };
        Update: Partial<Database["public"]["Tables"]["applications"]["Row"]>;
        Relationships: [];
      };
      sponsors: {
        Row: {
          id: string;
          profile_id: string | null;
          sponsorship_type: SponsorshipType | null;
          total_donated: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["sponsors"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["sponsors"]["Row"]>;
        Relationships: [];
      };
      mentors: {
        Row: {
          id: string;
          profile_id: string | null;
          profession: string | null;
          expertise: string | null;
          availability: string | null;
          mentor_track: MentorTrack | null;
          preferred_age_group: string | null;
          motivation: string | null;
          vetting_status: "pending" | "cleared" | "rejected";
          vetting_notes: string | null;
          vetting_checklist: Record<string, boolean>;
          vetted_by: string | null;
          vetted_at: string | null;
          code_of_conduct_accepted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["mentors"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["mentors"]["Row"]>;
        Relationships: [];
      };
      beneficiaries: {
        Row: {
          id: string;
          profile_id: string | null;
          application_id: string | null;
          tace_id: string | null;
          first_name: string;
          last_name: string;
          date_of_birth: string;
          gender: Gender | null;
          state_of_origin: string | null;
          address: string | null;
          phone: string | null;
          email: string | null;
          photo_url: string | null;
          guardian_name: string | null;
          guardian_rel: string | null;
          guardian_phone: string | null;
          guardian_email: string | null;
          edu_status: EduStatus | null;
          school_name: string | null;
          class_level: string | null;
          living_situation: string | null;
          household_income: string | null;
          challenges: string[] | null;
          support_needed: string[] | null;
          support_description: string | null;
          interests: string | null;
          aspirations: string | null;
          talents: string | null;
          subjects_skills: string | null;
          health_conditions: string | null;
          disabilities: string | null;
          current_stage: BeneficiaryStage;
          stage_updated_at: string | null;
          mentor_id: string | null;
          sponsor_id: string | null;
          status: BeneficiaryStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<
          Database["public"]["Tables"]["beneficiaries"]["Row"]
        > & {
          first_name: string;
          last_name: string;
          date_of_birth: string;
        };
        Update: Partial<Database["public"]["Tables"]["beneficiaries"]["Row"]>;
        Relationships: [];
      };
      mentorship_matches: {
        Row: {
          id: string;
          mentor_id: string;
          beneficiary_id: string;
          status: MatchStatus;
          consent_mentor: boolean;
          consent_guardian: boolean;
          consent_mentor_at: string | null;
          consent_guardian_at: string | null;
          started_at: string | null;
          ends_at: string | null;
          termination_reason: string | null;
          next_check_in: string | null;
          created_at: string;
        };
        Insert: Partial<
          Database["public"]["Tables"]["mentorship_matches"]["Row"]
        > & {
          mentor_id: string;
          beneficiary_id: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["mentorship_matches"]["Row"]
        >;
        Relationships: [];
      };
      mentorship_messages: {
        Row: {
          id: string;
          match_id: string;
          sender_id: string;
          sender_type: SenderType | null;
          content: string;
          is_flagged: boolean;
          flag_reason: string | null;
          flagged_by: string | null;
          flagged_at: string | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: Partial<
          Database["public"]["Tables"]["mentorship_messages"]["Row"]
        > & {
          match_id: string;
          sender_id: string;
          content: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["mentorship_messages"]["Row"]
        >;
        Relationships: [];
      };
      mentorship_notes: {
        Row: {
          id: string;
          match_id: string;
          mentor_id: string;
          topics_discussed: string | null;
          improvements: string | null;
          concerns: string | null;
          next_steps: string | null;
          check_in_date: string | null;
          created_at: string;
        };
        Insert: Partial<
          Database["public"]["Tables"]["mentorship_notes"]["Row"]
        > & {
          match_id: string;
          mentor_id: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["mentorship_notes"]["Row"]
        >;
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          target_amount: number | null;
          current_amount: number;
          start_date: string | null;
          end_date: string | null;
          status: ProjectStatus;
          is_published: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["projects"]["Row"]> & {
          title: string;
        };
        Update: Partial<Database["public"]["Tables"]["projects"]["Row"]>;
        Relationships: [];
      };
      project_beneficiaries: {
        Row: {
          id: string;
          project_id: string;
          beneficiary_id: string;
          support_type: string | null;
          amount_needed: number | null;
        };
        Insert: Partial<
          Database["public"]["Tables"]["project_beneficiaries"]["Row"]
        > & {
          project_id: string;
          beneficiary_id: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["project_beneficiaries"]["Row"]
        >;
        Relationships: [];
      };
      donations: {
        Row: {
          id: string;
          donor_name: string;
          donor_email: string | null;
          donor_phone: string | null;
          sponsor_id: string | null;
          project_id: string | null;
          beneficiary_id: string | null;
          amount: number;
          currency: string;
          purpose: string | null;
          bank_ref: string | null;
          receipt_sent: boolean;
          receipt_sent_at: string | null;
          notes: string | null;
          logged_by: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["donations"]["Row"]> & {
          donor_name: string;
          amount: number;
        };
        Update: Partial<Database["public"]["Tables"]["donations"]["Row"]>;
        Relationships: [];
      };
      interventions: {
        Row: {
          id: string;
          beneficiary_id: string;
          type: string;
          amount: number | null;
          description: string | null;
          notes: string | null;
          given_by: string | null;
          given_at: string | null;
          created_at: string;
        };
        Insert: Partial<
          Database["public"]["Tables"]["interventions"]["Row"]
        > & {
          beneficiary_id: string;
          type: string;
        };
        Update: Partial<Database["public"]["Tables"]["interventions"]["Row"]>;
        Relationships: [];
      };
      progress_updates: {
        Row: {
          id: string;
          beneficiary_id: string;
          title: string;
          content: string;
          posted_by: string | null;
          created_at: string;
        };
        Insert: Partial<
          Database["public"]["Tables"]["progress_updates"]["Row"]
        > & {
          beneficiary_id: string;
          title: string;
          content: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["progress_updates"]["Row"]
        >;
        Relationships: [];
      };
      announcements: {
        Row: {
          id: string;
          title: string;
          content: string;
          is_published: boolean;
          published_at: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: Partial<
          Database["public"]["Tables"]["announcements"]["Row"]
        > & {
          title: string;
          content: string;
        };
        Update: Partial<Database["public"]["Tables"]["announcements"]["Row"]>;
        Relationships: [];
      };
      stories: {
        Row: {
          id: string;
          title: string;
          content: string;
          photo_url: string | null;
          excerpt: string | null;
          beneficiary_id: string | null;
          is_published: boolean;
          published_at: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["stories"]["Row"]> & {
          title: string;
          content: string;
        };
        Update: Partial<Database["public"]["Tables"]["stories"]["Row"]>;
        Relationships: [];
      };
      events: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          location: string | null;
          event_date: string | null;
          event_type: EventType | null;
          committee: string | null;
          minutes: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["events"]["Row"]> & {
          title: string;
        };
        Update: Partial<Database["public"]["Tables"]["events"]["Row"]>;
        Relationships: [];
      };
      audit_log: {
        Row: {
          id: string;
          user_id: string;
          action: string;
          entity_type: string | null;
          entity_id: string | null;
          details: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["audit_log"]["Row"]> & {
          user_id: string;
          action: string;
        };
        Update: Partial<Database["public"]["Tables"]["audit_log"]["Row"]>;
        Relationships: [];
      };
      committee_updates: {
        Row: {
          id: string;
          member_id: string;
          committee: string | null;
          update_month: string;
          content: string;
          created_at: string;
        };
        Insert: Partial<
          Database["public"]["Tables"]["committee_updates"]["Row"]
        > & { member_id: string; content: string };
        Update: Partial<
          Database["public"]["Tables"]["committee_updates"]["Row"]
        >;
        Relationships: [];
      };
      event_rsvps: {
        Row: {
          id: string;
          event_id: string;
          profile_id: string;
          status: "attending" | "declined";
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["event_rsvps"]["Row"]> & {
          event_id: string;
          profile_id: string;
          status: "attending" | "declined";
        };
        Update: Partial<Database["public"]["Tables"]["event_rsvps"]["Row"]>;
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          profile_id: string;
          title: string;
          body: string | null;
          type: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: Partial<
          Database["public"]["Tables"]["notifications"]["Row"]
        > & { profile_id: string; title: string };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Row"]>;
        Relationships: [];
      };
      thank_you_messages: {
        Row: {
          id: string;
          beneficiary_id: string;
          sponsor_id: string | null;
          content: string;
          status: "pending" | "approved" | "rejected";
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
        };
        Insert: Partial<
          Database["public"]["Tables"]["thank_you_messages"]["Row"]
        > & { beneficiary_id: string; content: string };
        Update: Partial<
          Database["public"]["Tables"]["thank_you_messages"]["Row"]
        >;
        Relationships: [];
      };
      career_assessments: {
        Row: {
          id: string;
          beneficiary_id: string;
          answers: Record<string, unknown> | null;
          scores: Record<string, number> | null;
          top_clusters: string[] | null;
          ai_narrative: string | null;
          recommended_mentor_track: MentorTrack | null;
          created_at: string;
        };
        Insert: Partial<
          Database["public"]["Tables"]["career_assessments"]["Row"]
        > & { beneficiary_id: string };
        Update: Partial<
          Database["public"]["Tables"]["career_assessments"]["Row"]
        >;
        Relationships: [];
      };
      application_submissions: {
        Row: { id: string; ip_hash: string; created_at: string };
        Insert: Partial<
          Database["public"]["Tables"]["application_submissions"]["Row"]
        > & { ip_hash: string };
        Update: Partial<
          Database["public"]["Tables"]["application_submissions"]["Row"]
        >;
        Relationships: [];
      };
      safeguarding_concerns: {
        Row: {
          id: string;
          raised_by: string;
          match_id: string | null;
          beneficiary_id: string;
          description: string;
          status: "open" | "reviewing" | "closed";
          handled_by: string | null;
          handled_at: string | null;
          created_at: string;
        };
        Insert: Partial<
          Database["public"]["Tables"]["safeguarding_concerns"]["Row"]
        > & { raised_by: string; beneficiary_id: string; description: string };
        Update: Partial<
          Database["public"]["Tables"]["safeguarding_concerns"]["Row"]
        >;
        Relationships: [];
      };
    };
    Views: {
      sponsor_children: {
        Row: {
          id: string;
          first_name: string;
          age: number;
          current_stage: BeneficiaryStage;
          stage_updated_at: string | null;
          photo_url: string | null;
          support_needed: string[] | null;
          interests: string | null;
          aspirations: string | null;
          class_level: string | null;
        };
        Relationships: [];
      };
      mentee_profiles: {
        Row: {
          id: string;
          first_name: string;
          age: number;
          current_stage: BeneficiaryStage;
          stage_updated_at: string | null;
          photo_url: string | null;
          support_needed: string[] | null;
          interests: string | null;
          aspirations: string | null;
          class_level: string | null;
          edu_status: EduStatus | null;
          talents: string | null;
          subjects_skills: string | null;
          match_id: string;
        };
        Relationships: [];
      };
      mentor_requests: {
        Row: {
          match_id: string;
          beneficiary_id: string;
          first_name: string;
          age: number;
          interests: string | null;
          aspirations: string | null;
          class_level: string | null;
          consent_mentor: boolean;
          consent_guardian: boolean;
          created_at: string;
        };
        Relationships: [];
      };
      my_mentor_request: {
        Row: {
          match_id: string;
          full_name: string;
          profession: string | null;
          mentor_track: MentorTrack | null;
          consent_mentor: boolean;
          consent_guardian: boolean;
          created_at: string;
        };
        Relationships: [];
      };
      sponsor_donations: {
        Row: {
          id: string;
          amount: number;
          currency: string;
          purpose: string | null;
          receipt_sent: boolean;
          receipt_sent_at: string | null;
          created_at: string;
        };
        Relationships: [];
      };
      sponsor_child_support: {
        Row: {
          beneficiary_id: string;
          type: string;
          description: string | null;
          amount: number | null;
          given_at: string | null;
        };
        Relationships: [];
      };
      my_mentor: {
        Row: {
          full_name: string;
          profession: string | null;
          mentor_track: MentorTrack | null;
        };
        Relationships: [];
      };
      my_sponsor: {
        Row: { first_name: string };
        Relationships: [];
      };
      active_children_count: {
        Row: { total: number };
        Relationships: [];
      };
      project_funding: {
        Row: { project_id: string; raised: number };
        Relationships: [];
      };
      committee_lead: {
        Row: { full_name: string };
        Relationships: [];
      };
      public_beneficiaries: {
        Row: {
          id: string;
          first_name: string;
          age: number;
          current_stage: BeneficiaryStage;
          support_needed: string[] | null;
          photo_url: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      get_role: { Args: Record<string, never>; Returns: Role };
      get_mentor_id: { Args: Record<string, never>; Returns: string };
      get_sponsor_id: { Args: Record<string, never>; Returns: string };
      mark_thread_read: { Args: { p_match_id: string }; Returns: undefined };
    };
    Enums: Record<string, never>;
  };
};
