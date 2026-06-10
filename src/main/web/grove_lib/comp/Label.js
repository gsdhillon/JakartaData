/**
 * @file Label.js
 * @author Gurmeet Singh
 * @email gsdhillon@gmail.com
 */

import { createElement } from "../Grove.js";

/**
 * Creates a label virtual node.
 * @param {Object} [props={}] - Label attributes and event handlers.
 * @param {...any} children - Label child nodes or text.
 * @returns {Object} A Grove virtual node.
 */
export const Label = (props = {}, ...children) =>
    createElement("label", props, ...children);

export const LabelIf = (condition, props = {}, ...children) =>
    condition ? Label(props, ...children) : null;
