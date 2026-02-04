"use client";

import LoadingButton from "@/components/LoadingButton";
import { PasswordInput } from "@/components/PasswordInput";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { loginSchema, LoginValues } from "@/lib/validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { login } from "./actions";
import DeletedAccountRecoveryDialog from "@/components/DeletedAccountRecoveryDialog";
import HoneypotInputs from "@/components/HoneypotInputs";

export default function LoginForm() {
  const [error, setError] = useState<string>();
  const [deletedAccountInfo, setDeletedAccountInfo] = useState<{
    username: string;
    password: string;
    deletedAt: Date;
    daysRemaining?: number;
    isExpired: boolean;
    userId: string;
  } | null>(null);

  const [isPending, startTransition] = useTransition();

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginValues) {
    setError(undefined);
    setDeletedAccountInfo(null);

    startTransition(async () => {
      try {
        // Create FormData for the login action
        const formData = new FormData();
        formData.append("username", values.username || "");
        formData.append("password", values.password);
        // Append honeypot fields
        if (values.website) formData.append("website", values.website);
        if (values.url) formData.append("url", values.url);
        if (values.phone) formData.append("phone", values.phone);
        if (values.formLoadedAt) formData.append("formLoadedAt", values.formLoadedAt.toString());

        const result = await login(formData);

        if (result?.error) {
          if (result.error === "ACCOUNT_DELETED_WITHIN_GRACE_PERIOD") {
            setDeletedAccountInfo({
              username: values.username || "",
              password: values.password,
              deletedAt: new Date(result.deletedAt || ""),
              daysRemaining: result.daysRemaining,
              isExpired: false,
              userId: result.userId || "",
            });
          } else if (result.error === "ACCOUNT_DELETED_EXPIRED") {
            setDeletedAccountInfo({
              username: values.username || "",
              password: values.password,
              deletedAt: new Date(result.deletedAt || ""),
              isExpired: true,
              userId: result.userId || "",
            });
          } else {
            setError(result.error);
          }
        }
        // If no error is returned, login was successful and redirect will happen
      } catch (error: any) {
        // Check if this is a Next.js redirect error (successful login)
        if (error?.digest?.includes('NEXT_REDIRECT')) {
          // This is a successful login - the redirect will happen automatically
          return;
        }
        // Handle other errors
        setError("An error occurred during login");
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        {error && <p className="text-center text-destructive">{error}</p>}
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username/Email</FormLabel>
              <FormControl>
                <Input placeholder="Username/Email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <PasswordInput placeholder="Password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <HoneypotInputs register={form.register} setValue={form.setValue} />
        <LoadingButton loading={isPending} type="submit" className="w-full">
          Log in
        </LoadingButton>
      </form>

      {deletedAccountInfo && (
        <DeletedAccountRecoveryDialog
          open={!!deletedAccountInfo}
          onOpenChange={(open) => !open && setDeletedAccountInfo(null)}
          username={deletedAccountInfo.username}
          password={deletedAccountInfo.password}
          deletedAt={deletedAccountInfo.deletedAt}
          daysRemaining={deletedAccountInfo.daysRemaining}
          isExpired={deletedAccountInfo.isExpired}
          userId={deletedAccountInfo.userId}
        />
      )}
    </Form>
  );
}
