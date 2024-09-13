import LoadingButton from "@/components/LoadingButton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useUpdateEmailMutation, useUpdateProfileMutation } from "./mutations";
import { UpdateEmailValues, updateEmailSchema } from "@/lib/validation";

interface UpdateEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function UpdateEmailDialog({
  open,
  onOpenChange,
}: UpdateEmailDialogProps) {
  const form = useForm<UpdateEmailValues>({
    resolver: zodResolver(updateEmailSchema),
    defaultValues: {
      currentPassword: "",
      newEmail: "",
    },
  });

  const mutation = useUpdateEmailMutation();

  function handleClose() {
    form.reset({
      currentPassword: "",
      newEmail: "",
    });
    onOpenChange(false);
  }

  async function onSubmit(values: UpdateEmailValues) {
    mutation.mutate(values, {
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Email</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            {/* Current Password Field */}
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Enter current password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* New Email Field */}
            <FormField
              control={form.control}
              name="newEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Enter new email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <DialogFooter>
              <LoadingButton type="submit" loading={false}>
                Update Email
              </LoadingButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
