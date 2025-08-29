# Getting Started

This guide will help you start using the Rocky Mountain Trails API to plan your backcountry adventures.

## Basic Queries

### Finding Places

Start by exploring available locations in the trail network:

```graphql
query GetAllPlaces {
  places {
    id
    name
    type
    coordinates {
      latitude
      longitude
      elevation
    }
    facilities
  }
}
```

### Finding Trails

Get a list of all available trails:

```graphql
query GetAllTrails {
  trails {
    id
    name
    start {
      name
    }
    distanceKm
    estimatedHours
    difficulty {
      overall
    }
  }
}
```

## Weather Queries

### Current Conditions

Check the weather at a specific location:

```graphql
query GetCurrentWeather {
  getWeatherAt(placeId: "lake-louise") {
    temperature
    conditions
    windSpeedKmh
    visibility
    uvIndex
  }
}
```

### Weather Forecast

Get a multi-day forecast for trip planning:

```graphql
query GetForecast {
  getWeatherForecast(placeId: "lake-louise", days: 5) {
    date
    highTemp
    lowTemp
    conditions
    precipitationChance
  }
}
```

## Route Planning

### Finding Routes

Find the best route between two locations:

```graphql
query FindRoute {
  findRoute(
    startId: "moraine-lake-parking",
    endId: "sentinel-pass",
    options: {
      preferredDifficulty: MODERATE
      avoidTerrain: [GLACIER]
    }
  ) {
    trails {
      name
      distanceKm
    }
    totalDistanceKm
    estimatedHours
    campgrounds {
      name
      facilities
    }
  }
}
```

### Multi-Day Trip Planning

Plan a complete multi-day adventure:

```graphql
query PlanBackpackingTrip {
  planTrip(
    startId: "lake-louise-parking",
    endId: "egypt-lake-shelter",
    startDate: "2024-07-15",
    options: {
      maxDays: 3
      fitnessLevel: MODERATE
      preferLoop: true
    }
  ) {
    route {
      totalDistanceKm
      estimatedDays
    }
    itinerary {
      day
      start {
        name
      }
      end {
        name
      }
      distanceKm
      estimatedHours
    }
    weatherForecast {
      date
      conditions
      precipitationChance
    }
    recommendedGear
  }
}
```

## Trail Conditions

### Current Trail Status

Check if a trail is passable:

```graphql
query CheckTrailConditions {
  getTrailConditions(trailId: "iceline-trail") {
    status
    snowLine
    warnings
    lastUpdated
    recentReports {
      date
      conditions
      hazards
    }
  }
}
```

## Advanced Queries

### Filtering by Difficulty

Find trails matching your skill level:

```graphql
query FindModerateTrails {
  trailsByDifficulty(level: MODERATE) {
    name
    distanceKm
    difficulty {
      scrambleClass
      exposureLevel
      routeFinding
    }
    terrain
  }
}
```

### Trail Networks

Explore trail connections and branches:

```graphql
query ExploreTrailNetworks {
  trails {
    name
    trailType
    end {
      name
      type
    }
    branches {
      trail {
        name
        end {
          name
        }
      }
      distanceFromStart
      connectionType
    }
  }
}
```

## Submitting Trip Reports

Help the community by sharing your trail experiences:

```graphql
mutation SubmitReport {
  submitTripReport(
    trailId: "parker-ridge",
    date: "2024-06-20",
    conditions: "Trail clear to treeline, snow above 2400m",
    hazards: ["ICY_SECTIONS", "AVALANCHE_RISK"],
    photos: ["https://example.com/photo1.jpg"]
  ) {
    date
    conditions
    hazards
  }
}
```

## Tips for Success

1. **Always check current conditions** before heading out
2. **Use route options** to customize trips to your group's abilities
3. **Review recent trip reports** for real-world conditions
4. **Plan for weather** by checking forecasts along your entire route
5. **Identify emergency exits** before starting your trip

## Next Steps

- Explore the full schema documentation to see all available fields
- Check the changelog to learn about new features
- Submit trip reports to help other hikers
- Build your own trip planning application using our API

Safe travels and enjoy the mountains! 🏔️
