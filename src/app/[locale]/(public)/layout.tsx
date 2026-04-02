import { useTranslations } from "next-intl";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
	const t = useTranslations("Common");

	return (
		<div className="flex min-h-screen flex-col">
			<main className="flex-1 flex flex-col">{children}</main>
		</div>
	);
}
