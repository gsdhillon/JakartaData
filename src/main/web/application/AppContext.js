import {
    createContext,
    openAppPage,
    useContext,
    useMemo,
    useState
} from "../lib/Grove.js";

export const AppContext = createContext({
    authToken: null,
    loggedIn: false,
    loggedInPerson: null,
    loginInfo: null,
    loginSession() {},
    logoutSession() {},
    markPasswordChanged() {},
    sessionVersion: 0,
    setLoginInfo() {}
});

export const AppProvider = props => {
    const [authToken, setAuthToken] = useState(null);
    const [loggedInPerson, setLoggedInPerson] = useState(null);
    const [loginInfo, setLoginInfo] = useState(null);
    const [sessionVersion, setSessionVersion] = useState(0);
    const loggedIn = Boolean(authToken && loginInfo);

    const clearSession = (options = {}) => {
        setAuthToken(null);
        setLoggedInPerson(null);
        setLoginInfo(null);
        if (options.resetPage !== false) {
            setSessionVersion(version => version + 1);
        }
    };

    const value = useMemo(
        () => ({
            authToken,
            loggedIn,
            loggedInPerson,
            loginInfo,
            sessionVersion,
            setLoginInfo,
            loginSession(session, nextLoginInfo) {
                setAuthToken(session.token);
                setLoggedInPerson(session.person || null);
                setLoginInfo(nextLoginInfo || null);
            },
            logoutSession(options) {
                clearSession(options);
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
        [authToken, loggedIn, loggedInPerson, loginInfo, sessionVersion]
    );

    return AppContext.Provider({
        value,
        children: props.children
    });
};

export const useAppContext = () => useContext(AppContext);
