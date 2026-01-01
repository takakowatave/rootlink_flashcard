type Props = {
    type: "synonym" | "antonym"; 
};


export const Tag = ({type}: Props) => {
    const base = "px-2 py-1 text-sm font-bold rounded border";
    const styles = {
        synonym: "text-green-600 border-green-600",
        antonym: "text-orange-600 border-orange-600",
        };
        const labels = {
        synonym: "関連語",
        antonym: "対義語",
        };

        return (
        <span data-testid={`tag-${type}`} className={`${base} ${styles[type]}`}>
            {labels[type]}
        </span>

    );
}

export default Tag;
