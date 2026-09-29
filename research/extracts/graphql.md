# Source: graphql.html

# GraphQL Schema Generation
A Head Start, Not a Runtime.

GO-DUCK generates a complete, valid GraphQL SDL schema straight from your GDL definitions — every entity, enum, and relationship, ready to use as a contract or as the starting point for wiring up real execution.

Where this stands today

GraphQL support is at a proof-of-concept / scaffold stage. The generated `.graphqls` schema file is genuinely complete and correct — a solid reference document and a real head start. A `POST /graphql` endpoint exists too, with tenant/silo context resolution already wired up. What's not there yet is query execution: nothing parses your query against the schema and resolves fields. Send any query — valid or not — and you get back the same fixed placeholder response every time. Think of this page as "here's what's real today, here's the direction it's headed," not a working GraphQL API.

Real Today: SDL Generation

Every GDL entity, enum, and relationship is compiled into a syntactically complete `.graphqls` schema file — useful right now as documentation, a client-side contract, or the input schema for a real execution engine you wire up yourself.

Roadmap: Query Execution

The per-entity resolver functions the CLI generates (`Resolve{'{Entity}'}Federated`, etc.) are dead code today — never called by anything. No execution library (gqlgen, graphql-go, or similar) is wired in yet. This is the next piece of the puzzle, not a shipped feature.

## Target Schema Shape

This is the shape a query would take against the generated schema — not yet queryable. It illustrates what the SDL describes, not what the endpoint executes today.

```
// Target schema shape — not yet queryable.
// Sending this today returns the same fixed placeholder below, regardless of content.
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

What POST /graphql actually returns today, for any query:

```
{
"data": "Federated GraphQL Handler active with 3 silos."
}
```

## Where This Is Headed

The building blocks are already generated: a complete schema, tenant-aware context resolution on `POST /graphql`, and per-entity resolver functions that exist but aren't called yet. Closing the loop means wiring a real execution library on top of what's already there — not starting from zero.

Roadmap
Execution Engine Integration
