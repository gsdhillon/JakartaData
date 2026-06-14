/**
 * @file TextArea.js
 * @author Gurmeet Singh
 * @email gsdhillon@gmail.com
 */

import { createElement } from "../GroveAdapter.js";
import { appendClassName } from "../GroveComponents.js";
import { Text } from "./Text.js";

const textLength = value =>
    String(value ?? "").length;

/**
 * Creates a textarea virtual node.
 * @param {Object} [props={}] - Textarea attributes and event handlers.
 * @param {...any} children - Optional child nodes or text.
 * @returns {Object} A Grove virtual node.
 */
export const TextArea = (props = {}, ...children) => {
    const {
        label,
        ...textAreaProps
    } = props;
    const elementProps = textAreaProps.name && !textAreaProps.id
        ? {
            ...textAreaProps,
            id: textAreaProps.name
        }
        : textAreaProps;
    const control = createElement(
        "textarea",
        appendClassName(elementProps, "form-control grove-control"),
        ...children
    );

    return label
        ? createElement(
            "label",
            { className: "grove-field-label" },
            createElement(
                "span",
                { className: "grove-textarea-label-meta" },
                Text({
                    look: "label",
                    value: label
                }),
                createElement(
                    "span",
                    {
                        className: "grove-textarea-length",
                        "data-grove-textarea-length-for": textAreaProps.name || ""
                    },
                    `[len: ${textLength(textAreaProps.value ?? textAreaProps.defaultValue)}]`
                )
            ),
            control
        )
        : control;
};

export const TextAreaIf = (condition, props = {}, ...children) =>
    condition ? TextArea(props, ...children) : null;
