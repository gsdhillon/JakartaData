import {
    createContext,
    openAppPage,
    useContext,
    useMemo,
    useState
} from "../lib/Grove.js";

const sessionStorageKey = "jakartaDataPerson.session";

const readSavedSession = () => {
    if (typeof localStorage === "undefined") {
        return {};
    }

    try {
        return JSON.parse(localStorage.getItem(sessionStorageKey) || "{}");
    } catch {
        return {};
    }
};

const saveSession = session => {
    if (typeof localStorage === "undefined") {
        return;
    }

    localStorage.setItem(sessionStorageKey, JSON.stringify(session));
};

const removeSavedSession = () => {
    if (typeof localStorage !== "undefined") {
        localStorage.removeItem(sessionStorageKey);
    }
};

export const AppContext = createContext({
    authToken: null,
    loggedIn: false,
    loggedInUser: null,
    loginInfo: null,
    loginSession() {},
    logoutSession() {},
    markPasswordChanged() {},
    sessionVersion: 0,
    setLoginInfo() {}
});

export const AppProvider = props => {
    const savedSession = readSavedSession();
    const [authToken, setAuthToken] = useState(savedSession.authToken || null);
    const [loggedInUser, setLoggedInUser] = useState(savedSession.loggedInUser || null);
    const [loginInfo, setLoginInfo] = useState(savedSession.loginInfo || null);
    const [sessionVersion, setSessionVersion] = useState(0);
    const loggedIn = Boolean(authToken && loggedInUser);

    const clearSession = (options = {}) => {
        setAuthToken(null);
        setLoggedInUser(null);
        setLoginInfo(null);
        removeSavedSession();
        if (options.resetPage !== false) {
            setSessionVersion(version => version + 1);
        }
    };

    const value = useMemo(
        () => ({
            authToken,
            loggedIn,
            loggedInUser,
            loginInfo,
            sessionVersion,
            setLoginInfo,
            loginSession(session, nextLoginInfo) {
                const nextUser = session.user || session.person || null;
                const nextToken = session.token;
                const nextInfo = nextLoginInfo || null;

                setAuthToken(session.token);
                setLoggedInUser(nextUser);
                setLoginInfo(nextInfo);
                saveSession({
                    authToken: nextToken,
                    loggedInUser: nextUser,
                    loginInfo: nextInfo
                });
            },
            logoutSession(options) {
                clearSession(options);
            },
            markPasswordChanged() {
                setLoggedInUser(currentUser => {
                    const nextUser = currentUser
                        ? {
                            ...currentUser,
                            passwordChangeRequired: false
                        }
                        : currentUser;

                    saveSession({
                        authToken,
                        loggedInUser: nextUser,
                        loginInfo
                    });

                    return nextUser;
                });
                setTimeout(() => openAppPage("persons"), 0);
            }
        }),
        [authToken, loggedIn, loggedInUser, loginInfo, sessionVersion]
    );

    return AppContext.Provider({
        value,
        children: props.children
    });
};

export const useAppContext = () => useContext(AppContext);

// BOILERPLATE-FRONTEND-AUTH: custom modules should use this hook for authToken, loggedInUser, and role checks.
export const useAuth = () => {
    const context = useAppContext();

    return {
        authToken: context.authToken,
        loggedIn: context.loggedIn,
        loggedInUser: context.loggedInUser,
        hasRole(role) {
            return context.loggedInUser?.role === role;
        },
        hasAnyRole(roles = []) {
            return roles.includes(context.loggedInUser?.role);
        },
        isSelf(id) {
            return String(context.loggedInUser?.id || "") === String(id || "");
        }
    };
};
