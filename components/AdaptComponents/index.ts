import Ajv, { type ValidateFunction } from 'ajv'
import type { AdaptComponentSchema } from './types'
import { AdaptComponentBase } from './base'
import LayoutSection          from './LayoutSection'
import AccordionGroup         from './AccordionGroup'
import AggregationAccordion   from './AggregationAccordion'
import BracketList            from './BracketList'
import ContinuousRangeInput   from './ContinuousRangeInput'
import MonitorPanel           from './MonitorPanel'
import FlexDropdown           from './FlexDropdown'
import ModalSelector          from './ModalSelector'
import StratificationToggle   from './StratificationToggle'
import StratificationDropdown from './StratificationDropdown'
import ValidationMessage      from './ValidationMessage'
import BarChart                from './BarChart'
import BulletChartList         from './BulletChart'
import LineChart                from './LineChart'
import StackedAreaChart         from './StackedAreaChart'
import StackedBarChart          from './StackedBarChart'
import PieChart                 from './PieChart'
import DataTable                from './DataTable'
import TreeTable                from './TreeTable'
import HeatMap                  from './HeatMap'
import NodeMap                  from './NodeMap'
import LinkMap                  from './LinkMap'
import DonutChart               from './DonutChart'
import NetworkGraph             from './NetworkGraph'
import ForceDirectedGraph       from './ForceDirectedGraph'
import ScatterplotChart         from './ScatterplotChart'
import TreemapChart             from './TreemapChart'
import TileGridMapChart         from './TileGridMapChart'
import TransformButton        from './TransformButton'
import TabContent             from './TabContent'

export const ADAPT_COMPONENTS: Record<string, AdaptComponentSchema> = {
  // Containers
  LayoutSection,
  AccordionGroup,
  AggregationAccordion,
  MonitorPanel,
  TabContent,
  // Filters
  FlexDropdown,
  ModalSelector,
  StratificationToggle,
  StratificationDropdown,
  BracketList,
  ContinuousRangeInput,
  // Other
  ValidationMessage,
  TransformButton,
  // Charts
  BarChart,
  BulletChartList,
  LineChart,
  StackedAreaChart,
  PieChart,
  ScatterplotChart,
  TreemapChart,
  StackedBarChart,
  TileGridMapChart,
  DataTable,
  TreeTable,
  HeatMap,
  NodeMap,
  LinkMap,
  DonutChart,
  NetworkGraph,
  ForceDirectedGraph,
}

// Recursive union of every registered component, generated from the
// registry above rather than hand-maintained — this is what `contents`
// properties $ref to, so any new component automatically becomes a valid
// child of every container the moment it's added to ADAPT_COMPONENTS.
const AdaptComponentContents = {
  type: 'array',
  items: {
    oneOf: Object.keys(ADAPT_COMPONENTS).map(name => ({ $ref: `#/$defs/${name}` })),
  },
}

const schemaDocument = {
  $id: 'adapt-components',
  $defs: {
    AdaptComponent: AdaptComponentBase,
    AdaptComponentContents,
    ...ADAPT_COMPONENTS,
  },
}

// `strict: false` because component schemas carry `x-catalog` vendor keys
// (editor metadata, not validation keywords).
const ajv = new Ajv({ allErrors: true, strict: false })
ajv.addSchema(schemaDocument)

const validatorCache = new Map<string, ValidateFunction | null>()

export function getValidator(componentName: string): ValidateFunction | null {
  if (!validatorCache.has(componentName)) {
    validatorCache.set(componentName, ajv.getSchema(`adapt-components#/$defs/${componentName}`) ?? null)
  }
  return validatorCache.get(componentName) ?? null
}

export { ajv }
