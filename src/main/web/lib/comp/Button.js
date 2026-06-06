/**
 * @file Button.js
 * @author Gurmeet Singh
 * @email gsdhillon@gmail.com
 */

import {
    appendClassName,
    createElement
} from "../Grove.js";

const iconClassName = icon =>
    String(icon).includes(" ")
        ? icon
        : `bi bi-${icon}`;

const renderButtonIcon = (icon, suffix = false) =>
    typeof icon === "string"
        ? createElement(
            "i",
            {
                "aria-hidden": "true",
                className: [
                    "grove-button-icon",
                    suffix ? "grove-button-icon-suffix" : "",
                    iconClassName(icon)
                ].filter(Boolean).join(" ")
            }
        )
        : icon;

const buttonLooks = {
    dn: "btn btn-outline-danger",
    pm: "btn btn-primary",
    sc: "btn btn-outline-secondary",
    uf: "btn btn-info",
    ut: "btn btn-outline-info"
};

/**
 * Creates a button virtual node.
 * @param {Object} [props={}] - Button attributes and event handlers.
 * @param {...any} children - Button child nodes or text.
 * @returns {Object} A Grove virtual node.
 */
export const Button = (props = {}, ...children) => {
    const {
        icon,
        iconSuffix,
        label,
        look = "pm",
        ...buttonProps
    } = props;
    const buttonChildren = children.length
        ? children
        : [
            icon ? renderButtonIcon(icon) : null,
            label,
            iconSuffix ? renderButtonIcon(iconSuffix, true) : null
        ].filter(child =>
            child !== null &&
            child !== undefined &&
            child !== ""
        );
    const iconOnly =
        buttonChildren.length === 1 &&
        (icon || iconSuffix) &&
        !buttonProps["aria-label"];
    const resolvedButtonProps = iconOnly
        ? {
            ...buttonProps,
            "aria-label": buttonProps.title || buttonProps.name || "Button"
        }
        : buttonProps;

    return createElement(
        "button",
        appendClassName(
            resolvedButtonProps,
            [
                buttonLooks[look] || buttonLooks.pm,
                "grove-button"
            ].join(" ")
        ),
        ...buttonChildren
    );
};

export const ButtonIf = (condition, props = {}, ...children) =>
    condition ? Button(props, ...children) : null;
