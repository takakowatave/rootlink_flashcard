"use client";

type Variant = "primary" | "secondary";

type ButtonProps = {
  variant?: Variant;
  text: string;
};

const baseStyle = "px-4 py-2 rounded";

const variants: Record<Variant, string> = {
  primary: "bg-blue-500 text-white hover:bg-blue-600",
  secondary: "border border-blue-500 text-blue-500",
};

const Button = ({
  variant = "primary",
  text,
  ...props
}: ButtonProps & React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  const style = `${baseStyle} ${variants[variant]}`;
  return (
    <button className={style} {...props}>
      {text}
    </button>
  );
};

export default Button;
