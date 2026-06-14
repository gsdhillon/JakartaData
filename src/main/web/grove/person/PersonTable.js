import {
    Button,
    createElement,
    Table
} from "../../grove_lib/GroveComponents.js";

const columns = [
    { key: "id", label: "Id" },
    { key: "name", label: "Name" },
    { essential: false, key: "designation", label: "Designation" },
    { essential: false, key: "email", label: "EMail" },
    { key: "gender", label: "Gender" },
    { key: "role", label: "Role" },
    { essential: false, key: "mobileNo", label: "MobileNo" }
];

const defaultActions = props => (person, index) => [
    Button({
        id: `viewPerson-${index}`,
        icon: "eye",
        label: null,
        look: "sc",
        name: "viewPerson",
        disabled: props.isBusy,
        title: "View person",
        type: "button",
        onClick() {
            props.onView?.(person, index);
        }
    }),
    Button({
        id: `updatePerson-${index}`,
        icon: "pencil-square",
        label: null,
        look: "pm",
        name: "updatePerson",
        disabled: props.isBusy || !props.canUpdate?.(person),
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
        disabled: props.isBusy || !props.canDelete?.(person),
        title: "Delete person",
        type: "button",
        onClick() {
            props.onDelete?.(person, index);
        }
    })
];

const renderActions = props => (person, index) => [
    ...(typeof props.renderActions === "function"
        ? props.renderActions(person, index)
        : []),
    ...(props.defaultActions === false
        ? []
        : defaultActions(props)(person, index))
];

const selectedPersonIds = props =>
    new Set((props.selectedPersonIds || []).map(id => String(id)));

const tableColumns = props => {
    if (props.selectionMode !== "multiple" || props.showSelectionColumn === false) {
        return columns;
    }

    const selectedIds = selectedPersonIds(props);

    return [
        {
            exportable: false,
            filterable: false,
            key: "selected",
            label: "",
            render: person => createElement(
                "input",
                {
                    "aria-label": `Select ${person.name || "person"}`,
                    checked: selectedIds.has(String(person.id)),
                    className: "form-check-input",
                    disabled: props.isBusy,
                    type: "checkbox",
                    onChange() {
                        props.onToggleSelected?.(person);
                    }
                }
            ),
            sortable: false
        },
        ...columns
    ];
};

const PersonTable = (props = {}) =>
    Table({
        columns: tableColumns(props),
        centerActions: props.centerActions,
        emptyMessage: "No persons added",
        exportName: "persons",
        getRowKey: (person, index) => person.id ?? index,
        renderActions: renderActions(props),
        rows: props.persons || [],
        showExport: props.showExport,
        showToolbarUtilities: props.showToolbarUtilities,
        toolbarActions: props.toolbarActions,
        title: props.title || "Persons"
    });

export default PersonTable;
