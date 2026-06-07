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

const pages = [
    {
        component: PersonList,
        key: "persons",
        label: "Persons",
        requiresLogin: true
    },
    {
        component: TaskList,
        key: "tasks",
        label: "Tasks",
        requiresLogin: true
    },
    {
        component: Login,
        hideToolbar: true,
        key: "login",
        label: "Login",
        menu: false,
        requiresLogin: false
    },
    {
        component: ChangePass,
        hideToolbar: true,
        key: "changePass",
        label: "Change Password",
        menu: false,
        requiresLogin: true
    }
];

const accountMenuItems = [
    {
        key: "login",
        label: "Login",
        page: "login",
        visibleWhen: "loggedOut"
    },
    {
        icon: "key",
        key: "changePass",
        label: "Change Password",
        page: "changePass",
        visibleWhen: "loggedIn"
    },
    {
        key: "logout",
        label: "Logout",
        action: "logout",
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
        logoutSession
    } = useAppContext();
    const passwordChangeRequired = Boolean(loggedInPerson?.passwordChangeRequired);

    const resolvedPages = useMemo(
        () => pages.map(page => page.key === "changePass"
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

    return AppShell({
        authenticated: loggedIn,
        forcedPageKey: passwordChangeRequired ? "changePass" : null,
        initialPage: loggedIn ? "persons" : "login",
        loginPageKey: "login",
        pages: resolvedPages,
        Header: Header({
            actions: {
                logout: logoutSession
            },
            authenticated: loggedIn,
            appLogo,
            avatar: loggedInPerson?.photo || undefined,
            loginInfo,
            menuItems: accountMenuItems,
            title: "Jakarta Data Person",
            subTitle: loginInfo
                ? `Signed in as ${loginInfo.name}`
                : "Person and task management"
        }),
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
