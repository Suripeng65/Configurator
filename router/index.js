import { createRouter, createWebHashHistory } from 'vue-router'
import AppLayout from '../views/AppLayout.vue'
import DatasetsView from '../views/DatasetsView.vue'
import VariablesView from '../views/VariablesView.vue'
import VariablesDetailView from '../views/VariablesDetailView.vue'
import UITemplatesView from '../views/UITemplatesView.vue'
import UITemplateEditor from '../views/UITemplateEditor.vue'
import DeploymentsView from "@src/views/DeploymentsView.vue";
import DeploymentEditor from "@src/views/DeploymentEditor.vue";
import DatasetsEdit from '@src/views/DatasetsEdit.vue'
import UITemplateContainer from "@src/views/UITemplateContainer.vue";
import LayoutEditor from "@src/views/LayoutEditor.vue";
import DatasourcesList from "@src/views/DatasourcesList.vue";
import DatasourceEditor from "@src/views/DatasourceEditor.vue";

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      component: AppLayout,
      meta: {breadcrumb: 'Home'},
      children: [
        {
          path: '',
          redirect: '/dataset',
        },
        {
          path: 'dataset',
          name: 'Dataset',
          component: DatasetsView,
          meta: {breadcrumb: 'Datasets', model: "Dataset", action: "List"},
          children: [
            {
              path: ':id',
              name: 'Dataset Edit',
              component: DatasetsEdit,
              meta: {breadcrumb: 'Edit', model: "Dataset", action: "Edit"},
            },
            {
              path: 'create',
              name: 'Dataset Create',
              component: DatasetsEdit,
              meta: {breadcrumb: 'Create', model: "Dataset", action: "Create"},
            }
          ]
        },
        {
          path: 'variable',
          name: 'Variable',
          component: VariablesView,
          meta: {breadcrumb: 'Variables', model: "Variable", action: "List"},
          children: [
            {
              path: ':id',
              name: 'Variable Edit',
              component: VariablesDetailView,
              meta: {breadcrumb: 'Edit', model: "Variable", action: "Edit"},
            },
            {
              path: 'create',
              name: 'Variable Create',
              component: VariablesDetailView,
              meta: {breadcrumb: 'Create', model: "Variable", action: "Create"},
            },
          ]
        },
        {
          path: 'uitemplate',
          name: 'UiTemplate',
          component: UITemplatesView,
          meta: {breadcrumb: 'UI Templates', model: "UiTemplate", action: "List"},
          children: [
            {
              path: ':id',
              name: 'UiTemplate Edit',
              component: UITemplateContainer,
              redirect: {name: "UiTemplate Edit Details", model: "UiTemplate", action: "Edit"},
              meta: {
                breadcrumb: 'Edit',
              },
              children: [
                {
                  path: 'details',
                  name: 'UiTemplate Edit Details',
                  component: UITemplateEditor,
                  meta: {
                    breadcrumb: 'Details',
                    editorSection: 'Details'
                  },
                },
                {
                  path: 'layout',
                  name: 'UiTemplate Edit Layout',
                  component: LayoutEditor,
                  meta: {
                    breadcrumb: 'Layout',
                    editorSection: 'Layout'
                  },
                },
                {
                  path: 'datasource',
                  name: 'UiTemplate Edit Datasource',
                  component: DatasourcesList,
                  meta: {
                    breadcrumb: 'Datasources',
                    editorSection: 'Datasource'
                  },
                  children: [{
                    path: 'create',
                    name: 'UiTemplate Edit Datasource Create',
                    component: DatasourceEditor,
                    meta: {
                      breadcrumb: 'Create',
                      editorSection: 'Datasource'
                    },
                  },{
                    path: ':index',
                    name: 'UiTemplate Edit Datasource Edit',
                    component: DatasourceEditor,
                    meta: {
                      breadcrumb: 'Create',
                      editorSection: 'Datasource'
                    },
                  }]
                },
              ]
            },
            {
              path: 'create',
              name: 'UiTemplate Create',
              component: UITemplateContainer,
              // redirect: 'DetailsCreate',
              meta: {
                breadcrumb: 'Create', model: "UiTemplate", action: "Create"
              },
              children: [
                {
                  path: 'details',
                  name: 'UiTemplate Create Details',
                  component: UITemplateEditor,
                  meta: {
                    breadcrumb: 'Details',
                    editorSection: 'Details'
                  },
                },
                {
                  path: 'layout',
                  name: 'UiTemplate Create Layous',
                  component: LayoutEditor,
                  meta: {
                    breadcrumb: 'Layout',
                    editorSection: 'Layout'
                  },
                },
                {
                  path: 'datasource',
                  name: 'UiTemplate Create Datasource',
                  component: DatasourcesList,
                  meta: {
                    breadcrumb: 'Datasource',
                    editorSection: 'Datasource'
                  },
                  children: [{
                    path: 'create',
                    name: 'UiTemplate Create Datasource Create',
                    component: DatasourceEditor,
                    meta: {
                      breadcrumb: 'Create',
                      editorSection: 'Datasource'
                    },
                  },{
                    path: ':index',
                    name: 'UiTemplate Create Datasource Edit',
                    component: DatasourceEditor,
                    meta: {
                      breadcrumb: 'Create',
                      editorSection: 'Datasource'
                    },
                  }]
                },
              ]
            }
          ]
        },
        {
          path: 'deployment',
          name: 'Deployment',
          component: DeploymentsView,
          meta: {breadcrumb: 'Deployments', model: "Deployment", action: "List"},
          children: [
            {
              path: ':id',
              name: 'Deployment Edit',
              component: DeploymentEditor,
              meta: {breadcrumb: 'Details', model: "Deployment", action: "Edit"},
            },
            {
              path: 'create',
              name: 'Deployment Create',
              component: DeploymentEditor,
              meta: {breadcrumb: 'Create', model: "Deployment", action: "Create"},
            },
          ]
        },
      ]
    }
  ]
})

export default router
