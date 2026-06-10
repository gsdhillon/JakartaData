/**
 * @file AppShell.js
 * @author Gurmeet Singh
 * @email gsdhillon@gmail.com
 */

import {
    createElement,
    useEffect,
    useMemo,
    useState
} from "../Grove.js";
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
const emptyPages = [];
const openPageEventName = "grove-app-open-page";
const themeStorageKey = "grove.themeMode";

const normalizeThemeMode = value =>
    value === "dark" ? "dark" : "light";

const savedThemeMode = () => {
    if (typeof localStorage === "undefined") {
        return null;
    }

    const value = localStorage.getItem(themeStorageKey);

    return value === null ? null : normalizeThemeMode(value);
};

const saveThemeMode = value => {
    if (typeof localStorage !== "undefined") {
        localStorage.setItem(themeStorageKey, normalizeThemeMode(value));
    }
};

const pageKeyFromHash = () =>
    typeof window === "undefined"
        ? null
        : window.location.hash.replace(/^#/, "") || null;

const setPageHash = key => {
    if (typeof window === "undefined" || !key) {
        return;
    }

    const nextHash = `#${key}`;

    if (window.location.hash !== nextHash) {
        window.location.hash = nextHash;
    }
};

export const openAppPage = key => {
    if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent(openPageEventName, { detail: { key } }));
    }
};

const pageKeyOf = page =>
    page
        ? page.key !== undefined
            ? page.key
            : page.label !== undefined
                ? page.label
                : page.title
        : undefined;

const visibleForAuth = (item, authenticated) => {
    const visibility = item.visibleWhen !== undefined
        ? item.visibleWhen
        : item.visible;

    if (visibility === "always") {
        return true;
    }

    if (visibility === "loggedIn" || visibility === "authenticated") {
        return authenticated;
    }

    if (visibility === "loggedOut" || visibility === "anonymous") {
        return !authenticated;
    }

    if (item.requiresLogin) {
        return authenticated;
    }

    return true;
};

const targetPageKey = (page, authenticated, loginPageKey, forcedPageKey) =>
    page && page.requiresLogin && !authenticated
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
        actions,
        avatarPages,
        avtarPages = [],
        Center,
        centerTitle = "",
        Footer,
        Header,
        Menu,
        forcedPageKey = null,
        menuPages = emptyPages,
        pages = emptyPages,
        initialPage,
        resetKey,
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
    const resolvedAvatarPages = avatarPages !== undefined
        ? avatarPages
        : avtarPages;
    const shellPages = useMemo(
        () => pages.length
            ? pages
            : menuPages.length
                ? menuPages.concat(resolvedAvatarPages)
                : resolvedAvatarPages,
        [pages, menuPages, resolvedAvatarPages]
    );
    const firstPage = shellPages.find(page => !page.action) || shellPages[0];
    const hashPageKey = pageKeyFromHash();
    const hashPage = hashPageKey
        ? shellPages.find(page => pageKeyOf(page) === hashPageKey)
        : null;
    const initialPageKey = hashPage
        ? targetPageKey(hashPage, authenticated, loginPageKey, forcedPageKey)
        : initialPage !== undefined
            ? initialPage
            : pageKeyOf(firstPage);
    const [activePageKey, setActivePageKey] = useState(
        initialPageKey
    );
    const [activeThemeMode, setActiveThemeMode] = useState(
        savedThemeMode() || normalizeThemeMode(themeMode)
    );
    const activePage =
        shellPages.find(page => pageKeyOf(page) === activePageKey) || firstPage;
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
            const nextKey = event.detail && event.detail.key;
            const nextPage = shellPages.find(page => pageKeyOf(page) === nextKey);

            if (nextPage) {
                setActivePageKey(targetPageKey(nextPage, authenticated, loginPageKey, forcedPageKey));
            }
        };

        window.addEventListener(openPageEventName, openPage);
        return () => window.removeEventListener(openPageEventName, openPage);
    }, [shellPages, authenticated, loginPageKey, forcedPageKey]);

    useEffect(() => {
        const openHashPage = () => {
            const nextKey = pageKeyFromHash();
            const nextPage = nextKey
                ? shellPages.find(page => pageKeyOf(page) === nextKey)
                : null;

            if (nextPage) {
                setActivePageKey(targetPageKey(nextPage, authenticated, loginPageKey, forcedPageKey));
            }
        };

        window.addEventListener("hashchange", openHashPage);
        return () => window.removeEventListener("hashchange", openHashPage);
    }, [shellPages, authenticated, loginPageKey, forcedPageKey]);

    useEffect(() => {
        setPageHash(activePageKey);
    }, [activePageKey]);

    useEffect(() => {
        if (authenticated && forcedPageKey && activePageKey !== forcedPageKey) {
            setActivePageKey(forcedPageKey);
        }
    }, [authenticated, forcedPageKey, activePageKey]);

    useEffect(() => {
        if (initialPage !== undefined) {
            setActivePageKey(initialPage);
        }
    }, [resetKey]);

    useEffect(() => {
        if (!authenticated && activePage && activePage.requiresLogin && activePageKey !== loginPageKey) {
            setActivePageKey(loginPageKey);
        }
    }, [authenticated, activePage, activePageKey, loginPageKey]);

    useEffect(() => {
        if (!authenticated || activePageKey !== loginPageKey || initialPage === undefined) {
            return;
        }

        const initialPageConfig = shellPages.find(page => pageKeyOf(page) === initialPage);

        if (initialPageConfig) {
            setActivePageKey(targetPageKey(initialPageConfig, authenticated, loginPageKey, forcedPageKey));
        }
    }, [authenticated, activePageKey, initialPage, shellPages, loginPageKey, forcedPageKey]);

    useEffect(() => {
        if (savedThemeMode() === null) {
            setActiveThemeMode(normalizeThemeMode(themeMode));
        }
    }, [themeMode]);

    const configuredMenuPages = menuPages.length
        ? menuPages
        : shellPages.filter(page =>
            page.menu !== false &&
            !page.action
        );
    const resolvedMenuPages = configuredMenuPages.filter(page =>
        visibleForAuth(page, authenticated)
    );
    const mainMenuLinks = resolvedMenuPages.map(page => ({
        active: page === activePage,
        icon: page.icon,
        key: pageKeyOf(page),
        label: page.label !== undefined ? page.label : page.title,
        onClick() {
            setActivePageKey(targetPageKey(page, authenticated, loginPageKey, forcedPageKey));
        }
    }));
    const generatedMenu = resolvedMenuPages.length
        ? MenuComponent({
            links: mainMenuLinks
        })
        : null;
    const mobileMenuItems = resolvedMenuPages.map(page => ({
        ...page,
        active: pageKeyOf(page) === activePageKey,
        page: pageKeyOf(page)
    }));
    const resolvedHeader = Header && Header.props
        ? {
            ...Header,
            props: {
                ...Header.props,
                actions: Header.props.actions !== undefined ? Header.props.actions : actions,
                authenticated,
                avatarPages: Header.props.avatarPages !== undefined ? Header.props.avatarPages : resolvedAvatarPages,
                mobileMenuItems: Header.props.mobileMenuItems !== undefined ? Header.props.mobileMenuItems : mobileMenuItems
            }
        }
        : Header;
    const generatedCenter = activePage && activePage.component
        ? createElement(activePage.component, activePage.props || {})
        : activePage
            ? activePage.content
            : undefined;
    const activeCenterTitle = activePage && activePage.title !== undefined
        ? activePage.title
        : activePage && activePage.label !== undefined
            ? activePage.label
            : centerTitle;
    const centerContent = Center !== undefined
        ? Center
        : center !== undefined
            ? center
            : generatedCenter;
    const wrappedCenterContent =
        centerContent !== null && centerContent !== undefined
            ? createElement(
                CenterPanel,
                {
                    hideToolbar: activePage && activePage.hideToolbar === true,
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
            onThemeToggle: footerProps.onThemeToggle !== undefined ? footerProps.onThemeToggle : (() => {
                setActiveThemeMode(current => {
                    const nextThemeMode = current === "dark" ? "light" : "dark";

                    saveThemeMode(nextThemeMode);
                    return nextThemeMode;
                });
            }),
            themeMode: footerProps.themeMode !== undefined ? footerProps.themeMode : normalizedTheme
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
        resolvedHeader !== undefined ? resolvedHeader : header,
        Div(
            { className: "grove-app-shell-body" },
            Menu !== undefined ? Menu : menu !== undefined ? menu : generatedMenu,
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
        Footer !== undefined ? Footer : footer !== undefined ? footer : generatedFooter,
        createElement(AppErrorToasts),
        createElement(RestTap)
    );
};

export const AppShellIf = (condition, props = {}) =>
    condition ? AppShell(props) : null;
