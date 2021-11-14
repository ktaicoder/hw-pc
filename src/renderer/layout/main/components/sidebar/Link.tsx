import MuiLink, { LinkProps as MuiLinkProps } from "@mui/material/Link";
import React from "react";
import { Link as RouterLink, LinkProps as RouterLinkProps } from "react-router-dom";

export type LinkProps = MuiLinkProps & Pick<RouterLinkProps, "to" | "replace">;

export default function Link(props: LinkProps) {
    const { replace, to, href } = props;

    const CustomLink = React.useMemo(
        () =>
            React.forwardRef<HTMLAnchorElement, Omit<RouterLinkProps, "to" | "replace">>(function Link(linkProps, ref) {
                return <RouterLink ref={ref} to={to ?? ""} href={href} replace={replace} {...linkProps} />;
            }),
        [to, replace, href]
    );

    return <MuiLink component={CustomLink} {...props} />;
}
