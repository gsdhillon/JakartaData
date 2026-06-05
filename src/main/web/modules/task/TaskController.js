import {
    Button,
    createElement,
    Div,
    useContext,
    useEffect,
    useState
} from "../../lib/Grove.js";
import { AppContext } from "../application/AppContext.js";
import TaskForm from "./TaskForm.js";
import TaskTable from "./TaskTable.js";

const tasksApiUrl = "./api/tasks";

const requestJson = async (url, options = {}) => {
    const response = await fetch(url, {
        ...options,
        headers: {
            ...(options.body ? { "Content-Type": "application/json" } : {}),
            ...(options.userId ? { "X-User-Id": String(options.userId) } : {}),
            ...(options.headers || {})
        }
    });

    if (!response.ok) {
        throw new Error(response.statusText || "Request failed");
    }

    return response.status === 204
        ? null
        : response.json();
};

const createEmptyTask = loggedInUserId => ({
    id: "",
    taskName: "",
    taskDesc: "",
    addBy: loggedInUserId,
    assignedTo: "",
    deadLine: null,
    createdOn: null,
    completedOn: null
});

const normalizeTask = (task, loggedInUserId) => ({
    ...createEmptyTask(loggedInUserId),
    ...(task || {}),
    id: task?.id ?? "",
    addBy: task?.addBy ?? loggedInUserId,
    assignedTo: task?.assignedTo ?? ""
});

const taskPayload = task => ({
    taskName: task.taskName,
    taskDesc: task.taskDesc,
    assignedTo: task.assignedTo === "" ? null : Number(task.assignedTo),
    deadLine: task.deadLine || null
});

const TaskController = () => {
    const { loggedInPerson } = useContext(AppContext);
    const loggedInUserId = loggedInPerson?.id ?? null;
    const [tasks, setTasks] = useState([]);
    const [selectedTask, setSelectedTask] = useState(null);
    const [selectedTaskId, setSelectedTaskId] = useState(null);
    const [statusMessage, setStatusMessage] = useState("Loading tasks...");
    const [isBusy, setIsBusy] = useState(false);
    const [mode, setMode] = useState("list");

    const loadTasks = async () => {
        setIsBusy(true);
        setStatusMessage("Loading tasks...");

        try {
            const loadedTasks = await requestJson(tasksApiUrl);

            setTasks((loadedTasks || []).map(task => normalizeTask(task, loggedInUserId)));
            setStatusMessage("");
        } catch {
            setStatusMessage("Unable to load tasks from server.");
        } finally {
            setIsBusy(false);
        }
    };

    useEffect(() => {
        loadTasks();
    }, [loggedInUserId]);

    const showAddTaskForm = () => {
        if (!loggedInUserId) {
            setStatusMessage("Login before adding a task.");
            return;
        }

        setSelectedTask(null);
        setSelectedTaskId(null);
        setMode("form");
    };

    const showUpdateTaskForm = task => {
        setSelectedTask(normalizeTask(task, loggedInUserId));
        setSelectedTaskId(task.id);
        setMode("form");
    };

    const showViewTaskForm = task => {
        setSelectedTask(normalizeTask(task, loggedInUserId));
        setSelectedTaskId(task.id);
        setMode("view");
    };

    const saveTask = task => {
        const id = selectedTaskId ?? task.id;
        const isUpdate = id !== null && id !== undefined && id !== "";

        return requestJson(
            isUpdate
                ? `${tasksApiUrl}/${id}`
                : tasksApiUrl,
            {
                method: isUpdate ? "PUT" : "POST",
                body: JSON.stringify(taskPayload(task)),
                userId: loggedInUserId
            }
        );
    };

    const submitTask = async task => {
        setIsBusy(true);
        setStatusMessage("");

        try {
            await saveTask(task);
            await loadTasks();
            setSelectedTask(null);
            setSelectedTaskId(null);
            setMode("list");
        } catch {
        } finally {
            setIsBusy(false);
        }
    };

    const deleteTask = async task => {
        if (!task.id) {
            setStatusMessage("Unable to delete task without id.");
            return;
        }

        setIsBusy(true);
        setStatusMessage("");

        try {
            await requestJson(
                `${tasksApiUrl}/${task.id}`,
                {
                    method: "DELETE",
                    userId: loggedInUserId
                }
            );
            await loadTasks();
        } catch {
        } finally {
            setIsBusy(false);
        }
    };

    const markCompleted = async task => {
        if (!task.id) {
            setStatusMessage("Unable to complete task without id.");
            return;
        }

        setIsBusy(true);
        setStatusMessage("");

        try {
            await requestJson(
                `${tasksApiUrl}/${task.id}/complete`,
                {
                    method: "PATCH",
                    userId: loggedInUserId
                }
            );
            await loadTasks();
            setSelectedTask(currentTask =>
                currentTask?.id === task.id
                    ? {
                        ...currentTask,
                        completedOn: new Date().toISOString()
                    }
                    : currentTask
            );
        } catch {
        } finally {
            setIsBusy(false);
        }
    };

    const closeTaskForm = () => {
        setSelectedTask(null);
        setSelectedTaskId(null);
        setMode("list");
    };

    if (mode === "form" || mode === "view") {
        const readOnly = selectedTask && String(selectedTask.addBy) !== String(loggedInUserId);
        const isView = mode === "view";
        const canComplete =
            isView &&
            selectedTask &&
            String(selectedTask.assignedTo || "") === String(loggedInUserId || "") &&
            !selectedTask.completedOn;

        return Div(
            { className: "card shadow-sm p-4 demo" },
            createElement(
                TaskForm,
                {
                    task: selectedTask,
                    loggedInUserId,
                    readOnly: isView || readOnly,
                    showSubmit: !isView,
                    showMarkCompleted: canComplete,
                    onMarkCompleted: markCompleted,
                    onClose: closeTaskForm,
                    isBusy,
                    onSubmit: submitTask
                }
            )
        );
    }

    return Div(
        { className: "card shadow-sm p-4 demo task-list-view" },
        Div(
            { className: "text-muted align-self-stretch task-login-hint" },
            loggedInPerson
                ? `LoggedInUser: ${loggedInPerson.id} ${loggedInPerson.name || ""}`.trim()
                : "LoggedInUser: not logged in"
        ),
        statusMessage
            ? Div(
                { className: "text-muted align-self-stretch task-status" },
                statusMessage
            )
            : null,
        TaskTable({
            tasks,
            loggedInUserId,
            onDelete: deleteTask,
            onView: showViewTaskForm,
            onUpdate: showUpdateTaskForm,
            isBusy
        }),
        Div(
            { className: "task-list-actions" },
            Button({
                label: "Add Task",
                look: "pm",
                name: "addTask",
                type: "button",
                disabled: isBusy || !loggedInUserId,
                onClick: showAddTaskForm
            }),
            Button({
                label: "Refresh",
                look: "sc",
                name: "refreshTasks",
                type: "button",
                disabled: isBusy,
                onClick: loadTasks
            })
        )
    );
};

export default TaskController;
