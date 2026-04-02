"use client";

import React, { useActionState, useEffect, useRef } from "react";
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
import { cn } from "@/lib/utils";
import { Send } from "lucide-react";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className="gap-2">
      {pending ? "Submitting..." : (
        <>
          <Send className="h-4 w-4" />
          Submit Signal
        </>
      )}
    </Button>
  );
}

export function OwnershipForm() {
  const [state, formAction] = useActionState(
    submitOwnershipSignal,
    initialOwnershipActionState
  );

  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state.status]);

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl">Speak Up or Recognize a Peer</CardTitle>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={formAction} className="space-y-6">
          <div className="grid gap-2">
            <label htmlFor="type" className="text-sm font-semibold">
              Signal Type
            </label>
            <select
              id="type"
              name="type"
              className={cn(
                "h-10 rounded-md border bg-background px-3 text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none",
                state.errors?.type ? "border-destructive ring-destructive/20 ring-1" : "border-input"
              )}
              defaultValue="concern"
            >
              <option value="concern">Concern / Risk</option>
              <option value="recognition">Recognition / Positive Ownership</option>
            </select>
            {state.errors?.type && (
              <p className="text-xs font-medium text-destructive">{state.errors.type[0]}</p>
            )}
          </div>

          <div className="grid gap-2">
            <label htmlFor="title" className="text-sm font-semibold">
              Title
            </label>
            <Input
              id="title"
              name="title"
              placeholder="Example: Blocker in API dependency"
              className={cn(
                "focus-visible:ring-primary/20",
                state.errors?.title && "border-destructive ring-destructive/20 ring-1"
              )}
            />
            {state.errors?.title && (
              <p className="text-xs font-medium text-destructive">{state.errors.title[0]}</p>
            )}
          </div>

          <div className="grid gap-2">
            <label htmlFor="details" className="text-sm font-semibold">
              Details
            </label>
            <Textarea
              id="details"
              name="details"
              placeholder="Add enough context so others can take action."
              rows={5}
              className={cn(
                "resize-none focus-visible:ring-primary/20",
                state.errors?.details && "border-destructive ring-destructive/20 ring-1"
              )}
            />
            {state.errors?.details && (
              <p className="text-xs font-medium text-destructive">{state.errors.details[0]}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              id="isAnonymous"
              name="isAnonymous" 
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="isAnonymous" className="text-sm font-medium cursor-pointer">
              Submit anonymously
            </label>
          </div>

          <div className="pt-2">
            <div className="flex items-center gap-4">
              <SubmitButton />
              {state.status !== "idle" && (
                <Badge 
                  variant={state.status === "success" ? "default" : "destructive"}
                  className="px-3 py-1"
                >
                  {state.message}
                </Badge>
              )}
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
