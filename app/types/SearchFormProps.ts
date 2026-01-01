export type SearchFormProps = {
    input: string;
    onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSearch: () => void;
    error?: string;
    placeholder: string;
    isLoading: boolean;
    formRef: React.RefObject<HTMLFormElement | null>;
    inputRef: React.RefObject<HTMLInputElement | null>;
};