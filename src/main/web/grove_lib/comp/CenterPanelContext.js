import {
    createContext,
    useContext,
    useEffect,
    useLayoutEffect,
    useRef
} from "../GroveAdapter.js";

export const CenterPanelContext = createContext(null);

export const useCenterPanel = () =>
    useContext(CenterPanelContext);

export const useCenterPanelActions = actions => {
    const centerPanel = useCenterPanel();
    const centerPanelRef = useRef(centerPanel);

    useLayoutEffect(() => {
        if (!centerPanel) {
            return undefined;
        }

        centerPanelRef.current = centerPanel;
        centerPanel.setActions(actions || null);
    }, [actions, centerPanel]);

    useEffect(() => () => {
        centerPanelRef.current?.setActions(null);
    }, []);
};
