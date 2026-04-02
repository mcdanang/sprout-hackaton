export type OwnershipActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

export const initialOwnershipActionState: OwnershipActionState = {
  status: "idle",
  message: "",
};
