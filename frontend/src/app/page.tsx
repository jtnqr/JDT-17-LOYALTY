import { redirect } from "next/navigation";

export default function HomePage() {
  // Automatically redirect the root URL to /login
  redirect("/login");
}
