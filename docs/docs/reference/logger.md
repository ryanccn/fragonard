# Logger

Fragonard passes in a logger for layers' use in order to make more unified logging and possible postprocessing.

::: info
It is not required to use the logger. Plain `console.log` also works.
:::

`info`, `warn`, `error`, `success` all accept an indefinite amount of arguments and log them with a colored prefixed output.
