import {
    Button,
    createElement,
    Page,
    showAppError,
    useCenterPanel,
    useEffect,
    useMemo,
    useState
} from "../../grove_lib/GroveComponents.js";
import { useAuth } from "../core/AppContext.js";
import TaskForm from "./TaskForm.js";
import {
    addTaskAction,
    createTask,
    deleteTaskById,
    findAllTasks,
    normalizeTask,
    updateTask
} from "./TaskService.js";
import TaskTable from "./TaskTable.js";

const sameUser = (left, right) => String(left || "") === String(right || "");

const isTaskMember = (task, userId) =>
    (task?.memberIds || [])
        .some(personId => sameUser(personId, userId));

const TaskList = () => {
    const centerPanel = useCenterPanel();
    const { authToken, loggedInUser } = useAuth();
    const loggedInUserId = loggedInUser?.id ?? null;
    const [tasks, setTasks] = useState([]);
    const [isBusy, setIsBusy] = useState(false);

    const loadTasks = async () => {
        setIsBusy(true);

        try {
            setTasks(await findAllTasks(loggedInUserId, authToken));
        } catch {
            showAppError("Unable to load tasks from server.");
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

        try {
            await saveTask(task, mode, id);
            await loadTasks();
            centerPanel?.goBack();
        } catch {
        } finally {
            setIsBusy(false);
        }
    };

    const addAction = async (taskId, action) => {
        if (!taskId) {
            showAppError("Save the task before adding actions.");
            return null;
        }

        setIsBusy(true);

        try {
            const savedTask = await addTaskAction(taskId, action, loggedInUserId, authToken);

            await loadTasks();
            return normalizeTask(savedTask, loggedInUserId);
        } catch {
            return null;
        } finally {
            setIsBusy(false);
        }
    };

    const openTaskForm = (mode, task = null) => {
        if (!loggedInUserId) {
            showAppError("Login before adding a task.");
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
        const isCreator = sameUser(normalizedTask?.addBy, loggedInUserId);
        const canAddActions = Boolean(
            normalizedTask?.id &&
            (
                isCreator ||
                isTaskMember(normalizedTask, loggedInUserId)
            ) &&
            (!normalizedTask.completedOn || isCreator)
        );

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
                    authToken,
                    centerPanel,
                    canAddActions,
                    canReopenTask: isCreator,
                    creatorPerson: normalizedTask?.creator || loggedInUser || null,
                    loggedInUserId,
                    mode,
                    readOnly,
                    showSubmit: !isView,
                    task: normalizedTask,
                    onClose() {
                        centerPanel?.goBack();
                    },
                    onSubmit(formTask) {
                        return submitTask(formTask, mode, id);
                    },
                    onAddAction(action) {
                        return addAction(id, action);
                    }
                }
            )
        });
    };

    const deleteTask = async task => {
        if (!task.id) {
            showAppError("Unable to delete task without id.");
            return;
        }

        setIsBusy(true);

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
        [isBusy, loggedInUserId, authToken]
    );

    return Page(
        { layout: "fill" },
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
