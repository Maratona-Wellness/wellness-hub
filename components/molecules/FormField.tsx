"use client";

import React from "react";
import { Input, type InputProps } from "@/components/ui/Input";
import { Select, type SelectProps } from "@/components/ui/Select";
import { Checkbox, type CheckboxProps } from "@/components/ui/Checkbox";
import { Radio, type RadioProps } from "@/components/ui/Radio";
import { Switch, type SwitchProps } from "@/components/ui/Switch";
import { cn } from "@/lib/utils/cn";

type FieldType = "input" | "select" | "checkbox" | "radio" | "switch";

interface BaseFormFieldProps {
  label?: string | React.ReactNode;
  error?: string;
  helpText?: string;
  required?: boolean;
  className?: string;
}

interface InputFieldProps extends BaseFormFieldProps {
  type: "input";
  inputProps?: InputProps;
}

interface SelectFieldProps extends BaseFormFieldProps {
  type: "select";
  selectProps?: SelectProps;
}

interface CheckboxFieldProps extends BaseFormFieldProps {
  type: "checkbox";
  checkboxProps?: CheckboxProps;
}

interface RadioFieldProps extends BaseFormFieldProps {
  type: "radio";
  radioProps?: RadioProps;
}

interface SwitchFieldProps extends BaseFormFieldProps {
  type: "switch";
  switchProps?: SwitchProps;
}

export type FormFieldProps =
  | InputFieldProps
  | SelectFieldProps
  | CheckboxFieldProps
  | RadioFieldProps
  | SwitchFieldProps;

export const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ className, label, error, helpText, required, ...props }, ref) => {
    const isInlineField = props.type === "checkbox" || props.type === "switch";

    return (
      <div ref={ref} className={cn("flex flex-col gap-1.5", className)}>
        {/* Label para campos não-inline */}
        {label && !isInlineField && (
          <label className="text-sm font-medium text-(--color-secondary)">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        {/* Campo de entrada */}
        <div>
          {props.type === "input" && (
            <Input
              {...props.inputProps}
              error={error}
              required={required}
              aria-invalid={!!error}
              aria-describedby={
                error
                  ? `${props.inputProps?.id}-error`
                  : helpText
                    ? `${props.inputProps?.id}-help`
                    : undefined
              }
            />
          )}

          {props.type === "select" && props.selectProps?.options && (
            <Select
              {...props.selectProps}
              error={error}
              required={required}
              aria-invalid={!!error}
              aria-describedby={
                error
                  ? `${props.selectProps?.id}-error`
                  : helpText
                    ? `${props.selectProps?.id}-help`
                    : undefined
              }
            />
          )}

          {props.type === "checkbox" && (
            <Checkbox
              {...props.checkboxProps}
              label={typeof label === "string" ? label : undefined}
              required={required}
              aria-invalid={!!error}
              aria-describedby={
                error
                  ? `${props.checkboxProps?.id}-error`
                  : helpText
                    ? `${props.checkboxProps?.id}-help`
                    : undefined
              }
            />
          )}

          {props.type === "radio" && (
            <Radio
              {...props.radioProps}
              label={typeof label === "string" ? label : undefined}
              required={required}
              aria-invalid={!!error}
              aria-describedby={
                error
                  ? `${props.radioProps?.id}-error`
                  : helpText
                    ? `${props.radioProps?.id}-help`
                    : undefined
              }
            />
          )}

          {props.type === "switch" && (
            <Switch
              {...props.switchProps}
              label={typeof label === "string" ? label : undefined}
              required={required}
              aria-invalid={!!error}
              aria-describedby={
                error
                  ? `${props.switchProps?.id}-error`
                  : helpText
                    ? `${props.switchProps?.id}-help`
                    : undefined
              }
            />
          )}
        </div>

        {/* Help Text */}
        {helpText && !error && (
          <p className="text-xs text-gray-500">{helpText}</p>
        )}

        {/* Error Message */}
        {error && (
          <p className="text-xs text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  },
);

FormField.displayName = "FormField";
