import { Heart } from "lucide-react";

const LikeButton = ({ liked, count = 0, onClick, disabled = false, vertical = false, compact = false, ariaLabel = "Like" }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-label={ariaLabel}
    className={`flex items-center cursor-pointer disabled:opacity-60 ${vertical ? "flex-col" : "gap-1"} ${compact ? "w-4 gap-0" : vertical ? "gap-0.5" : ""}`}
  >
    <Heart className={`${compact ? "w-3 h-3" : "w-4 h-4"} ${liked ? "text-red-500 fill-red-500" : "text-gray-500"}`} />
    <span className={`${compact ? "text-[9px] leading-3" : "text-xs"} text-gray-500`}>{count}</span>
  </button>
);

export default LikeButton;
