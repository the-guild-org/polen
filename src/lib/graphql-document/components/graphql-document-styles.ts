/**
 * Minimal styles for GraphQL Document interactive code blocks
 */

export const graphqlDocumentStyles = `
/* Container styles */
.graphql-document {
  position: relative;
}

.graphql-interaction-layer {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.graphql-interaction-layer > * {
  pointer-events: auto;
}

/* Identifier overlay styles */
.graphql-identifier-overlay {
  transition: background-color 0.2s ease;
}

/* Clickable identifiers get visual feedback */
.graphql-identifier-overlay.graphql-clickable {
  /* Subtle underline effect using box-shadow to not affect layout */
  box-shadow: 0 1px 0 0 rgba(var(--accent-9), 0.3);
  transition: box-shadow 0.2s ease, background-color 0.2s ease;
}

.graphql-identifier-overlay.graphql-clickable:hover {
  background-color: rgba(var(--accent-3), 0.5);
  box-shadow: 0 1px 0 0 rgba(var(--accent-9), 0.6);
}

/* Active/open state */
.graphql-identifier-overlay.graphql-tooltip-open {
  background-color: rgba(var(--accent-3), 0.5);
  box-shadow: 0 1px 0 0 var(--accent-9);
}

/* Error state */
.graphql-identifier-overlay.graphql-error {
  box-shadow: 0 1.5px 0 0 var(--red-9);
}

.graphql-identifier-overlay.graphql-error:hover {
  background-color: rgba(var(--red-3), 0.5);
}

/* Deprecated state */
.graphql-identifier-overlay.graphql-deprecated {
  text-decoration: line-through;
  opacity: 0.7;
}

/* Debug mode */
.graphql-identifier-overlay.graphql-debug {
  background-color: rgba(59, 130, 246, 0.1) !important;
  border: 1px solid rgba(59, 130, 246, 0.3) !important;
}

/* Kind-specific colors */
.graphql-identifier-overlay.graphql-type.graphql-clickable {
  box-shadow: 0 1px 0 0 rgba(var(--blue-9), 0.3);
}

.graphql-identifier-overlay.graphql-field.graphql-clickable {
  box-shadow: 0 1px 0 0 rgba(var(--green-9), 0.3);
}

.graphql-identifier-overlay.graphql-argument.graphql-clickable {
  box-shadow: 0 1px 0 0 rgba(var(--orange-9), 0.3);
}

.graphql-identifier-overlay.graphql-variable {
  box-shadow: 0 1px 0 0 rgba(var(--purple-9), 0.3);
}

.graphql-identifier-overlay.graphql-directive.graphql-clickable {
  box-shadow: 0 1px 0 0 rgba(var(--amber-9), 0.3);
}

/* Popover animation */
.graphql-identifier-popover {
  animation: graphql-popover-show 150ms ease-out;
}

@keyframes graphql-popover-show {
  from {
    opacity: 0;
    transform: translateY(2px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Validation errors */
.graphql-validation-errors {
  margin-top: 1rem;
  padding: 0.5rem;
  background-color: var(--red-2);
  border: 1px solid var(--red-6);
  border-radius: 4px;
}

.graphql-error {
  color: var(--red-11);
  font-size: 0.875rem;
  margin: 0.25rem 0;
}

/* Loading state */
.graphql-document.graphql-loading {
  opacity: 0.6;
  pointer-events: none;
}

.graphql-document.graphql-loading::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 20px;
  height: 20px;
  margin: -10px 0 0 -10px;
  border: 2px solid var(--gray-6);
  border-top-color: var(--accent-9);
  border-radius: 50%;
  animation: graphql-spinner 0.8s linear infinite;
}

@keyframes graphql-spinner {
  to {
    transform: rotate(360deg);
  }
}`
