---
title: GraphQL
description: Generated SDL is complete. POST /graphql does not execute queries yet.
---

GraphQL support is a scaffold. The generator writes a `.graphqls` file covering every GDL entity, enum, and relationship. That file is usable as a contract or as input to an execution library you add yourself.

`POST /graphql` is mounted and already resolves tenant and silo context. It does not parse or run the query. Any body — valid or not — returns the same payload:

```json
{
  "data": "Federated GraphQL Handler active with 3 silos."
}
```

Resolver functions the CLI emits (`Resolve{Entity}Federated` and similar) are not called. No execution library (gqlgen, graphql-go, or otherwise) is wired in.

The shape the schema describes, which the endpoint does not run:

```graphql
query {
  entitys {
    id
    make
    history {
      date
      notes
    }
  }
}
```

Sending that query today still returns the placeholder above.
