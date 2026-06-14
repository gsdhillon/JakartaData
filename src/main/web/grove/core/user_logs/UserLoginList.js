import {
    Button,
    createElement,
    formatInstantLocal,
    Page,
    showAppError,
    Table,
    useCenterPanel,
    useEffect,
    useMemo,
    useState
} from "../../../grove_lib/GroveComponents.js";
import { useAuth } from "../AppContext.js";
import UserLoginErrorList from "./UserLoginErrorList.js";
import {
    findAllUserLogins,
    findUserLoginErrors
} from "./UserLogService.js";

const compactSessionId = sessionId =>
    String(sessionId || "").slice(0, 8);

const columns = [
    {
        key: "sessionId",
        label: "Session",
        render: login => compactSessionId(login.sessionId),
        value: login => login.sessionId
    },
    { key: "userId", label: "User Id" },
    { key: "role", label: "Role" },
    {
        key: "loginAt",
        label: "Login At",
        render: login => formatInstantLocal(login.loginAt),
        value: login => formatInstantLocal(login.loginAt)
    },
    {
        essential: false,
        key: "logoutAt",
        label: "Logout At",
        render: login => formatInstantLocal(login.logoutAt),
        value: login => formatInstantLocal(login.logoutAt)
    },
    { essential: false, key: "ip", label: "IP" },
    { key: "numErrors", label: "Errors" }
];

const UserLoginList = props => {
    const centerPanel = useCenterPanel();
    const { authToken } = useAuth();
    const [logins, setLogins] = useState([]);
    const [isBusy, setIsBusy] = useState(false);

    const loadLogins = async () => {
        if (!authToken) {
            setLogins([]);
            return;
        }

        setIsBusy(true);

        try {
            setLogins(await findAllUserLogins(authToken));
        } catch {
            showAppError("Unable to load user login logs from server.");
        } finally {
            setIsBusy(false);
        }
    };

    useEffect(() => {
        loadLogins();
    }, [authToken]);

    const openErrors = async login => {
        if (!login.sessionId || Number(login.numErrors || 0) <= 0) {
            return;
        }

        setIsBusy(true);

        try {
            const errors = await findUserLoginErrors(login.sessionId, authToken);

            centerPanel?.pushPage({
                title: `Errors ${compactSessionId(login.sessionId)}`,
                content: createElement(
                    UserLoginErrorList,
                    {
                        authToken,
                        centerPanel,
                        errors,
                        openUserView: props.openUserView,
                        sessionId: login.sessionId
                    }
                )
            });
        } catch {
            showAppError("Unable to load user error logs from server.");
        } finally {
            setIsBusy(false);
        }
    };

    const openUser = async login => {
        if (!login.userId) {
            showAppError("Unable to view user without user id.");
            return;
        }

        if (typeof props.openUserView !== "function") {
            showAppError("User view is not configured.");
            return;
        }

        await props.openUserView({
            authToken,
            centerPanel,
            userId: login.userId
        });
    };

    const toolbarActions = useMemo(
        () => Button({
            icon: "arrow-clockwise",
            label: null,
            look: "sc",
            name: "refreshUserLogs",
            title: "Refresh user logs",
            type: "button",
            disabled: isBusy,
            onClick: loadLogins
        }),
        [isBusy, authToken]
    );

    return Page(
        { layout: "fill" },
        Table({
            columns,
            emptyMessage: "No user logins recorded",
            exportName: "user-logins",
            getRowKey: (login, index) => login.sessionId || index,
            renderActions: (login, index) => [
                Button({
                    id: `viewLoginUser-${index}`,
                    icon: "person-vcard",
                    label: null,
                    look: "sc",
                    name: "viewLoginUser",
                    disabled: isBusy || !login.userId,
                    title: "View user",
                    type: "button",
                    onClick() {
                        openUser(login);
                    }
                }),
                Button({
                    id: `loginErrors-${index}`,
                    icon: "exclamation-triangle",
                    label: null,
                    look: "ut",
                    name: "loginErrors",
                    disabled: isBusy || Number(login.numErrors || 0) <= 0,
                    title: Number(login.numErrors || 0) > 0
                        ? "View errors for this login"
                        : "No errors for this login",
                    type: "button",
                    onClick() {
                        openErrors(login);
                    }
                })
            ],
            rows: logins,
            toolbarActions,
            title: "User Logs"
        })
    );
};

export default UserLoginList;
