# Context

The context, or the `ctx` prop passed into most listeners and handlers in Fragonard, provides access to the runtime Fragonard instance (or client).

## `client`

`ctx.client` provides access to the Fragonard client.

## `stopPropagation`

Calling `ctx.stopPropagation()` prevents whatever event the listener/handler is handling from being propagated down the chain to other layers.

This layer will finish execution.

## `getLogger(layer: Layer)`

This function returns the [logger](./logger) for the passed in layer.

## `getAPI(layer: Layer)`

This function returns the API exposed by the layer and throws an error if the API doesn't exist on the Fragonard client.

## `safeGetAPI(layer: Layer)`

This function returns the API exposed by the layer and **returns `null`** if the API doesn't exist on the Fragonard client.
