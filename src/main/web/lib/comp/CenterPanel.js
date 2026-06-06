import {
    createElement,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState
} from "../Grove.js";
import { Button } from "./Button.js";
import { CenterPanelContext } from "./CenterPanelContext.js";
import { Div } from "./Div.js";
import { AppErrorToasts } from "./AppError.js";

const pageContent = props =>
    props.content ?? props.children?.[0] ?? null;

export const CenterPanel = (props = {}) => {
    const {
        className = "",
        title = "",
        ...panelProps
    } = props;
    const content = pageContent(props);
    const panelIdRef = useRef(`center-panel-${Math.random().toString(36).slice(2)}`);
    const actionsRef = useRef(null);
    const [fullscreen, setFullscreen] = useState(false);
    const [actions, setActions] = useState(null);
    const [stack, setStack] = useState([
        {
            content,
            title
        }
    ]);

    useEffect(() => {
        setStack([
            {
                content,
                title
            }
        ]);
        actionsRef.current = null;
        setActions(null);
    }, [title]);

    useEffect(() => {
        const updateFullscreen = () => {
            setFullscreen(document.fullscreenElement?.id === panelIdRef.current);
        };

        document.addEventListener("fullscreenchange", updateFullscreen);
        return () => document.removeEventListener("fullscreenchange", updateFullscreen);
    }, []);

    const toggleFullscreen = useCallback(async () => {
        if (document.fullscreenElement) {
            await document.exitFullscreen();
            return;
        }

        await document.getElementById(panelIdRef.current)?.requestFullscreen?.();
    }, []);

    const pushPage = useCallback(page => {
        setStack(current => current.concat(page));
    }, []);

    const goBack = useCallback(() => {
        setStack(current =>
            current.length > 1
                ? current.slice(0, -1)
                : current
        );
    }, []);

    const popTo = useCallback(index => {
        setStack(current => current.slice(0, index + 1));
    }, []);

    const setToolbarActions = useCallback(nextActions => {
        const normalizedActions = nextActions || null;

        if (actionsRef.current === normalizedActions) {
            return;
        }

        actionsRef.current = normalizedActions;
        setActions(normalizedActions);
    }, []);

    const value = useMemo(
        () => ({
            goBack,
            pushPage,
            setActions: setToolbarActions
        }),
        [goBack, pushPage, setToolbarActions]
    );
    const activePage = stack[stack.length - 1] || {};
    const visiblePath = activePage.currentTitleOnly
        ? [activePage]
        : stack;
    const panelClassName = [
        "center-panel",
        className
    ]
        .filter(Boolean)
        .join(" ");

    return createElement(
        CenterPanelContext.Provider,
        { value },
        Div(
            {
                ...panelProps,
                className: panelClassName,
                id: panelProps.id || panelIdRef.current
            },
            Div(
                { className: "center-panel-topbar" },
                Div(
                    {
                        "aria-label": "Current location",
                        className: "center-panel-path"
                    },
                    ...visiblePath.map((page, index) => {
                        const isLast = index === visiblePath.length - 1;

                        return Div(
                            {
                                className: "center-panel-path-part",
                                key: index
                            },
                            index > 0
                                ? createElement(
                                    "span",
                                    { className: "center-panel-path-separator" },
                                    "/"
                                )
                                : null,
                            isLast
                                ? createElement(
                                    "span",
                                    {},
                                    page.title
                                )
                                : createElement(
                                    "button",
                                    {
                                        className: "center-panel-path-button",
                                        onClick: () => popTo(index),
                                        type: "button"
                                    },
                                    page.title
                                )
                        );
                    })
                ),
                Div(
                    { className: "center-panel-actions" },
                    actions,
                    stack.length > 1
                        ? Button({
                            label: "Back",
                            look: "sc",
                            onClick: goBack,
                            type: "button"
                        })
                        : null,
                    Button({
                        icon: fullscreen ? "fullscreen-exit" : "fullscreen",
                        label: null,
                        look: "dn",
                        onClick: toggleFullscreen,
                        title: fullscreen ? "Restore" : "Maximize",
                        type: "button"
                    })
                )
            ),
            Div(
                { className: "center-panel-content" },
                activePage.content
            ),
            fullscreen ? createElement(AppErrorToasts) : null
        )
    );
};
