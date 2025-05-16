import { cx } from "class-variance-authority";
import { Link } from "react-router-dom";

export const Rel = ({
  rel,
  relHref,
  className,
}: {
  rel?: string;
  relHref?: string;
  className?: string;
}) => {
  if (!rel || !relHref) {
    return null;
  }
  return (
    <div className={cx("text-sm text-muted-foreground/75 mt-4", className)}>
      Inspired by the work of{" "}
      {rel && (
        <Link
          to={relHref}
          rel={rel}
          target="_blank"
          className="underline underline-offset-2 hover:text-foreground"
        >
          {rel}
        </Link>
      )}
    </div>
  );
};
