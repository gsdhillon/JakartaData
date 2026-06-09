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
import Logout from "./security/Logout.js";
import TaskList from "../modules/task/TaskList.js";

const appLogo = new URL("./logo.png", import.meta.url).href;

const avatarPages = [
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
        component: Logout,
        hideToolbar: true,
        icon: "box-arrow-right",
        key: "logout",
        label: "Logout",
        requiresLogin: false,
        visibleWhen: "loggedIn"
    }
];

const menuPages = [
    // BOILERPLATE-FRONTEND-PAGES: add custom application pages here.
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
        loggedInUser,
        loginInfo,
        markPasswordChanged,
        sessionVersion
    } = useAppContext();
    const passwordChangeRequired = Boolean(
        loggedInUser && loggedInUser.passwordChangeRequired
    );

    const resolvedAvatarPages = useMemo(
        () => avatarPages.map(page => page.key === "changePass"
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
        menuPages,
        resetKey: sessionVersion,
        avatarPages: resolvedAvatarPages,
        Header: createElement(
            Header,
            {
                authenticated: loggedIn,
                appLogo,
                avatar: loggedInUser ? loggedInUser.avatar || undefined : undefined,
                avatarTitle: loggedInUser?.name || "",
                avatarSubTitle: loggedInUser?.role || "",
                loginInfo,
                title: "Jakarta Data Person",
                subTitle: "Person and task management"
            }
        ),
        footerProps: {
            brand: "Jakarta Data Person"
        }
    });
};


createRoot(document.getElementById("app")).render(
    createElement(
        AppProvider,
        null,
        createElement(AppLayout)
    )
);
