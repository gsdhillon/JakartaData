import {
    Button,
    formatInstantLocal,
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
        key: "updatedAt",
        label: "Updated At",
        render: person => formatInstantLocal(person.updatedAt),
        value: person => formatInstantLocal(person.updatedAt)
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

const renderActions = props => (person, index) => [
    Button({
        id: `updatePerson-${index}`,
        icon: "pencil-square",
        label: null,
        look: "pm",
        name: "updatePerson",
        disabled: props.isBusy,
        title: "Update person",
        type: "button",
        onClick() {
            props.onUpdate?.(person, index);
        }
    }),
    Button({
        id: `deletePerson-${index}`,
        icon: "trash3",
        label: null,
        look: "dn",
        name: "deletePerson",
        disabled: props.isBusy,
        title: "Delete person",
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
        exportName: "persons",
        getRowKey: (person, index) => person.id ?? index,
        renderActions: renderActions(props),
        rows: props.persons || [],
        title: "Persons",
        wrapperClassName: "person-table-wrap"
    });

export default PersonTable;
