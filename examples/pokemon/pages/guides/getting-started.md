# Getting Started

Welcome to the Pokemon API guide! This page will help you get started with using the Pokemon GraphQL API.

## Installation

First, install the necessary dependencies...

## Basic Query

Here's a simple query to get started:

```graphql
query GetPikachu {
  pokemon(name: "pikachu") {
    id
    name
    types
  }
}
```