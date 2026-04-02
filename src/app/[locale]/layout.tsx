import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono, Open_Sans, Plus_Jakarta_Sans } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "../globals.css";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

const openSans = Open_Sans({
	variable: "--font-open-sans",
	subsets: ["latin"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
	variable: "--font-plus-jakarta",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Signal Ownership Platform",
	description: "A safe internal platform for speaking up and recognizing positive ownership.",
};

export default async function RootLayout({
	children,
	params,
}: {
	children: React.ReactNode;
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;

	// Ensure that the incoming `locale` is valid
	if (!routing.locales.includes(locale as Locale)) {
		notFound();
	}

	// Providing all messages to the client
	// side is the easiest way to get started
	const messages = await getMessages();

	return (
		<ClerkProvider>
			<html
				lang={locale}
				className={`${geistSans.variable} ${geistMono.variable} ${openSans.variable} ${plusJakartaSans.variable} h-full antialiased`}
			>
				<body className="min-h-full flex flex-col">
					<NextIntlClientProvider messages={messages}>
						<TooltipProvider>
							{children}
							<Toaster position="top-right" />
						</TooltipProvider>
					</NextIntlClientProvider>
				</body>
			</html>
		</ClerkProvider>
	);
}
