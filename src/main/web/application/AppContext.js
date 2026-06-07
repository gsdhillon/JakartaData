import {
    createContext,
    openAppPage,
    useContext,
    useMemo,
    useState
} from "../lib/Grove.js";
import { logout as logoutRequest } from "./security/SecurityService.js";

export const AppContext = createContext({
    authToken: null,
    loggedIn: false,
    loggedInPerson: null,
    loginInfo: null,
    loginSession() {},
    logoutSession() {},
    markPasswordChanged() {},
    setLoginInfo() {}
});

export const AppProvider = props => {
    const [authToken, setAuthToken] = useState(null);
    const [loggedInPerson, setLoggedInPerson] = useState(null);
    const [loginInfo, setLoginInfo] = useState(null);
    const loggedIn = Boolean(authToken && loginInfo);

    const clearSession = () => {
        setAuthToken(null);
        setLoggedInPerson(null);
        setLoginInfo(null);
    };

    const value = useMemo(
        () => ({
            authToken,
            loggedIn,
            loggedInPerson,
            loginInfo,
            setLoginInfo,
            loginSession(session, nextLoginInfo) {
                setAuthToken(session.token);
                setLoggedInPerson(session.person || null);
                setLoginInfo(nextLoginInfo || null);
                setTimeout(
                    () => openAppPage(session.person?.passwordChangeRequired ? "changePass" : "persons"),
                    0
                );
            },
            async logoutSession() {
                try {
                    if (authToken) {
                        await logoutRequest(authToken);
                    }
                } catch {
                } finally {
                    clearSession();
                    setTimeout(() => openAppPage("login"), 0);
                }
            },
            markPasswordChanged() {
                setLoggedInPerson(currentPerson =>
                    currentPerson
                        ? {
                            ...currentPerson,
                            passwordChangeRequired: false
                        }
                        : currentPerson
                );
                setTimeout(() => openAppPage("persons"), 0);
            }
        }),
        [authToken, loggedIn, loggedInPerson, loginInfo]
    );

    return AppContext.Provider({
        value,
        children: props.children
    });
};

export const useAppContext = () => useContext(AppContext);
