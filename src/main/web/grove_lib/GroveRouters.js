/**
 * @file GroveRouters.js
 * Small client-side router utilities for Grove applications.
 */

import {
    createElement,
    useEffect,
    useState
} from "./GroveAdapter.js";

const normalizeHashPath = path => {
    const value = String(path || "/").trim();
    const withoutHash = value.startsWith("#")
        ? value.slice(1)
        : value;
    const normalized = withoutHash.startsWith("/")
        ? withoutHash
        : `/${withoutHash}`;

    return normalized.length > 1
        ? normalized.replace(/\/+$/, "")
        : "/";
};

export const getHashPath = () =>
    normalizeHashPath(window.location.hash.slice(1) || "/");

export const navigateHash = path => {
    const nextPath = normalizeHashPath(path);
    const nextHash = `#${nextPath}`;

    if (window.location.hash === nextHash) {
        window.dispatchEvent(new Event("hashchange"));
        return;
    }

    window.location.hash = nextHash;
};

export const useHashPath = () => {
    const [path, setPath] = useState(getHashPath());

    useEffect(() => {
        const syncPath = () => setPath(getHashPath());

        window.addEventListener("hashchange", syncPath);
        syncPath();

        return () => window.removeEventListener("hashchange", syncPath);
    }, []);

    return path;
};

const matchHashRoute = (routes, path) =>
    (routes || []).find(route =>
        normalizeHashPath(route.path) === path
    );

const resolveRouteElement = element =>
    typeof element === "function"
        ? createElement(element)
        : element;

export const HashRouter = (props = {}) => {
    const path = useHashPath();
    const route = matchHashRoute(props.routes, path)
        || matchHashRoute(props.routes, props.defaultPath || "/")
        || null;

    if (!route) {
        return resolveRouteElement(props.fallback) ?? null;
    }

    if (typeof route.render === "function") {
        return route.render({ path });
    }

    return resolveRouteElement(route.element) ?? resolveRouteElement(props.fallback) ?? null;
};

export const HashLink = (props = {}, ...children) => {
    const {
        href,
        path = href,
        ...linkProps
    } = props;
    const targetPath = normalizeHashPath(path);

    return createElement(
        "a",
        {
            ...linkProps,
            href: `#${targetPath}`
        },
        ...children
    );
};

export const HashNavLink = (props = {}, ...children) => {
    const path = useHashPath();
    const {
        activeClassName = "active",
        className = "",
        href,
        path: routePath = href,
        ...linkProps
    } = props;
    const targetPath = normalizeHashPath(routePath);
    const isActive = path === targetPath;
    const linkClassName = [
        className,
        isActive ? activeClassName : ""
    ]
        .filter(Boolean)
        .join(" ");

    return HashLink(
        {
            ...linkProps,
            className: linkClassName,
            path: targetPath
        },
        ...children
    );
};
