import { createRouter, createWebHistory } from 'vue-router'
import AppLayout from '../views/AppLayout.vue'
import DatasetsView from '../views/DatasetsView.vue'
import VariablesView from '../views/VariablesView.vue'
import VariablesDetailView from '../views/VariablesDetailView.vue'
import UITemplatesView from '../views/UITemplatesView.vue'
import UITemplateEditor from '../views/UITemplateEditor.vue'
import DeploymentsView from "@src/views/DeploymentsView.vue";
import DeploymentEditor from "@src/views/DeploymentEditor.vue";
import DatasetsDetailView from '@src/views/DatasetsDetailView.vue'
import UITemplateContainer from "@src/views/UITemplateContainer.vue";
import LayoutEditor from "@src/views/LayoutEditor.vue";
import DatasourceEditor from "@src/views/DatasourceEditor.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: AppLayout,
      meta: {breadcrumb: 'Home'},
      children: [
        {
          path: '',
          redirect: '/datasets',
        },
        {
          path: 'datasets',
          name: 'Datasets',
          component: DatasetsView,
          meta: {breadcrumb: 'Datasets'},
          children: [
            {
              path: ':id',
              name: 'Datasets Edit',
              component: DatasetsDetailView,
              meta: {breadcrumb: 'Edit'},
            },
            {
              path: 'create',
              name: 'Datasets Create',
              component: DatasetsDetailView,
              meta: {breadcrumb: 'Create'},
            }
          ]
        },
        {
          path: 'variables',
          name: 'Variables',
          component: VariablesView,
          meta: {breadcrumb: 'Variables'},
          children: [
            {
              path: ':id',
              name: 'Variables Edit',
              component: VariablesDetailView,
              meta: {breadcrumb: 'Edit'},
            },
            {
              path: 'create',
              name: 'Variables Create',
              component: VariablesDetailView,
              meta: {breadcrumb: 'Create'},
            },
          ]
        },
        {
          path: 'uitemplates',
          name: 'UITemplates',
          component: UITemplatesView,
          meta: {breadcrumb: 'UI Templates'},
          children: [
            {
              path: ':id',
              name: 'UITemplateEdit',
              component: UITemplateContainer,
              redirect: {name: "DetailsEdit"},
              meta: {
                breadcrumb: 'Edit',
              },
              children: [
                {
                  path: 'details',
                  name: 'DetailsEdit',
                  component: UITemplateEditor,
                  meta: {
                    breadcrumb: 'Details',
                    editorSection: 'Details'
                  },
                },
                {
                  path: 'layout',
                  name: 'LayoutEdit',
                  component: LayoutEditor,
                  meta: {
                    breadcrumb: 'Layout',
                    editorSection: 'Layout'
                  },
                },
                {
                  path: 'datasources',
                  name: 'DatasourcesEdit',
                  component: DatasourceEditor,
                  meta: {
                    breadcrumb: 'Datasources',
                    editorSection: 'Datasources'
                  },
                },
              ]
            },
            {
              path: 'create',
              name: 'UITemplateCreate',
              component: UITemplateContainer,
              redirect: 'DetailsCreate',
              meta: {
                breadcrumb: 'Create',
              },
              children: [
                {
                  path: 'details',
                  name: 'DetailsCreate',
                  component: UITemplateEditor,
                  meta: {
                    breadcrumb: 'Details',
                    editorSection: 'Details'
                  },
                },
                {
                  path: 'layout',
                  name: 'LayoutCreate',
                  component: LayoutEditor,
                  meta: {
                    breadcrumb: 'Layout',
                    editorSection: 'Layout'
                  },
                },
                {
                  path: 'datasources',
                  name: 'DatasourcesCreate',
                  component: DatasourceEditor,
                  meta: {
                    breadcrumb: 'Datasources',
                    editorSection: 'Datasources'
                  },
                },
              ]
            }
          ]
        },
        {
          path: 'deployments',
          name: 'Deployments',
          component: DeploymentsView,
          meta: {breadcrumb: 'Deployments'},
          children: [
            {
              path: ':id',
              name: 'Deployment Details',
              component: DeploymentEditor,
              meta: {breadcrumb: 'Details'},
            },
            {
              path: 'create',
              name: 'Deployment Create',
              component: DeploymentEditor,
              meta: {breadcrumb: 'Create'},
            },
          ]
        },
      ]
    }
  ]
})

export default router
