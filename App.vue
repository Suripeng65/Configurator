<template>
  <div id="app">
    <RouterView />
  </div>
</template>

<style>
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  font-size: 13px;
  color: #1a1a1a;
  background: #f0f2f5;
}

#app {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

button {
  cursor: pointer;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  font-family: inherit;
  transition: background 0.15s, opacity 0.15s;
}

button:disabled {
  opacity: 0.45;
  cursor: default;
}

input, select, textarea {
  font-family: inherit;
  font-size: 13px;
  outline: none;
  border-radius: 4px;
}

.btn-primary {
  background: #0066cc;
  color: #fff;
  padding: 6px 14px;
}
.btn-primary:hover:not(:disabled) { background: #0052a3; }

.btn-secondary {
  background: #e8eaed;
  color: #333;
  padding: 6px 14px;
}
.btn-secondary:hover:not(:disabled) { background: #d8dadd; }
</style>
