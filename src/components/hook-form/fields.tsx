import { RHFCode } from './rhf-code';
import { RHFTextField } from './rhf-text-field';
import { RHFRadioGroup } from './rhf-radio-group';
import { RHFSwitch, RHFMultiSwitch } from './rhf-switch';
import { RHFSelect, RHFMultiSelect } from './rhf-select';
import { RHFCheckbox, RHFMultiCheckbox } from './rhf-checkbox';

// ----------------------------------------------------------------------

export const Field = {
  Code: RHFCode,
  Select: RHFSelect,
  Switch: RHFSwitch,
  Text: RHFTextField,
  Checkbox: RHFCheckbox,
  RadioGroup: RHFRadioGroup,
  MultiSelect: RHFMultiSelect,
  MultiSwitch: RHFMultiSwitch,
  MultiCheckbox: RHFMultiCheckbox,
};
