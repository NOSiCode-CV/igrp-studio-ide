interface RulesProps {
    rulesProperties: any;
    componentTag: string;
}
const Rules = ({ rulesProperties }: RulesProps) => {
    const { items } = rulesProperties;
    return (
        <div>
            <h1>Rules</h1>
        </div>
    )
}

export default Rules;