import {
    AppShell,
    Header,
    showAppError
} from "./grove_lib/GroveComponents.js";
import {
    createElement,
    createRoot,
    useCallback,
    useMemo
} from "./grove_lib/GroveAdapter.js";
import {
    AppProvider,
    useAppContext
} from "./grove/core/AppContext.js";
import PersonForm from "./grove/person/PersonForm.js";
import PersonList from "./grove/person/PersonList.js?v=dev-20260607-01";
import {
    findPersonById,
    normalizePerson
} from "./grove/person/PersonService.js";
import ChangePass from "./grove/core/security/ChangePass.js";
import Login from "./grove/core/security/Login.js";
import Logout from "./grove/core/security/Logout.js";
import NotificationBell from "./grove/core/notifications/NotificationBell.js";
import TaskList from "./grove/task/TaskList.js";
import UserLoginList from "./grove/core/user_logs/UserLoginList.js";

const appLogo = new URL("./grove/core/logo.svg", import.meta.url).href;

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
    // REGISTER FRONTEND MODULE PAGES HERE: add/remove module pages for this app.
    {
        component: PersonList,
        key: "persons",
        label: "Persons",
        requiresLogin: true,
        visibleWhen: "always"
    }
    // comment to remove --- do at backend from AModuleRegistry.java
    ,{
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
                notification: createElement(
                    NotificationBell,
                    {
                        authToken,
                        loggedIn,
                        userId: loggedInUser?.id || ""
                    }
                ),
                title: "Grove SupportDesk",
                subTitle: "A framework showcase for service operations"
            }
        ),
        footerProps: {
            brand: "Grove Framework"
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
