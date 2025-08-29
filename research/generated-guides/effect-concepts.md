# Effect Core Concepts Guide

## Table of Contents

1. [The Pizza Delivery Analogy](#the-pizza-delivery-analogy)
2. [Core Concepts](#core-concepts)
3. [Service Dependencies](#service-dependencies)
4. [Layer Composition Patterns](#layer-composition-patterns)
5. [Best Practices](#best-practices)

## The Pizza Delivery Analogy

Imagine you're building a pizza delivery system. Let me explain Effect's concepts through this lens:

### 1. **Effect** - The Delivery Promise

An `Effect` is like a **delivery order slip** that describes:

- What you'll get (the pizza)
- What could go wrong (wrong address, out of ingredients)
- What you need to make it happen (oven, delivery driver)

```typescript
import { Effect } from 'effect'

Effect.Effect<Pizza, DeliveryError, PizzaOven | DeliveryDriver>
//            ^       ^              ^
//            |       |              |
//            |       |              What you need (dependencies)
//            |       What could go wrong
//            What you'll get
```

Key point: An Effect is just a **description** - like an order form that hasn't been processed yet. Nothing happens until you "run" it.

### 2. **Context** - The Resource Pool

Context is like the **restaurant's resources** - the things you need to fulfill orders:

- Pizza oven
- Delivery drivers
- Payment processor
- Ingredient inventory

In Effect, you define these as "services":

```typescript
import { Context, Effect } from 'effect'

// Define what a PizzaOven service looks like
class PizzaOven extends Context.Tag('PizzaOven')<
  PizzaOven,
  {
    readonly bake: (ingredients: Ingredients) => Effect.Effect<Pizza>
  }
>() {}
```

### 3. **Layer** - The Setup Instructions

A Layer is like **instructions for setting up your restaurant**:

- How to install the pizza oven
- How to hire delivery drivers
- How to connect the payment system

```typescript
import { Effect, Layer } from 'effect'

const PizzaOvenLive = Layer.effect(
  PizzaOven,
  Effect.gen(function*() {
    // Set up the actual oven
    const ovenTemperature = 450

    return PizzaOven.of({
      bake: (ingredients) => Effect.succeed(new Pizza(ingredients)),
    })
  }),
)
```

### 4. **Service** - The Actual Workers/Equipment

A Service is the **actual thing doing the work** - the real oven, the actual delivery driver. It's what gets created when you apply a Layer.

## Core Concepts

### How They Fit Together

Here's the complete flow:

```typescript
import { Context, Effect, Layer, pipe } from 'effect'

// 1. Define what services you need (Context)
class DeliveryDriver extends Context.Tag('DeliveryDriver')<
  DeliveryDriver,
  {
    readonly deliver: (pizza: Pizza, address: string) => Effect.Effect<void>
  }
>() {}

// 2. Create setup instructions (Layer)
const DeliveryDriverLive = Layer.effect(
  DeliveryDriver,
  Effect.gen(function*() {
    const gasPrice = 3.50

    return DeliveryDriver.of({
      deliver: (pizza, address) =>
        Effect.gen(function*() {
          console.log(`Delivering ${pizza} to ${address}`)
          // Actual delivery logic
        }),
    })
  }),
)

// 3. Write your business logic (Effect)
const deliverPizza = (order: Order) =>
  Effect.gen(function*() {
    // Get the services we need
    const oven = yield* PizzaOven
    const driver = yield* DeliveryDriver

    // Use them
    const pizza = yield* oven.bake(order.ingredients)
    yield* driver.deliver(pizza, order.address)

    return 'Delivered!'
  })

// 4. Run everything by providing the layers
const program = pipe(
  deliverPizza(myOrder),
  Effect.provide(Layer.merge(PizzaOvenLive, DeliveryDriverLive)),
)

// Actually execute it
Effect.runPromise(program)
```

### The Key Insights

1. **Effect** = "What to do" (the plan)
2. **Context** = "What you need" (the dependencies)
3. **Layer** = "How to set it up" (the wiring)
4. **Service** = "The actual thing" (the implementation)

The magic is that:

- Your business logic (Effects) just says what it needs, not how to get it
- Layers handle all the setup/teardown/lifecycle
- You can swap implementations easily (TestDeliveryDriver vs RealDeliveryDriver)
- Everything is typed - TypeScript knows exactly what dependencies you need

## Service Dependencies

### Services Depending on Other Services

This is where Effect really shines. Let's say your DeliveryDriver needs a GPSService:

```typescript
import { Context, Effect, Layer } from 'effect'

// GPS Service
class GPS extends Context.Tag('GPS')<
  GPS,
  {
    readonly calculateRoute: (from: string, to: string) => Effect.Effect<Route>
  }
>() {}

const GPSLive = Layer.effect(
  GPS,
  Effect.gen(function*() {
    const apiKey = 'your-api-key'

    return GPS.of({
      calculateRoute: (from, to) =>
        Effect.gen(function*() {
          // Call GPS API
          return new Route(from, to)
        }),
    })
  }),
)

// DeliveryDriver now depends on GPS
const DeliveryDriverLive = Layer.effect(
  DeliveryDriver,
  Effect.gen(function*() {
    // DeliveryDriver needs GPS!
    const gps = yield* GPS

    return DeliveryDriver.of({
      deliver: (pizza, address) =>
        Effect.gen(function*() {
          // Use the GPS service
          const route = yield* gps.calculateRoute('restaurant', address)
          console.log(`Taking route: ${route}`)
          // Delivery logic
        }),
    })
  }),
)
```

### Layer Dependencies

When a Layer depends on another service, you need to provide it:

```typescript
// Manual way - using pipe
const DeliveryDriverWithDeps = pipe(
  DeliveryDriverLive,
  Layer.provide(GPSLive),
)

// Or let Effect figure it out with merge
const AllServices = Layer.merge(
  GPSLive,
  DeliveryDriverLive,
)
```

## Layer Composition Patterns

### 1. **Simple Merging**

Combine independent layers:

```typescript
const AppLive = Layer.merge(
  PizzaOvenLive,
  DeliveryDriverLive,
)
// Provides: PizzaOven | DeliveryDriver
```

### 2. **Sequential Composition**

When one layer needs another:

```typescript
// PaymentProcessor needs Database
const PaymentProcessorWithDeps = pipe(
  PaymentProcessorLive,
  Layer.provide(DatabaseLive),
)
```

### 3. **Complex Dependencies**

For multiple levels of dependencies:

```typescript
// Restaurant needs everything
class Restaurant extends Context.Tag('Restaurant')<
  Restaurant,
  {
    readonly processOrder: (order: Order) => Effect.Effect<void>
  }
>() {}

const RestaurantLive = Layer.effect(
  Restaurant,
  Effect.gen(function*() {
    const oven = yield* PizzaOven
    const driver = yield* DeliveryDriver
    const payment = yield* PaymentProcessor

    return Restaurant.of({
      processOrder: (order) =>
        Effect.gen(function*() {
          yield* payment.charge(order.total)
          const pizza = yield* oven.bake(order.ingredients)
          yield* driver.deliver(pizza, order.address)
        }),
    })
  }),
)

// Build the complete layer tree - provide dependencies bottom-up
const AppLive = pipe(
  Layer.merge(
    Layer.merge(RestaurantLive, DeliveryDriverLive),
    Layer.merge(PizzaOvenLive, PaymentProcessorLive),
  ),
  Layer.provide(Layer.merge(GPSLive, DatabaseLive)),
)
```

### 4. **Providing Multiple Dependencies**

Provide multiple dependencies at once:

```typescript
const AppLive = pipe(
  RestaurantLive,
  Layer.provide(
    Layer.merge(
      Layer.merge(PizzaOvenLive, DeliveryDriverLive),
      Layer.merge(PaymentProcessorLive, GPSLive),
    ),
  ),
)
```

### 5. **Shared Dependencies**

When multiple services need the same dependency:

```typescript
// Both PaymentProcessor and OrderService need Database
const DatabaseLayer = DatabaseLive

const AppLive = pipe(
  Layer.merge(
    PaymentProcessorLive,
    OrderServiceLive,
  ),
  Layer.provide(DatabaseLayer), // Database is shared
)
```

### 6. **Scoped Layers**

For resources that need cleanup:

```typescript
import { Scope } from 'effect'

class DatabaseConnection extends Context.Tag('DatabaseConnection')<
  DatabaseConnection,
  {
    readonly query: (sql: string) => Effect.Effect<any>
    readonly close: () => void
  }
>() {}

const DatabaseConnectionLive = Layer.scoped(
  DatabaseConnection,
  Effect.gen(function*() {
    const connection = yield* openConnection()

    // Cleanup happens automatically when scope closes
    yield* Effect.addFinalizer(() => Effect.sync(() => connection.close()))

    return DatabaseConnection.of(connection)
  }),
)
```

### 7. **Testing with Layer Substitution**

```typescript
// Production
const AppLive = Layer.merge(
  DeliveryDriverLive,
  RealPaymentProcessorLive,
)

// Testing
const AppTest = Layer.merge(
  MockDeliveryDriverLive,
  TestPaymentProcessorLive,
)

// Same business logic, different implementations
const program = deliverPizza(order)
const resultProd = Effect.runPromise(Effect.provide(program, AppLive))
const resultTest = Effect.runPromise(Effect.provide(program, AppTest))
```

## Best Practices

### 1. **Layer Organization**

```typescript
// Group related layers
const InfrastructureLive = Layer.merge(
  DatabaseLive,
  CacheLive,
  LoggerLive,
)

const ServicesLive = Layer.merge(
  UserServiceLive,
  OrderServiceLive,
  PaymentServiceLive,
)

const AppLive = pipe(
  ServicesLive,
  Layer.provide(InfrastructureLive),
)
```

### 2. **Avoid Circular Dependencies**

```typescript
// BAD - Circular dependency
const AServiceLive = Layer.effect(
  A,
  Effect.gen(function*() {
    const b = yield* B // A needs B
    return A.of({/* ... */})
  }),
)

const BServiceLive = Layer.effect(
  B,
  Effect.gen(function*() {
    const a = yield* A // B needs A - CIRCULAR!
    return B.of({/* ... */})
  }),
)

// GOOD - Extract shared logic
class Shared extends Context.Tag('Shared')<Shared, SharedService>() {}

const SharedServiceLive = Layer.effect(
  Shared,
  Effect.gen(function*() {
    return Shared.of({/* ... */})
  }),
)

const AServiceLive = Layer.effect(
  A,
  Effect.gen(function*() {
    const shared = yield* Shared
    return A.of({/* ... */})
  }),
)

const BServiceLive = Layer.effect(
  B,
  Effect.gen(function*() {
    const shared = yield* Shared
    return B.of({/* ... */})
  }),
)
```

### 3. **Layer Caching**

Effect automatically memoizes layers - the same layer instance is reused:

```typescript
const ExpensiveServiceLive = Layer.effect(
  ExpensiveService,
  Effect.gen(function*() {
    console.log('This only runs once!')
    // Expensive initialization
    return {/* ... */}
  }),
)

// Both A and B get the same ExpensiveService instance
const AppLive = pipe(
  Layer.merge(AServiceLive, BServiceLive),
  Layer.provide(ExpensiveServiceLive),
)
```

### 4. **Error Handling in Layers**

```typescript
const ServiceLive = Layer.effect(
  Service,
  Effect.gen(function*() {
    const config = yield* Config

    if (!config.apiKey) {
      yield* Effect.fail(new ConfigError('Missing API key'))
    }

    return {/* ... */}
  }),
).pipe(
  Layer.catchAll((error) =>
    Layer.fail(`Failed to initialize service: ${error}`)
  ),
)
```

### 5. **Testing Individual Services**

```typescript
import { it } from '@effect/vitest'
import { Effect } from 'effect'

it.effect('GPS service calculates routes', () =>
  Effect.gen(function*() {
    const gps = yield* GPS
    const route = yield* gps.calculateRoute('A', 'B')
    expect(route.distance).toBeGreaterThan(0)
  }).pipe(
    Effect.provide(GPSLive),
  ))
```

## Summary

- **Effects** describe computations that need services
- **Services** are defined by interfaces and Context tags
- **Layers** create service implementations and handle dependencies
- **Layer composition** allows building complex dependency graphs
- Effect handles the wiring, you focus on business logic
- Everything is type-safe and testable
