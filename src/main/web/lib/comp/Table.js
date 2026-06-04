/**
 * @file Table.js
 * @author Gurmeet Singh
 * @email gsdhillon@gmail.com
 */

import {
    appendClassName,
    createElement,
    useMemo,
    useState
} from "../Grove.js";
import { Div } from "./Div.js";
import { Input } from "./Input.js";

const defaultValue = (row, column) => row?.[column.key];

const normalizeValue = value =>
    value === null || value === undefined
        ? ""
        : String(value);

const valueForColumn = (row, column) =>
    typeof column.value === "function"
        ? column.value(row, column)
        : defaultValue(row, column);

const searchableText = (row, columns) =>
    columns
        .filter(column => column.searchable !== false)
        .map(column => normalizeValue(valueForColumn(row, column)).toLowerCase())
        .join(" ");

const compareValues = (left, right) => {
    if (left === right) {
        return 0;
    }

    if (left === null || left === undefined || left === "") {
        return 1;
    }

    if (right === null || right === undefined || right === "") {
        return -1;
    }

    const leftNumber = Number(left);
    const rightNumber = Number(right);

    if (!Number.isNaN(leftNumber) && !Number.isNaN(rightNumber)) {
        return leftNumber - rightNumber;
    }

    return String(left).localeCompare(
        String(right),
        undefined,
        {
            numeric: true,
            sensitivity: "base"
        }
    );
};

const sortedRows = (rows, columns, sort) => {
    if (!sort.key || !sort.direction) {
        return rows;
    }

    const column =
        columns.find(candidate => candidate.key === sort.key);

    if (!column) {
        return rows;
    }

    return [...rows].sort((left, right) => {
        const result =
            typeof column.compare === "function"
                ? column.compare(left, right, column)
                : compareValues(
                    valueForColumn(left, column),
                    valueForColumn(right, column)
                );

        return sort.direction === "desc"
            ? result * -1
            : result;
    });
};

const filteredRows = (rows, columns, query) => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
        return rows;
    }

    return rows.filter(row =>
        searchableText(row, columns).includes(normalizedQuery)
    );
};

const nextSort = (currentSort, key) => {
    if (currentSort.key !== key) {
        return {
            key,
            direction: "asc"
        };
    }

    if (currentSort.direction === "asc") {
        return {
            key,
            direction: "desc"
        };
    }

    return {
        key: null,
        direction: null
    };
};

const sortIndicator = (sort, column) => {
    if (sort.key !== column.key) {
        return "";
    }

    return sort.direction === "asc"
        ? " ^"
        : " v";
};

const renderCell = (row, column, rowIndex) =>
    createElement(
        "td",
        { key: column.key },
        typeof column.render === "function"
            ? column.render(row, column, rowIndex)
            : normalizeValue(valueForColumn(row, column))
    );

const Table = (props = {}) => {
    const {
        actionsLabel = "Actions",
        className,
        columns = [],
        emptyMessage = "No records found",
        getRowKey,
        renderActions,
        rows = [],
        searchLabel = "Search",
        searchPlaceholder = "Search table",
        searchable = true,
        wrapperClassName
    } = props;
    const [query, setQuery] = useState("");
    const [sort, setSort] = useState({
        key: null,
        direction: null
    });
    const visibleRows =
        useMemo(
            () => sortedRows(
                filteredRows(rows, columns, query),
                columns,
                sort
            ),
            [
                rows,
                columns,
                query,
                sort
            ]
    );
    const hasActions = typeof renderActions === "function";
    const colSpan = Math.max(
        columns.length + (hasActions ? 1 : 0),
        1
    );

    return Div(
        appendClassName(
            { className: wrapperClassName },
            "table-responsive grove-table-wrap"
        ),
        searchable
            ? Div(
                { className: "grove-table-toolbar" },
                Input({
                    "aria-label": searchLabel,
                    className: "grove-table-search",
                    name: "tableSearch",
                    placeholder: searchPlaceholder,
                    type: "search",
                    value: query,
                    onChange(event) {
                        setQuery(event.target.value);
                    }
                })
            )
            : null,
        createElement(
            "table",
            appendClassName(
                { className },
                "table table-striped table-hover align-middle grove-table"
            ),
            createElement(
                "thead",
                {},
                createElement(
                    "tr",
                    {},
                    ...columns.map(column => {
                        const sortable = column.sortable !== false;

                        return createElement(
                            "th",
                            {
                                "aria-sort": sort.key === column.key
                                    ? sort.direction === "asc"
                                        ? "ascending"
                                        : "descending"
                                    : "none",
                                key: column.key
                            },
                            sortable
                                ? createElement(
                                    "button",
                                    {
                                        className: "grove-table-sort",
                                        type: "button",
                                        onClick() {
                                            setSort(current => nextSort(current, column.key));
                                        }
                                    },
                                    column.label,
                                    sortIndicator(sort, column)
                                )
                                : column.label
                        );
                    }),
                    hasActions
                        ? createElement(
                            "th",
                            { key: "actions" },
                            actionsLabel
                        )
                        : null
                )
            ),
            createElement(
                "tbody",
                {},
                ...(
                    visibleRows.length
                        ? visibleRows.map((row, rowIndex) =>
                            createElement(
                                "tr",
                                {
                                    key: String(
                                        typeof getRowKey === "function"
                                            ? getRowKey(row, rowIndex)
                                            : row?.id ?? rowIndex
                                    )
                                },
                                ...columns.map(column =>
                                    renderCell(row, column, rowIndex)
                                ),
                                hasActions
                                    ? createElement(
                                        "td",
                                        {
                                            className: "grove-table-actions-cell",
                                            key: "actions"
                                        },
                                        Div(
                                            { className: "grove-table-actions" },
                                            renderActions(row, rowIndex)
                                        )
                                    )
                                    : null
                            )
                        )
                        : [
                            createElement(
                                "tr",
                                { key: "empty" },
                                createElement(
                                    "td",
                                    {
                                        className: "grove-table-empty",
                                        colSpan
                                    },
                                    emptyMessage
                                )
                            )
                        ]
                )
            )
        )
    );
};

export default Table;
export { Table };
