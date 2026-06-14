/**
 * @file Page.js
 * Page-level layout wrapper so apps choose layout by prop, not CSS class.
 */

import { Div } from "./Div.js";

const layoutClass = layout =>
    layout
        ? `grove-page-${String(layout).toLowerCase()}`
        : "";

export const Page = (props = {}) => {
    const {
        className = "",
        content,
        layout = "default",
        ...pageProps
    } = props;
    const pageClassName = [
        "grove-page",
        layoutClass(layout),
        className
    ]
        .filter(Boolean)
        .join(" ");

    return Div(
        {
            ...pageProps,
            className: pageClassName
        },
        content
    );
};

export const PageIf = (condition, props = {}) =>
    condition ? Page(props) : null;
