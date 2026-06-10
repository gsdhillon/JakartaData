/**
 * @file Select.js
 * @author Gurmeet Singh
 * @email gsdhillon@gmail.com
 */

import {
    appendClassName,
    createElement
} from "../Grove.js";
import { Text } from "./Text.js";

const normalizePlaceholderName = value => {
    const normalized = String(value || "")
        .replace(/:$/, "")
        .trim();

    return normalized
        ? normalized.charAt(0).toLowerCase() + normalized.slice(1)
        : "";
};

/**
 * Creates a select virtual node.
 * @param {Object} [props={}] - Select attributes and event handlers.
 * @param {Array<string|Object>} [props.options] - Options to render.
 * @param {...any} children - Optional option child nodes.
 * @returns {Object} A Grove virtual node.
 */
export const Select = (props = {}, ...children) => {
    const {
        label,
        options,
        placeholder,
        ...selectProps
    } = props;
    const elementProps = selectProps.name && !selectProps.id
        ? {
            ...selectProps,
            id: selectProps.name
        }
        : selectProps;
    const placeholderText =
        placeholder === false
            ? null
            : placeholder || `Select ${normalizePlaceholderName(label || selectProps.name)}`;
    const providedChildren =
        Array.isArray(options)
            ? options.map(option => {
                const value =
                    typeof option === "object"
                        ? option.value
                        : option;
                const label =
                    typeof option === "object"
                        ? option.label
                        : option;

                return createElement(
                    "option",
                    { value },
                    label
                );
            })
            : children;
    const optionChildren = placeholderText
        ? [
            createElement(
                "option",
                {
                    disabled: true,
                    hidden: true,
                    value: ""
                },
                placeholderText
            ),
            ...providedChildren
        ]
        : providedChildren;
    const control =
        createElement(
            "select",
            appendClassName(elementProps, "form-select grove-control"),
            ...optionChildren
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

export const SelectIf = (condition, props = {}, ...children) =>
    condition ? Select(props, ...children) : null;
