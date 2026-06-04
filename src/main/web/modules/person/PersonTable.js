import {
    Button,
    Table
} from "../../lib/Grove.js";

const columns = [
    { key: "id", label: "Id" },
    { key: "name", label: "Name" },
    { key: "designation", label: "Designation" },
    {
        key: "dob",
        label: "DOB",
        compare: (left, right) =>
            String(left.dob || "").localeCompare(String(right.dob || "")),
        render: person => formatDate(person.dob),
        value: person => formatDate(person.dob)
    },
    {
        key: "appointmentAt",
        label: "Appointment",
        render: person => formatDateTime(person.appointmentAt),
        value: person => formatDateTime(person.appointmentAt)
    },
    {
        key: "updatedAt",
        label: "Updated At",
        render: person => formatDateTime(person.updatedAt),
        value: person => formatDateTime(person.updatedAt)
    },
    { key: "email", label: "EMail" },
    { key: "gender", label: "Gender" },
    { key: "mobileNo", label: "MobileNo" }
];

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

const renderActions = props => (person, index) => [
    Button({
        id: `updatePerson-${index}`,
        label: "Update",
        look: "pm",
        name: "updatePerson",
        disabled: props.isBusy,
        type: "button",
        onClick() {
            props.onUpdate?.(person, index);
        }
    }),
    Button({
        id: `deletePerson-${index}`,
        label: "Delete",
        look: "dn",
        name: "deletePerson",
        disabled: props.isBusy,
        type: "button",
        onClick() {
            props.onDelete?.(person, index);
        }
    })
];

const PersonTable = (props = {}) =>
    Table({
        className: "person-table",
        columns,
        emptyMessage: "No persons added",
        getRowKey: (person, index) => person.id ?? index,
        renderActions: renderActions(props),
        rows: props.persons || [],
        searchPlaceholder: "Search persons",
        wrapperClassName: "person-table-wrap"
    });

export default PersonTable;
