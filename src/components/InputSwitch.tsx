import { type ChangeEvent, useCallback, useState } from 'react';

interface Props {
    checked?: boolean;
    id: string;
    name: string;
    labelText: string;
    disabled?: boolean;
    onChange: (value: boolean) => void;
}


export default function InputSwitch({
                                        checked = false,
                                        id,
                                        name,
                                        labelText,
                                        disabled = false,
                                        onChange,
                                    }: Props) {
    const [ isChecked, setIsChecked ] = useState(checked);
    console.log(checked,"status")

    const handleChange = useCallback(
        (event: ChangeEvent<HTMLInputElement>) => {
            const checkedValue = event.target.checked;
            setIsChecked(checkedValue);
            if (onChange) {
                onChange(checkedValue);
            }
        }, [ onChange ]);

    return (
        <label
            htmlFor={id}
            className="flex items-center gap-3 cursor-pointer">
            <input
                type="checkbox"
                className="sr-only peer"
                name={name}
                id={id}
                checked={isChecked}
                disabled={disabled}
                onChange={handleChange}/>

            <span
                className="peer relative h-4 w-7 rounded-[72px] bg-neutral-200 hover:bg-neutral-300 peer-checked:peer-focus:ring-1 peer-checked:peer-focus:ring-green-300 peer-checked:peer-focus:ring-offset-1 peer-disabled:bg-neutral-100 peer-disabled:peer-checked:opacity-50 peer-checked:bg-gradient-to-b peer-checked:from-green-400 peer-checked:to-green-500 after:absolute after:start-[2px] after:top-0.5 after:h-3 after:w-3 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white rtl:peer-checked:after:-translate-x-full"></span>

            <span className="text-sm text-gray-700 font-sans whitespace-nowrap">{labelText}</span>
        </label>
    )
}
