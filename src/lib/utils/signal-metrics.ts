import { analyzeSignalWithMockAI, SignalIssueCategory, clamp } from "@/lib/signal-ai";

export interface SignalMetricInput {
	project_id?: string | null;
	category: string | null;
	sentiment_score?: number | null;
	ai_issue_category?: SignalIssueCategory | null;
	concern_status?: string | null;
	title?: string | null;
	details?: string | null;
}

/**
 * Computes the average sentiment for a set of signals.
 * Filters out "closed" (resolved) concerns to ensure the score reflects active team state.
 */
export function computeAverageSentiment(signals: SignalMetricInput[]): number | null {
	let sentimentTotal = 0;
	let sentimentCount = 0;

	for (const s of signals) {
		// Skip resolved concerns for pulse metrics to reflect current health
		if (s.category === "concern" && s.concern_status === "closed") continue;

		const analyzed = analyzeSignalWithMockAI(s);
		const sentiment =
			typeof s.sentiment_score === "number" ? s.sentiment_score : analyzed.sentiment;

		sentimentTotal += sentiment;
		sentimentCount += 1;
	}

	return sentimentCount > 0 ? sentimentTotal / sentimentCount : null;
}

export interface ProjectHealthMetrics {
	health: number;
	healthStatus: "Healthy" | "Stable" | "At Risk";
	pulseDescription: string;
}

/**
 * Maps an average sentiment score to human-readable health status and descriptions.
 */
export function computeHealth(averageSentiment: number | null): ProjectHealthMetrics {
	const normalizedSentiment = Math.round(clamp(averageSentiment ?? 50, 0, 100));
	let healthStatus: ProjectHealthMetrics["healthStatus"];
	let pulseDescription: string;

	if (normalizedSentiment >= 75) {
		healthStatus = "Healthy";
		pulseDescription = "High psychological safety. Team is thriving and showing strong ownership.";
	} else if (normalizedSentiment >= 50) {
		healthStatus = "Stable";
		pulseDescription =
			"Balanced team dynamics. Communication is steady but room for more proactive engagement.";
	} else if (normalizedSentiment >= 35) {
		healthStatus = "Stable"; // Still stable but on the edge
		pulseDescription = "Sentiment is softening. Monitor for potential blockers or team fatigue.";
	} else {
		healthStatus = "At Risk";
		pulseDescription =
			"Low psychological safety detected. Immediate attention to team concerns recommended.";
	}

	return {
		health: normalizedSentiment,
		healthStatus,
		pulseDescription,
	};
}
