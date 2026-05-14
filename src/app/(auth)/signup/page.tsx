/** Signup page — server component. See `login/page.tsx` for the rationale. */

import { GOOGLE_AUTH_ENABLED } from "@/auth";
import { SignupForm } from "./signup-form";

export default function SignupPage() {
  return <SignupForm googleEnabled={GOOGLE_AUTH_ENABLED} />;
}
