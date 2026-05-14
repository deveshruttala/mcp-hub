/**
 * Login page — server component.
 *
 * Resolves auth-provider availability server-side (no env leak to the client)
 * and hands the flags to the interactive `<LoginForm />`.
 */

import { GOOGLE_AUTH_ENABLED, EMAIL_AUTH_ENABLED } from "@/auth";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return <LoginForm googleEnabled={GOOGLE_AUTH_ENABLED} emailEnabled={EMAIL_AUTH_ENABLED} />;
}
