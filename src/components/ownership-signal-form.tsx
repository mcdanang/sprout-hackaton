"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  submitOwnershipSignal,
} from "@/app/actions/ownership";
import {
  initialOwnershipActionState,
} from "@/app/actions/ownership.types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Submitting..." : "Submit Signal"}
    </Button>
  );
}

export function OwnershipSignalForm() {
  const [state, formAction] = useActionState(
    submitOwnershipSignal,
    initialOwnershipActionState
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Speak Up or Recognize a Peer</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="grid gap-2">
            <label htmlFor="type" className="text-sm font-medium">
              Signal Type
            </label>
            <select
              id="type"
              name="type"
              className="h-10 rounded-md border px-3 text-sm"
              defaultValue="concern"
            >
              <option value="concern">Concern / Risk</option>
              <option value="recognition">Recognition / Positive Ownership</option>
            </select>
          </div>

          <div className="grid gap-2">
            <label htmlFor="title" className="text-sm font-medium">
              Title
            </label>
            <Input
              id="title"
              name="title"
              placeholder="Example: Blocker in API dependency"
              required
            />
          </div>

          <div className="grid gap-2">
            <label htmlFor="details" className="text-sm font-medium">
              Details
            </label>
            <Textarea
              id="details"
              name="details"
              placeholder="Add enough context so others can take action."
              rows={5}
              required
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isAnonymous" />
            Submit anonymously
          </label>

          <div className="flex items-center gap-3">
            <SubmitButton />
            {state.status !== "idle" ? (
              <Badge variant={state.status === "success" ? "default" : "destructive"}>
                {state.message}
              </Badge>
            ) : null}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
