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
        requiresLogin: false,
        visibleWhen: "loggedOut"
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

const pageKeyOf = page =>
    page?.key ?? page?.label ?? page?.title;

const visibleForAuth = (item, authenticated) => {
    const visibility = item.visibleWhen ?? item.visible;

    if (visibility === "loggedIn" || visibility === "authenticated") {
        return authenticated;
    }

    if (visibility === "loggedOut" || visibility === "anonymous") {
        return !authenticated;
    }

    if (item.requiresLogin) {
        return authenticated;
    }

    return true;
};

const pageMenuItem = page => page.action
    ? page
    : {
        ...page,
        page: pageKeyOf(page)
    };

const mobilePageMenuItem = page => ({
    ...pageMenuItem(page),
    active: false
});

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
    const menuPages = resolvedPages.filter(page =>
        ["persons", "tasks"].includes(page.key)
    );
    const avatarPages = resolvedPages
        .filter(page =>
            ["login", "changePass", "logout"].includes(page.key) &&
            visibleForAuth(page, loggedIn)
        )
        .map(pageMenuItem);
    const mobileMenuPages = menuPages.map(mobilePageMenuItem);

    return AppShell({
        authenticated: loggedIn,
        forcedPageKey: passwordChangeRequired ? "changePass" : null,
        initialPage: loggedIn ? "persons" : "login",
        loginPageKey: "login",
        menuPages,
        pages: resolvedPages,
        Header: createElement(
            Header,
            {
                actions: {
                    logout: logoutSession
                },
                authenticated: loggedIn,
                appLogo,
                avatar: loggedInPerson?.photo || undefined,
                loginInfo,
                menuItems: avatarPages,
                mobileMenuItems: mobileMenuPages,
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
