# Source: gdl-relationships.html

# Relationships

Entity Associations & Integrity

GDL makes modeling complex distributed associations trivial. Relations are defined outside of the entity blocks to maintain a clean, declarative architectural blueprint.

## The Social Network of Data

```
// relationship Type { Parent to Child }
relationship OneToMany {
Customer{orders} to Order{customer}
}

```

Relationships in GO-DUCK are directional. The generator automatically injects foreign keys, GORM preloading logic, and Protobuf nested objects based on these declarations.

## Supported Association Types

👨‍👩‍👧

### 1:m (One-to-Many)

One parent entity owns multiple children. Perfect for Customers having many Orders.

```
relationship OneToMany {
Customer{orders} to Order{customer}
}
```

🔗

### m:1 (Many-to-One)

Multiple entities reference a single shared resource. Multiple Car entities belonging to a single Manufacturer.

```
relationship ManyToOne {
Car{manufacturer} to Manufacturer
}
```

💍

### 1:1 (One-to-One)

A single entity exclusively pairs with exactly one other. Perfect for a User owning exactly one Profile.

```
relationship OneToOne {
User{profile} to Profile{user}
}
```

🕸️

### m:m (Many-to-Many)

Both sides can hold multiple counterparts. GO-DUCK generates the GORM `many2many:` join table automatically. Perfect for Students enrolled in many Courses.

```
relationship ManyToMany {
Student{courses} to Course{students}
}
```

## Referential Integrity Modifiers

⚓

#### required

By adding the `required` keyword to any relationship, GO-DUCK enforces strict existence checking at the database and API level.

```
relationship OneToMany {
Customer{orders} to Order{customer} required
}
```

Next Category

🎯 Power-up Annotations
