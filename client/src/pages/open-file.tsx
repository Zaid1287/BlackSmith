import { useEffect } from "react";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { useLocale } from "@/hooks/use-locale";

/**
 * This page handles the /open-file route from the manifest.json file_handlers
 * It's a temporary landing page that redirects to the home page
 */
export default function OpenFile() {
  const [, setLocation] = useLocation();
  const { t } = useLocale();

  useEffect(() => {
    // After a brief delay, redirect to the home page
    const timer = setTimeout(() => {
      setLocation("/");
    }, 1500);

    return () => clearTimeout(timer);
  }, [setLocation]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <h1 className="text-2xl font-bold mb-2">{t('common', 'opening_file')}</h1>
      <p className="text-muted-foreground">{t('common', 'redirecting')}</p>
    </div>
  );
}