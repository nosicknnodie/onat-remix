import { type LinkProps, Link as RemixLink } from "@remix-run/react";
import { forwardRef } from "react";

/**
 * @description a wrapper component of remix's Link.
 * @see {@link https://github.com/remix-run/remix/issues/205}
 */
export const Link = forwardRef<HTMLAnchorElement, LinkProps>(({ ...props }, ref) => {
  return <RemixLink {...props} ref={ref} />;
});
Link.displayName = "Link";
