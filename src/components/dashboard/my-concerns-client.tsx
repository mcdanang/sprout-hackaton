"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { ChatLines, Plus, Xmark } from "iconoir-react";
import { AlertCircle, CheckCircle2, Clock, User } from "lucide-react";

import { createConcern } from "@/app/actions/concerns";
import { initialConcernActionState, type MyConcernItem } from "@/app/actions/concerns.types";
import { SIGNAL_ISSUE_CATEGORIES } from "@/lib/signal-ai";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Props = {
	initialConcerns: MyConcernItem[];
	organizations: { id: string; name: string }[];
	employees: { id: string; full_name: string }[];
};

function formatDate(iso: string, locale: string) {
	return new Intl.DateTimeFormat(locale === "id" ? "id-ID" : "en", {
		month: "short",
		day: "numeric",
		year: "numeric",
	}).format(new Date(iso));
}

function formatReplyRole(roleName: string | null) {
	if (!roleName) return "";
	if (roleName === "TOP MANAGEMENT") return "Management";
	return roleName;
}

function StatusBadge({ status }: { status: MyConcernItem["status"] }) {
	const t = useTranslations("Dashboard.concerns");
	if (status === "closed") {
		return (
			<span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800">
				<CheckCircle2 className="mr-1 size-3.5" />
				{t("statusClosed")}
			</span>
		);
	}
	if (status === "in_progress") {
		return (
			<span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-900">
				<Clock className="mr-1 size-3.5" />
				{t("statusInProgress")}
			</span>
		);
	}
	return (
		<span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-800">
			<AlertCircle className="mr-1 size-3.5" />
			{t("statusOpen")}
		</span>
	);
}

function ConcernCard({ item }: { item: MyConcernItem }) {
	const t = useTranslations("Dashboard.concerns");
	const locale = useLocale();
	const [open, setOpen] = useState(false);

	return (
		<article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
				<div className="flex flex-wrap items-center gap-2">
					<span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
						{item.issueCategory}
					</span>
					<span className="text-sm text-slate-600">{item.targetLabel}</span>
				</div>
				<StatusBadge status={item.status} />
			</div>

			<p className="mt-4 text-[15px] leading-relaxed text-slate-900">{item.details}</p>

			<div className="mt-3 flex items-center gap-1.5 text-sm text-slate-500">
				<Clock className="size-4 shrink-0" />
				<time dateTime={item.createdAt}>{formatDate(item.createdAt, locale)}</time>
				{item.isAnonymous ? (
					<span className="ml-2 rounded-md bg-amber-50 px-2 py-0.5 text-xs text-amber-900">
						{t("submittedAnonymous")}
					</span>
				) : null}
			</div>

			{item.replies.length > 0 ? (
				<div className="mt-4 border-t border-slate-100 pt-4">
					<button
						type="button"
						onClick={() => setOpen(o => !o)}
						className="flex w-full items-center gap-2 text-left text-sm font-medium text-slate-800 hover:text-slate-950"
					>
						<User className="size-4 shrink-0 text-slate-500" />
						{t("repliesCount", { count: item.replies.length })}
					</button>
					{open ? (
						<ul className="mt-3 space-y-3">
							{item.replies.map(r => (
								<li
									key={r.id}
									className="rounded-xl border border-amber-100 bg-amber-50/60 p-4 text-sm leading-relaxed text-slate-800"
								>
									<div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
										<span className="font-semibold text-slate-900">
											{r.authorName}
											{r.roleName ? (
												<span className="font-normal text-slate-600">
													{" "}
													({formatReplyRole(r.roleName)})
												</span>
											) : null}
										</span>
										<time className="text-xs text-slate-500" dateTime={r.createdAt}>
											{formatDate(r.createdAt, locale)}
										</time>
									</div>
									<p>{r.content}</p>
								</li>
							))}
						</ul>
					) : null}
				</div>
			) : null}
		</article>
	);
}

function SubmitConcernModal({
	open,
	onClose,
	organizations,
	employees,
}: {
	open: boolean;
	onClose: () => void;
	organizations: { id: string; name: string }[];
	employees: { id: string; full_name: string }[];
}) {
	const t = useTranslations("Dashboard.concerns");
	const locale = useLocale();
	const router = useRouter();
	const [visibility, setVisibility] = useState<"management" | "division" | "person">("management");
	const [formKey, setFormKey] = useState(0);

	const [state, formAction, isPending] = useActionState(createConcern, initialConcernActionState);
	const successHandled = useRef(false);

	useEffect(() => {
		if (!open) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [open, onClose]);

	useEffect(() => {
		if (state.status === "success" && !successHandled.current) {
			successHandled.current = true;
			toast.success(state.message);
			setFormKey(k => k + 1);
			setVisibility("management");
			onClose();
			router.refresh();
		} else if (state.status === "error" && state.message) {
			toast.error(state.message);
		}
		if (state.status === "idle") {
			successHandled.current = false;
		}
	}, [state.status, state.message, onClose, router]);

	if (!open) return null;

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[1px]"
			role="dialog"
			aria-modal="true"
			aria-labelledby="submit-concern-title"
		>
			<button
				type="button"
				className="absolute inset-0 cursor-default"
				aria-label={t("closeModal")}
				onClick={onClose}
			/>
			<div
				className="relative z-10 w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
				onClick={e => e.stopPropagation()}
			>
				<div className="mb-6 flex items-start justify-between gap-4">
					<h2 id="submit-concern-title" className="text-xl font-bold tracking-tight text-slate-900">
						{t("modalTitle")}
					</h2>
					<button
						type="button"
						onClick={onClose}
						className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
						aria-label={t("closeModal")}
					>
						<Xmark className="size-5" />
					</button>
				</div>

				<form key={formKey} action={formAction} className="space-y-5">
					<input type="hidden" name="locale" value={locale} />

					<div>
						<label
							htmlFor="issueCategory"
							className="mb-1.5 block text-sm font-medium text-slate-800"
						>
							{t("categoryLabel")}
						</label>
						<select
							id="issueCategory"
							name="issueCategory"
							required
							className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
							defaultValue=""
						>
							<option value="" disabled>
								{t("categoryPlaceholder")}
							</option>
							{SIGNAL_ISSUE_CATEGORIES.map(c => (
								<option key={c} value={c}>
									{c}
								</option>
							))}
						</select>
					</div>

					<div>
						<p className="mb-2 text-sm font-medium text-slate-800">{t("visibilityLabel")}</p>
						<div className="space-y-2">
							{(
								[
									["management", t("visibilityManagement")],
									["division", t("visibilityDivision")],
									["person", t("visibilityPerson")],
								] as const
							).map(([value, label]) => (
								<label
									key={value}
									className={cn(
										"flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors",
										visibility === value
											? "border-slate-900 bg-slate-50"
											: "border-slate-200 hover:border-slate-300",
									)}
								>
									<input
										type="radio"
										name="visibility"
										value={value}
										checked={visibility === value}
										onChange={() => setVisibility(value)}
										className="size-4 border-slate-300 text-slate-900"
									/>
									<span className="font-medium text-slate-900">{label}</span>
								</label>
							))}
						</div>
					</div>

					{visibility === "division" ? (
						<div>
							<label
								htmlFor="organizationId"
								className="mb-1.5 block text-sm font-medium text-slate-800"
							>
								{t("divisionLabel")}
							</label>
							<select
								id="organizationId"
								name="organizationId"
								className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
								defaultValue=""
							>
								<option value="">{t("divisionPlaceholder")}</option>
								{organizations.map(o => (
									<option key={o.id} value={o.id}>
										{o.name}
									</option>
								))}
							</select>
						</div>
					) : null}

					{visibility === "person" ? (
						<div>
							<label
								htmlFor="targetEmployeeId"
								className="mb-1.5 block text-sm font-medium text-slate-800"
							>
								{t("personLabel")}
							</label>
							<select
								id="targetEmployeeId"
								name="targetEmployeeId"
								className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
								defaultValue=""
							>
								<option value="">{t("personPlaceholder")}</option>
								{employees.map(e => (
									<option key={e.id} value={e.id}>
										{e.full_name}
									</option>
								))}
							</select>
						</div>
					) : null}

					{visibility === "management" ? (
						<input type="hidden" name="organizationId" value="" />
					) : null}
					{visibility === "management" ? (
						<input type="hidden" name="targetEmployeeId" value="" />
					) : null}
					{visibility === "division" ? (
						<input type="hidden" name="targetEmployeeId" value="" />
					) : null}
					{visibility === "person" ? <input type="hidden" name="organizationId" value="" /> : null}

					<div>
						<label htmlFor="details" className="mb-1.5 block text-sm font-medium text-slate-800">
							{t("descriptionLabel")}
						</label>
						<Textarea
							id="details"
							name="details"
							required
							rows={5}
							placeholder={t("descriptionPlaceholder")}
							className="min-h-[120px] resize-y rounded-xl border-slate-200"
						/>
					</div>

					<div className="rounded-xl border border-amber-100 bg-amber-50/80 px-4 py-3">
						<label className="flex cursor-pointer items-start gap-3">
							<input
								type="checkbox"
								name="isAnonymous"
								className="mt-1 size-4 rounded border-slate-300"
							/>
							<span>
								<span className="block text-sm font-medium text-slate-900">
									{t("anonymousLabel")}
								</span>
								<span className="text-xs text-slate-600">{t("anonymousHint")}</span>
							</span>
						</label>
					</div>

					<div className="flex justify-end gap-3 pt-2">
						<Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
							{t("cancel")}
						</Button>
						<Button
							type="submit"
							disabled={isPending}
							className="bg-slate-900 text-white hover:bg-slate-900/90"
						>
							{isPending ? t("submitting") : t("submit")}
						</Button>
					</div>
				</form>
			</div>
		</div>
	);
}

export function MyConcernsClient({ initialConcerns, organizations, employees }: Props) {
	const t = useTranslations("Dashboard.concerns");
	const [modalOpen, setModalOpen] = useState(false);

	return (
		<div className="mx-auto max-w-3xl space-y-8 pb-16">
			<header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div className="space-y-2">
					<div className="flex items-center gap-2 text-muted-foreground">
						<ChatLines className="h-4 w-4" />
						<span className="text-sm font-medium uppercase tracking-wider">{t("eyebrow")}</span>
					</div>
					<h1 className="font-plus-jakarta text-3xl font-bold tracking-tight text-slate-900">
						{t("title")}
					</h1>
					<p className="max-w-xl text-base text-slate-600">{t("subtitle")}</p>
				</div>
				<Button
					type="button"
					onClick={() => setModalOpen(true)}
					className="shrink-0 gap-2 bg-slate-900 text-white hover:bg-slate-900/90"
				>
					<Plus className="size-4" />
					{t("submitCta")}
				</Button>
			</header>

			{initialConcerns.length === 0 ? (
				<div className="mt-4 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/50 px-6 py-20 text-center">
					<ChatLines className="mb-4 h-12 w-12 text-slate-300" />
					<h3 className="text-lg font-semibold text-slate-700">{t("emptyTitle")}</h3>
					<p className="mt-2 max-w-sm text-sm text-slate-500">{t("emptyHint")}</p>
					<Button
						type="button"
						className="mt-6 gap-2 bg-slate-900 text-white hover:bg-slate-900/90"
						onClick={() => setModalOpen(true)}
					>
						<Plus className="size-4" />
						{t("submitCta")}
					</Button>
				</div>
			) : (
				<ul className="space-y-4">
					{initialConcerns.map(item => (
						<li key={item.id}>
							<ConcernCard item={item} />
						</li>
					))}
				</ul>
			)}

			<SubmitConcernModal
				open={modalOpen}
				onClose={() => setModalOpen(false)}
				organizations={organizations}
				employees={employees}
			/>
		</div>
	);
}
