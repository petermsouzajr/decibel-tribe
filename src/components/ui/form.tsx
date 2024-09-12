"use client";

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { Slot } from "@radix-ui/react-slot";
import {
  Controller,
  ControllerProps,
  FieldPath,
  FieldValues,
  FormProvider,
  useFormContext,
} from "react-hook-form";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

const Form = FormProvider;

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
};

const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue,
);

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
};

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);
  const { getFieldState, formState } = useFormContext();

  const fieldState = getFieldState(fieldContext.name, formState);

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>");
  }

  const { id } = itemContext;

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  };
};

type FormItemContextValue = {
  id: string;
};

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue,
);

const FormItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const id = React.useId();

  return (
    <FormItemContext.Provider value={{ id }}>
      <div ref={ref} className={cn("space-y-2", className)} {...props} />
    </FormItemContext.Provider>
  );
});
FormItem.displayName = "FormItem";

const FormLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => {
  const { error, formItemId } = useFormField();

  return (
    <Label
      ref={ref}
      className={cn(error && "text-destructive", className)}
      htmlFor={formItemId}
      {...props}
    />
  );
});
FormLabel.displayName = "FormLabel";

const FormControl = React.forwardRef<
  React.ElementRef<typeof Slot>,
  React.ComponentPropsWithoutRef<typeof Slot>
>(({ ...props }, ref) => {
  const { error, formItemId, formDescriptionId, formMessageId } =
    useFormField();

  return (
    <Slot
      ref={ref}
      id={formItemId}
      aria-describedby={
        !error
          ? `${formDescriptionId}`
          : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!error}
      {...props}
    />
  );
});
FormControl.displayName = "FormControl";

const FormButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "destructive";
  }
>(({ className, variant = "primary", ...props }, ref) => {
  const baseStyles =
    "rounded-md px-4 py-2 text-sm font-medium focus:outline-none";

  const variantStyles = {
    primary: "bg-primary text-white hover:bg-primary-dark",
    secondary: "border text-gray-600 hover:bg-gray-100",
    destructive: "bg-red-500 text-white hover:bg-red-600",
  };

  const combinedStyles = cn(baseStyles, variantStyles[variant], className);

  return <button ref={ref} className={combinedStyles} {...props} />;
});

FormButton.displayName = "FormButton";

const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { formDescriptionId } = useFormField();

  return (
    <p
      ref={ref}
      id={formDescriptionId}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
});
FormDescription.displayName = "FormDescription";

const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  const { error, formMessageId } = useFormField();
  const body = error ? String(error?.message) : children;

  if (!body) {
    return null;
  }

  return (
    <p
      ref={ref}
      id={formMessageId}
      className={cn("text-sm font-medium text-destructive", className)}
      {...props}
    >
      {body}
    </p>
  );
});
FormMessage.displayName = "FormMessage";

const FormSwitch = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    value: string;
    onChange: (value: string) => void;
    values: [string, string];
  }
>(({ className, value, onChange, values, ...props }, ref) => {
  const [firstValue, secondValue] = values;
  const isFirstValue = value === secondValue;

  const handleClick = () => {
    onChange(isFirstValue ? firstValue : secondValue);
  };

  return (
    <div
      className={`flex h-10 flex-col items-center justify-center rounded-md border`}
    >
      <div className="flex w-full justify-around">
        {/* Left Value Label */}
        <span
          className={`w-16 cursor-pointer text-muted-foreground ${!isFirstValue ? "font-bold underline" : "opacity-80"}`}
          onClick={handleClick}
        >
          {firstValue}
        </span>

        {/* Toggle Button */}
        <button
          ref={ref}
          type="button"
          role="switch"
          aria-checked={isFirstValue}
          onClick={handleClick}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out ${isFirstValue ? "bg-primary" : "bg-muted-foreground"}`}
          {...props}
        >
          <span className="sr-only">Toggle Visibility</span>
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${isFirstValue ? "translate-x-6" : "translate-x-1"}`}
          />
        </button>

        {/* Right Value Label */}
        <span
          className={`w-16 cursor-pointer text-primary ${isFirstValue ? "font-bold underline" : "opacity-80"}`}
          onClick={handleClick}
        >
          {secondValue}
        </span>
      </div>
    </div>
  );
});
FormSwitch.displayName = "FormSwitch";

interface FormCheckboxProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  uncheckedLabel?: string;
  checkedLabel?: string;
}

const FormCheckbox = React.forwardRef<HTMLInputElement, FormCheckboxProps>(
  (
    {
      className,
      uncheckedLabel = "Unchecked",
      checkedLabel = "Checked",
      checked,
      ...props
    },
    ref,
  ) => {
    return (
      <div className="flex items-center p-5">
        <div className="flex items-center space-x-2">
          <input
            ref={ref}
            type="checkbox"
            checked={checked}
            onChange={props.onChange}
            className={cn("checkbox", className)}
            {...props}
          />
          <FormLabel
            htmlFor={props.id}
            className={cn(
              "leading-none",
              checked ? "font-bold text-red-500" : "",
            )}
          >
            {checked ? checkedLabel : uncheckedLabel}
          </FormLabel>
        </div>
      </div>
    );
  },
);
FormCheckbox.displayName = "FormCheckbox";

export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
  FormButton,
  FormSwitch,
  FormCheckbox,
};
