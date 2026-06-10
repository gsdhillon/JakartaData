/**
 * @file Text.js
 * Framework text primitive with a small controlled visual vocabulary.
 */

import { createElement } from "../Grove.js";

const lookClass = look =>
    `grove-text-${String(look || "body")
        .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
        .toLowerCase()}`;

const defaultTagByLook = {
    appTitle: "h1",
    appSubtitle: "div",
    title: "span",
    subtitle: "div",
    label: "span",
    caption: "span",
    body: "span"
};

export const Text = (props = {}, ...children) => {
    const {
        as,
        className = "",
        look = "body",
        value,
        ...textProps
    } = props;
    const tagName = as || defaultTagByLook[look] || defaultTagByLook.body;
    const textClassName = [
        "grove-text",
        lookClass(look),
        className
    ]
        .filter(Boolean)
        .join(" ");

    return createElement(
        tagName,
        {
            ...textProps,
            className: textClassName
        },
        ...(children.length ? children : [value])
    );
};

export const TextIf = (condition, props = {}, ...children) =>
    condition ? Text(props, ...children) : null;
