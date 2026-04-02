export type OwnershipActionState = {
  status: "idle" | "success" | "error";
  message: string;
  errors?: Record<string, string[]>;
};

export const initialOwnershipActionState: OwnershipActionState = {
  status: "idle",
  message: "",
};
