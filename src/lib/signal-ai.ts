export type SignalIssueCategory =
	| "Burnout Alert"
	| "Scope Creep"
	| "Process Bottleneck"
	| "Communication Gap"
	| "Technical Debt"
	| "Micro-management"
	| "Professional Growth"
	| "Office Environment"
	| "others";

export const SIGNAL_ISSUE_CATEGORIES: SignalIssueCategory[] = [
	"Burnout Alert",
	"Scope Creep",
	"Process Bottleneck",
	"Communication Gap",
	"Technical Debt",
	"Micro-management",
	"Professional Growth",
	"Office Environment",
	"others",
];

export function clamp(n: number, min: number, max: number) {
	return Math.max(min, Math.min(max, n));
}

export function categorizeSignalMock(rawText: string): SignalIssueCategory {
	const text = rawText.toLowerCase();
	if (/(burnout|overwork|exhaust|fatigue|stress)/.test(text)) return "Burnout Alert";
	if (/(scope|requirement|rework|changing target|unclear target)/.test(text)) return "Scope Creep";
	if (/(blocker|bottleneck|approval|slow process|dependency delay)/.test(text))
		return "Process Bottleneck";
	if (/(miscommunicat|communication|alignment|handoff|unclear brief)/.test(text))
		return "Communication Gap";
	if (/(tech debt|legacy|refactor|fragile code|workaround)/.test(text)) return "Technical Debt";
	if (/(micromanage|micro-manage|too much control|no autonomy)/.test(text))
		return "Micro-management";
	if (/(mentorship|learning|growth|career|promotion|skill)/.test(text))
		return "Professional Growth";
	if (/(office|workspace|facility|noise|remote setup|environment)/.test(text))
		return "Office Environment";
	return "others";
}

export function analyzeSignalWithMockAI(signal: {
	category: string | null;
	title?: string | null;
	details?: string | null;
}): { sentiment: number; issueCategory: SignalIssueCategory } {
	const rawText = `${signal.title ?? ""} ${signal.details ?? ""}`;
	const issueCategory = categorizeSignalMock(rawText);

	let baseSentiment = 50;
	if (signal.category === "achievement") baseSentiment = 78;
	if (signal.category === "appreciation") baseSentiment = 82;
	if (signal.category === "concern") baseSentiment = 32;

	const text = rawText.toLowerCase();
	if (/(blocked|delay|risk|issue|problem|conflict|unclear|late)/.test(text)) baseSentiment -= 10;
	if (/(resolved|improved|great|success|supportive|helpful|efficient)/.test(text))
		baseSentiment += 10;
	if (issueCategory === "Burnout Alert" || issueCategory === "Micro-management") baseSentiment -= 8;
	if (issueCategory === "Professional Growth") baseSentiment += 8;

	return { sentiment: Math.round(clamp(baseSentiment, 0, 100)), issueCategory };
}

/** Sentiment for a concern when the user picks the issue category (not inferred from text). */
export function computeConcernSentimentFromIssueCategory(
	issueCategory: SignalIssueCategory,
	details: string,
): number {
	const text = details.toLowerCase();
	let baseSentiment = 32;
	if (/(blocked|delay|risk|issue|problem|conflict|unclear|late)/.test(text)) baseSentiment -= 10;
	if (/(resolved|improved|great|success|supportive|helpful|efficient)/.test(text))
		baseSentiment += 10;
	if (issueCategory === "Burnout Alert" || issueCategory === "Micro-management") baseSentiment -= 8;
	if (issueCategory === "Professional Growth") baseSentiment += 8;

	return Math.round(clamp(baseSentiment, 0, 100));
}
