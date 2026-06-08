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
import { Text } from "./Text.js";

const pageContent = props =>
    props.content !== undefined
        ? props.content
        : props.children && props.children.length
            ? props.children[0]
            : null;

export const CenterPanel = (props = {}) => {
    const {
        className = "",
        hideToolbar = false,
        title = "",
        ...panelProps
    } = props;
    const content = pageContent(props);
    const panelIdRef = useRef(`grove-center-panel-${Math.random().toString(36).slice(2)}`);
    const panelId = panelProps.id || panelIdRef.current;
    const actionsRef = useRef(null);
    const [fullscreen, setFullscreen] = useState(false);
    const [actions, setActions] = useState(null);
    const [stack, setStack] = useState([
        {
            content,
            hideToolbar,
            title
        }
    ]);

    useEffect(() => {
        setStack([
            {
                content,
                hideToolbar,
                title
            }
        ]);
        actionsRef.current = null;
        setActions(null);
    }, [title, hideToolbar]);

    useEffect(() => {
        const updateFullscreen = () => {
            setFullscreen(document.fullscreenElement && document.fullscreenElement.id === panelId);
        };

        document.addEventListener("fullscreenchange", updateFullscreen);
        return () => document.removeEventListener("fullscreenchange", updateFullscreen);
    }, [panelId]);

    const toggleFullscreen = useCallback(async () => {
        if (document.fullscreenElement) {
            await document.exitFullscreen();
            setFullscreen(false);
            return;
        }

        const panelElement = document.getElementById(panelId);

        if (panelElement && typeof panelElement.requestFullscreen === "function") {
            await panelElement.requestFullscreen();
        }
        setFullscreen(true);
    }, [panelId]);

    const pushPage = useCallback(page => {
        actionsRef.current = null;
        setActions(null);
        setStack(current => current.concat(page));
    }, []);

    const goBack = useCallback(() => {
        actionsRef.current = null;
        setActions(null);
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
        "grove-center-panel",
        activePage.hideToolbar ? "grove-center-panel-toolbar-hidden" : "",
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
                id: panelId
            },
            activePage.hideToolbar
                ? null
                : Div(
                    { className: "grove-center-panel-topbar" },
                    Div(
                        { className: "grove-center-panel-system-row" },
                        Div(
                            {
                                "aria-label": "Current location",
                                className: "grove-center-panel-path"
                            },
                            ...visiblePath.map((page, index) => {
                                const isLast = index === visiblePath.length - 1;

                                return Div(
                                    {
                                        className: "grove-center-panel-path-part",
                                        key: index
                                    },
                                    index > 0
                                        ? createElement(
                                            "span",
                                            { className: "grove-center-panel-path-separator" },
                                            "/"
                                        )
                                        : null,
                                    isLast
                                        ? Text({
                                            look: "title",
                                            value: page.title
                                        })
                                        : createElement(
                                            "button",
                                            {
                                                className: "grove-center-panel-path-button",
                                                onClick: () => popTo(index),
                                                type: "button"
                                            },
                                            Text({
                                                look: "title",
                                                value: page.title
                                            })
                                        )
                                );
                            })
                        ),
                        actions
                            ? Div(
                                { className: "grove-center-panel-actions" },
                                actions
                            )
                            : null,
                        Div(
                            { className: "grove-center-panel-system-actions" },
                            stack.length > 1
                                ? Button({
                                    icon: "arrow-left",
                                    label: null,
                                    look: "sc",
                                    onClick: goBack,
                                    title: "Back",
                                    type: "button"
                                })
                                : null,
                            Button({
                                icon: fullscreen ? "fullscreen-exit" : "fullscreen",
                                label: null,
                                look: "sc",
                                onClick: toggleFullscreen,
                                title: fullscreen ? "Restore" : "Maximize",
                                type: "button"
                            })
                        )
                    )
                ),
            Div(
                { className: "grove-center-panel-content" },
                activePage.content
            ),
            fullscreen ? createElement(AppErrorToasts) : null
        )
    );
};
