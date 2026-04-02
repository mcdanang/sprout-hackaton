export type ConcernActionState = {
	status: "idle" | "success" | "error";
	message: string;
	errors?: Record<string, string[]>;
};

export const initialConcernActionState: ConcernActionState = {
	status: "idle",
	message: "",
};

export type MyConcernReply = {
	id: string;
	content: string;
	createdAt: string;
	authorName: string;
	roleName: string | null;
};

export type MyConcernItem = {
	id: string;
	details: string;
	issueCategory: string;
	createdAt: string;
	isAnonymous: boolean;
	targetLabel: string;
	status: "open" | "in_progress" | "closed";
	replies: MyConcernReply[];
};
