import {
    AppShell,
    createElement,
    createRoot,
    Header,
    useMemo
} from "../lib/Grove.js";
import {
    AppProvider,
    useAppContext
} from "./AppContext.js";
import PersonList from "../modules/person/PersonList.js?v=dev-20260607-01";
import ChangePass from "./security/ChangePass.js";
import Login from "./security/Login.js";
import TaskList from "../modules/task/TaskList.js";

const appLogo = new URL("./logo.png", import.meta.url).href;

const avtarPages = [
    {
        component: Login,
        hideToolbar: true, // Page layout behavior: hide CenterPanel toolbar.
        key: "login",
        label: "Login",
        requiresLogin: false, // Access behavior: page can open without login.
        visibleWhen: "loggedOut" // Visibility behavior: show only before login.
    },
    {
        component: ChangePass,
        hideToolbar: true,
        icon: "key",
        key: "changePass",
        label: "Change Password",
        requiresLogin: true,
        visibleWhen: "loggedIn"
    },
    {
        action: "logout",
        key: "logout",
        label: "Logout",
        visibleWhen: "loggedIn"
    }
];

const menuPages = [
    {
        component: PersonList,
        key: "persons",
        label: "Persons",
        requiresLogin: true,
        visibleWhen: "always"
    },
    {
        component: TaskList,
        key: "tasks",
        label: "Tasks",
        requiresLogin: true,
        visibleWhen: "loggedIn"
    }
];

const AppLayout = () => {
    const {
        authToken,
        loggedIn,
        loggedInPerson,
        loginInfo,
        markPasswordChanged,
        logoutSession,
        sessionVersion
    } = useAppContext();
    const passwordChangeRequired = Boolean(
        loggedInPerson && loggedInPerson.passwordChangeRequired
    );

    const resolvedAvtarPages = useMemo(
        () => avtarPages.map(page => page.key === "changePass"
            ? {
                ...page,
                props: {
                    authToken,
                    onPasswordChanged: markPasswordChanged
                }
            }
            : page),
        [authToken, markPasswordChanged]
    );

    return createElement(AppShell, {
        actions: {
            logout: logoutSession
        },
        authenticated: loggedIn,
        forcedPageKey: passwordChangeRequired ? "changePass" : null,
        initialPage: loggedIn ? "persons" : "login",
        loginPageKey: "login",
        menuPages,
        resetKey: sessionVersion,
        avtarPages: resolvedAvtarPages,
        Header: createElement(
            Header,
            {
                actions: {
                    logout: logoutSession
                },
                authenticated: loggedIn,
                appLogo,
                avatar: loggedInPerson ? loggedInPerson.photo || undefined : undefined,
                loginInfo,
                title: "Jakarta Data Person",
                subTitle: loginInfo
                    ? `Signed in as ${loginInfo.name}`
                    : "Person and task management"
            }
        ),
        footerProps: {
            brand: "Jakarta Data Person"
        }
    });
};

const App = () => createElement(
    AppProvider,
    null,
    createElement(AppLayout)
);

createRoot(document.getElementById("app")).render(createElement(App));
