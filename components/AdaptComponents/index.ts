import LayoutSection        from './LayoutSection'
import AccordionGroup        from './AccordionGroup'
import AggregationAccordion  from './AggregationAccordion'
import BracketList           from './BracketList'
import ContinuousRangeInput  from './ContinuousRangeInput.ts'
import MonitorPanel          from './MonitorPanel'
import FlexDropdown          from './FlexDropdown'
import ModalSelector         from './ModalSelector'
import StratificationToggle  from './StratificationToggle'
import StratificationDropdown from './StratificationDropdown'
import ValidationMessage     from './ValidationMessage'
import BarChart              from './BarChart'
import BulletChartList       from './BulletChart'
import LineChart             from './LineChart'
import StackedAreaChart      from './StackedAreaChart'
import StackedBarChart       from './StackedBarChart'
import PieChart              from './PieChart'
import DataTable             from './DataTable'
import TreeTable             from './TreeTable'
import HeatMap               from './HeatMap'
import NodeMap               from './NodeMap'
import LinkMap               from './LinkMap'
import DonutChart            from './DonutChart'
import NetworkGraph          from './NetworkGraph'
import ForceDirectedGraph    from './ForceDirectedGraph'
import ScatterplotChart      from './ScatterplotChart'
import TreemapChart          from './TreemapChart'
import TileGridMapChart      from './TileGridMapChart'
import TransformButton       from './TransformButton'
import TabContent            from './TabContent'

export const ADAPT_COMPONENTS = {
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
  ForceDirectedGraph
}