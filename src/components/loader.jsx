export default function Loader({ size = "md", className = "" }) {
  const sizes = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-[3px]",
    lg: "w-12 h-12 border-4",
    xl: "w-16 h-16 border-[5px]",
  };

  return (
    <span
      className={`
        inline-block
        shrink-0
        rounded-full
        border-dotted
        border-t-transparent
        border-white
        animate-spin
        ${sizes[size]}
        ${className}
      `}
    />
  );
}