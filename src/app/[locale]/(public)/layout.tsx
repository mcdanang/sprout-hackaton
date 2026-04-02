import { SignInButton, Show, UserButton } from "@clerk/nextjs";
import { Link } from "@/i18n/routing";
import Image from "next/image";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useTranslations } from "next-intl";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations("Common");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex justify-between items-center p-4 h-16 border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center overflow-hidden">
            <Image 
              src="/signal_logo.svg" 
              alt="Signal Logo" 
              width={32} 
              height={32} 
              className="object-contain"
            />
          </div>
          <span className="font-open-sans text-[20px] font-bold leading-[27px] text-[#081021]">
            Signal
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          <Show when="signed-out">
            <SignInButton mode="modal"><button className="text-sm font-medium px-4 py-2 rounded-full hover:bg-muted transition-colors">{t("signIn")}</button></SignInButton>
          </Show>
          <Show when="signed-in">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                {t("dashboard")}
              </Link>
              <UserButton />
            </div>
          </Show>
        </div>
      </header>
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
}
