import {
    Button,
    formatInstantLocal,
    Page,
    showAppError,
    Table
} from "../../../grove_lib/GroveComponents.js";

const compactSessionId = sessionId =>
    String(sessionId || "").slice(0, 8);

const formatError = value => {
    if (!value) {
        return "";
    }

    try {
        const parsed = JSON.parse(value);

        return Array.isArray(parsed)
            ? parsed.join("; ")
            : JSON.stringify(parsed);
    } catch {
        return value;
    }
};

const columns = [
    { key: "id", label: "Id" },
    { key: "userId", label: "User Id" },
    { key: "method", label: "Method" },
    { key: "req", label: "Req" },
    {
        essential: false,
        key: "createdAt",
        label: "Created",
        render: error => formatInstantLocal(error.createdAt),
        value: error => formatInstantLocal(error.createdAt)
    },
    {
        key: "error",
        label: "Error",
        render: error => formatError(error.error),
        value: error => formatError(error.error)
    }
];

const UserLoginErrorList = props => {
    const openUser = async error => {
        if (!error.userId) {
            showAppError("Unable to view user without user id.");
            return;
        }

        if (typeof props.openUserView !== "function") {
            showAppError("User view is not configured.");
            return;
        }

        await props.openUserView({
            authToken: props.authToken,
            centerPanel: props.centerPanel,
            userId: error.userId
        });
    };

    return Page({
        layout: "fill",
        content: Table({
            columns,
            emptyMessage: "No errors recorded for this login",
            exportName: `user-login-errors-${compactSessionId(props.sessionId)}`,
            getRowKey: (error, index) => error.id ?? index,
            renderActions: (error, index) => Button({
                id: `viewErrorUser-${index}`,
                icon: "person-vcard",
                label: null,
                look: "sc",
                name: "viewErrorUser",
                disabled: !error.userId,
                title: "View user",
                type: "button",
                onClick() {
                    openUser(error);
                }
            }),
            rows: props.errors || [],
            title: `Errors ${compactSessionId(props.sessionId)}`
        })
    });
};

export default UserLoginErrorList;
