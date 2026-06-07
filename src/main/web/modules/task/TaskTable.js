import {
    Button,
    formatInstantLocal,
    Table
} from "../../lib/Grove.js";

const formatDate = value => {
    if (!value) {
        return "";
    }

    const parts = String(value).split("-");

    return parts.length === 3
        ? `${parts[2]}/${parts[1]}/${parts[0]}`
        : value;
};

const formatDateTime = value => {
    if (!value) {
        return "";
    }

    const normalized = String(value).replace("T", " ").slice(0, 16);
    const [date, time] = normalized.split(" ");

    return date
        ? `${formatDate(date)}${time ? ` ${time}` : ""}`
        : normalized;
};

const columns = [
    { key: "id", label: "Id" },
    { key: "taskName", label: "Task Name" },
    { key: "taskDesc", label: "Task Desc" },
    { key: "addBy", label: "Add By" },
    { key: "assignedTo", label: "Assigned To" },
    {
        key: "deadLine",
        label: "Deadline",
        render: task => formatDateTime(task.deadLine),
        value: task => formatDateTime(task.deadLine)
    },
    {
        key: "createdOn",
        label: "Created On",
        render: task => formatInstantLocal(task.createdOn),
        value: task => formatInstantLocal(task.createdOn)
    },
    {
        key: "completedOn",
        label: "Completed On",
        render: task => formatInstantLocal(task.completedOn),
        value: task => formatInstantLocal(task.completedOn)
    }
];

const sameUser = (left, right) => String(left || "") === String(right || "");

const renderActions = props => (task, index) => {
    const canUpdate = sameUser(task.addBy, props.loggedInUserId);

    return [
        Button({
            id: `viewTask-${index}`,
            icon: "eye",
            label: null,
            look: "sc",
            name: "viewTask",
            disabled: props.isBusy,
            title: "View task",
            type: "button",
            onClick() {
                props.onView?.(task, index);
            }
        }),
        Button({
            id: `updateTask-${index}`,
            icon: "pencil-square",
            label: null,
            look: "pm",
            name: "updateTask",
            disabled: props.isBusy || !canUpdate,
            title: canUpdate ? "Update task" : "Only Add By user can update",
            type: "button",
            onClick() {
                props.onUpdate?.(task, index);
            }
        }),
        Button({
            id: `deleteTask-${index}`,
            icon: "trash3",
            label: null,
            look: "dn",
            name: "deleteTask",
            disabled: props.isBusy || !canUpdate,
            title: "Delete task",
            type: "button",
            onClick() {
                props.onDelete?.(task, index);
            }
        })
    ];
};

const TaskTable = (props = {}) =>
    Table({
        columns,
        emptyMessage: "No tasks added",
        exportName: "tasks",
        getRowKey: (task, index) => task.id ?? index,
        renderActions: renderActions(props),
        rows: props.tasks || [],
        toolbarActions: props.toolbarActions,
        title: "Tasks"
    });

export default TaskTable;
