export type OwnershipActionState = {
  status: "idle" | "success" | "error";
  message: string;
  errors?: {
    type?: string[];
    title?: string[];
    details?: string[];
  };
};

export const initialOwnershipActionState: OwnershipActionState = {
  status: "idle",
  message: "",
};
