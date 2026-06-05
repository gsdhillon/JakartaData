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

const defaultAvatar = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Crect width='48' height='48' rx='24' fill='%23dbeafe'/%3E%3Ccircle cx='24' cy='19' r='7' fill='%231e40af'/%3E%3Cpath d='M12 39c2-8 7-12 12-12s10 4 12 12' fill='%231e40af'/%3E%3C/svg%3E";
const defaultLogo = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%23eff6ff'/%3E%3Cpath d='M18 44c2-8 8-12 14-12s12 4 14 12' fill='none' stroke='%232563eb' stroke-width='5' stroke-linecap='round'/%3E%3Ccircle cx='32' cy='22' r='8' fill='%232563eb'/%3E%3C/svg%3E";

/**
 * Creates an application header.
 * @param {Object} [props={}] - Header attributes and content.
 * @returns {Object} A Grove virtual node.
 */
export const Header = (props = {}) => {
    const {
        avatar = defaultAvatar,
        avtar,
        className = "",
        height = "90px",
        logo = defaultLogo,
        subTitle,
        title,
        userId,
        loginDisabled = false,
        onLogin,
        onUserIdChange,
        ...headerProps
    } = props;
    const headerClassName = [
        "grove-header",
        "bg-body-tertiary",
        "text-body",
        "border-bottom",
        className
    ]
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
            userId !== undefined
                ? createElement(
                    "label",
                    { className: "grove-header-user-id" },
                    "UserId",
                    createElement(
                        "input",
                        {
                            className: "form-control form-control-sm grove-header-user-id-control",
                            min: "1",
                            name: "loggedInUserId",
                            type: "number",
                            value: userId,
                            onChange(event) {
                                onUserIdChange?.(event.target.value);
                            }
                        }
                    ),
                    createElement(
                        "button",
                        {
                            className: "btn btn-sm btn-primary grove-header-login",
                            disabled: loginDisabled,
                            type: "button",
                            onClick() {
                                onLogin?.();
                            }
                        },
                        "Login"
                    )
                )
                : null,
            renderImageSlot(avtar ?? avatar, "grove-header-avatar-image", "User avatar")
        )
    );
};

export const HeaderIf = (condition, props = {}) =>
    condition ? Header(props) : null;
