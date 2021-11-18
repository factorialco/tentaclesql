# TentacleSQL

Query your HTTP endpoints data using SQL

## Install

### Using docker

`docker run -p 8080 -ti factorialco/tentaclesql`

### As system command

```bash
npm i -g @factorialco/tentaclesql
```

## Setup

To be able to start TentacleSQL you need to provide even `SCHEMA_URL` or
`SCHEMA_FILE` environment variable specifying the route to retrieve the schema
from.

Alternativelly you can provide your own schema into same POST request you run
the query.

Examples:

```
SCHEMA_URL='https://example.com/api/schema'
SCHEMA_FILE='example.yaml' # Note that should be placed into `schemas` folder
```

This schema stucture is an array of all the table definitions
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

To see yaml example check `schemas/example.yaml`.

### Schema definition API

The schema definition needs to respond with an array of table definitions:

**Table:**

- `name`: Name of the table
- `url`: URL to retrieve the data from
- `autodiscover`: If you want to autodiscover fields from url response
- `result_key`: Which key should be readed for array of results
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

## Usage HTTP API

Once you have your tentaclesql server up and running you can use it by sending
POST requests against `/`.

Example:

```bash
curl -H "Content-type: application/json" -X POST -d '{"query": "SELECT 1;"}' http://localhost:3000/
```

The expected payload contains the following parameters:

- **query**: The SQL query to be executed against the in-memory database.
- **parameters**: The parameters to be replaced in the query.
- **config**: Configuration parameters.
  - **extensions**: Array of extensions to enable. Check
  https://github.com/nalgeon/sqlean to see all the supported extensions and how
  to use them.
  - **schema**: Manual schema definition

## Usage CLI

Note that you must configure your schema first. You can pass an environment
variable:

Example

```bash
SCHEMA_FILE=example.yaml tentaclesql interactive
```

### Run interactive prompt

```bash
yarn cli interactive
# or installed global
tentaclesql interactive
```

### Execute queries

```bash
yarn cli query "SELECT 1;"
# or installed global
tentaclesql query "SELECT 1;"
```

### Bulk fetch
`BULK_FETCH=true` and `BULK_FETCH_URL=url` to fetch all data in one HTTP request. #TODO: explain in details
