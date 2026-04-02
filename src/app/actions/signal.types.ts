export type SignalActionState = {
	status: "idle" | "success" | "error";
	message: string;
	errors?: Record<string, string[]>;
};

export const initialSignalActionState: SignalActionState = {
	status: "idle",
	message: "",
};

export type SignalRecord = {
	id: string;
	authorEmployeeId: string;
	isAnonymous: boolean;
	category: string;
	title: string;
	details: string;
	projectId: string | null;
	isPublic: boolean;
	createdAt: string;
};
