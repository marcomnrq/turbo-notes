import { redirect } from "next/navigation";

/**
 * Root route. The proxy.ts guard bounces users between /login and /notes based
 * on refresh-cookie presence; here we default authed users to the app and
 * everyone else to login.
 */
export default function Home() {
  redirect("/login");
}
