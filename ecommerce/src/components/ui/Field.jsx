import { forwardRef, useId } from 'react'
import { cn } from '@/lib/utils'

const CONTROL_BASE =
  'focus-ring w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition-colors disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500'

const INVALID = 'border-rose-300 focus-visible:ring-rose-500/50'

export function Field({ label, error, hint, required, htmlFor, className, children }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-700">
          {label}
          {required && <span className="ml-0.5 text-rose-500">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-xs font-medium text-rose-600">{error}</p>
      ) : hint ? (
        <p className="text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  )
}

export const Input = forwardRef(function Input({ className, invalid, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(CONTROL_BASE, 'h-10', invalid && INVALID, className)}
      aria-invalid={invalid || undefined}
      {...props}
    />
  )
})

export const Textarea = forwardRef(function Textarea({ className, invalid, rows = 4, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(CONTROL_BASE, 'resize-y', invalid && INVALID, className)}
      aria-invalid={invalid || undefined}
      {...props}
    />
  )
})

export const Select = forwardRef(function Select({ className, invalid, children, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={cn(CONTROL_BASE, 'h-10 cursor-pointer pr-8', invalid && INVALID, className)}
      aria-invalid={invalid || undefined}
      {...props}
    >
      {children}
    </select>
  )
})

export const Checkbox = forwardRef(function Checkbox({ className, label, ...props }, ref) {
  const id = useId()
  return (
    <label
      htmlFor={props.id ?? id}
      className={cn('flex cursor-pointer select-none items-center gap-2 text-sm text-slate-700', className)}
    >
      <input
        ref={ref}
        id={props.id ?? id}
        type="checkbox"
        className="focus-ring size-4 cursor-pointer rounded border-slate-300 text-brand-600 accent-brand-600"
        {...props}
      />
      {label}
    </label>
  )
})

/**
 * react-hook-form ke saath istemal:
 *   <FormInput label="Email" error={errors.email?.message} {...register('email')} />
 */
export const FormInput = forwardRef(function FormInput(
  { label, error, hint, required, className, ...props },
  ref
) {
  const id = useId()
  return (
    <Field
      label={label}
      error={error}
      hint={hint}
      required={required}
      htmlFor={props.id ?? id}
      className={className}
    >
      <Input ref={ref} id={props.id ?? id} invalid={Boolean(error)} {...props} />
    </Field>
  )
})

export const FormSelect = forwardRef(function FormSelect(
  { label, error, hint, required, className, children, ...props },
  ref
) {
  const id = useId()
  return (
    <Field
      label={label}
      error={error}
      hint={hint}
      required={required}
      htmlFor={props.id ?? id}
      className={className}
    >
      <Select ref={ref} id={props.id ?? id} invalid={Boolean(error)} {...props}>
        {children}
      </Select>
    </Field>
  )
})

export const FormTextarea = forwardRef(function FormTextarea(
  { label, error, hint, required, className, ...props },
  ref
) {
  const id = useId()
  return (
    <Field
      label={label}
      error={error}
      hint={hint}
      required={required}
      htmlFor={props.id ?? id}
      className={className}
    >
      <Textarea ref={ref} id={props.id ?? id} invalid={Boolean(error)} {...props} />
    </Field>
  )
})
