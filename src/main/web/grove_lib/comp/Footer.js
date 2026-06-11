/**
 * @file Footer.js
 * @author Gurmeet Singh
 * @email gsdhillon@gmail.com
 */

import {
    createElement,
    useEffect
} from "../Grove.js";
import {
    openRestDialog,
    RestTapToggle
} from "./REST.js";
import { Text } from "./Text.js";

const groveLogoUrl = new URL("../grove-logo.svg", import.meta.url).href;

/**
 * Creates an application footer.
 * @param {Object} [props={}] - Footer attributes and content.
 * @returns {Object} A Grove virtual node.
 */
export const Footer = (props = {}) => {
    const {
        brand = "",
        className = "",
        height = "30px",
        logo = groveLogoUrl,
        onLogoClick = openRestDialog,
        onThemeSelect,
        onThemeToggle,
        themeId = "",
        themeMode = "light",
        themeOptions = [],
        ...footerProps
    } = props;
    const footerClassName = [
        "grove-footer",
        "text-body",
        className
    ]
        .filter(Boolean)
        .join(" ");
    const normalizedTheme = themeMode === "dark"
        ? "dark"
        : "light";

    useEffect(() => {
        if (typeof document === "undefined") {
            return undefined;
        }

        document.documentElement.style.setProperty("--grove-footer-height", height);
        return () => {
            document.documentElement.style.removeProperty("--grove-footer-height");
        };
    }, [height]);

    return createElement(
        "footer",
        {
            ...footerProps,
            className: footerClassName,
            style: {
                ...(footerProps.style || {}),
                "--grove-footer-height": height,
                height
            }
        },
        createElement(
            "div",
            { className: "grove-footer-brand" },
            Text({
                look: "caption",
                value: brand ? `${brand} \u00a9` : "\u00a9"
            })
        ),
        createElement(
            "div",
            { className: "grove-footer-left" },
            createElement(
                "button",
                {
                    "aria-label": `Switch to ${normalizedTheme === "dark" ? "light" : "dark"} theme`,
                    className: [
                        "grove-theme-toggle",
                        `grove-theme-toggle-${normalizedTheme}`
                    ].join(" "),
                    type: "button",
                    onClick: onThemeToggle
                },
                createElement(
                    "span",
                    { className: "grove-theme-toggle-track" },
                    createElement("span", { className: "grove-theme-toggle-knob" })
                ),
                createElement(
                    "span",
                    { className: "grove-theme-toggle-text" },
                    normalizedTheme === "dark" ? "Dark" : "Light"
                )
            ),
            createElement(
                "span",
                {
                    "aria-label": `${normalizedTheme} theme choices`,
                    className: "grove-theme-choice-list",
                    role: "group"
                },
                ...themeOptions.map(theme =>
                    createElement(
                        "button",
                        {
                            "aria-label": `Use ${theme.label || theme.id} theme`,
                            "aria-pressed": theme.id === themeId ? "true" : "false",
                            className: [
                                "grove-theme-choice",
                                theme.id === themeId ? "grove-theme-choice-active" : ""
                            ]
                                .filter(Boolean)
                                .join(" "),
                            style: {
                                "--grove-theme-choice-color": theme.swatch || "var(--grove-title-accent)"
                            },
                            title: theme.label || theme.id,
                            type: "button",
                            onClick: () => {
                                if (onThemeSelect) {
                                    onThemeSelect(theme.id);
                                }
                            }
                        }
                    )
                )
            )
        ),
        createElement(
            "div",
            { className: "grove-footer-right" },
            createElement(RestTapToggle),
            logo
                ? createElement(
                    "button",
                    {
                        "aria-label": "Show REST requests and responses",
                        className: "grove-footer-logo-button",
                        type: "button",
                        onClick: onLogoClick
                    },
                    createElement(
                        "img",
                        {
                            alt: "Grove logo",
                            className: "grove-footer-logo",
                            src: logo
                        }
                    )
                )
                : null
        )
    );
};

export const FooterIf = (condition, props = {}) =>
    condition ? Footer(props) : null;
