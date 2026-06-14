/**
 * @file OptBoolean.js
 * @author Gurmeet Singh
 * @email gsdhillon@gmail.com
 */

import { createElement } from "../GroveAdapter.js";
import { appendClassName } from "../GroveComponents.js";
import { Text } from "./Text.js";

const booleanOptions = nullable => [
    { label: "Yes", value: "true" },
    { label: "No", value: "false" },
    ...(nullable ? [{ label: "Null", value: "" }] : [])
];

const valueForOption = (value, nullable) => {
    if (value === null || value === undefined) {
        return nullable ? "" : "false";
    }

    return String(Boolean(value));
};

/**
 * Creates a Yes/No boolean radio field, optionally with Null.
 * @param {Object} [props={}] - Radio attributes and event handlers.
 * @param {boolean} [props.nullable=false] - Whether to include a Null option.
 * @returns {Object} A Grove virtual node.
 */
export const OptBoolean = (props = {}) => {
    const {
        label,
        nullable = false,
        value,
        ...inputProps
    } = props;
    const elementProps = inputProps.name && !inputProps.id
        ? {
            ...inputProps,
            id: inputProps.name
        }
        : inputProps;
    const selectedValue = valueForOption(value, nullable);
    const fieldName = elementProps.name || elementProps.id || "optBoolean";
    const control = createElement(
        "span",
        { className: "grove-opt-boolean" },
        ...booleanOptions(nullable).map(option =>
            createElement(
                "label",
                { className: "grove-opt-boolean-option", key: option.value || "null" },
                createElement("input", {
                    ...elementProps,
                    checked: selectedValue === option.value,
                    className: [
                        "form-check-input",
                        elementProps.className || ""
                    ].filter(Boolean).join(" "),
                    "data-grove-boolean": nullable ? "nullable" : "required",
                    id: `${fieldName}-${option.value || "null"}`,
                    type: "radio",
                    value: option.value
                }),
                option.label
            )
        )
    );

    return label
        ? createElement(
            "fieldset",
            { className: "grove-field-label grove-opt-boolean-field" },
            Text({
                look: "label",
                value: label
            }),
            control
        )
        : control;
};

export const OptBooleanIf = (condition, props = {}) =>
    condition ? OptBoolean(props) : null;
