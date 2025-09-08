import { defineConfig } from 'polen/polen'

export default defineConfig({
  name: 'Pokemon API',
  description: 'Catch, train, and battle with Pokemon through our comprehensive GraphQL API',
  schema: {
    useSources: ['versionedDirectory'],
    sources: {
      versionedDirectory: {
        path: './schema',
      },
    },
    augmentations: [
      // Unversioned - applies to all versions
      {
        on: 'Query',
        content: '⚡ **PokéAPI GraphQL** - Query Pokémon data from across all regions',
        placement: 'before',
      },

      // Versioned with different content per version
      {
        on: 'Pokemon',
        placement: 'after',
        content: 'A Pokémon species with basic information',
        versions: {
          1: {
            content:
              '**Generation I** - Original 151 Pokémon from the Kanto region. These are the classic Pokémon that started it all, from Bulbasaur (#001) to Mew (#151).',
          },
          2: {
            content:
              '**All Generations** - Complete Pokédex featuring Pokémon from all regions including Kanto, Johto, Hoenn, Sinnoh, Unova, Kalos, Alola, Galar, and Paldea. Includes mega evolutions, regional forms, and Gigantamax forms.',
          },
        },
      },
      // Version-specific only (v2 has more features) - Testing invalid path diagnostic
      {
        versions: {
          2: {
            on: 'TypeEffectiveness',
            content:
              '**Battle System** - Type matchup effectiveness chart showing damage multipliers. Super effective (2x), not very effective (0.5x), and no effect (0x) relationships.',
            placement: 'before',
          },
        },
      },
      // // Stats field with version differences
      // {
      //   on: 'Pokemon.stats',
      //   placement: 'after',
      //   content: 'Base statistics for this Pokémon',
      //   versions: {
      //     1: {
      //       content: 'Basic stats: HP, Attack, Defense, Speed, Special',
      //     },
      //     2: {
      //       content:
      //         'Full stats including HP, Attack, Defense, Special Attack, Special Defense, and Speed. Also includes EVs (Effort Values) and IVs (Individual Values) ranges.',
      //     },
      //   },
      // },

      // // Evolution chain (v2 only)
      // {
      //   versions: {
      //     2: {
      //       on: 'Pokemon.evolutionChain',
      //       content:
      //         "**Evolution Line** - Complete evolution family tree including evolution methods (level up, trade, stone, friendship, etc.) and branching evolutions like Eevee's multiple forms.",
      //       placement: 'after',
      //     },
      //   },
      // },

      // // Abilities field (v2 enhancement)
      // {
      //   versions: {
      //     2: {
      //       on: 'Pokemon.abilities',
      //       content:
      //         'Special abilities including normal abilities and hidden ability. Abilities provide passive effects in battle such as Intimidate, Levitate, or Drought.',
      //       placement: 'after',
      //     },
      //   },
      // },

      // // Pokedex number with historical context
      // {
      //   on: 'Pokemon.id',
      //   placement: 'over',
      //   content: 'National Pokédex number',
      //   versions: {
      //     1: {
      //       content: 'Kanto Pokédex number (001-151)',
      //     },
      //     2: {
      //       content: 'National Pokédex number - the official species number across all regions',
      //     },
      //   },
      // },

      // // Moves with generational context
      // {
      //   on: 'Pokemon.moves',
      //   placement: 'after',
      //   versions: {
      //     1: {
      //       content: 'Moves learnable in Generation I games (Red/Blue/Yellow). Limited to the original 165 moves.',
      //     },
      //     2: {
      //       content:
      //         'Complete moveset across all generations including level-up moves, TM/HM/TR compatibility, egg moves, and tutor moves. Over 900 moves available.',
      //     },
      //   },
      // },

      // // Search/filter functionality
      // {
      //   on: 'Query.pokemons',
      //   content: 'Search and filter Pokémon by various criteria',
      //   placement: 'after',
      //   versions: {
      //     1: {
      //       content: 'Browse the original 151 Pokémon. Filter by type (Fire, Water, Grass, etc.) or search by name.',
      //     },
      //     2: {
      //       content:
      //         'Advanced Pokémon search with filters for type, generation, abilities, stats ranges, evolution stage, legendary/mythical status, and more. Supports pagination for large result sets.',
      //     },
      //   },
      // },
    ],
  },
  home: {
    topics: ['adventure', 'pokemon', 'wilderness', 'battles'],
    hero: {
      prompt: 'hero image for pokemon platform allowing exploration and capture of wild pokemon.',
      layout: 'cinematic',
    },
    examples: {
      only: ['get-pokemon', 'list-pokemons', 'search-pokemon'],
    },
  },
})
