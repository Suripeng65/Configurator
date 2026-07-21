import {
  agDateColumnComparatorFn,
  dateColumnValueFormatter,
} from '../utils/ag-table-util'
import { HiddenRowsStatusBar } from '../components/HiddenRowsStatusBar'
import {
  SideBarDef,
  RowSelectionOptions,
  ColumnMenuTab,
  SortDirection,
  SelectionColumnDef,
  IRowNode,
  IsExternalFilterPresentParams,
} from 'ag-grid-community'
import { Ref } from 'vue'
import { uniq } from 'lodash'

export const TABLE_SELECT_ALL_LIMIT: number = 5000
export const TABLE_ROW_LIMIT: number = 150000
export const PAGINATION_PAGE_SIZE: number = 100

const customNumberFilterParams = {
  buttons: ['reset', 'apply'],
  closeOnApply: true,
  allowedCharPattern: '\\d\\-\\%\\.\\$',
}
export const agGridPaginationConfig = () => {
  return {
    pagination: true,
    paginationPageSize: PAGINATION_PAGE_SIZE,
    paginationPageSizeSelector: uniq([
      PAGINATION_PAGE_SIZE,
      5,
      20,
      50,
      100,
      1000,
    ]).sort((a, b) => a - b),
    cacheBlockSize: PAGINATION_PAGE_SIZE,
  }
}
const filterButtonConfig = {
  buttons: ['reset', 'apply'],
  closeOnApply: true,
}
const agGridDefaultSetFilterConfig = {
  filter: 'agSetColumnFilter',
  filterParams: {
    comparator: (a: number, b: number) => {
      return a - b
    },
  },
}

const agDatePickerFilter = {
  filter: 'agDateColumnFilter',
  filterParams: {
    comparator: agDateColumnComparatorFn,
    valueFormatter: dateColumnValueFormatter,
  },
}

const dollarSignParser = (text: string) => {
  return parseFloat(text.replace('$', ''))
}
const percentParser = (text: string) => {
  return parseFloat(text.replace('%', '')) / 100
}
const agNumberFilter = {
  filter: 'agNumberColumnFilter',
  filterParams: {
    allowedCharPattern: '\\d\\-\\%\\.\\$',
    numberParser: (text: string) => {
      if (text === null) return null
      else if (text.includes('$')) return dollarSignParser(text)
      else if (text.includes('%')) return percentParser(text)
      else return parseFloat(text)
    },
    numberFormatter: (value: null | number) => {
      return value == null ? null : value.toString()
    },
  },
}
const agTextFilter = {
  filter: 'agTextColumnFilter',
  filterParams: {
    debounceMs: 1000, // increased to give rendering more time
  },
}

export const agGridServerFilerConfig = () => {
  return {
    textFilterParams: {
      filters: [{ ...agTextFilter, filterParams: { ...filterButtonConfig } }],
    },
    numberFilterParams: {
      filters: [{ ...agNumberFilter, filterParams: { ...filterButtonConfig } }],
    },
    dateFilterParams: {
      filters: [
        { ...agDatePickerFilter, filterParams: { ...filterButtonConfig } },
      ],
    },
  }
}

export const agGridDefaultStatusBarConfig = () => {
  return {
    components: {
      hiddenRowsStatusBar: HiddenRowsStatusBar,
    },
    statusBar: {
      statusPanels: [
        { statusPanel: 'agTotalRowCountComponent', align: 'left' },
        {
          statusPanel: 'agAggregationComponent',
          statusPanelParams: { aggFuncs: ['avg', 'sum'] },
        },
      ],
    },
  }
}
export const defaultColumnDef = () => {
  return {
    defaultColDef: {
      flex: 1,
      icons: {
        filter:
          '<svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-funnel-fill" fill="currentColor" xmlns="http://www.w3.org/2000/svg">\n' +
          '  <path fill-rule="evenodd" d="M1.5 1.5A.5.5 0 0 1 2 1h12a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.128.334L10 8.692V13.5a.5.5 0 0 1-.342.474l-3 1A.5.5 0 0 1 6 14.5V8.692L1.628 3.834A.5.5 0 0 1 1.5 3.5v-2z"/>\n' +
          '</svg>',
      },
      minWidth: 170,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      cellStyle: { wordBreak: 'normal' },
      sortable: true,
      sortingOrder: ['asc', 'desc', null] as SortDirection[],
      resizable: true,
      wrapText: true,
      menuTabs: ['generalMenuTab'] as ColumnMenuTab[],
      wrapHeaderText: true,
      autoHeaderHeight: true,
      enableValue: true,
      // allow every column to be grouped
      enableRowGroup: true,
      // allow every column to be pivoted
    },
  }
}
export const agGridDefaultConfig = () => {
  return {
    height: '100%',
    width: '100%',
    defaultFilterParams: {
      buttons: ['reset', 'apply'],
      closeOnApply: true,
    },
    textFilterParams: {
      filters: [{ ...agTextFilter }, { ...agGridDefaultSetFilterConfig }],
    },
    numberFilterParams: {
      filters: [{ ...agNumberFilter }, { ...agGridDefaultSetFilterConfig }],
    },
    customNumberFilterParams,
    dateFilterParams: {
      filters: [
        { ...agDatePickerFilter, filterParams: { ...filterButtonConfig } },
      ],
    },

    sideBar: {
      position: 'right',
      toolPanels: [
        {
          id: 'columns',
          labelDefault: 'Columns',
          labelKey: 'columns',
          iconKey: 'columns',
          toolPanel: 'agColumnsToolPanel',
          toolPanelParams: {
            suppressPivotMode: true,
            suppressRowGroups: true,
            suppressValues: true,
          },
        },
        {
          id: 'filters',
          labelDefault: 'Filters',
          labelKey: 'filters',
          iconKey: 'filter',
          toolPanel: 'agFiltersToolPanel',
          toolPanelParams: {},
        },
      ],
      defaultToolPanel: '',
    } as SideBarDef,
    tooltipShowDelay: 500,
    suppressHorizontalScroll: false,
    suppressCsvExport: true,
    suppressExcelExport: true,
  }
}

export const agGridServerSideDefaultConfig = () => {
  const modified = agGridDefaultConfig()
  modified.textFilterParams = {
    filters: [{ ...agTextFilter }],
  }
  modified.numberFilterParams = {
    filters: [{ ...agNumberFilter }],
  }
  return modified
}

export const agGridIconOverrides = () => {
  return {
    icons: {
      filter: '<i class="fa fa-filter"/>',
      columns: '<i class="fa fa-columns"/>',
    },
  }
}
export function getCheckAllThreshold(multiple: number | boolean): number {
  if (typeof multiple === 'number') {
    return Number.isInteger(multiple) ? multiple : TABLE_SELECT_ALL_LIMIT
  }
  return TABLE_SELECT_ALL_LIMIT
}

interface AGGridRowConfigParams {
  multiple: number | boolean
  headerCheckboxOn: boolean
}

export const agGridDefaultRowConfig = () => {
  return {
    suppressCellFocus: true,
    suppressRowTransform: true,
    rowHeight: 40,
    rowStyle: { 'justify-content': 'center' },
    rowSelection: {
      mode: 'multiRow',
      checkboxes: true,
      headerCheckbox: true,
      selectAll: 'filtered',
    } as RowSelectionOptions<any, any>,
  }
}

export const singleRowSelectionConfig = (): RowSelectionOptions<any, any> => {
  return {
    mode: 'singleRow',
    checkboxes: false,
    enableClickSelection: true,
    enableSelectionWithoutKeys: true,
  }
}

export const multiRowSelectionConfig = ({
  multiple,
  headerCheckboxOn,
}: AGGridRowConfigParams): RowSelectionOptions<any, any> => {
  return {
    mode: 'multiRow',
    checkboxes: true,
    headerCheckbox: headerCheckboxOn,
    selectAll: 'filtered',
  } as RowSelectionOptions<any, any>
}

export const agGridRowSelectionConfig = ({
  multiple,
  headerCheckboxOn,
}: AGGridRowConfigParams): RowSelectionOptions<any, any> => {
  return multiple
    ? multiRowSelectionConfig({ multiple, headerCheckboxOn })
    : singleRowSelectionConfig()
}

export const agGridDefaultAutoGroupColumnDef = () => {
  return {
    sort: 'asc',
    filter: 'agMultiColumnFilter',
    filterParams: {
      filters: [
        {
          filter: 'agTextColumnFilter',
        },
        {
          filter: 'agSetColumnFilter',
        },
      ],
    },
    floatingFilter: true,
    cellRendererParams: {
      suppressCount: true,
    },
    suppressColumnsToolPanel: false,
  }
}

interface AgGridTreeTableRowParam {
  multiple: boolean | number
  // rootNodes:number;
}

export const agGridTreeTableRowConfig = ({
  multiple,
}: AgGridTreeTableRowParam) => {
  // const threshold = getCheckAllThreshold(multiple)
  return {
    rowSelection: {
      mode: multiple ? 'multiRow' : 'singleRow',
      groupSelects: 'filteredDescendants',
      selectAll: 'filtered',
      checkboxes: !!multiple,
      headerCheckbox: true,
    },
  }
}
export const agGridSelectionConfig = (
  showOnlySelected: Ref
): {
  selectionColumnDef: SelectionColumnDef
  isExternalFilterPresent: (param?: IsExternalFilterPresentParams) => boolean
  doesExternalFilterPass: (node: IRowNode) => boolean
} => {
  return {
    selectionColumnDef: {
      sortable: true,
      width: 60,
    },
    isExternalFilterPresent: function () {
      // Return true when you want to filter by selection
      return showOnlySelected.value === 'Selected Data Only'
    },
    doesExternalFilterPass: (node: IRowNode) => {
      if (node) {
        switch (node.isSelected()) {
          case true:
          case undefined:
            return true
          case false:
            return false
        }
      }
      return false
    },
  }
}
export default {
  agGridDefaultConfig,
  agGridServerFilerConfig,
  agGridIconOverrides,
  agGridDefaultRowConfig,
  agGridPaginationConfig,
  agGridDefaultAutoGroupColumnDef,
  agGridTreeTableRowConfig,
  agGridSelectionConfig,
}
