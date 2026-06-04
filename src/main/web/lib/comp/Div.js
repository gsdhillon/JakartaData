/**
 * @file Div.js
 * @author Gurmeet Singh
 * @email gsdhillon@gmail.com
 */

import { createElement } from "../Grove.js";

/**
 * Creates a div virtual node.
 * @param {Object} [props={}] - Div attributes and event handlers.
 * @param {...any} children - Div child nodes or text.
 * @returns {Object} A Grove virtual node.
 */
export const Div = (props = {}, ...children) =>
    createElement("div", props, ...children);

export const DivIf = (condition, props = {}, ...children) =>
    condition ? Div(props, ...children) : null;
