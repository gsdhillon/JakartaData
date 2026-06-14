import { requestJson } from "../../grove_lib/GroveComponents.js";

const tasksApiUrl = "./api/tasks";

export const createEmptyTask = loggedInUserId => ({
    id: "",
    taskName: "",
    taskDesc: "",
    addBy: loggedInUserId,
    memberIds: [],
    members: [],
    memberSummary: "",
    creator: null,
    creatorName: "",
    actions: [],
    deadLine: null,
    createdOn: null,
    completedOn: null
});

const normalizeMemberIds = task => {
    const ids = Array.isArray(task?.memberIds)
        ? task.memberIds
        : [];

    return [...new Set(ids
        .filter(id => id !== null && id !== undefined && id !== "")
        .map(id => Number(id))
        .filter(id => !Number.isNaN(id)))];
};

const memberSummary = task => {
    const names = (task?.members || [])
        .map(person => person?.name || (person?.id ? `Person ${person.id}` : ""))
        .filter(Boolean);

    if (names.length) {
        return names.join(", ");
    }

    return normalizeMemberIds(task)
        .map(id => `Person ${id}`)
        .join(", ");
};

const creatorName = task =>
    task?.creator?.name ||
    (task?.addBy ? `Person ${task.addBy}` : "");

export const normalizeTask = (task, loggedInUserId) => ({
    ...createEmptyTask(loggedInUserId),
    ...(task || {}),
    id: task?.id ?? "",
    addBy: task?.addBy ?? loggedInUserId,
    memberIds: normalizeMemberIds(task),
    memberSummary: memberSummary(task),
    creatorName: creatorName({
        ...task,
        addBy: task?.addBy ?? loggedInUserId
    })
});

const taskPayload = task => ({
    taskName: task.taskName,
    taskDesc: task.taskDesc,
    memberIds: (task.memberIds || [])
        .filter(id => id !== null && id !== undefined && id !== "")
        .map(Number),
    deadLine: task.deadLine || null
});

export const findAllTasks = async (loggedInUserId, authToken) => {
    const tasks = await requestJson(tasksApiUrl, { authToken });
    return (tasks || []).map(task => normalizeTask(task, loggedInUserId));
};

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

export const addTaskAction = (id, action, loggedInUserId, authToken) =>
    requestJson(
        `${tasksApiUrl}/${id}/actions`,
        {
            method: "POST",
            body: JSON.stringify({
                status: action.status || "pending",
                desc: action.desc || ""
            }),
            authToken,
            userId: loggedInUserId
        }
    );
