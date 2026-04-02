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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Send } from "lucide-react";
import { useTranslations } from "next-intl";

function SubmitButton() {
  const { pending } = useFormStatus();
  const t = useTranslations("Form");

  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-10",
      )}
    >
      {pending ? t("submitting") : (
        <>
          <Send className="h-4 w-4" />
          {t("submit")}
        </>
      )}
    </button>
  );
}

export function OwnershipForm() {
  const t = useTranslations("Form");
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
    <Card className="shadow-sm border-muted/50">
      <CardHeader>
        <CardTitle className="text-xl font-bold tracking-tight">
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={formAction} className="space-y-6">
          <div className="grid gap-2">
            <label htmlFor="type" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/80">
              {t("type")}
            </label>
            <select
              id="type"
              name="type"
              className={cn(
                "h-10 rounded-md border bg-background px-3 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all",
                state.errors?.type ? "border-destructive ring-destructive/20 ring-1" : "border-input hover:border-muted-foreground/30"
              )}
              defaultValue="concern"
            >
              <option value="concern">{t("typeConcern")}</option>
              <option value="recognition">{t("typeRecognition")}</option>
            </select>
            {state.errors?.type && (
              <p className="text-xs font-medium text-destructive">{state.errors.type[0]}</p>
            )}
          </div>

          <div className="grid gap-2">
            <label htmlFor="title" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/80">
              {t("titleLabel")}
            </label>
            <Input
              id="title"
              name="title"
              placeholder={t("titlePlaceholder")}
              className={cn(
                "h-10 font-medium transition-all focus-visible:ring-primary/20 hover:border-muted-foreground/30",
                state.errors?.title && "border-destructive ring-destructive/20 ring-1"
              )}
            />
            {state.errors?.title && (
              <p className="text-xs font-medium text-destructive">{state.errors.title[0]}</p>
            )}
          </div>

          <div className="grid gap-2">
            <label htmlFor="details" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/80">
              {t("detailsLabel")}
            </label>
            <Textarea
              id="details"
              name="details"
              placeholder={t("detailsPlaceholder")}
              rows={5}
              className={cn(
                "resize-none font-medium transition-all focus-visible:ring-primary/20 hover:border-muted-foreground/30",
                state.errors?.details && "border-destructive ring-destructive/20 ring-1"
              )}
            />
            {state.errors?.details && (
              <p className="text-xs font-medium text-destructive">{state.errors.details[0]}</p>
            )}
          </div>

          <div className="flex items-center gap-3 bg-muted/30 p-3 rounded-lg border border-muted/50 group cursor-pointer hover:bg-muted/50 transition-colors">
            <input 
              type="checkbox" 
              id="isAnonymous"
              name="isAnonymous" 
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
            />
            <label htmlFor="isAnonymous" className="text-sm font-semibold cursor-pointer select-none">
              {t("anonymous")}
            </label>
          </div>

          <div className="pt-2">
            <div className="flex items-center gap-4">
              <SubmitButton />
              {state.status !== "idle" && (
                <Badge 
                  variant={state.status === "success" ? "default" : "destructive"}
                  className="px-3 py-1 font-semibold"
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
