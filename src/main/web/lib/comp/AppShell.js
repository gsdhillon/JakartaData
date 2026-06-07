/**
 * @file AppShell.js
 * @author Gurmeet Singh
 * @email gsdhillon@gmail.com
 */

import { createElement, useEffect, useState } from "../Grove.js";
import { AppErrorToasts } from "./AppError.js";
import { CenterPanel } from "./CenterPanel.js";
import { Div } from "./Div.js";
import { Footer as FooterComponent } from "./Footer.js";
import { Menu as MenuComponent } from "./Menu.js";
import { RestTap } from "./REST.js";

const bgByTheme = {
    dark: new URL("../grove-bg-dark.svg", import.meta.url).href,
    light: new URL("../grove-bg-light.svg", import.meta.url).href
};
const openPageEventName = "grove-app-open-page";

export const openAppPage = key => {
    if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent(openPageEventName, { detail: { key } }));
    }
};

const pageKeyOf = page =>
    page?.key ?? page?.label ?? page?.title;

const targetPageKey = (page, authenticated, loginPageKey, forcedPageKey) =>
    page?.requiresLogin && !authenticated
        ? loginPageKey
        : authenticated && forcedPageKey && pageKeyOf(page) !== forcedPageKey
            ? forcedPageKey
            : pageKeyOf(page);

/**
 * Creates the page shell with header, menu, center area, right strip, and footer.
 * @param {Object} [props={}] - Shell regions.
 * @returns {Object} A Grove virtual node.
 */
export const AppShell = (props = {}) => {
    const {
        Center,
        centerTitle = "",
        Footer,
        Header,
        Menu,
        forcedPageKey = null,
        pages = [],
        initialPage,
        authenticated = true,
        loginPageKey = "login",
        center,
        className = "",
        footer,
        footerProps = {},
        header,
        menu,
        themeMode = "light",
        ...shellProps
    } = props;
    const firstPage = pages[0];
    const [activePageKey, setActivePageKey] = useState(
        initialPage ?? firstPage?.key ?? firstPage?.label ?? firstPage?.title
    );
    const [activeThemeMode, setActiveThemeMode] = useState(
        themeMode === "dark" ? "dark" : "light"
    );
    const activePage =
        pages.find(page => pageKeyOf(page) === activePageKey) ?? firstPage;
    const normalizedTheme = activeThemeMode === "dark"
        ? "dark"
        : "light";
    const shellClassName = [
        "grove-app-shell",
        `grove-theme-${normalizedTheme}`,
        className
    ]
        .filter(Boolean)
        .join(" ");
    useEffect(() => {
        const openPage = event => {
            const nextKey = event.detail?.key;
            const nextPage = pages.find(page => pageKeyOf(page) === nextKey);

            if (nextPage) {
                setActivePageKey(targetPageKey(nextPage, authenticated, loginPageKey, forcedPageKey));
            }
        };

        window.addEventListener(openPageEventName, openPage);
        return () => window.removeEventListener(openPageEventName, openPage);
    }, [pages, authenticated, loginPageKey, forcedPageKey]);

    useEffect(() => {
        if (authenticated && forcedPageKey && activePageKey !== forcedPageKey) {
            setActivePageKey(forcedPageKey);
        }
    }, [authenticated, forcedPageKey, activePageKey]);

    useEffect(() => {
        if (!authenticated || activePageKey !== loginPageKey) {
            return;
        }

        const nextPage =
            pages.find(page => page.menu !== false && page.requiresLogin) ??
            pages.find(page => pageKeyOf(page) !== loginPageKey);
        const nextKey = pageKeyOf(nextPage);

        if (nextKey && nextKey !== loginPageKey) {
            setActivePageKey(nextKey);
        }
    }, [authenticated, activePageKey, loginPageKey, pages]);

    useEffect(() => {
        setActiveThemeMode(themeMode === "dark" ? "dark" : "light");
    }, [themeMode]);

    const menuPages = pages.filter(page => page.menu !== false);
    const generatedMenu = menuPages.length
        ? MenuComponent({
            links: menuPages.map(page => {
                return {
                    active: page === activePage,
                    label: page.label ?? page.title,
                    onClick() {
                        setActivePageKey(targetPageKey(page, authenticated, loginPageKey, forcedPageKey));
                    }
                };
            })
        })
        : null;
    const generatedCenter = activePage?.component
        ? createElement(activePage.component, activePage.props || {})
        : activePage?.content;
    const activeCenterTitle = activePage?.title ?? activePage?.label ?? centerTitle;
    const centerContent = Center ?? center ?? generatedCenter;
    const wrappedCenterContent =
        centerContent !== null && centerContent !== undefined
            ? createElement(
                CenterPanel,
                {
                    title: activeCenterTitle
                },
                centerContent
            )
            : centerContent;
    const centerClassName = [
        "grove-app-shell-center",
        centerContent !== null && centerContent !== undefined
            ? "grove-app-shell-center-present"
            : ""
    ]
        .filter(Boolean)
        .join(" ");
    const generatedFooter = createElement(
        FooterComponent,
        {
            ...footerProps,
            onThemeToggle: footerProps.onThemeToggle ?? (() => {
                setActiveThemeMode(current => current === "dark" ? "light" : "dark");
            }),
            themeMode: footerProps.themeMode ?? normalizedTheme
        }
    );

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
            Menu ?? menu ?? generatedMenu,
            createElement(
                "main",
                {
                    className: centerClassName,
                    role: "main"
                },
                wrappedCenterContent
            ),
            Div({
                "aria-hidden": "true",
                className: "grove-app-shell-right-strip"
            })
        ),
        Footer ?? footer ?? generatedFooter,
        createElement(AppErrorToasts),
        createElement(RestTap)
    );
};

export const AppShellIf = (condition, props = {}) =>
    condition ? AppShell(props) : null;
