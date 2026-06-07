/**
 * @file StatusText.js
 * Short status or empty-state line.
 */

import { Text } from "./Text.js";

export const StatusText = (props = {}) => {
    const {
        value,
        look = "caption",
        ...textProps
    } = props;

    return Text({
        ...textProps,
        className: [
            "grove-status-text",
            textProps.className || ""
        ]
            .filter(Boolean)
            .join(" "),
        look,
        value
    });
};

export const StatusTextIf = (condition, props = {}) =>
    condition ? StatusText(props) : null;
