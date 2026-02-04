"use client";

import { useEffect } from "react";
import { UseFormRegister, UseFormSetValue } from "react-hook-form";
import { honeypotFields } from "@/lib/honeypot";

interface HoneypotInputsProps {
    register: UseFormRegister<any>;
    setValue: UseFormSetValue<any>;
}

export default function HoneypotInputs({
    register,
    setValue,
}: HoneypotInputsProps) {
    useEffect(() => {
        // Set timestamp on mount
        setValue("formLoadedAt", Date.now());
    }, [setValue]);

    return (
        <>
            <input type="hidden" {...register("formLoadedAt", { valueAsNumber: true })} />
            {honeypotFields.map((fieldName) => (
                <input
                    key={fieldName}
                    type="text"
                    className="sr-only"
                    autoComplete="off"
                    aria-hidden="true"
                    tabIndex={-1}
                    {...register(fieldName)}
                />
            ))}
        </>
    );
}
