import { requestJson } from "../../lib/Grove.js";

const tasksApiUrl = "./api/tasks";

export const createEmptyTask = loggedInUserId => ({
    id: "",
    taskName: "",
    taskDesc: "",
    addBy: loggedInUserId,
    assignedTo: "",
    deadLine: null,
    createdOn: null,
    completedOn: null
});

export const normalizeTask = (task, loggedInUserId) => ({
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

export const findAllTasks = (loggedInUserId, authToken) =>
    requestJson(tasksApiUrl, { authToken })
        .then(tasks => (tasks || []).map(task => normalizeTask(task, loggedInUserId)));

export const createTask = (task, loggedInUserId, authToken) =>
    requestJson(
        tasksApiUrl,
        {
            method: "POST",
            body: JSON.stringify(taskPayload(task)),
            authToken,
            userId: loggedInUserId
        }
    );

export const updateTask = (id, task, loggedInUserId, authToken) =>
    requestJson(
        `${tasksApiUrl}/${id}`,
        {
            method: "PUT",
            body: JSON.stringify(taskPayload(task)),
            authToken,
            userId: loggedInUserId
        }
    );

export const deleteTaskById = (id, loggedInUserId, authToken) =>
    requestJson(
        `${tasksApiUrl}/${id}`,
        {
            method: "DELETE",
            authToken,
            userId: loggedInUserId
        }
    );

export const completeTaskById = (id, loggedInUserId, authToken) =>
    requestJson(
        `${tasksApiUrl}/${id}/complete`,
        {
            method: "PATCH",
            authToken,
            userId: loggedInUserId
        }
    );
