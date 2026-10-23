// Admin two-factor sign-in is a switch, read from ADMIN_MFA_REQUIRED at request
// time. ONLY the exact value "true" turns it on; unset, "false", "TRUE", "1" or
// anything else means off. (A typo should never silently half-enable it.)
//
// Off: an admin signs in with email and password alone and nothing asks for a
// second factor. On: every admin page, admin Server Action and admin download
// needs a session that has passed the authenticator-app check.
//
// The two-factor screens (/admin-2fa) and the enrolment code stay in place in
// both modes, so an admin can turn on their own two-factor voluntarily.
export function isAdminMfaRequired(): boolean {
  return process.env.ADMIN_MFA_REQUIRED === "true";
}
