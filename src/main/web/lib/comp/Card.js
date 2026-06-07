/**
 * @file Card.js
 * Framework card primitive for visual containers.
 */

import { Div } from "./Div.js";

const kindClass = kind =>
    `grove-card-${String(kind || "default")
        .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
        .toLowerCase()}`;

const alignClass = align =>
    align
        ? `grove-card-align-${String(align).toLowerCase()}`
        : "";

export const Card = (props = {}, ...children) => {
    const {
        align,
        className = "",
        kind = "default",
        ...cardProps
    } = props;
    const cardClassName = [
        "grove-card",
        kindClass(kind),
        alignClass(align),
        className
    ]
        .filter(Boolean)
        .join(" ");

    return Div(
        {
            ...cardProps,
            className: cardClassName
        },
        ...children
    );
};

export const CardIf = (condition, props = {}, ...children) =>
    condition ? Card(props, ...children) : null;
