/**
 * Login page — server component.
 *
 * Resolves `GOOGLE_AUTH_ENABLED` server-side (no env leak to the client) and
 * hands the flag to the interactive `<LoginForm />` client component.
 */

import { GOOGLE_AUTH_ENABLED } from "@/auth";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return <LoginForm googleEnabled={GOOGLE_AUTH_ENABLED} />;
}
