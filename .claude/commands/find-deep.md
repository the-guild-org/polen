# Deep Research

## Goal

- Conduct comprehensive AI-powered research on any topic using exa's deep researcher
- Synthesize findings from multiple sources into a detailed report

## Usage

- `/research <topic>` - Research any topic comprehensively

## Examples

- `/research state management libraries for React in 2025`
- `/research quantum computing breakthroughs 2024`
- `/research AI safety research landscape`

## Instructions

Research topic: "$ARGUMENTS"

1. **Start deep research**:
   - Use exa's deep_researcher_start with the provided topic
   - Choose model based on complexity:
     - Use "exa-research" for most queries (15-45s)
     - Use "exa-research-pro" for very complex topics (45s-2min)

2. **Monitor progress**:
   - Poll with deep_researcher_check every 10 seconds
   - Continue until status is "completed"
   - Show progress updates to user

3. **Present findings**:
   - Format the research report clearly
   - Include key findings and sources
   - Highlight actionable insights
   - Provide summary at the beginning

4. **Follow-up options**:
   - Suggest related searches if applicable
   - Offer to dive deeper into specific aspects
   - Provide links to primary sources
