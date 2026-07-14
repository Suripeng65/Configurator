import { createRouter, createWebHistory } from 'vue-router'
import AppLayout from '../views/AppLayout.vue'
import DatasetsView from '../views/DatasetsView.vue'
import VariablesView from '../views/VariablesView.vue'
import VariablesDetailView from '../views/VariablesDetailView.vue'
import UITemplatesView from '../views/UITemplatesView.vue'
import UITemplateEditor from '../views/UITemplateEditor.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: AppLayout,
      children: [
        { path: '', redirect: '/datasets' },
        { path: 'datasets',        name: 'Datasets',            component: DatasetsView },
        { path: 'variables',       name: 'Variables',           component: VariablesView },
        { path: 'variables/:dsId', name: 'VariablesDetail',     component: VariablesDetailView },
        { path: 'uitemplates',     name: 'UITemplates',         component: UITemplatesView },
        {
          path: 'uitemplates/:dsId/layout',
          name: 'UITemplateLayout',
          component: UITemplateEditor,
          meta: { editorSection: 'layout' },
        },
        {
          path: 'uitemplates/:dsId/datasources',
          name: 'UITemplateDatasources',
          component: UITemplateEditor,
          meta: { editorSection: 'datasources' },
        },
        {
          path: 'uitemplates/:dsId/details',
          name: 'UITemplateDetails',
          component: UITemplateEditor,
          meta: { editorSection: 'details' },
        },
        {
          path: 'uitemplates/:dsId/apis',
          name: 'UITemplateAPIs',
          component: UITemplateEditor,
          meta: { editorSection: 'apis' },
        },
        {
          path: 'uitemplates/:dsId/instances',
          name: 'UITemplateInstances',
          component: UITemplateEditor,
          meta: { editorSection: 'instances' },
        },
      ],
    },
  ],
})

export default router
