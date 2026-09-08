import { forwardRef } from "react";
import "./Input.css";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

const Input = forwardRef(function Input(
  {
    as = "input",
    compact = false,
    computed = false,
    inline = false,
    unstyled = false,
    className = "",
    type = "text",
    innerRef,
    children,
    ...props
  },
  ref
) {
  const resolvedRef = innerRef || ref;
  const isCheck = as === "input" && (type === "checkbox" || type === "radio");
  const classes = unstyled
    ? className
    : cx(
        isCheck ? "app-input-check" : "app-input",
        as === "select" && "app-input-select",
        as === "textarea" && "app-input-textarea",
        compact && "app-input-compact",
        computed && "app-input-computed",
        inline && "app-input-inline",
        className
      );

  const Component = as;

  if (as !== "input") {
    return (
      <Component ref={resolvedRef} className={classes} {...props}>
        {children}
      </Component>
    );
  }

  return <input ref={resolvedRef} type={type} className={classes} {...props} />;
});

export const Select = forwardRef(function Select(props, ref) {
  return <Input ref={ref} {...props} as="select" />;
});

export const Textarea = forwardRef(function Textarea(props, ref) {
  return <Input ref={ref} {...props} as="textarea" />;
});

export default Input;
