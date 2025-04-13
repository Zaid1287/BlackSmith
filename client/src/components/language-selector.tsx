import { CheckIcon, ChevronDownIcon, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocale, LocaleOption, localeNames } from "@/hooks/use-locale";
import { cn } from "@/lib/utils";

interface LanguageSelectorProps {
  collapsed?: boolean;
}

export function LanguageSelector({ collapsed = false }: LanguageSelectorProps) {
  const { locale, setLocale } = useLocale();

  const handleLocaleChange = (newLocale: LocaleOption) => {
    setLocale(newLocale);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={collapsed ? "icon" : "sm"}
          className={cn(
            "text-white hover:bg-white/10",
            collapsed ? "w-10 p-0" : "w-full justify-start"
          )}
        >
          <Globe className={cn("h-4 w-4", collapsed ? "" : "mr-2")} />
          {!collapsed && (
            <>
              <span className="mr-1">{localeNames[locale]}</span>
              <ChevronDownIcon className="ml-auto h-4 w-4 opacity-70" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        {Object.entries(localeNames).map(([localeKey, localeName]) => (
          <DropdownMenuItem
            key={localeKey}
            className={cn(
              "flex cursor-pointer items-center justify-between",
              locale === localeKey && "font-bold"
            )}
            onClick={() => handleLocaleChange(localeKey as LocaleOption)}
          >
            {localeName}
            {locale === localeKey && <CheckIcon className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}