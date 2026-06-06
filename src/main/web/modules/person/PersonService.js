const personsApiUrl = "./api/persons";

const requestJson = async (url, options = {}) => {
    const response = await fetch(url, {
        ...options,
        headers: {
            ...(options.body ? { "Content-Type": "application/json" } : {}),
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

export const createEmptyPerson = () => ({
    id: "",
    name: "",
    designation: "",
    dob: null,
    updatedAt: null,
    email: "",
    gender: "",
    mobileNo: "",
    photo: ""
});

export const normalizePerson = person => ({
    ...createEmptyPerson(),
    ...(person || {}),
    id: person?.id ?? ""
});

const personPayload = person => {
    const payload = normalizePerson(person);

    delete payload.id;
    delete payload.updatedAt;

    if (payload.dob === "") {
        payload.dob = null;
    }

    Object.keys(payload).forEach(key => {
        if (payload[key] === undefined) {
            delete payload[key];
        }
    });

    return payload;
};

export const findAllPersons = async () => {
    const persons = await requestJson(personsApiUrl);

    return (persons || []).map(normalizePerson);
};

export const findPersonById = id =>
    requestJson(`${personsApiUrl}/${id}`);

export const createPerson = person =>
    requestJson(personsApiUrl, {
        method: "POST",
        body: JSON.stringify(personPayload(person))
    });

export const updatePerson = (id, person) =>
    requestJson(`${personsApiUrl}/${id}`, {
        method: "PUT",
        body: JSON.stringify(personPayload(person))
    });

export const deletePersonById = id =>
    requestJson(`${personsApiUrl}/${id}`, {
        method: "DELETE"
    });
