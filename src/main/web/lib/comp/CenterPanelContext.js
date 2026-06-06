import {
    createContext,
    useContext
} from "../Grove.js";

export const CenterPanelContext = createContext(null);

export const useCenterPanel = () =>
    useContext(CenterPanelContext);
