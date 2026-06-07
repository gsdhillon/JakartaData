import { requestJson } from "../../lib/Grove.js";

const personsApiUrl = "./api/persons";

export const createEmptyPerson = () => ({
    id: "",
    name: "",
    designation: "",
    dob: null,
    updatedAt: null,
    email: "",
    gender: "",
    role: "USER",
    mobileNo: "",
    photo: "",
    rawPassword: "",
    confirmPassword: "",
    passwordChangeRequired: true
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
    delete payload.confirmPassword;

    if (payload.rawPassword === "") {
        delete payload.rawPassword;
    }

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

export const findAllPersons = async authToken => {
    const persons = await requestJson(personsApiUrl, { authToken });

    return (persons || []).map(normalizePerson);
};

export const findPersonById = (id, authToken) =>
    requestJson(`${personsApiUrl}/${id}`, { authToken });

export const createPerson = (person, authToken) =>
    requestJson(personsApiUrl, {
        method: "POST",
        authToken,
        body: JSON.stringify(personPayload(person))
    });

export const updatePerson = (id, person, authToken) =>
    requestJson(`${personsApiUrl}/${id}`, {
        method: "PUT",
        authToken,
        body: JSON.stringify(personPayload(person))
    });

export const deletePersonById = (id, authToken) =>
    requestJson(`${personsApiUrl}/${id}`, {
        authToken,
        method: "DELETE"
    });
