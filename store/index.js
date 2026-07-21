// import Vue from "vue";
// import Vuex from "vuex";
// import axios from "axios";

// Vue.use(Vuex);

// function getAtPath(obj, path) {
//   return path.reduce((acc, k) => (acc != null ? acc[k] : undefined), obj);
// }

// function defaultForType(type) {
//   const map = { string: "", number: 0, boolean: false, null: null, object: {}, array: [] };
//   return map[type] ?? "";
// }

// export default new Vuex.Store({
//   state: {
//     template: null,
//     templateList: [],   // [{id, name, description, modified}]
//     isDirty: false,
//     saveStatus: null,   // null | 'saving' | 'saved' | 'error'
//     fetchError: null,
//     mode: 'dev',        // 'dev' | 'user'
//   },

//   mutations: {
//     SET_TEMPLATE(state, template) {
//       state.template = template;
//       state.isDirty = false;
//       state.saveStatus = null;
//       state.fetchError = null;
//     },
//     SET_FETCH_ERROR(state, msg) {
//       state.fetchError = msg;
//     },
//     SET_SAVE_STATUS(state, status) {
//       state.saveStatus = status;
//     },
//     SET_TEMPLATE_META(state, { name, description }) {
//       if (name !== undefined) Vue.set(state.template, "name", name);
//       if (description !== undefined) Vue.set(state.template, "description", description);
//       state.isDirty = true;
//     },

//     SET_VALUE(state, { path, value }) {
//       if (path.length === 0) {
//         Vue.set(state.template, "layout", value);
//       } else {
//         const parent = getAtPath(state.template.layout, path.slice(0, -1));
//         Vue.set(parent, path[path.length - 1], value);
//       }
//       state.isDirty = true;
//     },

//     // Renames a key while preserving sibling order.
//     RENAME_KEY(state, { path, newKey }) {
//       const oldKey = path[path.length - 1];
//       const parentPath = path.slice(0, -1);
//       const parent =
//         parentPath.length === 0
//           ? state.template.layout
//           : getAtPath(state.template.layout, parentPath);

//       const rebuilt = {};
//       for (const k of Object.keys(parent)) {
//         rebuilt[k === oldKey ? newKey : k] = parent[k];
//       }

//       if (parentPath.length === 0) {
//         Vue.set(state.template, "layout", rebuilt);
//       } else {
//         const grandparent =
//           parentPath.length === 1
//             ? state.template.layout
//             : getAtPath(state.template.layout, parentPath.slice(0, -1));
//         Vue.set(grandparent, parentPath[parentPath.length - 1], rebuilt);
//       }
//       state.isDirty = true;
//     },

//     DELETE_NODE(state, { path }) {
//       const parentPath = path.slice(0, -1);
//       const parent =
//         parentPath.length === 0
//           ? state.template.layout
//           : getAtPath(state.template.layout, parentPath);
//       const key = path[path.length - 1];
//       if (Array.isArray(parent)) {
//         parent.splice(key, 1);
//       } else {
//         Vue.delete(parent, key);
//       }
//       state.isDirty = true;
//     },

//     ADD_CHILD(state, { path, key, type }) {
//       const target =
//         path.length === 0
//           ? state.template.layout
//           : getAtPath(state.template.layout, path);
//       const value = defaultForType(type);
//       if (Array.isArray(target)) {
//         target.push(value);
//       } else {
//         Vue.set(target, key, value);
//       }
//       state.isDirty = true;
//     },

//     MOVE_ITEM(state, { parentPath, fromIndex, toIndex }) {
//       const arr =
//         parentPath.length === 0
//           ? state.template.layout
//           : getAtPath(state.template.layout, parentPath);
//       const item = arr.splice(fromIndex, 1)[0];
//       arr.splice(toIndex, 0, item);
//       state.isDirty = true;
//     },

//     SET_TEMPLATE_LIST(state, list) {
//       state.templateList = list;
//     },

//     SET_MODE(state, mode) {
//       state.mode = mode;
//     },

//     REPLACE_LAYOUT(state, layout) {
//       Vue.set(state.template, "layout", layout);
//       state.isDirty = true;
//     },
//   },

//   actions: {
//     async fetchTemplateList({ commit }) {
//       try {
//         const res = await axios.get(`/templates`);
//         commit("SET_TEMPLATE_LIST", res.data);
//       } catch (e) {
//         // silently ignore — list is best-effort
//       }
//     },

//     async fetchTemplate({ commit, dispatch }, id = 1) {
//       try {
//         const res = await axios.get(`/templates/${id}`);
//         commit("SET_TEMPLATE", res.data);
//         dispatch("fetchTemplateList");
//       } catch (e) {
//         commit(
//           "SET_FETCH_ERROR",
//           "Cannot connect to the backend. Make sure the Python server is running:\n  cd backend && uvicorn main:app --reload"
//         );
//       }
//     },

//     async saveTemplate({ state, commit, dispatch }) {
//       commit("SET_SAVE_STATUS", "saving");
//       try {
//         const t = state.template;
//         const res = await axios.put(`/templates/${t.id}`, {
//           name: t.name,
//           description: t.description,
//           layout: t.layout,
//           modified_by: t.modifiedBy,
//           attributes: t.attributes,
//         });
//         commit("SET_TEMPLATE", res.data);
//         commit("SET_SAVE_STATUS", "saved");
//         setTimeout(() => commit("SET_SAVE_STATUS", null), 2000);
//         dispatch("fetchTemplateList");
//       } catch (e) {
//         commit("SET_SAVE_STATUS", "error");
//       }
//     },

//     async createTemplate({ commit, dispatch }, { name, description, layout }) {
//       const res = await axios.post(`/templates`, { name, description, layout });
//       commit("SET_TEMPLATE", res.data);
//       dispatch("fetchTemplateList");
//     },

//     async deleteTemplate({ state, commit, dispatch }, id) {
//       await axios.delete(`/templates/${id}`);
//       const remaining = state.templateList.filter(t => t.id !== id);
//       commit("SET_TEMPLATE_LIST", remaining);
//       if (state.template?.id === id) {
//         if (remaining.length > 0) {
//           dispatch("fetchTemplate", remaining[0].id);
//         } else {
//           commit("SET_TEMPLATE", null);
//         }
//       }
//     },
//   },
// });
