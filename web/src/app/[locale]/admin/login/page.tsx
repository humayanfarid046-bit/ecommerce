import { redirect } from "next/navigation";

export default function AccessLoginRedirectPage() {
  redirect("/login");
}
