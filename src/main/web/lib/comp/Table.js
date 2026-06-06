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
import { Button } from "./Button.js";
import { Div } from "./Div.js";
import { Input } from "./Input.js";

const columnKey = column => column.key ?? column.field;

const defaultValue = (row, column) => row?.[columnKey(column)];

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
        columns.find(candidate => columnKey(candidate) === sort.key);

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

const activeFilters = columnFilters =>
    Object
        .values(columnFilters)
        .filter(value => String(value || "").trim())
        .length;

const filteredRows = (rows, columns, query, columnFilters) => {
    const normalizedQuery = query.trim().toLowerCase();
    const filters = Object
        .entries(columnFilters)
        .map(([key, value]) => [key, String(value || "").trim().toLowerCase()])
        .filter(([, value]) => value);

    if (!normalizedQuery && !filters.length) {
        return rows;
    }

    return rows.filter(row => {
        if (normalizedQuery && !searchableText(row, columns).includes(normalizedQuery)) {
            return false;
        }

        return filters.every(([key, value]) => {
            const column = columns.find(candidate => columnKey(candidate) === key);

            return column
                ? normalizeValue(valueForColumn(row, column)).toLowerCase().includes(value)
                : true;
        });
    });
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

const sortIcon = (sort, column) => {
    const key = columnKey(column);

    if (sort.key !== key) {
        return "arrow-down-up";
    }

    return sort.direction === "asc"
        ? "sort-up"
        : "sort-down";
};

const icon = name =>
    createElement(
        "i",
        {
            "aria-hidden": "true",
            className: `bi bi-${name}`
        }
    );

const escapeRegExp = value =>
    String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const highlightText = (text, search) => {
    const value = normalizeValue(text);
    const needle = String(search || "").trim();

    if (!needle) {
        return value;
    }

    const regex = new RegExp(`(${escapeRegExp(needle)})`, "ig");
    const parts = value.split(regex);

    return parts.map((part, index) =>
        part.toLowerCase() === needle.toLowerCase()
            ? createElement(
                "mark",
                {
                    className: "search-highlight",
                    key: `hit-${index}`
                },
                part
            )
            : part
    );
};

const cellText = (row, column) =>
    normalizeValue(valueForColumn(row, column));

const csvEscape = value => {
    const text = normalizeValue(value);

    return /[",\r\n]/.test(text)
        ? `"${text.replace(/"/g, "\"\"")}"`
        : text;
};

const htmlEscape = value =>
    normalizeValue(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

const fileSafeName = value =>
    String(value || "table")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") || "table";

const downloadBlob = (content, fileName, type) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
};

const exportCsv = (rows, columns, name) => {
    const lines = [
        columns.map(column => csvEscape(column.label ?? columnKey(column))).join(","),
        ...rows.map(row => columns.map(column => csvEscape(cellText(row, column))).join(","))
    ];

    downloadBlob(
        lines.join("\r\n"),
        `${fileSafeName(name)}.csv`,
        "text/csv;charset=utf-8"
    );
};

const exportExcel = (rows, columns, name) => {
    const html = [
        "<table>",
        "<thead><tr>",
        ...columns.map(column => `<th>${htmlEscape(column.label ?? columnKey(column))}</th>`),
        "</tr></thead>",
        "<tbody>",
        ...rows.map(row => [
            "<tr>",
            ...columns.map(column => `<td>${htmlEscape(cellText(row, column))}</td>`),
            "</tr>"
        ].join("")),
        "</tbody>",
        "</table>"
    ].join("");

    downloadBlob(
        html,
        `${fileSafeName(name)}.xls`,
        "application/vnd.ms-excel;charset=utf-8"
    );
};

const pdfEscape = value =>
    normalizeValue(value)
        .replace(/\\/g, "\\\\")
        .replace(/\(/g, "\\(")
        .replace(/\)/g, "\\)");

const makePdf = stream => {
    const objects = [
        "<< /Type /Catalog /Pages 2 0 R >>",
        "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
        "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
        `<< /Length ${stream.length} >>\nstream\n${stream}endstream`
    ];
    let pdf = "%PDF-1.4\n";
    const offsets = [0];

    objects.forEach((object, index) => {
        offsets.push(pdf.length);
        pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
    });

    const xrefOffset = pdf.length;

    pdf += `xref\n0 ${objects.length + 1}\n`;
    pdf += "0000000000 65535 f \n";
    offsets
        .slice(1)
        .forEach(offset => {
            pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
        });
    pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

    return pdf;
};

const exportPdf = (rows, columns, name) => {
    const lines = [
        columns.map(column => column.label ?? columnKey(column)).join(" | "),
        ...rows.map(row => columns.map(column => cellText(row, column)).join(" | "))
    ];
    const streamLines = lines
        .slice(0, 80)
        .map((line, index) => `BT /F1 9 Tf 36 ${780 - (index * 14)} Td (${pdfEscape(line).slice(0, 150)}) Tj ET`)
        .join("\n");
    const stream = `${streamLines}\n`;

    downloadBlob(
        makePdf(stream),
        `${fileSafeName(name)}.pdf`,
        "application/pdf"
    );
};

const renderToolbar = options => {
    const {
        activeFilterCount,
        canClear,
        exportName,
        exportableColumns,
        onClear,
        rows,
        showExport,
        title
    } = options;

    return Div(
        { className: "grove-table-toolbar" },
        Button({
            disabled: !canClear,
            icon: "eraser",
            label: null,
            look: "sc",
            title: activeFilterCount ? `Remove all filters (${activeFilterCount})` : "Remove all filters",
            type: "button",
            onClick: onClear
        }),
        showExport
            ? Button({
                icon: "filetype-csv",
                label: null,
                look: "sc",
                title: "Export filtered rows to CSV",
                type: "button",
                onClick() {
                    exportCsv(rows, exportableColumns, exportName || title);
                }
            })
            : null,
        showExport
            ? Button({
                icon: "filetype-xls",
                label: null,
                look: "sc",
                title: "Export filtered rows to Excel",
                type: "button",
                onClick() {
                    exportExcel(rows, exportableColumns, exportName || title);
                }
            })
            : null,
        showExport
            ? Button({
                icon: "filetype-pdf",
                label: null,
                look: "sc",
                title: "Export filtered rows to PDF",
                type: "button",
                onClick() {
                    exportPdf(rows, exportableColumns, exportName || title);
                }
            })
            : null
    );
};

const renderColumnFilter = options => {
    const {
        activeColumnFilter,
        column,
        columnFilters,
        setActiveColumnFilter,
        setColumnFilters
    } = options;
    const key = columnKey(column);
    const value = columnFilters[key] || "";
    const isOpen = activeColumnFilter === key;
    const isActive = Boolean(String(value).trim());

    return Div(
        { className: "grove-table-column-filter" },
        createElement(
            "button",
            {
                "aria-label": `Filter ${column.label}`,
                className: [
                    "grove-table-column-filter-toggle",
                    isActive ? "grove-table-column-filter-toggle-active" : ""
                ].filter(Boolean).join(" "),
                type: "button",
                onClick(event) {
                    event.stopPropagation?.();
                    setActiveColumnFilter(current => current === key ? null : key);
                }
            },
            icon(isActive ? "funnel-fill" : "funnel")
        ),
        isOpen
            ? Div(
                { className: "grove-table-column-filter-popover" },
                Div(
                    { className: "grove-table-column-filter-input" },
                    icon("search"),
                    Input({
                        "aria-label": `Filter ${column.label}`,
                        name: `${key}Filter`,
                        placeholder: `Filter ${column.label}`,
                        type: "search",
                        value,
                        onChange(event) {
                            const nextValue = event.target.value;

                            setColumnFilters(current => ({
                                ...current,
                                [key]: nextValue
                            }));
                        }
                    }),
                    value
                        ? createElement(
                            "button",
                            {
                                "aria-label": `Clear ${column.label} filter`,
                                className: "grove-table-column-filter-clear",
                                type: "button",
                                onClick() {
                                    setColumnFilters(current => ({
                                        ...current,
                                        [key]: ""
                                    }));
                                }
                            },
                            icon("x-lg")
                        )
                        : null
                )
            )
            : null
    );
};

const renderCell = (row, column, rowIndex, query, columnFilters) => {
    const key = columnKey(column);
    const rendered = typeof column.render === "function"
        ? column.render(row, column, rowIndex)
        : null;

    if (rendered !== null && rendered !== undefined && typeof rendered !== "string" && typeof rendered !== "number") {
        return createElement(
            "td",
            { key },
            rendered
        );
    }

    const text = rendered ?? cellText(row, column);
    const search = columnFilters[key] || query;

    return createElement(
        "td",
        { key },
        highlightText(text, search)
    );
};

const Table = (props = {}) => {
    const {
        actionsLabel = "Actions",
        className,
        columns = [],
        emptyMessage = "No records found",
        exportName,
        getRowKey,
        renderActions,
        rows = [],
        showExport = true,
        title = exportName || "Table",
        wrapperClassName
    } = props;
    const query = "";
    const [columnFilters, setColumnFilters] = useState({});
    const [activeColumnFilter, setActiveColumnFilter] = useState(null);
    const [sort, setSort] = useState({
        key: null,
        direction: null
    });
    const visibleRows =
        useMemo(
            () => sortedRows(
                filteredRows(rows, columns, query, columnFilters),
                columns,
                sort
            ),
            [
                rows,
                columns,
                query,
                columnFilters,
                sort
            ]
        );
    const hasActions = typeof renderActions === "function";
    const colSpan = Math.max(
        columns.length + (hasActions ? 1 : 0),
        1
    );
    const exportableColumns = useMemo(
        () => columns.filter(column => column.exportable !== false),
        [columns]
    );
    const activeFilterCount = activeFilters(columnFilters);
    const canClear = activeFilterCount > 0 || Boolean(sort.key);
    const clearAll = () => {
        setColumnFilters({});
        setActiveColumnFilter(null);
        setSort({ key: null, direction: null });
    };
    const toolbar = useMemo(
        () => renderToolbar({
            activeFilterCount,
            canClear,
            exportName,
            exportableColumns,
            onClear: clearAll,
            rows: visibleRows,
            showExport,
            title
        }),
        [
            activeFilterCount,
            canClear,
            exportName,
            exportableColumns,
            visibleRows,
            showExport,
            title
        ]
    );

    return Div(
        appendClassName(
            { className: wrapperClassName },
            "table-responsive grove-table-wrap"
        ),
        toolbar,
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
                        const key = columnKey(column);
                        const sortable = column.sortable !== false;

                        return createElement(
                            "th",
                            {
                                "aria-sort": sort.key === key
                                    ? sort.direction === "asc"
                                        ? "ascending"
                                        : "descending"
                                    : "none",
                                key
                            },
                            Div(
                                { className: "grove-table-header-cell" },
                                sortable
                                    ? createElement(
                                        "button",
                                        {
                                            className: "grove-table-sort",
                                            type: "button",
                                            onClick() {
                                                setSort(current => nextSort(current, key));
                                            }
                                        },
                                        createElement("span", {}, column.label),
                                        icon(sortIcon(sort, column))
                                    )
                                    : createElement("span", {}, column.label),
                                column.filterable === false
                                    ? null
                                    : renderColumnFilter({
                                        activeColumnFilter,
                                        column,
                                        columnFilters,
                                        setActiveColumnFilter,
                                        setColumnFilters
                                    })
                            )
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
                                    renderCell(row, column, rowIndex, query, columnFilters)
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
