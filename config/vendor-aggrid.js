/* eslint-disable import/no-duplicates */
import {
  AllEnterpriseModule,
  LicenseManager,
  ModuleRegistry,
} from 'ag-grid-enterprise'
import { AgChartsCommunityModule } from 'ag-charts-community'
import { provideGlobalGridOptions, ClientSideRowModelModule } from 'ag-grid-community'
import { AgGridVue } from 'ag-grid-vue3'
ModuleRegistry.registerModules([
  AllEnterpriseModule.with(AgChartsCommunityModule),
  ClientSideRowModelModule
])
// Mark all grids as using legacy themes
provideGlobalGridOptions({ theme: 'legacy' })
LicenseManager.setLicenseKey(
  'Using_this_{AG_Grid}_Enterprise_key_{AG-093568}_in_excess_of_the_licence_granted_is_not_permitted___Please_report_misuse_to_legal@ag-grid.com___For_help_with_changing_this_key_please_contact_info@ag-grid.com___{Acumen,_LLC}_is_granted_a_{Single_Application}_Developer_License_for_the_application_{Acumen}_only_for_{3}_Front-End_JavaScript_developers___All_Front-End_JavaScript_developers_working_on_{Acumen}_need_to_be_licensed___{Acumen}_has_been_granted_a_Deployment_License_Add-on_for_{1}_Production_Environment___This_key_works_with_{AG_Grid}_Enterprise_versions_released_before_{15_October_2026}____[v3]_[01]_MTc5MjAxODgwMDAwMA==66b1fde19f22f3cdb7eacb6257928be3'
)

export default function registerAGGrid(app) {
  app.component('AgGridVue', AgGridVue)
}
