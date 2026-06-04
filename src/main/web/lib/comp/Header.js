/**
 * @file Header.js
 * @author Gurmeet Singh
 * @email gsdhillon@gmail.com
 */

import { createElement } from "../Grove.js";
import { Div } from "./Div.js";

const renderImageSlot = (value, className, alt) => {
    if (!value) {
        return null;
    }

    return typeof value === "string"
        ? createElement(
            "img",
            {
                alt,
                className,
                src: value
            }
        )
        : value;
};

/**
 * Creates an application header.
 * @param {Object} [props={}] - Header attributes and content.
 * @returns {Object} A Grove virtual node.
 */
export const Header = (props = {}) => {
    const {
        avatar,
        avtar,
        className = "",
        height = "90px",
        logo,
        subTitle,
        title,
        ...headerProps
    } = props;
    const headerClassName = ["grove-header", className]
        .filter(Boolean)
        .join(" ");

    return createElement(
        "header",
        {
            ...headerProps,
            className: headerClassName,
            style: {
                ...(headerProps.style || {}),
                minHeight: height
            }
        },
        Div(
            { className: "grove-header-logo" },
            renderImageSlot(logo, "grove-header-logo-image", "Application logo")
        ),
        Div(
            { className: "grove-header-title-block" },
            title
                ? createElement(
                    "h1",
                    { className: "grove-header-title" },
                    title
                )
                : null,
            subTitle
                ? Div(
                    { className: "grove-header-subtitle" },
                    subTitle
                )
                : null
        ),
        Div(
            { className: "grove-header-avatar" },
            renderImageSlot(avtar ?? avatar, "grove-header-avatar-image", "User avatar")
        )
    );
};

export const HeaderIf = (condition, props = {}) =>
    condition ? Header(props) : null;
