/**
 * @file Input.js
 * @author Gurmeet Singh
 * @email gsdhillon@gmail.com
 */

import {
    appendClassName,
    createElement
} from "../Grove.js";

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
    const controlProps = elementProps.placeholder
        ? elementProps
        : {
            ...elementProps,
            placeholder: elementProps.name
        };
    const control =
        createElement(
            "input",
            appendClassName(controlProps, "form-control grove-control"),
            ...children
        );
    const shouldShowClear =
        clearableTypes.has(controlProps.type) &&
        !controlProps.readOnly &&
        !controlProps.disabled &&
        Boolean(controlProps.value);
    const clearableControl = clearableTypes.has(controlProps.type)
        ? createElement(
            "span",
            { className: "grove-clearable-control" },
            control,
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
        : control;

    return label
        ? createElement(
            "label",
            { className: "grove-field-label" },
            label,
            clearableControl
        )
        : clearableControl;
};

export const InputIf = (condition, props = {}, ...children) =>
    condition ? Input(props, ...children) : null;
