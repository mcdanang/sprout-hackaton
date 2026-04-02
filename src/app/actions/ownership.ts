"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

import { OwnershipActionState } from "./ownership.types";

export async function submitOwnershipSignal(
  _prevState: OwnershipActionState,
  formData: FormData
): Promise<OwnershipActionState> {
  const type = formData.get("type");
  const title = formData.get("title");
  const details = formData.get("details");
  const isAnonymous = formData.get("isAnonymous") === "on";

  if (type !== "concern" && type !== "recognition") {
    return { status: "error", message: "Please choose a valid signal type." };
  }

  if (typeof title !== "string" || title.trim().length < 4) {
    return { status: "error", message: "Title must be at least 4 characters." };
  }

  if (typeof details !== "string" || details.trim().length < 10) {
    return {
      status: "error",
      message: "Details must be at least 10 characters for useful context.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("ownership_signals").insert({
    type,
    title: title.trim(),
    details: details.trim(),
    is_anonymous: isAnonymous,
  });

  if (error) {
    return {
      status: "error",
      message: `Submission failed: ${error.message}`,
    };
  }

  revalidatePath("/");

  return {
    status: "success",
    message: "Signal submitted successfully.",
  };
}
