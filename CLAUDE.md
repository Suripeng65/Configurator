# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

**Frontend (Vue 3 + Vite):**
```bash
npm install        # first-time setup
npm run dev        # dev server at http://localhost:8080
npm run build      # production build into dist/
npm run preview    # preview production build locally
```

**Backend (Python/FastAPI):**
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload   # API at http://localhost:8000
# Swagger docs at http://localhost:8000/docs
```

Both must run simultaneously for the app to work. No OpenSSL workaround needed — Vite handles this natively.

## Architecture

This is a JSON configuration editor. Users edit deeply nested UI-template configs (see `src/assets/fda claims 2.txt` for the target structure) through a tree UI, and save them to a Python backend.

### Frontend (Vue 3 + Pinia + Vue Router 4 + Vite)

All components use `<script setup>` Composition API. No Options API.

**Data flow:**
- `src/stores/template.js` — Pinia store (replaces Vuex). Holds the active `template` object. All edits mutate `template.layout` via direct assignment (Vue 3 Proxy reactivity — no `Vue.set` needed). Communicates with backend via axios.
- `src/views/ConfigEditor.vue` — shell: header (TemplateSelector, name input, mode toggle, save/import/copy) + split panes. Calls `store.fetchTemplate(1)` on setup.
- `src/components/TreeNode.vue` — recursive component (self-reference via filename works automatically in Vue 3 SFC). Renders one JSON node; handles expand/collapse, inline key rename (double-click), value editing, add child, delete, array reorder.
- `src/components/ValueEditor.vue` — type-aware inline editor. Emits `change`.
- `src/components/JsonPreview.vue` — syntax-highlighted `<pre>` via `v-html`. Uses an unscoped `<style>` block for span classes.
- `src/components/TemplateSelector.vue` — dropdown to switch between saved datasets (templates).

**Key Pinia store actions in `src/stores/template.js`:**
- `setValue(path, value)` — set any value by path array
- `renameKey(path, newKey)` — rebuilds parent object to preserve key insertion order
- `deleteNode(path)` — delete on objects, splice on arrays
- `addChild(path, key, type)` — push for arrays, direct assignment for objects
- `moveItem(parentPath, fromIndex, toIndex)` — splice-based reorder
- `replaceLayout(layout)` — full layout swap (used by Import)
- `fetchTemplate(id)`, `saveTemplate()`, `createTemplate({name, layout})`, `deleteTemplate(id)` — async API actions

`getAtPath(obj, path)` helper traverses nested objects/arrays via `Array.reduce`.

In components, use the store like:
```js
import { useTemplateStore } from '@/stores/template'
import { storeToRefs } from 'pinia'
const store = useTemplateStore()
const { template, isDirty, mode } = storeToRefs(store)  // reactive state
store.setValue(path, value)  // call actions directly
```

### Backend (Python/FastAPI + SQLite)

- `backend/main.py` — FastAPI app; SQLite DB at `backend/configurator.db` (auto-created).
- Seeds the DB with `src/assets/fda claims 2.txt` on first run if the table is empty.
- REST API: `GET/POST /api/templates`, `GET/PUT/DELETE /api/templates/{id}`.
- `layout` and `attributes` columns stored as JSON strings; deserialized in `row_to_dict()`.
- CORS is open to `http://localhost:8080` (Vite dev server port).

### Template data shape
```json
{
  "id": 1, "uuid": "...", "name": "...", "description": "...",
  "createdBy": "...", "modifiedBy": "...", "created": "ISO", "modified": "ISO",
  "attributes": null,
  "layout": { ... }   ← this is what the tree editor mutates
}
```
