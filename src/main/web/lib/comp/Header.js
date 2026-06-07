/**
 * @file Header.js
 * @author Gurmeet Singh
 * @email gsdhillon@gmail.com
 */

import {
    createElement,
    openAppPage,
    useEffect,
    useState
} from "../Grove.js";
import { Div } from "./Div.js";
import { Text } from "./Text.js";

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

const visibleForAuth = (item, authenticated) => {
    const visibility = item.visibleWhen ?? item.visible ?? "always";

    if (visibility === "loggedIn" || visibility === "authenticated") {
        return authenticated;
    }

    if (visibility === "loggedOut" || visibility === "anonymous") {
        return !authenticated;
    }

    return true;
};

const defaultIconFor = item => {
    if (item.icon) {
        return item.icon;
    }

    if (item.action === "logout") {
        return "box-arrow-right";
    }

    if (item.page === "login") {
        return "box-arrow-in-right";
    }

    return null;
};

const menuItemsToAvatarMenu = (menuItems, authenticated, actions) =>
    menuItems
        .filter(item => visibleForAuth(item, authenticated))
        .map(item => ({
            ...item,
            icon: defaultIconFor(item),
            onClick() {
                if (item.page) {
                    openAppPage(item.page);
                    return;
                }

                if (item.action) {
                    actions?.[item.action]?.(item);
                }
            }
        }));

/**
 * Creates an application header.
 * @param {Object} [props={}] - Header attributes and content.
 * @returns {Object} A Grove virtual node.
 */
export const Header = (props = {}) => {
    const {
        avatar,
        avatarMenu = [],
        menuItems,
        actions,
        authenticated = true,
        loginInfo,
        avtar,
        appLogo,
        className = "",
        height = "90px",
        logo = defaultLogo,
        subTitle,
        title,
        ...headerProps
    } = props;
    const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
    useEffect(() => {
        if (!avatarMenuOpen) {
            return undefined;
        }

        const closeAvatarMenu = () => {
            setAvatarMenuOpen(false);
        };

        document.addEventListener("click", closeAvatarMenu);
        return () => document.removeEventListener("click", closeAvatarMenu);
    }, [avatarMenuOpen]);
    const resolvedAvatarMenu = menuItems
        ? menuItemsToAvatarMenu(menuItems, authenticated, actions)
        : avatarMenu;
    const resolvedAvatar =
        avtar ??
        avatar ??
        loginInfo?.avatarThumbnail ??
        loginInfo?.thumbnail ??
        defaultAvatar;
    const resolvedLogo = appLogo ?? logo;
    const headerClassName = [
        "grove-header",
        "text-body",
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
            renderImageSlot(resolvedLogo, "grove-header-logo-image", "Application logo")
        ),
        Div(
            { className: "grove-header-title-block" },
            title
                ? Text({
                    className: "grove-header-title",
                    look: "appTitle",
                    value: title
                })
                : null,
            subTitle
                ? Text({
                    className: "grove-header-subtitle",
                    look: "appSubtitle",
                    value: subTitle
                })
                : null
        ),
        Div(
            {
                className: "grove-header-avatar",
                onClick(event) {
                    event.stopPropagation?.();
                }
            },
            createElement(
                "button",
                {
                    "aria-expanded": avatarMenuOpen,
                    "aria-label": "Account menu",
                    className: "grove-header-avatar-button",
                    type: "button",
                    onClick() {
                        setAvatarMenuOpen(open => !open);
                    }
                },
                renderImageSlot(resolvedAvatar, "grove-header-avatar-image", "User avatar")
            ),
            avatarMenuOpen && resolvedAvatarMenu.length
                ? Div(
                    { className: "grove-header-avatar-menu shadow" },
                    ...resolvedAvatarMenu.map((item, index) =>
                        createElement(
                            "button",
                            {
                                className: "grove-header-avatar-menu-item",
                                disabled: item.disabled,
                                key: item.key || item.label || index,
                                type: "button",
                                onClick() {
                                    setAvatarMenuOpen(false);
                                    item.onClick?.();
                                }
                            },
                            item.icon
                                ? createElement("i", {
                                    "aria-hidden": "true",
                                    className: `bi bi-${item.icon}`
                                })
                                : null,
                            item.label
                        )
                    )
                )
                : null
        )
    );
};

export const HeaderIf = (condition, props = {}) =>
    condition ? Header(props) : null;
