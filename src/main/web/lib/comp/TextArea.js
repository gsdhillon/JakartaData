/**
 * @file TextArea.js
 * @author Gurmeet Singh
 * @email gsdhillon@gmail.com
 */

import {
    appendClassName,
    createElement
} from "../Grove.js";
import { Text } from "./Text.js";

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
            Text({
                look: "label",
                value: label
            }),
            control
        )
        : control;
};

export const TextAreaIf = (condition, props = {}, ...children) =>
    condition ? TextArea(props, ...children) : null;
