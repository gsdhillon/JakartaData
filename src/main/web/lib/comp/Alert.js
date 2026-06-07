/**
 * @file Alert.js
 * Small message component that hides alert styling from applications.
 */

import { Div } from "./Div.js";

const lookClass = look =>
    `grove-alert-${String(look || "info")
        .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
        .toLowerCase()}`;

export const Alert = (props = {}, ...children) => {
    const {
        className = "",
        look = "info",
        value,
        ...alertProps
    } = props;
    const alertClassName = [
        "grove-alert",
        lookClass(look),
        className
    ]
        .filter(Boolean)
        .join(" ");

    return Div(
        {
            ...alertProps,
            className: alertClassName,
            role: alertProps.role || "alert"
        },
        ...(children.length ? children : [value])
    );
};

export const AlertIf = (condition, props = {}, ...children) =>
    condition ? Alert(props, ...children) : null;
