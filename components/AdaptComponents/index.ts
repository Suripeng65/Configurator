import Ajv, { type ValidateFunction } from 'ajv'
import type { AdaptComponentSchema } from './types'
import { AdaptComponentBase } from './base'
import LayoutSection        from './LayoutSection'
import AccordionGroup        from './AccordionGroup'
import AggregationAccordion  from './AggregationAccordion'
import MonitorPanel          from './MonitorPanel'
import FlexDropdown          from './FlexDropdown'
import ModalSelector         from './ModalSelector'
import BracketList           from './BracketList'
import StratificationToggle  from './StratificationToggle'
import StratificationDropdown from './StratificationDropdown'
import ValidationMessage     from './ValidationMessage'
import BarChart              from './BarChart'
import LineChart             from './LineChart'
import StackedBarChart       from './StackedBarChart'
import StackedAreaChart      from './StackedAreaChart'
import PieChart               from './PieChart'
import DonutChart            from './DonutChart'
import ScatterplotChart      from './ScatterplotChart'
import TreemapChart          from './TreemapChart'
import DataTable             from './DataTable'

export const ADAPT_COMPONENTS: Record<string, AdaptComponentSchema> = {
  // Containers
  LayoutSection,
  AccordionGroup,
  AggregationAccordion,
  MonitorPanel,
  // Filters
  FlexDropdown,
  ModalSelector,
  BracketList,
  StratificationToggle,
  StratificationDropdown,
  // Other
  ValidationMessage,
  // Charts
  BarChart,
  LineChart,
  StackedBarChart,
  StackedAreaChart,
  PieChart,
  DonutChart,
  ScatterplotChart,
  TreemapChart,
  DataTable,
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

// `strict: false` because component schemas carry `x-catalog`/`x-widget`
// vendor keys that are editor metadata, not validation keywords.
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
