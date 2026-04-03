import { AccountSwitchLogin } from "@/components/account-switch/account-switch-login";
import { Button } from "@/components/ui/button";
import { SignInButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { Plus } from "lucide-react";
import Image from "next/image";
import { redirect } from "next/navigation";

import { getAccountPersonaFromCookie, isAccountSwitchEnabled } from "@/lib/effective-employee";

export default async function Home() {
	const { userId } = await auth();

	if (userId) {
		redirect("/dashboard");
	}

	const accountSwitchEnabled = isAccountSwitchEnabled();
	const accountPersona = accountSwitchEnabled ? await getAccountPersonaFromCookie() : null;

	return (
		<main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-6 py-12">
			<section className="w-full max-w-md text-center">
				<div className="mx-auto mb-6 flex items-center justify-center">
					<Image src="/signal_logo_long.png" alt="Project Signal logo" width={240} height={120} />
				</div>

				<p className="mt-3 text-muted-foreground">Safe, transparent workplace platform</p>

				<div className="mt-10 rounded-2xl border bg-card p-6 shadow-sm">
					<h2 className="text-2xl font-semibold">Sign in with Microsoft Teams</h2>
					<p className="mt-2 text-sm text-muted-foreground">Secure access for company employees</p>

					<SignInButton mode="modal">
						<Button className="mt-6 h-12 w-full text-base font-semibold cursor-pointer">
							<span className="inline-flex items-center">
								<Plus className="mr-2 h-5 w-5" />
								Sign in with Teams
							</span>
						</Button>
					</SignInButton>
					{accountSwitchEnabled ? (
						<AccountSwitchLogin initialPersona={accountPersona} />
					) : null}
				</div>
			</section>
		</main>
	);
}
