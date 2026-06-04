/**
 * @file AppShell.js
 * @author Gurmeet Singh
 * @email gsdhillon@gmail.com
 */

import { createElement } from "../Grove.js";
import { Div } from "./Div.js";
import {
    RestErrorToasts,
    RestTap
} from "./REST.js";

const bgByTheme = {
    dark: new URL("../grove-bg-dark.svg", import.meta.url).href,
    light: new URL("../grove-bg-light.svg", import.meta.url).href
};

/**
 * Creates the page shell with header, menu, center area, right strip, and footer.
 * @param {Object} [props={}] - Shell regions.
 * @returns {Object} A Grove virtual node.
 */
export const AppShell = (props = {}) => {
    const {
        Center,
        Footer,
        Header,
        Menu,
        center,
        className = "",
        footer,
        header,
        menu,
        themeMode = "light",
        ...shellProps
    } = props;
    const normalizedTheme = themeMode === "dark"
        ? "dark"
        : "light";
    const shellClassName = [
        "grove-app-shell",
        `grove-theme-${normalizedTheme}`,
        className
    ]
        .filter(Boolean)
        .join(" ");
    const centerContent = Center ?? center;
    const centerClassName = [
        "grove-app-shell-center",
        centerContent !== null && centerContent !== undefined
            ? "grove-app-shell-center-present"
            : ""
    ]
        .filter(Boolean)
        .join(" ");

    return Div(
        {
            ...shellProps,
            className: shellClassName,
            "data-bs-theme": normalizedTheme,
            style: {
                ...(shellProps.style || {}),
                backgroundImage: `url("${bgByTheme[normalizedTheme]}")`
            }
        },
        Header ?? header,
        Div(
            { className: "grove-app-shell-body" },
            Menu ?? menu,
            createElement(
                "main",
                {
                    className: centerClassName,
                    role: "main"
                },
                centerContent
            ),
            Div({
                "aria-hidden": "true",
                className: "grove-app-shell-right-strip"
            })
        ),
        Footer ?? footer,
        createElement(RestErrorToasts),
        createElement(RestTap)
    );
};

export const AppShellIf = (condition, props = {}) =>
    condition ? AppShell(props) : null;
