import {
    AppShell,
    createElement,
    createRoot,
    Footer,
    Header
} from "../lib/Grove.js";
import {
    AppProvider,
    useAppContext
} from "./AppContext.js";
import PersonList from "../modules/person/PersonList.js";
import ChangePass from "./security/ChangePass.js";
import Login from "./security/Login.js";
import TaskList from "../modules/task/TaskList.js";

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
        key: "login",
        label: "Login",
        menu: false,
        requiresLogin: false
    },
    {
        component: ChangePass,
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
        loginInfo,
        logoutSession
    } = useAppContext();

    const resolvedPages = pages.map(page => page.key === "changePass"
        ? {
            ...page,
            props: { authToken }
        }
        : page);

    return AppShell({
        authenticated: loggedIn,
        initialPage: loggedIn ? "persons" : "login",
        loginPageKey: "login",
        pages: resolvedPages,
        Header: Header({
            actions: {
                logout: logoutSession
            },
            authenticated: loggedIn,
            loginInfo,
            menuItems: accountMenuItems,
            title: "Jakarta Data Person",
            subTitle: loginInfo
                ? `Signed in as ${loginInfo.name}`
                : "Person and task management"
        }),
        Footer: Footer({
            brand: "Jakarta Data Person"
        })
    });
};

const App = () => createElement(
    AppProvider,
    null,
    createElement(AppLayout)
);

createRoot(document.getElementById("app")).render(createElement(App));
