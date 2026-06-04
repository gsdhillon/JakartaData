/**
 * @file TextArea.js
 * @author Gurmeet Singh
 * @email gsdhillon@gmail.com
 */

import {
    appendClassName,
    createElement
} from "../Grove.js";

/**
 * Creates a textarea virtual node.
 * @param {Object} [props={}] - Textarea attributes and event handlers.
 * @param {...any} children - Optional child nodes or text.
 * @returns {Object} A Grove virtual node.
 */
export const TextArea = (props = {}, ...children) =>
    createElement(
        "textarea",
        appendClassName(props, "form-control grove-control"),
        ...children
    );

export const TextAreaIf = (condition, props = {}, ...children) =>
    condition ? TextArea(props, ...children) : null;
