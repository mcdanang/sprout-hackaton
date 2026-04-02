"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";
import { OwnershipActionState } from "./ownership.types";
import { ownershipSchema } from "@/lib/validations/ownership";

export async function submitOwnershipSignal(
  _prevState: OwnershipActionState,
  formData: FormData
): Promise<OwnershipActionState> {
  const { userId } = await auth();

  if (!userId) {
    return {
      status: "error",
      message: "Unauthorized. Please sign in to submit a signal.",
    };
  }

  const rawData = {
    type: formData.get("type"),
    title: formData.get("title"),
    details: formData.get("details"),
    isAnonymous: formData.get("isAnonymous") === "on",
  };

  const validatedFields = ownershipSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      status: "error",
      message: "Please fix the errors in the form.",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { type, title, details, isAnonymous } = validatedFields.data;

  const supabase = await createClient();
  const { error } = await supabase.from("ownership_signals").insert({
    type,
    title: title.trim(),
    details: details.trim(),
    is_anonymous: isAnonymous,
    user_id: userId,
  });

  if (error) {
    return {
      status: "error",
      message: `Submission failed: ${error.message}`,
    };
  }

  revalidatePath("/dashboard");

  return {
    status: "success",
    message: "Signal submitted successfully.",
  };
}
