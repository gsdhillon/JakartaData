/**
 * @file Input.js
 * @author Gurmeet Singh
 * @email gsdhillon@gmail.com
 */

import {
    appendClassName,
    createElement
} from "../Grove.js";
import { Text } from "./Text.js";

const clearableTypes = new Set([
    "date",
    "datetime-local"
]);

const clearInputValue = event => {
    const input = event.currentTarget
        .closest(".grove-clearable-control")
        ?.querySelector("input");

    if (!input) {
        return;
    }

    input.value = "";
    input.dispatchEvent(new Event("change", { bubbles: true }));
    input.focus();
};

const togglePasswordVisibility = event => {
    event.preventDefault();
    event.stopPropagation();

    const button = event.currentTarget;
    const input = button
        .closest(".grove-password-control")
        ?.querySelector("input[type='password'], input[type='text']");
    const icon = button.querySelector("i");

    if (!input) {
        return;
    }

    const shouldShow = input.type === "password";

    input.type = shouldShow ? "text" : "password";
    button.setAttribute(
        "aria-label",
        `${shouldShow ? "Hide" : "Show"} ${button.dataset.grovePasswordName || "password"}`
    );
    button.setAttribute("title", shouldShow ? "Hide password" : "Show password");

    if (icon) {
        icon.className = `bi bi-${shouldShow ? "eye-slash" : "eye"}`;
    }

    input.focus();
};

/**
 * Creates an input virtual node.
 * @param {Object} [props={}] - Input attributes and event handlers.
 * @param {...any} children - Optional child nodes.
 * @returns {Object} A Grove virtual node.
 */
export const Input = (props = {}, ...children) => {
    const {
        label,
        ...inputProps
    } = props;
    const elementProps = inputProps.name && !inputProps.id
        ? {
            ...inputProps,
            id: inputProps.name
        }
        : inputProps;
    const isSetPassword = elementProps.type === "setpass";
    const htmlElementProps = isSetPassword
        ? {
            ...elementProps,
            autoComplete: elementProps.autoComplete || "off",
            "data-1p-ignore": "true",
            "data-form-type": "other",
            "data-lpignore": "true",
            inputMode: "text",
            spellCheck: false,
            type: "text"
        }
        : elementProps;
    const controlProps = htmlElementProps.placeholder
        ? htmlElementProps
        : {
            ...htmlElementProps,
            placeholder: htmlElementProps.name
        };
    const control =
        createElement(
            "input",
            appendClassName(
                controlProps,
                [
                    "form-control grove-control",
                    isSetPassword ? "grove-setpass-control" : ""
                ].filter(Boolean).join(" ")
            ),
            ...children
        );
    const shouldShowClear =
        clearableTypes.has(controlProps.type) &&
        !controlProps.readOnly &&
        !controlProps.disabled &&
        Boolean(controlProps.value);
    const passwordControl =
        controlProps.type === "password" &&
        !controlProps.readOnly &&
        !controlProps.disabled
            ? createElement(
                "span",
                { className: "grove-password-control" },
                control,
                createElement(
                    "button",
                    {
                        "aria-label": `Show ${label || controlProps.name || "password"}`,
                        className: "grove-password-toggle",
                        "data-grove-password-name": label || controlProps.name || "password",
                        tabIndex: -1,
                        title: "Show password",
                        type: "button",
                        onClick: togglePasswordVisibility
                    },
                    createElement(
                        "i",
                        {
                            "aria-hidden": "true",
                            className: "bi bi-eye"
                        }
                    )
                )
            )
            : control;
    const clearableControl = clearableTypes.has(controlProps.type)
        ? createElement(
            "span",
            { className: "grove-clearable-control" },
            passwordControl,
            shouldShowClear
                ? createElement(
                    "button",
                    {
                        "aria-label": `Clear ${label || controlProps.name || "value"}`,
                        className: "btn btn-sm btn-link grove-clear-control",
                        type: "button",
                        onClick: clearInputValue
                    },
                    "x"
                )
                : null
        )
        : passwordControl;

    return label
        ? createElement(
            "label",
            { className: "grove-field-label" },
            Text({
                look: "label",
                value: label
            }),
            clearableControl
        )
        : clearableControl;
};

export const InputIf = (condition, props = {}, ...children) =>
    condition ? Input(props, ...children) : null;
