| Prisma Code | Meaning                                                  | Recommended HTTP Code     | Example message                                |
| ----------- | -------------------------------------------------------- | ------------------------- | ---------------------------------------------- |
| **P2000**   | Value too long for column                                | 400 Bad Request           | `"The value for field X is too long"`          |
| **P2001**   | Record not found for `where` condition                   | 404 Not Found             | `"No record found with id=123"`                |
| **P2002**   | Unique constraint failed (duplicate key)                 | 409 Conflict              | `"Email already exists"`                       |
| **P2003**   | Foreign key constraint failed                            | 409 Conflict / 400        | `"Cannot delete user that has posts"`          |
| **P2004**   | A constraint failed on the database (generic)            | 400 Bad Request           | `"Constraint failed on Posts"`                 |
| **P2005**   | Invalid value for field type                             | 400 Bad Request           | `"Invalid value provided for age"`             |
| **P2006**   | Invalid value for provided field                         | 400 Bad Request           | `"Value not allowed for status"`               |
| **P2007**   | Data validation error                                    | 400 Bad Request           | `"Validation error"`                           |
| **P2008**   | Failed to parse query                                    | 400 Bad Request           | `"Invalid query format"`                       |
| **P2009**   | Failed to validate query                                 | 400 Bad Request           | `"Invalid query arguments"`                    |
| **P2010**   | Raw query failed                                         | 400 Bad Request           | `"Raw query failed"`                           |
| **P2011**   | Null constraint violation                                | 400 Bad Request           | `"Field 'username' cannot be null"`            |
| **P2012**   | Missing required value                                   | 400 Bad Request           | `"Field 'email' is required"`                  |
| **P2013**   | Missing required argument                                | 400 Bad Request           | `"Argument 'id' is missing"`                   |
| **P2014**   | Relation violation (two records violate relation)        | 409 Conflict              | `"Relation between User and Profile violated"` |
| **P2015**   | Related record not found                                 | 404 Not Found             | `"Profile not found for User 5"`               |
| **P2016**   | Query interpretation error                               | 400 Bad Request           | `"Error interpreting query"`                   |
| **P2017**   | Records for relation not connected                       | 400 Bad Request           | `"Relation between User and Posts broken"`     |
| **P2018**   | Required connected records not found                     | 404 Not Found             | `"Related records not found"`                  |
| **P2019**   | Input error (problem with input values)                  | 400 Bad Request           | `"Invalid input"`                              |
| **P2020**   | Value out of range                                       | 400 Bad Request           | `"Value out of range for Int field"`           |
| **P2021**   | Table not found                                          | 500 Internal Server Error | `"Table 'users' not found"`                    |
| **P2022**   | Column not found                                         | 500 Internal Server Error | `"Column 'email' not found"`                   |
| **P2023**   | Inconsistent column data                                 | 500 Internal Server Error | `"Inconsistent data in column"`                |
| **P2024**   | Timed out fetching a new connection from the database    | 503 Service Unavailable   | `"Database connection timed out"`              |
| **P2025**   | Record not found (usually on update/delete with `where`) | 404 Not Found             | `"User with id=2 not found"`                   |
| **P2026**   | Nested create/update failed due to missing relation      | 400 Bad Request           | `"Nested update failed for relation"`          |
| **P2027**   | Multiple errors (transaction rollback)                   | 400 Bad Request / 500     | `"Transaction failed and rolled back"`         |
| **P2028**   | Transaction API error                                    | 500 Internal Server Error | `"Transaction failed"`                         |
| **P2030**   | Query execution timeout                                  | 503 Service Unavailable   | `"Query timed out"`                            |
| **P2031**   | Database file is locked (SQLite)                         | 503 Service Unavailable   | `"Database is locked"`                         |
| **P2033**   | Number out of range (e.g. BigInt overflow)               | 400 Bad Request           | `"Number out of range"`                        |
| **P2034**   | Transaction conflict                                     | 409 Conflict              | `"Transaction conflict occurred"`              |



### These are schema validation errors - user sent bad data (400)
- Missing required fields
- Wrong data types  
- Values outside min/max limits
- Invalid formats (email, etc.)
- Pattern mismatches
- Additional properties when not allowed
