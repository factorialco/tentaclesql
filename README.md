# TentacleSQL

Query your HTTP endpoints data using SQL

## Setup

To be able to start TentacleSQL you need to provide a `SCHEMA_URL` environment
variable specifying the route to retrieve the schema from.

Example:

```
SCHEMA_URL='https://example.com/api/schema'
```

This endpoint need to respond with an array of all the table definitions
available in your schema. Something like:

```json
[
  {
    "name": "applications",
    "url": "https://example.com/api/schema/tables/applications",
    "fields": [
      {
        "key": "id",
        "type": "number"
      },
      {
        "key": "first_name",
        "type": "text"
      },
      {
        "key": "last_name",
        "type": "text"
      }
    ]
  },
  {
    "name": "goals",
    "url": "https://example.com/api/schema/tables/goals",
    "fields": [
      {
        "key": "id",
        "type": "number"
      },
      {
        "key": "progress",
        "type": "text"
      },
      {
        "key": "application_id",
        "type": "number",
        "table": "applications",
        "foreign_key": "id"
      }
    ]
  }
]
```

### Schema definition

The schema endpoint needs to respond with an array of table definitions:

**Table:**

- `name`: Name of the table
- `url`: URL to retrieve the data from
- `fields`: List of fields / foreign keys of this table

Each table will have an array of fields that can be raw fields or foreign key
to denote relations between tables.

**Field:**

- `key`: Name of the column / field
- `type`: Type of the field. Available types: `text`, `number`, `data` and `boolean`

**Foreign key:**

- `key`: Name of the foreign key
- `type`: Type of the field. Available types: `text`, `number`, `data` and `boolean`
- `table`: Target table of the foreign key
- `foreign_key`: Referenced column by the foreign key
