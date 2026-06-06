import {
    Button,
    createElement,
    Div,
    useCenterPanel,
    useContext,
    useEffect,
    useMemo,
    useState
} from "../../lib/Grove.js";
import { AppContext } from "../application/AppContext.js";
import TaskForm from "./TaskForm.js";
import {
    completeTaskById,
    createTask,
    deleteTaskById,
    findAllTasks,
    normalizeTask,
    updateTask
} from "./TaskService.js";
import TaskTable from "./TaskTable.js";

const sameUser = (left, right) => String(left || "") === String(right || "");

const TaskList = () => {
    const centerPanel = useCenterPanel();
    const { authToken, loggedInPerson } = useContext(AppContext);
    const loggedInUserId = loggedInPerson?.id ?? null;
    const [tasks, setTasks] = useState([]);
    const [statusMessage, setStatusMessage] = useState("Loading tasks...");
    const [isBusy, setIsBusy] = useState(false);

    const loadTasks = async () => {
        setIsBusy(true);
        setStatusMessage("Loading tasks...");

        try {
            setTasks(await findAllTasks(loggedInUserId, authToken));
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

    const saveTask = (task, mode, id) =>
        mode === "update"
            ? updateTask(id, task, loggedInUserId, authToken)
            : createTask(task, loggedInUserId, authToken);

    const submitTask = async (task, mode, id) => {
        setIsBusy(true);
        setStatusMessage("");

        try {
            await saveTask(task, mode, id);
            await loadTasks();
            centerPanel?.goBack();
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
            await completeTaskById(task.id, loggedInUserId, authToken);
            await loadTasks();
            centerPanel?.goBack();
        } catch {
        } finally {
            setIsBusy(false);
        }
    };

    const openTaskForm = (mode, task = null) => {
        if (!loggedInUserId) {
            setStatusMessage("Login before adding a task.");
            return;
        }

        const normalizedTask = task
            ? normalizeTask(task, loggedInUserId)
            : null;
        const id = normalizedTask?.id;
        const isView = mode === "view";
        const readOnly =
            isView ||
            (normalizedTask && !sameUser(normalizedTask.addBy, loggedInUserId));
        const canComplete =
            isView &&
            normalizedTask &&
            sameUser(normalizedTask.assignedTo, loggedInUserId) &&
            !normalizedTask.completedOn;

        centerPanel?.pushPage({
            title: mode === "update"
                ? "Update"
                : mode === "view"
                    ? "View"
                    : "Add",
            content: createElement(
                TaskForm,
                {
                    isBusy,
                    loggedInUserId,
                    mode,
                    readOnly,
                    showMarkCompleted: canComplete,
                    showSubmit: !isView,
                    task: normalizedTask,
                    onClose() {
                        centerPanel?.goBack();
                    },
                    onMarkCompleted: markCompleted,
                    onSubmit(formTask) {
                        return submitTask(formTask, mode, id);
                    }
                }
            )
        });
    };

    const deleteTask = async task => {
        if (!task.id) {
            setStatusMessage("Unable to delete task without id.");
            return;
        }

        setIsBusy(true);
        setStatusMessage("");

        try {
            await deleteTaskById(task.id, loggedInUserId, authToken);
            await loadTasks();
        } catch {
        } finally {
            setIsBusy(false);
        }
    };

    const toolbarActions = useMemo(
        () => [
            Button({
                icon: "plus-circle",
                label: "Add Task",
                look: "pm",
                name: "addTask",
                type: "button",
                disabled: isBusy || !loggedInUserId,
                onClick() {
                    openTaskForm("add");
                }
            }),
            Button({
                icon: "arrow-clockwise",
                label: null,
                look: "sc",
                name: "refreshTasks",
                title: "Refresh tasks",
                type: "button",
                disabled: isBusy,
                onClick: loadTasks
            })
        ],
        [isBusy, loggedInUserId]
    );

    return Div(
        { className: "card shadow-sm p-4 demo task-list-view" },
        statusMessage
            ? Div(
                { className: "text-muted align-self-stretch task-status" },
                statusMessage
            )
            : null,
        TaskTable({
            isBusy,
            loggedInUserId,
            tasks,
            toolbarActions,
            onDelete: deleteTask,
            onUpdate: task => openTaskForm("update", task),
            onView: task => openTaskForm("view", task)
        })
    );
};

export default TaskList;
