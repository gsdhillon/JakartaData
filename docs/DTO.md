# DTO

DTO means Data Transfer Object. It is a simple object used to move data across an application boundary, usually between the browser and the REST API. A DTO is not the database model. It describes the data contract for one API operation.

In this project, the `Person` module intentionally exposes the `Person` entity directly for teaching the basic Jakarta Data flow.

The `Task` module uses DTOs to show the cleaner production-style boundary:

- `Task` is the JPA entity persisted in the database table `app_task`.
- `TaskRequestDto` is accepted by `POST /api/tasks` and `PUT /api/tasks/{id}`.
- `TaskResponseDto` is returned by task APIs.

This lets the API control fields that the browser should not edit directly. For example, the browser sends `taskName`, `taskDesc`, `assignedTo`, and `deadLine`, but it does not send `id`, `addBy`, `createdOn`, or `completedOn` as editable values.

In the `Task` module:

- `addBy` is set from the mock logged-in user in the `X-User-Id` header.
- `createdOn` is set by the server when the entity is first saved.
- `completedOn` is set by the server when the assigned user clicks `Mark Completed`.
- Update is allowed only when `task.addBy == loggedInUser`.
- Mark Completed is allowed only when `task.assignedTo == loggedInUser`.

So the DTO protects the API shape from being the same as the database shape, while still keeping the entity focused on persistence.
