/**
 * @file Button.js
 * @author Gurmeet Singh
 * @email gsdhillon@gmail.com
 */

import {
    appendClassName,
    createElement
} from "../Grove.js";

const renderButtonIcon = icon =>
    typeof icon === "string"
        ? createElement(
            "span",
            {
                "aria-hidden": "true",
                className: "grove-button-icon"
            },
            icon
        )
        : icon;

const buttonLooks = {
    dn: "btn btn-outline-danger",
    pm: "btn btn-primary",
    sc: "btn btn-outline-secondary",
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
        label,
        look = "pm",
        ...buttonProps
    } = props;
    const buttonChildren = children.length
        ? children
        : [
            icon ? renderButtonIcon(icon) : null,
            label
        ].filter(child =>
            child !== null &&
            child !== undefined &&
            child !== ""
        );

    return createElement(
        "button",
        appendClassName(
            buttonProps,
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
