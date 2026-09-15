export function runRules(rules, entity){
    const violations = []

    for(const rule of rules){
        let res
        try{
            res = rule(entity)
        }catch(e){
            res = `Rule "${rule.name || 'unnamed'}" threw an error: ${e.message}`
        }
        if(res){
            violations.push({rule:rule.name, message:res})
        }
    }

    return violations
}