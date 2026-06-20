import { FC } from "react"
import { Checkbox } from "../ui/checkbox"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
interface InputFieldProps {
  label?: string
  value: any
  onChange?: (v: string) => void
  type?: string
  readOnly?: boolean
  error?: string
  placeHolder?: string,
  checked?: string,
  noFlexCol?: boolean,
  disabled?: boolean
}
const InputField: FC<InputFieldProps> = ({ noFlexCol, label, value, onChange, type = "text", readOnly = false, error, placeHolder, checked, disabled = false }) => {
  return (
    <div className={`flex ${noFlexCol ? "" : 'flex-col'} gap-2`}>
      {label && <Label className="text-card-foreground">{label}</Label>}
      <div className="felx">
        <Input
          type={type}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          readOnly={readOnly}
          placeholder={
            label && placeHolder
              ? `${label} (${placeHolder})`
              : placeHolder || label
          }

          disabled={disabled}
        />
        {checked && <Checkbox>Selectioner</Checkbox>}

        {/* <input type="checkbox" /> */}
      </div>
      {error && <span className="text-red-500 text-sm">{error}</span>}
    </div>
  )
}
export default InputField;