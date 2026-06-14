/**
 * @file FormHeader.js
 * Header row for forms and cards.
 */

import { createElement } from "../GroveAdapter.js";
import { Div } from "./Div.js";
import { Text } from "./Text.js";

export const FormHeader = (props = {}) => {
    const {
        icon,
        subtitle,
        title,
        titleLook = "title"
    } = props;

    return Div(
        { className: "grove-form-header" },
        icon
            ? createElement(
                "i",
                {
                    "aria-hidden": "true",
                    className: `grove-form-header-icon bi bi-${icon}`
                }
            )
            : null,
        Div(
            { className: "grove-form-header-text" },
            Text({
                look: titleLook,
                value: title
            }),
            subtitle
                ? Text({
                    look: "subtitle",
                    value: subtitle
                })
                : null
        )
    );
};
