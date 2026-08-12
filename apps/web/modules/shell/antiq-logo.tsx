/** Official antiq mark — two pieces, transparent (no black plate). */
export function AntiqLogo({
  className = "h-8 w-8",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      {/* Upper-left half — slides NW on BrandMark hover */}
      <path
        className="origin-center transition-transform duration-500 ease-out group-hover:-translate-x-[2px] group-hover:-translate-y-[2px] group-focus-visible:-translate-x-[2px] group-focus-visible:-translate-y-[2px]"
        d="M7.2 2.5h13.5v6.3L13.75 15.82h-2.12L7.2 20.55V2.5z"
      />
      {/* Lower-right half — slides SE on BrandMark hover */}
      <path
        className="origin-center transition-transform duration-500 ease-out group-hover:translate-x-[2px] group-hover:translate-y-[2px] group-focus-visible:translate-x-[2px] group-focus-visible:translate-y-[2px]"
        d="M24.8 12.4V29.5H11.34v-4.8L18.4 17.49h1.53L24.8 12.4z"
      />
    </svg>
  );
}
