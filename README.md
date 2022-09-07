# logicore-forms

ReactJS-based declarative forms library

# Features:

- definition with simple tree data structure
- automatic validation
- extendable: custom field types and custom validators
- design-agnostic
- cross-field dependencies and complex behaviour using interceptors

```bash
yarn add logicore-forms
```

## Usage

```jsx
import React, { Component } from 'react'

import {
  validateDefinition,
  definitionIsInvalid,
  pathToUpdate,
  FormComponent,
  GenericForm,
  formComponents,
  FieldLabel,
  interceptors,
  fieldsLayouts,
  getByPath,
  setByPath,
  modifyHelper,
} from "../logicore-forms";
import 'logicore-forms/dist/index.css'

const fields = {
  "type": "Fields",
  "fields": [
    {
      "type": "TextField",
      "k": "name",
      "label": "Name",
      "required": true
    },
    {
      "type": "UUIDListField",
      "k": "items",
      "addWhat": "item",
      "layout": "WithDeleteButton",
      "fields": [
        {
          "type": "TextField",
          "k": "name",
          "label": "Item Name",
          "required": true
        },
        {
          "type": "NumberField",
          "k": "count",
          "label": "Count"
        }
      ]
    }
  ]
};

const HelloLogicoreForms = () => {
  const [state, setState] = useState({});
  const [errors, setErrors] = useState({});
  const onReset = (path) => {
    setErrors(update(errors, pathToUpdate(path, { $set: null })), null);
  };

  const onSubmit = (e) => {
    e.preventDefault();
    const errors = validateDefinition(fields, state);
    setErrors(errors, null);
    if (!definitionIsInvalid(fields, errors, state)) {
      // ok
      setLastValue(state);
    } else {
      NotificationManager.error(
        "Please fix the errors below",
        "Error"
      );
      setTimeout(() => {
        try {
          document
            .getElementsByClassName("invalid-feedback d-block")[0]
            .parentNode.scrollIntoViewIfNeeded();
        } catch (e) {
          console.warn(e);
        }
      }, 50);
    }
  };
  return (
    <form onSubmit={onSubmit}>
      <FormComponent
        definition={fields}
        value={state}
        onChange={setState}
        error={errors}
        onReset={onReset}
        path={[]}
      />
      <div className="btn-group my-3">
        <button type="submit" className="btn btn-primary">Submit</button>
        <button type="button" className="btn btn-outline-secondary" onClick={_ => { setState(null); setErrors(null); }}>Reset</button>
      </div>
    </form>
  );
}
```

## License

MIT © [andrewboltachev](https://github.com/andrewboltachev)
