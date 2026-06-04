import {
    createContext,
    useContext
} from "../../lib/Grove.js";

export const AppErrorContext = createContext({
    errorMessage: "",
    showError() {
    },
    clearError() {
    }
});

export const useAppError = () => useContext(AppErrorContext);
