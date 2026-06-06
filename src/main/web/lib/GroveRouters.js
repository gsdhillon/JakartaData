import {
    createElement,
    useEffect,
    useState
} from "./Grove.js";

const normalizePath = path => {
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
    normalizePath(window.location.hash.slice(1) || "/");

export const navigateHash = path => {
    const nextPath = normalizePath(path);
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

const matchRoute = (routes, path) =>
    (routes || []).find(route =>
        normalizePath(route.path) === path
    );

const resolveElement = element =>
    typeof element === "function"
        ? createElement(element)
        : element;

export const HashRouter = (props = {}) => {
    const path = useHashPath();
    const route = matchRoute(props.routes, path)
        || matchRoute(props.routes, props.defaultPath || "/")
        || null;

    if (!route) {
        return resolveElement(props.fallback) ?? null;
    }

    if (typeof route.render === "function") {
        return route.render({ path });
    }

    return resolveElement(route.element) ?? resolveElement(props.fallback) ?? null;
};

export const HashLink = (props = {}, ...children) => {
    const {
        href,
        path = href,
        ...linkProps
    } = props;
    const targetPath = normalizePath(path);

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
    const targetPath = normalizePath(routePath);
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
