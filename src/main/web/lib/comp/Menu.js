/**
 * @file Menu.js
 * @author Gurmeet Singh
 * @email gsdhillon@gmail.com
 */

import { createElement } from "../Grove.js";
import { Div } from "./Div.js";

const linkLabel = link =>
    link?.label ?? link?.title ?? link?.text ?? "";

const renderMenuLink = link => {
    const {
        active,
        className = "",
        href,
        label,
        title,
        text,
        ...linkProps
    } = link || {};
    const linkClassName = [
        href ? "nav-link" : "btn btn-link",
        "grove-menu-link",
        active ? "grove-menu-link-active" : "",
        className
    ]
        .filter(Boolean)
        .join(" ");
    const content = label ?? title ?? text;

    return href
        ? createElement(
            "a",
            {
                ...linkProps,
                className: linkClassName,
                href
            },
            content
        )
        : createElement(
            "button",
            {
                ...linkProps,
                className: linkClassName,
                type: linkProps.type || "button"
            },
            content
        );
};

/**
 * Creates an application menu.
 * @param {Object} [props={}] - Menu attributes and link data.
 * @returns {Object} A Grove virtual node.
 */
export const Menu = (props = {}) => {
    const {
        className = "",
        links = [],
        width = "140px",
        ...menuProps
    } = props;
    const menuClassName = ["grove-menu", className]
        .filter(Boolean)
        .join(" ");

    return createElement(
        "nav",
        {
            ...menuProps,
            "aria-label": menuProps["aria-label"] || "Main menu",
            className: menuClassName,
            style: {
                ...(menuProps.style || {}),
                width
            }
        },
        Div(
            { className: "grove-menu-links" },
            ...links
                .filter(link => linkLabel(link))
                .map(renderMenuLink)
        )
    );
};

export const MenuIf = (condition, props = {}) =>
    condition ? Menu(props) : null;
