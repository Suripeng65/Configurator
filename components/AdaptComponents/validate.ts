import { ajv, getValidator } from './index'
import { walkLayoutNodes } from './schemaUtils'

// Matches the `Rule` signature in validation/runner.ts: (entity) => string | void.
// Walks every node in the layout tree that has a `component` key and runs it
// against that component's compiled JSON Schema.
export function validComponentSchemas(meta: any): string | void {
  const problems: string[] = []

  walkLayoutNodes(meta?.layout?.viz, (node, path) => {
    const validate = getValidator(node.component)
    if (!validate) return // unregistered component type — not this rule's concern (e.g. GridContainer/TabWrapper/Datasource, which aren't AdaptComponents)

    // Every child gets its own direct visit (and its own precise errors) from
    // this same walk, so validate this node against only its own properties —
    // otherwise a bad child re-triggers here too, but as a wall of "must be
    // equal to constant" noise from every other branch of the `contents`
    // oneOf union that isn't the child's actual type.
    const ownNode = node.contents ? { ...node, contents: [] } : node
    if (!validate(ownNode)) {
      problems.push(`${node.component} at ${path.join('.')}: ${ajv.errorsText(validate.errors, { separator: '; ' })}`)
    }
  })

  if (problems.length) return problems.join('\n')
}
