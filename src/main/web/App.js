import {
    AppShell,
    createElement,
    createRoot,
    Header,
    showAppError,
    useCallback,
    useMemo
} from "./grove_lib/Grove.js";
import {
    AppProvider,
    useAppContext
} from "./grove_app/AppContext.js";
import PersonForm from "./modules/person/PersonForm.js";
import PersonList from "./modules/person/PersonList.js?v=dev-20260607-01";
import {
    findPersonById,
    normalizePerson
} from "./modules/person/PersonService.js";
import ChangePass from "./grove_app/security/ChangePass.js";
import Login from "./grove_app/security/Login.js";
import Logout from "./grove_app/security/Logout.js";
import TaskList from "./modules/task/TaskList.js";
import UserLoginList from "./grove_app/user_logs/UserLoginList.js";

const appLogo = new URL("./grove_app/logo.png", import.meta.url).href;

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
        component: UserLoginList,
        icon: "clock-history",
        key: "userLogs",
        label: "User Logs",
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
    const openUserView = useCallback(async ({ userId, centerPanel }) => {
        if (!userId) {
            showAppError("Unable to view user without user id.");
            return;
        }

        try {
            const person = normalizePerson(await findPersonById(userId, authToken));

            centerPanel?.pushPage({
                title: `User ${person.id || userId}`,
                content: createElement(
                    PersonForm,
                    {
                        mode: "view",
                        person,
                        readOnly: true,
                        roleOptions: [
                            {
                                label: person.role || "USER",
                                value: person.role || "USER"
                            }
                        ],
                        roleReadOnly: true,
                        showSubmit: false
                    }
                )
            });
        } catch {
            showAppError("Unable to load user from server.");
        }
    }, [authToken]);

    const resolvedAvatarPages = useMemo(
        () => avatarPages.map(page => {
            if (page.key === "changePass") {
                return {
                    ...page,
                    props: {
                        authToken,
                        onPasswordChanged: markPasswordChanged
                    }
                };
            }

            if (page.key === "userLogs") {
                return {
                    ...page,
                    props: {
                        openUserView
                    }
                };
            }

            return page;
        }),
        [authToken, markPasswordChanged, openUserView]
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
                title: "Jakarta Data",
                subTitle: "User and task management"
            }
        ),
        footerProps: {
            brand: "Jakarta Data"
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
