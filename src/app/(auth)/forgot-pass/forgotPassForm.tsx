"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { resetPasswordSchema, resetPasswordValues } from "@/lib/validation";
import LoadingButton from "@/components/LoadingButton";
import { resendVerification } from "./actions";
import HoneypotInputs from "@/components/HoneypotInputs";

export default function ForgotPassForm() {
  const [error, setError] = useState<string>();
  const [message, setMessage] = useState<string>();
  const [isPending, startTransition] = useTransition();

  const form = useForm<resetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      credential: "",
    },
  });

  async function onSubmit(values: resetPasswordValues) {
    setError(undefined);
    setMessage(undefined);

    startTransition(async () => {
      const { credential } = values;
      const result = await resendVerification(values);

      if (result?.error) {
        setError(result.error);
      } else {
        setMessage(
          `Verification email sent! Check your inbox at ${credential}.`,
        );
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        {error && <p className="text-center text-red-500">{error}</p>}
        {message && <p className="text-center text-green-500">{message}</p>}

        <FormField
          control={form.control}
          name="credential"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username/Email</FormLabel>
              <FormControl>
                <Input placeholder="Enter your username or email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <HoneypotInputs register={form.register} setValue={form.setValue} />
        <LoadingButton loading={isPending} type="submit" className="w-full">
          Send Verification Email
        </LoadingButton>
      </form>
    </Form>
  );
}
