/**
 * /demo/david-rose-romantic/setup
 * Redirects to the wizard (/edit) which handles all setup steps.
 */
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function DemoSetupPage() {
  const [, navigate] = useLocation();
  useEffect(() => { navigate("/demo/david-rose-romantic/edit", { replace: true }); }, [navigate]);
  return null;
}
